import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AWARDS,
  AWARD_UNIT_KEYS,
  AWARD_VALUE_NOTE_KEYS,
  formatAwardAmount,
  formatAwardQuantity,
} from "@/features/awards-portal/data/awards-data";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/**
 * BR-003: one awards module feeds the Homepage cards and the Awards page blocks. Numbers are the
 * SCR-awards-system / Figma table (research/figma-awards-portal-spec.md § Award data).
 */
const FIGMA_ORDER = ["top-talent", "top-project", "top-project-leader", "best-manager", "signature-2025-creator", "mvp"];

type AwardsPortalMessages = {
  awards: Record<string, Record<string, unknown>>;
  awardUnits: Record<string, unknown>;
  awardValueNotes: Record<string, unknown>;
};
const portalMessages = (messages: unknown) => (messages as { awardsPortal: AwardsPortalMessages }).awardsPortal;

describe("AWARDS", () => {
  it("lists the 6 awards once each, in Figma order", () => {
    const slugs = AWARDS.map((award) => award.slug);
    expect(slugs).toEqual(FIGMA_ORDER);
    expect(new Set(slugs).size).toBe(6);
  });

  it("matches the quantity, unit and value table exactly", () => {
    const table = AWARDS.map(({ slug, quantity, unitKey, values }) => ({ slug, quantity, unitKey, values }));
    expect(table).toEqual([
      { slug: "top-talent", quantity: 10, unitKey: "individual", values: [{ amountVnd: 7_000_000, noteKey: "perAward" }] },
      { slug: "top-project", quantity: 2, unitKey: "team", values: [{ amountVnd: 15_000_000, noteKey: "perAward" }] },
      { slug: "top-project-leader", quantity: 3, unitKey: "individual", values: [{ amountVnd: 7_000_000, noteKey: "perAward" }] },
      { slug: "best-manager", quantity: 1, unitKey: "individual", values: [{ amountVnd: 10_000_000, noteKey: null }] },
      {
        slug: "signature-2025-creator",
        quantity: 1,
        unitKey: "individualOrTeam",
        values: [
          { amountVnd: 5_000_000, noteKey: "individual" },
          { amountVnd: 8_000_000, noteKey: "team" },
        ],
      },
      { slug: "mvp", quantity: 1, unitKey: "individual", values: [{ amountVnd: 15_000_000, noteKey: null }] },
    ]);
  });

  it("points every award at its exported thumbnail in public/", () => {
    for (const award of AWARDS) {
      expect(award.imageSrc).toBe(`/images/awards-portal/award-${award.slug}.webp`);
      expect(existsSync(join(process.cwd(), "public", award.imageSrc)), award.imageSrc).toBe(true);
    }
  });
});

describe("award number formatting", () => {
  it("pads quantities to two digits as drawn (10, 02, 03, 01)", () => {
    expect([10, 2, 3, 1].map(formatAwardQuantity)).toEqual(["10", "02", "03", "01"]);
  });

  it("formats amounts with vi-VN grouping and the VNĐ suffix", () => {
    expect(formatAwardAmount(7_000_000)).toBe("7.000.000 VNĐ");
    expect(formatAwardAmount(15_000_000)).toBe("15.000.000 VNĐ");
  });
});

describe("awardsPortal award messages", () => {
  it.each([
    ["vi", vi],
    ["en", en],
  ])("has name, menu, short and long text for every slug, and every unit / note label, in %s", (_locale, messages) => {
    const portal = portalMessages(messages);
    for (const { slug } of AWARDS) {
      for (const field of ["name", "menu", "short", "long"]) {
        expect(portal.awards[slug]?.[field], `${slug}.${field}`).toEqual(expect.stringMatching(/\S/));
      }
    }
    for (const key of AWARD_UNIT_KEYS) expect(portal.awardUnits[key], key).toEqual(expect.stringMatching(/\S/));
    for (const key of AWARD_VALUE_NOTE_KEYS) expect(portal.awardValueNotes[key], key).toEqual(expect.stringMatching(/\S/));
  });

  it("uses the Figma names and units in Vietnamese", () => {
    const portal = portalMessages(vi);
    expect(AWARDS.map(({ slug }) => portal.awards[slug].name)).toEqual([
      "Top Talent",
      "Top Project",
      "Top Project Leader",
      "Best Manager",
      "Signature 2025 - Creator",
      "MVP (Most Valuable Person)",
    ]);
    expect(portal.awardUnits).toEqual({ individual: "Cá nhân", team: "Tập thể", individualOrTeam: "Cá nhân hoặc tập thể" });
    expect(portal.awardValueNotes).toEqual({ perAward: "cho mỗi giải thưởng", individual: "cho giải cá nhân", team: "cho giải tập thể" });
  });
});
