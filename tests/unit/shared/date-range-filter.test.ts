import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({
  env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" },
}));

const { adminDateRangeSchema } = await import("@/shared/admin/date-range-filter");
const { formatInZone, startOfDayInZone, toAdminZone } = await import(
  "@/shared/admin/timezone"
);

describe("timezone helpers", () => {
  it("finds midnight in the admin zone (+07:00) as the previous UTC evening", () => {
    expect(startOfDayInZone("2025-11-20").toISOString()).toBe(
      "2025-11-19T17:00:00.000Z",
    );
  });

  it("supports an explicit zone, including DST days", () => {
    // New York switches to EDT (-04:00) at 02:00 on 2025-03-09; midnight is still EST.
    expect(startOfDayInZone("2025-03-09", "America/New_York").toISOString()).toBe(
      "2025-03-09T05:00:00.000Z",
    );
    expect(startOfDayInZone("2025-03-10", "America/New_York").toISOString()).toBe(
      "2025-03-10T04:00:00.000Z",
    );
  });

  it("converts an instant to wall-clock parts in the admin zone", () => {
    expect(toAdminZone(new Date("2025-11-19T17:00:00Z"))).toEqual({
      year: 2025,
      month: 11,
      day: 20,
      hour: 0,
      minute: 0,
      second: 0,
    });
  });

  it("formats an instant as admin-zone local time", () => {
    expect(formatInZone(new Date("2025-11-19T16:59:59Z"))).toBe("2025-11-19 23:59:59");
  });

  it("rejects malformed calendar dates", () => {
    expect(() => startOfDayInZone("2025-02-30")).toThrow(/calendar date/i);
  });
});

describe("adminDateRangeSchema", () => {
  it("turns inclusive local days into a half-open UTC range [start, end)", () => {
    const range = adminDateRangeSchema.parse({ from: "2025-11-20", to: "2025-11-20" });
    expect(range.start?.toISOString()).toBe("2025-11-19T17:00:00.000Z");
    expect(range.end?.toISOString()).toBe("2025-11-20T17:00:00.000Z");
  });

  it("puts 23:59:59 local inside the range and 00:00 next day outside", () => {
    const { start, end } = adminDateRangeSchema.parse({ from: "2025-11-20", to: "2025-11-20" });
    const lastSecond = new Date("2025-11-20T16:59:59Z");
    const nextMidnight = new Date("2025-11-20T17:00:00Z");
    const previousEvening = new Date("2025-11-19T16:59:59Z");
    const inRange = (d: Date) => d >= start! && d < end!;
    expect(inRange(lastSecond)).toBe(true);
    expect(inRange(nextMidnight)).toBe(false);
    expect(inRange(previousEvening)).toBe(false);
  });

  it("rolls `to` over month and year ends", () => {
    const { end } = adminDateRangeSchema.parse({ to: "2025-12-31" });
    expect(end?.toISOString()).toBe("2025-12-31T17:00:00.000Z");
  });

  it("treats missing or empty bounds as open-ended", () => {
    expect(adminDateRangeSchema.parse({})).toEqual({ start: undefined, end: undefined });
    expect(adminDateRangeSchema.parse({ from: "", to: "" })).toEqual({
      start: undefined,
      end: undefined,
    });
  });

  it("rejects from > to", () => {
    const result = adminDateRangeSchema.safeParse({ from: "2025-11-21", to: "2025-11-20" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["to"]);
  });

  it("rejects non-ISO dates", () => {
    expect(adminDateRangeSchema.safeParse({ from: "20/11/2025" }).success).toBe(false);
    expect(adminDateRangeSchema.safeParse({ from: "2025-02-30" }).success).toBe(false);
  });
});
