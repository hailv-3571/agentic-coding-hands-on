import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as listRoute from "@/app/api/notifications/route";
import { NextRequest } from "next/server";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import * as fx from "./notification-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) => (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()));

/**
 * BR-006 / FR-406 / FR-603 / SC-003 and the phase 10 constraint, end to end (outbox → rows → realtime
 * row → list API): an anonymous sender's id or name is in no notification row, no Broadcast payload and
 * no API answer; a kudo made anonymous AFTER its notification shows the nickname; heart notifications
 * never name the giver; national kudos never carry `senderId` and nothing goes to the kudo's recipient.
 */
let sender: Sunner;
let recipient: Sunner;
let fan: Sunner;
beforeAll(async () => {
  [sender, recipient, fan] = await Promise.all([
    createSunner("noti-anon-sender", "Người Gửi Bí Mật"),
    createSunner("noti-anon-recipient", "Noti Anon Recipient"),
    createSunner("noti-anon-fan", "Noti Anon Fan"),
  ]);
  await fx.drainUntilIdle();
});
beforeEach(() => requestCookies.clear());
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await fx.cleanupNotificationTest([sender, recipient, fan]);
  await closeAppDb();
});

async function listAs(user: Sunner) {
  requestCookies.clear();
  await signInToJar(requestCookies, user.email);
  const response = await listRoute.GET(new NextRequest("http://localhost:3000/api/notifications?limit=50"));
  return response.json();
}

const realtimePayloadsFor = (user: Sunner) =>
  testSql<{ payload: Record<string, unknown> }[]>`
    select payload from realtime.messages where topic = ${`notifications:${user.id}`} order by inserted_at`;

describe("anonymous kudo", () => {
  it("leaves no sender id or name in the row, the realtime payload or the list answer", async () => {
    const kudoId = await insertKudo({ sender, recipient, nickname: "Cú Đêm", body: "Lời cảm ơn rất riêng" });
    await fx.addEvent("KudoCreated", { kudoId });
    await fx.drainUntilIdle();

    const rows = await fx.notificationsOf(recipient.id);
    const kudoRow = rows.find((row) => row.type === "kudo_received");
    expect(kudoRow).toMatchObject({ actor_id: null, params: { kudoId } });
    const signals = await realtimePayloadsFor(recipient);
    expect(signals.length).toBeGreaterThanOrEqual(1);
    for (const { payload } of signals) expect(Object.keys(payload).sort()).toEqual(["id", "notificationId", "occurredAt", "type"]);

    const page = await listAs(recipient);
    const view = page.items.find((item: { type: string }) => item.type === "kudo_received");
    expect(view.params).toEqual({ anonymousNickname: "Cú Đêm" });
    const everything = JSON.stringify({ rows, signals, page });
    for (const secret of [sender.id, sender.fullName, sender.email, "Lời cảm ơn rất riêng"]) expect(everything).not.toContain(secret);
  });

  it("shows the nickname, not the stored actor's name, once the kudo was edited to anonymous", async () => {
    const kudoId = await insertKudo({ sender, recipient });
    await fx.addEvent("KudoCreated", { kudoId });
    await fx.drainUntilIdle();
    await testSql`update public.kudos set is_anonymous = true, anonymous_nickname = 'Bóng Đêm' where id = ${kudoId}`;
    const page = await listAs(recipient);
    const view = page.items.find((item: { href: string; type: string }) => item.type === "kudo_received" && item.href.endsWith(kudoId));
    expect(view.params).toEqual({ anonymousNickname: "Bóng Đêm" });
    expect(JSON.stringify(page)).not.toContain(sender.fullName);
  });
});

describe("hearts and national kudos", () => {
  it("tells the sender of an anonymous kudo about hearts without naming the giver", async () => {
    const kudoId = await insertKudo({ sender, recipient, nickname: "Cú Đêm" });
    await fx.addEvent("HeartAdded", { kudoId, heartUserId: fan.id });
    await fx.drainUntilIdle();
    const rows = (await fx.notificationsOf(sender.id)).filter((row) => row.type === "heart_received");
    expect(rows.map(({ actor_id, params }) => ({ actor_id, params }))).toEqual([{ actor_id: null, params: { kudoId } }]);
    const page = await listAs(sender);
    const view = page.items.find((item: { type: string }) => item.type === "heart_received");
    expect(view.params).toEqual({ recipientName: recipient.fullName, count: 1 });
    expect(JSON.stringify({ rows, page })).not.toMatch(new RegExp(`${fan.id}|${fan.fullName}`));
  });

  it("national kudos of an anonymous kudo: only its sender is told, no senderId anywhere", async () => {
    const kudoId = await insertKudo({ sender, recipient, nickname: "Cú Đêm" });
    await fx.addEvent("NationalKudosFinalized", { items: [{ kudoId, senderId: sender.id, rank: 1 }] });
    await fx.drainUntilIdle();
    const rows = (await fx.notificationsOf(sender.id)).filter((row) => row.type === "national_kudos");
    expect(rows.map(({ params }) => params)).toEqual([{ items: [{ kudoId, rank: 1 }] }]);
    expect((await fx.notificationsOf(recipient.id)).filter((row) => row.type === "national_kudos")).toEqual([]);
    const page = await listAs(sender);
    const view = page.items.find((item: { type: string }) => item.type === "national_kudos");
    expect(view).toMatchObject({ href: `/kudos/${kudoId}`, params: { rank: 1 } });
    expect(JSON.stringify({ rows, page })).not.toMatch(/senderId/);
    expect(JSON.stringify(page)).not.toContain(sender.id);
  });
});
