import { describe, expect, it } from "vitest";
import {
  clampToLength,
  findMentionQuery,
  insertLink,
  insertMention,
  prefixSelectedLines,
  wrapSelection,
} from "@/features/kudos-authoring/components/kudo-markdown-format";
import { findDisallowedLinks } from "@/features/kudos-authoring/schemas/kudo-body-link-policy";

/** Composer toolbar/mention transforms: the exact Markdown the decision log allows, never past 1,000. */
describe("wrapSelection", () => {
  it.each([
    ["**", "Cảm ơn **bạn** nhé"],
    ["_", "Cảm ơn _bạn_ nhé"],
    ["~~", "Cảm ơn ~~bạn~~ nhé"],
  ] as const)("wraps the selection in %s and keeps it selected", (marker, expected) => {
    const edit = wrapSelection("Cảm ơn bạn nhé", 7, 10, marker);
    expect(edit?.value).toBe(expected);
    expect(edit && edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe("bạn");
  });

  it("inserts an empty pair with the caret inside when nothing is selected", () => {
    expect(wrapSelection("ab", 1, 1, "**")).toEqual({ value: "a****b", selectionStart: 3, selectionEnd: 3 });
  });

  it("refuses an edit that would pass the limit (hard stop)", () => {
    expect(wrapSelection("x".repeat(997), 0, 1, "**")).toBeNull();
    expect(wrapSelection("x".repeat(996), 0, 1, "**")?.value).toHaveLength(1000);
  });
});

describe("prefixSelectedLines", () => {
  it("numbers every selected line, whole lines only", () => {
    const value = "intro\nmột\nhai\nend";
    const edit = prefixSelectedLines(value, value.indexOf("ột"), value.indexOf("ai"), "numbered");
    expect(edit?.value).toBe("intro\n1. một\n2. hai\nend");
    expect(edit && edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe("1. một\n2. hai");
  });

  it("quotes the caret's line and leaves the caret after it", () => {
    expect(prefixSelectedLines("a\nbc", 3, 3, "quote")).toEqual({ value: "a\n> bc", selectionStart: 6, selectionEnd: 6 });
  });

  it("starts a list on an empty message and stops at a trailing newline", () => {
    expect(prefixSelectedLines("", 0, 0, "numbered")?.value).toBe("1. ");
    expect(prefixSelectedLines("a\nb", 0, 2, "quote")?.value).toBe("> a\nb");
  });
});

describe("insertLink", () => {
  it("replaces the selection with [text](url) the body policy accepts", () => {
    const edit = insertLink("Xem tại đây nhé", 8, 11, "đây", "https://sun-asterisk.com/kudos");
    expect(edit?.value).toBe("Xem tại [đây](https://sun-asterisk.com/kudos) nhé");
    expect(findDisallowedLinks(edit!.value)).toEqual([]);
  });

  it("falls back to the URL as text, escapes brackets and encodes spaces", () => {
    expect(insertLink("", 0, 0, "", "http://a.vn/x y")?.value).toBe("[http://a.vn/x%20y](http://a.vn/x%20y)");
    expect(insertLink("", 0, 0, "a]b", "https://a.vn")?.value).toBe("[a\\]b](https://a.vn/)");
  });

  it("percent-encodes ( ) and spaces in the URL, so the link never ends early (review W3)", () => {
    const edit = insertLink("", 0, 0, "wiki", "https://x.com/a)b(c d?q=(1) e#(f)");
    expect(edit?.value).toBe("[wiki](https://x.com/a%29b%28c%20d?q=%281%29%20e#%28f%29)");
    expect(findDisallowedLinks(edit!.value)).toEqual([]);
  });

  it.each(["javascript:alert(1)", "ftp://a.vn", "a.vn", ""])("rejects %j", (url) => {
    expect(insertLink("x", 0, 0, "t", url)).toBeNull();
  });
});

describe("mentions", () => {
  it("finds the @query before the caret, names with spaces included", () => {
    expect(findMentionQuery("Cảm ơn @Dương Hu", 16)).toEqual({ start: 7, query: "Dương Hu" });
    expect(findMentionQuery("@a", 2)).toEqual({ start: 0, query: "a" });
  });

  it.each([
    ["email@domain", 12],
    ["@", 1],
    ["@ x", 3],
    ["@a\nb", 4],
  ])("ignores %j", (value, caret) => {
    expect(findMentionQuery(value, caret)).toBeNull();
  });

  it("inserts the plain-text token @Full Name with a trailing space", () => {
    const value = "Cảm ơn @dư nhé";
    const mention = findMentionQuery(value, 10)!;
    expect(insertMention(value, mention, 10, "Dương Huỳnh")).toEqual({
      value: "Cảm ơn @Dương Huỳnh  nhé",
      selectionStart: 20,
      selectionEnd: 20,
    });
  });
});

describe("clampToLength", () => {
  it("cuts at code points, so an emoji is never split", () => {
    expect(clampToLength("ab😀c", 3)).toBe("ab😀");
    expect(clampToLength("abc", 5)).toBe("abc");
  });
});
