import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withRollback } from "../../setup/integration-db";
import { createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import type { Tx } from "../spotlight-board/spotlight-message-fixtures";
import * as fx from "./notification-test-fixtures";

/**
 * notifications_publish_signal (A2, INT-002, FR-402/602/603): one private Broadcast per new row and per
 * count raise, to `notifications:{recipient_id}`, event `notification`, payload ids only; a read sends
 * nothing; a failing realtime.send never aborts the notification write (catch-all, RAISE LOG).
 */
let recipient: Sunner;
let eventId: string;
beforeAll(async () => {
  recipient = await createSunner("noti-signal-recipient", "Noti Signal Recipient");
  eventId = await fx.insertRawEvent("SeededForTest", {});
});
afterAll(async () => fx.cleanupNotificationTest([recipient]));

type Message = { event: string; topic: string; private: boolean; extension: string; payload: Record<string, unknown> };
const insertHeartRow = async (tx: Tx) => {
  const [row] = await tx.execute<{ id: string }>(sql`
    insert into public.notifications (recipient_id, type, event_id, dedupe_key, params, occurred_at)
    values (${recipient.id}, 'heart_received', ${eventId}, ${randomUUID()}, '{"kudoId":"x"}'::jsonb, '2026-11-23T01:02:03.456789Z')
    returning id::text as id`);
  return row.id;
};
const messagesOf = (tx: Tx, notificationId: string) =>
  tx.execute<Message>(sql`
    select event, topic, private, extension, payload from realtime.messages
    where payload ->> 'notificationId' = ${notificationId} order by inserted_at, id`);

describe("notification signal trigger", () => {
  it("sends one content-free private signal on insert and one per count raise, none on read", async () => {
    const result = await withRollback(async (tx) => {
      const id = await insertHeartRow(tx);
      const afterInsert = await messagesOf(tx, id);
      await tx.execute(sql`update public.notifications set count = count + 1 where id = ${id}`);
      const afterCount = (await messagesOf(tx, id)).length;
      await tx.execute(sql`update public.notifications set read_at = now() where id = ${id}`);
      return { id, afterInsert, afterCount, afterRead: (await messagesOf(tx, id)).length };
    });
    expect(result.afterInsert).toHaveLength(1);
    const [message] = result.afterInsert;
    expect(message).toMatchObject({ event: "notification", topic: `notifications:${recipient.id}`, private: true, extension: "broadcast" });
    expect(message.payload).toMatchObject({ notificationId: result.id, type: "heart_received", occurredAt: "2026-11-23T01:02:03.456Z" });
    expect(Object.keys(message.payload).sort()).toEqual(["id", "notificationId", "occurredAt", "type"]);
    expect({ afterCount: result.afterCount, afterRead: result.afterRead }).toEqual({ afterCount: 2, afterRead: 2 });
  });

  it("commits the notification when realtime.send raises, and logs the skipped signal", async () => {
    const logs: string[] = [];
    const client = postgres(process.env.DATABASE_URL ?? "", { max: 1, prepare: false, onnotice: (notice) => logs.push(notice.message) });
    const owner = `notification_signal_fault_${randomUUID().slice(0, 8)}`;
    const ROLLBACK = Symbol("rollback");
    let outcome: { rows: number; messages: number; id: string } | undefined;
    try {
      await client.begin(async (tx) => {
        await tx.unsafe(`set local client_min_messages = log`);
        await tx.unsafe(`create role ${owner} nologin bypassrls`);
        await tx.unsafe(`grant ${owner} to current_user`);
        await tx.unsafe(`grant usage, create on schema public to ${owner}`);
        await tx.unsafe(`alter function public.notifications_publish_signal() owner to ${owner}`);
        const [row] = await tx<{ id: string }[]>`
          insert into public.notifications (recipient_id, type, event_id, params)
          values (${recipient.id}, 'secret_box_granted', ${eventId}, '{}'::jsonb) returning id::text as id`;
        const [counts] = await tx<{ rows: number; messages: number }[]>`
          select (select count(*)::int from public.notifications where id = ${row.id}) as rows,
                 (select count(*)::int from realtime.messages where payload ->> 'notificationId' = ${row.id}) as messages`;
        outcome = { ...counts, id: row.id };
        throw ROLLBACK;
      });
    } catch (error) {
      if (error !== ROLLBACK) throw error;
    } finally {
      await client.end({ timeout: 5 });
    }
    expect(outcome).toMatchObject({ rows: 1, messages: 0 });
    const skipped = logs.filter((log) => log.includes("notifications_publish_signal: signal skipped"));
    expect(skipped).toHaveLength(1);
    expect(skipped[0]).toContain(outcome?.id);
    expect(skipped[0]).toContain("permission denied for schema realtime");
  });
});
