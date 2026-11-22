import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as drainRoute from "@/app/api/internal/notifications/drain/route";
import { NotificationEventProcessor } from "@/features/notifications/server/notification-event-processor";
import { closeAppDb } from "../auth/auth-test-users";
import { createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { drainEnv } from "./drain-env-override";
import * as fx from "./notification-test-fixtures";

vi.mock("@/shared/config/env", async (original) => (await import("./drain-env-override")).withDrainEnv(await original()));

/**
 * POST /api/internal/notifications/drain (plan security, phase 10 pattern): 503 `not_configured` while
 * OUTBOX_DRAIN_SECRET is unset, 401 for a missing or wrong `x-drain-secret` (constant-time compare, any
 * length) without draining, and with the right secret one drain run whose counts are returned.
 */
const SECRET = "drain-secret-0123456789abcdef-0123456789abcdef";
let user: Sunner;

const call = async (secret?: string) => {
  const headers = new Headers(secret === undefined ? {} : { "x-drain-secret": secret });
  const response = await drainRoute.POST(new NextRequest("http://localhost:3000/api/internal/notifications/drain", { method: "POST", headers }));
  return { status: response.status, cacheControl: response.headers.get("cache-control"), json: await response.json() };
};

beforeAll(async () => {
  user = await createSunner("noti-drain-user", "Noti Drain User");
  await fx.drainUntilIdle();
});
beforeEach(() => {
  drainEnv.secret = undefined;
  vi.restoreAllMocks();
});
afterAll(async () => {
  await fx.cleanupNotificationTest([user]);
  await closeAppDb();
});

describe("drain route guard", () => {
  it("answers 503 `not_configured` while OUTBOX_DRAIN_SECRET is unset, whatever the header", async () => {
    const drain = vi.spyOn(NotificationEventProcessor, "drain");
    expect(await call(SECRET)).toEqual({ status: 503, cacheControl: "no-store", json: { code: "not_configured" } });
    expect(drain).not.toHaveBeenCalled();
  });

  it.each([
    ["no header", undefined],
    ["an empty header", ""],
    ["a wrong secret of the same length", SECRET.replace(/.$/, "X")],
    ["a prefix of the secret", SECRET.slice(0, 10)],
    ["the secret plus a suffix", `${SECRET}x`],
  ])("answers 401 `unauthorized` for %s and drains nothing", async (_label, header) => {
    drainEnv.secret = SECRET;
    const drain = vi.spyOn(NotificationEventProcessor, "drain");
    expect(await call(header)).toEqual({ status: 401, cacheControl: "no-store", json: { code: "unauthorized" } });
    expect(drain).not.toHaveBeenCalled();
  });

  it("drains with the right secret and reports the run", async () => {
    drainEnv.secret = SECRET;
    const eventId = await fx.addEvent("BoxGranted", { userId: user.id, count: 1 });
    const answer = await call(SECRET);
    expect({ status: answer.status, cacheControl: answer.cacheControl }).toEqual({ status: 200, cacheControl: "no-store" });
    expect(answer.json).toEqual({ processed: expect.any(Number), malformed: 0, retrying: 0, failed: 0 });
    expect(answer.json.processed).toBeGreaterThanOrEqual(1);
    expect(await fx.outboxStateOf(eventId)).toMatchObject({ consumed: true });
    expect((await fx.notificationsOf(user.id)).map((row) => row.type)).toEqual(["secret_box_granted"]);
  });

  it("answers a bare 500 when the drain cannot run", async () => {
    drainEnv.secret = SECRET;
    vi.spyOn(NotificationEventProcessor, "drain").mockRejectedValue(new Error("db down: secret detail"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await call(SECRET)).toEqual({ status: 500, cacheControl: "no-store", json: { code: "unexpected" } });
  });
});
