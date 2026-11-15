/**
 * Supported UI locales. The active locale comes from the `NEXT_LOCALE` cookie (no URL
 * prefix); anything missing or unknown falls back to Vietnamese.
 */
export const locales = ["vi", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export const localeCookieName = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
