import { describe, expect, it } from "vitest";
import {
  DEFAULT_ADMIN_USER_FILTER,
  parseUserListParams,
  USER_SEARCH_MAX_LENGTH,
} from "@/features/admin-users/schemas/user-list-params-schema";

/**
 * Admin › User URL params (FR-402, BR-004): the page and the CSV export parse the same names into
 * `AdminUserFilterValues`. Every value is whitelisted (sort/filter never reach SQL unchecked); empty
 * values mean "absent"; q is trimmed and capped at 100 characters (`query_too_long`, scenario US002).
 */
const UNIT = "5f0b8c1e-2a44-4c1f-9d61-1f7f3c6a9b20";

describe("parseUserListParams", () => {
  it("defaults to page 1, no filter, name order (sort null), dir desc", () => {
    expect(DEFAULT_ADMIN_USER_FILTER).toEqual({ page: 1, unit: null, level: null, role: null, query: "", sort: null, dir: "desc" });
    expect(parseUserListParams({})).toEqual({ ok: true, value: DEFAULT_ADMIN_USER_FILTER });
    expect(parseUserListParams(new URLSearchParams())).toEqual({ ok: true, value: DEFAULT_ADMIN_USER_FILTER });
  });

  it("parses every param from a page record and from route-handler URLSearchParams alike", () => {
    const expected = { page: 3, unit: UNIT, level: "super", role: "admin", query: "nguyen", sort: "badges", dir: "asc" };
    const raw = { page: "3", unit: UNIT, level: "super", role: "admin", q: "  nguyen ", sort: "badges", dir: "asc" };
    expect(parseUserListParams(raw)).toEqual({ ok: true, value: expected });
    expect(parseUserListParams(new URLSearchParams(raw))).toEqual({ ok: true, value: expected });
  });

  it("accepts the unassigned unit and the no-tier level as 'none'", () => {
    expect(parseUserListParams({ unit: "none", level: "none" })).toMatchObject({ ok: true, value: { unit: "none", level: "none" } });
  });

  it("treats empty and whitespace-only values as absent", () => {
    const parsed = parseUserListParams({ page: "", unit: "", level: "", role: "", q: "   ", sort: "", dir: "" });
    expect(parsed).toEqual({ ok: true, value: DEFAULT_ADMIN_USER_FILTER });
  });

  it.each([
    ["page 0", { page: "0" }],
    ["negative page", { page: "-1" }],
    ["fractional page", { page: "1.5" }],
    ["page not a number", { page: "two" }],
    ["unit not a uuid", { unit: "12" }],
    ["unknown level", { level: "5" }],
    ["unknown role", { role: "owner" }],
    ["sort outside the whitelist (name is the fixed default, not a param)", { sort: "name" }],
    ["sort with SQL", { sort: "sent; drop table profiles" }],
    ["unknown dir", { dir: "up" }],
  ])("rejects %s as invalid_params", (_label, raw) => {
    expect(parseUserListParams(raw)).toEqual({ ok: false, error: "invalid_params" });
  });

  it("rejects a repeated param as invalid_params", () => {
    expect(parseUserListParams(new URLSearchParams("role=admin&role=user"))).toEqual({ ok: false, error: "invalid_params" });
    expect(parseUserListParams({ sort: ["sent", "hearts"] })).toEqual({ ok: false, error: "invalid_params" });
  });

  it("caps q at 100 characters after trimming, counting Vietnamese letters as one each", () => {
    expect(USER_SEARCH_MAX_LENGTH).toBe(100);
    const atLimit = "ễ".repeat(USER_SEARCH_MAX_LENGTH);
    expect(parseUserListParams({ q: ` ${atLimit} ` })).toMatchObject({ ok: true, value: { query: atLimit } });
    expect(parseUserListParams({ q: `${atLimit}a` })).toEqual({ ok: false, error: "query_too_long" });
  });

  it("keeps % and _ in q verbatim (escaped later in SQL, never interpreted here)", () => {
    expect(parseUserListParams({ q: "50%_off" })).toMatchObject({ ok: true, value: { query: "50%_off" } });
  });
});
