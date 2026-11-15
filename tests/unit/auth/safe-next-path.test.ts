import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/shared/auth/safe-next-path";

describe("safeNextPath (DEC-001 open-redirect guard)", () => {
  it.each([
    ["/kudos", "/kudos"],
    ["/kudos?tab=all#top", "/kudos?tab=all#top"],
    ["/admin/users", "/admin/users"],
    ["/", "/"],
  ])("keeps the internal path %s", (raw, expected) => {
    expect(safeNextPath(raw)).toBe(expected);
  });

  it.each([
    ["missing", null],
    ["undefined", undefined],
    ["empty", ""],
    ["protocol-relative", "//evil.com"],
    ["protocol-relative with path", "//evil.com/kudos"],
    ["absolute https", "https://evil.com"],
    ["absolute javascript", "javascript:alert(1)"],
    ["backslash host", "/\\evil.com"],
    ["backslash later in path", "/foo\\..\\\\evil.com"],
    ["tab-smuggled host", "/\t/evil.com"],
    ["newline-smuggled host", "/\n/evil.com"],
    ["relative without slash", "kudos"],
    ["overlong", `/${"a".repeat(2048)}`],
    // URL normalization resolves dot segments into a protocol-relative `//host` (C1).
    ["dot-dot segment", "/..//evil.com"],
    ["dot segment", "/.//evil.com"],
    ["dot-dot after a segment", "/a/..//evil.com"],
    ["nested dot-dot segments", "/a/b/../..//evil.com"],
    ["encoded dot-dot", "/%2e%2e//evil.com"],
    ["upper-case encoded dot-dot", "/%2E%2E//evil.com"],
    ["mixed encoded dot-dot", "/.%2e//evil.com"],
    ["encoded dot-dot after a segment", "/a/%2e%2e//evil.com"],
    ["dot then dot-dot", "/./..//evil.com"],
    ["dot-dot with path, query and hash", "/..//evil.com/kudos?x=1#y"],
    ["tab-smuggled dot-dot", "/..\t//evil.com"],
    ["newline-smuggled dot-dot", "/.\n.//evil.com"],
  ])("falls back to / for %s", (_label, raw) => {
    expect(safeNextPath(raw)).toBe("/");
  });

  it.each([
    // Encoded slashes are not path separators: the browser stays on this origin.
    ["/%2e/%2f/evil.com", "/%2f/evil.com"],
    ["/%09/evil.com", "/%09/evil.com"],
    ["/kudos/../awards", "/awards"],
  ])("normalizes %s to the same-origin path %s", (raw, expected) => {
    expect(safeNextPath(raw)).toBe(expected);
  });

  it("uses the caller's fallback when given", () => {
    expect(safeNextPath("//evil.com", "/onboarding/department")).toBe("/onboarding/department");
  });
});
