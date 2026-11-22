import "server-only";
import { requireSunner } from "@/shared/auth/current-user";
import type { RewardsColumnData } from "../schemas/secret-box-views";
import { LatestGiftWinnersQuery } from "./latest-gift-winners-query";
import { PersonalRewardStatsQuery } from "./personal-reward-stats-query";

/**
 * Data of the Live board rewards column (rendered by the phase 05 seam
 * `features/kudos-feed/components/live-board-rewards-column-slot.tsx`). Logged-in Sunners only
 * (FR-604): `requireSunner()` redirects a guest to /login BEFORE either query runs, so no winner
 * name or stat is ever read for them. The user id comes from the session. Then
 * PersonalRewardStatsQuery (reconciles boxes first) and LatestGiftWinnersQuery in parallel, each
 * failing on its own into that panel's error state (`null`).
 */
async function settle<T>(read: Promise<T>, region: string): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    console.error(`[secret-box] loading the ${region} failed`, error);
    return null;
  }
}

export async function loadRewardsColumnData(): Promise<RewardsColumnData> {
  const { userId } = await requireSunner();
  const [stats, winners] = await Promise.all([
    settle(PersonalRewardStatsQuery.forUser(userId), "personal reward stats"),
    settle(LatestGiftWinnersQuery.top10(), "latest gift winners"),
  ]);
  return { stats, winners };
}
