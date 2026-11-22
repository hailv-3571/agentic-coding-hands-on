import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/server/notification-actions";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as fx from "./notification-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) => (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()));

/**
 * markNotificationRead(id) / markAllNotificationsRead() (A6, A7, C-18, BR-007, SC-010/011): the
 * recipient is the session user only; read is one-way and repeat-safe; a foreign or unknown id is the
 * same `not_found` and changes nothing; mark-all touches the caller's unread rows only.
 */
let owner: Sunner;
let stranger: Sunner;
let mine: string[];
let theirs: string;
beforeAll(async () => {
  [owner, stranger] = await Promise.all([createSunner("noti-read-owner", "Noti Read Owner"), createSunner("noti-read-stranger", "Noti Read Stranger")]);
});
beforeEach(async () => {
  await testSql`delete from public.notifications where recipient_id in ${testSql([owner.id, stranger.id])}`;
  mine = [await fx.seedNotification(owner), await fx.seedNotification(owner), await fx.seedNotification(owner)];
  theirs = await fx.seedNotification(stranger);
  requestCookies.clear();
  await signInToJar(requestCookies, owner.email);
});
afterAll(async () => {
  await fx.cleanupNotificationTest([owner, stranger]);
  await closeAppDb();
});

const readMap = async () =>
  Object.fromEntries(
    (await testSql<{ id: string; read_at: string | null }[]>`
      select id, read_at::text from public.notifications where id in ${testSql([...mine, theirs])}`).map((row) => [row.id, row.read_at]),
  );

describe("markNotificationRead", () => {
  it("marks one own row read and answers the fresh unread count; a repeat keeps the first read_at", async () => {
    expect(await markNotificationRead(mine[0])).toEqual({ ok: true, unread: 2 });
    const first = (await readMap())[mine[0]];
    expect(first).not.toBeNull();
    expect(await markNotificationRead(mine[0])).toEqual({ ok: true, unread: 2 });
    expect((await readMap())[mine[0]]).toBe(first);
  });

  it("answers the same not_found for a foreign, unknown or malformed id and changes nothing", async () => {
    for (const id of [theirs, "9b2f7c1e-4d3a-4b5c-8d6e-7f8091a2b3c4", "not-a-uuid"]) {
      expect(await markNotificationRead(id)).toEqual({ ok: false, code: "not_found" });
    }
    expect(Object.values(await readMap())).toEqual([null, null, null, null]);
  });

  it("sends a guest to /login without writing", async () => {
    requestCookies.clear();
    const error = await markNotificationRead(mine[0]).catch((thrown: unknown) => thrown);
    expect(redirectLocationOf(error)).toBe("/login");
    expect((await readMap())[mine[0]]).toBeNull();
  });
});

describe("markAllNotificationsRead", () => {
  it("marks every own unread row, not the stranger's, then reports 0 on a repeat", async () => {
    await markNotificationRead(mine[0]);
    expect(await markAllNotificationsRead()).toEqual({ ok: true, updated: 2, unread: 0 });
    const reads = await readMap();
    expect(mine.every((id) => reads[id] !== null)).toBe(true);
    expect(reads[theirs]).toBeNull();
    expect(await markAllNotificationsRead()).toEqual({ ok: true, updated: 0, unread: 0 });
  });

  it("leaves a notification created afterwards unread (FR-404)", async () => {
    await markAllNotificationsRead();
    await fx.seedNotification(owner);
    const [row] = await testSql<{ unread: number }[]>`
      select count(*)::int as unread from public.notifications where recipient_id = ${owner.id} and read_at is null`;
    expect(row.unread).toBe(1);
  });
});
