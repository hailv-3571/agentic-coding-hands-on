import { afterAll, describe, expect, it, vi } from "vitest";
import { UnitStatsQuery } from "@/features/admin-overview/server/unit-stats-query";
import { DEFAULT_ADMIN_USER_FILTER } from "@/features/admin-users/schemas/user-list-params-schema";
import type { AdminUserFilterValues } from "@/features/admin-users/schemas/admin-user-views";
import { UserAdminQuery } from "@/features/admin-users/server/user-admin-query";
import { db } from "@/shared/db/client";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";

/**
 * Phase 14 NFR "p95 < 500 ms at 5k users / 100k kudos" (Admin › User page and export, Admin › Overview):
 * EXPLAIN ANALYZE of the EXACT statements the queries send (captured from the app pool, with the
 * `SET LOCAL` the user query runs first) over session-local TEMP tables named like the real ones —
 * Postgres resolves them before `public.*` for the unqualified statements — copied `LIKE public.*
 * INCLUDING ALL` (same indexes and checks) and filled with 5,000 profiles, 100,000 kudos (10 % spam),
 * 200,000 hearts, icons, gifts and boxes, then VACUUMed (all-visible pages, fresh statistics). Each
 * shape runs 3 times; the worst run must stay under budget. The real tables are never touched.
 */
const BUDGET_MS = 500;
const RUNS = 3;
const TABLES = ["departments", "profiles", "kudos", "kudo_hearts", "user_icons", "mystery_gift_awards", "secret_boxes"];
type Statement = { query: string; params: unknown[] };
type Captured = Statement & { settings: string[] };
type Unsafe = { unsafe: (query: string, params?: unknown[]) => unknown };
type PoolClient = Unsafe & { begin: (fn: (tx: Unsafe) => Promise<unknown>) => Promise<unknown> };

afterAll(async () => closeAppDb());

/** Every statement `run` sends through the app pool, transactions included. */
async function captured(run: () => Promise<unknown>): Promise<Captured> {
  const client = (db as unknown as { $client: PoolClient }).$client;
  const statements: Statement[] = [];
  const begin = client.begin.bind(client);
  const pooled = vi.spyOn(client, "unsafe");
  const transactions = vi.spyOn(client, "begin").mockImplementation((fn) =>
    begin(async (tx) => {
      const inTx = vi.spyOn(tx, "unsafe");
      try {
        return await fn(tx);
      } finally {
        statements.push(...inTx.mock.calls.map(([query, params]) => ({ query, params: params ?? [] })));
      }
    }),
  );
  try {
    await run();
    statements.push(...pooled.mock.calls.map(([query, params]) => ({ query, params: params ?? [] })));
  } finally {
    pooled.mockRestore();
    transactions.mockRestore();
  }
  const select = statements.find((statement) => /^select/i.test(statement.query.trim()));
  if (!select) throw new Error("no select captured");
  return { ...select, settings: statements.filter((s) => /^set local/i.test(s.query.trim())).map((s) => s.query) };
}

async function seed(session: Awaited<ReturnType<typeof testSql.reserve>>) {
  for (const table of TABLES) await session.unsafe(`create temp table ${table} (like public.${table} including all)`);
  await session`insert into departments (code, name_vi, name_en) select 'D' || g, 'Unit ' || g, 'Unit ' || g from generate_series(1, 10) g`;
  await session`
    insert into profiles (id, email, full_name, department_id, role, last_login_at)
    select gen_random_uuid(), 'u' || g || '@sun-asterisk.com', 'Người dùng ' || g,
           case when g % 23 = 0 then null else d.ids[1 + g % 10] end,
           (case when g % 500 = 0 then 'admin' else 'user' end)::profile_role,
           case when g % 3 = 0 then null else now() - g * interval '1 hour' end
    from generate_series(1, 5000) g, (select array_agg(id) ids from departments) d`;
  await session`
    insert into kudos (sender_id, recipient_id, body, status, created_at)
    select p.ids[1 + (g * 7919) % 5000], p.ids[1 + ((g * 7919) % 5000 + 1 + g % 4999) % 5000], 'x',
           (case when g % 10 = 0 then 'spam' else 'public' end)::kudo_status, now() - g * interval '1 minute'
    from generate_series(1, 100000) g, (select array_agg(id order by id) ids from profiles) p`;
  await session`
    insert into kudo_hearts (kudo_id, user_id, created_at)
    select k.id, p.ids[1 + (k.rn * 31 + h * 977) % 5000], now() - interval '1 day'
    from (select id, row_number() over (order by id) rn from kudos) k, generate_series(1, 2) h, (select array_agg(id order by id) ids from profiles) p`;
  await session`
    insert into user_icons (user_id, icon_code)
    select p.id, icon from (select id, row_number() over (order by id) rn from profiles) p,
      unnest(array['REVIVAL', 'TOUCH_OF_LIGHT', 'STAY_GOLD']) icon where p.rn % 5 <> 0`;
  await session`insert into mystery_gift_awards (user_id, gift_name) select id, 'Quà' from profiles order by id limit 500`;
  await session`insert into secret_boxes (user_id, seq) select p.id, s from (select id from profiles order by id limit 2500) p, generate_series(1, 4) s`;
  for (const table of TABLES) await session.unsafe(`vacuum analyze ${table}`);
}

