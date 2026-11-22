/**
 * Client-side tuning of the Spotlight Board (phase 11, F008). Values shared with the server
 * (NAME_CLOUD_MAX, topic, event) live in ../spotlight-config.ts; these are the browser-only spec
 * values (technical-spec § 4.6) and UI tuning (decision-log 2026-11-22, Figma spec), marked UI-only.
 */

/** D006: ticker lines on screen, newest at the bottom. */
export const TICKER_VISIBLE_LINES = 5;
/** Ticker opacity from the newest line (bottom) upwards: Figma 100/100/70/50/30. UI-only. */
export const TICKER_LINE_OPACITY = [1, 1, 0.7, 0.5, 0.3] as const;

/** D001: size tiers of a name in the cloud. */
export const SIZE_TIERS = 4;
/** RISK-02: names in the cloud on a phone-width board (NAME_CLOUD_MAX on wider ones). */
export const NAME_CLOUD_MAX_NARROW = 24;
/** Board width (px) below which the narrow cap and the larger minimum font apply. UI-only. */
export const NARROW_BOARD_WIDTH = 640;

/**
 * Figma name sizes per tier (1 → 4) on the 1157 px board; they scale with the board (fullscreen
 * grows them) and never drop below these. UI-only.
 */
export const TIER_FONT_SIZES = [6.7, 7.9, 10.2, 11.3] as const;
export const FIGMA_BOARD_WIDTH = 1157;
/** Narrow boards keep names readable: at least this multiple of the Figma sizes. UI-only. */
export const NARROW_MIN_FONT_SCALE = 1.2;

/** A3/A4: search box limit and the typing pause before filtering. Debounce is UI-only. */
export const SEARCH_MAX_LENGTH = 50;
export const SEARCH_DEBOUNCE_MS = 200;

/** How long the newest event's name stays in #F17676 (decision-log 2026-11-22). UI-only. */
export const SPOTLIGHT_HIGHLIGHT_MS = 4000;

/** SM-001: failed joins in a row before the region stops and offers "Thử lại". */
export const RECONNECT_MAX_ATTEMPTS = 5;

/**
 * Snapshot refetch timing (review 2026-11-23, M1/M2). UI-only.
 * - A `removed`/`restored` event refetches this long after the last one of a burst, plus up to
 *   MODERATION_RESYNC_JITTER_MS, so the snapshot has the final word on the counts (2–3 s).
 * - The refetch after a (re)join waits a random 0–SUBSCRIBE_RESYNC_JITTER_MS, so a Realtime blip
 *   does not make every open board hit GET /api/spotlight in the same instant.
 */
export const MODERATION_RESYNC_DELAY_MS = 2000;
export const MODERATION_RESYNC_JITTER_MS = 1000;
export const SUBSCRIBE_RESYNC_JITTER_MS = 2000;
