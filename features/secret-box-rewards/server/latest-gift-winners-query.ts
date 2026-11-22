import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { profiles, secretBoxes, secretBoxPrizes } from "@/shared/db/schema";
import type { GiftWinnerView } from "../schemas/secret-box-views";
import { LATEST_WINNERS_LIMIT } from "../secret-box-config";

/**
 * LatestGiftWinnersQuery (A6, BR-009, FR-204/205, D008): the last LATEST_WINNERS_LIMIT boxes that
 * opened to a physical gift (icons and the mystery gift never enter), newest first, with the winner's
 * real name and avatar — the list only renders for signed-in Sunners (FR-604: callers are behind
 * requireSunner). Gift winners are box owners, never kudo senders, so no anonymity can leak here.
 * Index: secret_boxes (status, opened_at desc).
 */
async function top10(): Promise<GiftWinnerView[]> {
  const rows = await db
    .select({
      userId: secretBoxes.userId,
      name: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      giftName: secretBoxPrizes.name,
      openedAt: secretBoxes.openedAt,
    })
    .from(secretBoxes)
    .innerJoin(secretBoxPrizes, and(eq(secretBoxPrizes.id, secretBoxes.prizeId), eq(secretBoxPrizes.kind, "gift")))
    .innerJoin(profiles, eq(profiles.id, secretBoxes.userId))
    .where(eq(secretBoxes.status, "opened"))
    .orderBy(desc(secretBoxes.openedAt), desc(secretBoxes.id))
    .limit(LATEST_WINNERS_LIMIT);
  return rows.map((row) => ({ ...row, openedAt: (row.openedAt ?? new Date(0)).toISOString() }));
}

export const LatestGiftWinnersQuery = { top10 } as const;
