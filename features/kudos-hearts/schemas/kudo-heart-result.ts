import type { KudoHeartSummary } from "@/features/kudos-feed/schemas/kudo-card-view";

/**
 * Result contract of the heart toggle actions (F005 A1/A2). Client-safe: constants and types only.
 * The UI maps `error` to `kudosHearts.errors.<CODE>` (messages/*.json); a network failure or a
 * thrown action maps to `UNEXPECTED` ("Không thể cập nhật, vui lòng thử lại").
 *
 * A guest never gets a code: the actions call `requireSunner()`, which redirects to /login.
 * The status column documents the meaning; Server Actions travel as HTTP 200 with the code in-band.
 * Responses carry counts only — never who hearted (D009) nor the sender of an anonymous Kudo.
 */
export const HEART_ERROR_STATUS = {
  /** The viewer sent this Kudo, anonymous or not (BR-002, DEC-001). */
  SELF_HEART: 403,
  /** Missing, malformed id, or no longer public (spam) — BR-003, FR-404. */
  KUDO_UNAVAILABLE: 404,
  /** Hearts are read-only from EVENT_END_AT (decision-log "Sau sự kiện"). */
  EVENT_ENDED: 409,
  UNEXPECTED: 500,
} as const;

export type HeartErrorCode = keyof typeof HEART_ERROR_STATUS;

/** The card's heart numbers (phase 05 card DTO): raw count, never multiplied (D003) + the viewer's state. */
export type { KudoHeartSummary };

export type HeartActionResult = ({ ok: true } & KudoHeartSummary) | { ok: false; error: HeartErrorCode };
