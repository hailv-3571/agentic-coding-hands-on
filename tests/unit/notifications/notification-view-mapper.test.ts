import { describe, expect, it } from "vitest";
import { toNotificationView, type NotificationListRow } from "@/features/notifications/server/notification-view-mapper";

/**
 * Stored row (+ names joined fresh at read time) → the `NotificationView` contract: per-type
 * interpolation params and the resolved deep link (ALG-003, Figma destinations). An anonymous kudo
 * yields its nickname only; national kudos expose the best rank and link the top-ranked kudo.
 */
const KUDO = "44444444-4444-4444-8444-444444444444";
const KUDO_2 = "55555555-5555-4555-8555-555555555555";
const row = (overrides: Partial<NotificationListRow>): NotificationListRow => ({
  id: "99999999-9999-4999-8999-999999999999",
  type: "kudo_received",
  occurredAt: "2026-11-23T01:02:03.456Z",
  readAt: null,
  count: 1,
  params: { kudoId: KUDO },
  actorName: null,
  anonymousNickname: null,
  kudoRecipientName: null,
  ...overrides,
});

describe("toNotificationView", () => {
  it("kudo_received → sender name and the kudo's detail page, unread", () => {
    expect(toNotificationView(row({ actorName: "Nguyễn Văn A" }))).toEqual({
      id: "99999999-9999-4999-8999-999999999999",
      type: "kudo_received",
      occurredAt: "2026-11-23T01:02:03.456Z",
      read: false,
      href: `/kudos/${KUDO}`,
      params: { actorName: "Nguyễn Văn A" },
    });
  });

  it("anonymous kudo_received → the nickname and nothing else", () => {
    const view = toNotificationView(row({ anonymousNickname: "Mèo Mun", actorName: "Should Not Leak" }));
    expect(view.params).toEqual({ anonymousNickname: "Mèo Mun" });
  });

  it("heart_received → the kudo's recipient name and the aggregated count", () => {
    const view = toNotificationView(row({ type: "heart_received", count: 3, kudoRecipientName: "Trần B", readAt: "2026-11-23T02:00:00.000Z" }));
    expect(view).toMatchObject({ read: true, href: `/kudos/${KUDO}`, params: { recipientName: "Trần B", count: 3 } });
  });

  it.each([
    ["secret_box_granted", { count: 2 }, "/kudos?secretBox=open", {}],
    ["hero_tier_up", { tier: "super", senderCount: 10 }, "/profile", { tier: "super", senderCount: 10 }],
    ["kudo_hidden_spam", { kudoId: KUDO }, `/kudos/${KUDO}`, {}],
    ["icon_set_completed", { giftName: "Áo Root Further" }, "/profile", { giftName: "Áo Root Further" }],
    [
      "national_kudos",
      { items: [{ kudoId: KUDO_2, rank: 2 }, { kudoId: KUDO, rank: 5 }] },
      `/kudos/${KUDO_2}`,
      { rank: 2 },
    ],
  ] as const)("%s → its params and destination", (type, params, href, viewParams) => {
    expect(toNotificationView(row({ type, params }))).toMatchObject({ type, href, params: viewParams });
  });

  it("falls back to the Live board when a stored kudo id is missing", () => {
    expect(toNotificationView(row({ type: "kudo_hidden_spam", params: {} })).href).toBe("/kudos");
    expect(toNotificationView(row({ type: "national_kudos", params: { items: [] } })).href).toBe("/kudos");
  });
});
