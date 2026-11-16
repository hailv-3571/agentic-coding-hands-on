import { describe, expect, it } from "vitest";
import { campaignPhase } from "@/features/admin-campaigns/server/campaign-phase";

/** BR-001 / BR-004: half-open window [startsAt, endsAt); the phase is computed, never stored. */
const WINDOW = {
  startsAt: new Date("2101-12-23T03:00:00.000Z"),
  endsAt: new Date("2101-12-24T03:00:00.000Z"),
};
const at = (iso: string) => new Date(iso);

describe("campaignPhase", () => {
  it("is upcoming before startsAt", () => {
    expect(campaignPhase(WINDOW, at("2101-12-23T02:59:59.999Z"))).toBe("upcoming");
  });

  it("is active from exactly startsAt", () => {
    expect(campaignPhase(WINDOW, at("2101-12-23T03:00:00.000Z"))).toBe("active");
  });

  it("is still active one millisecond before endsAt", () => {
    expect(campaignPhase(WINDOW, at("2101-12-24T02:59:59.999Z"))).toBe("active");
  });

  it("is ended from exactly endsAt (the end is exclusive)", () => {
    expect(campaignPhase(WINDOW, at("2101-12-24T03:00:00.000Z"))).toBe("ended");
    expect(campaignPhase(WINDOW, at("2102-01-01T00:00:00.000Z"))).toBe("ended");
  });
});
