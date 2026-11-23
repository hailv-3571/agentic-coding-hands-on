/**
 * Phase 14 (F014) Admin › User view contracts shared by the server (UserAdminQuery, role service,
 * export route) and the UI (table, filters, role menu). Written by the orchestrator so backend and UI
 * could be built in parallel. ADMIN-ONLY: built behind `requireAdmin()`. Client-safe: types and
 * constants only.
 *
 * Counts use public kudos only, evaluated at query time (spam stops counting, Un Spam restores);
 * anonymous kudos count for the real sender. Total Heart = `HeartStatsQuery.rawTotal` (hearts on the
 * kudos the user SENT, raw, C-11); Level = Hero tier (C-12, `HeroTierQuery`).
 */
import type { HeroTier } from "@/features/hero-badges/schemas/hero-tier";

export type AdminUserRole = "admin" | "user";

export type AdminUserRow = {
  id: string;
  /** First 8 characters of the uuid (ID column). */
  shortId: string;
  name: string;
  email: string;
  kudosSent: number;
  kudosReceived: number;
  totalHearts: number;
  /** null = no Hero tier yet (shown "—"). */
  level: HeroTier | null;
  /** Distinct secret-box icons owned, 0–6. */
  badgeCount: number;
  /** ISO instant the 6-icon set was completed, null = "—". */
  sixBadgesAt: string | null;
  /** ISO instant, null = never logged in ("—"). */
  lastLoginAt: string | null;
  role: AdminUserRole;
  /** In `ADMIN_EMAILS`: "Admin · env" badge, "Set as User" disabled, server answers 409 ENV_ADMIN. */
  envAdmin: boolean;
  /** `departments.id` is a uuid (phase 01 schema), so department ids are strings. */
  department: { id: string; name: string } | null;
};

/** Sortable columns (whitelist, URL `sort`); `dir` asc|desc; ties break by id. */
export const ADMIN_USER_SORTS = [
  "sent",
  "received",
  "hearts",
  "level",
  "badges",
  "six_badges_at",
  "last_login_at",
] as const;
export type AdminUserSort = (typeof ADMIN_USER_SORTS)[number];

/** URL search-param names shared by the page and the CSV export. */
export const ADMIN_USER_PARAMS = {
  page: "page",
  unit: "unit",
  level: "level",
  role: "role",
  query: "q",
  sort: "sort",
  dir: "dir",
} as const;

export type AdminUserFilterValues = {
  page: number;
  /** Department id (uuid), "none" = unassigned, null = all. */
  unit: string | null;
  /** Hero tier, "none" = no tier, null = all. */
  level: HeroTier | "none" | null;
  role: AdminUserRole | null;
  /** Trimmed, ≤ 100 chars, accent-insensitive on name OR email. */
  query: string;
  sort: AdminUserSort | null;
  dir: "asc" | "desc";
};

export type AdminUserPage = {
  rows: AdminUserRow[];
  total: number;
  /** 1-based, clamped to [1, pageCount]. */
  page: number;
  pageCount: number;
  /** Header "(n)" values: column totals over the whole current filter (not just this page). */
  columnTotals: { kudosSent: number; kudosReceived: number };
};

export type AdminUserFilterOptions = {
  departments: { id: string; name: string }[];
};

/** Props of `AdminUsersScreen` (features/admin-users/components/admin-users-screen.tsx). */
export type AdminUsersScreenProps = {
  data: AdminUserPage;
  filter: AdminUserFilterValues;
  options: AdminUserFilterOptions;
  /** Actor's own id: the role menu hides "Set as User" on the actor's row (403 SELF_DEMOTE). */
  actorId: string;
  /** Invalid URL params (e.g. q > 100 chars): show the message, `data` holds unfiltered page 1. */
  filterError: "query_too_long" | "invalid_params" | null;
  loadError: boolean;
};

/** Server action `setUserRoleAction({ userId, role })` result. */
export type SetUserRoleResult =
  | { ok: true; id: string; role: AdminUserRole }
  | { ok: false; error: "NOT_FOUND" | "SELF_DEMOTE" | "LAST_ADMIN" | "ENV_ADMIN" | "FORBIDDEN" | "INVALID" | "UNEXPECTED" };
