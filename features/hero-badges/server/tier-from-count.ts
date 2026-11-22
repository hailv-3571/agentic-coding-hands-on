import { HERO_TIERS, type HeroTier } from "../schemas/hero-tier";
import { HERO_LEGEND_MIN, HERO_NEW_MIN, HERO_RISING_MIN, HERO_SUPER_MIN } from "./hero-tier-constants";

/** Minimum distinct senders of each tier, in `HERO_TIERS` order (lowest first). */
const TIER_MIN: Record<HeroTier, number> = {
  new: HERO_NEW_MIN,
  rising: HERO_RISING_MIN,
  super: HERO_SUPER_MIN,
  legend: HERO_LEGEND_MIN,
};

const HIGHEST_FIRST = [...HERO_TIERS].reverse();

/**
 * ALG-001: distinct-sender count → Hero tier, or null below `HERO_NEW_MIN` (no badge). Pure and
 * monotonic, so phase 13 detects a tier-up as `tierFromCount(before) !== tierFromCount(after)`.
 */
export function tierFromCount(count: number): HeroTier | null {
  if (!Number.isFinite(count)) return null;
  return HIGHEST_FIRST.find((tier) => count >= TIER_MIN[tier]) ?? null;
}

/** Inclusive count bounds of a tier (`max: null` = no upper bound), for phase 14's Level filter. */
export function tierCountRange(tier: HeroTier): { min: number; max: number | null } {
  const next = HERO_TIERS[HERO_TIERS.indexOf(tier) + 1];
  return { min: TIER_MIN[tier], max: next ? TIER_MIN[next] - 1 : null };
}
