"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/auth/supabase-server-client";
import { AUTH_CALLBACK_PATH, HOME_PATH } from "@/shared/auth/public-paths";
import { safeNextPath } from "@/shared/auth/safe-next-path";
import { env } from "@/shared/config/env";
import type { LoginErrorCode } from "../login-error-codes";

export type SignInWithGoogleState = { error: LoginErrorCode | null };

/** Origin of the current request: the browser's Origin header on Server Action POSTs. */
async function requestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

/**
 * LoginAction#signInWithGoogle (A1, FR-201/203). Starts Supabase's PKCE OAuth flow: the code
 * verifier goes into a cookie, the browser is redirected to Google. `hd` only narrows Google's
 * account chooser (UX); the real domain gate runs in the database (BR-001). Supabase Auth
 * also checks `redirectTo` against its allow-list, so a spoofed Host cannot steer the code.
 */
export async function signInWithGoogle(
  _previous: SignInWithGoogleState,
  formData: FormData,
): Promise<SignInWithGoogleState> {
  const rawNext = formData.get("next");
  const next = safeNextPath(typeof rawNext === "string" ? rawNext : null);
  const redirectTo = new URL(AUTH_CALLBACK_PATH, await requestOrigin());
  if (next !== HOME_PATH) redirectTo.searchParams.set("next", next);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: { hd: env.ALLOWED_EMAIL_DOMAIN },
    },
  });
  if (error || !data.url) {
    console.error("[auth] could not start Google sign-in", error);
    return { error: "auth_failed" };
  }
  redirect(data.url);
}
