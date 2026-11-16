import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { zonedDateTimeToUtc } = await import("@/shared/admin/timezone");

/**
 * `zonedDateTimeToUtc` (shared/admin/timezone.ts): a `<input type="datetime-local">` value read as
 * wall-clock time in ADMIN_TIMEZONE (F011 BR-006). Vietnam is UTC+7 all year (no DST).
 */
const utc = (local: string, timeZone?: string) => zonedDateTimeToUtc(local, timeZone).toISOString();

describe("zonedDateTimeToUtc: normal values", () => {
  it("reads the wall clock as Vietnam time by default", () => {
    expect(utc("2101-12-23T10:00")).toBe("2101-12-23T03:00:00.000Z");
    expect(utc("2025-11-20T09:30")).toBe("2025-11-20T02:30:00.000Z");
  });

  it("honours an explicit zone", () => {
    expect(utc("2101-12-23T10:00", "UTC")).toBe("2101-12-23T10:00:00.000Z");
    // New York is EST (-05:00) before 2025-03-09 02:00 and EDT (-04:00) after.
    expect(utc("2025-03-09T01:30", "America/New_York")).toBe("2025-03-09T06:30:00.000Z");
    expect(utc("2025-03-09T12:00", "America/New_York")).toBe("2025-03-09T16:00:00.000Z");
  });

  it("resolves DST gaps and overlaps to one deterministic instant", () => {
    // 02:30 does not exist on 2025-03-09 in New York: it lands one hour earlier (01:30 EST).
    expect(utc("2025-03-09T02:30", "America/New_York")).toBe("2025-03-09T06:30:00.000Z");
    // 01:30 happens twice on 2025-11-02: the first (EDT) occurrence wins.
    expect(utc("2025-11-02T01:30", "America/New_York")).toBe("2025-11-02T05:30:00.000Z");
  });
});

describe("zonedDateTimeToUtc: midnight in ADMIN_TIMEZONE", () => {
  it("maps 23:59 and 00:00 Vietnam time to 16:59 and 17:00 UTC of the earlier day", () => {
    expect(utc("2101-12-23T23:59")).toBe("2101-12-23T16:59:00.000Z");
    expect(utc("2101-12-24T00:00")).toBe("2101-12-23T17:00:00.000Z");
  });

  it("crosses the UTC day at 07:00 Vietnam time", () => {
    expect(utc("2101-12-24T06:59")).toBe("2101-12-23T23:59:00.000Z");
    expect(utc("2101-12-24T07:00")).toBe("2101-12-24T00:00:00.000Z");
  });

  it("rolls back across month ends, year ends and leap days", () => {
    expect(utc("2102-01-01T00:00")).toBe("2101-12-31T17:00:00.000Z");
    expect(utc("2102-03-01T06:59")).toBe("2102-02-28T23:59:00.000Z");
    expect(utc("2104-03-01T00:00")).toBe("2104-02-29T17:00:00.000Z");
  });
});

describe("zonedDateTimeToUtc: malformed input", () => {
  it.each([
    "",
    "2101-12-23",
    "2101-12-23 10:00",
    "2101-12-23T10:00:00",
    "2101-12-23T10:00Z",
    "2101-12-23T10:00+07:00",
    "2101-12-23T9:05",
    "2101-12-23T09:5",
    "2101-12-23T24:00",
    "2101-12-23T10:60",
    "2101-02-29T10:00",
    "2101-00-10T10:00",
    "2101-13-01T10:00",
    "2101-12-00T10:00",
    "2101-12-32T10:00",
    "23/12/2101 - 10:00",
  ])("throws a RangeError for %j", (value) => {
    expect(() => zonedDateTimeToUtc(value)).toThrow(RangeError);
  });
});

describe("zonedDateTimeToUtc: year edge (Date.UTC reads years 0-99 as 1900-1999)", () => {
  it("keeps years 0000-0099 as written", () => {
    expect(utc("0050-06-15T10:00", "UTC")).toBe("0050-06-15T10:00:00.000Z");
    expect(utc("0099-12-31T23:59", "UTC")).toBe("0099-12-31T23:59:00.000Z");
    // Local mean time applies this far back, so only the year is pinned in Vietnam.
    expect(zonedDateTimeToUtc("0050-06-15T10:00").getUTCFullYear()).toBe(50);
  });

  it("treats year 0000 as the ISO year before 0001 (Intl calls it 1 BC)", () => {
    expect(utc("0000-02-29T12:00", "UTC")).toBe("0000-02-29T12:00:00.000Z");
    // A zone behind UTC puts the offset probe in year 0000.
    expect(utc("0001-01-01T00:00", "Etc/GMT+5")).toBe("0001-01-01T05:00:00.000Z");
  });

  it("converts the last four-digit year", () => {
    expect(utc("9999-12-31T23:59")).toBe("9999-12-31T16:59:00.000Z");
  });
});
