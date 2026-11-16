import "server-only";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudoHearts, kudos } from "@/shared/db/schema";
import { DEFAULT_HEART_MULTIPLIER, HeartMultiplierResolver } from "./heart-multiplier-resolver";

/**
 * HeartStatsQuery (F005 A4, C-02, C-11): hearts RECEIVED by a user = hearts on the kudos they SENT
 * (decision-log), anonymous kudos included. Spam is excluded at query time (`status = 'public'`),
 * so Mark Spam stops counting and Un Spam restores it with no clawback (D006). Hearts created
 * after `asOf` are ignored (phase 10 passes SECRET_BOX_LOCK_AT). ONE grouped query per batch.
 * - weightedTotal = Σ multiplier → Secret Box progress (phase 10)
 * - rawTotal = number of hearts → "Total Heart" (phase 14), the card count's sibling
 * - campaignActive = an x2 campaign is active at `asOf` (the x2 label)
 * Never exposes who hearted (D009).
 */
export type HeartStats = { weightedTotal: number; rawTotal: number; campaignActive: boolean };

async function receivedByUsers(userIds: string[], asOf: Date = new Date()): Promise<Map<string, HeartStats>> {
  if (userIds.length === 0) return new Map();
  const [rows, multiplier] = await Promise.all([
    db
      .select({
        senderId: kudos.senderId,
        weightedTotal: sql<number>`coalesce(sum(${kudoHearts.multiplier}), 0)::int`,
        rawTotal: sql<number>`count(*)::int`,
      })
      .from(kudoHearts)
      .innerJoin(kudos, eq(kudos.id, kudoHearts.kudoId))
      .where(and(inArray(kudos.senderId, userIds), eq(kudos.status, "public"), lte(kudoHearts.createdAt, asOf)))
      .groupBy(kudos.senderId),
    HeartMultiplierResolver.resolve(asOf),
  ]);
  const campaignActive = multiplier > DEFAULT_HEART_MULTIPLIER;
  const totals = new Map(rows.map((row) => [row.senderId, row]));
  return new Map(
    userIds.map((id) => {
      const total = totals.get(id);
      return [id, { weightedTotal: total?.weightedTotal ?? 0, rawTotal: total?.rawTotal ?? 0, campaignActive }];
    }),
  );
}

/** Batch of one (F010 panel, F012 profile). */
async function receivedByUser(userId: string, asOf: Date = new Date()): Promise<HeartStats> {
  const stats = (await receivedByUsers([userId], asOf)).get(userId);
  return stats ?? { weightedTotal: 0, rawTotal: 0, campaignActive: false };
}

export const HeartStatsQuery = { receivedByUsers, receivedByUser } as const;
