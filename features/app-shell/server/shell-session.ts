import "server-only";
import { cache } from "react";
import { requireAdmin } from "@/shared/auth/admin-guard";
import { getSessionUser } from "@/shared/auth/current-user";
import { signOut } from "@/shared/auth/sign-out-action";
import { findSessionProfile, type SessionProfile } from "@/shared/auth/session-profile-query";
import type { ShellUser, SignOutAction } from "../types";

/**
 * The single seam between the shell and phase 02's session helpers. Layouts and the
 * not-found page read the session only through these functions. Access control itself
 * (guest -> /login, missing department -> onboarding, non-admin -> 403) stays in
 * `requireSunner()` / `requireAdmin()`; this file only shapes what the shell displays.
 */

/** Never the full address: the name crosses to client components and shows in the header. */
const emailLocalPart = (email: string) => email.split("@", 1)[0] ?? "";

function toShellUser(profile: SessionProfile): ShellUser {
  return {
    name: profile.fullName.trim() || emailLocalPart(profile.email),
    avatarUrl: profile.avatarUrl,
    isAdmin: profile.role === "admin",
  };
}

/** Display data of the signed-in user, or null for a guest (also null if the profile row is missing). */
export const getShellUser = cache(async (): Promise<ShellUser | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const profile = await findSessionProfile(user.userId);
  return profile ? toShellUser(profile) : null;
});

/** Sign-out server action for the account menu. */
export function getShellSignOutAction(): SignOutAction {
  return signOut;
}

/** Admin layout guard. Must run before any admin markup is produced. */
export async function requireShellAdmin(): Promise<ShellUser> {
  const { profile } = await requireAdmin();
  return toShellUser(profile);
}
