import type { ReactNode } from "react";
import type { KudoBodyNode, KudoInlineNode, KudoListNode, KudoParagraphNode } from "../markdown/kudo-body-ast";
import { parseKudoBody } from "../markdown/parse-kudo-body";

/**
 * Whitelist renderer of a Kudo body (decision-log 2026-11-15/16, phase-05-backend-contracts § 3):
 * `parseKudoBody` → React elements only. Text is always a React text child (escaped); there is no
 * `dangerouslySetInnerHTML` and no node type that could carry markup. Links open in a new tab
 * with `noopener noreferrer nofollow`; an href that is not http(s) (the parser never emits one)
 * renders as plain text. Unknown node types render nothing. Safe in server and client trees.
 */
export function KudoBodyMarkdown({ body, className = "" }: { body: string; className?: string }) {
  return <div className={`${bodyElementStyles} ${className}`.trim()}>{parseKudoBody(body).map(renderBlock)}</div>;
}

/** Styles for the whitelisted elements (Tailwind preflight strips list markers and link underlines). */
const bodyElementStyles =
  "[&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-7 [&_ul]:list-disc [&_ul]:pl-7";

const SAFE_HREF = /^https?:\/\//i;

function renderInline(node: KudoInlineNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return node.value;
    case "break":
      return <br key={key} />;
    case "strong":
      return <strong key={key}>{node.children.map(renderInline)}</strong>;
    case "emphasis":
      return <em key={key}>{node.children.map(renderInline)}</em>;
    case "strike":
      return <s key={key}>{node.children.map(renderInline)}</s>;
    case "link":
      if (!SAFE_HREF.test(node.href)) return <span key={key}>{node.children.map(renderInline)}</span>;
      return (
        <a key={key} href={node.href} target="_blank" rel="noopener noreferrer nofollow">
          {node.children.map(renderInline)}
        </a>
      );
    default:
      return null;
  }
}

function renderParagraph(node: KudoParagraphNode, key: number): ReactNode {
  return <p key={key}>{node.children.map(renderInline)}</p>;
}

function renderList(node: KudoListNode, key: number): ReactNode {
  const items = node.items.map((item, index) => <li key={index}>{item.children.map(renderInline)}</li>);
  return node.ordered ? (
    <ol key={key} start={node.start}>
      {items}
    </ol>
  ) : (
    <ul key={key}>{items}</ul>
  );
}

function renderBlock(node: KudoBodyNode, key: number): ReactNode {
  switch (node.type) {
    case "paragraph":
      return renderParagraph(node, key);
    case "list":
      return renderList(node, key);
    case "quote":
      return (
        <blockquote key={key}>
          {node.children.map((child, index) => (child.type === "list" ? renderList(child, index) : renderParagraph(child, index)))}
        </blockquote>
      );
    default:
      return null;
  }
}
