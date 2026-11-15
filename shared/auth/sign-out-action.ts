"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH } from "./public-paths";
import { createSupabaseServerClient } from "./supabase-server-client";

/** Returned only on failure; success redirects (throws) to /login. */
export type SignOutResult = { ok: false };

/**
 * LogoutAction#signOut (A6, FR-403): ends this device's session and clears the auth cookies,
 * then redirects to /login. An already-expired session still counts as signed out
 * (supabase-js ignores 401/403/404 from /logout). A real failure (Auth unreachable) returns
 * `{ ok: false }` so the account menu (phase 03) can stay put and show a toast.
 */
export async function signOut(): Promise<SignOutResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    console.error("[auth] sign-out failed", error);
    return { ok: false };
  }
  redirect(LOGIN_PATH);
}
