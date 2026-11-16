import { describe, expect, it } from "vitest";
import { parseSunnerSearchParams } from "@/features/sunner-search/schemas/sunner-search-params-schema";

/** GET /api/sunners/search?q&limit&excludeSelf (C-06): query-string parsing only. */
const parse = (query: string) => parseSunnerSearchParams(new URLSearchParams(query));

describe("parseSunnerSearchParams", () => {
  it("trims q and applies defaults (limit 10, excludeSelf false)", () => {
    expect(parse("q=%20Nguy%E1%BB%85n%20")).toEqual({ ok: true, data: { q: "Nguyễn", limit: 10, excludeSelf: false } });
  });

  it("reads excludeSelf as a real boolean: 'false' and '0' stay false", () => {
    expect(parse("q=a&excludeSelf=true")).toMatchObject({ data: { excludeSelf: true } });
    expect(parse("q=a&excludeSelf=1")).toMatchObject({ data: { excludeSelf: true } });
    expect(parse("q=a&excludeSelf=false")).toMatchObject({ data: { excludeSelf: false } });
    expect(parse("q=a&excludeSelf=0")).toMatchObject({ data: { excludeSelf: false } });
    expect(parse("q=a&excludeSelf=yes")).toMatchObject({ ok: false, fieldErrors: { excludeSelf: ["invalid"] } });
  });

  it("accepts limit 1..20 only", () => {
    expect(parse("q=a&limit=20")).toMatchObject({ data: { limit: 20 } });
    for (const limit of ["0", "21", "2.5", "abc"]) {
      expect(parse(`q=a&limit=${limit}`)).toMatchObject({ ok: false, fieldErrors: { limit: ["invalid"] } });
    }
  });

  it("requires q of 1..50 characters after trim", () => {
    expect(parse("")).toMatchObject({ ok: false, fieldErrors: { q: ["required"] } });
    expect(parse("q=%20%20")).toMatchObject({ ok: false, fieldErrors: { q: ["required"] } });
    expect(parse(`q=${"a".repeat(50)}`).ok).toBe(true);
    expect(parse(`q=${"a".repeat(51)}`)).toMatchObject({ ok: false, fieldErrors: { q: ["invalid"] } });
  });
});
