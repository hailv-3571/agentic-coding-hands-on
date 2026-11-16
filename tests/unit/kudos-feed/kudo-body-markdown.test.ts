import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KudoBodyMarkdown } from "@/features/kudos-feed/components/kudo-body-markdown";

/**
 * Whitelist renderer of the Kudo body AST (decision-log 2026-11-15/16): React elements only,
 * links open in a new tab with `noopener noreferrer nofollow`, nothing else becomes markup.
 * Rendered to static HTML in the Node environment (the unit project has no DOM; the glob takes
 * `.test.ts`, hence `createElement` instead of JSX).
 */
const markup = (body: string, className?: string) => renderToStaticMarkup(createElement(KudoBodyMarkdown, { body, className }));
/** The body markup with the wrapper's (styling-only) class dropped. */
const render = (body: string) => markup(body).replace(/^<div class="[^"]*">/, "<div>");

describe("KudoBodyMarkdown", () => {
  it("maps bold, italic, strike and line breaks to their elements", () => {
    expect(render("**Đậm** _nghiêng_ ~~gạch~~\ndòng hai")).toBe(
      "<div><p><strong>Đậm</strong> <em>nghiêng</em> <s>gạch</s><br/>dòng hai</p></div>",
    );
  });

  it("renders http(s) links in a new tab with noopener noreferrer nofollow", () => {
    expect(render("[Trang Sun](https://sun-asterisk.com/)")).toBe(
      '<div><p><a href="https://sun-asterisk.com/" target="_blank" rel="noopener noreferrer nofollow">Trang Sun</a></p></div>',
    );
  });

  it("keeps javascript: links and raw HTML as escaped text", () => {
    const html = render('[x](javascript:alert(1)) <img src=x onerror="alert(1)"> <script>alert(1)</script>');
    expect(html).not.toContain("<a");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).toContain("[x](javascript:alert(1))");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("renders unordered, ordered (with start) lists and quotes", () => {
    expect(render("- một\n- hai")).toBe("<div><ul><li>một</li><li>hai</li></ul></div>");
    expect(render("3. ba\n4. bốn")).toBe('<div><ol start="3"><li>ba</li><li>bốn</li></ol></div>');
    expect(render("> trích dẫn")).toBe("<div><blockquote><p>trích dẫn</p></blockquote></div>");
  });

  it("adds the caller's className to the wrapper", () => {
    expect(markup("a", "line-clamp-4")).toMatch(/^<div class="[^"]* line-clamp-4"><p>a<\/p><\/div>$/);
  });
});
