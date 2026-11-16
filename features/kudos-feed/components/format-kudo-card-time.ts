/**
 * Card time `HH:mm - MM/DD/YYYY` in Vietnam time for both locales (Figma "10:00 - 10/30/2025",
 * decision-log 2026-11-16). An explicit time zone keeps server and client output identical.
 */
const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatKudoCardTime(iso: string): string {
  const part = Object.fromEntries(parts.formatToParts(new Date(iso)).map(({ type, value }) => [type, value]));
  return `${part.hour}:${part.minute} - ${part.month}/${part.day}/${part.year}`;
}
