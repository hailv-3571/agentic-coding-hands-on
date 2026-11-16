/**
 * AST of a Kudo body (restricted Markdown, decision-log 2026-11-15/16; phase-04-backend-contracts
 * § 1.1). The ONLY node types a renderer has to map to React elements — there is no HTML node,
 * no image node and no node carrying raw markup. Every `text` value is literal: render it as a
 * React text child (escaped), never through `dangerouslySetInnerHTML`.
 */
export type KudoTextNode = { type: "text"; value: string };
/** A single newline inside a paragraph → `<br />`. */
export type KudoBreakNode = { type: "break" };
export type KudoStrongNode = { type: "strong"; children: KudoInlineNode[] };
export type KudoEmphasisNode = { type: "emphasis"; children: KudoInlineNode[] };
export type KudoStrikeNode = { type: "strike"; children: KudoInlineNode[] };
/**
 * `href` is an absolute http(s) URL without credentials, already validated with `new URL()` and
 * normalized (`URL.href`).
 * Render `<a href={href} target="_blank" rel="noopener noreferrer nofollow">`. Never nested.
 */
export type KudoLinkNode = { type: "link"; href: string; children: KudoInlineNode[] };

export type KudoInlineNode =
  | KudoTextNode
  | KudoBreakNode
  | KudoStrongNode
  | KudoEmphasisNode
  | KudoStrikeNode
  | KudoLinkNode;

export type KudoListItem = { children: KudoInlineNode[] };

export type KudoParagraphNode = { type: "paragraph"; children: KudoInlineNode[] };
/** `- item` lines. */
export type KudoUnorderedListNode = { type: "list"; ordered: false; items: KudoListItem[] };
/** `1. item` lines; `start` is the first item's number (`<ol start={start}>`). */
export type KudoOrderedListNode = { type: "list"; ordered: true; start: number; items: KudoListItem[] };
export type KudoListNode = KudoUnorderedListNode | KudoOrderedListNode;
/** `> …` lines. Holds paragraphs and lists, never another quote. */
export type KudoQuoteNode = { type: "quote"; children: (KudoParagraphNode | KudoListNode)[] };

/** Top-level block of a parsed body (`parseKudoBody` returns `KudoBodyNode[]`). */
export type KudoBodyNode = KudoParagraphNode | KudoListNode | KudoQuoteNode;
