import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import AdminOverviewPage from "@/app/admin/overview/page";
import * as exportRoute from "@/app/api/admin/overview/export/route";
import { UnitStatsQuery } from "@/features/admin-overview/server/unit-stats-query";
import { authInterruptStatusOf, closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { setRoles } from "../admin-users/admin-users-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("next-intl/server", () => ({ getLocale: async () => "vi", getTranslations: vi.fn() }));

/**
 * `/admin/overview` (F015 A1 wiring, FR-401/403/601) and GET /api/admin/overview/export access: guest →
 * /login (page) or 401 (export), user and demoted admin → 403, no read. For an admin the page hands
 * `AdminOverviewScreen` the table for the URL range; a reversed or malformed range shows `filterError`
 * over the all-time table; a failed read sets `loadError` (data null) instead of failing the page.
 */
let admin: Sunner, member: Sunner, demoted: Sunner;

beforeAll(async () => {
  [admin, member, demoted] = await Promise.all([createSunner("opg-admin", "Ov Page Admin"), createSunner("opg-member", "Ov Page Member"), createSunner("opg-demoted", "Ov Page Demoted")]);
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
const render = (params: Record<string, string> = {}) => AdminOverviewPage({ searchParams: Promise.resolve(params) });
const thrownBy = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);
const exportAs = async (query: string) => {
  const response = await exportRoute.GET(new NextRequest(`http://localhost:3000/api/admin/overview/export?${query}`));
  return { status: response.status, body: await response.text() };
};

describe("Admin › Overview entry points refuse non-admins before reading", () => {
  it("page: guest → /login, user and demoted admin → 403, no read", async () => {
    const forRange = vi.spyOn(UnitStatsQuery, "forRange");
    const asGuest = await thrownBy(render());
    await signedInAs(member);
    const asMember = await thrownBy(render());
    await asDemotedAdmin();
    const asDemoted = await thrownBy(render());
    expect(redirectLocationOf(asGuest)).toBe("/login");
    expect([asMember, asDemoted].map(authInterruptStatusOf)).toEqual([403, 403]);
    expect(forRange).not.toHaveBeenCalled();
  });

  it("export: guest → 401, user and demoted admin → 403 JSON, even for a reversed range, no read", async () => {
    const forRange = vi.spyOn(UnitStatsQuery, "forRange");
    const asGuest = await exportAs("from=2025-12-06&to=2025-12-05");
    await signedInAs(member);
    const asMember = await exportAs("from=2025-12-06&to=2025-12-05");
    await asDemotedAdmin();
    const asDemoted = await exportAs("");
    expect([asGuest, asMember]).toEqual([
      { status: 401, body: JSON.stringify({ code: "unauthorized" }) },
      { status: 403, body: JSON.stringify({ code: "forbidden" }) },
    ]);
    expect(asDemoted.status).toBe(403);
    expect(forRange).not.toHaveBeenCalled();
  });
});

describe("Admin › Overview page for an admin", () => {
  it("renders AdminOverviewScreen with the table of the URL range", async () => {
    await signedInAs(admin);
    const forRange = vi.spyOn(UnitStatsQuery, "forRange");
    const screen = await render({ from: "2025-12-01", to: "2025-12-05" });
    expect(screen.props).toMatchObject({ filter: { from: "2025-12-01", to: "2025-12-05" }, filterError: null, loadError: false });
    expect(screen.props.data.rows.length).toBeGreaterThan(0);
    expect(forRange).toHaveBeenCalledWith({ start: new Date("2025-11-30T17:00:00.000Z"), end: new Date("2025-12-05T17:00:00.000Z") }, "vi");
  });

  it.each([
    [{ from: "2025-12-06", to: "2025-12-05" }, "invalid_date_range"],
    [{ from: "05/12/2025" }, "invalid_params"],
  ])("shows %o as %s over the all-time table", async (params, filterError) => {
    await signedInAs(admin);
    const forRange = vi.spyOn(UnitStatsQuery, "forRange");
    const screen = await render(params);
    expect(screen.props).toMatchObject({ filter: { from: null, to: null }, filterError, loadError: false });
    expect(screen.props.data).not.toBeNull();
    expect(forRange).toHaveBeenCalledWith({ start: undefined, end: undefined }, "vi");
  });

  it("sets loadError with no table when the read fails", async () => {
    await signedInAs(admin);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(UnitStatsQuery, "forRange").mockRejectedValueOnce(new Error("db down"));
    expect((await render()).props).toMatchObject({ data: null, filter: { from: null, to: null }, filterError: null, loadError: true });
  });
});
