import "server-only";
import { z } from "zod";
import { adminDateRangeSchema, type AdminDateRange } from "@/shared/admin/date-range-filter";
import type { AdminOverviewScreenProps, OverviewFilterValues } from "./unit-stats-views";

/**
 * Admin › Overview URL params `from` / `to` (F015 A1/A2, FR-401: the URL is the state, so a reload or
 * a shared link reproduces the numbers). Whole days `yyyy-MM-dd` in ADMIN_TIMEZONE → the half-open UTC
 * range of the phase 01 `adminDateRangeSchema` ([from 00:00, to + 1 day 00:00), BR-001); an absent end
 * is unbounded (DEC-002). Reversed → `invalid_date_range` (FR-403); malformed, impossible (2026-02-30)
 * or repeated → `invalid_params`. Server-only: the zone comes from env.
 */
export type OverviewParamsError = NonNullable<AdminOverviewScreenProps["filterError"]>;
export type OverviewParamsResult =
  | { ok: true; value: OverviewFilterValues; range: AdminDateRange }
  | { ok: false; error: OverviewParamsError };
export type OverviewRawParams = URLSearchParams | Record<string, string | string[] | undefined>;

export const ALL_TIME_OVERVIEW_FILTER: OverviewFilterValues = { from: null, to: null };

const day = z.iso.date().nullable();

function readDay(params: OverviewRawParams, name: "from" | "to"): string | null | undefined {
  const values = params instanceof URLSearchParams ? params.getAll(name) : [params[name] ?? []].flat();
  if (values.length > 1) return undefined;
  const value = values[0] || null;
  return day.safeParse(value).success ? value : undefined;
}

export function parseOverviewParams(params: OverviewRawParams): OverviewParamsResult {
  const from = readDay(params, "from");
  const to = readDay(params, "to");
  if (from === undefined || to === undefined) return { ok: false, error: "invalid_params" };
  const range = adminDateRangeSchema.safeParse({ from: from ?? undefined, to: to ?? undefined });
  if (!range.success) return { ok: false, error: "invalid_date_range" };
  return { ok: true, value: { from, to }, range: range.data };
}
