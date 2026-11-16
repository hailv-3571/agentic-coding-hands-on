import { z } from "zod";

/**
 * Campaign form input (F011 BR-003, D007). Client-safe: the form modal may reuse these schemas
 * for early checks; every Server Action re-parses on the server (never trusts the client).
 * Instants are the raw `<input type="datetime-local">` values (`yyyy-MM-ddTHH:mm`), read as
 * ADMIN_TIMEZONE wall-clock time on the server (decision-log 2026-11-16). Field error keys map to
 * `adminCampaigns.errors.fields.<key>` (messages/*.json).
 */
export const CAMPAIGN_NAME_MAX_LENGTH = 100;

export const CAMPAIGN_FIELD_ERROR_KEYS = [
  "nameRequired",
  "startRequired",
  "endRequired",
  "invalidDateTime",
  "endBeforeStart",
  "endInPast",
  "startLocked",
] as const;

export type CampaignFieldErrorKey = (typeof CAMPAIGN_FIELD_ERROR_KEYS)[number];
export type CampaignField = "name" | "startsAt" | "endsAt";
export type CampaignFieldErrors = Partial<Record<CampaignField, CampaignFieldErrorKey[]>>;

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Earlier years are typos (a lost digit), never a campaign window. */
const CAMPAIGN_MIN_YEAR = 2000;

/**
 * `yyyy-MM-ddTHH:mm` naming a real calendar day and time from year 2000 on (2101-02-29T10:00 and
 * 0050-01-01T10:00 are not). The floor also keeps the `Date.UTC` probe clear of its 0–99 → 19xx quirk.
 */
export function isLocalDateTime(value: string): boolean {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) return false;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (year < CAMPAIGN_MIN_YEAR) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day && hour <= 23 && minute <= 59;
}

const localDateTime = (requiredKey: CampaignFieldErrorKey) =>
  z.string(requiredKey).trim().min(1, { message: requiredKey, abort: true }).refine(isLocalDateTime, "invalidDateTime");

const campaignName = z.string("nameRequired").trim().min(1, "nameRequired").max(CAMPAIGN_NAME_MAX_LENGTH, "nameRequired");

/** Add Campaign: all three fields required. */
export const CampaignCreateSchema = z.object({
  name: campaignName,
  startsAt: localDateTime("startRequired"),
  endsAt: localDateTime("endRequired"),
});

/** Edit Campaign: `startsAt` may be omitted (kept from the row); it may only change while upcoming. */
export const CampaignUpdateSchema = z.object({
  id: z.int().positive(),
  name: campaignName,
  startsAt: localDateTime("startRequired").optional(),
  endsAt: localDateTime("endRequired"),
});

export type CampaignCreateInput = z.input<typeof CampaignCreateSchema>;
export type CampaignUpdateInput = z.input<typeof CampaignUpdateSchema>;

/** BR-003 time rules on UTC instants: end after start, then end after `now`. Null = valid. */
export function campaignWindowErrors(window: { startsAt: Date; endsAt: Date }, now: Date): CampaignFieldErrors | null {
  if (window.endsAt.getTime() <= window.startsAt.getTime()) return { endsAt: ["endBeforeStart"] };
  if (window.endsAt.getTime() <= now.getTime()) return { endsAt: ["endInPast"] };
  return null;
}

const knownKeys = new Set<string>(CAMPAIGN_FIELD_ERROR_KEYS);

/** Zod issues → `{ field: [key…] }`; issues on other paths (e.g. `id`) are dropped. */
export function campaignFieldErrors(issues: readonly z.core.$ZodIssue[]): CampaignFieldErrors {
  const errors: CampaignFieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (field !== "name" && field !== "startsAt" && field !== "endsAt") continue;
    const key = (knownKeys.has(issue.message) ? issue.message : "invalidDateTime") as CampaignFieldErrorKey;
    const list = (errors[field] ??= []);
    if (!list.includes(key)) list.push(key);
  }
  return errors;
}
