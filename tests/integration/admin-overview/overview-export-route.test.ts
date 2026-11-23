import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as exportRoute from "@/app/api/admin/overview/export/route";
import { parseOverviewParams } from "@/features/admin-overview/schemas/overview-params-schema";
import { UnitStatsQuery } from "@/features/admin-overview/server/unit-stats-query";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import * as fx from "../admin-users/admin-users-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/**
 * GET /api/admin/overview/export (F015 A2, FR-402/602): the table on screen for the same range — "All"
 * first, then the units in table order — as a no-store CSV attachment `overview-{yyyyMMdd-HHmm}.csv`
 * with a BOM and formula-safe unit names; 400 for a reversed or malformed range (no file).
 */
const T = fx.uniqueToken("Ox");
let admin: Sunner, member: Sunner;
let unitId: string;

beforeAll(async () => {
  [admin, member] = await Promise.all([createSunner("oexp-admin", "Overview Export Admin"), createSunner("oexp-member", "Overview Member")]);
  await fx.setRoles([admin.id], "admin");
  unitId = await fx.createTestDepartment(`=HYPERLINK("x") ${T}`);
  await fx.moveToTestDepartment([member], unitId);
  await insertKudo({ sender: member, recipient: admin, createdAt: new Date("2025-12-03T03:00:00+07:00").toISOString() });
});
beforeEach(async () => {
  requestCookies.clear();
  await signInToJar(requestCookies, admin.email);
});
afterAll(async () => {
  await cleanupSunners([admin, member]);
  await fx.deleteTestDepartments([unitId]);
  await closeAppDb();
});

const call = (query: string) => exportRoute.GET(new NextRequest(`http://localhost:3000/api/admin/overview/export?${query}`));
const csvLines = (text: string) => text.replace(/^﻿/, "").split("\r\n").slice(1, -1);

describe("GET /api/admin/overview/export", () => {
  it("downloads a no-store CSV attachment named overview-{yyyyMMdd-HHmm}.csv with a BOM", async () => {
    const response = await call("from=2025-12-01&to=2025-12-05");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toMatch(/^attachment; filename="overview-\d{8}-\d{4}\.csv"$/);
    const bytes = Buffer.from(await response.arrayBuffer());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.subarray(3).toString("utf8").startsWith("No,Unit,Total member,Total sent kudos,")).toBe(true);
  });

  it("matches the table for the same range: All first, then every unit in table order, names formula-safe", async () => {
    for (const query of ["from=2025-12-01&to=2025-12-05", ""]) {
      const parsed = parseOverviewParams(new URLSearchParams(query));
      if (!parsed.ok) throw new Error(parsed.error);
      const table = await UnitStatsQuery.forRange(parsed.range, "vi");
      const lines = csvLines(await (await call(query)).text());
      const { totalMembers, kudosSent, kudosReceived, usersWithReceivedKudo, secretBoxesReceived } = table.all;
      expect(lines[0]).toBe(`,All,${totalMembers},${kudosSent},${kudosReceived},${usersWithReceivedKudo},${secretBoxesReceived}`);
      expect(lines).toHaveLength(table.rows.length + 1);
      const mine = lines.find((line) => line.includes(T));
      expect(mine).toMatch(new RegExp(`^\\d+,"'=HYPERLINK\\(""x""\\) ${T}",1,1,0,0,0$`));
    }
  });

  it.each([
    ["a reversed range", "from=2025-12-06&to=2025-12-05", "invalid_date_range"],
    ["an impossible day", "to=2026-02-30", "invalid_params"],
    ["a repeated param", "from=2025-12-01&from=2025-12-02", "invalid_params"],
  ])("answers 400 for %s, with no file", async (_label, query, code) => {
    const response = await call(query);
    expect(response.status).toBe(400);
    expect(response.headers.get("content-disposition")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ code });
  });
});
