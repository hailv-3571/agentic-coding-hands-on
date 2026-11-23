import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import AdminUsersPage from "@/app/admin/users/page";
import * as exportRoute from "@/app/api/admin/users/export/route";
import { DEFAULT_ADMIN_USER_FILTER } from "@/features/admin-users/schemas/user-list-params-schema";
import { UserAdminQuery } from "@/features/admin-users/server/user-admin-query";
import { UserFilterOptionsQuery } from "@/features/admin-users/server/user-filter-options-query";
import { authInterruptStatusOf, closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { setRoles, uniqueToken } from "./admin-users-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("next-intl/server", () => ({ getLocale: async () => "vi", getTranslations: vi.fn() }));

/**
 * `/admin/users` (F014 A1/A2 wiring, FR-601, SC-007) and GET /api/admin/users/export access: a guest is
 * sent to /login (page) or gets 401 (export), a user and an admin demoted after signing in get 403, and
 * none of them reads a row. For an admin the page hands `AdminUsersScreen` exactly the contract props:
 * the parsed filter, the page, the Unit options and the actor id; invalid params show `filterError`
 * over the unfiltered page 1; a failed read sets `loadError` instead of failing the page.
 */
const U = uniqueToken("Zu");
let admin: Sunner, member: Sunner, demoted: Sunner;

beforeAll(async () => {
  [admin, member, demoted] = await Promise.all([createSunner("upg-admin", `${U} Admin`), createSunner("upg-member", `${U} Member`), createSunner("upg-demoted", `${U} Demoted`)]);
  await setRoles([admin.id], "admin");
});
beforeEach(() => requestCookies.clear());
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await cleanupSunners([admin, member, demoted]);
  await closeAppDb();
});

const signedInAs = async (sunner: Sunner) => {
  requestCookies.clear();
  await signInToJar(requestCookies, sunner.email);
};
const asDemotedAdmin = async () => {
  await setRoles([demoted.id], "admin");
  await signedInAs(demoted);
  await setRoles([demoted.id], "user");
};
const render = (params: Record<string, string> = {}) => AdminUsersPage({ searchParams: Promise.resolve(params) });
const thrownBy = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);
const exportAs = async (query: string) => {
  const response = await exportRoute.GET(new NextRequest(`http://localhost:3000/api/admin/users/export?${query}`));
  return { status: response.status, body: await response.text(), cacheControl: response.headers.get("cache-control") };
};

describe("Admin › User entry points refuse non-admins before reading", () => {
  it("page: guest → /login, user and demoted admin → 403, no row read", async () => {
    const listPage = vi.spyOn(UserAdminQuery, "listPage");
    const asGuest = await thrownBy(render());
    await signedInAs(member);
    const asMember = await thrownBy(render());
    await asDemotedAdmin();
    const asDemoted = await thrownBy(render());
    expect(redirectLocationOf(asGuest)).toBe("/login");
    expect([asMember, asDemoted].map(authInterruptStatusOf)).toEqual([403, 403]);
    expect(listPage).not.toHaveBeenCalled();
  });

  it("export: guest → 401, user and demoted admin → 403 JSON, even for invalid params, no row read", async () => {
    const listForExport = vi.spyOn(UserAdminQuery, "listForExport");
    const asGuest = await exportAs("sort=bogus");
    await signedInAs(member);
    const asMember = await exportAs("sort=bogus");
    await asDemotedAdmin();
    const asDemoted = await exportAs(`q=${U}`);
    expect(asGuest).toEqual({ status: 401, body: JSON.stringify({ code: "unauthorized" }), cacheControl: "private, no-store" });
    expect(asMember).toEqual({ status: 403, body: JSON.stringify({ code: "forbidden" }), cacheControl: "private, no-store" });
    expect(asDemoted.status).toBe(403);
    expect(listForExport).not.toHaveBeenCalled();
  });
});

describe("Admin › User page for an admin", () => {
  it("renders AdminUsersScreen with the parsed filter, the page, the Unit options and the actor id", async () => {
    await signedInAs(admin);
    const screen = await render({ q: U, role: "admin", sort: "sent", dir: "asc" });
    expect(screen.props).toMatchObject({
      filter: { ...DEFAULT_ADMIN_USER_FILTER, query: U, role: "admin", sort: "sent", dir: "asc" },
      actorId: admin.id,
      filterError: null,
      loadError: false,
      data: { total: 1, page: 1, pageCount: 1, rows: [{ id: admin.id, role: "admin" }] },
    });
    expect(screen.props.options.departments.length).toBeGreaterThan(0);
  });

  it.each([
    [{ q: "x".repeat(101) }, "query_too_long"],
    [{ sort: "name" }, "invalid_params"],
  ])("shows %o as %s over the unfiltered page 1", async (params, filterError) => {
    await signedInAs(admin);
    const listPage = vi.spyOn(UserAdminQuery, "listPage");
    const screen = await render({ ...params, page: "3" });
    expect(screen.props).toMatchObject({ filter: DEFAULT_ADMIN_USER_FILTER, filterError, loadError: false, data: { page: 1 } });
    expect(listPage).toHaveBeenCalledWith(DEFAULT_ADMIN_USER_FILTER, "vi");
  });

  it("sets loadError with an empty page when the table read fails, and keeps the table when only the options fail", async () => {
    await signedInAs(admin);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(UserAdminQuery, "listPage").mockRejectedValueOnce(new Error("db down"));
    const failed = await render();
    expect(failed.props).toMatchObject({ loadError: true, data: { rows: [], total: 0, page: 1, pageCount: 1 } });
    vi.spyOn(UserFilterOptionsQuery, "get").mockRejectedValueOnce(new Error("db down"));
    const noOptions = await render({ q: U });
    expect(noOptions.props).toMatchObject({ loadError: false, options: { departments: [] }, data: { total: 3 } });
  });
});
