import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { adminCsvFilename } = await import("@/shared/admin/admin-csv-filename");

describe("adminCsvFilename", () => {
  it("is {prefix}-yyyyMMdd-HHmm.csv on the ADMIN_TIMEZONE wall clock", () => {
    expect(adminCsvFilename("users", new Date("2025-12-31T17:05:00.000Z"))).toBe("users-20260101-0005.csv");
    expect(adminCsvFilename("overview", new Date("2025-06-01T01:02:00.000Z"))).toBe("overview-20250601-0802.csv");
  });
});
