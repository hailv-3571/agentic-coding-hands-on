import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { notifications } from "@/shared/db/schema";

/**
 * Unread count of the SESSION user (A4, FR-401/409, DEC-003): the header bell's first paint
 * (NotificationBellSlot), GET /api/notifications/unread-count and the read actions' answers. Served by
 * the partial index (recipient_id) WHERE read_at IS NULL. No caching: every call reads current data.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)));
  return row?.unread ?? 0;
}
