import { getUnreadCount } from "../server/notification-unread-query";
import { NotificationBell } from "./notification-bell";

/**
 * Server half of the header bell (phase 03 `bellSlot`): reads the session user's unread count so
 * the dot is right on first paint. A failed read shows no dot instead of failing the header; the
 * bell re-reads the count as soon as its Realtime channel joins.
 */
export async function NotificationBellSlot({ userId }: { userId: string }) {
  let initialUnread = 0;
  try {
    initialUnread = await getUnreadCount(userId);
  } catch (error) {
    console.error("[notifications] reading the unread count for the header failed", error);
  }
  return <NotificationBell userId={userId} initialUnread={initialUnread} />;
}
