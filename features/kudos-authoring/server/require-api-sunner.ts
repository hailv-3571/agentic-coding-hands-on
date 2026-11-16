import "server-only";
import { getSessionUser, type SunnerContext } from "@/shared/auth/current-user";
import { findSessionProfile } from "@/shared/auth/session-profile-query";
import { KUDO_ERROR_STATUS, type KudoErrorCode } from "../schemas/kudo-write-result";

/**
 * Session gate for the F003 route handlers (search, hashtags, image sign, edit load). Unlike
 * `requireSunner()` (pages/actions: redirects), a data endpoint answers JSON: 401 without a
 * verified session or profile, 403 before the first-login department choice. Every handler
 * calls it itself; the proxy's 401 for guests is only the optimistic layer.
 */
export async function requireApiSunner(): Promise<SunnerContext | Response> {
  const user = await getSessionUser();
  const profile = user ? await findSessionProfile(user.userId) : null;
  if (!user || !profile) return kudoErrorResponse("UNAUTHENTICATED");
  if (!profile.departmentId) return kudoErrorResponse("ONBOARDING_REQUIRED");
  return { userId: user.userId, profile };
}

/** `{ code, …extra }` with the status the contract assigns to `code`. Never carries Kudo content. */
export function kudoErrorResponse(code: KudoErrorCode, extra: Record<string, unknown> = {}): Response {
  return Response.json({ code, ...extra }, { status: KUDO_ERROR_STATUS[code] });
}
