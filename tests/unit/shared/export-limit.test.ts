import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({ env: { EXPORT_MAX_ROWS: 3 } }));

const { assertWithinExportLimit, ExportLimitExceededError } = await import(
  "@/shared/admin/export-limit"
);

describe("assertWithinExportLimit", () => {
  it("allows counts up to EXPORT_MAX_ROWS", () => {
    expect(() => assertWithinExportLimit(0)).not.toThrow();
    expect(() => assertWithinExportLimit(3)).not.toThrow();
  });

  it("throws a typed error carrying the limit when the count is over", () => {
    try {
      assertWithinExportLimit(4);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ExportLimitExceededError);
      expect((error as InstanceType<typeof ExportLimitExceededError>).limit).toBe(3);
      expect((error as InstanceType<typeof ExportLimitExceededError>).count).toBe(4);
    }
  });

  it("rejects negative or fractional counts as programmer errors", () => {
    expect(() => assertWithinExportLimit(-1)).toThrow(RangeError);
    expect(() => assertWithinExportLimit(1.5)).toThrow(RangeError);
  });
});
