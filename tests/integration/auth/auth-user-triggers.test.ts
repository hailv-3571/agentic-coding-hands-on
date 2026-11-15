import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { env } from "@/shared/config/env";
import type { DbTx } from "@/shared/db/client";
import { profiles } from "@/shared/db/schema";
import { testDb, testSql, withRollback } from "../../setup/integration-db";
import { createAnonClient, createAuthUser, deleteAuthUsers, TEST_PASSWORD, uniqueEmail } from "./auth-test-users";

/**
 * SC-001 / SC-002 on the local stack: the domain gate (before_user_created hook + BEFORE
 * trigger) and profile creation (AFTER trigger). Direct inserts into auth.users bypass the
 * Auth API and its hook, so they exercise the triggers on their own.
 */
const createdUserIds = new Set<string>();
afterAll(() => deleteAuthUsers(createdUserIds));

const insertAuthUser = (email: string, metadata: Record<string, unknown> = {}) =>
  sql`insert into auth.users (id, email, raw_user_meta_data) values (${randomUUID()}, ${email}, ${JSON.stringify(metadata)}::jsonb) returning id`;

/**
 * A row that predates the domain gate (e.g. a dashboard-created account). The test role cannot
 * disable the gate, so the row goes in as a Sunner and a test-only BEFORE INSERT trigger, which
 * fires after the gate (name order), swaps in the foreign email. All of it is rolled back.
 */
async function insertPreGateForeignUser(tx: DbTx, foreignEmail: string): Promise<string> {
  await tx.execute(sql`create function public.zz_test_pre_gate_email() returns trigger language plpgsql
    as $$ begin NEW.email := NEW.raw_user_meta_data ->> 'pre_gate_email'; return NEW; end $$`);
  await tx.execute(sql`create trigger zz_test_pre_gate_email before insert on auth.users
    for each row execute function public.zz_test_pre_gate_email()`);
  const [user] = await tx.execute<{ id: string }>(insertAuthUser(uniqueEmail("pre-gate"), { pre_gate_email: foreignEmail }));
  return user.id;
}

describe("auth.users domain gate (BR-001, FR-601)", () => {
  it("rejects a foreign-domain sign-up through the Auth API with domain_not_allowed and creates nothing", async () => {
    const email = uniqueEmail("outsider", "gmail.com");
    const { data, error } = await createAnonClient().auth.signUp({ email, password: TEST_PASSWORD });
    expect(data.user).toBeNull();
    expect(error?.message).toBe("domain_not_allowed");
    const rows = await testSql`select 1 from auth.users where email = ${email}`;
    expect(rows.length).toBe(0);
  });

  it.each([
    ["gmail.com", "someone@gmail.com"],
    ["sub-domain", "someone@evil.sun-asterisk.com"],
    ["suffix look-alike", "someone@sun-asterisk.com.evil.io"],
  ])("blocks a direct auth.users insert for a %s email (trigger hard stop)", async (_label, email) => {
    const attempt = withRollback((tx) => tx.execute(insertAuthUser(email)));
    await expect(attempt).rejects.toMatchObject({
      cause: expect.objectContaining({ message: "domain_not_allowed" }),
    });
  });

  it("blocks changing an existing Sunner's auth email to a foreign domain", async () => {
    const attempt = withRollback(async (tx) => {
      const [user] = await tx.execute<{ id: string }>(insertAuthUser(uniqueEmail("mover")));
      await tx.execute(sql`update auth.users set email = 'mover@gmail.com' where id = ${user.id}`);
    });
    await expect(attempt).rejects.toMatchObject({
      cause: expect.objectContaining({ message: "domain_not_allowed" }),
    });
  });

  it("lets a pre-gate non-Sunner row be updated when its email stays the same (db recheck warning)", async () => {
    const row = await withRollback(async (tx) => {
      const id = await insertPreGateForeignUser(tx, "pre-gate.admin@gmail.com");
      // GoTrue rewrites every column on sign-in, the unchanged email included.
      await tx.execute(sql`update auth.users set email = email, last_sign_in_at = now() where id = ${id}`);
      const [user] = await tx.execute<{ email: string; signed_in: boolean }>(
        sql`select email, last_sign_in_at is not null as signed_in from auth.users where id = ${id}`,
      );
      return user;
    });
    expect(row).toEqual({ email: "pre-gate.admin@gmail.com", signed_in: true });
  });

  it("still blocks moving a pre-gate non-Sunner row to another foreign address", async () => {
    const attempt = withRollback(async (tx) => {
      const id = await insertPreGateForeignUser(tx, "pre-gate.admin@gmail.com");
      await tx.execute(sql`update auth.users set email = 'elsewhere@gmail.com' where id = ${id}`);
    });
    await expect(attempt).rejects.toMatchObject({
      cause: expect.objectContaining({ message: "domain_not_allowed" }),
    });
  });

  it("uses the same domain literal as env ALLOWED_EMAIL_DOMAIN (hd hint)", async () => {
    const [row] = await testSql<{ allowed: boolean; foreign: boolean }[]>`
      select public.is_sunner_email(${`probe@${env.ALLOWED_EMAIL_DOMAIN}`}) as allowed,
             public.is_sunner_email('probe@example.com') as foreign`;
    expect(row).toEqual({ allowed: true, foreign: false });
  });

  it("keeps the gate functions out of reach of the client roles", async () => {
    const rows = await testSql<{ role: string; fn: string; can_execute: boolean }[]>`
      select r.role, f.fn, has_function_privilege(r.role, f.fn, 'execute') as can_execute
      from (values ('anon'), ('authenticated')) as r(role)
      cross join (values ('public.before_user_created_hook(jsonb)'), ('public.is_sunner_email(text)'),
                         ('public.reject_foreign_domain()'), ('public.create_sunner_profile()'),
                         ('public.sync_profile_email()')) as f(fn)`;
    expect(rows.filter((row) => row.can_execute)).toEqual([]);
  });
});

