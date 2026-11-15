import "server-only";
import { redirect, unauthorized } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { LOGIN_PATH, ONBOARDING_DEPARTMENT_PATH } from "./public-paths";
import { findSessionProfile, type SessionProfile } from "./session-profile-query";
import { createSupabaseServerClient } from "./supabase-server-client";

export type SessionUser = { userId: string; email: string | null };
export type SunnerContext = { userId: string; profile: SessionProfile };

/**
 * The verified signed-in user, or null. `getUser()` asks Supabase Auth (never trusts the raw
 * cookie), so a revoked session is rejected immediately — same check as the session proxy.
 * Memoized per render pass; Server Actions and Route Handlers re-run it on every call.
 * Auth-server failures fail closed (treated as signed out).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Session checks run per real request only: stop prerendering (including Partial
  // Prefetching's cookie-aware shell) before supabase-js reads the clock for token expiry.
  await connection();
  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { userId: data.user.id, email: data.user.email ?? null };
  } catch (error) {
    console.error("[auth] session verification failed", error);
    return null;
  }
});

const getSunnerContext = cache(async (): Promise<SunnerContext | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const profile = await findSessionProfile(user.userId);
  // A session without a profile cannot come from /auth/callback (it signs such users out);
  // answer 401 instead of redirecting, which would loop through the proxy's /login → / rule.
  if (!profile) unauthorized();
  return { userId: user.userId, profile };
});

/**
 * Gate for every Sunner page, layout and action (phase 03 `(app)` layout, phases 04+).
 * No session → /login. No department yet → the first-login picker, so the onboarding
 * redirect costs no DB read in the proxy.
 */
export async function requireSunner(): Promise<SunnerContext> {
  const context = await getSunnerContext();
  if (!context) redirect(LOGIN_PATH);
  if (!context.profile.departmentId) redirect(ONBOARDING_DEPARTMENT_PATH);
  return context;
}
