import type { KudoHeroTier } from "../schemas/kudo-card-view";

/**
 * SEAM — rewritten by phase 09 (Hero tiers). Renders the 4 px separator dot AND the 109×19 Hero
 * badge after the department code, so a person without a badge shows neither (Figma 3127:21871).
 * Phase 05 default: nothing (every tier is `null` until phase 09's `enrich-hero-tier.ts`).
 */
export function KudoCardHeroBadgeSlot({ tier }: { tier: KudoHeroTier | null }) {
  void tier;
  return null;
}
