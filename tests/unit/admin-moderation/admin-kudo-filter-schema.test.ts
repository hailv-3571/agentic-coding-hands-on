import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { DEFAULT_ADMIN_KUDO_FILTER, parseAdminKudoFilter } = await import(
  "@/features/admin-moderation/schemas/admin-kudo-filter-schema"
);

/** URL params → AdminKudoFilterValues (BR-002, FR-203..207, technical-spec § edge cases). */
const SENDER = "0b5d7a3e-8f1c-4c2a-9d4e-1f2a3b4c5d6e";
const RECEIVER = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const ok = (patch: object) => ({ ok: true, value: { ...DEFAULT_ADMIN_KUDO_FILTER, ...patch } });

describe("parseAdminKudoFilter", () => {
  it("defaults to page 1, newest first, no filters", () => {
    expect(DEFAULT_ADMIN_KUDO_FILTER).toEqual({
      page: 1,
      sort: "newest",
      status: null,
      senderId: null,
      receiverId: null,
      from: null,
      to: null,
      query: "",
    });
    expect(parseAdminKudoFilter({})).toEqual(ok({}));
    expect(parseAdminKudoFilter(new URLSearchParams())).toEqual(ok({}));
  });

  it("reads every param (record from the page or URLSearchParams from a route) and trims q", () => {
    const raw = {
      page: "3",
      sort: "hearts_asc",
      status: "spam",
      sender: SENDER,
      receiver: RECEIVER,
      from: "2025-12-01",
      to: "2025-12-05",
      q: "  cảm ơn  ",
      unrelated: "ignored",
    };
    const expected = ok({
      page: 3,
      sort: "hearts_asc",
      status: "spam",
      senderId: SENDER,
      receiverId: RECEIVER,
      from: "2025-12-01",
      to: "2025-12-05",
      query: "cảm ơn",
    });
    expect(parseAdminKudoFilter(raw)).toEqual(expected);
    expect(parseAdminKudoFilter(new URLSearchParams(raw))).toEqual(expected);
  });

  it("treats empty values and a whitespace-only q as absent", () => {
    const raw = { page: "", sort: "", status: "", sender: "", receiver: "", from: "", to: "", q: "   " };
    expect(parseAdminKudoFilter(raw)).toEqual(ok({}));
  });

  it("accepts a one-day range and an open end on either side", () => {
    expect(parseAdminKudoFilter({ from: "2025-12-05", to: "2025-12-05" })).toEqual(ok({ from: "2025-12-05", to: "2025-12-05" }));
    expect(parseAdminKudoFilter({ to: "2025-12-05" })).toEqual(ok({ to: "2025-12-05" }));
    expect(parseAdminKudoFilter({ from: "2025-12-05" })).toEqual(ok({ from: "2025-12-05" }));
  });

  it("answers invalid_date_range when from is after to", () => {
    expect(parseAdminKudoFilter({ from: "2025-12-06", to: "2025-12-05" })).toEqual({ ok: false, error: "invalid_date_range" });
  });

  it.each<[string, Record<string, string | string[]>]>([
    ["an impossible date", { from: "2025-02-30" }],
    ["a non-ISO date", { to: "05/12/2025" }],
    ["a sender that is not a uuid", { sender: "abc" }],
    ["a receiver that is not a uuid", { receiver: "1" }],
    ["an unknown status", { status: "deleted" }],
    ["the status 'all' (absent means all)", { status: "all" }],
    ["an unknown sort", { sort: "oldest" }],
    ["page 0", { page: "0" }],
    ["a negative page", { page: "-1" }],
    ["a fractional page", { page: "1.5" }],
    ["a non-numeric page", { page: "two" }],
    ["a 201-character q", { q: "a".repeat(201) }],
    ["a repeated param", { status: ["public", "spam"] }],
  ])("answers invalid_params for %s", (_label, raw) => {
    expect(parseAdminKudoFilter(raw)).toEqual({ ok: false, error: "invalid_params" });
  });

  it("keeps a 200-character q (counted in characters, not UTF-16 units)", () => {
    const query = "đ".repeat(199) + "😀";
    expect(parseAdminKudoFilter({ q: query })).toEqual(ok({ query }));
  });

  it("rejects a repeated URLSearchParams key and prefers invalid_params over a reversed range", () => {
    expect(parseAdminKudoFilter(new URLSearchParams("sender=a&sender=b"))).toEqual({ ok: false, error: "invalid_params" });
    expect(parseAdminKudoFilter({ from: "2025-12-06", to: "2025-12-05", status: "x" })).toEqual({ ok: false, error: "invalid_params" });
  });
});
