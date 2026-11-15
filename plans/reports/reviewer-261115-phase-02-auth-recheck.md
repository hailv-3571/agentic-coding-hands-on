# Reviewer re-check: phase 02 auth flow (narrow)
Previous: reviewer-261115-phase-02-auth-flow.md (6/10 REWORK)

Score 8/10. Status: DONE_WITH_CONCERNS (no critical; 1 warning on self-fetch origin).

## Old findings
- C1 open redirect: RESOLVED. safe-next-path.ts:13,21-22 re-checks `/`-not-`//` after URL normalization; control chars + backslash rejected pre-parse (tab/newline-smuggled dot-dot covered). Encoded slashes (%2f) stay literal same-origin. Unit rows cover 4 original vectors + 8 more (test:28-52).
- W1/F1 admin 403: RESOLVED in design (session-proxy.ts:105-107, step 4b, memoized lazy profile, fail-closed: lookup error / no profile => 403). Non-GET or `next-action` => JSON 403 (:91-92). Integration tests cover member, orphan, admin, action POST, view-down fallback, cookie non-forwarding. Real status asserted over `next start` by tests/prod (not run by me).
- W2 matcher: RESOLVED. proxy.ts:15 exempts only _next/static, _next/image, images/, fonts/, favicon/robots/sitemap exact. Pages and action POSTs (page paths) and /api all covered. Side effect: root public/*.svg (create-next-app leftovers) now gated; unused, delete them.
- W3 double getUser: NOT CHANGED (session-proxy.ts:48 + getSessionUser). Cost-only note, decision documented in comment; accept/defer.
- S2 profile missing: RESOLVED (choose-department-action.ts:34-35,64-67 -> "unexpected" + log).

## New findings
Warning
- W-N1 access-denied-response.ts:31: origin = request.nextUrl.origin, derived from the Host header (and x-forwarded-host if the edge passes it). Any signed-in non-admin can send `GET /admin/x` with `Host: internal-svc:port`; the server then fetches `http://internal-svc:port/access-denied` and, on a 2xx, streams the body back with 403 (read-through SSRF limited to the fixed path `/access-denied`); fail vs ok bodies and the 5 s timeout also give a port/host oracle. Headers: NO session leak (only NEXT_LOCALE re-encoded via encodeURIComponent + accept-language; verified :20-27 and integration test). Also `redirect: "manual"` blocks redirect pivots. Fix: build the target from trusted config, e.g. `new URL(ACCESS_DENIED_PATH, process.env.INTERNAL_ORIGIN ?? \`http://127.0.0.1:${process.env.PORT ?? 3000}\`)` (or a validated public site URL env), never from the request. Add a test: spoofed Host must not change the fetched URL. Same Host-trust pattern exists in sign-in-with-google-action.ts:18 (earlier S1, out of scope here).
Suggestion
- S-N1 session-proxy.ts:105 `isAdminPath(pathname)`: exact-case, raw pathname. Unproven whether `//admin/...` or `/admin%2f..` reach the admin route under Next 16; requireAdmin in the layout still blocks (200 + 403 body, no leak). Add one prod-script check for `//admin/overview` and `/admin/` .
- S-N2 No rate limit: each non-admin /admin hit triggers an internal page render (amplification). Cache the HTML per locale in memory (it is session-free) to remove the self-fetch cost and shrink the SSRF surface.
- S-N3 RSC/prefetch GET (header `rsc`) on a non-admin gets HTML 403 instead of a flight payload; router falls back to hard navigation, acceptable, but add a prod check.
- S-N4 Phase 07 must keep /access-denied reachable for guests (comment at session-proxy.ts:112 notes it); add a test when the prelaunch gate lands.

## Fail-closed summary
Auth unreachable => signed out => /login (:51-53). Profile read error => non-admin => 403 (:82-85). View render error/non-2xx => plain 403 (access-denied-response.ts:41-48). No path returns the admin page on error. Good.

## Counts
Critical 0, Warning 1 (new) + W3 open (cost note), Suggestion 4.
