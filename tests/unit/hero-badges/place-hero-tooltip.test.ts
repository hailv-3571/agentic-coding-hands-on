import { describe, expect, it } from "vitest";
import { placeHeroTooltip } from "@/features/hero-badges/components/place-hero-tooltip";

/**
 * Hero tooltip placement (fixed, viewport coordinates): under the badge, centred on it, never
 * closer than 16 px to a viewport edge (works at 375 px), flipped above when it does not fit below.
 */
const PHONE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };
const PANEL = { width: 282, height: 170 };
const badgeAt = (left: number, top: number) => ({ left, top, width: 109, height: 19 });

describe("placeHeroTooltip", () => {
  it("opens 8 px under the badge, centred on it, when there is room", () => {
    expect(placeHeroTooltip(badgeAt(600, 300), PANEL, DESKTOP)).toEqual({ left: 600 + 54.5 - 141, top: 327 });
  });

  it("stays 16 px inside both edges of a 375 px screen, wherever the badge sits", () => {
    for (const left of [0, 10, 120, 250, 266]) {
      const { left: x } = placeHeroTooltip(badgeAt(left, 300), PANEL, PHONE);
      expect(x).toBeGreaterThanOrEqual(16);
      expect(x + PANEL.width).toBeLessThanOrEqual(PHONE.width - 16);
    }
  });

  it("pins to the left gutter when the panel is as wide as the screen allows", () => {
    expect(placeHeroTooltip(badgeAt(200, 300), { width: 343, height: 200 }, PHONE).left).toBe(16);
  });

  it("flips above the badge when it would overflow the bottom edge", () => {
    expect(placeHeroTooltip(badgeAt(100, 700), PANEL, PHONE).top).toBe(700 - 8 - PANEL.height);
  });

  it("keeps it under the badge when it fits neither way (never above the top edge)", () => {
    expect(placeHeroTooltip(badgeAt(100, 100), { width: 282, height: 760 }, PHONE).top).toBe(127);
  });
});
