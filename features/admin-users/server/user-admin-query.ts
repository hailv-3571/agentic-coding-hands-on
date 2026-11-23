import "server-only";
import { eq, sql } from "drizzle-orm";
import { tierFromCount } from "@/features/hero-badges/server/tier-from-count";
import { db } from "@/shared/db/client";
import { departments, mysteryGiftAwards, profiles } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { AdminUserFilterValues, AdminUserPage, AdminUserRow } from "../schemas/admin-user-views";
import { isEnvAdminEmail } from "./env-admin-email";
import {
  userListOrder,
  userListWhere,
  userMetricColumns,
  userMetricSubqueries,
  type UserListFilter,
} from "./user-admin-sql-fragments";

/**
 * UserAdminQuery (F014 A1/A4): Admin › User reads over EVERY profile, one statement per read. The
 * table page and the CSV export share one builder (BR-004: same filter, same order, same numbers);
 * the page also carries `count(*)` and the Sent / Received column sums over the whole filter as window
 * values (header "(n)"), so no second aggregate pass. A page past the end is clamped to the last one.
 * NO guard inside: callers pass `requireAdmin()` / `requireAdminApi()` first (Drizzle bypasses RLS, C-20).
 */
export const ADMIN_USER_PAGE_SIZE = 20;

type ReadWindow = { limit: number; offset: number };

/**
 * Planner guard for this report statement only (SET LOCAL ends with the transaction). The per-user
 * aggregates must be hash-joined, i.e. computed once: a search or role filter that Postgres estimates
 * at ~1 profile otherwise gets nested loops that recompute the sort-based `count(DISTINCT)` aggregates
 * (Hero tier) once per matching profile — measured 12 s instead of ~0.2 s at 5k users / 100k kudos
 * (tests/integration/admin-users/admin-report-query-plan.test.ts).
 */
const HASH_JOIN_AGGREGATES = sql`set local enable_nestloop = off`;

async function readRows(filter: UserListFilter, locale: Locale, window: ReadWindow) {
  const metrics = userMetricSubqueries(new Date());
  const columns = userMetricColumns(metrics);
  return db.transaction(async (tx) => {
    await tx.execute(HASH_JOIN_AGGREGATES);
    return tx
      .select({
        id: profiles.id,
        name: profiles.fullName,
        email: profiles.email,
        role: profiles.role,
        departmentId: departments.id,
        departmentName: locale === "en" ? departments.nameEn : departments.nameVi,
        kudosSent: columns.sent,
        kudosReceived: columns.received,
        totalHearts: columns.hearts,
        senderCount: columns.level,
        badgeCount: columns.badges,
        sixBadgesAt: columns.six_badges_at,
        lastLoginAt: columns.last_login_at,
        total: sql<number>`count(*) over ()`.mapWith(Number),
        sentTotal: sql<number>`sum(${columns.sent}) over ()`.mapWith(Number),
        receivedTotal: sql<number>`sum(${columns.received}) over ()`.mapWith(Number),
      })
      .from(profiles)
      .leftJoin(departments, eq(departments.id, profiles.departmentId))
      .leftJoin(metrics.sent, eq(metrics.sent.userId, profiles.id))
      .leftJoin(metrics.received, eq(metrics.received.userId, profiles.id))
      .leftJoin(metrics.hearts, eq(metrics.hearts.userId, profiles.id))
      .leftJoin(metrics.tiers, eq(metrics.tiers.recipientId, profiles.id))
      .leftJoin(metrics.icons, eq(metrics.icons.userId, profiles.id))
      .leftJoin(mysteryGiftAwards, eq(mysteryGiftAwards.userId, profiles.id))
      .where(userListWhere(filter, columns))
      .orderBy(...userListOrder(filter, columns))
      .limit(window.limit)
      .offset(window.offset);
  });
}

type ReadRow = Awaited<ReturnType<typeof readRows>>[number];

function toAdminUserRow(row: ReadRow): AdminUserRow {
  return {
    id: row.id,
    shortId: row.id.slice(0, 8),
    name: row.name,
    email: row.email,
    kudosSent: row.kudosSent,
    kudosReceived: row.kudosReceived,
    totalHearts: row.totalHearts,
    level: tierFromCount(row.senderCount),
    badgeCount: row.badgeCount,
    sixBadgesAt: row.sixBadgesAt?.toISOString() ?? null,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    role: row.role,
    envAdmin: isEnvAdminEmail(row.email),
    department: row.departmentId && row.departmentName ? { id: row.departmentId, name: row.departmentName } : null,
  };
}

const pageWindow = (page: number): ReadWindow => ({ limit: ADMIN_USER_PAGE_SIZE, offset: (page - 1) * ADMIN_USER_PAGE_SIZE });

/** One table page; `page` clamped to [1, pageCount] (an empty filter is page 1 of 1). */
async function listPage(filter: AdminUserFilterValues, locale: Locale): Promise<AdminUserPage> {
  let page = filter.page;
  let rows = await readRows(filter, locale, pageWindow(page));
  if (rows.length === 0 && page > 1) {
    const [probe] = await readRows(filter, locale, { limit: 1, offset: 0 });
    page = Math.max(1, Math.ceil((probe?.total ?? 0) / ADMIN_USER_PAGE_SIZE));
    rows = probe ? await readRows(filter, locale, pageWindow(page)) : [];
  }
  const total = rows[0]?.total ?? 0;
  return {
    rows: rows.map(toAdminUserRow),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_USER_PAGE_SIZE)),
    columnTotals: { kudosSent: rows[0]?.sentTotal ?? 0, kudosReceived: rows[0]?.receivedTotal ?? 0 },
  };
}

/**
 * At most `maxRows` rows of the filter in table order from the first row (CSV, DEC-002; `page` is
 * ignored). The export asks for EXPORT_MAX_ROWS + 1 and refuses the file when it gets them all, so the
 * limit check and the rows come from one read.
 */
async function listForExport(filter: UserListFilter, locale: Locale, maxRows: number): Promise<AdminUserRow[]> {
  return (await readRows(filter, locale, { limit: maxRows, offset: 0 })).map(toAdminUserRow);
}

export const UserAdminQuery = { listPage, listForExport } as const;
