import { describe, expect, it } from "vitest";
import { parseKudoBody } from "@/features/kudos-feed/markdown/parse-kudo-body";
import { nodeTypes, paragraph, plainText, text } from "./kudo-body-ast-test-helpers";

/**
 * Whitelist parser, blocks and emphasis (phase-04-backend-contracts § 1.1, decision-log
 * 2026-11-15/16): paragraphs, line breaks, `1.` / `-` lists, `> quote`, **bold**, _italic_,
 * ~~strike~~. Everything else stays literal text.
 */
describe("parseKudoBody — blocks", () => {
  it("returns no nodes for an empty body", () => {
    expect(parseKudoBody("")).toEqual([]);
    expect(parseKudoBody("  \n \n")).toEqual([]);
  });

  it("keeps single newlines as line breaks and splits paragraphs on blank lines", () => {
    expect(parseKudoBody("Cảm ơn\r\nbạn nhiều\n\n  Đoạn hai  ")).toEqual([
      paragraph(text("Cảm ơn"), { type: "break" }, text("bạn nhiều")),
      paragraph(text("Đoạn hai")),
    ]);
  });

  it("parses unordered and ordered lists, keeping the first number", () => {
    expect(parseKudoBody("- một\n- **hai**\n3. ba\n4. bốn")).toEqual([
      { type: "list", ordered: false, items: [{ children: [text("một")] }, { children: [{ type: "strong", children: [text("hai")] }] }] },
      { type: "list", ordered: true, start: 3, items: [{ children: [text("ba")] }, { children: [text("bốn")] }] },
    ]);
  });

  it("does not treat '-5', '1.5' or '* x' as list items", () => {
    expect(parseKudoBody("-5 độ\n1.5 điểm\n* sao")).toEqual([
      paragraph(text("-5 độ"), { type: "break" }, text("1.5 điểm"), { type: "break" }, text("* sao")),
    ]);
  });

  it("parses quotes holding paragraphs and lists, but no nested quote", () => {
    expect(parseKudoBody("> Trích **dẫn**\n> dòng hai\n>\n> - mục\n> > lồng")).toEqual([
      {
        type: "quote",
        children: [
          paragraph(text("Trích "), { type: "strong", children: [text("dẫn")] }, { type: "break" }, text("dòng hai")),
          { type: "list", ordered: false, items: [{ children: [text("mục")] }] },
          paragraph(text("> lồng")),
        ],
      },
    ]);
  });

  it("keeps headings, code fences, tables and rules as literal text", () => {
    const nodes = parseKudoBody("# Tiêu đề\n```js\n| a | b |\n---");
    expect(nodeTypes(nodes)).toEqual(new Set(["paragraph", "text", "break"]));
    expect(plainText(nodes)).toBe("# Tiêu đề```js| a | b |---");
  });
});

describe("parseKudoBody — inline emphasis", () => {
  it("parses bold, italic and strike", () => {
    expect(parseKudoBody("**đậm** _nghiêng_ ~~gạch~~")).toEqual([
      paragraph(
        { type: "strong", children: [text("đậm")] },
        text(" "),
        { type: "emphasis", children: [text("nghiêng")] },
        text(" "),
        { type: "strike", children: [text("gạch")] },
      ),
    ]);
  });

  it("nests emphasis", () => {
    expect(parseKudoBody("**rất _tuyệt_ ~~vời~~**")).toEqual([
      paragraph({
        type: "strong",
        children: [
          text("rất "),
          { type: "emphasis", children: [text("tuyệt")] },
          text(" "),
          { type: "strike", children: [text("vời")] },
        ],
      }),
    ]);
    expect(parseKudoBody("_a **b** c_")).toEqual([
      paragraph({ type: "emphasis", children: [text("a "), { type: "strong", children: [text("b")] }, text(" c")] }),
    ]);
  });

  it.each([
    ["unclosed bold", "**đậm mãi", "**đậm mãi"],
    ["unclosed italic", "_nghiêng", "_nghiêng"],
    ["unclosed strike", "~~gạch", "~~gạch"],
    ["lone markers", "a ** b _ c ~~ d", "a ** b _ c ~~ d"],
    ["empty pair", "a****b", "a****b"],
    ["single tilde", "~1 giờ~", "~1 giờ~"],
    ["intraword underscores", "snake_case_name và chữ_cái_việt", "snake_case_name và chữ_cái_việt"],
  ])("keeps %s literal", (_label, body, expected) => {
    const nodes = parseKudoBody(body);
    expect(nodeTypes(nodes)).toEqual(new Set(["paragraph", "text"]));
    expect(plainText(nodes)).toBe(expected);
  });

  it("keeps the inner text of a closed span when an inner marker stays unclosed", () => {
    expect(parseKudoBody("**a _b**")).toEqual([paragraph({ type: "strong", children: [text("a _b")] })]);
  });

  it("honours backslash escapes", () => {
    expect(parseKudoBody("\\*\\*không đậm\\*\\* \\_x\\_ a\\\\b")).toEqual([paragraph(text("**không đậm** _x_ a\\b"))]);
  });

  it("keeps mentions and HTML-looking text as plain text, without entity decoding", () => {
    const body = "@Nguyễn Văn A <script>alert(1)</script> <img src=x onerror=alert(1)> &lt;b&gt; &#106;";
    expect(parseKudoBody(body)).toEqual([paragraph(text(body))]);
  });
});

