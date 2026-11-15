import "server-only";
import { env } from "@/shared/config/env";

/**
 * Admin time-zone helpers built on `Intl` (no date library). Every helper defaults to
 * `ADMIN_TIMEZONE` (single zone for admin filters, exports and F006 countdown — C-14).
 */

export interface ZonedDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Wall-clock parts of `date` as seen in `timeZone`. */
export function toAdminZone(date: Date, timeZone: string = env.ADMIN_TIMEZONE): ZonedDateTimeParts {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {};
  for (const part of formatterFor(timeZone).formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year!,
    month: parts.month!,
    day: parts.day!,
    hour: parts.hour!,
    minute: parts.minute!,
    second: parts.second!,
  };
}

/** Offset (ms) of `timeZone` from UTC at `instant`: local wall clock minus UTC. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const p = toAdminZone(new Date(instant), timeZone);
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Intl reports whole seconds, so compare against the instant truncated to seconds.
  return wallClockAsUtc - Math.floor(instant / 1000) * 1000;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `YYYY-MM-DD`, rejecting impossible dates such as 2025-02-30. */
function parseCalendarDate(value: string): { year: number; month: number; day: number } {
  const match = ISO_DATE.exec(value);
  if (match) {
    const [year, month, day] = match.slice(1).map(Number);
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day) {
      return { year, month, day };
    }
  }
  throw new RangeError(`Expected a calendar date YYYY-MM-DD, received "${value}"`);
}

/** UTC instant of 00:00:00 on calendar day `isoDate` (YYYY-MM-DD) in `timeZone`. */
export function startOfDayInZone(isoDate: string, timeZone: string = env.ADMIN_TIMEZONE): Date {
  const { year, month, day } = parseCalendarDate(isoDate);
  const midnightAsUtc = Date.UTC(year, month - 1, day);
  const firstGuess = midnightAsUtc - zoneOffsetMs(midnightAsUtc, timeZone);
  // Re-check once: the offset at the guess differs when a DST change sits in between.
  return new Date(midnightAsUtc - zoneOffsetMs(firstGuess, timeZone));
}

/** `YYYY-MM-DD HH:mm:ss` in `timeZone` — the format used for admin tables and CSV. */
export function formatInZone(date: Date, timeZone: string = env.ADMIN_TIMEZONE): string {
  const p = toAdminZone(date, timeZone);
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}