type ExplainRow = { "QUERY PLAN": [{ "Execution Time": number }] };
const filterOf = (patch: Partial<AdminUserFilterValues>): AdminUserFilterValues => ({ ...DEFAULT_ADMIN_USER_FILTER, ...patch });
const unit = async () => (await testSql<{ id: string }[]>`select id from public.departments order by code limit 1`)[0].id;

describe("admin report query plans at 5k users / 100k kudos", () => {
  it(`answers every Admin › User page shape, the export read and the Overview within ${BUDGET_MS} ms`, { timeout: 180_000 }, async () => {
    const unitId = await unit();
    const statements: Record<string, Captured> = {
      "users: default (name)": await captured(() => UserAdminQuery.listPage(filterOf({}), "vi")),
      "users: sort hearts desc": await captured(() => UserAdminQuery.listPage(filterOf({ sort: "hearts" }), "vi")),
      "users: level new": await captured(() => UserAdminQuery.listPage(filterOf({ level: "new" }), "vi")),
      "users: role admin": await captured(() => UserAdminQuery.listPage(filterOf({ role: "admin" }), "vi")),
      "users: search + level rising": await captured(() => UserAdminQuery.listPage(filterOf({ level: "rising", query: "nguoi dung 1" }), "vi")),
      "users: unit + sort level asc": await captured(() => UserAdminQuery.listPage(filterOf({ unit: unitId, sort: "level", dir: "asc" }), "vi")),
      "users: export 10,001 rows by last login": await captured(() => UserAdminQuery.listForExport(filterOf({ sort: "last_login_at" }), "vi", 10_001)),
      "overview: from 2025-01-01": await captured(() => UnitStatsQuery.forRange({ start: new Date("2025-01-01T00:00:00Z"), end: undefined }, "vi")),
      "overview: all time": await captured(() => UnitStatsQuery.forRange({ start: undefined, end: undefined }, "vi")),
    };
    const session = await testSql.reserve();
    const timings: Record<string, number> = {};
    try {
      await seed(session);
      // The unit filter was captured with a real department id; point it at a seeded temp one.
      const [tempUnit] = await session<{ id: string }[]>`select id from departments order by code limit 1`;
      for (const [label, { query, params: captured, settings }] of Object.entries(statements)) {
        const params = captured.map((param) => (param === unitId ? tempUnit.id : param));
        for (const setting of settings) await session.unsafe(setting.replace(/^set local/i, "set"));
        const runs: number[] = [];
        for (let run = 0; run < RUNS; run += 1) {
          const [row] = await session.unsafe<ExplainRow[]>(`explain (analyze, format json) ${query}`, params as never[]);
          runs.push(row["QUERY PLAN"][0]["Execution Time"]);
        }
        await session`reset all`;
        timings[label] = Math.round(Math.max(...runs));
      }
    } finally {
      for (const table of TABLES) await session.unsafe(`drop table if exists pg_temp.${table}`);
      session.release();
    }
    expect(statements["users: unit + sort level asc"].params).toContain(unitId);
    expect(statements["users: default (name)"].settings).toEqual(["set local enable_nestloop = off"]);
    expect(Object.entries(timings).filter(([, ms]) => ms >= BUDGET_MS)).toEqual([]);
  });
});
