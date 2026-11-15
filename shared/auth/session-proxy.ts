import "server-only";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/shared/config/public-env";
import { accessDeniedPage } from "./access-denied-response";
import { decideRouteAccess, isAdminPath, type RouteAccessDecision } from "./route-access-policy";
import { findSessionProfile, type SessionProfile } from "./session-profile-query";

/**
 * SessionProxy (A5, C-09). Fixed step order for every matched request:
 *   (1) static assets are excluded by the matcher in proxy.ts;
 *   (2) refresh the Supabase session and validate it with Supabase Auth (getUser);
 *   (3) public allowlist (/login, /auth/callback, /countdown, /access-denied) passes,
 *       signed-in /login → /;
 *   (4) no session on a protected path → /login?next=<path> (API paths → 401 JSON);
 *   (4b) admin area: a signed-in non-admin on /admin/* gets HTTP 403 HERE — the admin layout's
 *        forbidden() cannot change a status under Cache Components (FR-602, SC-004): page
 *        loads → the access-denied page, Server Actions / other methods → JSON 403;
 *   (5) prelaunch gate — owned by phase 07, inserted where marked below.
 * Profile (role) via getProfile(): lazy and memoized, so at most ONE DB read per request, and
 * only on /admin/* or (phase 07) while prelaunch — zero DB cost for other requests after launch.
 * Optimistic only: every page/layout/action still calls requireSunner()/requireAdmin().
 */

type RefreshedSession = { response: NextResponse; userId: string | null };
type ProfileLookup = () => Promise<SessionProfile | null>;

/** Steps (2): @supabase/ssr request/response cookie adapter, per the library's proxy pattern. */
async function refreshSession(request: NextRequest): Promise<RefreshedSession> {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        // Rotated tokens must reach both the app (request) and the browser (response).
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  try {
    // getUser() asks Supabase Auth, so a signed-out/revoked session stops working at once;
    // getClaims() would only check the JWT signature and honour it until expiry. Keep this in
    // step with getSessionUser(): mixing the two makes the proxy and pages disagree (loops).
    const { data, error } = await supabase.auth.getUser();
    return { response, userId: !error && data.user ? data.user.id : null };
  } catch (error) {
    // Auth unreachable: fail closed (treated as signed out) rather than letting guests in.
    console.error("[auth] session refresh failed", error);
    return { response, userId: null };
  }
}

/**
 * Copies the refreshed auth cookies and no-store header onto a response returned instead of
 * `session` (redirect/401), so a token rotated in step (2) is never lost.
 */
function carrySessionCookies(response: NextResponse, session: NextResponse): NextResponse {
  for (const cookie of session.cookies.getAll()) response.cookies.set(cookie);
  const cacheControl = session.headers.get("cache-control");
  if (cacheControl) response.headers.set("cache-control", cacheControl);
  return response;
}

function toResponse(decision: Exclude<RouteAccessDecision, { action: "pass" }>, request: NextRequest): NextResponse {
  return decision.action === "redirect"
    ? NextResponse.redirect(new URL(decision.location, request.url))
    : NextResponse.json({ code: "unauthorized" }, { status: 401 });
}

/**
 * Lazy, memoized profile read for this request (shared by steps 4b and 5). A failed read is
 * logged and treated as "no profile", i.e. not an admin: the gates fail closed.
 */
function profileLookup(userId: string | null): ProfileLookup {
  let pending: Promise<SessionProfile | null> | undefined;
  return () =>
    (pending ??= userId
      ? findSessionProfile(userId).catch((error: unknown) => {
          console.error("[auth] proxy profile lookup failed; treating the user as non-admin", error);
          return null;
        })
      : Promise.resolve(null));
}

/** Step (4b) answer: page loads get the 403 access-denied page; actions/API calls get JSON. */
function forbiddenResponse(request: NextRequest): Promise<NextResponse> | NextResponse {
  const isPageLoad = (request.method === "GET" || request.method === "HEAD") && !request.headers.has("next-action");
  return isPageLoad ? accessDeniedPage(request) : NextResponse.json({ code: "forbidden" }, { status: 403 });
}

export async function runSessionProxy(request: NextRequest): Promise<NextResponse> {
  const session = await refreshSession(request);
  const { pathname, search } = request.nextUrl;
  const decision = decideRouteAccess({ pathname, search, isSignedIn: session.userId !== null });
  if (decision.action !== "pass") return carrySessionCookies(toResponse(decision, request), session.response);

  const getProfile = profileLookup(session.userId);

  // (4b) Only signed-in users get here on /admin/* (step 4 sent guests to /login). A missing
  // profile is forbidden, like resolveAdminAccess().
  if (isAdminPath(pathname) && (await getProfile())?.role !== "admin") {
    return carrySessionCookies(await forbiddenResponse(request), session.response);
  }

  // (5) Phase 07 extension point — prelaunch gate. Runs for every passing request, public
  // paths included (/countdown → / after launch), with `session.userId` (null for guests).
  // Admin bypass reads the role via getProfile() (memoized: an /admin request reuses the
  // step-4b read), only while prelaunch. Let /access-denied through for guests: step 4b's
  // page render fetches it without a session. Return a gate redirect through
  // carrySessionCookies(…, session.response).
  return session.response;
}
