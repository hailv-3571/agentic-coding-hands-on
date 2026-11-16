import { describe, expect, it } from "vitest";
import { findDisallowedLinks, findMarkdownImages } from "@/features/kudos-authoring/schemas/kudo-body-link-policy";

/**
 * Decision-log 2026-11-15: the body is restricted Markdown stored as raw text; every Markdown
 * link target and every bare URL must be http(s). The phase 05 renderer still escapes.
 */
describe("findDisallowedLinks", () => {
  it.each([
    ["plain prose with colons", "Lưu ý: 10:30 họp, tỉ lệ a:b, Data: ổn"],
    ["https Markdown link", "Xem [SAA 2025](https://saa.sun-asterisk.com/awards?x=1#top)"],
    ["http Markdown link with spaces and title", "[x]( http://example.com \"tiêu đề\" )"],
    ["bare https URL", "Tài liệu: https://docs.example.com/a_(b)"],
    ["formatting only", "**đậm** _nghiêng_ ~~gạch~~\n1. một\n- hai\n> trích dẫn\n@Nguyễn Văn A"],
    ["bracketed words with a colon mid-line", "Xem [mục 2]: ổn rồi"],
    ["inline link followed by a colon", "[SAA](https://saa.sun-asterisk.com): trang chủ"],
  ])("allows %s", (_label, body) => {
    expect(findDisallowedLinks(body)).toEqual([]);
  });

  /**
   * Reviewer W1 (actions): only inline links and bare http(s) URLs are allowed, so every link
   * reference definition is rejected outright, whatever its target — the renderer may decode
   * entities or strip tabs where `new URL` would not.
   */
  it.each([
    ["entity-encoded scheme", "[x][1]\n\n[1]: java&#115;cript:alert(1)", "[1]:"],
    ["named-entity colon", "[x][1]\n\n[1]: javascript&colon;alert(1)", "[1]:"],
    ["tab inside an angle-bracket target", "[x][1]\n\n[1]: <java\tscript:alert(1)>", "[1]:"],
    ["http(s) target (still a reference definition)", "[x][a]\n\n   [a]: https://example.com", "[a]:"],
    ["definition inside a block quote", "[x][1]\n\n> [1]: java&#115;cript:alert(1)", "[1]:"],
    ["definition inside a list item", "- [x][1]\n- [1]: java&#115;cript:alert(1)", "[1]:"],
    ["escaped bracket in the label", "[x][a\\]b]\n\n[a\\]b]: java&#115;cript:alert(1)", "[a\\]b]:"],
    ["shortcut-style definition at the start", "[gg]: javascript&colon;alert(1)\n\n[gg]", "[gg]:"],
  ])("rejects a reference definition with %s", (_label, body, offending) => {
    expect(findDisallowedLinks(body)).toContain(offending);
  });

  it.each([
    ["javascript: link", "[bấm](javascript:alert(1))", "javascript:alert(1)"],
    ["mixed-case javascript: link", "[x](JaVaScRiPt:alert(1))", "JaVaScRiPt:alert(1)"],
    ["javascript: split by a tab", "[x](java\tscript:alert(1))", "java\tscript:alert(1)"],
    ["data: link", "[x](data:text/html;base64,PHNjcmlwdD4=)", "data:text/html;base64,PHNjcmlwdD4="],
    ["angle-bracket target", "[x](<javascript:alert(1)>)", "<javascript:alert(1)>"],
    ["relative link", "[x](/admin)", "/admin"],
    ["entity-encoded scheme", "[x](javascript&#58;alert(1))", "javascript&#58;alert(1)"],
    ["mailto link", "[x](mailto:a@sun-asterisk.com)", "mailto:a@sun-asterisk.com"],
    ["empty link", "[x]()", ""],
    ["image syntax", "![x](data:image/png;base64,AAAA)", "data:image/png;base64,AAAA"],
    ["bare javascript:", "chạy javascript:alert(1) đi", "javascript:"],
    ["bare data:", "(data:text/html,<b>x</b>)", "data:"],
    ["bare ftp URL", "tải ftp://files.example.com/x", "ftp://"],
  ])("rejects %s", (_label, body, offending) => {
    expect(findDisallowedLinks(body)).toContain(offending);
  });
});

/** Decision 2026-11-16: no Markdown images in the body, whatever the target (field error imageNotAllowed). */
describe("findMarkdownImages", () => {
  it.each([
    ["exclamation before a link", "Tuyệt vời! [SAA](https://saa.sun-asterisk.com)"],
    ["exclamation inside the link text", "[Tuyệt!](https://saa.sun-asterisk.com)"],
    ["![ without a destination", "Hay quá![1] và ![chưa xong"],
    ["escaped exclamation", "\\![logo](https://a.vn/logo.png)"],
  ])("allows %s", (_label, body) => {
    expect(findMarkdownImages(body)).toEqual([]);
  });

  it.each([
    ["https image", "![logo](https://a.vn/logo.png)", "![logo]"],
    ["image glued to a word", "Wow![logo](https://a.vn/logo.png)", "![logo]"],
    ["empty alt text", "![](https://a.vn/x.png)", "![]"],
    ["nested brackets in the alt text", "![a [b] c](https://a.vn/x.png)", "![a [b] c]"],
    ["image inside a link", "[![x](https://a.vn/x.png)](https://a.vn)", "![x]"],
    ["image in a quote", "> ![x](https://a.vn/x.png)", "![x]"],
    ["escaped backslash before the image", "\\\\![x](https://a.vn/x.png)", "![x]"],
  ])("rejects %s", (_label, body, offending) => {
    expect(findMarkdownImages(body)).toEqual([offending]);
  });
});
