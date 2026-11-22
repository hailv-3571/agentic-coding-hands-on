import { describe, expect, it } from "vitest";
import { decidePrelaunchRoute } from "@/features/awards-portal/server/prelaunch-gate";
import { SECRET_BOX_TICK_PATH } from "@/shared/auth/public-paths";
import { decideRouteAccess } from "@/shared/auth/route-access-policy";

/**
 * The internal tick (pg_cron / host cron, no session cookie) must reach its route handler, which
 * guards itself with INTERNAL_JOB_SECRET; every other /api/internal path keeps the session gate.
 */
describe("session proxy access to the Secret Box tick", () => {
  it("lets a guest POST reach the tick route", () => {
    expect(SECRET_BOX_TICK_PATH).toBe("/api/internal/secret-box/tick");
    expect(decideRouteAccess({ pathname: SECRET_BOX_TICK_PATH, search: "", isSignedIn: false })).toEqual({ action: "pass" });
  });

  it("keeps the session gate on look-alike internal paths", () => {
    for (const pathname of ["/api/internal/secret-box/tick/x", "/api/internal/secret-box", "/api/internal/secret-box/tick2"]) {
      expect(decideRouteAccess({ pathname, search: "", isSignedIn: false })).toEqual({ action: "unauthorized" });
    }
  });

  it("is not blocked by the prelaunch gate (the jobs are no-ops before launch)", async () => {
    const decision = await decidePrelaunchRoute({
      pathname: SECRET_BOX_TICK_PATH,
      method: "POST",
      isServerAction: false,
      nowMs: 0,
      launchAtMs: 1,
      isSignedIn: false,
      getRole: async () => null,
    });
    expect(decision).toEqual({ action: "pass" });
  });
});
