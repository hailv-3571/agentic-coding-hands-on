import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as tickRoute from "@/app/api/internal/secret-box/tick/route";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart } from "../kudos-hearts/kudo-heart-fixtures";
import * as fx from "./secret-box-fixtures";
import { resetSecretBoxEnv, secretBoxEnv } from "./secret-box-env-override";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * POST /api/internal/secret-box/tick (FR-603, plan security): 503 `not_configured` while
 * INTERNAL_JOB_SECRET is unset, 401 for a missing or wrong `x-job-secret` (constant-time compare, any
 * length), and with the right secret the sweep grants due boxes and the finalize job reports not due.
 */
const SECRET = "tick-secret-0123456789abcdef-0123456789abcdef";
let sender: Sunner;
let fans: Sunner[];

const tick = async (secret?: string) => {
  const headers = new Headers(secret === undefined ? {} : { "x-job-secret": secret });
  const response = await tickRoute.POST(new NextRequest("http://localhost:3000/api/internal/secret-box/tick", { method: "POST", headers }));
  return { status: response.status, cacheControl: response.headers.get("cache-control"), json: await response.json() };
};

beforeAll(async () => {
  [sender, ...fans] = await fx.createSunners(["sbx-tick-sender", "sbx-tick-a", "sbx-tick-b", "sbx-tick-c"]);
  const kudoId = await insertKudo({ sender, recipient: fans[0] });
  for (const fan of fans) await insertHeart(kudoId, fan.id, 2); // weighted 6, hearted just now
});
beforeEach(async () => {
  resetSecretBoxEnv();
  await fx.resetRewards([sender.id]);
});
afterAll(async () => {
  await fx.cleanupSecretBoxUsers([sender, ...fans]);
  await closeAppDb();
});

describe("internal tick guard", () => {
  it("answers 503 `not_configured` while INTERNAL_JOB_SECRET is unset, whatever the header", async () => {
    expect(await tick(SECRET)).toEqual({ status: 503, cacheControl: "no-store", json: { code: "not_configured" } });
    expect(await fx.boxesOf(sender.id)).toEqual([]);
  });

  it.each([
    ["no header", undefined],
    ["an empty header", ""],
    ["a wrong secret of the same length", SECRET.replace(/.$/, "X")],
    ["a prefix of the secret", SECRET.slice(0, 10)],
    ["the secret plus a suffix", `${SECRET}x`],
  ])("answers 401 `unauthorized` for %s and runs no job", async (_label, header) => {
    secretBoxEnv.jobSecret = SECRET;
    expect(await tick(header)).toEqual({ status: 401, cacheControl: "no-store", json: { code: "unauthorized" } });
    expect(await fx.boxesOf(sender.id)).toEqual([]);
  });

  it("runs the sweep then the finalize job with the right secret", async () => {
    secretBoxEnv.jobSecret = SECRET;
    const answer = await tick(SECRET);
    expect(answer).toMatchObject({ status: 200, cacheControl: "no-store", json: { nationalKudos: { status: "not_due" } } });
    expect(answer.json.sweep.senders).toBeGreaterThanOrEqual(1);
    expect(answer.json.sweep.granted).toBeGreaterThanOrEqual(1);
    expect(await fx.boxesOf(sender.id)).toEqual([{ seq: 1, status: "unopened" }]);
    expect(await fx.eventsFor("BoxGranted", sender.id)).toEqual([{ userId: sender.id, count: 1 }]);
  });
});
