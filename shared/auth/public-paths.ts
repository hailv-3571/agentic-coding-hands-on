/**
 * Auth-flow route paths and the session proxy's public allowlist (C-09). Kept in `shared/`
 * because the proxy, `requireSunner()` and the auth feature all build these redirects.
 * Phase 07's prelaunch gate reuses `COUNTDOWN_PATH` and `isPublicPath`.
 */
export const HOME_PATH = "/";
export const LOGIN_PATH = "/login";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const COUNTDOWN_PATH = "/countdown";
/** Session required (not public): first-login department picker. */
export const ONBOARDING_DEPARTMENT_PATH = "/onboarding/department";
/**
 * Public 403 view: the session proxy fetches it WITHOUT session cookies to build the HTTP 403
 * page for a non-admin on /admin/* (access-denied-response.ts). Opened directly it is a
 * harmless static page (200).
 */
export const ACCESS_DENIED_PATH = "/access-denied";

/**
 * Phase 10 internal job endpoint, called by pg_cron / a host cron WITHOUT a session cookie. Its
 * route handler guards itself (INTERNAL_JOB_SECRET header, constant-time compare); the jobs are
 * no-ops before launch, so the prelaunch gate lets it through too.
 */
export const SECRET_BOX_TICK_PATH = "/api/internal/secret-box/tick";

/**
 * Phase 13 outbox drain, called by pg_cron every 5 s WITHOUT a session cookie. Its route handler
 * guards itself (OUTBOX_DRAIN_SECRET header, constant-time compare); draining before launch is harmless.
 */
export const NOTIFICATIONS_DRAIN_PATH = "/api/internal/notifications/drain";

/** Reachable without a session. Exact matches only, so `/login-help` stays protected. */
export const PUBLIC_PATHS: readonly string[] = [
  LOGIN_PATH,
  AUTH_CALLBACK_PATH,
  COUNTDOWN_PATH,
  ACCESS_DENIED_PATH,
  SECRET_BOX_TICK_PATH,
  NOTIFICATIONS_DRAIN_PATH,
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

/** `path?key=value…`, skipping empty values and a `next` that is just the home page. */
function withQuery(path: string, query: Record<string, string | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!value || (key === "next" && value === HOME_PATH)) continue;
    params.set(key, value);
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function loginPathWith(query: { next?: string | null; error?: string | null }): string {
  return withQuery(LOGIN_PATH, query);
}

export function onboardingPathWith(next: string | null | undefined): string {
  return withQuery(ONBOARDING_DEPARTMENT_PATH, { next });
}
