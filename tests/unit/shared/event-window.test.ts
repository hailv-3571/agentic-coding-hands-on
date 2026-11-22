import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({
  env: {
    LAUNCH_AT: Date.parse("2026-11-30T17:00:00.000Z"),
    EVENT_END_AT: Date.parse("2026-12-31T16:59:59.000Z"),
  },
}));

const { isEventWritingOpen } = await import("@/shared/config/event-window");

describe("isEventWritingOpen", () => {
  it("is closed before LAUNCH_AT, so prelaunch writes are refused even past the proxy (decision 2026-11-22)", () => {
    expect(isEventWritingOpen(new Date("2026-11-30T16:59:59.999Z"))).toBe(false);
  });

  it("opens exactly at LAUNCH_AT (inclusive start)", () => {
    expect(isEventWritingOpen(new Date("2026-11-30T17:00:00.000Z"))).toBe(true);
  });

  it("is open before EVENT_END_AT", () => {
    expect(isEventWritingOpen(new Date("2026-12-31T16:59:58.999Z"))).toBe(true);
  });

  it("closes exactly at EVENT_END_AT (exclusive end)", () => {
    expect(isEventWritingOpen(new Date("2026-12-31T16:59:59.000Z"))).toBe(false);
    expect(isEventWritingOpen(new Date("2027-01-01T00:00:00.000Z"))).toBe(false);
  });
});
