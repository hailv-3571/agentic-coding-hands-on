import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as exportRoute from "@/app/api/admin/kudos/export/route";
import * as listRoute from "@/app/api/admin/kudos/route";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { addHearts, makeAdmin } from "./admin-moderation-fixtures";

const exportLimit = vi.hoisted(() => ({ value: 10_000 }));
vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) => {
  const real = await original<{ env: object }>();
  return { env: { ...real.env, get EXPORT_MAX_ROWS() { return exportLimit.value; } } };
});
// Pass-through with a hook that runs just before the export's row read (a concurrent insert).
const beforeRowRead = vi.hoisted(() => ({ run: async () => {} }));
vi.mock("@/features/admin-moderation/server/admin-kudo-row-select", async (original) => {
  const real = await original<typeof import("@/features/admin-moderation/server/admin-kudo-row-select")>();
  return {
    ...real,
    selectAdminKudoRows: async (...args: Parameters<typeof real.selectAdminKudoRows>) => {
      await beforeRowRead.run();
      return real.selectAdminKudoRows(...args);
    },
  };
});

/**
 * GET /api/admin/kudos/export (A4, FR-405, FR-604, DEC-002, SC-006): the whole current filter in table
 * order as a CSV attachment (BOM, formula cells neutralised), the same rows the table counts, and 422
 * `export_too_large` — no file — above EXPORT_MAX_ROWS, decided by the bounded read itself, so a row
 * inserted meanwhile cannot push the file past the limit (review S1).
 */
let admin: Sunner, anonSender: Sunner, sender: Sunner, recipient: Sunner, fans: Sunner[];

beforeAll(async () => {
  [admin, anonSender, sender, recipient, ...fans] = await Promise.all(
    ["exp-admin", "exp-anon", "exp-sender", "exp-recipient", "exp-fan1", "exp-fan2"].map((prefix) => createSunner(prefix, `${prefix} name`)),
  );
  await makeAdmin(admin);
  await insertKudo({ sender: anonSender, recipient, nickname: "Ẩn Sĩ", body: '=HYPERLINK("http://evil.example","bấm")', createdAt: "2103-01-01T00:00:01Z" });
  for (let second = 2; second < 14; second += 1) {
    const id = await insertKudo({ sender, recipient, body: `Lời nhắn ${second}`, createdAt: `2103-01-01T00:00:${String(second).padStart(2, "0")}Z` });
    await addHearts(id, fans.slice(0, second % 3));
  }
});
beforeEach(async () => {
  exportLimit.value = 10_000;
  beforeRowRead.run = async () => {};
  requestCookies.clear();
  await signInToJar(requestCookies, admin.email);
});
afterAll(async () => {
  await cleanupSunners([admin, anonSender, sender, recipient, ...fans]);
  await closeAppDb();
});

const call = (handler: (request: NextRequest) => Promise<Response>, query: string, path: string) =>
  handler(new NextRequest(`http://localhost:3000${path}?${query}`));
const csvLines = (text: string) => text.replace(/^﻿/, "").split("\r\n").slice(1, -1);

describe("GET /api/admin/kudos/export", () => {
  it("downloads a no-store CSV attachment named kudos-{yyyyMMdd-HHmm}.csv with a BOM", async () => {
    const response = await call(exportRoute.GET, `receiver=${recipient.id}`, "/api/admin/kudos/export");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toMatch(/^attachment; filename="kudos-\d{8}-\d{4}\.csv"$/);
    // Response#text() strips a leading BOM (UTF-8 decode), so check the bytes on the wire.
    const bytes = Buffer.from(await response.arrayBuffer());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.subarray(3).toString("utf8").startsWith("ID,Ngày gửi,Người gửi,Email người gửi,Ẩn danh,")).toBe(true);
  });

  it("exports every page of the filter, the same rows and order as the table, for each sort", async () => {
    for (const sort of ["newest", "hearts_desc", "hearts_asc"]) {
      const query = `receiver=${recipient.id}&sort=${sort}&page=2`;
      const pages = await Promise.all(
        [1, 2].map(async (page) => (await (await call(listRoute.GET, query.replace("page=2", `page=${page}`), "/api/admin/kudos")).json()) as {
          total: number;
          rows: { id: string }[];
        }),
      );
      const lines = csvLines(await (await call(exportRoute.GET, query, "/api/admin/kudos/export")).text());
      expect(lines).toHaveLength(pages[0].total);
      expect(lines.map((line) => line.slice(0, 36))).toEqual(pages.flatMap((page) => page.rows.map((row) => row.id)));
    }
  });

  it("neutralises a formula cell and shows the real sender of an anonymous kudo (admin-only file)", async () => {
    const text = await (await call(exportRoute.GET, `receiver=${recipient.id}&q=hyperlink`, "/api/admin/kudos/export")).text();
    const [line] = csvLines(text);
    expect(line).toContain(`"'=HYPERLINK(""http://evil.example"",""bấm"")"`);
    expect(line).toContain(`,${anonSender.fullName},${anonSender.email},Có,`);
  });

  it("answers 422 export_too_large, with no file, when the filter matches more than EXPORT_MAX_ROWS", async () => {
    exportLimit.value = 12;
    const over = await call(exportRoute.GET, `receiver=${recipient.id}`, "/api/admin/kudos/export");
    expect(over.status).toBe(422);
    expect(over.headers.get("content-disposition")).toBeNull();
    expect(over.headers.get("cache-control")).toBe("private, no-store");
    expect(await over.json()).toEqual({ code: "export_too_large" });
    const atLimit = await call(exportRoute.GET, `receiver=${recipient.id}&sender=${sender.id}`, "/api/admin/kudos/export");
    expect(csvLines(await atLimit.text())).toHaveLength(12);
  });

  it("answers 422 instead of a file over the limit when a matching row is inserted while exporting", async () => {
    exportLimit.value = 12;
    let raced: string | undefined;
    beforeRowRead.run = async () => {
      raced ??= await insertKudo({ sender, recipient, body: "Chen vào giữa lúc xuất", createdAt: "2103-01-01T00:00:59Z" });
    };
    try {
      const response = await call(exportRoute.GET, `receiver=${recipient.id}&sender=${sender.id}`, "/api/admin/kudos/export");
      expect(raced).toBeDefined();
      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({ code: "export_too_large" });
    } finally {
      if (raced) await testSql`delete from public.kudos where id = ${raced}`;
    }
  });
});
