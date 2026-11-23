import { describe, expect, it } from "vitest";
import { overviewExportHref, overviewHref } from "@/features/admin-overview/lib/overview-url-params";

describe("overviewHref (URL = state, FR-401)", () => {
  it("is the bare route for all time", () => {
    expect(overviewHref({ from: null, to: null })).toBe("/admin/overview");
  });

  it("writes both ends of the range", () => {
    expect(overviewHref({ from: "2026-11-01", to: "2026-11-30" })).toBe("/admin/overview?from=2026-11-01&to=2026-11-30");
  });

  it("accepts an open end on either side", () => {
    expect(overviewHref({ from: "2026-11-01", to: null })).toBe("/admin/overview?from=2026-11-01");
    expect(overviewHref({ from: null, to: "2026-11-30" })).toBe("/admin/overview?to=2026-11-30");
  });
});

describe("overviewExportHref", () => {
  it("carries the same range as the table", () => {
    expect(overviewExportHref({ from: "2026-11-01", to: "2026-11-30" })).toBe("/api/admin/overview/export?from=2026-11-01&to=2026-11-30");
  });

  it("is the bare export route for all time", () => {
    expect(overviewExportHref({ from: null, to: null })).toBe("/api/admin/overview/export");
  });
});
