import "server-only";
import { toAdminZone } from "@/shared/admin/timezone";

/**
 * Campaign instants as ADMIN_TIMEZONE wall clock (BR-006): every admin sees the same time.
 * The browser never learns ADMIN_TIMEZONE, so the server sends both strings in the list DTO.
 */
const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/** `dd/MM/yyyy - HH:mm` — the Time column and the overlap message (FR-201, FR-304). */
export function formatCampaignInstant(instant: Date): string {
  const p = toAdminZone(instant);
  return `${pad(p.day)}/${pad(p.month)}/${pad(p.year, 4)} - ${pad(p.hour)}:${pad(p.minute)}`;
}

/** `yyyy-MM-ddTHH:mm` — the value of `<input type="datetime-local">` in the Edit modal. */
export function toCampaignLocalValue(instant: Date): string {
  const p = toAdminZone(instant);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
