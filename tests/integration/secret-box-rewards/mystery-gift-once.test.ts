import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MYSTERY_GIFT_NAME } from "@/features/secret-box-rewards/secret-box-config";
import { IconCollectionQuery } from "@/features/secret-box-rewards/server/icon-collection-query";
import { SecretBoxOpenService } from "@/features/secret-box-rewards/server/secret-box-open-service";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as fx from "./secret-box-fixtures";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));
const failures = vi.hoisted(() => ({ outbox: false }));
vi.mock("@/shared/events/domain-event-outbox", async (original) => {
  const real = await original<typeof import("@/shared/events/domain-event-outbox")>();
  return {
    DomainEventOutbox: {
      add: (...args: Parameters<typeof real.DomainEventOutbox.add>) =>
        failures.outbox ? Promise.reject(new Error("outbox down")) : real.DomainEventOutbox.add(...args),
    },
  };
});

/**
 * Mystery gift once (FR-404, FR-408, BR-005, C-03, plan success criterion 5): the open that completes
 * the 6 distinct icons awards one mystery gift and one `SetCompleted{userId, giftName}`, even with
 * parallel opens racing; later duplicates only increment the quantity; a failed event write rolls the
 * whole open back. The pool is ROOT_FURTHER only, so every draw is that icon.
 */
const FIRST_FIVE = ["REVIVAL", "TOUCH_OF_LIGHT", "STAY_GOLD", "FLOW_TO_HORIZON", "BEYOND_THE_BOUNDARY"];
let collector: Sunner;
let viewer: Sunner;

const quantityOf = async (iconCode: string) =>
  (await testSql<{ quantity: number }[]>`select quantity from public.user_icons where user_id = ${collector.id} and icon_code = ${iconCode}`)[0]?.quantity ?? 0;
const awards = () => testSql<{ gift_name: string }[]>`select gift_name from public.mystery_gift_awards where user_id = ${collector.id}`;

beforeAll(async () => {
  [collector, viewer] = await fx.createSunners(["sbx-set-collector", "sbx-set-viewer"]);
  await fx.restrictPrizePool(["root-further"]);
});
beforeEach(async () => {
  failures.outbox = false;
  await fx.resetRewards([collector.id]);
  for (const iconCode of FIRST_FIVE) {
    await testSql`insert into public.user_icons (user_id, icon_code, quantity) values (${collector.id}, ${iconCode}, 2)`;
  }
});
afterEach(() => {
  failures.outbox = false;
});
afterAll(async () => {
  await fx.restorePrizePool();
  await fx.cleanupSecretBoxUsers([collector, viewer]);
  await closeAppDb();
});

describe("mystery gift for the 6-icon set", () => {
  it("awards one mystery gift and one SetCompleted for parallel opens completing the set", async () => {
    await fx.grantBoxes(collector.id, 4);
    const keys = Array.from({ length: 4 }, () => randomUUID());
    const results = await Promise.all(keys.map((key) => SecretBoxOpenService.openNext(collector.id, key)));

    expect(results.every((result) => result.kind === "icon" && result.iconCode === "ROOT_FURTHER")).toBe(true);
    const completing = results.filter((result) => result.setCompleted);
    expect(completing).toHaveLength(1);
    expect(completing[0].giftName).toBe(MYSTERY_GIFT_NAME);
    expect(results.filter((result) => !result.setCompleted).every((result) => result.giftName === null)).toBe(true);
    expect(await awards()).toEqual([{ gift_name: MYSTERY_GIFT_NAME }]);
    expect(await fx.eventsFor("SetCompleted", collector.id)).toEqual([{ userId: collector.id, giftName: MYSTERY_GIFT_NAME }]);
    expect(await quantityOf("ROOT_FURTHER")).toBe(4);
    expect(await quantityOf("REVIVAL")).toBe(2);

    // The completing key replays its stored result, set completion included.
    const completingKey = keys[results.indexOf(completing[0])];
    await expect(SecretBoxOpenService.openNext(collector.id, completingKey)).resolves.toEqual({ ...completing[0], unopenedLeft: 0, replayed: true });
  });

  it("rolls the whole open back when the SetCompleted event cannot be written", async () => {
    await fx.grantBoxes(collector.id, 1);
    failures.outbox = true;
    await expect(SecretBoxOpenService.openNext(collector.id, randomUUID())).rejects.toThrow("outbox down");
    expect((await fx.boxesOf(collector.id)).map((box) => box.status)).toEqual(["unopened"]);
    expect(await quantityOf("ROOT_FURTHER")).toBe(0);
    expect(await awards()).toEqual([]);
  });

  it("returns 6 slots in display order with owned flags and quantities, for any viewer (IconCollectionQuery)", async () => {
    await fx.grantBoxes(collector.id, 1);
    await SecretBoxOpenService.openNext(collector.id, randomUUID());
    expect(await IconCollectionQuery.forUser(collector.id)).toEqual([
      ...FIRST_FIVE.map((iconCode) => ({ iconCode, owned: true, quantity: 2 })),
      { iconCode: "ROOT_FURTHER", owned: true, quantity: 1 },
    ]);
    expect((await IconCollectionQuery.forUser(viewer.id)).map((slot) => [slot.iconCode, slot.owned, slot.quantity])).toEqual(
      [...FIRST_FIVE, "ROOT_FURTHER"].map((iconCode) => [iconCode, false, 0]),
    );
  });
});
