import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationEventProcessor } from "@/features/notifications/server/notification-event-processor";
import { NotificationWriter } from "@/features/notifications/server/notification-writer";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import * as fx from "./notification-test-fixtures";

/**
 * NotificationEventProcessor.drain (A1, INT-001, ALG-001, SC-001/002/006): every event type → the
 * right rows/params; re-drains and concurrent drainers never duplicate (row lock + SKIP LOCKED +
 * consumed_at in the same transaction + UNIQUE guard); outbox cleanup keeps the history (event_id →
 * null); a failure rolls the event back, counts an attempt and backs off exponentially (later ticks
 * skip it), the last one parks it with failed_at; malformed / unknown events are consumed and logged.
 */
let sender: Sunner;
let recipient: Sunner;
let fan: Sunner;
let other: Sunner;
beforeAll(async () => {
  [sender, recipient, fan, other] = await Promise.all([
    createSunner("noti-proc-sender", "Noti Sender"),
    createSunner("noti-proc-recipient", "Noti Recipient"),
    createSunner("noti-proc-fan", "Noti Fan"),
    createSunner("noti-proc-other", "Noti Other"),
  ]);
  await fx.drainUntilIdle();
});
beforeEach(async () => {
  await testSql`delete from public.notifications where recipient_id in ${testSql([sender.id, recipient.id, fan.id, other.id])}`;
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await fx.cleanupNotificationTest([sender, recipient, fan, other]);
  await closeAppDb();
});

const typesOf = async (user: Sunner) => (await fx.notificationsOf(user.id)).map((row) => row.type);

describe("one event of each type", () => {
  it("KudoCreated → kudo_received (actor = sender) and the recipient's first tier-up, consumed once", async () => {
    const kudoId = await insertKudo({ sender, recipient });
    const eventId = await fx.addEvent("KudoCreated", { kudoId });
    await fx.drainUntilIdle();
    const rows = await fx.notificationsOf(recipient.id);
    expect(rows.map(({ type, actor_id, dedupe_key, params, count, event_id }) => ({ type, actor_id, dedupe_key, params, count, event_id }))).toEqual([
      { type: "kudo_received", actor_id: sender.id, dedupe_key: null, params: { kudoId }, count: 1, event_id: eventId },
      { type: "hero_tier_up", actor_id: null, dedupe_key: "new", params: { tier: "new", senderCount: 1 }, count: 1, event_id: eventId },
    ]);
    expect(await fx.outboxStateOf(eventId)).toEqual({ consumed: true, attempts: 0, failed: false, last_error: null });
  });

  it("HeartAdded / KudoMarkedSpam / BoxGranted / SetCompleted → one row each for the right person", async () => {
    const kudoId = await insertKudo({ sender, recipient });
    await fx.addEvent("HeartAdded", { kudoId, heartUserId: fan.id });
    await fx.addEvent("KudoMarkedSpam", { kudoId, ownerId: sender.id, moderatedAt: new Date().toISOString() });
    await fx.addEvent("BoxGranted", { userId: fan.id, count: 2 });
    await fx.addEvent("SetCompleted", { userId: fan.id, giftName: "Áo Root Further" });
    await fx.drainUntilIdle();
    expect((await fx.notificationsOf(sender.id)).map(({ type, params, dedupe_key, actor_id }) => ({ type, params, dedupe_key, actor_id }))).toEqual([
      { type: "heart_received", params: { kudoId }, dedupe_key: kudoId, actor_id: null },
      { type: "kudo_hidden_spam", params: { kudoId }, dedupe_key: null, actor_id: null },
    ]);
    expect((await fx.notificationsOf(fan.id)).map(({ type, params }) => ({ type, params }))).toEqual([
      { type: "secret_box_granted", params: { count: 2 } },
      { type: "icon_set_completed", params: { giftName: "Áo Root Further" } },
    ]);
    expect(await typesOf(recipient)).toEqual([]);
  });

  it("NationalKudosFinalized → one row per sender with its kudos by rank, nothing for kudo recipients", async () => {
    const [k1, k2, k3] = [await insertKudo({ sender, recipient }), await insertKudo({ sender, recipient: other }), await insertKudo({ sender: other, recipient })];
    await fx.addEvent("NationalKudosFinalized", {
      items: [
        { kudoId: k2, senderId: sender.id, rank: 3 },
        { kudoId: k3, senderId: other.id, rank: 2 },
        { kudoId: k1, senderId: sender.id, rank: 1 },
      ],
    });
    await fx.drainUntilIdle();
    expect((await fx.notificationsOf(sender.id)).map(({ type, params }) => ({ type, params }))).toEqual([
      { type: "national_kudos", params: { items: [{ kudoId: k1, rank: 1 }, { kudoId: k2, rank: 3 }] } },
    ]);
    expect((await fx.notificationsOf(other.id)).map(({ params }) => params)).toEqual([{ items: [{ kudoId: k3, rank: 2 }] }]);
    expect(await typesOf(recipient)).toEqual([]);
  });

  it("stamps each row with its event's occurred_at (BR-009), not the drain time", async () => {
    const eventId = await fx.insertRawEvent("BoxGranted", { userId: fan.id, count: 1 }, "2026-11-20T03:04:05.123456Z");
    await fx.drainUntilIdle();
    expect((await fx.notificationsOf(fan.id)).find((row) => row.event_id === eventId)?.occurred_at).toBe("2026-11-20T03:04:05.123456Z");
  });
});

