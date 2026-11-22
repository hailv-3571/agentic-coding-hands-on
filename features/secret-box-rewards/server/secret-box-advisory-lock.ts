import "server-only";
import { sql } from "drizzle-orm";
import type { DbTx } from "@/shared/db/client";

/**
 * Transaction-scoped advisory locks (released at COMMIT/ROLLBACK). Every per-user write — grant
 * reconcile and box open — takes the same user lock, so a user's Secret Box operations run one at a
 * time; the UNIQUE constraints are the belt behind it. Take the lock FIRST in the transaction and do
 * no read through the shared `db` pool while holding it (pool starvation): callers read before.
 */
export async function lockSecretBoxUser(tx: DbTx, userId: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`secret_box:${userId}`}))`);
}

/** The single Kudos Quốc Dân finalize lock (ALG-003). */
export async function lockNationalKudosFinalize(tx: DbTx): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('national_kudos'))`);
}

/**
 * The internal tick's overlap guard: true when this transaction now holds the tick lock, false at
 * once when another tick holds it (never waits). Transaction-scoped, so it is safe behind
 * Supabase's transaction pooler and is released even when the process dies mid-tick.
 */
export async function tryLockSecretBoxTick(tx: DbTx): Promise<boolean> {
  const [row] = await tx.execute<{ locked: boolean }>(sql`select pg_try_advisory_xact_lock(hashtext('secret_box_tick')) as locked`);
  return row?.locked === true;
}
