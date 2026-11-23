import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Migration 0022_profiles_role_audit (phase 14, FR-002): nullable `role_updated_by` (uuid → profiles,
 * ON DELETE SET NULL) and `role_updated_at` (timestamptz), additive only (RLS untouched), journal
 * applied, and down → up inside a transaction that is always rolled back (DDL is transactional).
 */
const TAG = "0022_profiles_role_audit";
const statementsOf = (file: string) =>
  readFileSync(`db/migrations/${file}`, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);
type Tx = Parameters<Parameters<typeof withRollback>[0]>[0];
const auditColumns = async (tx: Tx) =>
  (
    await tx.execute<{ name: string }>(sql`
      select column_name as name from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name like 'role_updated_%' order by 1`)
  ).map((row) => row.name);

let target: Sunner;
let actor: Sunner;
beforeAll(async () => {
  [target, actor] = await Promise.all([createSunner("mig14-target", "Mig14 Target"), createSunner("mig14-actor", "Mig14 Actor")]);
});
afterAll(async () => cleanupSunners([target, actor]));

describe("profiles role audit columns", () => {
  it("adds nullable role_updated_by (uuid → profiles, ON DELETE SET NULL) and role_updated_at (timestamptz)", async () => {
    const columns = await testSql<{ column_name: string; data_type: string; is_nullable: string }[]>`
      select column_name, data_type, is_nullable from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name like 'role_updated_%' order by 1`;
    expect(columns).toEqual([
      { column_name: "role_updated_at", data_type: "timestamp with time zone", is_nullable: "YES" },
      { column_name: "role_updated_by", data_type: "uuid", is_nullable: "YES" },
    ]);
    const [fk] = await testSql<{ target: string; on_delete: string }[]>`
      select confrelid::regclass::text as target, confdeltype::text as on_delete from pg_constraint
      where conrelid = 'public.profiles'::regclass and contype = 'f'
        and conkey = array[(select attnum from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'role_updated_by')]`;
    expect(fk).toEqual({ target: "profiles", on_delete: "n" });
  });

  it("keeps RLS on profiles with no client policy (C-20)", async () => {
    const [table] = await testSql<{ rls: boolean }[]>`select relrowsecurity as rls from pg_class where oid = 'public.profiles'::regclass`;
    const policies = await testSql`select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'`;
    expect(table.rls).toBe(true);
    expect(policies).toHaveLength(0);
  });

  it("leaves profiles unaudited by default and clears role_updated_by when the acting admin is deleted", async () => {
    const row = await withRollback(async (tx) => {
      const [fresh] = await tx.execute<{ by: string | null; at: string | null }>(sql`
        select role_updated_by as by, role_updated_at as at from public.profiles where id = ${target.id}`);
      await tx.execute(sql`
        update public.profiles set role = 'admin', role_updated_by = ${actor.id}, role_updated_at = now() where id = ${target.id}`);
      await tx.execute(sql`delete from public.profiles where id = ${actor.id}`);
      const [after] = await tx.execute<{ by: string | null; has_time: boolean; role: string }>(sql`
        select role_updated_by as by, role_updated_at is not null as has_time, role::text as role from public.profiles where id = ${target.id}`);
      return { fresh, after };
    });
    expect(row).toEqual({ fresh: { by: null, at: null }, after: { by: null, has_time: true, role: "admin" } });
  });
});

describe("migration 0022", () => {
  it("is a journal entry that drizzle-kit migrate has applied", async () => {
    const journal = JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as {
      entries: { tag: string; when: number }[];
    };
    const when = journal.entries.find((entry) => entry.tag === TAG)?.when ?? -1;
    const [row] = await testSql<{ count: number }[]>`
      select count(*)::int as count from drizzle.__drizzle_migrations where created_at = ${when}`;
    expect(row.count).toBe(1);
  });

  it("rolls down and back up cleanly, keeping roles and rows", async () => {
    const result = await withRollback(async (tx) => {
      await tx.execute(sql`update public.profiles set role = 'admin', role_updated_by = ${actor.id}, role_updated_at = now() where id = ${target.id}`);
      for (const statement of statementsOf(`${TAG}.down.sql`)) await tx.execute(sql.raw(statement));
      const afterDown = await auditColumns(tx);
      for (const statement of statementsOf(`${TAG}.sql`)) await tx.execute(sql.raw(statement));
      const afterUp = await auditColumns(tx);
      const [kept] = await tx.execute<{ role: string }>(sql`select role::text as role from public.profiles where id = ${target.id}`);
      return { afterDown, afterUp, role: kept.role };
    });
    expect(result).toEqual({ afterDown: [], afterUp: ["role_updated_at", "role_updated_by"], role: "admin" });
  });
});