describe("profile creation on first sign-in (FR-001, FR-401, BR-002, BR-004)", () => {
  it("creates exactly one user-role profile from Google metadata via the Auth API", async () => {
    const email = uniqueEmail("first");
    const user = await createAuthUser(email, { full_name: "Nguyễn Văn A", avatar_url: "https://lh3/a.png" });
    createdUserIds.add(user.id);
    const rows = await testDb.select().from(profiles).where(eq(profiles.id, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email,
      fullName: "Nguyễn Văn A",
      avatarUrl: "https://lh3/a.png",
      departmentId: null,
      role: "user",
      lastLoginAt: null,
    });
  });

  it("falls back to name/picture keys, then to the email local part and a null avatar", async () => {
    const result = await withRollback(async (tx) => {
      const [withAltKeys] = await tx.execute<{ id: string }>(
        insertAuthUser("Alt.Keys@Sun-Asterisk.com", { name: "Alt Keys", picture: "https://lh3/p.png" }),
      );
      const [bare] = await tx.execute<{ id: string }>(insertAuthUser("bare.user@sun-asterisk.com", { name: "  " }));
      return tx
        .select({ email: profiles.email, fullName: profiles.fullName, avatarUrl: profiles.avatarUrl })
        .from(profiles)
        .where(sql`${profiles.id} in (${withAltKeys.id}, ${bare.id})`)
        .orderBy(profiles.email);
    });
    expect(result).toEqual([
      { email: "alt.keys@sun-asterisk.com", fullName: "Alt Keys", avatarUrl: "https://lh3/p.png" },
      { email: "bare.user@sun-asterisk.com", fullName: "bare.user", avatarUrl: null },
    ]);
  });

  it("keeps the first-login name and avatar when Google metadata changes later (D005)", async () => {
    const rows = await withRollback(async (tx) => {
      const [user] = await tx.execute<{ id: string }>(insertAuthUser(uniqueEmail("stable"), { full_name: "First Name" }));
      await tx.execute(
        sql`update auth.users set raw_user_meta_data = '{"full_name":"Renamed"}'::jsonb where id = ${user.id}`,
      );
      return tx.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, user.id));
    });
    expect(rows).toEqual([{ fullName: "First Name" }]);
  });

  it("is idempotent when profile creation fires again for the same user (ON CONFLICT, BR-004)", async () => {
    const rows = await withRollback(async (tx) => {
      // The D005 failure mode: a trigger that also runs on metadata UPDATE. Re-firing
      // create_sunner_profile() must neither fail (PK violation) nor overwrite the first row.
      await tx.execute(sql`create trigger zz_refire_create_sunner_profile after update on auth.users
        for each row execute function public.create_sunner_profile()`);
      const [user] = await tx.execute<{ id: string }>(insertAuthUser(uniqueEmail("refire"), { full_name: "First Name" }));
      await tx.execute(
        sql`update auth.users set raw_user_meta_data = '{"full_name":"Renamed"}'::jsonb where id = ${user.id}`,
      );
      return tx.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, user.id));
    });
    expect(rows).toEqual([{ fullName: "First Name" }]);
  });

  it("follows an auth email change into the profile and frees the old address (db W2)", async () => {
    const [oldEmail, newEmail] = [uniqueEmail("before"), uniqueEmail("after")];
    const result = await withRollback(async (tx) => {
      const [user] = await tx.execute<{ id: string }>(insertAuthUser(oldEmail));
      await tx.execute(sql`update auth.users set email = ${newEmail.toUpperCase()} where id = ${user.id}`);
      // A later sign-up with the old address must not hit profiles_email_unique.
      const [newcomer] = await tx.execute<{ id: string }>(insertAuthUser(oldEmail));
      return tx
        .select({ id: profiles.id, email: profiles.email })
        .from(profiles)
        .where(sql`${profiles.id} in (${user.id}, ${newcomer.id})`)
        .then((rows) => ({ rows, userId: user.id, newcomerId: newcomer.id }));
    });
    expect(result.rows).toHaveLength(2);
    expect(result.rows).toEqual(
      expect.arrayContaining([
        { id: result.userId, email: newEmail },
        { id: result.newcomerId, email: oldEmail },
      ]),
    );
  });

  it("deletes the profile together with its auth user (FK on delete cascade)", async () => {
    const user = await createAuthUser(uniqueEmail("cascade"));
    await deleteAuthUsers([user.id]);
    const rows = await testDb.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, user.id));
    expect(rows).toEqual([]);
  });
});
