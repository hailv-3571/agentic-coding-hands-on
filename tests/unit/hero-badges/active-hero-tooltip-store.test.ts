import { afterEach, describe, expect, it, vi } from "vitest";
import {
  closeHeroTooltip,
  openHeroTooltip,
  readActiveHeroTooltip,
  subscribeActiveHeroTooltip,
} from "@/features/hero-badges/components/active-hero-tooltip-store";

/** DEC-003: at most one Hero tooltip is open on the page; opening another one closes the first. */
afterEach(() => closeHeroTooltip(readActiveHeroTooltip() ?? ""));

describe("active Hero tooltip store", () => {
  it("keeps only the last opened tooltip open", () => {
    openHeroTooltip("a");
    openHeroTooltip("b");
    expect(readActiveHeroTooltip()).toBe("b");
  });

  it("ignores a close from a tooltip that is not the open one", () => {
    openHeroTooltip("a");
    openHeroTooltip("b");
    closeHeroTooltip("a");
    expect(readActiveHeroTooltip()).toBe("b");
    closeHeroTooltip("b");
    expect(readActiveHeroTooltip()).toBeNull();
  });

  it("notifies subscribers only when the open tooltip changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeActiveHeroTooltip(listener);
    openHeroTooltip("a");
    openHeroTooltip("a");
    closeHeroTooltip("z");
    closeHeroTooltip("a");
    unsubscribe();
    openHeroTooltip("b");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
