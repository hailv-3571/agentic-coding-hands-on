import "server-only";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import type { KudoCardView, KudoHeroTier, KudoPersonView } from "../schemas/kudo-card-view";

/**
 * SEAM — created by phase 05, owned by phase 09 (F009). One `HeroTierQuery.getTiersByRecipientIds`
 * call per page for the recipients and the NAMED senders on it, then `tier` on each person (null =
 * no badge). An anonymous sender has no id after `maskKudoRow`, so its tier is never looked up and
 * its view gets no `tier` field at all (FR-603) — only ids already visible on the page are sent.
 * A failed lookup is logged and the cards keep the mask's `tier: null` (no badges, page intact).
 */
export type EnrichHeroTier = (cards: KudoCardView[]) => Promise<KudoCardView[]>;

export const enrichHeroTier: EnrichHeroTier = async (cards) => {
  const visibleIds = cards.flatMap((card) => (card.sender.anonymous ? [card.recipient.id] : [card.recipient.id, card.sender.id]));
  let tiers: Record<string, KudoHeroTier>;
  try {
    tiers = await HeroTierQuery.getTiersByRecipientIds(visibleIds);
  } catch (error) {
    console.error("[kudos-feed] loading Hero tiers failed", error);
    return cards;
  }
  const withTier = <T extends KudoPersonView>(person: T): T => ({ ...person, tier: tiers[person.id] ?? null });
  return cards.map((card) => ({
    ...card,
    sender: card.sender.anonymous ? card.sender : withTier(card.sender),
    recipient: withTier(card.recipient),
  }));
};
