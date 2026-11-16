import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Migrations 0010_kudo_hearts, 0011_campaigns, 0012_campaigns_no_overlap_exclude (phase 06):
 * tables, constraints, RLS without client access, journal applied, and down → up inside a
 * transaction that is always rolled back (DDL is transactional in Postgres).
 */
const TAGS = ["0010_kudo_hearts", "0011_campaigns", "0012_campaigns_no_overlap_exclude"];
const statementsOf = (file: string) =>
  readFileSync(`db/migrations/${file}`, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);
const violates = (constraint: string) => ({ cause: expect.objectContaining({ constraint_name: constraint }) });
const tablesPresent = (tx: Parameters<Parameters<typeof withRollback>[0]>[0]) =>
  tx.execute<{ name: string }>(sql`
    select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('kudo_hearts', 'campaigns') order by 1`);

let sender: Sunner;
let fan: Sunner;
beforeAll(async () => {
  [sender, fan] = await Promise.all([createSunner("mig6-sender", "Mig Sender"), createSunner("mig6-fan", "Mig Fan")]);
});
afterAll(async () => cleanupSunners([sender, fan]));

describe("kudo_hearts and campaigns schema", () => {
  it("creates both tables with RLS on, no policy and no client privileges", async () => {
    const rows = await testSql<{ relname: string; rls: boolean; client_grant: boolean; policies: number }[]>`
      select c.relname, c.relrowsecurity as rls,
             has_table_privilege('anon', c.oid, 'select,insert,update,delete')
             or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete') as client_grant,
             (select count(*)::int from pg_policies p where p.tablename = c.relname) as policies
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ('kudo_hearts', 'campaigns') order by c.relname`;
    expect(rows).toEqual([
      { relname: "campaigns", rls: true, client_grant: false, policies: 0 },
      { relname: "kudo_hearts", rls: true, client_grant: false, policies: 0 },
    ]);
  });

  it("allows one heart per (kudo, user), multiplier >= 1, and cascades with the kudo", async () => {
    const outcome = await withRollback(async (tx) => {
      const [kudo] = await tx.execute<{ id: string }>(sql`
        insert into public.kudos (sender_id, recipient_id, body) values (${sender.id}, ${fan.id}, 'x') returning id`);
      const [heart] = await tx.execute<{ multiplier: number }>(sql`
        insert into public.kudo_hearts (kudo_id, user_id) values (${kudo.id}, ${fan.id}) returning multiplier`);
      const again = await tx.execute(sql`
        insert into public.kudo_hearts (kudo_id, user_id) values (${kudo.id}, ${fan.id}) on conflict do nothing returning id`);
      await tx.execute(sql`delete from public.kudos where id = ${kudo.id}`);
      const left = await tx.execute(sql`select 1 from public.kudo_hearts where kudo_id = ${kudo.id}`);
      return { multiplier: heart.multiplier, again: again.length, left: left.length };
    });
    expect(outcome).toEqual({ multiplier: 1, again: 0, left: 0 });

    const zeroMultiplier = withRollback(async (tx) => {
      const [kudo] = await tx.execute<{ id: string }>(sql`
        insert into public.kudos (sender_id, recipient_id, body) values (${sender.id}, ${fan.id}, 'x') returning id`);
      await tx.execute(sql`insert into public.kudo_hearts (kudo_id, user_id, multiplier) values (${kudo.id}, ${fan.id}, 0)`);
    });
    await expect(zeroMultiplier).rejects.toMatchObject(violates("kudo_hearts_multiplier_positive"));
  });

  it("indexes kudo_hearts by user_id (the unique constraint covers kudo_id)", async () => {
    const rows = await testSql<{ indexname: string; indexdef: string }[]>`
      select indexname, indexdef from pg_indexes where tablename = 'kudo_hearts' order by indexname`;
    expect(rows.map((row) => row.indexdef.slice(row.indexdef.indexOf("USING")))).toEqual([
      "USING btree (kudo_id, user_id)",
      "USING btree (id)",
      "USING btree (user_id)",
    ]);
  });

  it("rejects end <= start and overlapping windows (23P01), but accepts [a,b) then [b,c)", async () => {
    const insert = (startsAt: string, endsAt: string) =>
      sql`insert into public.campaigns (name, starts_at, ends_at) values ('probe', ${startsAt}, ${endsAt})`;
    const adjacent = await withRollback(async (tx) => {
      await tx.execute(insert("2301-01-01T00:00:00Z", "2301-01-02T00:00:00Z"));
      await tx.execute(insert("2301-01-02T00:00:00Z", "2301-01-03T00:00:00Z"));
      return (await tx.execute(sql`select 1 from public.campaigns where name = 'probe'`)).length;
    });
    expect(adjacent).toBe(2);
    const overlapping = withRollback(async (tx) => {
      await tx.execute(insert("2301-01-01T00:00:00Z", "2301-01-02T00:00:00Z"));
      await tx.execute(insert("2301-01-01T23:59:00Z", "2301-01-03T00:00:00Z"));
    });
    await expect(overlapping).rejects.toMatchObject({ cause: expect.objectContaining({ code: "23P01" }) });
    await expect(withRollback((tx) => tx.execute(insert("2301-01-02T00:00:00Z", "2301-01-02T00:00:00Z")))).rejects.toMatchObject(
      violates("campaigns_ends_after_starts"),
    );
  });
});

describe("phase 06 migrations", () => {
  it("are journal entries that drizzle-kit migrate has applied", async () => {
    const journal = JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as {
      entries: { tag: string; when: number }[];
    };
    const whens = TAGS.map((tag) => journal.entries.find((entry) => entry.tag === tag)?.when ?? -1);
    const [row] = await testSql<{ count: number }[]>`
      select count(*)::int as count from drizzle.__drizzle_migrations where created_at = any(${whens})`;
    expect(row.count).toBe(3);
  });

  it("roll down (0012 → 0010) and back up cleanly", async () => {
    const result = await withRollback(async (tx) => {
      for (const tag of [...TAGS].reverse()) {
        for (const statement of statementsOf(`${tag}.down.sql`)) await tx.execute(sql.raw(statement));
      }
      const afterDown = (await tablesPresent(tx)).map((row) => row.name);
      for (const tag of TAGS) {
        for (const statement of statementsOf(`${tag}.sql`)) await tx.execute(sql.raw(statement));
      }
      const afterUp = (await tablesPresent(tx)).map((row) => row.name);
      const [exclusion] = await tx.execute<{ count: number }>(sql`
        select count(*)::int as count from pg_constraint where conname = 'campaigns_no_overlap' and contype = 'x'`);
      return { afterDown, afterUp, exclusion: exclusion.count };
    });
    expect(result).toEqual({ afterDown: [], afterUp: ["campaigns", "kudo_hearts"], exclusion: 1 });
  });
});
