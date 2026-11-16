import type { CampaignFieldErrors } from "./campaign-input-schema";

/**
 * Contract of the campaign admin side (F011 A1–A4). Client-safe: types and constants only.
 * The UI maps `code` to `adminCampaigns.errors.<CODE>`, field keys to
 * `adminCampaigns.errors.fields.<key>`, and an OVERLAP `conflict` to
 * `adminCampaigns.errors.overlapWith` ({name}, {startsAt}, {endsAt}).
 *
 * A non-admin caller never gets a code: every action calls `requireAdmin()` first, which throws
 * `forbidden()` (HTTP 403, app/forbidden.tsx) or redirects a guest to /login.
 * The status column documents the meaning; Server Actions travel as HTTP 200 with the code in-band.
 */
export const CAMPAIGN_ERROR_STATUS = {
  /** Field errors (BR-003, DEC-002 start lock) in `fieldErrors`. */
  VALIDATION: 400,
  /** The row is gone (another admin deleted it): "Chiến dịch không còn tồn tại"; reload the table. */
  NOT_FOUND: 404,
  /** Overlaps another campaign (BR-002, incl. a concurrent save → SQLSTATE 23P01). */
  OVERLAP: 409,
  /** The campaign has ended: read-only, no edit / delete (BR-004, FR-307). */
  ENDED: 409,
  UNEXPECTED: 500,
} as const;

export type CampaignErrorCode = keyof typeof CAMPAIGN_ERROR_STATUS;

/** Computed from the server clock at read/write time, never stored (BR-004). */
export type CampaignPhase = "upcoming" | "active" | "ended";

/** The campaign an OVERLAP collides with, already formatted in ADMIN_TIMEZONE. */
export type CampaignConflict = { name: string; startsAt: string; endsAt: string };

export type CampaignActionFailure =
  | { ok: false; code: "VALIDATION"; fieldErrors: CampaignFieldErrors }
  | { ok: false; code: "OVERLAP"; conflict?: CampaignConflict }
  | { ok: false; code: "NOT_FOUND" | "ENDED" | "UNEXPECTED" };

export type CampaignActionResult = { ok: true; id: number } | CampaignActionFailure;

/** One row of Admin › Settings (A1), ordered by `startsAt` DESC, `id` DESC. */
export type CampaignListItem = {
  id: number;
  name: string;
  /** ISO 8601 UTC. */
  startsAt: string;
  endsAt: string;
  phase: CampaignPhase;
  /** `yyyy-MM-ddTHH:mm` in ADMIN_TIMEZONE: the value for `<input type="datetime-local">` (Edit modal). */
  startsAtLocal: string;
  endsAtLocal: string;
  /** `dd/MM/yyyy - HH:mm` in ADMIN_TIMEZONE (Time column, FR-201). */
  startsAtDisplay: string;
  endsAtDisplay: string;
};
