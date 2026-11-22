import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { notifications } from "@/shared/db/schema";

/**
 * Read-state writes (A6, A7, SM-001, BR-007). Callers pass the SESSION user id; every UPDATE filters
 * `recipient_id = userId AND read_at IS NULL`, so read is one-way, a repeat (two tabs) keeps the first
 * read_at, and a row that arrives after mark-all stays unread. No path ever sets read_at back to null.
 */
const own = (userId: string) => eq(notifications.recipientId, userId);

/** True when `id` is one of the user's notifications (now read, or read before); false otherwise. */
async function markRead(userId: string, id: string): Promise<boolean> {
  const updated = await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(and(eq(notifications.id, id), own(userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  if (updated.length > 0) return true;
  const [existing] = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.id, id), own(userId)));
  return existing !== undefined;
}

/** Number of rows this call turned read (0 when nothing was unread). */
async function markAllRead(userId: string): Promise<number> {
  const updated = await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(and(own(userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  return updated.length;
}

export const NotificationReadState = { markRead, markAllRead } as const;
