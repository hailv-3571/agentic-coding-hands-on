import type { ZonedDateTimeParts } from "./timezone";

const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/**
 * `dd/MM/yyyy HH:mm` of ADMIN_TIMEZONE wall-clock parts (`toAdminZone` from shared/admin/timezone,
 * the helper the phase 06/08 admin tables and CSVs use). Pure; the server turns ISO instants into
 * parts, so the browser never needs to know ADMIN_TIMEZONE. Used by the Admin › User table and CSV.
 */
export function formatAdminDateTime(parts: ZonedDateTimeParts): string {
  return `${pad(parts.day)}/${pad(parts.month)}/${pad(parts.year, 4)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}
