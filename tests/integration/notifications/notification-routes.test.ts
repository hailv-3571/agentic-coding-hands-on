import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as listRoute from "@/app/api/notifications/route";
import * as unreadRoute from "@/app/api/notifications/unread-count/route";
import { NotificationQuery } from "@/features/notifications/server/notification-query";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as fx from "./notification-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) => (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()));

/**
 * GET /api/notifications?limit&cursor and GET /api/notifications/unread-count (A4, A5, A0, C-18):
 * session first (401 before any read), own rows only, newest first by (occurred_at, id), cursor pages
 * without repeats or gaps, limit clamped, bad input 400, every answer `private, no-store`.
 */
let viewer: Sunner;
let stranger: Sunner;
const seeded: string[] = [];
beforeAll(async () => {
  [viewer, stranger] = await Promise.all([createSunner("noti-route-viewer", "Noti Route Viewer"), createSunner("noti-route-stranger", "Noti Stranger")]);
  // 5 rows for the viewer (2 read), newest first = index 4..0; two share one instant (id breaks the tie).
  const times = ["2026-11-20T00:00:01.000001Z", "2026-11-20T00:00:02.000002Z", "2026-11-20T00:00:03.000003Z", "2026-11-20T00:00:03.000003Z", "2026-11-20T00:00:05.000005Z"];
  for (const [index, occurredAt] of times.entries()) seeded.push(await fx.seedNotification(viewer, { occurredAt, read: index < 2 }));
  await fx.seedNotification(stranger, {});
});
beforeEach(() => requestCookies.clear());
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await fx.cleanupNotificationTest([viewer, stranger]);
  await closeAppDb();
});

async function list(query = "") {
  const response = await listRoute.GET(new NextRequest(`http://localhost:3000/api/notifications${query}`));
  return { status: response.status, cacheControl: response.headers.get("cache-control"), json: await response.json() };
}
async function unread() {
  const response = await unreadRoute.GET();
  return { status: response.status, cacheControl: response.headers.get("cache-control"), json: await response.json() };
}

describe("without a session", () => {
  it("answers 401 on both routes and reads nothing", async () => {
    const listSpy = vi.spyOn(NotificationQuery, "list");
    expect(await list()).toEqual({ status: 401, cacheControl: "private, no-store", json: { code: "unauthorized" } });
    expect(await unread()).toEqual({ status: 401, cacheControl: "private, no-store", json: { code: "unauthorized" } });
    expect(listSpy).not.toHaveBeenCalled();
  });
});

describe("signed in", () => {
  beforeEach(async () => signInToJar(requestCookies, viewer.email));

  it("counts the viewer's unread rows only", async () => {
    expect(await unread()).toEqual({ status: 200, cacheControl: "private, no-store", json: { unread: 3 } });
  });

  it("pages the viewer's rows newest first with an opaque cursor, no repeat, no gap", async () => {
    const ids: string[] = [];
    let query = "?limit=2";
    const sizes: number[] = [];
    for (let page = 0; page < 4; page += 1) {
      const { status, cacheControl, json } = await list(query);
      expect({ status, cacheControl }).toEqual({ status: 200, cacheControl: "private, no-store" });
      sizes.push(json.items.length);
      ids.push(...json.items.map((item: { id: string }) => item.id));
      if (!json.nextCursor) break;
      query = `?limit=2&cursor=${json.nextCursor}`;
    }
    expect(sizes).toEqual([2, 2, 1]);
    const tied = [seeded[2], seeded[3]].sort().reverse();
    expect(ids).toEqual([seeded[4], ...tied, seeded[1], seeded[0]]);
  });

  it("returns the contract shape: read flag, href, ISO occurredAt", async () => {
    const { json } = await list("?limit=1");
    expect(json.items[0]).toEqual({ id: seeded[4], type: "secret_box_granted", occurredAt: "2026-11-20T00:00:05.000Z", read: false, href: "/kudos?secretBox=open", params: {} });
    expect(typeof json.nextCursor).toBe("string");
  });

  it("clamps a large limit to 50 and defaults to 20", async () => {
    const spy = vi.spyOn(NotificationQuery, "list");
    await list("?limit=999");
    await list();
    expect(spy.mock.calls.map(([, options]) => options.limit)).toEqual([50, 20]);
  });

  it.each(["?limit=0", "?limit=abc", "?cursor=broken"])("answers 400 for %s", async (query) => {
    expect(await list(query)).toEqual({ status: 400, cacheControl: "private, no-store", json: { code: "invalid_request" } });
  });

  it("answers a bare 500 when the query fails", async () => {
    vi.spyOn(NotificationQuery, "list").mockRejectedValue(new Error("db down: secret detail"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await list()).toEqual({ status: 500, cacheControl: "private, no-store", json: { code: "unexpected" } });
  });
});
