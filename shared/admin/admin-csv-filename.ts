import "server-only";
import { toAdminZone } from "./timezone";

/** `{prefix}-yyyyMMdd-HHmm.csv`, wall clock of `now` in ADMIN_TIMEZONE (Admin › User and Overview exports). */
export function adminCsvFilename(prefix: string, now: Date): string {
  const p = toAdminZone(now);
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${prefix}-${pad(p.year, 4)}${pad(p.month)}${pad(p.day)}-${pad(p.hour)}${pad(p.minute)}.csv`;
}
