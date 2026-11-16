import "server-only";
import { HeartRankingQuery } from "@/features/kudos-hearts/server/heart-ranking-query";
import { KudoHeartQuery } from "@/features/kudos-hearts/server/kudo-heart-query";
import type { KudoCardCore, KudoCardView } from "../schemas/kudo-card-view";
import type { PublicKudoIdsSubquery } from "./kudo-public-filters";

/**
 * SEAM — created by phase 05, owned by phase 06 (C-19). The two exported signatures are phase
 * 05's contract; the bodies are F005's real implementations:
 * - cards get the RAW heart count and the viewer's own heart (`KudoHeartQuery.summaryForKudos`,
 *   one grouped query per page; runs after masking, so it never sees an anonymous sender);
 * - the Highlight ranks by `HeartRankingQuery` (raw hearts DESC, created_at DESC, id DESC).
 */

/** Adds `heartCount` / `heartedByMe` for `viewerId` to a page of masked cards (one batch, no N+1). */
export type EnrichHeartSummary = (cards: KudoCardCore[], viewerId: string) => Promise<KudoCardView[]>;

/** Ids of the top `limit` candidates, best first (raw hearts DESC, created_at DESC, id DESC). */
export type RankKudoIdsForHighlight = (candidates: PublicKudoIdsSubquery, limit: number) => Promise<string[]>;

export const enrichHeartSummary: EnrichHeartSummary = async (cards, viewerId) => {
  const summaries = await KudoHeartQuery.summaryForKudos(
    cards.map((card) => card.id),
    viewerId,
  );
  return cards.map((card) => ({ ...card, ...(summaries.get(card.id) ?? { heartCount: 0, heartedByMe: false }) }));
};

export const rankKudoIdsForHighlight: RankKudoIdsForHighlight = (candidates, limit) =>
  HeartRankingQuery.rankKudoIds(candidates, limit);
