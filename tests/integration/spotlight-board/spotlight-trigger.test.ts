import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SPOTLIGHT_EVENT, SPOTLIGHT_TOPIC } from "@/features/spotlight-board/spotlight-config";
import { withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { eventTypes, insertKudoIn, PAYLOAD_KEYS, setStatusIn, spotlightMessagesOf } from "./spotlight-message-fixtures";

/**
 * Trigger `spotlight_publish_kudo_event` on the `kudos` write path (A2, BR-001/003/004, FR-602):
 * one broadcast per branch (added / removed / restored), nothing otherwise, and a payload built
 * field by field — never a sender column, even for an anonymous kudo. Every case runs inside a
 * transaction that is rolled back, so no realtime message is ever committed (nor broadcast).
 */
let sender: Sunner;
let recipient: Sunner;
beforeAll(async () => {
  [sender, recipient] = await Promise.all([createSunner("spot-trg-sender", "Spot Sender Thật"), createSunner("spot-trg-recipient", "Nguyễn Bá Chức")]);
});
afterAll(async () => cleanupSunners([sender, recipient]));

describe("spotlight trigger — branches", () => {
  it("sends one private `kudo` broadcast on topic spotlight with type `added` for a new public kudo", async () => {
    const { kudo, messages } = await withRollback(async (tx) => {
      const kudo = await insertKudoIn(tx, { sender, recipient });
      return { kudo, messages: await spotlightMessagesOf(tx, kudo.id) };
    });
    expect(messages).toHaveLength(1);
    const [message] = messages;
    // The SQL literals must stay equal to the constants the browser subscribes with.
    expect({ event: message.event, topic: message.topic, private: message.private, extension: message.extension }).toEqual({
      event: SPOTLIGHT_EVENT,
      topic: SPOTLIGHT_TOPIC,
      private: true,
      extension: "broadcast",
    });
    expect(message.payload).toEqual({
      type: "added",
      kudoId: kudo.id,
      recipientId: recipient.id,
      recipientName: "Nguyễn Bá Chức",
      occurredAt: kudo.createdAt,
      id: message.id,
    });
  });

  it("sends nothing for a kudo inserted as spam", async () => {
    const messages = await withRollback(async (tx) => spotlightMessagesOf(tx, (await insertKudoIn(tx, { sender, recipient, status: "spam" })).id));
    expect(messages).toEqual([]);
  });

  it("sends `removed` on public → spam and `restored` on spam → public, keeping the kudo's own time", async () => {
    const { kudo, messages } = await withRollback(async (tx) => {
      const kudo = await insertKudoIn(tx, { sender, recipient });
      await setStatusIn(tx, kudo.id, "spam");
      await setStatusIn(tx, kudo.id, "public");
      return { kudo, messages: await spotlightMessagesOf(tx, kudo.id) };
    });
    expect(eventTypes(messages)).toEqual(["added", "removed", "restored"]);
    expect(messages.map((message) => message.payload.occurredAt)).toEqual([kudo.createdAt, kudo.createdAt, kudo.createdAt]);
  });

  it("sends `restored` for a kudo born spam that is un-spammed (never `added`)", async () => {
    const messages = await withRollback(async (tx) => {
      const kudo = await insertKudoIn(tx, { sender, recipient, status: "spam" });
      await setStatusIn(tx, kudo.id, "public");
      return spotlightMessagesOf(tx, kudo.id);
    });
    expect(eventTypes(messages)).toEqual(["restored"]);
  });

  it("sends nothing for a body edit, a status rewritten to the same value or a moderation-only update", async () => {
    const messages = await withRollback(async (tx) => {
      const kudo = await insertKudoIn(tx, { sender, recipient });
      await tx.execute(sql`update public.kudos set body = 'Đã sửa', title = 'Mới', updated_at = now() where id = ${kudo.id}`);
      await tx.execute(sql`update public.kudos set status = 'public' where id = ${kudo.id}`);
      await tx.execute(sql`update public.kudos set moderated_by = ${sender.id}, moderated_at = now() where id = ${kudo.id}`);
      await setStatusIn(tx, kudo.id, "spam");
      await tx.execute(sql`update public.kudos set status = 'spam', body = 'Vẫn spam' where id = ${kudo.id}`);
      return spotlightMessagesOf(tx, kudo.id);
    });
    expect(eventTypes(messages)).toEqual(["added", "removed"]);
  });
});

describe("spotlight trigger — payload privacy (BR-003)", () => {
  it("carries exactly the 5 contract keys (+ the message id realtime.send adds) and no sender data for an anonymous kudo", async () => {
    const nickname = "Mèo Ẩn Danh";
    const body = "Lời cảm ơn bí mật 7f3a";
    const messages = await withRollback(async (tx) => {
      const kudo = await insertKudoIn(tx, { sender, recipient, nickname, body });
      await setStatusIn(tx, kudo.id, "spam");
      await setStatusIn(tx, kudo.id, "public");
      return spotlightMessagesOf(tx, kudo.id);
    });
    expect(messages).toHaveLength(3);
    for (const message of messages) {
      expect(Object.keys(message.payload).sort()).toEqual(["id", ...PAYLOAD_KEYS].sort());
      expect(message.payload.id).toBe(message.id);
      const serialized = JSON.stringify(message.payload);
      for (const secret of [sender.id, sender.fullName, sender.email, nickname, body]) expect(serialized).not.toContain(secret);
    }
  });
});
