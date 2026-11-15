import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { departments } from "@/shared/db/schema";
import { testDb, testSql, withRollback } from "../../setup/integration-db";

/**
 * System-wide guard for C-20: every table in `public` has RLS enabled and there is no
 * policy that `anon` / `authenticated` (or PUBLIC, which includes them) could use.
 * Runs against every future table automatically.
 */
describe("RLS baseline (C-20)", () => {
  it("covers at least the foundation tables", async () => {
    const rows = await testSql<{ relname: string }[]>`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')`;
    expect(rows.map((r) => r.relname)).toEqual(
      expect.arrayContaining(["departments", "hashtags", "domain_event_outbox"]),
    );
  });

  it("enables row level security on every public table", async () => {
    const withoutRls = await testSql<{ relname: string }[]>`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
      order by c.relname`;
    expect(withoutRls.map((r) => r.relname)).toEqual([]);
  });

  it("has no public-schema policy usable by client roles", async () => {
    const clientPolicies = await testSql<{ tablename: string; policyname: string }[]>`
      select tablename, policyname from pg_policies
      where schemaname = 'public'
        and roles && array['anon', 'authenticated', 'public']::name[]
      order by tablename, policyname`;
    expect(clientPolicies).toEqual([]);
  });

  it("grants no privileges on existing public tables to anon / authenticated", async () => {
    const grants = await testSql<{ relname: string; rolname: string }[]>`
      select c.relname, r.rolname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join (values ('anon'), ('authenticated')) as r(rolname)
      where n.nspname = 'public' and c.relkind in ('r', 'p')
        and has_table_privilege(r.rolname, c.oid, 'select,insert,update,delete,truncate,references,trigger')
      order by c.relname, r.rolname`;
    expect(grants).toEqual([]);
  });

  it("does not expose a future table that forgets RLS to anon / authenticated", async () => {
    const privileges = await withRollback(async (tx) => {
      await tx.execute(sql`create table public.rls_probe_future (id int)`);
      return tx.execute<{ role: string; can_select: boolean; can_insert: boolean }>(sql`
        select r.role,
               has_table_privilege(r.role, 'public.rls_probe_future', 'select') as can_select,
               has_table_privilege(r.role, 'public.rls_probe_future', 'insert') as can_insert
        from (values ('anon'), ('authenticated')) as r(role)`);
    });
    expect(privileges.map((p) => [p.role, p.can_select, p.can_insert])).toEqual([
      ["anon", false, false],
      ["authenticated", false, false],
    ]);
  });

  it("denies the anon role outright on a public table", async () => {
    const attempt = withRollback(async (tx) => {
      await tx.execute(sql`set local role anon`);
      return tx.select({ code: departments.code }).from(departments);
    });
    // drizzle wraps the driver error; the Postgres message is on `cause`.
    await expect(attempt).rejects.toMatchObject({
      cause: expect.objectContaining({ message: expect.stringContaining("permission denied") }),
    });
  });

  it("still returns no rows to anon if a table grant is ever added (RLS without policy)", async () => {
    const visibleToAnon = await withRollback(async (tx) => {
      await tx
        .insert(departments)
        .values({ code: "RLS-PROBE", nameVi: "probe", nameEn: "probe" });
      await tx.execute(sql`grant select on departments to anon`);
      await tx.execute(sql`set local role anon`);
      return tx.select({ code: departments.code }).from(departments);
    });
    expect(visibleToAnon).toEqual([]);
    // The probe row was rolled back.
    const leftovers = await testDb.execute(
      sql`select 1 from departments where code = 'RLS-PROBE'`,
    );
    expect(leftovers.length).toBe(0);
  });

  it("has no storage.objects policy for client roles that could reach kudo-images", async () => {
    // The bucket is private only while no such policy exists. A policy that never mentions
    // a bucket_id covers every bucket (kudo-images included), so it counts too.
    const exposing = await testSql<{ policyname: string; cmd: string }[]>`
      select policyname, cmd from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
        and roles && array['anon', 'authenticated', 'public']::name[]
        and (
          coalesce(qual, '') || coalesce(with_check, '') like '%kudo-images%'
          or coalesce(qual, '') || coalesce(with_check, '') not like '%bucket_id%'
        )
      order by policyname`;
    expect(exposing).toEqual([]);
  });
});
