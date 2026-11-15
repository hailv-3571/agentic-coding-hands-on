import { describe, expect, it } from "vitest";
import { resolveLocale } from "@/shared/i18n/resolve-locale";

describe("resolveLocale (BR-001)", () => {
  it("uses a valid cookie over Accept-Language", () => {
    expect(resolveLocale({ cookie: "en", acceptLanguage: "vi" })).toBe("en");
    expect(resolveLocale({ cookie: "vi", acceptLanguage: "en-US,en;q=0.9" })).toBe("vi");
  });

  it("ignores an invalid cookie and falls back to Accept-Language", () => {
    expect(resolveLocale({ cookie: "fr", acceptLanguage: "en" })).toBe("en");
    expect(resolveLocale({ cookie: "", acceptLanguage: "en" })).toBe("en");
  });

  it("falls back to vi for an invalid cookie with no usable header", () => {
    expect(resolveLocale({ cookie: "fr" })).toBe("vi");
  });

  it("maps en-US,en;q=0.9 to en", () => {
    expect(resolveLocale({ acceptLanguage: "en-US,en;q=0.9" })).toBe("en");
  });

  it("honours q-values instead of header order", () => {
    expect(resolveLocale({ acceptLanguage: "en;q=0.4,vi;q=0.8" })).toBe("vi");
    expect(resolveLocale({ acceptLanguage: "fr,en;q=0.5" })).toBe("en");
  });

  it("falls back to vi for unsupported, malformed or missing headers", () => {
    expect(resolveLocale({ acceptLanguage: "fr-FR,fr;q=0.9" })).toBe("vi");
    expect(resolveLocale({ acceptLanguage: "en;q=0" })).toBe("vi");
    expect(resolveLocale({ acceptLanguage: ";;,,q=" })).toBe("vi");
    expect(resolveLocale({})).toBe("vi");
    expect(resolveLocale({ cookie: null, acceptLanguage: null })).toBe("vi");
  });
});
