/**
 * Phase 13 (F013) notification view contracts shared by the server (list query, route handlers,
 * actions) and the client (bell, panel, page). Written by the orchestrator so backend and UI could
 * be built in parallel. Client-safe: types only.
 *
 * Privacy: `actorName` is only ever set for a NON-anonymous kudo sender. An anonymous kudo shows the
 * sender's nickname (`anonymousNickname`) and never a real name/id. Phase 10 constraint: nothing
 * derived from `NationalKudosFinalized.items[].senderId` may appear here.
 */

export type NotificationType =
  | "kudo_received"
  | "heart_received"
  | "secret_box_granted"
  | "hero_tier_up"
  | "kudo_hidden_spam"
  | "icon_set_completed"
  | "national_kudos";

export type NotificationView = {
  id: string;
  type: NotificationType;
  /** ISO instant used for relative time ("15 phút trước"). */
  occurredAt: string;
  read: boolean;
  /** Where clicking the item goes (already resolved, app-relative). */
  href: string;
  /** Interpolation values for the localized message (see `notifications.types.<type>` keys). */
  params: {
    /** kudo_received: non-anonymous sender name. */
    actorName?: string;
    /** kudo_received: anonymous kudo nickname (then actorName is absent). */
    anonymousNickname?: string;
    /** heart_received: the kudo's recipient name. */
    recipientName?: string;
    /** heart_received: aggregated unread heart count for that kudo. */
    count?: number;
    /** hero_tier_up: distinct sender count and new tier. */
    senderCount?: number;
    tier?: "new" | "rising" | "super" | "legend";
    /** icon_set_completed: mystery gift name. */
    giftName?: string;
    /** national_kudos: rank 1..5. */
    rank?: number;
  };
};

/** GET /api/notifications?limit&cursor (session required, no-store). */
export type NotificationPage = { items: NotificationView[]; nextCursor: string | null };

/** GET /api/notifications/unread-count. */
export type UnreadCount = { unread: number };

/** Realtime: private topic `notifications:{userId}`, event `notification`, payload ids only. */
export type NotificationSignal = { notificationId: string; type: NotificationType; occurredAt: string };
