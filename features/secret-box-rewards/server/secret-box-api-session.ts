import "server-only";
import { getSessionUser } from "@/shared/auth/current-user";
import type { OpenSecretBoxError } from "../schemas/secret-box-views";

/**
 * Session gate + error shape of the Secret Box data endpoints (GET /me, POST /open). The user id
 * comes from the verified Supabase session ONLY (never from the body, query or a header) and the 401
 * is answered before any DB read. Every answer is per-user: `Cache-Control: private, no-store`.
 */
const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export function secretBoxJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: PRIVATE_NO_STORE });
}

/** `{ code }` only: an error never carries box, prize or user data. */
export function secretBoxError(status: number, code: OpenSecretBoxError["code"]): Response {
  return secretBoxJson({ code } satisfies OpenSecretBoxError, status);
}

/** The session user id, or the 401 answer. */
export async function requireSecretBoxUser(): Promise<string | Response> {
  const user = await getSessionUser();
  return user ? user.userId : secretBoxError(401, "unauthorized");
}
