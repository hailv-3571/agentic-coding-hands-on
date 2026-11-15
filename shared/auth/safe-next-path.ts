/**
 * Open-redirect guard for the `next` return path (DEC-001). Only same-origin paths survive:
 * must start with a single `/`, no `//` or backslash (browsers treat `/\host` as `//host`),
 * no control characters (the URL parser strips tab/newline, turning `/\t/host` into
 * `//host`). The prefix rule is checked again AFTER URL normalization, because dot segments
 * (`/..//host`, `/%2e%2e//host`) resolve to a protocol-relative `//host`. Pure: safe in the
 * proxy, route handlers, actions and client components.
 */
const MAX_NEXT_PATH_LENGTH = 2048;
const PROBE_ORIGIN = "http://next-path.invalid";
const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f\\]/;

const isSameOriginPath = (path: string) => path.startsWith("/") && !path.startsWith("//");

export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || raw.length > MAX_NEXT_PATH_LENGTH) return fallback;
  if (!isSameOriginPath(raw) || UNSAFE_CHARACTERS.test(raw)) return fallback;
  try {
    const url = new URL(raw, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return fallback;
    const normalized = `${url.pathname}${url.search}${url.hash}`;
    return isSameOriginPath(normalized) ? normalized : fallback;
  } catch {
    // Unparseable input is simply not a safe path: the fallback is the answer, not an error.
    return fallback;
  }
}
