import { describe, expect, it } from "vitest";
import { kudoMessagePlainText } from "@/features/admin-moderation/components/kudo-message-plain-text";

describe("kudoMessagePlainText", () => {
  it("drops the emphasis markers and keeps the words", () => {
    expect(kudoMessagePlainText("Cảm ơn **em** rất _nhiều_ và ~~không~~ ít")).toBe("Cảm ơn em rất nhiều và không ít");
  });

  it("keeps a link's text and drops its URL", () => {
    expect(kudoMessagePlainText("Xem [bài viết](https://example.com/a?b=1) nhé")).toBe("Xem bài viết nhé");
  });

  it("flattens lists, quotes and line breaks into one line of text", () => {
    const body = "Mở đầu\ndòng hai\n\n- một\n- hai\n\n1. ba\n\n> trích _dẫn_";
    expect(kudoMessagePlainText(body)).toBe("Mở đầu dòng hai một hai ba trích dẫn");
  });

  it("treats HTML as literal text, never as markup", () => {
    expect(kudoMessagePlainText("<b>xin chào</b> <script>x()</script>")).toBe("<b>xin chào</b> <script>x()</script>");
  });

  it("is empty for an empty body", () => {
    expect(kudoMessagePlainText("   ")).toBe("");
  });
});
