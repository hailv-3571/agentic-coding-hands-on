import "server-only";
import { resolveAdminAccess } from "@/shared/auth/admin-guard";
import type { SunnerContext } from "@/shared/auth/current-user";

/**
 * Admin gate for the F007 data endpoints (GET /api/admin/kudos[/export]). Unlike `requireAdmin()`
 * (pages/actions: redirect / 403 page) a data endpoint answers JSON, with the same codes as the
 * session proxy (step 4/4b): 401 `unauthorized` without a verified session, 403 `forbidden` for a
 * non-admin. The role is read from the DB on every call, so a demotion applies on the next request.
 * Handlers call it FIRST, before parsing any param; the proxy's answer is only the optimistic layer.
 */
export type AdminApiErrorCode = "unauthorized" | "forbidden" | "invalid_params" | "invalid_date_range" | "export_too_large" | "unexpected";

/** `{ code }` only: an admin API error never carries Kudo data. */
export function adminApiError(status: number, code: AdminApiErrorCode): Response {
  return Response.json({ code }, { status });
}

export async function requireAdminApi(): Promise<SunnerContext | Response> {
  const access = await resolveAdminAccess();
  if (access.status === "unauthenticated") return adminApiError(401, "unauthorized");
  if (access.status === "forbidden") return adminApiError(403, "forbidden");
  return { userId: access.userId, profile: access.profile };
}
