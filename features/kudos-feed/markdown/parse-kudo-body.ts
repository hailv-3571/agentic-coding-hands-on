import type { KudoBodyNode, KudoListItem, KudoListNode, KudoParagraphNode } from "./kudo-body-ast";
import { parseKudoInline } from "./parse-kudo-inline";

/**
 * `parseKudoBody(raw)` — the whitelist parser of a Kudo body (restricted Markdown stored as raw
 * text, ≤ 1,000 characters; decision-log 2026-11-15/16, phase-04-backend-contracts § 1.1).
 * Blocks: paragraphs (single newline = line break), `- ` / `1. ` lists, `> ` quotes (one level).
 * Everything else — headings, code, tables, HTML, reference definitions, images — is literal
 * text. Pure, no React, no DOM: usable in server and client components alike. Line regexes are
 * anchored with disjoint character classes, so they cannot backtrack.
 */
const QUOTE_MARKER = /^ {0,3}> ?/;
// `[\s\S]` (not `.`): a line may hold U+2028/U+2029; no `s` flag at the ES2017 target.
const BULLET_ITEM = /^ {0,3}-[ \t]+(\S[\s\S]*)$/;
const ORDERED_ITEM = /^ {0,3}(\d{1,9})\.[ \t]+(\S[\s\S]*)$/;
const BLANK_LINE = /^\s*$/;
/**
 * Parse budget in UTF-16 units. The write path caps a body at 1,000 code points (≤ 2,000 UTF-16
 * units), so a stored body never reaches it; the cap only keeps the parser self-defending (bounded
 * work) if a longer string ever arrives. Beyond it the body is truncated, not refused, so the start
 * still renders; a surrogate pair cut at the boundary only ever affects such out-of-contract input.
 */
const PARSE_MAX_LENGTH = 5000;

type ListItemLine = { ordered: boolean; number: number; content: string };

function listItemOf(line: string): ListItemLine | null {
  const bullet = BULLET_ITEM.exec(line);
  if (bullet) return { ordered: false, number: 0, content: bullet[1].trim() };
  const ordered = ORDERED_ITEM.exec(line);
  return ordered ? { ordered: true, number: Number(ordered[1]), content: ordered[2].trim() } : null;
}

/** Paragraphs and lists of a run of lines that holds no quote marker. */
function parseFlatBlocks(lines: string[]): (KudoParagraphNode | KudoListNode)[] {
  const blocks: (KudoParagraphNode | KudoListNode)[] = [];
  let at = 0;
  while (at < lines.length) {
    if (BLANK_LINE.test(lines[at])) {
      at += 1;
      continue;
    }
    const first = listItemOf(lines[at]);
    if (first) {
      const items: KudoListItem[] = [];
      for (let item: ListItemLine | null = first; item?.ordered === first.ordered; item = listItemOf(lines[at] ?? "")) {
        items.push({ children: parseKudoInline(item.content) });
        at += 1;
      }
      blocks.push(first.ordered ? { type: "list", ordered: true, start: first.number, items } : { type: "list", ordered: false, items });
      continue;
    }
    const paragraph: string[] = [];
    for (; at < lines.length && !BLANK_LINE.test(lines[at]) && !listItemOf(lines[at]); at += 1) {
      paragraph.push(lines[at].trim());
    }
    blocks.push({ type: "paragraph", children: parseKudoInline(paragraph.join("\n")) });
  }
  return blocks;
}

export function parseKudoBody(raw: string): KudoBodyNode[] {
  const lines = raw.slice(0, PARSE_MAX_LENGTH).replace(/\r\n?/g, "\n").split("\n");
  const blocks: KudoBodyNode[] = [];
  let at = 0;
  while (at < lines.length) {
    // Consecutive lines that are all quoted (or all not) form one segment.
    const quoted = QUOTE_MARKER.test(lines[at]);
    const segment: string[] = [];
    for (; at < lines.length && QUOTE_MARKER.test(lines[at]) === quoted; at += 1) {
      segment.push(quoted ? lines[at].replace(QUOTE_MARKER, "") : lines[at]);
    }
    const children = parseFlatBlocks(segment);
    if (!quoted) blocks.push(...children);
    else if (children.length > 0) blocks.push({ type: "quote", children });
  }
  return blocks;
}
