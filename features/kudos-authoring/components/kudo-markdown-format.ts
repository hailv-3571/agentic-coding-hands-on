import { KUDO_LIMITS, kudoTextLength } from "../kudo-authoring-limits";

/**
 * Pure text transforms behind the message editor (decision-log 2026-11-15: restricted Markdown
 * — `**bold**`, `_italic_`, `~~strike~~`, `1.` lists, `> quote`, `[text](http(s)://…)` — stored
 * as raw text, ≤ 1,000 code points). Each edit returns the new value plus the selection to
 * restore, or `null` when the result would pass the length limit (hard stop: nothing changes).
 */
export type TextEdit = { value: string; selectionStart: number; selectionEnd: number };

export type InlineMarker = "**" | "_" | "~~";
export type LinePrefix = "numbered" | "quote";

function withinLimit(edit: TextEdit, max: number): TextEdit | null {
  return kudoTextLength(edit.value) <= max ? edit : null;
}

/** Keeps the first `max` code points (typing/paste hard stop; never splits an emoji). */
export function clampToLength(value: string, max: number): string {
  return kudoTextLength(value) <= max ? value : Array.from(value).slice(0, max).join("");
}

/** Wraps the selection in `marker`; with no selection, inserts a pair and puts the caret inside. */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  marker: InlineMarker,
  max: number = KUDO_LIMITS.BODY_MAX,
): TextEdit | null {
  const selected = value.slice(start, end);
  const next = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`;
  return withinLimit(
    { value: next, selectionStart: start + marker.length, selectionEnd: end + marker.length },
    max,
  );
}

/**
 * Prefixes every line touched by the selection: `1. `, `2. `… for a numbered list, `> ` for a
 * quote. The selection grows to whole lines and stays around the edited block.
 */
export function prefixSelectedLines(
  value: string,
  start: number,
  end: number,
  prefix: LinePrefix,
  max: number = KUDO_LIMITS.BODY_MAX,
): TextEdit | null {
  const blockStart = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  // A selection ending right after a newline does not reach into the next line.
  const newline = value.indexOf("\n", end > start && value[end - 1] === "\n" ? end - 1 : end);
  const blockEnd = newline === -1 ? value.length : newline;
  const lines = value.slice(blockStart, blockEnd).split("\n");
  const block = lines.map((line, index) => `${prefix === "numbered" ? `${index + 1}. ` : "> "}${line}`).join("\n");
  const next = `${value.slice(0, blockStart)}${block}${value.slice(blockEnd)}`;
  const blockEndAfter = blockStart + block.length;
  // No selection: caret after the block so typing continues the line instead of replacing it.
  return withinLimit(
    { value: next, selectionStart: start === end ? blockEndAfter : blockStart, selectionEnd: blockEndAfter },
    max,
  );
}

/** True for an absolute http(s) URL — the only link targets the body policy accepts. */
export function isHttpUrl(candidate: string): boolean {
  try {
    const { protocol } = new URL(candidate.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * `[text](url)` replacing the selection; brackets in the text are escaped. The URL is normalized
 * (WHATWG encodes spaces as %20) and `(` `)` become %28 %29, so a `)` in the URL can never end
 * the Markdown destination early (review W3).
 */
export function insertLink(
  value: string,
  start: number,
  end: number,
  text: string,
  url: string,
  max: number = KUDO_LIMITS.BODY_MAX,
): TextEdit | null {
  if (!isHttpUrl(url)) return null;
  const href = new URL(url.trim()).href.replace(/[()]/g, (paren) => (paren === "(" ? "%28" : "%29"));
  const label = (text.trim() || href).replace(/([[\]\\])/g, "\\$1");
  const link = `[${label}](${href})`;
  const next = `${value.slice(0, start)}${link}${value.slice(end)}`;
  const caret = start + link.length;
  return withinLimit({ value: next, selectionStart: caret, selectionEnd: caret }, max);
}

/** An "@query" being typed right before the caret ("@" at the start or after whitespace). */
export type MentionQuery = { start: number; query: string };

export function findMentionQuery(value: string, caret: number): MentionQuery | null {
  const before = value.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]))) return null;
  const query = before.slice(at + 1);
  if (!query || /^\s/.test(query) || /[\n@]/.test(query) || query.length > 50) return null;
  return { start: at, query };
}

/** Replaces the "@query" with the plain-text token "@Full Name " (D011: no mention table). */
export function insertMention(
  value: string,
  mention: MentionQuery,
  caret: number,
  fullName: string,
  max: number = KUDO_LIMITS.BODY_MAX,
): TextEdit | null {
  const token = `@${fullName} `;
  const next = `${value.slice(0, mention.start)}${token}${value.slice(caret)}`;
  const position = mention.start + token.length;
  return withinLimit({ value: next, selectionStart: position, selectionEnd: position }, max);
}
