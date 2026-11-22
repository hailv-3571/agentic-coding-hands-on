import { describe, expect, it } from "vitest";
import { nameMatcher, normalizeSearchText } from "@/features/spotlight-board/lib/normalize-search-text";

/**
 * BR-005 / DEC-002: the Spotlight search ignores case and Vietnamese diacritics (đ → d) and matches
 * any part of the name ("chuc" finds "Nguyễn Bá Chức"); an empty query filters nothing.
 */
describe("normalizeSearchText", () => {
  it("lowercases and strips Vietnamese tone and vowel marks", () => {
    expect(normalizeSearchText("Nguyễn Bá Chức")).toBe("nguyen ba chuc");
    expect(normalizeSearchText("Dương Thùy An")).toBe("duong thuy an");
  });

  it("maps đ and Đ to d (they are letters, not combining marks)", () => {
    expect(normalizeSearchText("Đỗ Hoàng Hiệp")).toBe("do hoang hiep");
    expect(normalizeSearchText("đường")).toBe("duong");
  });

  it("treats precomposed and decomposed input the same", () => {
    expect(normalizeSearchText("Nguyễn")).toBe(normalizeSearchText("Nguyễn"));
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeSearchText("  Lê   Kiều\tTrang ")).toBe("le kieu trang");
  });
});

describe("nameMatcher", () => {
  it("returns null for an empty or blank query (every name stays normal)", () => {
    expect(nameMatcher("")).toBeNull();
    expect(nameMatcher("   ")).toBeNull();
  });

  it("matches any part of the name, ignoring case and diacritics", () => {
    const matches = nameMatcher("chuc")!;
    expect(matches("Nguyễn Bá Chức")).toBe(true);
    expect(nameMatcher("CHỨC")!("Nguyễn Bá Chức")).toBe(true);
    expect(nameMatcher("bá  chức")!("Nguyễn Bá Chức")).toBe(true);
    expect(nameMatcher("do hoang")!("Đỗ Hoàng Hiệp")).toBe(true);
    expect(matches("Mai Phương Thủy")).toBe(false);
  });

  it("does not match across a missing letter", () => {
    expect(nameMatcher("nguyn")!("Nguyễn Bá Chức")).toBe(false);
  });
});
