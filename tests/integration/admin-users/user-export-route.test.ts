import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as exportRoute from "@/app/api/admin/users/export/route";
import type { AdminUserFilterValues } from "@/features/admin-users/schemas/admin-user-views";
import { DEFAULT_ADMIN_USER_FILTER } from "@/features/admin-users/schemas/user-list-params-schema";
import { UserAdminQuery } from "@/features/admin-users/server/user-admin-query";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { setRoles, uniqueToken } from "./admin-users-fixtures";

const exportLimit = vi.hoisted(() => ({ value: 10_000 }));
vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) => {
  const real = await original<{ env: object }>();
  return { env: { ...real.env, get EXPORT_MAX_ROWS() { return exportLimit.value; } } };
});

/**
 * GET /api/admin/users/export (A4, FR-403/603, BR-004, DEC-002, SC-006): every row of the current
 * filter in table order (all pages, `page` ignored) as a no-store CSV attachment `users-…csv` with a
 * BOM; formula cells neutralised; 422 `export_too_large` — no file — above EXPORT_MAX_ROWS; 400 for
 * params the table would refuse. 21 Sunners share token E so the filter spans two table pages.
 */
const E = uniqueToken("Ze");
let admin: Sunner, users: Sunner[];

beforeAll(async () => {
  admin = await createSunner("uexp-admin", "Export Admin");
  users = await Promise.all(Array.from({ length: 21 }, (_, n) => createSunner("uexp", `${E} User ${String(n).padStart(2, "0")}`)));
  users.push(await createSunner("uexp-evil", `=cmd|' /C calc'!A0 ${E}`));
  await setRoles([admin.id], "admin");
  for (const [index, user] of users.slice(0, 6).entries()) {
    for (let n = 0; n <= index % 3; n += 1) await insertKudo({ sender: user, recipient: users[20] });
  }
});
beforeEach(async () => {
  exportLimit.value = 10_000;
  requestCookies.clear();
  await signInToJar(requestCookies, admin.email);
});
afterAll(async () => {
  await cleanupSunners([admin, ...users]);
  await closeAppDb();
});

const call = (query: string) => exportRoute.GET(new NextRequest(`http://localhost:3000/api/admin/users/export?${query}`));
const csvLines = (text: string) => text.replace(/^﻿/, "").split("\r\n").slice(1, -1);

describe("GET /api/admin/users/export", () => {
  it("downloads a no-store CSV attachment named users-{yyyyMMdd-HHmm}.csv with a BOM", async () => {
    const response = await call(`q=${E}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toMatch(/^attachment; filename="users-\d{8}-\d{4}\.csv"$/);
    const bytes = Buffer.from(await response.arrayBuffer());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.subarray(3).toString("utf8").startsWith("ID,User,Email,Sent Kudos,Received Kudos,Total Heart,Level,")).toBe(true);
  });

  it("exports every page of the filter: the same rows in the same order as the table, for each order", async () => {
    const orders: Pick<AdminUserFilterValues, "sort" | "dir">[] = [
      { sort: null, dir: "desc" },
      { sort: "sent", dir: "desc" },
      { sort: "sent", dir: "asc" },
    ];
    for (const { sort, dir } of orders) {
      const filter = { ...DEFAULT_ADMIN_USER_FILTER, sort, dir, query: E };
      const pages = await Promise.all([1, 2].map((page) => UserAdminQuery.listPage({ ...filter, page }, "vi")));
      const query = new URLSearchParams({ q: E, page: "2", ...(sort ? { sort, dir } : {}) }).toString();
      const lines = csvLines(await (await call(query)).text());
      expect(lines).toHaveLength(pages[0].total);
      expect(lines.map((line) => line.slice(0, 36))).toEqual(pages.flatMap((page) => page.rows.map((row) => row.id)));
    }
  });

  it("writes a formula-looking name as text", async () => {
    const lines = csvLines(await (await call(`q=${encodeURIComponent(`calc'!A0 ${E}`)}`)).text());
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain(`,'=cmd|' /C calc'!A0 ${E},`);
  });

  it("answers 422 export_too_large, with no file, above EXPORT_MAX_ROWS, and exports exactly at the limit", async () => {
    exportLimit.value = 21;
    const over = await call(`q=${E}`);
    expect(over.status).toBe(422);
    expect(over.headers.get("content-disposition")).toBeNull();
    expect(over.headers.get("cache-control")).toBe("private, no-store");
    expect(await over.json()).toEqual({ code: "export_too_large" });
    exportLimit.value = 22;
    expect(csvLines(await (await call(`q=${E}`)).text())).toHaveLength(22);
  });

  it.each(["sort=name", "unit=12", "role=owner", `q=${"x".repeat(101)}`, "dir=up&dir=down"])("answers 400 invalid_params for %s", async (query) => {
    const response = await call(query);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ code: "invalid_params" });
  });
});
