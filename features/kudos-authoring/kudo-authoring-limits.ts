/**
 * Kudo authoring limits (F003), shared by the composer UI and the server. Values follow the
 * decision log: hashtags 1–5 (2026-11-15, Figma "Tối đa 5"), title optional ≤ 50 (D006),
 * anonymous nickname 1–30, body 1–1,000 characters of raw Markdown, ≤ 5 images of ≤ 5 MB
 * (bucket `kudo-images`, migration 0003). Client-safe: no server imports.
 */
export const KUDO_LIMITS = {
  BODY_MAX: 1000,
  TITLE_MAX: 50,
  NICKNAME_MAX: 30,
  HASHTAGS_MIN: 1,
  HASHTAGS_MAX: 5,
  IMAGES_MAX: 5,
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  /**
   * Signed-but-unattached uploads a Sunner may hold, counted over a rolling window so an
   * abandoned upload never locks anyone out while orphan cleanup is deferred (review W2).
   */
  PENDING_UPLOADS_MAX: 20,
  PENDING_UPLOADS_WINDOW_HOURS: 24,
  /** Body cap of POST /api/kudos/images/sign; a real body is ~45 bytes (review S1). */
  SIGN_BODY_MAX_BYTES: 4 * 1024,
} as const;

/** Private Storage bucket for Kudo images (phase 01 migration 0003). */
export const KUDO_IMAGE_BUCKET = "kudo-images";

/** Accepted upload types and the file extension each one is stored under. */
export const KUDO_IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type KudoImageContentType = keyof typeof KUDO_IMAGE_EXTENSIONS;

export const KUDO_IMAGE_CONTENT_TYPES = Object.keys(KUDO_IMAGE_EXTENSIONS) as [
  KudoImageContentType,
  ...KudoImageContentType[],
];

/**
 * Object path issued by the sign endpoint: `kudos/{uuid}.{ext}`, lowercase. It never holds the
 * sender id, so an anonymous Kudo cannot leak its author through an image URL.
 */
export const KUDO_IMAGE_PATH_PATTERN =
  /^kudos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/**
 * Character count used for every Kudo length limit: Unicode code points, the same unit as
 * Postgres `char_length`, so the form counter, Zod and the DB CHECKs agree (an emoji is 1).
 */
export function kudoTextLength(value: string): number {
  return Array.from(value).length;
}
