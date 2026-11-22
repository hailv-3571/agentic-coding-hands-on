import "server-only";
import { db } from "@/shared/db/client";
import { NationalKudosFinalizeJob, type NationalKudosOutcome } from "./national-kudos-finalize-job";
import { tryLockSecretBoxTick } from "./secret-box-advisory-lock";
import type { SweepOutcome } from "./secret-box-grant-service";
import { SecretBoxSweepJob } from "./secret-box-sweep-job";

/**
 * One internal tick (POST /api/internal/secret-box/tick): SecretBoxSweepJob, then
 * NationalKudosFinalizeJob, each failing on its own into `null` (logged; the other still runs).
 * Overlap guard: the whole tick runs inside a transaction holding the tick advisory lock, so a tick
 * that starts while a slow one still runs (or a retried cron call) is skipped at once. The jobs use
 * their own pool connections and transactions; the held connection only carries the lock (1 of the
 * pool's 10), and no job reads through it.
 */
export type TickOutcome =
  | { skipped: true }
  | { skipped: false; sweep: SweepOutcome | null; nationalKudos: NationalKudosOutcome | null };

async function settle<T>(job: Promise<T>, name: string): Promise<T | null> {
  try {
    return await job;
  } catch (error) {
    console.error(`[secret-box] tick: the ${name} job failed`, error);
    return null;
  }
}

async function run(now: Date = new Date()): Promise<TickOutcome> {
  return db.transaction(async (tx): Promise<TickOutcome> => {
    if (!(await tryLockSecretBoxTick(tx))) return { skipped: true };
    const sweep = await settle(SecretBoxSweepJob.run(now), "sweep");
    const nationalKudos = await settle(NationalKudosFinalizeJob.run(now), "national kudos");
    return { skipped: false, sweep, nationalKudos };
  });
}

export const SecretBoxTickJob = { run } as const;
