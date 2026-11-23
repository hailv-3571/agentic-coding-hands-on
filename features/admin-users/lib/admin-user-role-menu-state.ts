import type { AdminUserRole, AdminUserRow, SetUserRoleResult } from "../schemas/admin-user-views";

/**
 * What the row's "⋯" menu offers (DEC-001), from the role on screen:
 * - `promote`: "Set as Admin" on a User row;
 * - `demote`: "Set as User" on another Admin's row;
 * - `env-locked`: "Set as User" shown disabled with a tooltip on an `ADMIN_EMAILS` admin (the server
 *   answers 409 ENV_ADMIN and login would promote them again);
 * - `self`: the actor's own row offers nothing — demoting yourself is refused (403 SELF_DEMOTE).
 */
export type RoleMenuState =
  | { kind: "promote"; target: AdminUserRole }
  | { kind: "demote"; target: AdminUserRole }
  | { kind: "env-locked"; target: AdminUserRole }
  | { kind: "self" };

export function roleMenuState(row: Pick<AdminUserRow, "id" | "role" | "envAdmin">, actorId: string): RoleMenuState {
  if (row.id === actorId) return { kind: "self" };
  if (row.role === "user") return { kind: "promote", target: "admin" };
  if (row.envAdmin) return { kind: "env-locked", target: "user" };
  return { kind: "demote", target: "user" };
}

type RoleFailure = Extract<SetUserRoleResult, { ok: false }>["error"];

/** `adminUsers.roleErrors.*` key of the inline copy for a refused role change (spec § 6). */
export type RoleErrorKey = "selfDemote" | "lastAdmin" | "envAdmin" | "forbidden" | "notFound" | "failed";

const ROLE_ERROR_KEYS: Record<RoleFailure, RoleErrorKey> = {
  SELF_DEMOTE: "selfDemote",
  LAST_ADMIN: "lastAdmin",
  ENV_ADMIN: "envAdmin",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "notFound",
  INVALID: "failed",
  UNEXPECTED: "failed",
};

export function roleErrorKey(error: RoleFailure): RoleErrorKey {
  return ROLE_ERROR_KEYS[error] ?? "failed";
}
