import "server-only";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudos } from "@/shared/db/schema";
import type { PersonalRewardStatsView } from "../schemas/secret-box-views";
import { SecretBoxGrantService } from "./secret-box-grant-service";
import { SecretBoxQuery } from "./secret-box-query";

/**
 * PersonalRewardStatsQuery (A5, FR-201..203, D011) — the stats panel of the Live board rewards column
 * (and the own profile, phase 12), for the SESSION user only. Reconciles first (FR-401), reusing the
 * heart totals it read (x2 weighted + campaign flag, C-02), then two counts: public kudos received /
 * sent (spam excluded; anonymous kudos count for their real sender, who is the viewer here) and boxes
 * by status. Throws on any failure: the caller renders the panel's error state (stats = null).
 */
async function publicKudoCounts(userId: string): Promise<{ received: number; sent: number }> {
  const [row] = await db
    .select({
      received: sql<number>`count(*) filter (where ${kudos.recipientId} = ${userId})::int`,
      sent: sql<number>`count(*) filter (where ${kudos.senderId} = ${userId})::int`,
    })
    .from(kudos)
    .where(and(eq(kudos.status, "public"), or(eq(kudos.recipientId, userId), eq(kudos.senderId, userId))));
  return { received: row?.received ?? 0, sent: row?.sent ?? 0 };
}

async function forUser(userId: string, now: Date = new Date()): Promise<PersonalRewardStatsView> {
  const { stats } = await SecretBoxGrantService.reconcileForSender(userId, now);
  const [kudoCounts, boxes] = await Promise.all([publicKudoCounts(userId), SecretBoxQuery.boxCounts(userId)]);
  return {
    kudosReceived: kudoCounts.received,
    kudosSent: kudoCounts.sent,
    heartsReceived: stats.weightedTotal,
    campaignActive: stats.campaignActive,
    boxesOpened: boxes.opened,
    boxesUnopened: boxes.unopened,
  };
}

export const PersonalRewardStatsQuery = { forUser } as const;
