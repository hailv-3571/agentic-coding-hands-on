import { notificationError, notificationJson, requireNotificationUser } from "@/features/notifications/server/notification-api-session";
import { getUnreadCount } from "@/features/notifications/server/notification-unread-query";

/**
 * GET /api/notifications/unread-count — the bell's re-sync after a realtime signal, a reconnect or a
 * tab becoming visible (A4, FR-401/409): 200 `UnreadCount` `{ unread }` for the session user.
 * 401 `unauthorized` · 500 `unexpected`. `Cache-Control: private, no-store`.
 */
export async function GET() {
  const userId = await requireNotificationUser();
  if (userId instanceof Response) return userId;

  try {
    return notificationJson({ unread: await getUnreadCount(userId) });
  } catch (error) {
    console.error("[notifications] counting unread notifications failed", error);
    return notificationError(500, "unexpected");
  }
}
