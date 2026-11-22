import { readFileSync } from "node:fs";
import postgres from "postgres";

/**
 * Runs the phase 10 tick cron migration scripts in a transaction that is always rolled back, on a
 * connection of its own that records every NOTICE (the shared test client drops them). Also breaks
 * one guard check of a script on purpose, to simulate a database without pg_cron / pg_net / Vault.
 */
const ROLLBACK = Symbol("rollback");

/** The statements of a migration file, split like drizzle-kit does (comment-only chunks dropped). */
export const migrationStatements = (file: string): string[] =>
  readFileSync(`db/migrations/${file}`, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);

/** The statements with `check` replaced by `absent`; fails loudly when the script has no such check. */
export function brokenGuard(statements: string[], check: string, absent: string): string[] {
  if (!statements.some((statement) => statement.includes(check))) throw new Error(`the script has no guard check \`${check}\``);
  return statements.map((statement) => statement.replaceAll(check, absent));
}

/** Runs `statements`, then reads the tick job's schedule(s); everything is rolled back. */
export async function runWithNotices(statements: string[]): Promise<{ notices: string[]; jobs: string[] }> {
  const notices: string[] = [];
  const client = postgres(process.env.DATABASE_URL ?? "", { max: 1, prepare: false, onnotice: (notice) => notices.push(notice.message) });
  let jobs: string[] = [];
  try {
    await client.begin(async (tx) => {
      for (const statement of statements) await tx.unsafe(statement);
      jobs = (await tx<{ schedule: string }[]>`select schedule from cron.job where jobname = 'saa-secret-box-tick'`).map((row) => row.schedule);
      throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  } finally {
    await client.end({ timeout: 5 });
  }
  return { notices, jobs };
}
