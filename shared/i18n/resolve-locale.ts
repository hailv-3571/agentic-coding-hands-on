import { defaultLocale, isLocale, locales, type Locale } from "./locales";

type ResolveLocaleInput = {
  /** Raw value of the NEXT_LOCALE cookie, if present. */
  cookie?: string | null;
  /** Raw `Accept-Language` header, if present. */
  acceptLanguage?: string | null;
};

/** First supported locale in an `Accept-Language` header, honouring q-values (BR-001). */
function fromAcceptLanguage(header: string): Locale | null {
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      const primary = tag.trim().toLowerCase().split("-")[0] ?? "";
      return { primary, q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((entry) => entry.q > 0 && (locales as readonly string[]).includes(entry.primary))
    .sort((a, b) => b.q - a.q || a.index - b.index);
  const best = ranked[0]?.primary;
  return isLocale(best) ? best : null;
}

/**
 * BR-001: saved cookie, then `Accept-Language` (vi/en only), then `vi`.
 * An unknown cookie value is ignored rather than trusted.
 */
export function resolveLocale({ cookie, acceptLanguage }: ResolveLocaleInput): Locale {
  if (isLocale(cookie)) return cookie;
  if (acceptLanguage) {
    const fromHeader = fromAcceptLanguage(acceptLanguage);
    if (fromHeader) return fromHeader;
  }
  return defaultLocale;
}
