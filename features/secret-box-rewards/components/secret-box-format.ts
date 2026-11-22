import {
  SECRET_BOX_ICON_CODES,
  type IconCollectionSlot,
  type SecretBoxIconCode,
} from "../schemas/secret-box-views";

/** "Secretbox chưa mở 05": two digits like the Figma counter, never negative. */
export function formatBoxCount(count: number): string {
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return String(safe).padStart(2, "0");
}

/** `TOUCH_OF_LIGHT` → `touch-of-light`: the badge file name and the `awardsPortal.rules.badges.*` key. */
export function secretBoxIconSlug(code: SecretBoxIconCode): string {
  return code.toLowerCase().replaceAll("_", "-");
}

/** Intrinsic height of each phase 07 badge export (all 160 wide: an 80 px circle at 2x, name below). */
const BADGE_HEIGHT: Record<SecretBoxIconCode, number> = {
  REVIVAL: 176,
  TOUCH_OF_LIGHT: 208,
  STAY_GOLD: 176,
  FLOW_TO_HORIZON: 208,
  BEYOND_THE_BOUNDARY: 240,
  ROOT_FURTHER: 208,
};

/** The Secret Box icon artwork = the phase 07 badge image (circle with the name baked in). */
export function secretBoxIconImage(code: SecretBoxIconCode): { src: string; width: number; height: number } {
  return { src: `/images/awards-portal/badge-${secretBoxIconSlug(code)}.webp`, width: 160, height: BADGE_HEIGHT[code] };
}

/** The 6 collection slots in display order whatever the input order; a missing code is not owned. */
export function orderIconSlots(slots: readonly IconCollectionSlot[]): IconCollectionSlot[] {
  return SECRET_BOX_ICON_CODES.map(
    (iconCode) => slots.find((slot) => slot.iconCode === iconCode) ?? { iconCode, owned: false, quantity: 0 },
  );
}

type FillRandom = (bytes: Uint8Array) => Uint8Array;

const platformRandom: FillRandom = (bytes) => crypto.getRandomValues(bytes);

/**
 * A uuid v4 for the `Idempotency-Key` header. Built from `getRandomValues`, which (unlike
 * `crypto.randomUUID`) also exists outside secure contexts, e.g. the app opened over a LAN IP.
 */
export function newIdempotencyKey(fillRandom: FillRandom = platformRandom): string {
  const bytes = fillRandom(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
