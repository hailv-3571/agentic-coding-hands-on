import type { KudoInlineNode } from "./kudo-body-ast";
import { isAsciiPunctuation, parseInlineLinkTail, scanAutolink } from "./kudo-body-links";

/**
 * Inline whitelist: `**bold**`, `_italic_`, `~~strike~~`, backslash escapes, line breaks, inline
 * http(s) links and bare http(s) autolinks. Anything else — `*x*`, `__x__` as strong, HTML,
 * entities, `![img](…)`, reference links — stays literal text. A hand-written scanner (no
 * backtracking regex) plus one delimiter stack, as in CommonMark but simplified: a closer
 * matches the nearest open delimiter of its kind, and unmatched markers become text.
 */
type DelimiterKind = "strong" | "emphasis" | "strike";
type Delimiter = { type: "delimiter"; kind: DelimiterKind; raw: string; canOpen: boolean; canClose: boolean };
type Piece = KudoInlineNode | Delimiter;

const WORD_CHAR = /[\p{L}\p{N}]/u;
/** Start and end of the text count as whitespace (CommonMark flanking rules). */
const isSpace = (char: string | undefined) => char === undefined || /\s/.test(char);
const isWord = (char: string | undefined) => char !== undefined && WORD_CHAR.test(char);

const KIND_OF: Record<string, DelimiterKind> = { "*": "strong", "~": "strike", _: "emphasis" };

/** Index of every `[` → its balancing `]` (escaped brackets ignored), in one pass. */
function bracketPairs(text: string): Map<number, number> {
  const pairs = new Map<number, number>();
  const open: number[] = [];
  for (let at = 0; at < text.length; at += 1) {
    if (text[at] === "\\") at += 1;
    else if (text[at] === "[") open.push(at);
    else if (text[at] === "]" && open.length > 0) pairs.set(open.pop() as number, at);
  }
  return pairs;
}

function mergeText(pieces: Piece[]): KudoInlineNode[] {
  const nodes: KudoInlineNode[] = [];
  for (const piece of pieces) {
    const node: KudoInlineNode = piece.type === "delimiter" ? { type: "text", value: piece.raw } : piece;
    const last = nodes.at(-1);
    if (node.type === "text" && last?.type === "text") nodes[nodes.length - 1] = { type: "text", value: last.value + node.value };
    else nodes.push(node);
  }
  return nodes;
}

/** Closes the nearest open delimiter of the same kind, or opens, or falls back to text. */
function addDelimiter(pieces: Piece[], openers: number[], delimiter: Delimiter): void {
  if (delimiter.canClose) {
    for (let level = openers.length - 1; level >= 0; level -= 1) {
      const index = openers[level];
      if ((pieces[index] as Delimiter).kind !== delimiter.kind) continue;
      if (index === pieces.length - 1) break; // `****`: an empty span is not emphasis
      const children = pieces.splice(index).slice(1);
      pieces.push({ type: delimiter.kind, children: mergeText(children) });
      openers.length = level; // openers inside the span are now plain text
      return;
    }
  }
  if (delimiter.canOpen) {
    openers.push(pieces.length);
    pieces.push(delimiter);
  } else {
    pieces.push({ type: "text", value: delimiter.raw });
  }
}

/** A run of `*`, `~` or `_` at [start, end): `**`/`~~` pairs or single `_`, odd rest literal. */
function addDelimiterRun(pieces: Piece[], openers: number[], text: string, start: number, end: number): void {
  const char = text[start];
  const before = text[start - 1];
  const after = text[end];
  const intraword = char === "_";
  const canOpen = !isSpace(after) && !(intraword && isWord(before));
  const canClose = !isSpace(before) && !(intraword && isWord(after));
  const size = intraword ? 1 : 2;
  const length = end - start;
  for (let used = 0; used + size <= length; used += size) {
    addDelimiter(pieces, openers, { type: "delimiter", kind: KIND_OF[char], raw: char.repeat(size), canOpen, canClose });
  }
  if (length % size > 0) pieces.push({ type: "text", value: char.repeat(length % size) });
}

/** Inline nodes of `text`; `allowLinks` is false inside a link label (links never nest). */
export function parseKudoInline(text: string, allowLinks = true): KudoInlineNode[] {
  const pieces: Piece[] = [];
  const openers: number[] = [];
  const pairs = allowLinks ? bracketPairs(text) : null;
  let buffer = "";
  const flush = () => {
    if (buffer) pieces.push({ type: "text", value: buffer });
    buffer = "";
  };

  let at = 0;
  while (at < text.length) {
    const char = text[at];
    if (char === "\\" && isAsciiPunctuation(text[at + 1])) {
      buffer += text[at + 1];
      at += 2;
    } else if (char === "\n") {
      flush();
      pieces.push({ type: "break" });
      at += 1;
    } else if (char === "*" || char === "~" || char === "_") {
      let end = at + 1;
      while (text[end] === char) end += 1;
      flush();
      addDelimiterRun(pieces, openers, text, at, end);
      at = end;
    } else {
      const link = pairs ? linkAt(text, at, pairs) : null;
      if (link) {
        flush();
        pieces.push(link.node);
        at = link.end;
      } else {
        buffer += char;
        at += 1;
      }
    }
  }
  flush();
  return mergeText(pieces);
}

/** `text[at - 1]` is a `!` that no backslash escapes (an odd run of `\` before it escapes it). */
function followsUnescapedBang(text: string, at: number): boolean {
  if (text[at - 1] !== "!") return false;
  let backslashes = 0;
  while (text[at - 2 - backslashes] === "\\") backslashes += 1;
  return backslashes % 2 === 0;
}

/**
 * An inline link or autolink starting at `at`, with the index just past it. Image syntax
 * `![label](http(s)://…)` returns its `[label](…)` part as ONE literal text node, so neither a
 * link with a hidden URL nor an autolink of the bare URL inside it is rendered.
 */
function linkAt(text: string, at: number, pairs: Map<number, number>): { node: KudoInlineNode; end: number } | null {
  if (text[at] === "[") {
    const close = pairs.get(at);
    const tail = close !== undefined && text[close + 1] === "(" ? parseInlineLinkTail(text, close + 1) : null;
    if (!tail || close === undefined) return null;
    const end = tail.end + 1;
    if (followsUnescapedBang(text, at)) return { node: { type: "text", value: text.slice(at, end) }, end };
    return { node: { type: "link", href: tail.href, children: parseKudoInline(text.slice(at + 1, close), false) }, end };
  }
  const autolink = scanAutolink(text, at);
  if (!autolink) return null;
  return { node: { type: "link", href: autolink.href, children: [{ type: "text", value: autolink.value }] }, end: autolink.end };
}
