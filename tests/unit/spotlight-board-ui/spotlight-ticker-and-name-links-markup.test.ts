import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { SpotlightNameCloud } from "@/features/spotlight-board/components/spotlight-name-cloud";
import { SpotlightTicker } from "@/features/spotlight-board/components/spotlight-ticker";
import type { SpotlightTickerItem } from "@/features/spotlight-board/schemas/spotlight-views";
import { renderSpotlightMarkup } from "./render-spotlight-markup";

// A static render is the server pass; these stand in for the browser: hydrated, and a measured
// 1157×548 board (the Figma size), so the time and the cloud render as they do after mount.
vi.mock("@/features/spotlight-board/hooks/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("@/features/spotlight-board/hooks/use-element-size", () => {
  const size = { width: 1157, height: 548 }; // one object, like the hook's state between renders
  return { useElementSize: () => size };
});

/**
 * Criterion 7 details of the region (FR-202, FR-204, D004, D006): the ticker shows the browser-local
 * time in the UI language (vi "20:30", en "08:30 PM") and fades older lines 100/100/70/50/30 % from
 * the bottom; every name in the cloud links to `/profile/{recipientId}`.
 */
const ana = "00000000-0000-4000-8000-00000000000a";
const binh = "00000000-0000-4000-8000-00000000000b";

/** 20:30 local wall time, whatever zone the test machine runs in (the ticker formats in local time). */
const evening = new Date(2026, 10, 22, 20, 30).toISOString();
const item = (n: number): SpotlightTickerItem => ({
  kudoId: `00000000-0000-4000-8000-00000000000${n}`,
  recipientId: ana,
  recipientName: `Người ${n}`,
  occurredAt: evening,
});
const ticker = (items: SpotlightTickerItem[], locale: "vi" | "en" = "vi") => renderSpotlightMarkup(createElement(SpotlightTicker, { items }), locale);
const times = (markup: string) => [...markup.matchAll(/<time[^>]*>(.*?)<\/time>/g)].map((match) => match[1].replace(/\s/gu, " "));
const opacities = (markup: string) => [...markup.matchAll(/<li style="opacity:([\d.]+)"/g)].map((match) => Number(match[1]));
const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

describe("spotlight ticker", () => {
  it("shows the local time as 20:30 in Vietnamese", () => {
    const markup = ticker([item(1)]);
    expect(times(markup)).toEqual(["20:30"]);
    expect(markup).toContain(`<time dateTime="${evening}"`);
  });

  it("shows the local time as 08:30 PM in English", () => {
    expect(times(ticker([item(1)], "en"))).toEqual(["08:30 PM"]);
  });

  it("fades the five lines 30/50/70/100/100 % from the top, the newest at the bottom", () => {
    expect(opacities(ticker([1, 2, 3, 4, 5].map(item)))).toEqual([0.3, 0.5, 0.7, 1, 1]);
  });

  it("keeps the two newest lines fully opaque when fewer lines are shown", () => {
    expect(opacities(ticker([1, 2, 3].map(item)))).toEqual([0.7, 1, 1]);
  });
});

describe("spotlight name cloud links", () => {
  it("links every name to /profile/{recipientId} with its Kudos count as the label", () => {
    const names = [
      { recipientId: ana, name: "Ana", count: 3 },
      { recipientId: binh, name: "Bình", count: 1 },
    ];
    const markup = renderSpotlightMarkup(createElement(SpotlightNameCloud, { names, query: "", spotlitId: null }));
    const links = [...markup.matchAll(/<a [^>]*>/g)].map(([tag]) => [attr(tag, "href"), attr(tag, "aria-label")]);
    expect(links).toEqual([
      [`/profile/${ana}`, "Ana, 3 Kudos"],
      [`/profile/${binh}`, "Bình, 1 Kudos"],
    ]);
  });
});
