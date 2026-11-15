import { describe, expect, it } from "vitest";
import { ADMIN_ROUTES, APP_ROUTES, isRouteActive } from "@/shared/ui/app-routes";

describe("isRouteActive", () => {
  it("matches the root only on `/`", () => {
    expect(isRouteActive("/", "/")).toBe(true);
    expect(isRouteActive("/kudos", "/")).toBe(false);
  });

  it("matches the exact path and nested paths by segment", () => {
    expect(isRouteActive("/kudos", "/kudos")).toBe(true);
    expect(isRouteActive("/kudos/123", "/kudos")).toBe(true);
    expect(isRouteActive("/admin/overview/export", ADMIN_ROUTES.overview)).toBe(true);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(isRouteActive("/kudos-board", "/kudos")).toBe(false);
    expect(isRouteActive("/admin/users", ADMIN_ROUTES.review)).toBe(false);
  });
});

describe("route map", () => {
  it("keeps every path absolute and unique", () => {
    const paths = [...Object.values(APP_ROUTES), ...Object.values(ADMIN_ROUTES)];
    expect(paths.every((p) => p.startsWith("/"))).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
