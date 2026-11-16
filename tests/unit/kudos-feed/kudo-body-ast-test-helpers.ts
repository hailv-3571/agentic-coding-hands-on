import type { KudoBodyNode, KudoInlineNode } from "@/features/kudos-feed/markdown/kudo-body-ast";

/** AST builders and walkers shared by the parseKudoBody unit tests. */
export const text = (value: string): KudoInlineNode => ({ type: "text", value });
export const paragraph = (...children: KudoInlineNode[]): KudoBodyNode => ({ type: "paragraph", children });
export const link = (href: string, ...children: KudoInlineNode[]): KudoInlineNode => ({ type: "link", href, children });

export type AnyNode = KudoBodyNode | KudoInlineNode;
export function walk(nodes: AnyNode[], visit: (node: AnyNode) => void): void {
  for (const node of nodes) {
    visit(node);
    if ("children" in node) walk(node.children as AnyNode[], visit);
    if (node.type === "list") node.items.forEach((item) => walk(item.children, visit));
  }
}
export const nodeTypes = (nodes: AnyNode[]) => {
  const types = new Set<string>();
  walk(nodes, (node) => types.add(node.type));
  return types;
};
export const hrefs = (nodes: AnyNode[]) => {
  const found: string[] = [];
  walk(nodes, (node) => node.type === "link" && found.push(node.href));
  return found;
};
export const plainText = (nodes: AnyNode[]) => {
  let out = "";
  walk(nodes, (node) => {
    if (node.type === "text") out += node.value;
  });
  return out;
};
export const ALLOWED_TYPES = new Set(["paragraph", "list", "quote", "text", "break", "strong", "emphasis", "strike", "link"]);
