import "server-only";
import type { KudoCardCore, KudoCardView } from "../schemas/kudo-card-view";
import { enrichHeartSummary } from "./enrich-heart-summary";
import { enrichHeroTier } from "./enrich-hero-tier";

/**
 * Composes the two seams on a page of masked cards: hearts (phase 06 owns enrich-heart-summary.ts)
 * then Hero tiers (phase 09 owns enrich-hero-tier.ts). Each seam is its own file so 06 ∥ 09 never
 * edit the same file; this composer stays phase 05's. Runs after masking, so no seam ever sees an
 * anonymous sender's id.
 */
export async function enrichKudoCards(cards: KudoCardCore[], viewerId: string): Promise<KudoCardView[]> {
  if (cards.length === 0) return [];
  return enrichHeroTier(await enrichHeartSummary(cards, viewerId));
}
