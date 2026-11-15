import { describe, expect, it } from "vitest";
import { decideRouteAccess, isAdminPath } from "@/shared/auth/route-access-policy";

const guest = { isSignedIn: false };
const sunner = { isSignedIn: true };

describe("decideRouteAccess (C-09 steps 3-4, DEC-002)", () => {
  it.each(["/login", "/auth/callback", "/countdown", "/access-denied"])(
    "lets a guest through the public path %s",
    (pathname) => {
      expect(decideRouteAccess({ pathname, search: "", ...guest })).toEqual({ action: "pass" });
    },
  );

  it("sends a guest on a protected page to /login with next = path + query (FR-101)", () => {
    expect(decideRouteAccess({ pathname: "/kudos", search: "?tab=all", ...guest })).toEqual({
      action: "redirect",
      location: "/login?next=%2Fkudos%3Ftab%3Dall",
    });
  });

  it("sends a guest on the home page to /login without a next parameter", () => {
    expect(decideRouteAccess({ pathname: "/", search: "", ...guest })).toEqual({
      action: "redirect",
      location: "/login",
    });
  });

  it("protects onboarding and admin paths for guests", () => {
    for (const pathname of ["/onboarding/department", "/admin/overview"]) {
      expect(decideRouteAccess({ pathname, search: "", ...guest }).action).toBe("redirect");
    }
  });

  it("answers 401 instead of redirecting a guest calling an API route", () => {
    expect(decideRouteAccess({ pathname: "/api/kudos", search: "", ...guest })).toEqual({
      action: "unauthorized",
    });
  });

  it("does not treat look-alike paths as public", () => {
    for (const pathname of ["/login-help", "/loginx", "/auth/callbackx", "/countdowns"]) {
      expect(decideRouteAccess({ pathname, search: "", ...guest }).action).toBe("redirect");
    }
  });

  it("sends a signed-in user away from /login to the home page (FR-102)", () => {
    expect(decideRouteAccess({ pathname: "/login", search: "?next=%2Fkudos", ...sunner })).toEqual({
      action: "redirect",
      location: "/",
    });
  });

  it.each(["/auth/callback", "/countdown", "/kudos", "/", "/api/kudos", "/admin/users"])(
    "lets a signed-in user through %s",
    (pathname) => {
      expect(decideRouteAccess({ pathname, search: "", ...sunner })).toEqual({ action: "pass" });
    },
  );
});

describe("isAdminPath (proxy admin gate, FR-602)", () => {
  it.each(["/admin", "/admin/", "/admin/overview", "/admin/users/123"])("treats %s as the admin area", (pathname) => {
    expect(isAdminPath(pathname)).toBe(true);
  });

  it.each(["/", "/administrator", "/admins", "/admin-help", "/kudos/admin", "/api/admin"])(
    "does not treat %s as the admin area",
    (pathname) => {
      expect(isAdminPath(pathname)).toBe(false);
    },
  );
});
