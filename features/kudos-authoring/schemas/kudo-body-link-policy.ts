/**
 * Link policy for the Kudo body (decision-log 2026-11-15, restricted Markdown stored as raw
 * text). Every Markdown link/image target must be an absolute http(s) URL, and the body may not
 * carry a bare URL of another scheme. HTML is never stored or rendered; the phase 05 renderer
 * escapes everything and autolinks http(s) only — this check stops bad links at write time.
 * Markdown images are rejected outright (`findMarkdownImages`, field error imageNotAllowed).
 * Client-safe (no server imports): the composer shows the same field error before submit.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Bare `scheme://…` anywhere in the text (the scheme must start at a word boundary). */
const BARE_URL_SCHEME = /(?<![a-z0-9+.-])([a-z][a-z0-9+.-]*):\/\//gi;
/** Script-capable or opaque schemes written without `//`, e.g. `javascript:alert(1)`. */
const BARE_ACTIVE_SCHEME = /(?<![a-z0-9+.-])(?:javascript|vbscript|data|file|blob):(?=\S)/gi;
/**
 * Link reference definition `[label]: target` (review W1). Only inline links are allowed, so a
 * definition is rejected whatever its target: its target never reaches `isHttpUrl`, and a
 * renderer that decodes entities would follow `java&#115;cript:`. A superset of
 * `/^ {0,3}\[[^\]]+\]:/m`: also inside block quotes / list items and with `\]` in the label.
 * Without a definition, `[text][ref]` and `[text]` are plain text, so usages need no check.
 * As in CommonMark a label holds no unescaped bracket and at most 999 characters, which also
 * keeps the scan linear.
 */
const REFERENCE_DEFINITION = /^(?:[ \t]*(?:>|(?:[-+*]|\d{1,9}[.)])[ \t]))*[ \t]*(\[(?:\\[\s\S]|[^\\[\]]){1,999}\]:)/gm;

function isHttpUrl(target: string): boolean {
  try {
    // WHATWG parsing strips tabs/newlines like a browser would, so `java\tscript:` is caught.
    return ALLOWED_PROTOCOLS.has(new URL(target).protocol);
  } catch {
    return false; // relative, empty, entity-encoded or otherwise not an absolute URL
  }
}

/**
 * Raw destinations of every `](…)` in the body (links and images), with balanced parentheses
 * as in CommonMark (`…/Foo_(bar)`). An unclosed destination runs to the end of the text, so it
 * is checked too rather than skipped.
 */
function markdownLinkDestinations(body: string): string[] {
  const destinations: string[] = [];
  let from = 0;
  for (let start = body.indexOf("](", from); start >= 0; start = body.indexOf("](", from)) {
    let depth = 1;
    let index = start + 2;
    for (; index < body.length && depth > 0; index += 1) {
      const char = body[index];
      if (char === "\\") index += 1;
      else if (char === "(") depth += 1;
      else if (char === ")") depth -= 1;
    }
    destinations.push(body.slice(start + 2, depth === 0 ? index - 1 : body.length).trim());
    from = start + 2;
  }
  return destinations;
}

/** `<url>` or `url "title"` → the URL part the renderer would follow. */
function hrefOf(destination: string): string {
  const unwrapped = destination.startsWith("<") ? destination.slice(1).replace(/>$/, "") : destination;
  return unwrapped.split(/\s/, 1)[0] ?? "";
}

/** Offending link targets / bare schemes in `body`; an empty list means the body is acceptable. */
export function findDisallowedLinks(body: string): string[] {
  const offending = markdownLinkDestinations(body).filter((destination) => !isHttpUrl(hrefOf(destination)));
  for (const match of body.matchAll(BARE_URL_SCHEME)) {
    if (!ALLOWED_PROTOCOLS.has(`${match[1].toLowerCase()}:`)) offending.push(match[0]);
  }
  for (const match of body.matchAll(BARE_ACTIVE_SCHEME)) offending.push(match[0]);
  for (const match of body.matchAll(REFERENCE_DEFINITION)) offending.push(match[1]);
  return offending;
}

/** True when the character at `index` is backslash-escaped (an odd run of `\` before it). */
function isEscaped(text: string, index: number): boolean {
  let slashes = 0;
  for (let at = index - 1; at >= 0 && text[at] === "\\"; at -= 1) slashes += 1;
  return slashes % 2 === 1;
}

/** Index of the unescaped `[` that balances the `]` at `close`, or -1. */
function openingBracket(text: string, close: number): number {
  let depth = 0;
  for (let at = close; at >= 0; at -= 1) {
    if (isEscaped(text, at)) continue;
    if (text[at] === "]") depth += 1;
    else if (text[at] === "[" && --depth === 0) return at;
  }
  return -1;
}

/**
 * Markdown images `![alt](…)` in the body (decision 2026-11-16: images are not allowed in the body,
 * whatever the target; Kudo images come only from `imagePaths`). Returns each `![alt]`; empty = OK.
 * `\![x](…)` is an escaped `!` plus a link, so it passes. Reference images need a definition,
 * which `findDisallowedLinks` already rejects. Quadratic at worst on the ≤ 1,000-character body.
 */
export function findMarkdownImages(body: string): string[] {
  const images: string[] = [];
  for (let close = body.indexOf("]("); close >= 0; close = body.indexOf("](", close + 1)) {
    if (isEscaped(body, close)) continue;
    const open = openingBracket(body, close);
    if (open > 0 && body[open - 1] === "!" && !isEscaped(body, open - 1)) images.push(body.slice(open - 1, close + 1));
  }
  return images;
}
