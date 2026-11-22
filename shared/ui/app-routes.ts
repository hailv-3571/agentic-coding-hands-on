/**
 * Single typed route map. Header, footer, admin bar and later phases import from here;
 * do not hard-code paths elsewhere.
 */
export const APP_ROUTES = {
  home: "/",
  awards: "/awards",
  rules: "/rules",
  communityStandards: "/community-standards",
  kudos: "/kudos",
  profile: "/profile",
  notifications: "/notifications",
  login: "/login",
  countdown: "/countdown",
} as const;

export const ADMIN_ROUTES = {
  root: "/admin",
  overview: "/admin/overview",
  review: "/admin/review",
  users: "/admin/users",
  settings: "/admin/settings",
} as const;

/**
 * Active-link rule for navigation: the root path matches only itself, every other
 * path matches itself and anything below it (`/kudos` is active on `/kudos/123`).
 */
export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
