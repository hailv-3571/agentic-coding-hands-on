/**
 * Phase 11 (F008) Spotlight Board view contracts shared by the server (snapshot query, route handler,
 * Postgres trigger payload) and the client (reducer, components). Written by the orchestrator so the
 * backend and the UI could be built in parallel. Client-safe: types only.
 *
 * Privacy (FR-602, BR-003): no shape here carries a sender id, sender name or `isAnonymous`.
 */

/** One recipient in the name cloud (top N by public kudo count, then id). */
export type SpotlightName = { recipientId: string; name: string; count: number };

/** One ticker line ("{time} {name} đã nhận được một Kudos mới"). */
export type SpotlightTickerItem = { kudoId: string; recipientId: string; recipientName: string; occurredAt: string };

/** GET /api/spotlight (session required, no-store) and the first server render. */
export type SpotlightSnapshot = {
  /** All-time count of public kudos. */
  total: number;
  names: SpotlightName[];
  /** Most recent public kudos, oldest first (ticker preload). */
  recent: SpotlightTickerItem[];
};

/**
 * Broadcast payload sent by the `kudos` trigger on private topic `spotlight`, event `kudo`.
 * Exactly these 5 keys: added = new public kudo, removed = public→spam, restored = spam→public.
 */
export type SpotlightEvent = {
  type: "added" | "removed" | "restored";
  kudoId: string;
  recipientId: string;
  recipientName: string;
  occurredAt: string;
};

/** Props of `SpotlightBoardRegion` (features/spotlight-board/components/spotlight-board-region.tsx). */
export type SpotlightBoardRegionProps = {
  /** null = the first snapshot failed: show the region's error state with retry (GET /api/spotlight). */
  snapshot: SpotlightSnapshot | null;
};
