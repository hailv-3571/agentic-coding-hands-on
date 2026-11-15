import { HOME_PATH, LOGIN_PATH, isPublicPath, loginPathWith } from "./public-paths";

/**
 * Pure route decision for the session proxy (C-09 steps 3-4, DEC-002). No I/O: the proxy
 * resolves the session first and passes `isSignedIn`. The admin role check (step 4b) needs a
 * DB read, so the proxy runs it itself, for `isAdminPath()` only; onboarding stays in
 * `requireSunner()`. Pages, layouts and actions still call the guards (defence in depth).
 */
export type RouteAccessDecision =
  | { action: "pass" }
  | { action: "redirect"; location: string }
  | { action: "unauthorized" };

export type RouteAccessInput = {
  pathname: string;
  /** Raw query string including `?` (or ""), kept so the guest returns to the exact page. */
  search: string;
  isSignedIn: boolean;
};

const API_PREFIX = "/api/";
const ADMIN_PATH = "/admin";

/** The admin area: `/admin` and everything below it, never look-alikes such as `/administrator`. */
export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);
}

export function decideRouteAccess({ pathname, search, isSignedIn }: RouteAccessInput): RouteAccessDecision {
  if (isPublicPath(pathname)) {
    // FR-102: a signed-in user has nothing to do on the login screen.
    if (isSignedIn && pathname === LOGIN_PATH) return { action: "redirect", location: HOME_PATH };
    return { action: "pass" };
  }
  if (isSignedIn) return { action: "pass" };
  // Data endpoints answer 401 instead of redirecting a fetch() to an HTML page.
  if (pathname.startsWith(API_PREFIX)) return { action: "unauthorized" };
  // FR-101: remember where the guest was going.
  return { action: "redirect", location: loginPathWith({ next: `${pathname}${search}` }) };
}
