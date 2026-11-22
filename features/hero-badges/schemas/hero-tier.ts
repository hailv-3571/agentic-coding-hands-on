/**
 * Hero tier names (F009), lowest first. Client-safe: no server imports, so the badge components,
 * the Thể lệ page and the server query share one list. A person without a tier has no value (null).
 */
export const HERO_TIERS = ["new", "rising", "super", "legend"] as const;

export type HeroTier = (typeof HERO_TIERS)[number];
