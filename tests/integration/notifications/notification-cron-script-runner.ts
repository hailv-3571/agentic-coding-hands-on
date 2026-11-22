import postgres from "postgres";

/**
 * Runs the phase 13 drain cron migration scripts in a transaction that is always rolled back, on a
 * connection of its own that records every NOTICE (the shared test client drops them), then reads the
 * drain job's schedule(s). Guard-breaking (simulated missing pg_cron / pg_net / Vault) reuses phase 10's
 * `brokenGuard` on the statements before they get here.
 */
const ROLLBACK = Symbol("rollback");
export const DRAIN_JOB = "saa-notifications-drain";

export async function runDrainCronScript(statements: string[]): Promise<{ notices: string[]; jobs: string[] }> {
  const notices: string[] = [];
  const client = postgres(process.env.DATABASE_URL ?? "", { max: 1, prepare: false, onnotice: (notice) => notices.push(notice.message) });
  let jobs: string[] = [];
  try {
    await client.begin(async (tx) => {
      for (const statement of statements) await tx.unsafe(statement);
      jobs = (await tx<{ schedule: string }[]>`select schedule from cron.job where jobname = ${DRAIN_JOB}`).map((row) => row.schedule);
      throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  } finally {
    await client.end({ timeout: 5 });
  }
  return { notices, jobs };
}
