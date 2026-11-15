/**
 * Secret Box prize catalog — DATA ONLY (C-15). Phase 10 creates `secret_box_prizes` and
 * adds its loader to `apply-all-seeds.ts`; `iconKey` is the stable upsert key.
 *
 * Names: the 6 icons from the decision log and the gifts seen in Figma.
 * PLACEHOLDER weights and stock: BTC has not provided real numbers. Replace them here and
 * re-run `npm run db:seed` once BTC confirms.
 */

export type SecretBoxPrizeKind = "icon" | "gift";

export interface SecretBoxPrizeSeed {
  kind: SecretBoxPrizeKind;
  name: string;
  iconKey: string;
  /** Relative draw weight, > 0. */
  weight: number;
  /** Remaining stock; `null` = unlimited (icons). When gifts run out, only icons are drawn. */
  stock: number | null;
}

export const secretBoxPrizeCatalog: readonly SecretBoxPrizeSeed[] = [
  { kind: "icon", name: "REVIVAL", iconKey: "revival", weight: 10, stock: null },
  { kind: "icon", name: "TOUCH OF LIGHT", iconKey: "touch-of-light", weight: 10, stock: null },
  { kind: "icon", name: "STAY GOLD", iconKey: "stay-gold", weight: 10, stock: null },
  { kind: "icon", name: "FLOW TO HORIZON", iconKey: "flow-to-horizon", weight: 10, stock: null },
  { kind: "icon", name: "BEYOND THE BOUNDARY", iconKey: "beyond-the-boundary", weight: 10, stock: null },
  { kind: "icon", name: "ROOT FURTHER", iconKey: "root-further", weight: 10, stock: null },
  { kind: "gift", name: "Áo phông SAA", iconKey: "gift-ao-phong-saa", weight: 1, stock: 50 },
  { kind: "gift", name: "Lót chuột Root Further", iconKey: "gift-lot-chuot-root-further", weight: 1, stock: 50 },
  { kind: "gift", name: "Khăn Root Further", iconKey: "gift-khan-root-further", weight: 1, stock: 50 },
];
