import postgres from "postgres";

/**
 * Shared bits of the housekeeping (outbox + cron history prune) integration tests. `runHousekeepingScript`
 * runs migration statements in a transaction that is always rolled back, on a connection of its own that
 * records every NOTICE (the shared test client drops them), then reads both jobs' schedules. Guard-breaking
 * (simulated missing pg_cron) reuses phase 10's `brokenGuard` on the statements before they get here.
 */
export const OUTBOX_PRUNE_JOB = "saa-outbox-prune";
export const CRON_HISTORY_PRUNE_JOB = "saa-cron-history-prune";
export const HOUSEKEEPING_TAG_SUFFIX = "_housekeeping_outbox_and_cron_history_prune";

export type HousekeepingJobs = { outbox: string[]; history: string[] };
const ROLLBACK = Symbol("rollback");

/** Each job's schedule(s), as seen by `tx` ([] = not scheduled; one entry per job row). */
export async function housekeepingJobs(tx: postgres.Sql | postgres.TransactionSql): Promise<HousekeepingJobs> {
  const [row] = await tx<HousekeepingJobs[]>`
    select array(select schedule from cron.job where jobname = ${OUTBOX_PRUNE_JOB}) as outbox,
           array(select schedule from cron.job where jobname = ${CRON_HISTORY_PRUNE_JOB}) as history`;
  return row;
}

export async function runHousekeepingScript(statements: string[]): Promise<{ notices: string[]; jobs: HousekeepingJobs }> {
  const notices: string[] = [];
  const client = postgres(process.env.DATABASE_URL ?? "", { max: 1, prepare: false, onnotice: (notice) => notices.push(notice.message) });
  let jobs: HousekeepingJobs = { outbox: [], history: [] };
  try {
    await client.begin(async (tx) => {
      for (const statement of statements) await tx.unsafe(statement);
      jobs = await housekeepingJobs(tx);
      throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  } finally {
    await client.end({ timeout: 5 });
  }
  return { notices, jobs };
}
