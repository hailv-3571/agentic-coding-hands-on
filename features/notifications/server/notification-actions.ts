"use server";

import { z } from "zod";
import { requireSunner } from "@/shared/auth/current-user";
import type { MarkAllNotificationsReadResult, MarkNotificationReadResult } from "../schemas/notification-read-results";
import { NotificationReadState } from "./notification-read-state";
import { getUnreadCount } from "./notification-unread-query";

/**
 * Read-state Server Actions (A6, A7, C-18: mutations through Server Actions). Untrusted POST entry
 * points: the recipient is ALWAYS the session user (`requireSunner()` sends a guest to /login), the
 * only input is a notification id. No revalidatePath: the bell/panel apply the answer optimistically
 * and re-sync from GET /api/notifications/unread-count on reconnect or tab focus.
 */
export async function markNotificationRead(id: string): Promise<MarkNotificationReadResult> {
  const { userId } = await requireSunner();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, code: "not_found" };
  try {
    if (!(await NotificationReadState.markRead(userId, parsed.data))) return { ok: false, code: "not_found" };
    return { ok: true, unread: await getUnreadCount(userId) };
  } catch (error) {
    console.error("[notifications] marking a notification read failed", error);
    return { ok: false, code: "unexpected" };
  }
}

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResult> {
  const { userId } = await requireSunner();
  try {
    const updated = await NotificationReadState.markAllRead(userId);
    return { ok: true, updated, unread: await getUnreadCount(userId) };
  } catch (error) {
    console.error("[notifications] marking all notifications read failed", error);
    return { ok: false, code: "unexpected" };
  }
}
