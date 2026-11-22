import type { Locale } from "@/shared/i18n/locales";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Largest unit first; a value is shown in the first unit it fills at least once. */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * DAY],
  ["month", 30 * DAY],
  ["week", 7 * DAY],
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
];

/** Under one minute (and a slightly future instant from clock skew). Spec E08: "Vừa xong". */
const JUST_NOW: Record<Locale, string> = { vi: "Vừa xong", en: "Just now" };

const formatters = new Map<Locale, Intl.RelativeTimeFormat>();
const formatterFor = (locale: Locale) => {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
    formatters.set(locale, formatter);
  }
  return formatter;
};

/**
 * Relative time of a notification row ("15 phút trước", "1 giờ trước", "1 tuần trước"…; FR-202).
 * Whole units, floored, so a row never looks older than it is: 59 min stays minutes, 7 days is
 * "1 tuần", 30 days is "1 tháng", 365 days is "1 năm". `now` is passed in so the call is pure.
 */
export function formatNotificationRelativeTime(iso: string, now: Date, locale: Locale): string {
  const elapsed = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(elapsed)) return "";
  if (elapsed < MINUTE) return JUST_NOW[locale];
  const [unit, size] = UNITS.find(([, length]) => elapsed >= length) ?? UNITS[UNITS.length - 1];
  return formatterFor(locale).format(-Math.floor(elapsed / size), unit);
}
