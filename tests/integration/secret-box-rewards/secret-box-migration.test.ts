import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SECRET_BOX_ICON_CODES } from "@/features/secret-box-rewards/schemas/secret-box-views";
import { testSql, withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { brokenGuard, migrationStatements as statementsOf, runWithNotices } from "./secret-box-cron-script-runner";

/**
 * Migrations NNNN_secret_box_rewards (drizzle-generated: 5 tables, CHECKs, indexes, RLS) and
 * NNNN_secret_box_tick_cron (pg_cron + pg_net, secrets read from Vault; a no-op with a NOTICE where
 * they are missing): RLS without client access, constraints, journal applied, the cron guards, and
 * down → up inside a transaction that is always rolled back.
 */
const TABLES = ["mystery_gift_awards", "national_kudos", "secret_box_prizes", "secret_boxes", "user_icons"];
const TAG_SUFFIXES = ["_secret_box_rewards", "_secret_box_tick_cron"];
type Journal = { entries: { tag: string; when: number }[] };
const journalEntries = () =>
  TAG_SUFFIXES.map((suffix) =>
    (JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as Journal).entries.find((entry) => entry.tag.endsWith(suffix)),
  );
const cronUpStatements = () => statementsOf(`${journalEntries()[1]?.tag}.sql`);
const violates = (constraint: string) => ({ cause: expect.objectContaining({ constraint_name: constraint }) });
type Tx = Parameters<Parameters<typeof withRollback>[0]>[0];
const tablesPresent = async (tx: Tx) =>
  (
    await tx.execute<{ name: string }>(sql`
      select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ${TABLES} order by 1`)
  ).map((row) => row.name);
const tickJobs = async (tx: Tx) =>
  (await tx.execute<{ schedule: string }>(sql`select schedule from cron.job where jobname = 'saa-secret-box-tick'`)).map((row) => row.schedule);

let owner: Sunner;
let peer: Sunner;
beforeAll(async () => {
  [owner, peer] = await Promise.all([createSunner("sbx-mig", "Sbx Migration"), createSunner("sbx-mig-peer", "Sbx Peer")]);
});
afterAll(async () => cleanupSunners([owner, peer]));

const insertPrize = (values: string) =>
  withRollback((tx) => tx.execute(sql.raw(`insert into public.secret_box_prizes (code, kind, icon_code, name, weight, stock_total, stock_remaining) values ${values}`)));

describe("secret box schema", () => {
  it("creates the 5 tables with RLS on, no policy and no client privileges", async () => {
    const rows = await testSql<{ relname: string; rls: boolean; client_grant: boolean; policies: number }[]>`
      select c.relname, c.relrowsecurity as rls,
             has_table_privilege('anon', c.oid, 'select,insert,update,delete')
             or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete') as client_grant,
             (select count(*)::int from pg_policies p where p.tablename = c.relname) as policies
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = any(${TABLES}) order by c.relname`;
    expect(rows).toEqual(TABLES.map((relname) => ({ relname, rls: true, client_grant: false, policies: 0 })));
  });

  it("accepts the 6 icon codes and valid gifts, and rejects invalid prize rows", async () => {
    const icons = SECRET_BOX_ICON_CODES.map((code, index) => `('probe-${index}', 'icon', '${code}', 'n', 1, null, null)`).join(", ");
    await expect(withRollback(async (tx) => {
      // Free the seeded icon codes (partial unique index) inside the rolled-back transaction.
      await tx.execute(sql.raw(`update public.secret_box_prizes set icon_code = null, kind = 'gift', stock_total = 1, stock_remaining = 1 where kind = 'icon'`));
      await tx.execute(sql.raw(`insert into public.secret_box_prizes (code, kind, icon_code, name, weight, stock_total, stock_remaining) values ${icons}, ('probe-gift', 'gift', null, 'g', 1, 2, 2), ('probe-free', 'gift', null, 'f', 1, null, null)`));
      return true;
    })).resolves.toBe(true);
    await expect(insertPrize(`('p', 'icon', 'NOT_AN_ICON', 'n', 1, null, null)`)).rejects.toMatchObject(violates("secret_box_prizes_icon_code_valid"));
    await expect(insertPrize(`('p', 'gift', 'REVIVAL', 'n', 1, 1, 1)`)).rejects.toMatchObject(violates("secret_box_prizes_icon_code_matches_kind"));
    await expect(insertPrize(`('p', 'badge', null, 'n', 1, 1, 1)`)).rejects.toMatchObject(violates("secret_box_prizes_kind_valid"));
    await expect(insertPrize(`('p', 'gift', null, 'n', 0, 1, 1)`)).rejects.toMatchObject(violates("secret_box_prizes_weight_positive"));
    await expect(insertPrize(`('p', 'gift', null, 'n', 1, 1, -1)`)).rejects.toMatchObject(violates("secret_box_prizes_stock_valid"));
    await expect(insertPrize(`('p', 'gift', null, 'n', 1, 1, 2)`)).rejects.toMatchObject(violates("secret_box_prizes_stock_valid"));
    await expect(insertPrize(`('p', 'gift', null, 'n', 1, null, 1)`)).rejects.toMatchObject(violates("secret_box_prizes_stock_valid"));
    await expect(insertPrize(`('p', 'icon', 'REVIVAL', 'n', 1, 5, 5)`)).rejects.toMatchObject(violates("secret_box_prizes_icons_unlimited"));
    await expect(insertPrize(`('p', 'gift', null, ' ', 1, 1, 1)`)).rejects.toMatchObject(violates("secret_box_prizes_name_not_blank"));
  });

  it("keeps one prize row per icon code and per code", async () => {
    await expect(insertPrize(`('p1', 'icon', 'REVIVAL', 'n', 1, null, null), ('p2', 'icon', 'REVIVAL', 'n', 1, null, null)`)).rejects.toMatchObject(
      violates("secret_box_prizes_icon_code_unique"),
    );
    await expect(insertPrize(`('dup', 'gift', null, 'n', 1, 1, 1), ('dup', 'gift', null, 'n', 1, 1, 1)`)).rejects.toMatchObject(
      violates("secret_box_prizes_code_unique"),
    );
  });

  it("enforces one box per (user, seq) and per (user, open request), and opened ⇔ result", async () => {
    const box = (seq: number, extra = "") => sql.raw(`insert into public.secret_boxes (user_id, seq${extra ? ", status, prize_id, opened_at, open_request_id" : ""}) values ('${owner.id}', ${seq}${extra})`);
    const prizeId = "(select id from public.secret_box_prizes where kind = 'icon' limit 1)";
    const request = "'6f1c2b9e-3d4a-4e5f-9a8b-7c6d5e4f3a2b'";
    await expect(withRollback((tx) => tx.execute(box(1)).then(() => tx.execute(box(1))))).rejects.toMatchObject(violates("secret_boxes_user_id_seq_unique"));
    await expect(
      withRollback(async (tx) => {
        await tx.execute(box(1, `, 'opened', ${prizeId}, now(), ${request}`));
        await tx.execute(box(2, `, 'opened', ${prizeId}, now(), ${request}`));
      }),
    ).rejects.toMatchObject(violates("secret_boxes_user_id_open_request_id_unique"));
    await expect(withRollback((tx) => tx.execute(box(1, `, 'opened', null, now(), ${request}`)))).rejects.toMatchObject(violates("secret_boxes_opened_has_result"));
    await expect(withRollback((tx) => tx.execute(box(1, `, 'unopened', ${prizeId}, now(), ${request}`)))).rejects.toMatchObject(violates("secret_boxes_opened_has_result"));
    await expect(withRollback((tx) => tx.execute(box(0)))).rejects.toMatchObject(violates("secret_boxes_seq_positive"));
  });

  it("validates icons, quantities, award names and national kudos ranks", async () => {
    const run = (statement: string) => withRollback((tx) => tx.execute(sql.raw(statement)));
    await expect(run(`insert into public.user_icons (user_id, icon_code) values ('${owner.id}', 'NOPE')`)).rejects.toMatchObject(violates("user_icons_icon_code_valid"));
    await expect(run(`insert into public.user_icons (user_id, icon_code, quantity) values ('${owner.id}', 'REVIVAL', 0)`)).rejects.toMatchObject(violates("user_icons_quantity_positive"));
    await expect(run(`insert into public.mystery_gift_awards (user_id, gift_name) values ('${owner.id}', '')`)).rejects.toMatchObject(violates("mystery_gift_awards_gift_name_not_blank"));
    const national = (rank: number, hearts: number) =>
      withRollback(async (tx) => {
        const [kudo] = await tx.execute<{ id: string }>(sql`
          insert into public.kudos (sender_id, recipient_id, body) values (${owner.id}, ${peer.id}, 'x') returning id`);
        await tx.execute(sql`insert into public.national_kudos (kudo_id, rank, hearts_at_finalize) values (${kudo.id}, ${rank}, ${hearts})`);
      });
    await expect(national(6, 1)).rejects.toMatchObject(violates("national_kudos_rank_range"));
    await expect(national(1, 0)).rejects.toMatchObject(violates("national_kudos_hearts_positive"));
  });

  it("indexes boxes by (user_id, status) and (status, opened_at desc)", async () => {
    const rows = await testSql<{ indexdef: string }[]>`select indexdef from pg_indexes where tablename = 'secret_boxes' order by indexname`;
    expect(rows.map((row) => row.indexdef.slice(row.indexdef.indexOf("USING")))).toEqual([
      "USING btree (id)",
      "USING btree (status, opened_at DESC NULLS LAST)",
      "USING btree (user_id, open_request_id)",
      "USING btree (user_id, seq)",
      "USING btree (user_id, status)",
    ]);
  });
});

describe("phase 10 migrations", () => {
  it("are journal entries that drizzle-kit migrate has applied", async () => {
    const whens = journalEntries().map((entry) => entry?.when ?? -1);
    const [row] = await testSql<{ count: number }[]>`select count(*)::int as count from drizzle.__drizzle_migrations where created_at = any(${whens})`;
    expect(row.count).toBe(2);
  });

  it("schedules the tick every minute through pg_net, reading the URL and secret from Vault", async () => {
    const [job] = await testSql<{ schedule: string; command: string }[]>`select schedule, command from cron.job where jobname = 'saa-secret-box-tick'`;
    expect(job.schedule).toBe("* * * * *");
    expect(job.command).toContain("net.http_post");
    expect(job.command).toContain("vault.decrypted_secrets");
    expect(job.command).toContain("x-job-secret");
  });

  // Plain Postgres (CI, a dev DB) has no pg_cron / pg_net / Vault: simulated by pointing one guard
  // check of the real script at a name that does not exist. The script must then change nothing.
  it.each([
    ["pg_cron", "ARRAY['pg_cron', 'pg_net']", "ARRAY['pg_cron_absent', 'pg_net']", "pg_cron_absent"],
    ["pg_net", "ARRAY['pg_cron', 'pg_net']", "ARRAY['pg_cron', 'pg_net_absent']", "pg_net_absent"],
    ["Vault", "to_regclass('vault.decrypted_secrets')", "to_regclass('vault.absent')", "vault"],
  ])("the tick cron up script schedules nothing, with a NOTICE, when %s is unavailable", async (_label, check, absent, named) => {
    const unscheduled = "select cron.unschedule(jobid) from cron.job where jobname = 'saa-secret-box-tick'";
    const { notices, jobs } = await runWithNotices([unscheduled, ...brokenGuard(cronUpStatements(), check, absent)]);
    expect(jobs).toEqual([]);
    expect(notices).toEqual([expect.stringMatching(new RegExp(`saa-secret-box-tick not scheduled.*${named}`))]);
  });

  it("the tick cron down script is a no-op, with a NOTICE, when pg_cron is not installed", async () => {
    const down = statementsOf(`${journalEntries()[1]?.tag}.down.sql`);
    const { notices, jobs } = await runWithNotices(brokenGuard(down, "to_regclass('cron.job')", "to_regclass('cron.job_absent')"));
    expect(jobs).toEqual(["* * * * *"]);
    expect(notices).toEqual([expect.stringContaining("nothing to unschedule")]);
  });

  it("roll down (cron → tables) and back up cleanly", async () => {
    const tags = journalEntries().map((entry) => entry?.tag ?? "missing");
    const result = await withRollback(async (tx) => {
      for (const tag of [...tags].reverse()) {
        for (const statement of statementsOf(`${tag}.down.sql`)) await tx.execute(sql.raw(statement));
      }
      const afterDown = { tables: await tablesPresent(tx), jobs: await tickJobs(tx) };
      for (const tag of tags) {
        for (const statement of statementsOf(`${tag}.sql`)) await tx.execute(sql.raw(statement));
      }
      return { afterDown, afterUp: { tables: await tablesPresent(tx), jobs: await tickJobs(tx) } };
    });
    expect(result).toEqual({ afterDown: { tables: [], jobs: [] }, afterUp: { tables: TABLES, jobs: ["* * * * *"] } });
  });
});
