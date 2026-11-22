import type { ReactNode } from "react";
import type { KudoBodyNode, KudoInlineNode, KudoListNode, KudoParagraphNode } from "../markdown/kudo-body-ast";
import { parseKudoBody } from "../markdown/parse-kudo-body";

/**
 * Whitelist renderer of a Kudo body (decision-log 2026-11-15/16, phase-05-backend-contracts § 3):
 * `parseKudoBody` → React elements only. Text is always a React text child (escaped); there is no
 * `dangerouslySetInnerHTML` and no node type that could carry markup. Links open in a new tab
 * with `noopener noreferrer nofollow`; an href that is not http(s) (the parser never emits one)
 * renders as plain text. Unknown node types render nothing. Safe in server and client trees.
 * `tabbable={false}` (the owner's spam Kudo under its overlay, phase 08 review W1) keeps the links
 * out of the Tab order while screen readers still read them.
 */
export function KudoBodyMarkdown({ body, className = "", tabbable = true }: { body: string; className?: string; tabbable?: boolean }) {
  const options: RenderOptions = { linkTabIndex: tabbable ? undefined : -1 };
  return (
    <div className={`${bodyElementStyles} ${className}`.trim()}>{parseKudoBody(body).map((node, index) => renderBlock(node, index, options))}</div>
  );
}

/** Styles for the whitelisted elements (Tailwind preflight strips list markers and link underlines). */
const bodyElementStyles =
  "[&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-7 [&_ul]:list-disc [&_ul]:pl-7";

const SAFE_HREF = /^https?:\/\//i;

type RenderOptions = { linkTabIndex: number | undefined };

function renderInlines(nodes: KudoInlineNode[], options: RenderOptions): ReactNode[] {
  return nodes.map((node, index) => renderInline(node, index, options));
}

function renderInline(node: KudoInlineNode, key: number, options: RenderOptions): ReactNode {
  switch (node.type) {
    case "text":
      return node.value;
    case "break":
      return <br key={key} />;
    case "strong":
      return <strong key={key}>{renderInlines(node.children, options)}</strong>;
    case "emphasis":
      return <em key={key}>{renderInlines(node.children, options)}</em>;
    case "strike":
      return <s key={key}>{renderInlines(node.children, options)}</s>;
    case "link":
      if (!SAFE_HREF.test(node.href)) return <span key={key}>{renderInlines(node.children, options)}</span>;
      return (
        <a key={key} href={node.href} target="_blank" rel="noopener noreferrer nofollow" tabIndex={options.linkTabIndex}>
          {renderInlines(node.children, options)}
        </a>
      );
    default:
      return null;
  }
}

function renderParagraph(node: KudoParagraphNode, key: number, options: RenderOptions): ReactNode {
  return <p key={key}>{renderInlines(node.children, options)}</p>;
}

function renderList(node: KudoListNode, key: number, options: RenderOptions): ReactNode {
  const items = node.items.map((item, index) => <li key={index}>{renderInlines(item.children, options)}</li>);
  return node.ordered ? (
    <ol key={key} start={node.start}>
      {items}
    </ol>
  ) : (
    <ul key={key}>{items}</ul>
  );
}

function renderBlock(node: KudoBodyNode, key: number, options: RenderOptions): ReactNode {
  switch (node.type) {
    case "paragraph":
      return renderParagraph(node, key, options);
    case "list":
      return renderList(node, key, options);
    case "quote":
      return (
        <blockquote key={key}>
          {node.children.map((child, index) => (child.type === "list" ? renderList(child, index, options) : renderParagraph(child, index, options)))}
        </blockquote>
      );
    default:
      return null;
  }
}
