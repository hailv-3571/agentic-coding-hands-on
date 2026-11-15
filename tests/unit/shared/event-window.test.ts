import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({
  env: { EVENT_END_AT: Date.parse("2026-12-31T16:59:59.000Z") },
}));

const { isEventWritingOpen } = await import("@/shared/config/event-window");

describe("isEventWritingOpen", () => {
  it("is open before EVENT_END_AT", () => {
    expect(isEventWritingOpen(new Date("2026-12-31T16:59:58.999Z"))).toBe(true);
  });

  it("closes exactly at EVENT_END_AT (exclusive end)", () => {
    expect(isEventWritingOpen(new Date("2026-12-31T16:59:59.000Z"))).toBe(false);
    expect(isEventWritingOpen(new Date("2027-01-01T00:00:00.000Z"))).toBe(false);
  });
});
