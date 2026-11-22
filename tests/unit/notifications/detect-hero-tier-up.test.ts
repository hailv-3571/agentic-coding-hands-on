import { describe, expect, it } from "vitest";
import { detectHeroTierUp } from "@/features/notifications/server/detect-hero-tier-up";
import { HERO_LEGEND_MIN, HERO_RISING_MIN, HERO_SUPER_MIN } from "@/features/hero-badges/server/hero-tier-constants";

/**
 * ALG-002 as built (C-04): after = tierFromCount(current distinct public senders, phase 09 query);
 * before = the highest tier the recipient was already notified of. A tier-up is owed only when after
 * ranks above before — once per tier, never twice, never on the way down, and a jump of several tiers
 * notifies only the tier actually reached.
 */
describe("detectHeroTierUp", () => {
  it("reports the first tier (New) at the first counted sender", () => {
    expect(detectHeroTierUp(1, [])).toEqual({ tier: "new", senderCount: 1 });
  });

  it("owes nothing below the first threshold", () => {
    expect(detectHeroTierUp(0, [])).toBeNull();
  });

  it.each([
    [HERO_RISING_MIN, ["new"], "rising"],
    [HERO_SUPER_MIN, ["new", "rising"], "super"],
    [HERO_LEGEND_MIN, ["new", "rising", "super"], "legend"],
  ] as const)("reports %i senders as %s once the lower tiers were notified", (count, notified, tier) => {
    expect(detectHeroTierUp(count, notified)).toEqual({ tier, senderCount: count });
  });

  it("owes nothing inside a tier already notified (another kudo, same or new sender)", () => {
    expect(detectHeroTierUp(HERO_RISING_MIN, ["new", "rising"])).toBeNull();
    expect(detectHeroTierUp(HERO_SUPER_MIN - 1, ["new", "rising"])).toBeNull();
  });

  it("owes nothing after a drop below a tier already notified (spam lowered the count)", () => {
    expect(detectHeroTierUp(HERO_RISING_MIN - 1, ["new", "rising"])).toBeNull();
  });

  it("notifies only the highest tier reached when the count jumped past several thresholds", () => {
    expect(detectHeroTierUp(HERO_SUPER_MIN, ["new"])).toEqual({ tier: "super", senderCount: HERO_SUPER_MIN });
  });

  it("ignores stored keys that are not tiers", () => {
    expect(detectHeroTierUp(HERO_RISING_MIN, ["bogus", "new"])).toEqual({ tier: "rising", senderCount: HERO_RISING_MIN });
  });
});
