import "server-only";
import type { KudoCardView } from "../schemas/kudo-card-view";

/**
 * SEAM — created by phase 05, OWNED BY PHASE 09 from here on. Phase 09 rewrites this whole file:
 * collect recipient ids + NON-anonymous sender ids (an anonymous sender has no id after
 * `maskKudoRow`, so its tier can never be looked up — FR-603), make one `getTiersByRecipientIds`
 * call, set `tier` on each person, and on error log and return the cards unchanged.
 * Phase 05 default: no badges — `maskKudoRow` already sets every `tier` to null.
 */
export type EnrichHeroTier = (cards: KudoCardView[]) => Promise<KudoCardView[]>;

export const enrichHeroTier: EnrichHeroTier = async (cards) => cards;
