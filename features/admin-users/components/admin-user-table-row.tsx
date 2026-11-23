"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { AdminUserViewRow } from "../lib/admin-user-view-row";
import type { AdminUserRole } from "../schemas/admin-user-views";
import { AdminUserRoleMenu } from "./admin-user-role-menu";
import { centredCell, denseActionsCell as actionsCell, denseBodyCell as bodyCell, envAdminBadge } from "./admin-users-styles";

type AdminUserTableRowProps = {
  row: AdminUserViewRow;
  /** The role on screen (patched in place after a change). */
  role: AdminUserRole;
  actorId: string;
  onRoleChanged(user: AdminUserViewRow, role: AdminUserRole): void;
};

/** `dd/MM/yyyy HH:mm` as date over time (Figma draws two lines); "—" when there is none. */
function AdminInstant({ label }: { label: string | null }) {
  if (!label) return <>—</>;
  const [date, time] = label.split(" ");
  return (
    <span className="flex flex-col">
      <span>{date}</span>
      <span>{time}</span>
    </span>
  );
}

/**
 * One user row (Figma 773:26403): short id · name and email (wrapping anywhere) · counts with the
 * locale's thousands separator, Total Heart in red #D4271D · Hero tier label · badges owned (0–6)
 * · the two instants in ADMIN_TIMEZONE · Role ("Admin · env" badge for ADMIN_EMAILS admins) · ⋯.
 * Empty values show a dash (FR-208).
 */
export function AdminUserTableRow({ row, role, actorId, onRoleChanged }: AdminUserTableRowProps) {
  const t = useTranslations("adminUsers");
  const tHero = useTranslations("hero");
  const format = useFormatter();
  const centred = `${bodyCell} ${centredCell}`;

  return (
    <tr>
      <td className={centred}>{row.shortId}</td>
      <td className={`${bodyCell} wrap-anywhere`}>{row.name || "—"}</td>
      <td className={`${bodyCell} wrap-anywhere`}>{row.email || "—"}</td>
      <td className={centred}>{format.number(row.kudosSent)}</td>
      <td className={centred}>{format.number(row.kudosReceived)}</td>
      <td className={`${centred} text-error`}>{format.number(row.totalHearts)}</td>
      <td className={centred}>{row.level ? tHero(`${row.level}.label`) : "—"}</td>
      <td className={centred}>{format.number(row.badgeCount)}</td>
      <td className={centred}>
        <AdminInstant label={row.sixBadgesAtLabel} />
      </td>
      <td className={centred}>
        <AdminInstant label={row.lastLoginAtLabel} />
      </td>
      <td className={centred}>
        {role === "admin" && row.envAdmin ? <span className={envAdminBadge}>{t("role.envAdmin")}</span> : t(`role.${role}`)}
      </td>
      <td className={actionsCell}>
        <AdminUserRoleMenu user={row} role={role} actorId={actorId} onChanged={(next) => onRoleChanged(row, next)} />
      </td>
    </tr>
  );
}
