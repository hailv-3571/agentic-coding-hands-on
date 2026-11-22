/**
 * Phase 10 (F010) view contracts shared by the server (queries, route handlers) and the UI.
 * Written by the orchestrator so backend and UI could be built in parallel. Client-safe: types and
 * constants only, no server imports. Real names are fine here (logged-in viewers only, FR-604);
 * no anonymous sender ever appears in these shapes.
 */

/** Display order = this order (Thể lệ page, icon collection, Figma). */
export const SECRET_BOX_ICON_CODES = [
  "REVIVAL",
  "TOUCH_OF_LIGHT",
  "STAY_GOLD",
  "FLOW_TO_HORIZON",
  "BEYOND_THE_BOUNDARY",
  "ROOT_FURTHER",
] as const;
export type SecretBoxIconCode = (typeof SECRET_BOX_ICON_CODES)[number];

/** Live board right column, stats panel (Figma 2940:13489). */
export type PersonalRewardStatsView = {
  kudosReceived: number;
  kudosSent: number;
  /** Weighted heart total (x2 included) used for box progress. */
  heartsReceived: number;
  /** Show the x2 flame badge next to the heart count. */
  campaignActive: boolean;
  boxesOpened: number;
  boxesUnopened: number;
};

/** One row of "10 SUNNER NHẬN QUÀ MỚI NHẤT" (gift winners only, newest first). */
export type GiftWinnerView = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  giftName: string;
  /** ISO instant. */
  openedAt: string;
};

/** Props of `RewardsColumn` (features/secret-box-rewards/components/rewards-column.tsx). */
export type RewardsColumnData = {
  /** null = the stats query failed: show the panel's error state, keep the page usable. */
  stats: PersonalRewardStatsView | null;
  winners: GiftWinnerView[] | null;
};

/** GET /api/secret-boxes/me — modal opening state. */
export type SecretBoxScreenState = { unopened: number };

/** POST /api/secret-boxes/open (header `Idempotency-Key: <uuid v4>`) — 200 body. */
export type OpenSecretBoxResult = {
  kind: "icon" | "gift";
  /** Set when kind = "icon". */
  iconCode: SecretBoxIconCode | null;
  /** Prize display name (icon name or gift name, e.g. "1 Áo phông SAA"). */
  name: string;
  /** True when this open completed the 6-icon set (mystery gift awarded now). */
  setCompleted: boolean;
  /** Mystery gift name when `setCompleted`. */
  giftName: string | null;
  /**
   * True when the drawn icon was already owned before this open (E08 "Bạn đã có icon này rồi");
   * false for a first copy and for gifts. A replay returns the value of the original open.
   */
  duplicate: boolean;
  unopenedLeft: number;
  /** True when the same Idempotency-Key was already processed (stored result returned). */
  replayed: boolean;
};

/** Error bodies: 400 `invalid_idempotency_key`, 401 `unauthorized`, 409 `no_box_left`, 500 `unexpected`. */
export type OpenSecretBoxError = {
  code: "invalid_idempotency_key" | "unauthorized" | "no_box_left" | "unexpected";
};

/** Icon collection (own + other profile, phase 12): always 6 slots in `SECRET_BOX_ICON_CODES` order. */
export type IconCollectionSlot = { iconCode: SecretBoxIconCode; owned: boolean; quantity: number };
