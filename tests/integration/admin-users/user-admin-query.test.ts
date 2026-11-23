import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DEFAULT_ADMIN_USER_FILTER } from "@/features/admin-users/schemas/user-list-params-schema";
import type { AdminUserFilterValues } from "@/features/admin-users/schemas/admin-user-views";
import { UserAdminQuery } from "@/features/admin-users/server/user-admin-query";
import { UserFilterOptionsQuery } from "@/features/admin-users/server/user-filter-options-query";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import { HeartStatsQuery } from "@/features/kudos-hearts/server/heart-stats-query";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart } from "../kudos-hearts/kudo-heart-fixtures";
import * as fx from "./admin-users-fixtures";

const envAdmins = vi.hoisted(() => ({ extra: [] as string[] }));
vi.mock("@/shared/config/env", async (original) => {
  const real = await original<{ env: { ADMIN_EMAILS: readonly string[] } }>();
  return { env: { ...real.env, get ADMIN_EMAILS() { return [...real.env.ADMIN_EMAILS, ...envAdmins.extra]; } } };
});

/**
 * UserAdminQuery (A1, BR-004/005, C-11/C-12/C-13): per-user numbers over public kudos only (spam stops
 * counting, Un Spam restores), anonymous kudos counted for the real sender, Total Heart and Level equal
 * to HeartStatsQuery.rawTotal / HeroTierQuery for every row (parity, also on the shared database's top
 * page), accent-insensitive search on name OR email with LIKE wildcards escaped, AND-combined filters.
 * Every Sunner's name (or email) carries a unique token, so `q` isolates this file's rows.
 */
const ICONS = ["REVIVAL", "TOUCH_OF_LIGHT", "STAY_GOLD", "FLOW_TO_HORIZON", "BEYOND_THE_BOUNDARY", "ROOT_FURTHER"];
const T = fx.uniqueToken("Zq");
const M = fx.uniqueToken("mq");
let an: Sunner, binh: Sunner, duc: Sunner, hoa: Sunner, mailOnly: Sunner, fans: Sunner[];
let unitA: string, unitB: string, spamKudo: string, binhKudo: string;
const all = () => [an, binh, duc, hoa, mailOnly, ...fans];

beforeAll(async () => {
  [an, binh, duc, mailOnly, ...fans] = await Promise.all([
    createSunner("uq-an", `${T} Nguyễn An`),
    createSunner("uq-binh", `${T} Trần Bình`),
    createSunner("uq-duc", `${T} Lê Đức`),
    createSunner(`uq${M}`, "Người Ẩn Danh Tên"),
    ...[1, 2, 3, 4, 5].map((n) => createSunner("uq-fan", `Fan Số ${n}`)),
  ]);
  hoa = await fx.createUnassignedSunner("uq-hoa", `${T} Phạm Hoa 100%`);
  [unitA, unitB] = await Promise.all([fx.createTestDepartment(`P14 Đơn vị ${T} A`), fx.createTestDepartment(`P14 Đơn vị ${T} B`)]);
  await fx.moveToTestDepartment([an, binh], unitA);
  await fx.moveToTestDepartment([duc], unitB);
  await fx.setRoles([binh.id], "admin");
  envAdmins.extra = [binh.email];

  binhKudo = await insertKudo({ sender: an, recipient: binh });
  spamKudo = await insertKudo({ sender: an, recipient: binh, status: "spam" });
  const anonKudo = await insertKudo({ sender: an, recipient: duc, nickname: "Mây" });
  await insertKudo({ sender: duc, recipient: an });
  for (const fan of fans) await insertKudo({ sender: fan, recipient: an });
  await insertKudo({ sender: fans[0], recipient: hoa });
  await insertKudo({ sender: fans[0], recipient: hoa });
  await insertHeart(binhKudo, fans[0].id);
  await insertHeart(binhKudo, fans[1].id);
  await insertHeart(spamKudo, fans[2].id);
  await insertHeart(anonKudo, fans[0].id);
  for (const icon of ["REVIVAL", "STAY_GOLD"]) await fx.insertIcon(an.id, icon);
  for (const icon of ICONS) await fx.insertIcon(binh.id, icon);
  await fx.insertMysteryGift(binh.id, "2025-12-01T03:04:05.000Z");
  await fx.setLastLogin(an.id, "2025-12-02T01:00:00.000Z");
});
afterAll(async () => {
  await cleanupSunners(all());
  await fx.deleteTestDepartments([unitA, unitB]);
  await closeAppDb();
});

const filterOf = (patch: Partial<AdminUserFilterValues> = {}): AdminUserFilterValues => ({ ...DEFAULT_ADMIN_USER_FILTER, query: T, ...patch });
const list = (patch: Partial<AdminUserFilterValues> = {}) => UserAdminQuery.listPage(filterOf(patch), "vi");
const namesOf = async (patch: Partial<AdminUserFilterValues> = {}) => (await list(patch)).rows.map((row) => row.name);

