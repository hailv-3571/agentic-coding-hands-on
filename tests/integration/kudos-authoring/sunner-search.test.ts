import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as searchRoute } from "@/app/api/sunners/search/route";
import { searchSunners } from "@/features/sunner-search/server/sunner-search-query";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "./kudo-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/** The one Sunner search (C-06): searchSunners() + GET /api/sunners/search. */
const token = randomUUID().slice(0, 6);
let viewer: Sunner;
let duc: Sunner;
let bich: Sunner;
let meta: Sunner;
let department: { id: string; name_vi: string; name_en: string };

beforeAll(async () => {
  viewer = await createSunner("search-viewer", `Search Viewer ${token}`);
  duc = await createSunner("search-duc", `Nguyễn Văn Đức ${token}`);
  bich = await createSunner("search-bich", `Trần Thị Bích ${token}`);
  meta = await createSunner("search-meta", `Lê_Văn 100% ${token}`);
  [department] = await testSql<typeof department[]>`select id, name_vi, name_en from public.departments where code = 'CEVC1'`;
});
beforeEach(() => requestCookies.clear());
afterAll(async () => {
  await cleanupSunners([viewer, duc, bich, meta]);
  await closeAppDb();
});

const search = (q: string, options: { excludeSelf?: boolean; limit?: number; locale?: "vi" | "en" } = {}) =>
  searchSunners(q, { viewerId: viewer.id, limit: options.limit ?? 20, excludeSelf: options.excludeSelf ?? false, locale: options.locale ?? "vi" });
const idsOf = (rows: { id: string }[]) => rows.map((row) => row.id);

describe("searchSunners", () => {
  it("matches names diacritic- and case-insensitively and returns SunnerOption rows", async () => {
    const rows = await search(`NGUYÊN van duc ${token}`);
    expect(rows).toEqual([
      {
        id: duc.id,
        fullName: duc.fullName,
        email: duc.email,
        avatarUrl: null,
        department: { id: department.id, name: department.name_vi },
      },
    ]);
    expect((await search(`Bich ${token}`, { locale: "en" }))[0].department?.name).toBe(department.name_en);
  });

  it("honours excludeSelf", async () => {
    expect(idsOf(await search(`Search Viewer ${token}`, { excludeSelf: true }))).toEqual([]);
    expect(idsOf(await search(`Search Viewer ${token}`))).toEqual([viewer.id]);
  });

  it("matches an email prefix, not an email infix", async () => {
    expect(idsOf(await search(viewer.email.slice(0, 16)))).toContain(viewer.id);
    const infix = viewer.email.slice("search-viewer-".length, "search-viewer-".length + 8);
    expect(idsOf(await search(infix))).not.toContain(viewer.id);
  });

  it("treats LIKE metacharacters as literal text", async () => {
    for (const q of ["%", "_"]) {
      const ids = idsOf(await search(q));
      expect(ids).toContain(meta.id);
      expect(ids).not.toContain(duc.id);
      expect(ids).not.toContain(bich.id);
    }
    expect(await search("\\")).toEqual([]);
  });

  it("orders by name and applies the limit", async () => {
    expect(idsOf(await search(token))).toEqual([meta.id, duc.id, viewer.id, bich.id]);
    expect(await search(token, { limit: 2 })).toHaveLength(2);
  });
});

describe("GET /api/sunners/search", () => {
  const get = async (query: string) => {
    const response = await searchRoute(new NextRequest(`http://localhost:3000/api/sunners/search?${query}`));
    return { status: response.status, json: await response.json() };
  };

  it("answers 401 without a session", async () => {
    expect(await get(`q=${token}`)).toEqual({ status: 401, json: { code: "UNAUTHENTICATED" } });
  });

  it("answers 400 for invalid parameters", async () => {
    await signInToJar(requestCookies, viewer.email);
    expect(await get("limit=5")).toEqual({ status: 400, json: { code: "VALIDATION", fieldErrors: { q: ["required"] } } });
  });

  it("excludes the session user when excludeSelf=true", async () => {
    await signInToJar(requestCookies, viewer.email);
    const included = await get(`q=${token}&limit=20`);
    expect(included.status).toBe(200);
    expect(idsOf(included.json)).toContain(viewer.id);
    expect(idsOf((await get(`q=${token}&excludeSelf=true`)).json)).toEqual([meta.id, duc.id, bich.id]);
  });
});
