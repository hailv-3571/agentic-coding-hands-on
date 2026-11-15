import "server-only";
import { z } from "zod";
import { startOfDayInZone } from "./timezone";

/**
 * Admin date-range filter (C-14). Input: optional inclusive calendar days `from`/`to`
 * (`YYYY-MM-DD`, as typed in the admin UI, interpreted in `ADMIN_TIMEZONE`).
 * Output: half-open UTC range — filter with `col >= start AND col < end`.
 */

const optionalDay = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.iso.date().optional(),
);

function nextCalendarDay(isoDate: string): string {
  const next = new Date(`${isoDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export const adminDateRangeSchema = z
  .object({ from: optionalDay, to: optionalDay })
  .refine(({ from, to }) => !from || !to || from <= to, {
    path: ["to"],
    message: "`to` must be on or after `from`",
  })
  .transform(({ from, to }) => ({
    start: from ? startOfDayInZone(from) : undefined,
    end: to ? startOfDayInZone(nextCalendarDay(to)) : undefined,
  }));

export type AdminDateRange = z.output<typeof adminDateRangeSchema>;
