import "server-only";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudoHearts, kudos } from "@/shared/db/schema";
import { SWEEP_MAX_SENDERS_PER_TICK, SWEEP_WINDOW_MIN } from "../secret-box-config";
import { SecretBoxGrantService, type SweepOutcome } from "./secret-box-grant-service";

/**
 * SecretBoxSweepJob (plan Key Insights, grant trigger 2): every tick looks at the distinct senders
 * whose public kudos got a heart in the last SWEEP_WINDOW_MIN minutes and grants the boxes they are
 * owed, at most SWEEP_MAX_SENDERS_PER_TICK due senders per tick (the rest stay due; the next ticks
 * overlap the window), so `BoxGranted` reaches phase 13 without waiting for the user's next visit.
 * Reconcile is idempotent; a missed or skipped tick only delays a notification. This reads WHO to
 * reconcile, never how much: the totals still come from phase 06's HeartStatsQuery (C-02).
 * Unheart / Un Spam create no heart → read path.
 */
async function recentlyHeartedSenders(since: Date): Promise<string[]> {
  const rows = await db
    .selectDistinct({ senderId: kudos.senderId })
    .from(kudoHearts)
    .innerJoin(kudos, eq(kudos.id, kudoHearts.kudoId))
    .where(and(gte(kudoHearts.createdAt, since), eq(kudos.status, "public")));
  return rows.map((row) => row.senderId);
}

async function run(now: Date = new Date()): Promise<SweepOutcome> {
  const senders = await recentlyHeartedSenders(new Date(now.getTime() - SWEEP_WINDOW_MIN * 60_000));
  if (senders.length === 0) return { senders: 0, granted: 0, failed: 0, deferred: 0 };
  return SecretBoxGrantService.reconcileForSenders(senders, SWEEP_MAX_SENDERS_PER_TICK, now);
}

export const SecretBoxSweepJob = { run } as const;
