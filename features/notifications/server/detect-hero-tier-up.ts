import { HERO_TIERS, type HeroTier } from "@/features/hero-badges/schemas/hero-tier";
import { tierFromCount } from "@/features/hero-badges/server/tier-from-count";

export type HeroTierUp = { tier: HeroTier; senderCount: number };

const rankOf = (tier: string | null): number => (tier ? HERO_TIERS.indexOf(tier as HeroTier) : -1);

/**
 * ALG-002 as built (C-04, FR-407, BR-005). Pure.
 * - after  = tierFromCount(senderCount), where senderCount is phase 09's distinct public senders of
 *   the recipient, read by the processor INSIDE the event's transaction (so it includes the kudo).
 * - before = the highest tier this recipient was ALREADY notified of (`hero_tier_up` dedupe keys),
 *   not a count "just before the kudo": no second counting query (C-04), and it stays right when
 *   events are drained late, in a burst or out of order — the first event processed after a
 *   threshold is crossed reports it, later ones find it notified. A drop (spam) never re-arms a tier.
 * A tier-up is owed only when after ranks above before; a jump over several thresholds reports the
 * tier reached. The partial unique index (recipient_id, dedupe_key) is the concurrent-drainer guard.
 */
export function detectHeroTierUp(senderCount: number, notifiedTiers: readonly string[]): HeroTierUp | null {
  const after = tierFromCount(senderCount);
  if (!after) return null;
  const before = Math.max(-1, ...notifiedTiers.map(rankOf));
  return rankOf(after) > before ? { tier: after, senderCount } : null;
}
