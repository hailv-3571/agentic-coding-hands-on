import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_ADMIN_USER_FILTER } from "@/features/admin-users/schemas/user-list-params-schema";
import type { AdminUserFilterValues, AdminUserSort } from "@/features/admin-users/schemas/admin-user-views";
import { ADMIN_USER_PAGE_SIZE, UserAdminQuery } from "@/features/admin-users/server/user-admin-query";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart } from "../kudos-hearts/kudo-heart-fixtures";
import * as fx from "./admin-users-fixtures";

/**
 * UserAdminQuery order and pages (FR-202/207, BR-004, DEC-003): every sortable column both ways, ties
 * by id ascending; "—" values (no 6-badge time, never logged in) last in BOTH directions; Level sorts
 * by distinct-sender count, so "no tier" comes first ascending; 20 rows a page, disjoint pages, a page
 * past the end clamped to the last; header totals over the whole filter, not the page.
 * 22 Sunners share token P: s1..s5 carry distinct numbers, f01..f17 are filler (senders, fans).
 */
const P = fx.uniqueToken("Zp");
let s: Sunner[], f: Sunner[];

beforeAll(async () => {
  const created = await Promise.all([
    ...[1, 2, 3, 4, 5].map((n) => createSunner("pg-s", `${P} S${n}`)),
    ...Array.from({ length: 17 }, (_, n) => createSunner("pg-f", `${P} F${String(n + 1).padStart(2, "0")}`)),
  ]);
  s = created.slice(0, 5);
  f = created.slice(5);
  const [s1, s2, s3, s4, s5] = s;
  const s1Kudos = [await insertKudo({ sender: s1, recipient: f[0] }), await insertKudo({ sender: s1, recipient: f[1] }), await insertKudo({ sender: s1, recipient: f[2] })];
  const s4Kudos = [await insertKudo({ sender: s4, recipient: f[0] }), await insertKudo({ sender: s4, recipient: f[1] })];
  await insertKudo({ sender: s2, recipient: f[0] });
  for (const fan of f.slice(0, 5)) await insertKudo({ sender: fan, recipient: s2 });
  for (let n = 0; n < 3; n += 1) await insertKudo({ sender: f[5], recipient: s3 });
  await insertKudo({ sender: f[6], recipient: s4 });
  await insertKudo({ sender: f[7], recipient: s4 });
  await insertHeart(s1Kudos[0], f[8].id);
  for (const kudo of s4Kudos) for (const fan of [f[8], f[9]]) await insertHeart(kudo, fan.id);
  for (const icon of ["REVIVAL", "STAY_GOLD", "ROOT_FURTHER"]) await fx.insertIcon(s5.id, icon);
  await fx.insertIcon(s3.id, "REVIVAL");
  await fx.insertMysteryGift(s2.id, "2025-12-01T00:00:00.000Z");
  await fx.insertMysteryGift(s4.id, "2025-12-05T00:00:00.000Z");
  await fx.setLastLogin(s1.id, "2025-01-01T00:00:00.000Z");
  await fx.setLastLogin(s3.id, "2025-06-01T00:00:00.000Z");
});
afterAll(async () => {
  await cleanupSunners([...s, ...f]);
  await closeAppDb();
});

const filterOf = (patch: Partial<AdminUserFilterValues>): AdminUserFilterValues => ({ ...DEFAULT_ADMIN_USER_FILTER, ...patch });
/** Users in this order, each tied group sorted by id ascending (the final tie-break). */
const ordered = (...groups: Sunner[][]) => groups.flatMap((group) => [...group].sort((a, b) => (a.id < b.id ? -1 : 1))).map((u) => u.fullName);

describe("UserAdminQuery sort", () => {
  it.each<[AdminUserSort, "asc" | "desc", (u: Sunner[]) => string[]]>([
    ["sent", "desc", ([s1, s2, s3, s4, s5]) => ordered([s1], [s4], [s2], [s3, s5])],
    ["sent", "asc", ([s1, s2, s3, s4, s5]) => ordered([s3, s5], [s2], [s4], [s1])],
    ["received", "desc", ([s1, s2, s3, s4, s5]) => ordered([s2], [s3], [s4], [s1, s5])],
    ["hearts", "desc", ([s1, s2, s3, s4, s5]) => ordered([s4], [s1], [s2, s3, s5])],
    ["level", "asc", ([s1, s2, s3, s4, s5]) => ordered([s1, s5], [s3], [s4], [s2])],
    ["level", "desc", ([s1, s2, s3, s4, s5]) => ordered([s2], [s4], [s3], [s1, s5])],
    ["badges", "desc", ([s1, s2, s3, s4, s5]) => ordered([s5], [s3], [s1, s2, s4])],
    ["badges", "asc", ([s1, s2, s3, s4, s5]) => ordered([s1, s2, s4], [s3], [s5])],
    ["six_badges_at", "asc", ([s1, s2, s3, s4, s5]) => ordered([s2], [s4], [s1, s3, s5])],
    ["six_badges_at", "desc", ([s1, s2, s3, s4, s5]) => ordered([s4], [s2], [s1, s3, s5])],
    ["last_login_at", "asc", ([s1, s2, s3, s4, s5]) => ordered([s1], [s3], [s2, s4, s5])],
    ["last_login_at", "desc", ([s1, s2, s3, s4, s5]) => ordered([s3], [s1], [s2, s4, s5])],
  ])("%s %s", async (sort, dir, expected) => {
    const { rows } = await UserAdminQuery.listPage(filterOf({ query: `${P} S`, sort, dir }), "vi");
    expect(rows.map((row) => row.name)).toEqual(expected(s));
  });
});

describe("UserAdminQuery pages", () => {
  it("pages 20 at a time without repeats or gaps, totals over the whole filter", async () => {
    expect(ADMIN_USER_PAGE_SIZE).toBe(20);
    const [first, second] = await Promise.all([1, 2].map((page) => UserAdminQuery.listPage(filterOf({ query: P, page }), "vi")));
    expect([first.rows.length, second.rows.length]).toEqual([20, 2]);
    for (const page of [first, second]) expect(page).toMatchObject({ total: 22, pageCount: 2, columnTotals: { kudosSent: 16, kudosReceived: 16 } });
    const names = [...first.rows, ...second.rows].map((row) => row.name);
    expect(names).toEqual([...f, ...s].map((u) => u.fullName));
  });

  it("clamps a page past the end to the last page and answers an empty filter with page 1 of 1", async () => {
    const past = await UserAdminQuery.listPage(filterOf({ query: P, page: 9 }), "vi");
    expect(past).toMatchObject({ page: 2, pageCount: 2, total: 22 });
    expect(past.rows.map((row) => row.name)).toEqual([s[3].fullName, s[4].fullName]);
    const none = await UserAdminQuery.listPage(filterOf({ query: `${P} nobody`, page: 3 }), "vi");
    expect(none).toEqual({ rows: [], total: 0, page: 1, pageCount: 1, columnTotals: { kudosSent: 0, kudosReceived: 0 } });
  });
});
