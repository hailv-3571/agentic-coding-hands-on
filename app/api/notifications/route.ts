import type { NextRequest } from "next/server";
import { notificationError, notificationJson, requireNotificationUser } from "@/features/notifications/server/notification-api-session";
import { parseNotificationListParams } from "@/features/notifications/server/notification-list-params";
import { NotificationQuery } from "@/features/notifications/server/notification-query";

/**
 * GET /api/notifications?limit=<1..50, default 20>&cursor=<opaque> — the panel (limit 10) and the
 * "Tất cả thông báo" page ("Tải thêm") (A5): 200 `NotificationPage` `{ items: NotificationView[],
 * nextCursor: string | null }`, the session user's rows only, newest first. A limit above 50 is
 * clamped. 401 `unauthorized` · 400 `invalid_request` (bad limit or cursor) · 500 `unexpected`.
 * `Cache-Control: private, no-store`.
 */
export async function GET(request: NextRequest) {
  const userId = await requireNotificationUser();
  if (userId instanceof Response) return userId;

  const params = parseNotificationListParams(request.nextUrl.searchParams);
  if (!params.ok) return notificationError(400, "invalid_request");

  try {
    return notificationJson(await NotificationQuery.list(userId, { limit: params.limit, cursor: params.cursor }));
  } catch (error) {
    console.error("[notifications] listing notifications failed", error);
    return notificationError(500, "unexpected");
  }
}
