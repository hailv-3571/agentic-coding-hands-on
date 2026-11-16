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
      era: "short",
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
  let beforeYearOne = false;
  for (const part of formatterFor(timeZone).formatToParts(date)) {
    if (part.type === "era") beforeYearOne = part.value === "BC";
    else if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return {
    // Intl counts 1 BC, 2 BC…; ISO 8601 and Date call those years 0, -1…
    year: beforeYearOne ? 1 - parts.year! : parts.year!,
    month: parts.month!,
    day: parts.day!,
    hour: parts.hour!,
    minute: parts.minute!,
    second: parts.second!,
  };
}

/**
 * Epoch ms of wall-clock parts read as UTC (1-based month). Unlike `Date.UTC`, which reads years
 * 0–99 as 1900–1999, it keeps every year as written (0050 stays 0050).
 */
function utcMs(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  const date = new Date(Date.UTC(2000, 0, 1, hour, minute, second));
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime();
}

/** Offset (ms) of `timeZone` from UTC at `instant`: local wall clock minus UTC. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const p = toAdminZone(new Date(instant), timeZone);
  const wallClockAsUtc = utcMs(p.year, p.month, p.day, p.hour, p.minute, p.second);
  // Intl reports whole seconds, so compare against the instant truncated to seconds.
  return wallClockAsUtc - Math.floor(instant / 1000) * 1000;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `YYYY-MM-DD`, rejecting impossible dates such as 2025-02-30. */
function parseCalendarDate(value: string): { year: number; month: number; day: number } {
  const match = ISO_DATE.exec(value);
  if (match) {
    const [year, month, day] = match.slice(1).map(Number);
    const probe = new Date(utcMs(year, month, day));
    if (probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day) {
      return { year, month, day };
    }
  }
  throw new RangeError(`Expected a calendar date YYYY-MM-DD, received "${value}"`);
}

/** UTC instant of a wall-clock time (given as if it were UTC) in `timeZone`. */
function wallClockToUtc(wallClockAsUtc: number, timeZone: string): Date {
  const firstGuess = wallClockAsUtc - zoneOffsetMs(wallClockAsUtc, timeZone);
  // Re-check once: the offset at the guess differs when a DST change sits in between.
  return new Date(wallClockAsUtc - zoneOffsetMs(firstGuess, timeZone));
}

/** UTC instant of 00:00:00 on calendar day `isoDate` (YYYY-MM-DD) in `timeZone`. */
export function startOfDayInZone(isoDate: string, timeZone: string = env.ADMIN_TIMEZONE): Date {
  const { year, month, day } = parseCalendarDate(isoDate);
  return wallClockToUtc(utcMs(year, month, day), timeZone);
}

const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/;

/**
 * UTC instant of a `<input type="datetime-local">` value (`YYYY-MM-DDTHH:mm`) read as wall-clock
 * time in `timeZone` (admin campaign windows, F011 BR-006). Throws RangeError on any other shape.
 */
export function zonedDateTimeToUtc(localDateTime: string, timeZone: string = env.ADMIN_TIMEZONE): Date {
  const match = LOCAL_DATE_TIME.exec(localDateTime);
  const [hour, minute] = match ? [Number(match[2]), Number(match[3])] : [NaN, NaN];
  if (!match || hour > 23 || minute > 59) {
    throw new RangeError(`Expected YYYY-MM-DDTHH:mm, received "${localDateTime}"`);
  }
  const { year, month, day } = parseCalendarDate(match[1]);
  return wallClockToUtc(utcMs(year, month, day, hour, minute), timeZone);
}

/** `YYYY-MM-DD HH:mm:ss` in `timeZone` — the format used for admin tables and CSV. */
export function formatInZone(date: Date, timeZone: string = env.ADMIN_TIMEZONE): string {
  const p = toAdminZone(date, timeZone);
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}
