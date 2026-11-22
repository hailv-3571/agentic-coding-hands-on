import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { NotificationType } from "@/features/notifications/schemas/notification-views";
import { testSql, withRollback } from "../../setup/integration-db";
import { brokenGuard, migrationStatements as statementsOf } from "../secret-box-rewards/secret-box-cron-script-runner";
import { DRAIN_JOB, runDrainCronScript } from "./notification-cron-script-runner";

/**
 * Migrations NNNN_notifications (drizzle: enum, table, indexes, RLS), NNNN_notifications_realtime
 * (signal trigger + realtime.messages policy), NNNN_notifications_drain_cron (pg_cron + pg_net,
 * secrets from Vault; a NOTICE and no change where they are missing) and
 * NNNN_notifications_retry_backoff_and_event_fk (outbox next_attempt_at, event_id FK ON DELETE SET
 * NULL): shape, privileges, journal, cron guards, and down → up inside an always rolled-back transaction.
 */
const TYPES: NotificationType[] = [
  "kudo_received",
  "heart_received",
  "secret_box_granted",
  "hero_tier_up",
  "kudo_hidden_spam",
  "icon_set_completed",
  "national_kudos",
];
const TAG_SUFFIXES = ["_notifications", "_notifications_realtime", "_notifications_drain_cron", "_notifications_retry_backoff_and_event_fk"];
type Journal = { entries: { tag: string; when: number }[] };
const journalEntries = () => {
  const { entries } = JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as Journal;
  return TAG_SUFFIXES.map((suffix) => entries.find((entry) => entry.tag.endsWith(suffix)));
};
const tagOf = (index: number) => journalEntries()[index]?.tag ?? "missing";
type Tx = Parameters<Parameters<typeof withRollback>[0]>[0];

type Footprint = { tables: number; types: number; functions: number; policies: number; jobs: string[]; event_fk: string | null; retry_columns: number };

/** What the phase 13 migrations create, as seen from inside `tx` (event_fk 'n' = ON DELETE SET NULL). */
async function footprint(tx: Tx) {
  const [row] = await tx.execute<Footprint>(sql`
    select (select count(*)::int from pg_class where relname = 'notifications' and relnamespace = 'public'::regnamespace) as tables,
           (select count(*)::int from pg_type where typname = 'notification_type') as types,
           (select count(*)::int from pg_proc where proname = 'notifications_publish_signal') as functions,
           (select count(*)::int from pg_policies where schemaname = 'realtime' and policyname = 'notifications_recipient_read') as policies,
           array(select schedule from cron.job where jobname = ${DRAIN_JOB}) as jobs,
           (select confdeltype::text from pg_constraint where conname = 'notifications_event_id_domain_event_outbox_id_fk') as event_fk,
           (select count(*)::int from information_schema.columns
             where table_schema = 'public' and table_name = 'domain_event_outbox' and column_name = 'next_attempt_at') as retry_columns`);
  return row;
}

describe("notifications schema", () => {
  it("has the 7 contract types, RLS on, no policy and no client privilege", async () => {
    const [row] = await testSql<{ types: string[]; rls: boolean; client_grant: boolean; policies: number }[]>`
      select array(select unnest(enum_range(null::public.notification_type))::text) as types,
             c.relrowsecurity as rls,
             has_table_privilege('anon', c.oid, 'select,insert,update,delete')
             or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete') as client_grant,
             (select count(*)::int from pg_policies p where p.schemaname = 'public' and p.tablename = 'notifications') as policies
      from pg_class c where c.oid = 'public.notifications'::regclass`;
    expect(row).toEqual({ types: TYPES, rls: true, client_grant: false, policies: 0 });
  });

  it("indexes the list order, unread count and the two dedupe keys", async () => {
    const rows = await testSql<{ indexname: string; indexdef: string }[]>`
      select indexname, indexdef from pg_indexes where tablename = 'notifications' order by indexname`;
    expect(rows.map((row) => `${row.indexname}: ${row.indexdef.slice(row.indexdef.indexOf("USING"))}`)).toEqual([
      "notifications_event_id_recipient_id_type_unique: USING btree (event_id, recipient_id, type)",
      "notifications_hero_tier_dedupe_unique: USING btree (recipient_id, dedupe_key) WHERE (type = 'hero_tier_up'::notification_type)",
      "notifications_pkey: USING btree (id)",
      "notifications_recipient_occurred_at_id_idx: USING btree (recipient_id, occurred_at DESC, id DESC)",
      "notifications_recipient_unread_idx: USING btree (recipient_id) WHERE (read_at IS NULL)",
      "notifications_unread_heart_dedupe_unique: USING btree (recipient_id, dedupe_key) WHERE ((type = 'heart_received'::notification_type) AND (read_at IS NULL))",
    ]);
  });

  it("runs the signal trigger as SECURITY DEFINER with an empty search_path, not callable by clients", async () => {
    const [row] = await testSql<{ definer: boolean; config: string[]; anon: boolean; authenticated: boolean; events: string }[]>`
      select p.prosecdef as definer, p.proconfig as config,
             has_function_privilege('anon', p.oid, 'execute') as anon,
             has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
             (select string_agg(event_manipulation, ',' order by event_manipulation) from information_schema.triggers
               where trigger_name = 'notifications_publish_signal') as events
      from pg_proc p where p.proname = 'notifications_publish_signal'`;
    expect(row).toEqual({ definer: true, config: ['search_path=""'], anon: false, authenticated: false, events: "INSERT,UPDATE" });
  });

  it("has one realtime.messages policy for notifications: SELECT, authenticated, join AND row topic", async () => {
    const policies = await testSql<{ policyname: string; cmd: string; roles: string[]; qual: string; with_check: string | null }[]>`
      select policyname, cmd, roles::text[] as roles, qual, with_check from pg_policies
      where schemaname = 'realtime' and tablename = 'messages' and coalesce(qual, '') || coalesce(with_check, '') like '%notifications:%'`;
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatchObject({ policyname: "notifications_recipient_read", cmd: "SELECT", roles: ["authenticated"], with_check: null });
    expect(policies[0].qual).toContain("realtime.topic()");
    expect(policies[0].qual).toContain("(topic = ('notifications:'::text ||");
    expect(policies[0].qual).toContain("'broadcast'");
  });
});

