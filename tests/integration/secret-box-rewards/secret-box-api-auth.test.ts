import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as meRoute from "@/app/api/secret-boxes/me/route";
import * as openRoute from "@/app/api/secret-boxes/open/route";
import { SECRET_BOX_ICON_CODES } from "@/features/secret-box-rewards/schemas/secret-box-views";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart } from "../kudos-hearts/kudo-heart-fixtures";
import * as fx from "./secret-box-fixtures";
import { resetSecretBoxEnv } from "./secret-box-env-override";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) => (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()));
vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * GET /api/secret-boxes/me and POST /api/secret-boxes/open (A2, A3, FR-602, security): 401 before any
 * DB work without a session, the user id ONLY from the session (never body/query), 400 for a bad
 * Idempotency-Key, 409 `no_box_left`, replay on retry, and `Cache-Control: private, no-store`.
 */
let owner: Sunner;
let other: Sunner;
let fan: Sunner;
const ICON_PRIZE_CODES = SECRET_BOX_ICON_CODES.map((code) => code.toLowerCase().replaceAll("_", "-"));

const call = async (handler: (request: NextRequest) => Promise<Response>, path: string, init: { method?: string; key?: string | null; body?: string } = {}) => {
  const headers = new Headers();
  if (init.key !== undefined && init.key !== null) headers.set("Idempotency-Key", init.key);
  const response = await handler(new NextRequest(`http://localhost:3000${path}`, { method: init.method ?? "GET", headers, body: init.body }));
  return { status: response.status, cacheControl: response.headers.get("cache-control"), json: await response.json() };
};
const open = (key: string | null, path = "/api/secret-boxes/open", body?: string) => call(openRoute.POST, path, { method: "POST", key, body });

beforeAll(async () => {
  [owner, other, fan] = await fx.createSunners(["sbx-api-owner", "sbx-api-other", "sbx-api-fan"]);
  await fx.restrictPrizePool(ICON_PRIZE_CODES);
});
beforeEach(async () => {
  resetSecretBoxEnv();
  requestCookies.clear();
  await fx.resetRewards([owner.id, other.id]);
});
afterAll(async () => {
  await fx.restorePrizePool();
  await fx.cleanupSecretBoxUsers([owner, other, fan]);
  await closeAppDb();
});

describe("secret box routes — guards", () => {
  it("answer 401 `unauthorized` without a session and touch no box, never cacheable", async () => {
    await fx.grantBoxes(owner.id, 1);
    expect(await call(meRoute.GET, "/api/secret-boxes/me")).toEqual({ status: 401, cacheControl: "private, no-store", json: { code: "unauthorized" } });
    expect(await open(randomUUID())).toEqual({ status: 401, cacheControl: "private, no-store", json: { code: "unauthorized" } });
    expect((await fx.boxesOf(owner.id)).map((box) => box.status)).toEqual(["unopened"]);
  });

  it.each([
    ["missing", null],
    ["not a uuid", "open-it"],
    ["not a v4 uuid", "6f1c2b9e-3d4a-1e5f-9a8b-7c6d5e4f3a2b"],
  ])("answers 400 `invalid_idempotency_key` for a %s key and opens nothing", async (_label, key) => {
    await fx.grantBoxes(owner.id, 1);
    await signInToJar(requestCookies, owner.email);
    expect(await open(key)).toEqual({ status: 400, cacheControl: "private, no-store", json: { code: "invalid_idempotency_key" } });
    expect((await fx.boxesOf(owner.id)).map((box) => box.status)).toEqual(["unopened"]);
  });
});

describe("secret box routes — session user only", () => {
  it("GET /me reconciles first: hearts earned since the last visit become an openable box", async () => {
    const kudoId = await insertKudo({ sender: owner, recipient: fan });
    await insertHeart(kudoId, fan.id, 2);
    await insertHeart(kudoId, other.id, 2);
    const extra = await insertKudo({ sender: owner, recipient: fan });
    await insertHeart(extra, fan.id, 1); // weighted 5 → 1 box
    await signInToJar(requestCookies, owner.email);
    expect(await call(meRoute.GET, "/api/secret-boxes/me")).toEqual({ status: 200, cacheControl: "private, no-store", json: { unopened: 1 } });
  });

  it("opens the session user's own box whatever userId the body or query names, then replays and 409s", async () => {
    await fx.grantBoxes(owner.id, 1);
    await fx.grantBoxes(other.id, 1);
    await signInToJar(requestCookies, owner.email);
    const key = randomUUID();
    const first = await open(key, `/api/secret-boxes/open?userId=${other.id}`, JSON.stringify({ userId: other.id }));
    expect(first).toMatchObject({ status: 200, cacheControl: "private, no-store", json: { kind: "icon", unopenedLeft: 0, replayed: false } });
    expect(Object.keys(first.json).sort()).toEqual(["duplicate", "giftName", "iconCode", "kind", "name", "replayed", "setCompleted", "unopenedLeft"]);
    expect((await fx.boxesOf(owner.id)).map((box) => box.status)).toEqual(["opened"]);
    expect((await fx.boxesOf(other.id)).map((box) => box.status)).toEqual(["unopened"]);

    expect(await open(key)).toEqual({ ...first, json: { ...first.json, replayed: true } });
    expect(await open(randomUUID())).toEqual({ status: 409, cacheControl: "private, no-store", json: { code: "no_box_left" } });
  });
});
