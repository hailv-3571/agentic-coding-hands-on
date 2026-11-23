import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { UserRoleService } from "@/features/admin-users/server/user-role-service";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { roleOf, setRoles, waitForLockWaiters, withAdminRowsLocked } from "./admin-users-fixtures";

const envAdmins = vi.hoisted(() => ({ extra: [] as string[] }));
vi.mock("@/shared/config/env", async (original) => {
  const real = await original<{ env: { ADMIN_EMAILS: readonly string[] } }>();
  return { env: { ...real.env, get ADMIN_EMAILS() { return [...real.env.ADMIN_EMAILS, ...envAdmins.extra]; } } };
});

/**
 * UserRoleService (A3, FR-001/002/404/406, BR-001/002, SM-001) on the local Supabase stack. Guards that
 * do not depend on how many admins the shared database holds: promote + audit, idempotent repeat
 * (BR-001, no audit overwrite), self-demotion 403, env admin 409, unknown user 404, an actor who is no
 * longer an admin (403, no write), and the two "concurrent" cases driven through a held admin-row lock
 * (the calls really queue behind it, then race): same promotion twice → one write by the first
 * writer; actor demoted while waiting → FORBIDDEN. The last-admin cases live in
 * user-role-concurrency.test.ts (they need exactly one or two admins in the database).
 */
let alice: Sunner, bob: Sunner, carol: Sunner, envAdmin: Sunner, member: Sunner;

beforeAll(async () => {
  [alice, bob, carol, envAdmin, member] = await Promise.all(
    ["role-alice", "role-bob", "role-carol", "role-env", "role-member"].map((prefix) => createSunner(prefix, `${prefix} name`)),
  );
  // The env schema lower-cases ADMIN_EMAILS; the profile keeps whatever case the account was created with.
  envAdmins.extra = [envAdmin.email.toLowerCase()];
  await testSql`update public.profiles set email = upper(email) where id = ${envAdmin.id}`;
});
beforeEach(async () => {
  await setRoles([alice.id, bob.id, envAdmin.id], "admin");
  await setRoles([carol.id, member.id], "user");
});
afterAll(async () => {
  await cleanupSunners([alice, bob, carol, envAdmin, member]);
  await closeAppDb();
});

const setRole = (actor: Sunner, target: Sunner | string, role: "admin" | "user") =>
  UserRoleService.setRole({ actorId: actor.id, userId: typeof target === "string" ? target : target.id, role });

describe("UserRoleService.setRole — guards", () => {
  it("promotes a user and records who and when (FR-002)", async () => {
    expect(await setRole(alice, carol, "admin")).toEqual({ ok: true, id: carol.id, role: "admin" });
    const after = await roleOf(carol.id);
    expect(after).toMatchObject({ role: "admin", role_updated_by: alice.id });
    expect(after.role_updated_at).not.toBeNull();
  });

  it("answers a repeat with the current role and keeps the first audit (BR-001)", async () => {
    await setRole(alice, carol, "admin");
    const first = await roleOf(carol.id);
    expect(await setRole(bob, carol, "admin")).toEqual({ ok: true, id: carol.id, role: "admin" });
    expect(await roleOf(carol.id)).toEqual(first);
    expect(await setRole(bob, member, "user")).toEqual({ ok: true, id: member.id, role: "user" });
    expect(await roleOf(member.id)).toEqual({ role: "user", role_updated_by: null, role_updated_at: null });
  });

  it("demotes another admin while other admins remain", async () => {
    expect(await setRole(alice, bob, "user")).toEqual({ ok: true, id: bob.id, role: "user" });
    expect(await roleOf(bob.id)).toMatchObject({ role: "user", role_updated_by: alice.id });
  });

  it("refuses self-demotion with SELF_DEMOTE even with other admins, writing nothing (BR-002)", async () => {
    expect(await setRole(alice, alice, "user")).toEqual({ ok: false, error: "SELF_DEMOTE" });
    expect(await roleOf(alice.id)).toEqual({ role: "admin", role_updated_by: null, role_updated_at: null });
  });

  it("refuses to demote an ADMIN_EMAILS admin with ENV_ADMIN (case-insensitive), writing nothing", async () => {
    expect(await setRole(alice, envAdmin, "user")).toEqual({ ok: false, error: "ENV_ADMIN" });
    expect(await roleOf(envAdmin.id)).toEqual({ role: "admin", role_updated_by: null, role_updated_at: null });
  });

  it("answers NOT_FOUND for an unknown profile", async () => {
    expect(await setRole(alice, "00000000-0000-4000-8000-000000000000", "admin")).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("refuses an actor who is no longer an admin with FORBIDDEN, writing nothing", async () => {
    expect(await setRole(member, carol, "admin")).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(await setRole(member, bob, "user")).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(await roleOf(carol.id)).toMatchObject({ role: "user", role_updated_by: null });
    expect(await roleOf(bob.id)).toMatchObject({ role: "admin", role_updated_by: null });
  });
});

describe("UserRoleService.setRole — concurrent calls", () => {
  it("two admins promoting the same user: both ok, one write, audited to the first writer (FR-406)", async () => {
    let results: unknown[] = [];
    await withAdminRowsLocked(async () => {
      const first = setRole(alice, carol, "admin");
      await waitForLockWaiters(1);
      const second = setRole(bob, carol, "admin");
      await waitForLockWaiters(2);
      results = [first, second];
    });
    expect(await Promise.all(results)).toEqual([
      { ok: true, id: carol.id, role: "admin" },
      { ok: true, id: carol.id, role: "admin" },
    ]);
    expect(await roleOf(carol.id)).toMatchObject({ role: "admin", role_updated_by: alice.id });
  });

  it("an actor demoted while its change waits on the lock gets FORBIDDEN and writes nothing", async () => {
    let pending: Promise<unknown> = Promise.resolve();
    await withAdminRowsLocked(
      async () => {
        pending = setRole(bob, carol, "admin");
        await waitForLockWaiters(1);
      },
      (lockTx) => lockTx`update public.profiles set role = 'user' where id = ${bob.id}`,
    );
    expect(await pending).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(await roleOf(carol.id)).toMatchObject({ role: "user", role_updated_by: null });
  });
});
