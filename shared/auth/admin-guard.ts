import "server-only";
import { forbidden, redirect } from "next/navigation";
import { getSessionUser, type SunnerContext } from "./current-user";
import { LOGIN_PATH } from "./public-paths";
import { findSessionProfile } from "./session-profile-query";

export type AdminAccess =
  | ({ status: "granted" } & SunnerContext)
  | { status: "unauthenticated" }
  | { status: "forbidden" };

/**
 * AdminGuard core (A7, FR-602/603, BR-003): reads `profiles.role` from the DB on every call,
 * so a demotion takes effect on the next request. Non-throwing variant for Route Handlers
 * that answer JSON 401/403 (phases 08/14).
 */
export async function resolveAdminAccess(): Promise<AdminAccess> {
  const user = await getSessionUser();
  if (!user) return { status: "unauthenticated" };
  const profile = await findSessionProfile(user.userId);
  if (profile?.role !== "admin") return { status: "forbidden" };
  return { status: "granted", userId: user.userId, profile };
}

/**
 * `AdminGuard#requireAdmin`: call FIRST in every admin layout, page and Server Action — a
 * layout guard does not protect actions. Guest → /login; non-admin → `forbidden()` (403 page
 * from app/forbidden.tsx).
 */
export async function requireAdmin(): Promise<SunnerContext> {
  const access = await resolveAdminAccess();
  if (access.status === "unauthenticated") redirect(LOGIN_PATH);
  if (access.status === "forbidden") forbidden();
  return { userId: access.userId, profile: access.profile };
}
