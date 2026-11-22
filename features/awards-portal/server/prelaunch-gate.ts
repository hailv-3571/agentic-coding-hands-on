import { COUNTDOWN_PATH, HOME_PATH, isPublicPath } from "@/shared/auth/public-paths";
import type { ProfileRole } from "@/shared/db/schema";

/**
 * Prelaunch gate decision, session proxy step (5) (C-09, BR-002, DEC-001). Pure: the proxy
 * passes the server clock, LAUNCH_AT and a lazy role lookup; nothing here reads env, cookies
 * or the DB. Before launch only the public allowlist (/login, /auth/callback, /countdown,
 * /access-denied) is open to non-admins; after launch only /countdown → / remains.
 */
export type PrelaunchDecision =
  | { action: "pass" }
  | { action: "redirect"; location: string }
  /** A Server Action, API call or non-GET request: the proxy answers JSON 403, never a redirect. */
  | { action: "forbidden" };

export type PrelaunchInput = {
  pathname: string;
  method: string;
  /** The request carries the `next-action` header (a Server Action POST). */
  isServerAction: boolean;
  nowMs: number;
  launchAtMs: number;
  isSignedIn: boolean;
  /**
   * DB role (BR-003, never a cookie/claim). Called at most once, and only while prelaunch, on a
   * gated path, for a signed-in user. A rejection or `null` counts as non-admin (fail closed).
   */
  getRole: () => Promise<ProfileRole | null>;
};

const PASS = { action: "pass" } as const;
const API_PREFIX = "/api/";

/** BR-002: derived from the server clock on every request, never stored. LAUNCH_AT itself is launched. */
export function isPrelaunch(nowMs: number, launchAtMs: number): boolean {
  return nowMs < launchAtMs;
}

/**
 * Only a browser navigation may be redirected: a 307 would make fetch() replay a POST at the
 * new path, and Server Actions are resolved by id, not by path, so a replayed action would run
 * on /countdown. Everything else is answered with 403 instead.
 */
function isPageLoad({ pathname, method, isServerAction }: PrelaunchInput): boolean {
  return (method === "GET" || method === "HEAD") && !isServerAction && !pathname.startsWith(API_PREFIX);
}

async function isAdmin(getRole: PrelaunchInput["getRole"]): Promise<boolean> {
  try {
    return (await getRole()) === "admin";
  } catch {
    return false; // fail closed: an unreadable role is not an admin
  }
}

export async function decidePrelaunchRoute(input: PrelaunchInput): Promise<PrelaunchDecision> {
  const pageLoad = isPageLoad(input);

  if (!isPrelaunch(input.nowMs, input.launchAtMs)) {
    // DEC-001: nothing left to count down to, for guests too. A Server Action posted from a
    // countdown tab still open at launch (sign-out) is let through, not redirected.
    return input.pathname === COUNTDOWN_PATH && pageLoad ? { action: "redirect", location: HOME_PATH } : PASS;
  }

  // Guests reach this step only on these paths (step 4 sent them to /login elsewhere), and
  // step 4b's 403 page render fetches /access-denied without a session: never gate them.
  if (isPublicPath(input.pathname)) return PASS;
  if (input.isSignedIn && (await isAdmin(input.getRole))) return PASS;
  return pageLoad ? { action: "redirect", location: COUNTDOWN_PATH } : { action: "forbidden" };
}
