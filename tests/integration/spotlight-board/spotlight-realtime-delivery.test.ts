import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { PAYLOAD_KEYS } from "./spotlight-message-fixtures";
import { closeAll, eventually, listen, type Listener } from "./spotlight-realtime-clients";

/**
 * End to end on the local Realtime server (plan step 2 spike, kept as a test): a signed-in Sunner
 * joins the PRIVATE topic `spotlight` and receives the trigger's events for committed writes only;
 * the anon key cannot join; a public channel of the same name receives nothing. Kudos here are
 * committed (a rolled-back write never reaches Realtime) and removed in afterAll.
 */
const DELIVERY_MS = 8_000;
const QUIET_MS = 1_500;

let sender: Sunner;
let recipient: Sunner;
let viewer: Sunner;
let member: Listener;
let anonPrivate: Listener;
let anonPublic: Listener;
beforeAll(async () => {
  [sender, recipient, viewer] = await Promise.all([
    createSunner("spot-live-sender", "Spot Live Sender"),
    createSunner("spot-live-recipient", "Trần Văn An"),
    createSunner("spot-live-viewer", "Spot Live Viewer"),
  ]);
  [member, anonPrivate, anonPublic] = await Promise.all([
    listen(viewer.email, "spotlight", true),
    listen(null, "spotlight", true),
    listen(null, "spotlight", false),
  ]);
}, 40_000);
afterAll(async () => {
  await closeAll([member, anonPrivate, anonPublic]);
  await cleanupSunners([sender, recipient, viewer]);
});

const eventsFor = (listener: Listener, kudoId: string) => listener.received.filter((payload) => payload.kudoId === kudoId);
const quiet = () => new Promise((resolve) => setTimeout(resolve, QUIET_MS));

describe("spotlight private channel", () => {
  it("lets a signed-in Sunner join and refuses the anon key", () => {
    expect(member.outcome).toEqual({ status: "SUBSCRIBED", error: null });
    expect(anonPrivate.outcome.status).toBe("CHANNEL_ERROR");
    expect(anonPrivate.outcome.error).toMatch(/Unauthorized/);
  });

  it("delivers one `added` event per committed public kudo, without sender data; a rolled-back write sends nothing", async () => {
    const rolledBack = await withRollback(async (tx) => {
      const [row] = await tx.execute<{ id: string }>(sql`
        insert into public.kudos (sender_id, recipient_id, body) values (${sender.id}, ${recipient.id}, 'rolled back') returning id`);
      return row.id;
    });
    const [kudo] = await testSql<{ id: string }[]>`
      insert into public.kudos (sender_id, recipient_id, body, is_anonymous, anonymous_nickname)
      values (${sender.id}, ${recipient.id}, 'Cảm ơn ẩn danh', true, 'Cú Đêm') returning id`;

    expect(await eventually(() => eventsFor(member, kudo.id).length > 0, DELIVERY_MS)).toBe(true);
    await quiet();
    const events = eventsFor(member, kudo.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "added", kudoId: kudo.id, recipientId: recipient.id, recipientName: "Trần Văn An" });
    // The browser gets the 5 contract keys + `id` (realtime.send's message id; SpotlightEventSchema drops it).
    expect(Object.keys(events[0]).sort()).toEqual(["id", ...PAYLOAD_KEYS].sort());
    const serialized = JSON.stringify(events[0]);
    for (const secret of [sender.id, sender.fullName, "Cú Đêm", "Cảm ơn ẩn danh"]) expect(serialized).not.toContain(secret);
    expect(eventsFor(member, rolledBack)).toEqual([]);
    expect(anonPrivate.received).toEqual([]);
    expect(anonPublic.received).toEqual([]);
  }, 30_000);

  it("delivers `removed` on Mark Spam and `restored` on Un Spam", async () => {
    const [kudo] = await testSql<{ id: string }[]>`
      insert into public.kudos (sender_id, recipient_id, body) values (${sender.id}, ${recipient.id}, 'spam then back') returning id`;
    await testSql`update public.kudos set status = 'spam', moderated_by = ${viewer.id}, moderated_at = now() where id = ${kudo.id}`;
    await testSql`update public.kudos set status = 'public', moderated_by = ${viewer.id}, moderated_at = now() where id = ${kudo.id}`;
    expect(await eventually(() => eventsFor(member, kudo.id).length >= 3, DELIVERY_MS)).toBe(true);
    await quiet();
    expect(eventsFor(member, kudo.id).map((event) => event.type)).toEqual(["added", "removed", "restored"]);
    expect(anonPublic.received).toEqual([]);
  }, 30_000);
});
