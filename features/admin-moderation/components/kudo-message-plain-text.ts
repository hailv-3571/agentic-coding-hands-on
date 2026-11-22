import type { KudoInlineNode, KudoListNode, KudoParagraphNode } from "@/features/kudos-feed/markdown/kudo-body-ast";
import { parseKudoBody } from "@/features/kudos-feed/markdown/parse-kudo-body";

function inlineText(nodes: KudoInlineNode[]): string {
  return nodes
    .map((node) => (node.type === "text" ? node.value : node.type === "break" ? " " : inlineText(node.children)))
    .join("");
}

function blockText(block: KudoParagraphNode | KudoListNode): string[] {
  return block.type === "paragraph" ? [inlineText(block.children)] : block.items.map((item) => inlineText(item.children));
}

/**
 * A Kudo message as one line of plain text for the admin table (Content column): parsed by the
 * same whitelist parser as the Live board (`parseKudoBody`), then only the text is kept, so
 * Markdown markers and link URLs disappear and anything else (HTML included) stays literal text.
 * The result is rendered as a React text child, never as markup. Pure.
 */
export function kudoMessagePlainText(body: string): string {
  const parts = parseKudoBody(body).flatMap((block) => (block.type === "quote" ? block.children.flatMap(blockText) : blockText(block)));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
