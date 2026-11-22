import "server-only";
import { eq, inArray, max, sql } from "drizzle-orm";
import { HeartStatsQuery, type HeartStats } from "@/features/kudos-hearts/server/heart-stats-query";
import { env } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { secretBoxes } from "@/shared/db/schema";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import { lockSecretBoxUser } from "./secret-box-advisory-lock";

/**
 * SecretBoxGrantService (A1, ALG-001 adjusted, C-02). Progress = phase 06's weighted heart total of
 * the user as SENDER (x2 included, spam excluded at read time, anonymous included) as of
 * min(now, EVENT_END_AT): clamping freezes hearts at the lock, and a late reconcile (sweep lag, first
 * visit after the event) still grants boxes earned in the window. entitled = floor(total / per box);
 * seq max+1..entitled are inserted, never deleted (BR-002: a total that drops grants nothing).
 * Reconcile, never recount: totals are read BEFORE the transaction (no pool read under the lock), a
 * cheap max(seq) pre-check skips the lock when nothing is due, then the per-user advisory lock + the
 * insert + `BoxGranted{count}` (only when rows were inserted) commit together. Idempotent; a failed
 * read throws before anything is written. No outbox consumption here (C-01: phase 13 is the consumer).
 */
export type ReconcileResult = { granted: number; stats: HeartStats };

/** The heart cut-off for grants: now, frozen at EVENT_END_AT. */
export function grantAsOf(now: Date): Date {
  return new Date(Math.min(now.getTime(), env.EVENT_END_AT));
}

/** Boxes a weighted heart total is worth. */
const entitlement = (weightedTotal: number) => Math.floor(weightedTotal / env.SECRET_BOX_HEARTS_PER_BOX);

async function grantedCount(userId: string): Promise<number> {
  const [row] = await db.select({ maxSeq: max(secretBoxes.seq) }).from(secretBoxes).where(eq(secretBoxes.userId, userId));
  return row?.maxSeq ?? 0;
}

/** Highest granted seq per user (absent = 0), in one grouped read. */
async function grantedCounts(userIds: string[]): Promise<Map<string, number>> {
  const rows = await db
    .select({ userId: secretBoxes.userId, maxSeq: max(secretBoxes.seq) })
    .from(secretBoxes)
    .where(inArray(secretBoxes.userId, userIds))
    .groupBy(secretBoxes.userId);
  return new Map(rows.map((row) => [row.userId, row.maxSeq ?? 0]));
}

/** Brings the user's boxes up to `weightedTotal`'s entitlement; returns the number inserted. */
async function grantUpTo(userId: string, weightedTotal: number): Promise<number> {
  const entitled = entitlement(weightedTotal);
  if (entitled <= 0 || (await grantedCount(userId)) >= entitled) return 0;
  return insertGrants(userId, entitled);
}

/** Under the user lock: inserts seq max+1..entitled and its `BoxGranted`; returns the number inserted. */
async function insertGrants(userId: string, entitled: number): Promise<number> {
  return db.transaction(async (tx) => {
    await lockSecretBoxUser(tx, userId);
    const inserted = await tx.execute<{ seq: number }>(sql`
      insert into "secret_boxes" ("user_id", "seq")
      select ${userId}::uuid, s from generate_series(
        (select coalesce(max("seq"), 0) + 1 from "secret_boxes" where "user_id" = ${userId}::uuid), ${entitled}::int) s
      on conflict ("user_id", "seq") do nothing
      returning "seq"`);
    if (inserted.length > 0) await DomainEventOutbox.add(tx, "BoxGranted", { userId, count: inserted.length });
    return inserted.length;
  });
}

/** Read path (panel, GET /me, before every open): reconcile one sender, returning the totals read. */
async function reconcileForSender(userId: string, now: Date = new Date()): Promise<ReconcileResult> {
  const stats = await HeartStatsQuery.receivedByUser(userId, grantAsOf(now));
  return { granted: await grantUpTo(userId, stats.weightedTotal), stats };
}

/** `senders` reconciled this tick, boxes `granted`, reconciles that `failed`, due senders `deferred` to the next tick. */
export type SweepOutcome = { senders: number; granted: number; failed: number; deferred: number };

/**
 * Sweep tick: batched heart totals and granted counts (two reads), then one locked grant per DUE
 * sender, at most `limit` of them; up-to-date senders take no slot, and due senders past the limit
 * stay due for the next tick. A failure is logged and skipped (still due next tick).
 */
async function reconcileForSenders(userIds: string[], limit: number, now: Date = new Date()): Promise<SweepOutcome> {
  const [totals, granted] = await Promise.all([HeartStatsQuery.receivedByUsers(userIds, grantAsOf(now)), grantedCounts(userIds)]);
  const due = userIds.flatMap((userId) => {
    const entitled = entitlement(totals.get(userId)?.weightedTotal ?? 0);
    return entitled > (granted.get(userId) ?? 0) ? [{ userId, entitled }] : [];
  });
  const batch = due.slice(0, limit);
  const outcome: SweepOutcome = { senders: batch.length, granted: 0, failed: 0, deferred: due.length - batch.length };
  for (const { userId, entitled } of batch) {
    try {
      outcome.granted += await insertGrants(userId, entitled);
    } catch (error) {
      outcome.failed += 1;
      console.error("[secret-box] sweep reconcile failed for one sender", error);
    }
  }
  return outcome;
}

export const SecretBoxGrantService = { reconcileForSender, reconcileForSenders } as const;
