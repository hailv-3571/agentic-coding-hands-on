import { describe, expect, it } from "vitest";
import {
  appendNotificationPage,
  markAllNotificationsReadIn,
  markNotificationReadIn,
  mergeFirstNotificationPage,
  type NotificationListState,
} from "@/features/notifications/lib/notification-list-merge";
import type { NotificationView } from "@/features/notifications/schemas/notification-views";

const view = (id: string, overrides: Partial<NotificationView> = {}): NotificationView => ({
  id,
  type: "kudo_received",
  occurredAt: "2026-11-23T10:00:00.000Z",
  read: false,
  href: `/kudos/${id}`,
  params: { actorName: "An" },
  ...overrides,
});
const ids = (state: NotificationListState) => state.items.map((item) => item.id);

describe("appendNotificationPage (older page via cursor)", () => {
  it("appends the page, keeps the first copy of a repeated id, and adopts the new cursor", () => {
    const state = { items: [view("a"), view("b")], nextCursor: "c1" };
    const next = appendNotificationPage(state, { items: [view("b", { read: true }), view("c")], nextCursor: null });
    expect(ids(next)).toEqual(["a", "b", "c"]);
    expect(next.items[1].read).toBe(false);
    expect(next.nextCursor).toBeNull();
  });
});

describe("mergeFirstNotificationPage (refetch after a realtime signal / reconnect)", () => {
  it("puts fresh rows on top, lets the fresh copy win for an id that moved up, keeps older loaded rows and their cursor", () => {
    const state = { items: [view("b"), view("c"), view("h", { params: { count: 1 } })], nextCursor: "after-h" };
    const fresh = { items: [view("h", { params: { count: 2 } }), view("new"), view("b")], nextCursor: "after-b" };
    const next = mergeFirstNotificationPage(state, fresh);
    expect(ids(next)).toEqual(["h", "new", "b", "c"]);
    expect(next.items[0].params.count).toBe(2);
    expect(next.nextCursor).toBe("after-h");
  });

  it("adopts the fresh cursor when the fresh page already holds every loaded row", () => {
    const state = { items: [view("b"), view("c")], nextCursor: "after-c" };
    const fresh = { items: [view("new"), view("b"), view("c"), view("d")], nextCursor: "after-d" };
    expect(mergeFirstNotificationPage(state, fresh)).toEqual(fresh);
  });

  it("replaces the list when the fresh page does not reach the loaded rows (a gap would hide rows)", () => {
    const state = { items: [view("old1"), view("old2")], nextCursor: "after-old2" };
    const fresh = { items: [view("n1"), view("n2")], nextCursor: "after-n2" };
    expect(mergeFirstNotificationPage(state, fresh)).toEqual(fresh);
  });

  it("keeps a short fresh page that ends the list and drops nothing when nothing changed", () => {
    const state = { items: [view("a"), view("b")], nextCursor: null };
    const next = mergeFirstNotificationPage(state, { items: [view("a"), view("b")], nextCursor: null });
    expect(ids(next)).toEqual(["a", "b"]);
    expect(next.nextCursor).toBeNull();
  });

  it("drops a loaded row that is gone from a complete fresh page (nothing beyond it)", () => {
    const state = { items: [view("a"), view("b")], nextCursor: null };
    expect(ids(mergeFirstNotificationPage(state, { items: [view("a")], nextCursor: null }))).toEqual(["a"]);
  });

  it("takes the fresh page as is when nothing was loaded yet", () => {
    const fresh = { items: [view("a")], nextCursor: "after-a" };
    expect(mergeFirstNotificationPage({ items: [], nextCursor: null }, fresh)).toEqual(fresh);
  });
});

describe("optimistic read state", () => {
  it("marks one row read without touching the others or the input", () => {
    const items = [view("a"), view("b")];
    const next = markNotificationReadIn(items, "b");
    expect(next.map((item) => item.read)).toEqual([false, true]);
    expect(items[1].read).toBe(false);
  });

  it("marks every row read", () => {
    expect(markAllNotificationsReadIn([view("a"), view("b", { read: true })]).every((item) => item.read)).toBe(true);
  });
});
