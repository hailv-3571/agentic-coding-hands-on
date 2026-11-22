import { describe, expect, it } from "vitest";
import { decidePrelaunchRoute } from "@/features/awards-portal/server/prelaunch-gate";
import { NOTIFICATIONS_DRAIN_PATH } from "@/shared/auth/public-paths";
import { decideRouteAccess } from "@/shared/auth/route-access-policy";

/**
 * The outbox drain (pg_cron / host cron, no session cookie) must reach its route handler, which
 * guards itself with OUTBOX_DRAIN_SECRET; look-alike /api/internal paths keep the session gate.
 */
describe("session proxy access to the notifications drain", () => {
  it("lets a guest POST reach the drain route (exact path)", () => {
    expect(NOTIFICATIONS_DRAIN_PATH).toBe("/api/internal/notifications/drain");
    expect(decideRouteAccess({ pathname: NOTIFICATIONS_DRAIN_PATH, search: "", isSignedIn: false })).toEqual({ action: "pass" });
  });

  it("keeps the session gate on look-alike paths", () => {
    for (const pathname of ["/api/internal/notifications/drain/x", "/api/internal/notifications", "/api/internal/notifications/drain2", "/api/notifications"]) {
      expect(decideRouteAccess({ pathname, search: "", isSignedIn: false })).toEqual({ action: "unauthorized" });
    }
  });

  it("is not blocked by the prelaunch gate", async () => {
    const decision = await decidePrelaunchRoute({
      pathname: NOTIFICATIONS_DRAIN_PATH,
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
