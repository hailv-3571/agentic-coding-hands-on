import { describe, expect, it, vi } from "vitest";
import { decidePrelaunchRoute, isPrelaunch, type PrelaunchInput } from "@/features/awards-portal/server/prelaunch-gate";

/**
 * Prelaunch gate decision (C-09 step 5, BR-002, DEC-001), phase 07 Scope Contract table:
 * {before, exactly at, after LAUNCH_AT} × {admin, user, null role, lookup error, guest} × paths,
 * plus the role lookup count (never after launch, on allowlisted paths or for guests).
 */
const LAUNCH_AT = Date.parse("2026-12-01T00:00:00.000Z");
const CLOCK = { before: LAUNCH_AT - 1, at: LAUNCH_AT, after: LAUNCH_AT + 1 } as const;
type Moment = keyof typeof CLOCK;
type Viewer = "admin" | "user" | "null role" | "lookup error" | "guest";

const ALLOWLISTED = ["/countdown", "/login", "/auth/callback", "/access-denied"];
const GATED = ["/", "/kudos", "/awards", "/admin/overview"];
const PATHS = [...GATED, ...ALLOWLISTED];
const VIEWERS: Viewer[] = ["admin", "user", "null role", "lookup error", "guest"];
const MOMENTS: Moment[] = ["before", "at", "after"];

function roleLookup(viewer: Viewer) {
  return vi.fn(async () => {
    if (viewer === "lookup error") throw new Error("db down");
    return viewer === "admin" ? ("admin" as const) : viewer === "user" ? ("user" as const) : null;
  });
}

function run(moment: Moment, viewer: Viewer, pathname: string, request: Partial<PrelaunchInput> = {}) {
  const getRole = roleLookup(viewer);
  const decision = decidePrelaunchRoute({
    pathname,
    method: "GET",
    isServerAction: false,
    nowMs: CLOCK[moment],
    launchAtMs: LAUNCH_AT,
    isSignedIn: viewer !== "guest",
    getRole,
    ...request,
  });
  return { decision, getRole };
}

/** Expected page-load answer and role lookup count for one table cell. */
function expected(moment: Moment, viewer: Viewer, pathname: string) {
  if (moment !== "before") {
    return { decision: pathname === "/countdown" ? { action: "redirect", location: "/" } : { action: "pass" }, lookups: 0 };
  }
  if (ALLOWLISTED.includes(pathname)) return { decision: { action: "pass" }, lookups: 0 };
  if (viewer === "guest") return { decision: { action: "redirect", location: "/countdown" }, lookups: 0 };
  return {
    decision: viewer === "admin" ? { action: "pass" } : { action: "redirect", location: "/countdown" },
    lookups: 1,
  };
}

const TABLE = MOMENTS.flatMap((moment) =>
  VIEWERS.flatMap((viewer) => PATHS.map((pathname) => [moment, viewer, pathname] as const)),
);

describe("isPrelaunch (BR-002)", () => {
  it("is prelaunch strictly before LAUNCH_AT and launched from that exact millisecond on", () => {
    expect(isPrelaunch(CLOCK.before, LAUNCH_AT)).toBe(true);
    expect(isPrelaunch(CLOCK.at, LAUNCH_AT)).toBe(false);
    expect(isPrelaunch(CLOCK.after, LAUNCH_AT)).toBe(false);
  });
});

describe("decidePrelaunchRoute: page loads", () => {
  it.each(TABLE)("%s LAUNCH_AT, %s, GET %s", async (moment, viewer, pathname) => {
    const { decision, getRole } = run(moment, viewer, pathname);
    const want = expected(moment, viewer, pathname);
    expect(await decision).toEqual(want.decision);
    expect(getRole).toHaveBeenCalledTimes(want.lookups);
  });

  it("treats HEAD like GET", async () => {
    const { decision } = run("before", "user", "/kudos", { method: "HEAD" });
    expect(await decision).toEqual({ action: "redirect", location: "/countdown" });
  });

  it("gates look-alikes of allowlisted paths (exact matches only)", async () => {
    for (const pathname of ["/countdown/x", "/login-help", "/Countdown", "/onboarding/department"]) {
      const { decision } = run("before", "user", pathname);
      expect(await decision).toEqual({ action: "redirect", location: "/countdown" });
    }
  });
});

describe("decidePrelaunchRoute: Server Actions, API calls and other methods", () => {
  it("answers 'forbidden' (never a redirect that would replay a POST) to a non-admin on a gated path", async () => {
    const cases: Partial<PrelaunchInput>[] = [
      { method: "POST", isServerAction: true },
      { method: "POST" },
      { method: "DELETE" },
    ];
    for (const request of cases) {
      const { decision } = run("before", "user", "/kudos", request);
      expect(await decision).toEqual({ action: "forbidden" });
    }
  });

  it("answers 'forbidden' to a non-admin GET on an API route instead of redirecting a fetch()", async () => {
    for (const viewer of ["user", "null role", "lookup error"] as const) {
      const { decision } = run("before", viewer, "/api/kudos");
      expect(await decision).toEqual({ action: "forbidden" });
    }
  });

  it("lets an admin's actions and API calls through before launch", async () => {
    expect(await run("before", "admin", "/kudos", { method: "POST", isServerAction: true }).decision).toEqual({ action: "pass" });
    expect(await run("before", "admin", "/api/kudos").decision).toEqual({ action: "pass" });
  });

  it("keeps Server Actions on /countdown working before launch (sign-out), without a role lookup", async () => {
    const { decision, getRole } = run("before", "user", "/countdown", { method: "POST", isServerAction: true });
    expect(await decision).toEqual({ action: "pass" });
    expect(getRole).not.toHaveBeenCalled();
  });

  it("never redirects a Server Action posted to /countdown after launch, nor calls the role lookup", async () => {
    for (const moment of ["at", "after"] as const) {
      const { decision, getRole } = run(moment, "user", "/countdown", { method: "POST", isServerAction: true });
      expect(await decision).toEqual({ action: "pass" });
      expect(getRole).not.toHaveBeenCalled();
    }
  });

  it("lets every request through after launch without a role lookup", async () => {
    for (const request of [{ method: "POST", isServerAction: true }, { method: "GET" }] as const) {
      const { decision, getRole } = run("after", "user", "/api/kudos", request);
      expect(await decision).toEqual({ action: "pass" });
      expect(getRole).not.toHaveBeenCalled();
    }
  });
});
