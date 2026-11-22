import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SECRET_BOX_ICON_CODES, type OpenSecretBoxResult } from "@/features/secret-box-rewards/schemas/secret-box-views";
import { NoBoxLeftError, SecretBoxOpenService } from "@/features/secret-box-rewards/server/secret-box-open-service";
import { SecretBoxQuery } from "@/features/secret-box-rewards/server/secret-box-query";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { boxesOf, cleanupSecretBoxUsers, createSunners, grantBoxes, resetRewards, restorePrizePool, restrictPrizePool } from "./secret-box-fixtures";
import { resetSecretBoxEnv, secretBoxEnv } from "./secret-box-env-override";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * Open idempotency (FR-402, BR-003, D010, plan success criterion 3): the same Idempotency-Key opens
 * one box and every parallel/retried call gets the stored result; different keys never open more boxes
 * than were granted (409 NO_BOX_LEFT after); a key only ever replays its own user's box. Icons only
 * (gifts deactivated) so these runs never consume the seeded gift stock.
 */
let owner: Sunner;
let other: Sunner;
const ICON_PRIZE_CODES = SECRET_BOX_ICON_CODES.map((code) => code.toLowerCase().replaceAll("_", "-"));
const withoutReplay = (result: OpenSecretBoxResult) => ({ ...result, replayed: undefined });
const settle = <T>(promise: Promise<T>) => promise.then((value) => ({ ok: true as const, value }), (error: unknown) => ({ ok: false as const, error }));

beforeAll(async () => {
  [owner, other] = await createSunners(["sbx-open-owner", "sbx-open-other"]);
  await restrictPrizePool(ICON_PRIZE_CODES);
});
beforeEach(async () => {
  resetSecretBoxEnv();
  await resetRewards([owner.id, other.id]);
});
afterEach(() => resetSecretBoxEnv());
afterAll(async () => {
  await restorePrizePool();
  await cleanupSecretBoxUsers([owner, other]);
  await closeAppDb();
});

describe("SecretBoxOpenService.openNext", () => {
  it("opens one box for 10 parallel calls with the same key, and all answer the same stored result", async () => {
    await grantBoxes(owner.id, 3);
    const key = randomUUID();
    const results = await Promise.all(Array.from({ length: 10 }, () => SecretBoxOpenService.openNext(owner.id, key)));

    expect(results.filter((result) => !result.replayed)).toHaveLength(1);
    expect(new Set(results.map((result) => JSON.stringify(withoutReplay(result)))).size).toBe(1);
    expect(results[0]).toMatchObject({ kind: "icon", setCompleted: false, giftName: null, unopenedLeft: 2 });
    expect(SECRET_BOX_ICON_CODES).toContain(results[0].iconCode);
    expect(await boxesOf(owner.id)).toEqual([
      { seq: 1, status: "opened" },
      { seq: 2, status: "unopened" },
      { seq: 3, status: "unopened" },
    ]);
  });

  it("opens exactly the 2 granted boxes for parallel calls with different keys; the rest get NO_BOX_LEFT", async () => {
    await grantBoxes(owner.id, 2);
    const outcomes = await Promise.all(Array.from({ length: 6 }, () => settle(SecretBoxOpenService.openNext(owner.id, randomUUID()))));

    const opened = outcomes.filter((outcome) => outcome.ok);
    expect(opened).toHaveLength(2);
    expect(outcomes.filter((outcome) => !outcome.ok).every((outcome) => outcome.error instanceof NoBoxLeftError)).toBe(true);
    expect(opened.map((outcome) => outcome.value.unopenedLeft).sort()).toEqual([0, 1]);
    expect((await boxesOf(owner.id)).map((box) => box.status)).toEqual(["opened", "opened"]);
  });

  it("replays a processed key even when no box is left, and answers NO_BOX_LEFT to a new key", async () => {
    await grantBoxes(owner.id, 1);
    const key = randomUUID();
    const first = await SecretBoxOpenService.openNext(owner.id, key);
    const retry = await SecretBoxOpenService.openNext(owner.id, key);
    expect(retry).toEqual({ ...first, replayed: true });
    await expect(SecretBoxOpenService.openNext(owner.id, randomUUID())).rejects.toBeInstanceOf(NoBoxLeftError);
  });

  it("never replays another user's result: the same key opens the caller's own box", async () => {
    await grantBoxes(owner.id, 1);
    await grantBoxes(other.id, 1);
    const key = randomUUID();
    await SecretBoxOpenService.openNext(owner.id, key);
    const otherResult = await SecretBoxOpenService.openNext(other.id, key);
    expect(otherResult.replayed).toBe(false);
    expect((await boxesOf(other.id)).map((box) => box.status)).toEqual(["opened"]);
  });

  it("keeps opening granted boxes after EVENT_END_AT (decision log: existing boxes stay openable)", async () => {
    secretBoxEnv.eventEndAt = Date.now() - 60_000;
    await grantBoxes(owner.id, 1);
    await expect(SecretBoxOpenService.openNext(owner.id, randomUUID())).resolves.toMatchObject({ kind: "icon", unopenedLeft: 0 });
  });

  it("reports the unopened count for the modal (SecretBoxQuery.openScreenState)", async () => {
    expect(await SecretBoxQuery.openScreenState(owner.id)).toEqual({ unopened: 0 });
    await grantBoxes(owner.id, 2);
    await SecretBoxOpenService.openNext(owner.id, randomUUID());
    expect(await SecretBoxQuery.openScreenState(owner.id)).toEqual({ unopened: 1 });
  });
});
