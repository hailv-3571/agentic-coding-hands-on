/**
 * Link rules of the Kudo body renderer (phase-04-backend-contracts § 1.1): only inline links
 * `[text](http(s)://…)` and bare `http(s)://…` autolinks. Every href is validated again here with
 * `new URL()` + protocol http:/https: + no `user:pw@` credentials — the write-time policy is only
 * a backstop. No entity decoding (`java&#115;cript:` stays text), no reference links, no `<…>`
 * destinations.
 * Pure and client-safe; every scan is linear in its input.
 */
const ASCII_PUNCTUATION = /^[!-/:-@[-`{-~]$/;
const HTTP_PREFIX = /^https?:\/\//i;
/** Longest inline-link destination considered (bounds the scan on adversarial input). */
const DESTINATION_MAX = 2048;

export const isAsciiPunctuation = (char: string | undefined): boolean =>
  char !== undefined && ASCII_PUNCTUATION.test(char);

const isInlineSpace = (char: string | undefined) => char === " " || char === "\t";

/** Normalized href of an absolute http(s) URL with a host and no credentials; null for anything else. */
export function safeHttpHref(candidate: string): string | null {
  if (!HTTP_PREFIX.test(candidate)) return null;
  try {
    const url = new URL(candidate);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname) return null;
    // `http://trusted.com@evil.com` reads as trusted.com but goes to evil.com: never link userinfo.
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function skipInlineSpaces(text: string, at: number): number {
  let next = at;
  while (isInlineSpace(text[next])) next += 1;
  return next;
}

/**
 * The `(destination "optional title")` after a link label; `open` is the index of `(`. Returns
 * the validated href and the index of the closing `)`, or null (the caller keeps the text as is).
 * Destinations may hold balanced parentheses (`…/Foo_(bar)`) and backslash-escaped punctuation
 * (`x\)y` → `x)y`: an escaped `)` stays in the destination).
 */
export function parseInlineLinkTail(text: string, open: number): { href: string; end: number } | null {
  let at = skipInlineSpaces(text, open + 1);
  let destination = "";
  let depth = 0;
  for (; at < text.length; at += 1) {
    const char = text[at];
    if (char === "\\" && isAsciiPunctuation(text[at + 1])) {
      at += 1;
      destination += text[at];
    } else if (char === ")" && depth === 0) {
      break;
    } else if (/\s/.test(char)) {
      break;
    } else {
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      destination += char;
    }
    if (destination.length > DESTINATION_MAX) return null;
  }
  at = skipInlineSpaces(text, at);
  const quote = text[at];
  if (quote === '"' || quote === "'") {
    const close = text.indexOf(quote, at + 1);
    if (close < 0 || text.slice(at + 1, close).includes("\n")) return null;
    at = skipInlineSpaces(text, close + 1); // the title itself is not rendered
  }
  if (text[at] !== ")") return null;
  const href = safeHttpHref(destination);
  return href ? { href, end: at } : null;
}

/** Characters a bare URL may start after (start of text counts too). */
const AUTOLINK_BOUNDARY = /[\s(<[*_~"']/;
const AUTOLINK_STOP = /[\s<>"`]/;
/** GFM: trailing punctuation is not part of an autolink. */
const TRAILING_PUNCTUATION = /[?!.,:;*_~'"]/;

/**
 * A bare lowercase `http://` / `https://` URL starting at `at`: the literal URL text, its
 * validated href and the index just past it. Trailing punctuation and unbalanced `)` are left out.
 */
export function scanAutolink(text: string, at: number): { href: string; value: string; end: number } | null {
  if (text[at] !== "h" || !(text.startsWith("http://", at) || text.startsWith("https://", at))) return null;
  if (at > 0 && !AUTOLINK_BOUNDARY.test(text[at - 1])) return null;
  let end = at;
  let opened = 0;
  let closed = 0;
  for (; end < text.length && !AUTOLINK_STOP.test(text[end]); end += 1) {
    if (text[end] === "(") opened += 1;
    if (text[end] === ")") closed += 1;
  }
  while (end > at) {
    const last = text[end - 1];
    if (TRAILING_PUNCTUATION.test(last)) end -= 1;
    else if (last === ")" && closed > opened) {
      end -= 1;
      closed -= 1;
    } else break;
  }
  const value = text.slice(at, end);
  const href = safeHttpHref(value);
  return href ? { href, value, end } : null;
}
