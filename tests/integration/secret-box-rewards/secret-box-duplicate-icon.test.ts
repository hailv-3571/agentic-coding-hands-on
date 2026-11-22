import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SecretBoxOpenService } from "@/features/secret-box-rewards/server/secret-box-open-service";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as fx from "./secret-box-fixtures";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * Duplicate-icon flag (DEC-002, SCR-secret-box-open E08 "Bạn đã có icon này rồi"): `duplicate` is
 * true when the drawn icon was already owned before this open, false for a first copy and for every
 * gift; replaying an Idempotency-Key returns the value of that open, even after later opens. The
 * pool is REVIVAL only (or one test gift), so every draw is known.
 */
const GIFT_CODE = "sbx-dup-test-gift";
let user: Sunner;

const openWith = (key: string) => SecretBoxOpenService.openNext(user.id, key);

beforeAll(async () => {
  [user] = await fx.createSunners(["sbx-dup-user"]);
});
beforeEach(async () => {
  await fx.restorePrizePool();
  await fx.resetRewards([user.id]);
});
afterAll(async () => {
  await fx.restorePrizePool();
  await fx.cleanupSecretBoxUsers([user]);
  await fx.deleteTestPrizes([GIFT_CODE]);
  await closeAppDb();
});

describe("duplicate icon flag", () => {
  it("is false for the first copy of an icon, true for the next, and each replay keeps its value", async () => {
    await fx.restrictPrizePool(["revival"]);
    await fx.grantBoxes(user.id, 2);
    const [firstKey, secondKey] = [randomUUID(), randomUUID()];
    const first = await openWith(firstKey);
    const second = await openWith(secondKey);

    expect(first).toMatchObject({ kind: "icon", iconCode: "REVIVAL", duplicate: false, replayed: false });
    expect(second).toMatchObject({ kind: "icon", iconCode: "REVIVAL", duplicate: true, replayed: false });
    await expect(openWith(firstKey)).resolves.toEqual({ ...first, unopenedLeft: 0, replayed: true });
    await expect(openWith(secondKey)).resolves.toEqual({ ...second, replayed: true });
  });

  it("is true when the icon was already in the collection before this open", async () => {
    await fx.restrictPrizePool(["revival"]);
    await testSql`insert into public.user_icons (user_id, icon_code, quantity) values (${user.id}, 'REVIVAL', 1)`;
    await fx.grantBoxes(user.id, 1);
    const key = randomUUID();

    await expect(openWith(key)).resolves.toMatchObject({ iconCode: "REVIVAL", duplicate: true, replayed: false });
    await expect(openWith(key)).resolves.toMatchObject({ iconCode: "REVIVAL", duplicate: true, replayed: true });
  });

  it("flags exactly one of parallel opens of the same icon as the first copy, and replays agree", async () => {
    await fx.restrictPrizePool(["revival"]);
    await fx.grantBoxes(user.id, 4);
    const keys = Array.from({ length: 4 }, () => randomUUID());
    const results = await Promise.all(keys.map(openWith));

    expect(results.filter((result) => !result.duplicate)).toHaveLength(1);
    const replays = await Promise.all(keys.map(openWith));
    expect(replays.map((replay) => replay.duplicate)).toEqual(results.map((result) => result.duplicate));
  });

  it("is false for a gift, on the first answer and on the replay", async () => {
    await fx.insertTestGift(GIFT_CODE, 1, 5);
    await fx.restrictPrizePool([GIFT_CODE]);
    await fx.grantBoxes(user.id, 1);
    const key = randomUUID();

    await expect(openWith(key)).resolves.toMatchObject({ kind: "gift", iconCode: null, duplicate: false, replayed: false });
    await expect(openWith(key)).resolves.toMatchObject({ kind: "gift", duplicate: false, replayed: true });
  });
});
