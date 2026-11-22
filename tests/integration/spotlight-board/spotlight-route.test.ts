import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as spotlightRoute from "@/app/api/spotlight/route";
import { loadSpotlightSnapshot } from "@/features/spotlight-board/server/load-spotlight-snapshot";
import { SpotlightSnapshotQuery } from "@/features/spotlight-board/server/spotlight-snapshot-query";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) => (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()));

/**
 * GET /api/spotlight (A1, A0, C-18) and the Live board slot's loader: the session comes first (401
 * before any DB read), every answer is `private, no-store`, a failure is a bare 500 / `null` (the
 * region's own error state), never a detail.
 */
let viewer: Sunner;
const call = async () => {
  const response = await spotlightRoute.GET();
  return { status: response.status, cacheControl: response.headers.get("cache-control"), json: await response.json() };
};

beforeAll(async () => {
  viewer = await createSunner("spot-route-viewer", "Spot Route Viewer");
});
beforeEach(() => requestCookies.clear());
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await cleanupSunners([viewer]);
  await closeAppDb();
});

describe("GET /api/spotlight", () => {
  it("answers 401 without a session and reads nothing", async () => {
    const load = vi.spyOn(SpotlightSnapshotQuery, "load");
    expect(await call()).toEqual({ status: 401, cacheControl: "private, no-store", json: { code: "unauthorized" } });
    expect(load).not.toHaveBeenCalled();
  });

  it("returns the snapshot to a signed-in Sunner, never cacheable", async () => {
    await signInToJar(requestCookies, viewer.email);
    const { status, cacheControl, json } = await call();
    expect({ status, cacheControl }).toEqual({ status: 200, cacheControl: "private, no-store" });
    expect(Object.keys(json).sort()).toEqual(["names", "recent", "total"]);
    expect(json).toEqual(await SpotlightSnapshotQuery.load());
  });

  it("answers a bare 500 when the query fails", async () => {
    await signInToJar(requestCookies, viewer.email);
    vi.spyOn(SpotlightSnapshotQuery, "load").mockRejectedValue(new Error("db down: secret detail"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await call()).toEqual({ status: 500, cacheControl: "private, no-store", json: { code: "unexpected" } });
  });
});

describe("loadSpotlightSnapshot (Live board slot)", () => {
  it("returns the snapshot for the signed-in Sunner, or null when the query fails", async () => {
    await signInToJar(requestCookies, viewer.email);
    expect(await loadSpotlightSnapshot()).toEqual(await SpotlightSnapshotQuery.load());
    vi.spyOn(SpotlightSnapshotQuery, "load").mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await loadSpotlightSnapshot()).toBeNull();
  });
});
