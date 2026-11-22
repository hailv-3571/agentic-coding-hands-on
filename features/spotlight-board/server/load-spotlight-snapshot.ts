import "server-only";
import { requireSunner } from "@/shared/auth/current-user";
import type { SpotlightSnapshot } from "../schemas/spotlight-views";
import { SpotlightSnapshotQuery } from "./spotlight-snapshot-query";

/**
 * First paint of the Spotlight region on the Live board (phase 05 seam
 * `features/kudos-feed/components/live-board-spotlight-slot.tsx`). Signed-in Sunners only (A0):
 * `requireSunner()` redirects a guest before the query runs (memoized per render, so no extra
 * read on the Live board). A failed read becomes `null`: the region shows its own error state with
 * a retry (GET /api/spotlight) instead of failing the page.
 */
export async function loadSpotlightSnapshot(): Promise<SpotlightSnapshot | null> {
  await requireSunner();
  try {
    return await SpotlightSnapshotQuery.load();
  } catch (error) {
    console.error("[spotlight-board] loading the snapshot failed", error);
    return null;
  }
}
