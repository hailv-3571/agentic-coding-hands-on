# Reviewer: phase-02 auth flow (security, narrow)

Score 6/10. Verdict: REWORK (1 critical open redirect, fixable in 2 lines).

## Critical
C1. Open redirect via dot-segment normalization, shared/auth/safe-next-path.ts:16-19.
Verified with node: `/..//evil.com`, `/.//evil.com`, `/a/..//evil.com`, `/%2e%2e//evil.com` pass the prefix/backslash/control checks, then `new URL()` normalizes the pathname to `//evil.com`, which is returned. app/auth/callback/route.ts:17 does `new URL("//evil.com", request.url)` -> http://evil.com/. Same via chooseDepartment redirect() and completeLogin. Tests (tests/unit/auth/safe-next-path) have no dot-segment case.
Fix:
```diff
     const url = new URL(raw, PROBE_ORIGIN);
     if (url.origin !== PROBE_ORIGIN) return fallback;
-    return `${url.pathname}${url.search}${url.hash}`;
+    const safe = `${url.pathname}${url.search}${url.hash}`;
+    return safe.startsWith("/") && !safe.startsWith("//") ? safe : fallback;
```
Add test rows for the four inputs above.

## Warning
W1 (= tester F1). Non-admin /admin/* returns HTTP 200 + 403 body: forbidden() thrown in layout (app/admin/layout.tsx:10 via shared/auth/admin-guard.ts:33) after streaming started. No data leak (guard runs before admin markup), but wrong status, cacheable/prefetchable, wrong for monitoring.
Fix: status-correct gate in the proxy (Node runtime in Next 16, so Drizzle is usable). Keep requireAdmin in layout/pages/actions (defence in depth).
- route-access-policy.ts: add pure helper
```ts
export const isAdminPath = (p: string) => p === "/admin" || p.startsWith("/admin/");
```
- session-proxy.ts, after line 73 (decision pass) and BEFORE the phase-07 marker at line 75:
```ts
let profile: SessionProfile | null | undefined; // lazy, shared with phase-07 gate
const getProfile = async () =>
  (profile ??= session.userId ? await findSessionProfile(session.userId) : null);

if (session.userId && isAdminPath(request.nextUrl.pathname)) {
  if ((await getProfile())?.role !== "admin") {
    return carrySessionCookies(
      NextResponse.rewrite(new URL("/forbidden-view", request.url), { status: 403 }), // or static 403 body
      session.response);
  }
}
```
Rewrite target: a tiny public page that renders app/forbidden.tsx content; add it to PUBLIC_PATHS or exempt rewrites. Verify under `next start` that rewrite `{status}` is honored in this Next version (read node_modules/next/dist/docs per AGENTS.md); fallback is a plain `new NextResponse(html, {status:403})` or JSON 403 for non-GET/action requests. Guests are already redirected earlier, so only signed-in non-admins reach this. Missing profile -> forbidden, same as resolveAdminAccess.
- Phase 07 coexistence: the admin gate sits at step 4b, the prelaunch gate stays at step 5 and reuses `getProfile()` (memoized), so a prelaunch admin bypass costs at most one DB read per request, and /admin requests share that one read. Update header comment (lines 7-16) and the marker comment (75-78) to say "profile via getProfile()". Cost: +1 DB read on /admin requests only (render does its own read; acceptable, admin traffic is tiny). Add integration test: non-admin GET /admin/overview -> 403 status; admin -> 200.
- Same streaming caveat applies to unauthorized() in current-user.ts:39 (session without profile -> 200 with 401 body); low impact, rare.

W2. Matcher exempts by file extension, proxy.ts:13: any path ending .svg/.png/.txt/.xml/etc skips the proxy, including future `/api/.../export.xml` or `/admin/x.txt` route handlers (no 401). Pages are self-guarded so no hole today. Fix: anchor exclusion to public assets only, e.g. `/images/` + `/fonts/` prefixes, or require every Route Handler to self-guard (resolveAdminAccess exists for this). Document the rule.

W3. getUser() is called twice per page request (proxy + getSessionUser, current-user.ts:24): two network round-trips to Supabase Auth per navigation. Choice of getUser() is correct (revocation honored, consistent in both places). Cost note only; if latency matters, cache nothing across proxy/render but consider getClaims in both with accepted revocation lag (decision needed, DEC-level).

## Suggestion
S1. sign-in-with-google-action.ts:14-20 builds redirectTo from Origin / x-forwarded-host headers. Supabase allow-list mitigates; ensure supabase/config.toml `additional_redirect_urls` has no wildcard host. Safer: derive from a server env site URL.
S2. choose-department-action.ts:49-52: profile row missing -> update returns 0 rows -> "already_set" -> redirect, then requireSunner gives 401. Harmless, but select the profile first or report `unexpected`.
S3. callback route.ts:17/36: error branch logs and signs out correctly; `redirectTo` uses request.url origin, which behind a reverse proxy may be the internal host. Prefer forwarded host/site URL.
S4. tests: add dot-segment cases (C1); add a proxy-level 403 test (W1).

## Verified OK
- safeNextPath blocks //, /\, control chars, absolute URLs, over-length; `/%2F%2Fevil` stays a harmless same-origin path.
- Callback: PKCE exchange, errors map to a LoginErrorCode enum (no internal text leaks), session signed out on any post-exchange failure, catch covers DB errors.
- completeLogin: email trimmed/lowercased; ADMIN_EMAILS normalized in env-schema.ts:36-41 (trim, lowercase, z.email); promotion on every login; last_login_at set; exactly-one-@ domain check; missing profile -> auth_failed.
- chooseDepartment: userId from getSessionUser only; zod `z.uuid()`, extra fields stripped; atomic one-time update `WHERE department_id IS NULL`; department existence checked; DB errors do not leak.
- carrySessionCookies: rotated cookies and cache-control carried onto redirect/401; setAll closure reassigns response before return. Fails closed when auth is unreachable.
- Proxy matcher covers server action POSTs (page paths) and /api (401 JSON). requireSunner: guest -> /login, no department -> onboarding; requireAdmin: guest -> /login, user -> forbidden, no profile -> forbidden (resolveAdminAccess); requireSunner no profile -> unauthorized. Admin role read from DB each call (BR-003).
- signOut: local scope, redirect, Next's built-in Origin check on actions.

## Counts
Critical 1, Warning 3, Suggestion 4.

**Status:** DONE_WITH_CONCERNS
