import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/shared/db/client";
import type { KudoCardCore, KudoCardView } from "../schemas/kudo-card-view";
import type { PublicKudoIdsSubquery } from "./kudo-public-filters";

/**
 * SEAM — created by phase 05, OWNED BY PHASE 06 from here on (C-19). Phase 06 rewrites this whole
 * file with real heart counts (`summaryForKudos`) and `HeartRankingQuery.rankKudoIds`, keeping the
 * two exported signatures below. Phase 05 never reads `kudo_hearts`.
 * Phase 05 defaults: every card has 0 hearts and none by the viewer; Highlight ranks by recency.
 */

/** Adds `heartCount` / `heartedByMe` for `viewerId` to a page of masked cards (one batch, no N+1). */
export type EnrichHeartSummary = (cards: KudoCardCore[], viewerId: string) => Promise<KudoCardView[]>;

/** Ids of the top `limit` candidates, best first (phase 06: raw hearts DESC, created_at DESC, id DESC). */
export type RankKudoIdsForHighlight = (candidates: PublicKudoIdsSubquery, limit: number) => Promise<string[]>;

export const enrichHeartSummary: EnrichHeartSummary = async (cards) =>
  cards.map((card) => ({ ...card, heartCount: 0, heartedByMe: false }));

export const rankKudoIdsForHighlight: RankKudoIdsForHighlight = async (candidates, limit) => {
  const rows = await db
    .select({ id: candidates.id })
    .from(candidates)
    .orderBy(desc(candidates.createdAt), desc(candidates.id))
    .limit(limit);
  return rows.map((row) => row.id);
};
