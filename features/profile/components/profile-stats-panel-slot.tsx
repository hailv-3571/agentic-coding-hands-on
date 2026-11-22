import "server-only";
import { Suspense } from "react";
import { PersonalStatsPanel } from "@/features/secret-box-rewards/components/personal-stats-panel";
import { PersonalRewardStatsQuery } from "@/features/secret-box-rewards/server/personal-reward-stats-query";
import { requireSunner } from "@/shared/auth/current-user";

/**
 * Phase 10 personal stats + "Mở Secret Box" on the OWN profile only (FR-203, BR-004): the user id
 * comes from the session, so no path can read someone else's stats (FR-603); the other profile never
 * renders this. Its own Suspense boundary (the launcher reads the URL query under Cache Components),
 * so the rest of the page does not wait for the reconcile + counts. A failed read → the panel's error.
 */
async function ProfileStatsPanelLoader() {
  const { userId } = await requireSunner();
  let stats = null;
  try {
    stats = await PersonalRewardStatsQuery.forUser(userId);
  } catch (error) {
    console.error("[profile] loading the personal stats failed", error);
  }
  return <PersonalStatsPanel stats={stats} />;
}

export function ProfileStatsPanelSlot() {
  return (
    <Suspense fallback={null}>
      <ProfileStatsPanelLoader />
    </Suspense>
  );
}
