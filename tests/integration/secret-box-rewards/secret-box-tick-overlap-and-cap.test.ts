import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as tickRoute from "@/app/api/internal/secret-box/tick/route";
import { tryLockSecretBoxTick } from "@/features/secret-box-rewards/server/secret-box-advisory-lock";
import { SecretBoxSweepJob } from "@/features/secret-box-rewards/server/secret-box-sweep-job";
import { testDb } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart } from "../kudos-hearts/kudo-heart-fixtures";
import * as fx from "./secret-box-fixtures";
import { resetSecretBoxEnv, secretBoxEnv } from "./secret-box-env-override";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));
vi.mock("@/features/secret-box-rewards/secret-box-config", async (original) => ({ ...(await original<object>()), SWEEP_MAX_SENDERS_PER_TICK: 2 }));

/**
 * Internal tick load guards (review W-low): the whole tick holds one advisory lock, so a tick that
 * starts while another still runs answers 200 `{skipped: true}` and does no work; the sweep
 * reconciles at most SWEEP_MAX_SENDERS_PER_TICK due senders (2 here) and leaves the rest due for the
 * next tick (the 10-minute window overlaps). Senders already up to date take no slot. Three senders
 * of this file are due one box each; other due senders of the shared DB may take slots too, so the
 * counts below are bounds where they must be.
 */
const SECRET = "tick-secret-0123456789abcdef-0123456789abcdef";
let senders: Sunner[];
let fans: Sunner[];

const tick = async () => {
  const headers = new Headers({ "x-job-secret": SECRET });
  const response = await tickRoute.POST(new NextRequest("http://localhost:3000/api/internal/secret-box/tick", { method: "POST", headers }));
  return { status: response.status, cacheControl: response.headers.get("cache-control"), json: await response.json() };
};
/** How many of this file's senders hold a box. */
const sendersWithBoxes = async () => (await Promise.all(senders.map((sender) => fx.boxesOf(sender.id)))).filter((boxes) => boxes.length > 0).length;

beforeAll(async () => {
  const users = await fx.createSunners(["sbx-cap-s1", "sbx-cap-s2", "sbx-cap-s3", "sbx-cap-f1", "sbx-cap-f2", "sbx-cap-f3"]);
  senders = users.slice(0, 3);
  fans = users.slice(3);
  for (const sender of senders) {
    const kudoId = await insertKudo({ sender, recipient: fans[0] });
    for (const fan of fans) await insertHeart(kudoId, fan.id, 2); // weighted 6 = 1 box, hearted just now
  }
});
beforeEach(async () => {
  resetSecretBoxEnv();
  secretBoxEnv.jobSecret = SECRET;
  await fx.resetRewards(senders.map((sender) => sender.id));
});
afterAll(async () => {
  await fx.cleanupSecretBoxUsers([...senders, ...fans]);
  await closeAppDb();
});

describe("internal tick overlap guard", () => {
  it("skips the whole tick with `{skipped: true}` while another tick holds the lock, then runs once it is free", async () => {
    const whileHeld = await testDb.transaction(async (tx) => {
      expect(await tryLockSecretBoxTick(tx)).toBe(true);
      return tick();
    });
    expect(whileHeld).toEqual({ status: 200, cacheControl: "no-store", json: { skipped: true } });
    expect(await sendersWithBoxes()).toBe(0);

    const afterRelease = await tick();
    expect(afterRelease).toMatchObject({ status: 200, json: { sweep: { senders: 2 }, nationalKudos: { status: "not_due" } } });
    expect(await sendersWithBoxes()).toBeGreaterThanOrEqual(1);
  });
});

describe("sweep cap per tick", () => {
  it("reconciles at most the cap of due senders per tick and leaves the rest for the next ticks", async () => {
    const first = await SecretBoxSweepJob.run();
    expect(first).toMatchObject({ senders: 2, failed: 0 });
    expect(first.deferred).toBeGreaterThanOrEqual(1);
    expect(await sendersWithBoxes()).toBeLessThanOrEqual(2);

    for (let next = 0; next < 10 && (await sendersWithBoxes()) < senders.length; next++) {
      expect((await SecretBoxSweepJob.run()).senders).toBeLessThanOrEqual(2);
    }
    expect(await sendersWithBoxes()).toBe(senders.length);
    for (const sender of senders) expect(await fx.boxesOf(sender.id)).toEqual([{ seq: 1, status: "unopened" }]);
  });

  it("gives no slot to senders whose boxes are already up to date", async () => {
    for (let run = 0; run < 10 && (await SecretBoxSweepJob.run()).deferred > 0; run++);
    // Every hearted sender is still in the window, but none is due: the tick reconciles nobody.
    expect(await SecretBoxSweepJob.run()).toEqual({ senders: 0, granted: 0, failed: 0, deferred: 0 });
  });
});