describe("UserAdminQuery.listPage — numbers", () => {
  it("returns every column, name A–Z, counting public kudos only and anonymous ones for the real sender", async () => {
    const page = await list();
    expect(page).toMatchObject({ total: 4, page: 1, pageCount: 1, columnTotals: { kudosSent: 3, kudosReceived: 10 } });
    expect(page.rows.map((row) => row.name)).toEqual([`${T} Lê Đức`, `${T} Nguyễn An`, `${T} Phạm Hoa 100%`, `${T} Trần Bình`]);
    const byId = new Map(page.rows.map((row) => [row.id, row]));
    expect(byId.get(an.id)).toEqual({
      id: an.id, shortId: an.id.slice(0, 8), name: an.fullName, email: an.email, kudosSent: 2, kudosReceived: 6, totalHearts: 3,
      level: "rising", badgeCount: 2, sixBadgesAt: null, lastLoginAt: "2025-12-02T01:00:00.000Z", role: "user", envAdmin: false,
      department: { id: unitA, name: `P14 Đơn vị ${T} A` },
    });
    expect(byId.get(binh.id)).toMatchObject({ kudosSent: 0, kudosReceived: 1, totalHearts: 0, level: "new", badgeCount: 6, sixBadgesAt: "2025-12-01T03:04:05.000Z", role: "admin", envAdmin: true });
    expect(byId.get(duc.id)).toMatchObject({ kudosSent: 1, kudosReceived: 1, level: "new", department: { id: unitB } });
    expect(byId.get(hoa.id)).toMatchObject({ kudosReceived: 2, level: "new", badgeCount: 0, lastLoginAt: null, department: null });
  });

  it("stops counting a kudo marked spam and restores it on Un Spam", async () => {
    try {
      await testSql`update public.kudos set status = 'spam' where id = ${binhKudo}`;
      const spammed = new Map((await list()).rows.map((row) => [row.id, row]));
      expect(spammed.get(an.id)).toMatchObject({ kudosSent: 1, totalHearts: 1 });
      expect(spammed.get(binh.id)).toMatchObject({ kudosReceived: 0, level: null, badgeCount: 6 });
    } finally {
      await testSql`update public.kudos set status = 'public' where id = ${binhKudo}`;
    }
    expect((await list()).rows.find((row) => row.id === binh.id)).toMatchObject({ kudosReceived: 1, level: "new" });
  });

  it("matches HeartStatsQuery.rawTotal and HeroTierQuery for every row, here and on the shared top page", async () => {
    for (const filter of [filterOf(), { ...DEFAULT_ADMIN_USER_FILTER, sort: "hearts" as const }, { ...DEFAULT_ADMIN_USER_FILTER, sort: "level" as const }]) {
      const { rows } = await UserAdminQuery.listPage(filter, "vi");
      const ids = rows.map((row) => row.id);
      const [hearts, tiers] = await Promise.all([HeartStatsQuery.receivedByUsers(ids), HeroTierQuery.getTiersByRecipientIds(ids)]);
      expect(rows.map((row) => [row.id, row.totalHearts, row.level])).toEqual(ids.map((id) => [id, hearts.get(id)?.rawTotal, tiers[id] ?? null]));
    }
  });
});

describe("UserAdminQuery.listPage — search and filters", () => {
  it("searches name OR email ignoring case and Vietnamese marks (nguyen → Nguyễn, duc → Đức)", async () => {
    expect(await namesOf({ query: `${T.toLowerCase()} nguyen` })).toEqual([an.fullName]);
    expect(await namesOf({ query: `${T} LE DUC` })).toEqual([duc.fullName]);
    expect(await namesOf({ query: `${T} nguyến án` })).toEqual([an.fullName]);
    expect(await namesOf({ query: M })).toEqual([mailOnly.fullName]);
  });

  it("keeps % and _ literal in the search", async () => {
    expect(await namesOf({ query: `${T} Phạm Hoa 100%` })).toEqual([hoa.fullName]);
    expect(await namesOf({ query: `${T} Ph_m` })).toEqual([]);
    expect(await namesOf({ query: `${T}%` })).toEqual([]);
  });

  it("AND-combines unit, role, level and search", async () => {
    expect(await namesOf({ unit: unitA })).toEqual([an.fullName, binh.fullName]);
    expect(await namesOf({ unit: unitA, role: "admin" })).toEqual([binh.fullName]);
    expect(await namesOf({ unit: "none" })).toEqual([hoa.fullName]);
    expect(await namesOf({ level: "rising" })).toEqual([an.fullName]);
    expect(await namesOf({ level: "new", unit: unitA })).toEqual([binh.fullName]);
    expect(await namesOf({ level: "legend" })).toEqual([]);
    expect(await namesOf({ query: M, level: "none" })).toEqual([mailOnly.fullName]);
    expect(await namesOf({ unit: unitB, role: "admin" })).toEqual([]);
  });
});

describe("UserFilterOptionsQuery.get", () => {
  it("lists every department with its localized name, natural A–Z", async () => {
    const { departments } = await UserFilterOptionsQuery.get("vi");
    const mine = departments.filter((unit) => unit.name.includes(T));
    expect(mine).toEqual([{ id: unitA, name: `P14 Đơn vị ${T} A` }, { id: unitB, name: `P14 Đơn vị ${T} B` }]);
    const names = departments.map((unit) => unit.name);
    expect(names).toEqual([...names].sort(new Intl.Collator("vi", { numeric: true }).compare));
  });
});
