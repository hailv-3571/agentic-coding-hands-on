import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { testSql } from "../../setup/integration-db";
import { brokenGuard, migrationStatements } from "../secret-box-rewards/secret-box-cron-script-runner";
import {
  CRON_HISTORY_PRUNE_JOB,
  HOUSEKEEPING_TAG_SUFFIX,
  housekeepingJobs,
  OUTBOX_PRUNE_JOB,
  runHousekeepingScript,
} from "./housekeeping-cron-script-runner";

/**
 * Migration NNNN_housekeeping_outbox_and_cron_history_prune (custom SQL, pg_cron only): journal, the two
 * daily jobs, the portability guards (a NOTICE and no change without pg_cron) and down → up → up again,
 * all in always rolled-back transactions. The delete predicates: housekeeping-prune-jobs.test.ts.
 */
const SCHEDULED = { outbox: ["0 19 * * *"], history: ["15 19 * * *"] };
const NONE = { outbox: [], history: [] };

type Journal = { entries: { tag: string; when: number }[] };
function journalEntry() {
  const { entries } = JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as Journal;
  const entry = entries.find((candidate) => candidate.tag.endsWith(HOUSEKEEPING_TAG_SUFFIX));
  if (!entry) throw new Error(`no journal entry *${HOUSEKEEPING_TAG_SUFFIX}`);
  return entry;
}
const up = () => migrationStatements(`${journalEntry().tag}.sql`);
const down = () => migrationStatements(`${journalEntry().tag}.down.sql`);

describe("housekeeping migration", () => {
  it("is a journal entry that drizzle-kit migrate has applied", async () => {
    const [row] = await testSql<{ count: number }[]>`
      select count(*)::int as count from drizzle.__drizzle_migrations where created_at = ${journalEntry().when}`;
    expect(row.count).toBe(1);
  });

  it("schedules both prune jobs daily (19:00 / 19:15 UTC = 02:00 / 02:15 ICT), owned by the migration role", async () => {
    const jobs = await testSql<{ jobname: string; schedule: string; command: string; owner_is_current: boolean; active: boolean }[]>`
      select jobname, schedule, command, username = current_user as owner_is_current, active
      from cron.job where jobname in (${OUTBOX_PRUNE_JOB}, ${CRON_HISTORY_PRUNE_JOB}) order by jobname`;
    expect(jobs.map(({ jobname, schedule, owner_is_current, active }) => ({ jobname, schedule, owner_is_current, active }))).toEqual([
      { jobname: CRON_HISTORY_PRUNE_JOB, schedule: "15 19 * * *", owner_is_current: true, active: true },
      { jobname: OUTBOX_PRUNE_JOB, schedule: "0 19 * * *", owner_is_current: true, active: true },
    ]);
    expect(jobs[0].command).toMatch(/delete from cron\.job_run_details\s+where end_time < now\(\) - interval '7 days'/i);
    expect(jobs[1].command).toMatch(/delete from public\.domain_event_outbox\s+where consumed_at is not null and consumed_at < now\(\) - interval '30 days'/i);
  });

  it.each([
    ["not preloaded", "current_setting('shared_preload_libraries', true)", "current_setting('saa.absent_preload_libraries', true)"],
    ["not available", "WHERE name = 'pg_cron'", "WHERE name = 'pg_cron_absent'"],
  ])("the up script schedules nothing, with a NOTICE, when pg_cron is %s", async (_label, check, absent) => {
    const unscheduled = `select cron.unschedule(jobid) from cron.job where jobname in ('${OUTBOX_PRUNE_JOB}', '${CRON_HISTORY_PRUNE_JOB}')`;
    const { notices, jobs } = await runHousekeepingScript([unscheduled, ...brokenGuard(up(), check, absent)]);
    expect(jobs).toEqual(NONE);
    expect(notices).toEqual([expect.stringMatching(/saa-outbox-prune, saa-cron-history-prune not scheduled.*pg_cron/)]);
  });

  it("the down script is a no-op, with a NOTICE, when pg_cron is not installed", async () => {
    const { notices, jobs } = await runHousekeepingScript(brokenGuard(down(), "to_regclass('cron.job')", "to_regclass('cron.job_absent')"));
    expect(jobs).toEqual(SCHEDULED);
    expect(notices).toEqual([expect.stringContaining("nothing to unschedule")]);
  });

  it("rolls down (both jobs gone, other jobs kept) and back up; re-running up keeps one job each", async () => {
    const others = `select count(*)::int as n from cron.job where jobname not in ('${OUTBOX_PRUNE_JOB}', '${CRON_HISTORY_PRUNE_JOB}')`;
    const [{ n: otherJobs }] = await testSql.unsafe<{ n: number }[]>(others);
    const probe = `do $probe$ begin
      if (${others}) <> ${otherJobs} then raise exception 'other pg_cron jobs changed'; end if;
      if exists (select 1 from cron.job where jobname in ('${OUTBOX_PRUNE_JOB}', '${CRON_HISTORY_PRUNE_JOB}')) then
        raise exception 'housekeeping jobs still scheduled after down'; end if;
    end $probe$`;
    const { jobs } = await runHousekeepingScript([...down(), probe, ...up(), ...up()]);
    expect(jobs).toEqual(SCHEDULED);
    expect(await housekeepingJobs(testSql)).toEqual(SCHEDULED);
  });
});
