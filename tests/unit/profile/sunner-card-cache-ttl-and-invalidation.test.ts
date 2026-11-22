import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SunnerCardView } from "@/features/profile/schemas/profile-views";

/**
 * Hover card data cache (phase 12 review W2). A loaded card is served for SUNNER_CARD_TTL_MS
 * without a new request (RISK-01: dozens of avatars on the Live board); an older copy is still shown
 * while it refreshes on the next open; a Kudo sent to that Sunner drops the copy, so the next open
 * shows the new counts. Concurrent opens share one request, a failure is never cached, and moving to
 * another page starts empty.
 */
const USER = "9b2f4c1e-0000-4000-8000-000000000001";
const OTHER = "9b2f4c1e-0000-4000-8000-000000000002";
const T0 = new Date("2026-12-01T00:00:00.000Z").getTime();

type CacheModule = typeof import("@/features/profile/lib/sunner-card-cache");
let cache: CacheModule;
let location: { pathname: string };
let served: number;
const fetchMock = vi.fn(async (url: string) => {
  const id = url.split("/")[3];
  const card: SunnerCardView = { id, fullName: "A", departmentName: null, heroTier: null, kudosReceived: served++, kudosSent: 0, canSendKudo: true };
  return Response.json(card);
});

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  served = 0;
  fetchMock.mockClear();
  location = { pathname: "/kudos" };
  vi.stubGlobal("window", { location });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.resetModules();
  cache = await import("@/features/profile/lib/sunner-card-cache");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const received = (userId: string) => cache.cachedSunnerCard(userId)?.kudosReceived;

describe("sunner card cache", () => {
  it("serves a loaded card for 60 s without asking again, then refreshes it while still showing the old copy", async () => {
    expect(cache.SUNNER_CARD_TTL_MS).toBe(60_000);
    await cache.refreshSunnerCard(USER);
    expect(fetchMock).toHaveBeenCalledWith(`/api/sunners/${USER}/card`, expect.anything());
    expect(received(USER)).toBe(0);

    vi.setSystemTime(T0 + 59_999);
    expect(cache.refreshSunnerCard(USER)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(T0 + 60_000);
    const refresh = cache.refreshSunnerCard(USER);
    expect(refresh).not.toBeNull();
    expect(received(USER)).toBe(0);
    await refresh;
    expect(received(USER)).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("drops a card once a Kudo is sent to that Sunner: the next open asks again, other cards stay", async () => {
    await Promise.all([cache.refreshSunnerCard(USER), cache.refreshSunnerCard(OTHER)]);
    expect([received(USER), received(OTHER)]).toEqual([0, 1]);

    cache.invalidateSunnerCard(USER);
    expect(received(USER)).toBeUndefined();
    expect(cache.refreshSunnerCard(OTHER)).toBeNull();
    await cache.refreshSunnerCard(USER);
    expect(received(USER)).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ignores a response that was already in flight when the card was dropped", async () => {
    const stale = cache.refreshSunnerCard(USER);
    cache.invalidateSunnerCard(USER);
    await stale;
    expect(received(USER)).toBeUndefined();
  });

  it("shares one request between concurrent opens, never caches a failure, and starts empty on another page", async () => {
    expect(cache.refreshSunnerCard(USER)).toBe(cache.refreshSunnerCard(USER));
    await cache.refreshSunnerCard(USER);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    location.pathname = "/profile";
    expect(received(USER)).toBeUndefined();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await cache.refreshSunnerCard(USER);
    expect(received(USER)).toBeUndefined();
    await cache.refreshSunnerCard(USER);
    expect(received(USER)).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
