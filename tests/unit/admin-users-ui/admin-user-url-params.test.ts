import { describe, expect, it } from "vitest";
import {
  adminUsersExportHref,
  adminUsersHref,
  applyUserFilterPatch,
  nextUserSort,
  userAriaSort,
} from "@/features/admin-users/lib/admin-user-url-params";
import type { AdminUserFilterValues } from "@/features/admin-users/schemas/admin-user-views";

const DEFAULTS: AdminUserFilterValues = { page: 1, unit: null, level: null, role: null, query: "", sort: null, dir: "asc" };

const UNIT = "5f0c1d2e-3a4b-4c5d-8e6f-7a8b9c0d1e2f";
const params = (href: string) => Object.fromEntries(new URL(href, "http://x").searchParams);

describe("adminUsersHref", () => {
  it("is the bare route for the default view (page 1, name order, no filter)", () => {
    expect(adminUsersHref(DEFAULTS)).toBe("/admin/users");
  });

  it("writes every active filter with the shared param names, a trimmed search and the order", () => {
    const href = adminUsersHref({ page: 3, unit: UNIT, level: "rising", role: "admin", query: "  Nguyễn ", sort: "badges", dir: "desc" });
    expect(href.startsWith("/admin/users?")).toBe(true);
    expect(params(href)).toEqual({ q: "Nguyễn", unit: UNIT, level: "rising", role: "admin", sort: "badges", dir: "desc", page: "3" });
  });

  it("writes the unassigned unit and the no-tier level as `none`", () => {
    expect(params(adminUsersHref({ ...DEFAULTS, unit: "none", level: "none" }))).toEqual({ unit: "none", level: "none" });
  });

  it("leaves out a whitespace-only search and the direction while no column is sorted", () => {
    expect(adminUsersHref({ ...DEFAULTS, query: "   ", dir: "desc" })).toBe("/admin/users");
  });

  it("always writes the direction next to a sorted column, ascending too", () => {
    expect(params(adminUsersHref({ ...DEFAULTS, sort: "last_login_at", dir: "asc" }))).toEqual({ sort: "last_login_at", dir: "asc" });
  });
});

describe("adminUsersExportHref", () => {
  it("carries the same filter and order but never the page", () => {
    const href = adminUsersExportHref({ ...DEFAULTS, page: 4, role: "user", query: "an", sort: "hearts", dir: "desc" });
    expect(href).toBe("/api/admin/users/export?q=an&role=user&sort=hearts&dir=desc");
  });

  it("is the bare export route without filters", () => {
    expect(adminUsersExportHref({ ...DEFAULTS, page: 2 })).toBe("/api/admin/users/export");
  });
});

describe("applyUserFilterPatch", () => {
  const onPage5: AdminUserFilterValues = { ...DEFAULTS, page: 5, role: "user" };

  it("goes back to page 1 on any filter, search or sort change", () => {
    expect(applyUserFilterPatch(onPage5, { unit: UNIT })).toEqual({ ...onPage5, unit: UNIT, page: 1 });
    expect(applyUserFilterPatch(onPage5, { level: "none" }).page).toBe(1);
    expect(applyUserFilterPatch(onPage5, { role: null }).page).toBe(1);
    expect(applyUserFilterPatch(onPage5, { query: "x" }).page).toBe(1);
    expect(applyUserFilterPatch(onPage5, { sort: "sent", dir: "desc" }).page).toBe(1);
  });

  it("keeps the requested page when only the page changes", () => {
    expect(applyUserFilterPatch(onPage5, { page: 2 })).toEqual({ ...onPage5, page: 2 });
  });
});

describe("sortable headers", () => {
  it("starts a column at the largest value first, then toggles asc/desc", () => {
    expect(nextUserSort(DEFAULTS, "received")).toEqual({ sort: "received", dir: "desc" });
    expect(nextUserSort({ ...DEFAULTS, sort: "received", dir: "desc" }, "received")).toEqual({ sort: "received", dir: "asc" });
    expect(nextUserSort({ ...DEFAULTS, sort: "received", dir: "asc" }, "received")).toEqual({ sort: "received", dir: "desc" });
  });

  it("switching to another column starts that column descending", () => {
    expect(nextUserSort({ ...DEFAULTS, sort: "sent", dir: "asc" }, "six_badges_at")).toEqual({ sort: "six_badges_at", dir: "desc" });
  });

  it("reports aria-sort only on the sorted column", () => {
    const view = { ...DEFAULTS, sort: "level" as const, dir: "desc" as const };
    expect(userAriaSort(view, "level")).toBe("descending");
    expect(userAriaSort({ ...view, dir: "asc" }, "level")).toBe("ascending");
    expect(userAriaSort(view, "badges")).toBe("none");
    expect(userAriaSort(DEFAULTS, "badges")).toBe("none");
  });
});
