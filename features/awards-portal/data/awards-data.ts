/**
 * The ONE awards module (BR-003): read by the Homepage cards and the Awards page blocks.
 * Numbers live here; every text (name, short/long description, unit, value note) is a message
 * key under `awardsPortal` so BTC can change copy by editing messages/*.json.
 * Source: research/figma-awards-portal-spec.md § Award data (Figma 313:8436).
 */
export const AWARD_UNIT_KEYS = ["individual", "team", "individualOrTeam"] as const;
export const AWARD_VALUE_NOTE_KEYS = ["perAward", "individual", "team"] as const;

export type AwardSlug =
  | "top-talent"
  | "top-project"
  | "top-project-leader"
  | "best-manager"
  | "signature-2025-creator"
  | "mvp";
export type AwardUnitKey = (typeof AWARD_UNIT_KEYS)[number];
export type AwardValueNoteKey = (typeof AWARD_VALUE_NOTE_KEYS)[number];

/** One prize amount; `noteKey` = the small line under it ("cho mỗi giải thưởng"), null when Figma shows none. */
export type AwardValue = { amountVnd: number; noteKey: AwardValueNoteKey | null };

export type Award = {
  /** Anchor id on /awards (`/awards#<slug>`) and the message key under `awardsPortal.awards`. */
  slug: AwardSlug;
  /** 336×336 thumbnail (background + name composited in the Figma export). */
  imageSrc: string;
  quantity: number;
  unitKey: AwardUnitKey;
  values: readonly AwardValue[];
};

const award = (slug: AwardSlug, quantity: number, unitKey: AwardUnitKey, values: AwardValue[]): Award => ({
  slug,
  imageSrc: `/images/awards-portal/award-${slug}.webp`,
  quantity,
  unitKey,
  values,
});

/** Figma order: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP. */
export const AWARDS: readonly Award[] = Object.freeze([
  award("top-talent", 10, "individual", [{ amountVnd: 7_000_000, noteKey: "perAward" }]),
  award("top-project", 2, "team", [{ amountVnd: 15_000_000, noteKey: "perAward" }]),
  award("top-project-leader", 3, "individual", [{ amountVnd: 7_000_000, noteKey: "perAward" }]),
  award("best-manager", 1, "individual", [{ amountVnd: 10_000_000, noteKey: null }]),
  award("signature-2025-creator", 1, "individualOrTeam", [
    { amountVnd: 5_000_000, noteKey: "individual" },
    { amountVnd: 8_000_000, noteKey: "team" },
  ]),
  award("mvp", 1, "individual", [{ amountVnd: 15_000_000, noteKey: null }]),
]);

/** Quantity as drawn: at least two digits ("02"). */
export function formatAwardQuantity(quantity: number): string {
  return String(quantity).padStart(2, "0");
}

const vndFormat = new Intl.NumberFormat("vi-VN");

/** "7.000.000 VNĐ" in every language (Figma keeps the Vietnamese grouping and unit). */
export function formatAwardAmount(amountVnd: number): string {
  return `${vndFormat.format(amountVnd)} VNĐ`;
}
