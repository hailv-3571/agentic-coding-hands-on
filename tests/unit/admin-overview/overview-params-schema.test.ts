import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { parseOverviewParams } = await import("@/features/admin-overview/schemas/overview-params-schema");

/**
 * Admin › Overview URL params (F015 A1/A2, FR-401/403, BR-001, DEC-002): `from` / `to` are whole days
 * in ADMIN_TIMEZONE → half-open UTC range [from 00:00, to + 1 day 00:00); either end may be absent
 * (empty = all time). Reversed → invalid_date_range; malformed, impossible or repeated → invalid_params.
 */
describe("parseOverviewParams", () => {
  it("reads no params (or empty ones) as all time", () => {
    const allTime = { ok: true, value: { from: null, to: null }, range: { start: undefined, end: undefined } };
    expect(parseOverviewParams({})).toEqual(allTime);
    expect(parseOverviewParams(new URLSearchParams("from=&to="))).toEqual(allTime);
  });

  it("turns a day range into the half-open UTC range of Vietnamese days", () => {
    expect(parseOverviewParams({ from: "2025-12-01", to: "2025-12-05" })).toEqual({
      ok: true,
      value: { from: "2025-12-01", to: "2025-12-05" },
      range: { start: new Date("2025-11-30T17:00:00.000Z"), end: new Date("2025-12-05T17:00:00.000Z") },
    });
  });

  it("accepts a single day and an open start or end", () => {
    expect(parseOverviewParams({ from: "2025-12-05", to: "2025-12-05" })).toMatchObject({ ok: true });
    expect(parseOverviewParams({ from: "2025-12-06" })).toMatchObject({ ok: true, value: { from: "2025-12-06", to: null }, range: { end: undefined } });
    expect(parseOverviewParams({ to: "2025-11-30" })).toMatchObject({ ok: true, value: { from: null, to: "2025-11-30" }, range: { start: undefined } });
  });

  it("refuses a reversed range with invalid_date_range", () => {
    expect(parseOverviewParams({ from: "2025-12-06", to: "2025-12-05" })).toEqual({ ok: false, error: "invalid_date_range" });
  });

  it.each([
    ["a malformed day", { from: "06/12/2025" }],
    ["an impossible day", { to: "2026-02-30" }],
    ["a timestamp", { from: "2025-12-01T00:00:00Z" }],
    ["a repeated param", new URLSearchParams("from=2025-12-01&from=2025-12-02")],
  ])("refuses %s with invalid_params", (_label, params) => {
    expect(parseOverviewParams(params)).toEqual({ ok: false, error: "invalid_params" });
  });
});
