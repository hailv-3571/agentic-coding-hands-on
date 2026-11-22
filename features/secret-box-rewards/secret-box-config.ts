/**
 * Phase 10 (F010) game constants. Client-safe (no server imports). Prize weights and stock are NOT
 * here: they live in `secret_box_prizes`, loaded from `db/seeds/secret-box-prize-catalog.ts` (D003).
 * Hearts per box is env `SECRET_BOX_HEARTS_PER_BOX`; the grant lock is env `EVENT_END_AT`; the icon
 * codes and their display order are `SECRET_BOX_ICON_CODES` in schemas/secret-box-views.ts.
 */

/** Lost stock races before the draw falls back to the icon-only pool (ALG-002). */
export const MAX_REDRAW = 3;

/**
 * Mystery gift for completing the 6-icon set (BR-005, D007). Snapshotted into
 * `mystery_gift_awards.gift_name` and the `SetCompleted` event. PLACEHOLDER copy: BTC confirms it.
 */
export const MYSTERY_GIFT_NAME = "Quà bí ẩn từ BTC SAA 2025";

/** "10 SUNNER NHẬN QUÀ MỚI NHẤT" (BR-009). */
export const LATEST_WINNERS_LIMIT = 10;

/** Kudos Quốc Dân size (BR-008, ALG-003). */
export const NATIONAL_KUDOS_COUNT = 5;

/** The sweep tick reconciles senders whose public kudos got hearts in this many last minutes. */
export const SWEEP_WINDOW_MIN = 10;

/**
 * At most this many DUE senders (boxes owed) are reconciled per tick; the rest stay due and are
 * picked up by the next ticks, which overlap the same window. Read paths reconcile regardless.
 */
export const SWEEP_MAX_SENDERS_PER_TICK = 500;
