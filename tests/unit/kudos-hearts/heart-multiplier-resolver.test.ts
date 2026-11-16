import { beforeEach, describe, expect, it, vi } from "vitest";

const findActive = vi.hoisted(() => vi.fn());
vi.mock("@/shared/config/env", () => ({ env: { HEART_CAMPAIGN_MULTIPLIER: 2 } }));
vi.mock("@/features/admin-campaigns/server/campaign-active-reader", () => ({ campaignActiveReader: { findActive } }));

const { DEFAULT_HEART_MULTIPLIER, HeartMultiplierResolver } = await import(
  "@/features/kudos-hearts/server/heart-multiplier-resolver"
);

/** ALG-001 / DEC-002 / BR-005: 2 inside an active x2 campaign, else 1; never throws, never < 1. */
const AT = new Date("2101-11-20T04:00:00.000Z");
const ACTIVE = {
  id: 7,
  name: "Campaign x2 heart",
  startsAt: new Date("2101-11-20T03:00:00.000Z"),
  endsAt: new Date("2101-11-20T05:00:00.000Z"),
};

describe("HeartMultiplierResolver.resolve", () => {
  beforeEach(() => {
    findActive.mockReset();
    vi.restoreAllMocks();
  });

  it("returns HEART_CAMPAIGN_MULTIPLIER while a campaign is active at the given instant", async () => {
    findActive.mockResolvedValue(ACTIVE);
    expect(await HeartMultiplierResolver.resolve(AT)).toBe(2);
    expect(findActive).toHaveBeenCalledWith(AT);
  });

  it("returns 1 when no campaign is active", async () => {
    findActive.mockResolvedValue(null);
    expect(DEFAULT_HEART_MULTIPLIER).toBe(1);
    expect(await HeartMultiplierResolver.resolve(AT)).toBe(1);
  });

  it("returns 1 and logs a warning when the reader fails, instead of throwing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    findActive.mockRejectedValue(new Error("connection refused"));
    expect(await HeartMultiplierResolver.resolve(AT)).toBe(1);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("returns 1 when the reader throws synchronously", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    findActive.mockImplementation(() => {
      throw new TypeError("boom");
    });
    expect(await HeartMultiplierResolver.resolve(AT)).toBe(1);
  });
});
