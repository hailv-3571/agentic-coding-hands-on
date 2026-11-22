import "server-only";
import { Suspense } from "react";
import { RewardsColumn } from "@/features/secret-box-rewards/components/rewards-column";
import { loadRewardsColumnData } from "@/features/secret-box-rewards/server/rewards-column-data-loader";

/**
 * SEAM — created by phase 05, owned by phase 10 (F010): the 422-wide right column next to the All
 * Kudos feed (personal stats + "Mở Secret Box", "10 Sunner nhận quà mới nhất"); below the feed on
 * small screens. The data (session-gated, each panel failing on its own into `null`) comes from
 * `loadRewardsColumnData`. Its own Suspense boundary, so the feed streams without waiting for the
 * rewards reads.
 */
async function RewardsColumnLoader() {
  return <RewardsColumn data={await loadRewardsColumnData()} />;
}

export function LiveBoardRewardsColumnSlot() {
  return (
    <Suspense fallback={null}>
      <RewardsColumnLoader />
    </Suspense>
  );
}
