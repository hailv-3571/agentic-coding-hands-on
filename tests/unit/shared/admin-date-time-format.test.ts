import { describe, expect, it, vi } from "vitest";
import { formatAdminDateTime } from "@/shared/admin/admin-date-time-format";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { toAdminZone } = await import("@/shared/admin/timezone");

describe("formatAdminDateTime (Time to get 6 Badges / Last Logged in, FR-208)", () => {
  it("writes dd/MM/yyyy HH:mm with zero padding", () => {
    expect(formatAdminDateTime({ year: 2026, month: 1, day: 5, hour: 9, minute: 7, second: 59 })).toBe("05/01/2026 09:07");
    expect(formatAdminDateTime({ year: 2025, month: 12, day: 23, hour: 23, minute: 0, second: 0 })).toBe("23/12/2025 23:00");
  });

  it("pads the year to four digits", () => {
    expect(formatAdminDateTime({ year: 50, month: 3, day: 1, hour: 0, minute: 0, second: 0 })).toBe("01/03/0050 00:00");
  });

  it("shows an instant on the ADMIN_TIMEZONE wall clock, across midnight", () => {
    // 17:30 UTC is 00:30 the next day in Vietnam (UTC+7).
    expect(formatAdminDateTime(toAdminZone(new Date("2025-12-31T17:30:00Z")))).toBe("01/01/2026 00:30");
  });
});