describe("phase 13 migrations", () => {
  it("are journal entries that drizzle-kit migrate has applied", async () => {
    const whens = journalEntries().map((entry) => entry?.when ?? -1);
    const [row] = await testSql<{ count: number }[]>`select count(*)::int as count from drizzle.__drizzle_migrations where created_at = any(${whens})`;
    expect(row.count).toBe(TAG_SUFFIXES.length);
  });

  it("schedules the drain every 5 seconds through pg_net, reading the URL and secret from Vault", async () => {
    const [job] = await testSql<{ schedule: string; command: string }[]>`select schedule, command from cron.job where jobname = ${DRAIN_JOB}`;
    expect(job.schedule).toBe("5 seconds");
    expect(job.command).toContain("net.http_post");
    expect(job.command).toContain("saa_notifications_drain_url");
    expect(job.command).toContain("saa_outbox_drain_secret");
    expect(job.command).toContain("x-drain-secret");
  });

  it.each([
    ["pg_cron", "ARRAY['pg_cron', 'pg_net']", "ARRAY['pg_cron_absent', 'pg_net']", "pg_cron_absent"],
    ["pg_net", "ARRAY['pg_cron', 'pg_net']", "ARRAY['pg_cron', 'pg_net_absent']", "pg_net_absent"],
    ["Vault", "to_regclass('vault.decrypted_secrets')", "to_regclass('vault.absent')", "vault"],
  ])("the drain cron up script schedules nothing, with a NOTICE, when %s is unavailable", async (_label, check, absent, named) => {
    const unscheduled = `select cron.unschedule(jobid) from cron.job where jobname = '${DRAIN_JOB}'`;
    const { notices, jobs } = await runDrainCronScript([unscheduled, ...brokenGuard(statementsOf(`${tagOf(2)}.sql`), check, absent)]);
    expect(jobs).toEqual([]);
    expect(notices).toEqual([expect.stringMatching(new RegExp(`saa-notifications-drain not scheduled.*${named}`))]);
  });

  it("the drain cron down script is a no-op, with a NOTICE, when pg_cron is not installed", async () => {
    const down = statementsOf(`${tagOf(2)}.down.sql`);
    const { notices, jobs } = await runDrainCronScript(brokenGuard(down, "to_regclass('cron.job')", "to_regclass('cron.job_absent')"));
    expect(jobs).toEqual(["5 seconds"]);
    expect(notices).toEqual([expect.stringContaining("nothing to unschedule")]);
  });

  it("roll down (retry/FK → cron → realtime → table) and back up cleanly", async () => {
    const tags = TAG_SUFFIXES.map((_suffix, index) => tagOf(index));
    const result = await withRollback(async (tx) => {
      for (const tag of [...tags].reverse()) {
        for (const statement of statementsOf(`${tag}.down.sql`)) await tx.execute(sql.raw(statement));
      }
      const afterDown = await footprint(tx);
      for (const tag of tags) {
        for (const statement of statementsOf(`${tag}.sql`)) await tx.execute(sql.raw(statement));
      }
      return { afterDown, afterUp: await footprint(tx) };
    });
    expect(result).toEqual({
      afterDown: { tables: 0, types: 0, functions: 0, policies: 0, jobs: [], event_fk: null, retry_columns: 0 },
      afterUp: { tables: 1, types: 1, functions: 1, policies: 1, jobs: ["5 seconds"], event_fk: "n", retry_columns: 1 },
    });
  });
});
