import type { AdminUserRow } from "../schemas/admin-user-views";

/**
 * An `AdminUserRow` with its two instants already written as `dd/MM/yyyy HH:mm` in ADMIN_TIMEZONE
 * (null = "—"). The server screen adds the labels, so the browser never needs the admin time zone.
 */
export type AdminUserViewRow = AdminUserRow & {
  sixBadgesAtLabel: string | null;
  lastLoginAtLabel: string | null;
};
