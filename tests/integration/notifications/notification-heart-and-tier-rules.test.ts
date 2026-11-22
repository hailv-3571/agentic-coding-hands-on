import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NotificationEventProcessor } from "@/features/notifications/server/notification-event-processor";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import * as fx from "./notification-test-fixtures";

/**
 * Heart aggregation (BR-004, D001, SC-004) and Hero tier-up (BR-005, ALG-002, C-04, SC-005) on real
 * Postgres: hearts fold into ONE unread row per kudo (count + latest occurred_at), a read row frees
 * the key; tier-up is reported once per tier — late, bursty or out-of-order processing included —
 * and never for a kudo hidden before processing.
 */
let owner: Sunner;
let target: Sunner;
let senders: Sunner[];
beforeAll(async () => {
  [owner, target, ...senders] = await Promise.all(
    ["noti-rule-owner", "noti-rule-target", "noti-rule-s1", "noti-rule-s2", "noti-rule-s3", "noti-rule-s4", "noti-rule-s5", "noti-rule-s6"].map(
      (prefix) => createSunner(prefix, `${prefix} name`),
    ),
  );
  await fx.drainUntilIdle();
}, 60_000);
beforeEach(async () => {
  await testSql`delete from public.kudos where recipient_id = ${target.id} or sender_id = ${owner.id}`;
  await testSql`delete from public.notifications where recipient_id in ${testSql([owner.id, target.id])}`;
});
afterAll(async () => {
  await fx.cleanupNotificationTest([owner, target, ...senders]);
  await closeAppDb();
});

const heartRows = async () =>
  (await fx.notificationsOf(owner.id)).filter((row) => row.type === "heart_received").map(({ count, read, dedupe_key }) => ({ count, read, kudo: dedupe_key }));
const heart = (kudoId: string, at?: string) => fx.insertRawEvent("HeartAdded", { kudoId, heartUserId: randomUUID() }, at);

describe("heart aggregation", () => {
  it("folds hearts on one kudo into one unread row with the count and the latest event time", async () => {
    const kudoId = await insertKudo({ sender: owner, recipient: target });
    await heart(kudoId, "2026-11-23T01:00:00.000001Z");
    await heart(kudoId, "2026-11-23T01:00:02.000002Z");
    await heart(kudoId, "2026-11-23T01:00:01.000003Z"); // drained last, older: never moves the row back
    await fx.drainUntilIdle();
    const rows = await fx.notificationsOf(owner.id);
    expect(rows.map(({ type, count, occurred_at }) => ({ type, count, occurred_at }))).toEqual([
      { type: "heart_received", count: 3, occurred_at: "2026-11-23T01:00:02.000002Z" },
    ]);
  });

  it("opens a new unread row once the aggregated one was read; hearts on another kudo stay apart", async () => {
    const [k1, k2] = [await insertKudo({ sender: owner, recipient: target }), await insertKudo({ sender: owner, recipient: target })];
    await heart(k1);
    await heart(k1);
    await fx.drainUntilIdle();
    await testSql`update public.notifications set read_at = now() where recipient_id = ${owner.id}`;
    await heart(k1);
    await heart(k2);
    await fx.drainUntilIdle();
    expect(await heartRows()).toEqual([
      { count: 2, read: true, kudo: k1 },
      { count: 1, read: false, kudo: k1 },
      { count: 1, read: false, kudo: k2 },
    ]);
  });

  it("two drainers inserting the first unread row at once leave one row counting both", async () => {
    const kudoId = await insertKudo({ sender: owner, recipient: target });
    for (let i = 0; i < 6; i += 1) await heart(kudoId);
    await Promise.all([NotificationEventProcessor.drain(), NotificationEventProcessor.drain(), NotificationEventProcessor.drain()]);
    expect(await heartRows()).toEqual([{ count: 6, read: false, kudo: kudoId }]);
  });
});

describe("hero tier-up", () => {
  const tierRows = async () =>
    (await fx.notificationsOf(target.id)).filter((row) => row.type === "hero_tier_up").map(({ params }) => params);
  const kudoFrom = async (sender: Sunner, status: "public" | "spam" = "public") => {
    const kudoId = await insertKudo({ sender, recipient: target, status });
    return fx.addEvent("KudoCreated", { kudoId });
  };

  it("reports New at the first sender and Rising at the 5th distinct sender, once each", async () => {
    await kudoFrom(senders[0]);
    await fx.drainUntilIdle();
    await kudoFrom(senders[0]); // same sender again: count stays 1
    for (const sender of senders.slice(1, 4)) await kudoFrom(sender);
    await fx.drainUntilIdle();
    expect(await tierRows()).toEqual([{ tier: "new", senderCount: 1 }]);
    await kudoFrom(senders[4]);
    await fx.drainUntilIdle();
    await kudoFrom(senders[5]);
    await fx.drainUntilIdle();
    expect(await tierRows()).toEqual([
      { tier: "new", senderCount: 1 },
      { tier: "rising", senderCount: 5 },
    ]);
  });

  it("reports the tier reached once when the kudos are drained late and out of order", async () => {
    const late = [];
    for (const sender of senders.slice(0, 5)) late.push(await insertKudo({ sender, recipient: target }));
    // Events in reverse kudo order (the 5th kudo's event is the oldest): all drained in one burst.
    for (const [index, kudoId] of [...late].reverse().entries()) {
      await fx.insertRawEvent("KudoCreated", { kudoId }, new Date(Date.now() - 60_000 + index).toISOString());
    }
    await Promise.all([NotificationEventProcessor.drain(), NotificationEventProcessor.drain()]);
    await fx.drainUntilIdle();
    expect(await tierRows()).toEqual([{ tier: "rising", senderCount: 5 }]);
    expect((await fx.notificationsOf(target.id)).filter((row) => row.type === "kudo_received")).toHaveLength(5);
  });

  it("never reports a tier from a kudo hidden before processing", async () => {
    await kudoFrom(senders[0], "spam");
    await fx.drainUntilIdle();
    expect(await tierRows()).toEqual([]);
  });
});
