import { describe, expect, it } from "vitest";
import { HERO_TIERS } from "@/features/hero-badges/schemas/hero-tier";
import { tierCountRange, tierFromCount } from "@/features/hero-badges/server/tier-from-count";

/**
 * ALG-001 (F009 SC-001): distinct-sender count → Hero tier, lower bounds inclusive. Phase 13 calls
 * it with the counts before/after a Kudo (C-04) and phase 14 filters by `tierCountRange` (C-12),
 * so both must agree with the same four thresholds.
 */
describe("tierFromCount", () => {
  it("maps the boundary counts 0, 1, 4, 5, 9, 10, 20, 21 to none, new, new, rising, rising, super, super, legend", () => {
    expect([0, 1, 4, 5, 9, 10, 20, 21].map(tierFromCount)).toEqual([
      null,
      "new",
      "new",
      "rising",
      "rising",
      "super",
      "super",
      "legend",
    ]);
  });

  it("stays legend for any larger count", () => {
    expect(tierFromCount(5_000)).toBe("legend");
  });

  it("has no tier for a negative or non-finite count", () => {
    expect([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].map(tierFromCount)).toEqual([null, null, null, null]);
  });

  it("never goes down as the count grows (monotonic, so a tier-up is before !== after)", () => {
    const order = [null, ...HERO_TIERS];
    const ranks = Array.from({ length: 40 }, (_, count) => order.indexOf(tierFromCount(count)));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});

describe("tierCountRange", () => {
  it("gives the inclusive count range of each tier from the same thresholds", () => {
    expect(HERO_TIERS.map(tierCountRange)).toEqual([
      { min: 1, max: 4 },
      { min: 5, max: 9 },
      { min: 10, max: 20 },
      { min: 21, max: null },
    ]);
  });

  it("agrees with tierFromCount at both ends of every range", () => {
    for (const tier of HERO_TIERS) {
      const { min, max } = tierCountRange(tier);
      expect(tierFromCount(min)).toBe(tier);
      expect(tierFromCount(min - 1)).not.toBe(tier);
      if (max !== null) {
        expect(tierFromCount(max)).toBe(tier);
        expect(tierFromCount(max + 1)).not.toBe(tier);
      }
    }
  });
});
