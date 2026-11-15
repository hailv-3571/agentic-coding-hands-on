import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/shared/config/env";
import { localeCookieName } from "@/shared/i18n/locales";
import { ACCESS_DENIED_PATH } from "./public-paths";

/**
 * HTTP 403 page for a signed-in non-admin's page load on /admin/* (session proxy step 4b).
 *
 * Why the proxy builds the body itself: under Cache Components the prerendered shell commits
 * status 200 before a `forbidden()` in the admin layout (or any page) can run, and Next's
 * server resets the status of a proxy rewrite to 200 (next/dist/server/base-server.js). A
 * response body returned by the proxy keeps its status. So the proxy fetches the public
 * /access-denied view (the same ErrorPanel as app/forbidden.tsx) and returns it with 403.
 * Only the locale inputs travel with that fetch, never the session cookies. If the view
 * cannot be rendered, the answer is still a 403 (plain text) and the failure is logged.
 */
const VIEW_TIMEOUT_MS = 5_000;
const NO_STORE = "private, no-store";

/**
 * The fetch target comes from server config only, never from the request: request.nextUrl is
 * built from the Host / X-Forwarded-Host headers, which a caller controls (W-N1, SSRF).
 * PORT is read per call because `next start`/`next dev` set it once the server listens.
 */
function accessDeniedViewUrl(): URL {
  const origin = env.INTERNAL_APP_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;
  return new URL(ACCESS_DENIED_PATH, origin);
}

function viewRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers({ accept: "text/html" });
  const locale = request.cookies.get(localeCookieName)?.value;
  if (locale) headers.set("cookie", `${localeCookieName}=${encodeURIComponent(locale)}`);
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) headers.set("accept-language", acceptLanguage);
  return headers;
}

export async function accessDeniedPage(request: NextRequest): Promise<NextResponse> {
  try {
    const view = await fetch(accessDeniedViewUrl(), {
      headers: viewRequestHeaders(request),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(VIEW_TIMEOUT_MS),
    });
    if (view.ok && view.body) {
      const contentType = view.headers.get("content-type") ?? "text/html; charset=utf-8";
      return new NextResponse(view.body, { status: 403, headers: { "content-type": contentType, "cache-control": NO_STORE } });
    }
    console.error("[auth] access-denied view answered", view.status);
  } catch (error) {
    console.error("[auth] rendering the access-denied view failed", error);
  }
  return new NextResponse("403 Forbidden", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": NO_STORE },
  });
}