describe("status re-check and self actions (BR-002, BR-003, FR-408)", () => {
  it("owes nothing for a kudo hidden before processing, a self-heart or a missing kudo, and consumes them", async () => {
    const spam = await insertKudo({ sender, recipient, status: "spam" });
    const live = await insertKudo({ sender, recipient });
    const ids = [
      await fx.addEvent("KudoCreated", { kudoId: spam }),
      await fx.addEvent("HeartAdded", { kudoId: spam, heartUserId: fan.id }),
      await fx.addEvent("HeartAdded", { kudoId: live, heartUserId: sender.id }),
      await fx.addEvent("KudoCreated", { kudoId: randomUUID() }),
    ];
    await fx.drainUntilIdle();
    expect([await typesOf(recipient), await typesOf(sender)]).toEqual([[], []]);
    for (const id of ids) expect(await fx.outboxStateOf(id)).toMatchObject({ consumed: true, attempts: 0 });
  });
});

describe("idempotency (BR-001, SC-001)", () => {
  it("a re-drain, and a re-delivered event, add no row", async () => {
    const kudoId = await insertKudo({ sender, recipient });
    const ids = [await fx.addEvent("KudoCreated", { kudoId }), await fx.addEvent("BoxGranted", { userId: fan.id, count: 1 })];
    await fx.drainUntilIdle();
    await fx.drainUntilIdle();
    await testSql`update public.domain_event_outbox set consumed_at = null where id in ${testSql(ids)}`;
    await fx.drainUntilIdle();
    expect(await typesOf(recipient)).toEqual(["kudo_received", "hero_tier_up"]);
    expect(await typesOf(fan)).toEqual(["secret_box_granted"]);
  });

  it("an outbox cleanup keeps the notification history (event_id set to null)", async () => {
    const eventId = await fx.addEvent("BoxGranted", { userId: fan.id, count: 3 });
    await fx.drainUntilIdle();
    await testSql`delete from public.domain_event_outbox where id = ${eventId}`;
    expect((await fx.notificationsOf(fan.id)).map(({ type, params, event_id }) => ({ type, params, event_id }))).toEqual([
      { type: "secret_box_granted", params: { count: 3 }, event_id: null },
    ]);
  });

  it("concurrent drainers process every event exactly once (no heart counted twice)", async () => {
    const kudoId = await insertKudo({ sender, recipient });
    const hearts = Array.from({ length: 12 }, () => randomUUID());
    const ids = [await fx.addEvent("KudoCreated", { kudoId })];
    for (const heartUserId of hearts) ids.push(await fx.addEvent("HeartAdded", { kudoId, heartUserId }));
    await Promise.all(Array.from({ length: 5 }, () => NotificationEventProcessor.drain()));
    await fx.drainUntilIdle();
    expect((await fx.notificationsOf(sender.id)).map(({ type, count }) => ({ type, count }))).toEqual([{ type: "heart_received", count: 12 }]);
    expect(await typesOf(recipient)).toEqual(["kudo_received", "hero_tier_up"]);
    for (const id of ids) expect(await fx.outboxStateOf(id)).toMatchObject({ consumed: true, attempts: 0, failed: false });
  });
});

