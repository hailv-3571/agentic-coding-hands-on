import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { SpotlightBoardRegion } from "@/features/spotlight-board/components/spotlight-board-region";
import { SpotlightBoardSkeleton } from "@/features/spotlight-board/components/spotlight-board-skeleton";
import type { SpotlightSnapshot } from "@/features/spotlight-board/schemas/spotlight-views";
import { renderSpotlightMarkup, textOf } from "./render-spotlight-markup";

// The browser client is only created inside the channel effect, which a static render never runs.
vi.mock("@/features/spotlight-board/lib/spotlight-browser-supabase", () => ({ spotlightBrowserSupabase: vi.fn() }));

/**
 * Region states around the live board (SCR-spotlight-board-region § 5): while the server snapshot
 * streams in, a skeleton with the same header and board frame (`aria-busy`, nothing moves when the
 * board replaces it); a failed first snapshot (`null`) → the region's own alert with "Thử lại"
 * inside the frame, the header still shown, no counter or ticker.
 */
const ana = "00000000-0000-4000-8000-00000000000a";
const snapshot: SpotlightSnapshot = {
  total: 3,
  names: [{ recipientId: ana, name: "Ana", count: 3 }],
  recent: [{ kudoId: "00000000-0000-4000-8000-0000000000a1", recipientId: ana, recipientName: "Ana", occurredAt: "2026-11-22T13:30:00.000Z" }],
};

const region = (value: SpotlightSnapshot | null) => renderSpotlightMarkup(createElement(SpotlightBoardRegion, { snapshot: value }));
const skeleton = () => renderSpotlightMarkup(createElement(SpotlightBoardSkeleton));
const sectionTag = (markup: string) => markup.match(/<section[^>]*>/)?.[0] ?? "";
const classOf = (tag: string) => tag.match(/class="([^"]*)"/)?.[1];
/** The board frame's box: the element whose class starts with `relative isolate`. */
const frameClass = (markup: string) => markup.match(/class="(relative isolate [^"]*)"/)?.[1];
const alerts = (markup: string) => [...markup.matchAll(/<div role="alert"[^>]*>(.*?)<\/div>/g)].map((match) => textOf(match[1]));

describe("spotlight region error state", () => {
  it("keeps the header and shows the load error with a retry button inside the frame", () => {
    const markup = region(null);
    expect(sectionTag(markup)).toContain('aria-labelledby="spotlight-heading"');
    expect(markup).toMatch(/<h2 id="spotlight-heading"[^>]*>SPOTLIGHT BOARD<\/h2>/);
    expect(alerts(markup)).toEqual(["Không tải được Spotlight Board. Vui lòng thử lại. Thử lại"]);
    expect(markup).toMatch(/<button type="button"[^>]*>Thử lại<\/button>/);
    expect(frameClass(markup)).toBeDefined();
    expect(textOf(markup)).not.toMatch(/KUDOS$/);
    expect(markup).not.toContain('role="log"');
  });

  it("speaks English under the en locale", () => {
    const markup = renderSpotlightMarkup(createElement(SpotlightBoardRegion, { snapshot: null }), "en");
    expect(alerts(markup)).toEqual(["Could not load the Spotlight Board. Please try again. Try again"]);
  });
});

describe("spotlight region skeleton", () => {
  it("is busy, shows the section header and only decorative placeholders", () => {
    const markup = skeleton();
    expect(sectionTag(markup)).toContain('aria-busy="true"');
    expect(sectionTag(markup)).toContain('aria-labelledby="spotlight-heading"');
    expect(markup).toMatch(/<h2 id="spotlight-heading"[^>]*>SPOTLIGHT BOARD<\/h2>/);
    expect(textOf(markup)).toContain("Đang tải…");
    expect(alerts(markup)).toEqual([]);
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain('role="log"');
  });

  it("takes the same box as the loaded board and the error state, so nothing shifts", () => {
    const loading = skeleton();
    for (const loaded of [region(snapshot), region(null)]) {
      expect(classOf(sectionTag(loading))).toBe(classOf(sectionTag(loaded)));
      expect(frameClass(loading)).toBe(frameClass(loaded));
    }
  });
});
