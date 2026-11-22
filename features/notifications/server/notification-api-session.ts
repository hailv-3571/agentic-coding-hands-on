import "server-only";
import { getSessionUser } from "@/shared/auth/current-user";

/**
 * Session gate + JSON shape of the notification read routes (A0, A4, A5). The user id comes from the
 * verified Supabase session ONLY (never the query or a header) and the 401 is answered before any DB
 * read. Every answer is per-user: `Cache-Control: private, no-store`. Errors are `{ code }` only.
 */
const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export type NotificationApiErrorCode = "unauthorized" | "invalid_request" | "unexpected";

export function notificationJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: PRIVATE_NO_STORE });
}

export function notificationError(status: number, code: NotificationApiErrorCode): Response {
  return notificationJson({ code }, status);
}

/** The session user id, or the 401 answer. */
export async function requireNotificationUser(): Promise<string | Response> {
  const user = await getSessionUser();
  return user ? user.userId : notificationError(401, "unauthorized");
}