describe("failures (INT-001 failure handling)", () => {
  it("rolls the event back, counts an attempt and backs off (next ticks skip it, the delay doubles), then succeeds", async () => {
    const kudoId = await insertKudo({ sender, recipient });
    const eventId = await fx.addEvent("KudoCreated", { kudoId });
    const realWrite = NotificationWriter.write;
    vi.spyOn(NotificationWriter, "write").mockImplementation(async (...args) => {
      await realWrite(...args);
      throw new Error("transient: connection reset");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await NotificationEventProcessor.drain()).toMatchObject({ retrying: 1, failed: 0 });
    await fx.drainUntilIdle(); // the next 5-second ticks: not due yet, so no attempt is burnt
    expect(await fx.outboxStateOf(eventId)).toEqual({ consumed: false, attempts: 1, failed: false, last_error: expect.stringContaining("transient") });
    expect(await fx.secondsUntilRetry(eventId)).toBeCloseTo(60, -1);
    await fx.makeRetryDue(eventId);
    await fx.drainUntilIdle();
    expect(await fx.outboxStateOf(eventId)).toMatchObject({ consumed: false, attempts: 2, failed: false });
    expect(await fx.secondsUntilRetry(eventId)).toBeCloseTo(120, -1);
    expect(await typesOf(recipient)).toEqual([]);
    vi.restoreAllMocks();
    await fx.makeRetryDue(eventId);
    await fx.drainUntilIdle();
    expect(await typesOf(recipient)).toEqual(["kudo_received", "hero_tier_up"]);
    expect(await fx.outboxStateOf(eventId)).toMatchObject({ consumed: true, attempts: 2 });
  });

  it("parks the event with failed_at on the last allowed attempt and never retries it", async () => {
    const eventId = await fx.addEvent("BoxGranted", { userId: fan.id, count: 1 });
    await testSql`update public.domain_event_outbox set attempts = 4 where id = ${eventId}`;
    vi.spyOn(NotificationWriter, "write").mockRejectedValue(new Error("still broken"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await NotificationEventProcessor.drain()).toMatchObject({ failed: 1 });
    expect(await fx.outboxStateOf(eventId)).toMatchObject({ consumed: false, attempts: 5, failed: true });
    vi.restoreAllMocks();
    await fx.drainUntilIdle();
    expect(await fx.outboxStateOf(eventId)).toMatchObject({ consumed: false, attempts: 5, failed: true });
    expect(await typesOf(fan)).toEqual([]);
  });

  it("consumes malformed and unknown events without a notification, and logs them", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ids = [
      await fx.insertRawEvent("KudoCreated", { kudoId: "not-a-uuid" }),
      await fx.insertRawEvent("BoxGranted", { userId: fan.id, count: 1, extra: "rejected by the strict contract" }),
      await fx.insertRawEvent("SomethingNew", { userId: fan.id }),
    ];
    expect(await NotificationEventProcessor.drain()).toMatchObject({ malformed: 3 });
    for (const id of ids) expect(await fx.outboxStateOf(id)).toEqual({ consumed: true, attempts: 0, failed: false, last_error: expect.stringMatching(/^malformed/) });
    expect(await typesOf(fan)).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(3);
  });
});
