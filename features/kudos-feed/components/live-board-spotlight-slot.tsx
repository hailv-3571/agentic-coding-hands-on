import "server-only";
import { Suspense } from "react";
import { SpotlightBoardRegion } from "@/features/spotlight-board/components/spotlight-board-region";
import { SpotlightBoardSkeleton } from "@/features/spotlight-board/components/spotlight-board-skeleton";
import { loadSpotlightSnapshot } from "@/features/spotlight-board/server/load-spotlight-snapshot";

/**
 * SEAM — created by phase 05, owned by phase 11 (F008): the Spotlight Board region ("SPOTLIGHT
 * BOARD" header + board) between the Highlight and All Kudos sections of the Live board. The first
 * snapshot is read on the server (session-gated, `null` on failure → the region's own error state
 * with retry); live updates then come over the private Realtime channel. Its own Suspense
 * boundary, so the feed streams without waiting for the snapshot; meanwhile the skeleton holds the
 * region's exact box.
 */
async function SpotlightBoardLoader() {
  return <SpotlightBoardRegion snapshot={await loadSpotlightSnapshot()} />;
}

export function LiveBoardSpotlightSlot() {
  return (
    <Suspense fallback={<SpotlightBoardSkeleton />}>
      <SpotlightBoardLoader />
    </Suspense>
  );
}
