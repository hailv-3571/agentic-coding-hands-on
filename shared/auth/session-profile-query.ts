import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/shared/db/client";
import { profiles, type ProfileRole } from "@/shared/db/schema";

/** The profile fields server code may hand to pages/layouts (no timestamps, no internals). */
export type SessionProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  departmentId: string | null;
  role: ProfileRole;
};

/**
 * Fresh DB read of a profile by auth user id (BR-003: role is never taken from a cookie or
 * JWT claim). Used by the guards, the shell and the session proxy (admin gate; phase 07's
 * prelaunch bypass). React `cache()` makes it ONE read per render pass, shared by
 * requireSunner()/requireAdmin() and getShellUser(); every new request or Server Action call
 * reads again, so a demotion still applies on the next request. Outside a render (proxy,
 * tests) it is a plain call.
 */
export const findSessionProfile = cache(async (userId: string): Promise<SessionProfile | null> => {
  const [row] = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      departmentId: profiles.departmentId,
      role: profiles.role,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row ?? null;
});
