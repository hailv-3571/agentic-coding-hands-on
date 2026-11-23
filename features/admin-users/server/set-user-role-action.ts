"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/shared/auth/admin-guard";
import { ADMIN_ROUTES } from "@/shared/ui/app-routes";
import type { SetUserRoleResult } from "../schemas/admin-user-views";
import { setUserRoleInputSchema, type SetUserRoleInput } from "../schemas/set-user-role-input-schema";
import { UserRoleService } from "./user-role-service";

/**
 * "Set as Admin" / "Set as User" Server Action (F014 A3, DEC-001; the UI confirms first, D007).
 * Untrusted POST entry point: `requireAdmin()` runs FIRST like every admin action (guest → /login,
 * non-admin → 403 `forbidden()`; the admin layout does not protect actions). The actor comes from the
 * session only. Guard refusals are in-band codes (NOT_FOUND, SELF_DEMOTE, LAST_ADMIN, ENV_ADMIN,
 * FORBIDDEN = demoted meanwhile); `/admin/users` is refreshed after every service answer so the row
 * shows the current role in the same round trip.
 */
export async function setUserRoleAction(input: SetUserRoleInput): Promise<SetUserRoleResult> {
  const { userId: actorId } = await requireAdmin();
  const parsed = setUserRoleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };

  try {
    const result = await UserRoleService.setRole({ actorId, ...parsed.data });
    revalidatePath(ADMIN_ROUTES.users);
    return result;
  } catch (error) {
    console.error("[admin-users] role change failed", error);
    return { ok: false, error: "UNEXPECTED" };
  }
}
