import "server-only";
import { and, asc, count, countDistinct, desc, eq, gte, isNull, lt, lte, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import { tierCountRange } from "@/features/hero-badges/server/tier-from-count";
import { heartCountsSubquery } from "@/features/kudos-hearts/server/heart-ranking-query";
import { db } from "@/shared/db/client";
import { kudos, mysteryGiftAwards, profiles, userIcons } from "@/shared/db/schema";
import type { AdminUserFilterValues } from "../schemas/admin-user-views";

/**
 * SQL building blocks of UserAdminQuery (F014 A1/A4, BR-004/005). Per-user numbers are grouped
 * subqueries LEFT JOINed onto `profiles`, so filter, sort and pages run in SQL across all users. No
 * count is defined twice (C-11/C-12): hearts come from phase 06's `heartCountsSubquery` (raw hearts on
 * the public kudos a user SENT = `HeartStatsQuery.rawTotal`), Level from phase 09's
 * `distinctSenderCountSubquery` + `tierCountRange` (= `HeroTierQuery`). Counts read public kudos only,
 * at query time (Mark Spam stops counting, Un Spam restores); anonymous kudos count for the real sender.
 */
export type UserListFilter = Omit<AdminUserFilterValues, "page">;

const isPublicKudo = eq(kudos.status, "public");

/** Grouped per-user metrics; a user without rows in a group has no row there (coalesced to 0). */
export function userMetricSubqueries(asOf: Date) {
  const sent = db
    .select({ userId: kudos.senderId, n: count().as("sent_count") })
    .from(kudos)
    .where(isPublicKudo)
    .groupBy(kudos.senderId)
    .as("sent_counts");
  const received = db
    .select({ userId: kudos.recipientId, n: count().as("received_count") })
    .from(kudos)
    .where(isPublicKudo)
    .groupBy(kudos.recipientId)
    .as("received_counts");
  const heartCounts = heartCountsSubquery(db.select({ id: kudos.id }).from(kudos).where(isPublicKudo), asOf);
  const hearts = db
    .select({ userId: kudos.senderId, n: sql<number>`sum(${heartCounts.rawCount})`.as("heart_total") })
    .from(heartCounts)
    .innerJoin(kudos, eq(kudos.id, heartCounts.kudoId))
    .groupBy(kudos.senderId)
    .as("heart_totals");
  const icons = db
    .select({ userId: userIcons.userId, n: countDistinct(userIcons.iconCode).as("icon_count") })
    .from(userIcons)
    .groupBy(userIcons.userId)
    .as("icon_counts");
  return { sent, received, hearts, tiers: HeroTierQuery.distinctSenderCountSubquery(), icons };
}

export type UserMetricSubqueries = ReturnType<typeof userMetricSubqueries>;

const zeroIfNone = (value: SQLWrapper) => sql<number>`coalesce(${value}, 0)`.mapWith(Number);

/** Sortable / filterable value per column (the `AdminUserSort` whitelist). */
export function userMetricColumns(m: UserMetricSubqueries) {
  return {
    sent: zeroIfNone(m.sent.n),
    received: zeroIfNone(m.received.n),
    hearts: zeroIfNone(m.hearts.n),
    /** Distinct public senders: the Hero tier is monotone in it, so it sorts and filters Level. */
    level: zeroIfNone(m.tiers.senderCount),
    badges: zeroIfNone(m.icons.n),
    six_badges_at: mysteryGiftAwards.completedAt,
    last_login_at: profiles.lastLoginAt,
  };
}

export type UserMetricColumns = ReturnType<typeof userMetricColumns>;

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Name OR email contains `query`, folding case and Vietnamese marks (D009, `public.f_unaccent`, 0007). */
function nameOrEmailMatches(query: string): SQL {
  const pattern = escapeLikePattern(query);
  const contains = (column: typeof profiles.fullName | typeof profiles.email) =>
    sql`public.f_unaccent(${column}) ilike '%' || public.f_unaccent(${pattern}) || '%' escape '\\'`;
  return sql`(${contains(profiles.fullName)} or ${contains(profiles.email)})`;
}

function levelMatches(senderCount: SQL, level: NonNullable<UserListFilter["level"]>): SQL | undefined {
  if (level === "none") return lt(senderCount, tierCountRange("new").min);
  const { min, max } = tierCountRange(level);
  return and(gte(senderCount, min), max === null ? undefined : lte(senderCount, max));
}

/** The ONE filter of the table, its totals and the export (BR-004): AND-ed, absent = all. */
export function userListWhere(filter: UserListFilter, columns: UserMetricColumns): SQL | undefined {
  return and(
    filter.unit === "none" ? isNull(profiles.departmentId) : filter.unit ? eq(profiles.departmentId, filter.unit) : undefined,
    filter.role ? eq(profiles.role, filter.role) : undefined,
    filter.level ? levelMatches(columns.level, filter.level) : undefined,
    filter.query ? nameOrEmailMatches(filter.query) : undefined,
  );
}

/**
 * Table order (BR-004, DEC-003): no sort = name A–Z; counts sort as numbers (no tier = 0 senders, so it
 * leads ascending); the two instants keep "—" (NULL) last in both directions. Always ends with id
 * ascending, a total order, so pages never repeat or skip a row.
 */
export function userListOrder(filter: UserListFilter, columns: UserMetricColumns): SQL[] {
  const tieBreak = asc(profiles.id);
  if (!filter.sort) return [asc(profiles.fullName), tieBreak];
  const column = columns[filter.sort];
  if (filter.sort === "six_badges_at" || filter.sort === "last_login_at") {
    return [filter.dir === "asc" ? sql`${column} asc nulls last` : sql`${column} desc nulls last`, tieBreak];
  }
  return [filter.dir === "asc" ? asc(column) : desc(column), tieBreak];
}
