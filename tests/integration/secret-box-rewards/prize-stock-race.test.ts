import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { SECRET_BOX_ICON_CODES } from "@/features/secret-box-rewards/schemas/secret-box-views";
import { LatestGiftWinnersQuery } from "@/features/secret-box-rewards/server/latest-gift-winners-query";
import { SecretBoxOpenService } from "@/features/secret-box-rewards/server/secret-box-open-service";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { setAvatar } from "../kudos-feed/kudo-feed-fixtures";
import * as fx from "./secret-box-fixtures";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * Atomic stock (FR-403, BR-004, ALG-002, plan success criterion 4): a gift with stock 1 drawn by 30
 * users in parallel is issued exactly once, stock never goes negative, the others fall back to icons
 * without an error; then the gift winners list (BR-009, FR-604) shows the winner with the real name.
 * The pool is this test's gift (huge weight, so nearly every draw tries it first) + the 6 icons.
 */
const GIFT_CODE = `test-stock-race-${randomUUID().slice(0, 8)}`;
const ICON_PRIZE_CODES = SECRET_BOX_ICON_CODES.map((code) => code.toLowerCase().replaceAll("_", "-"));
let users: Sunner[];

beforeAll(async () => {
  users = await fx.createSunners(Array.from({ length: 30 }, (_, index) => `sbx-race-${index}`));
  await fx.insertTestGift(GIFT_CODE, 1_000_000, 1);
  await fx.restrictPrizePool([GIFT_CODE, ...ICON_PRIZE_CODES]);
  for (const user of users) await fx.grantBoxes(user.id, 1);
}, 60_000);
afterAll(async () => {
  await fx.restorePrizePool();
  await fx.cleanupSecretBoxUsers(users);
  await fx.deleteTestPrizes([GIFT_CODE]);
  await closeAppDb();
}, 60_000);

describe("prize stock under a 30-user race", () => {
  it("issues the stock-1 gift exactly once, never below zero, and gives everyone else an icon", async () => {
    const results = await Promise.all(users.map((user) => SecretBoxOpenService.openNext(user.id, randomUUID())));

    const gifts = results.filter((result) => result.kind === "gift");
    expect(gifts).toHaveLength(1);
    expect(gifts[0]).toMatchObject({ iconCode: null, name: `Test gift ${GIFT_CODE}`, setCompleted: false, unopenedLeft: 0 });
    expect(results.filter((result) => result.kind === "icon")).toHaveLength(29);
    const [prize] = await testSql<{ stock_remaining: number }[]>`select stock_remaining from public.secret_box_prizes where code = ${GIFT_CODE}`;
    expect(prize.stock_remaining).toBe(0);
    const [opened] = await testSql<{ count: number }[]>`
      select count(*)::int as count from public.secret_boxes b join public.secret_box_prizes p on p.id = b.prize_id where p.code = ${GIFT_CODE}`;
    expect(opened.count).toBe(1);
  });

  it("lists the gift winner first among the latest gift winners, with real name and avatar", async () => {
    const [row] = await testSql<{ user_id: string }[]>`
      select b.user_id from public.secret_boxes b join public.secret_box_prizes p on p.id = b.prize_id where p.code = ${GIFT_CODE}`;
    const winner = users.find((user) => user.id === row.user_id);
    if (!winner) throw new Error("the gift winner is not one of the test users");
    await setAvatar(winner, "https://lh3.googleusercontent.com/winner.png");

    const winners = await LatestGiftWinnersQuery.top10();
    expect(winners.length).toBeLessThanOrEqual(10);
    expect(winners[0]).toEqual({
      userId: winner.id,
      name: winner.fullName,
      avatarUrl: "https://lh3.googleusercontent.com/winner.png",
      giftName: `Test gift ${GIFT_CODE}`,
      openedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    // Icons never enter the list (BR-009): none of the 29 icon winners is listed.
    const iconWinnerIds = new Set(users.filter((user) => user.id !== winner.id).map((user) => user.id));
    expect(winners.some((entry) => iconWinnerIds.has(entry.userId))).toBe(false);
  });
});
