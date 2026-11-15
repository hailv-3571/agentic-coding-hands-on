import { NextResponse, type NextRequest } from "next/server";
import { loginErrorFromOAuth, type LoginErrorCode } from "@/features/auth/login-error-codes";
import { completeLogin } from "@/features/auth/server/complete-login";
import { loginPathWith } from "@/shared/auth/public-paths";
import { safeNextPath } from "@/shared/auth/safe-next-path";
import { createSupabaseServerClient } from "@/shared/auth/supabase-server-client";

/**
 * AuthCallbackRoute#GET (A2). Supabase redirects here after Google with either `code`
 * (PKCE) or `error`/`error_description` (e.g. the domain hook's `domain_not_allowed`).
 * Success → department picker or the safe `next`; any failure → /login?error=<code>, with
 * the half-open session signed out so nobody keeps a session that failed a check.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get("next"));
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const toLogin = (error: LoginErrorCode) => redirectTo(loginPathWith({ next, error }));

  const code = params.get("code");
  if (!code) return toLogin(loginErrorFromOAuth(params.get("error_description")));

  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      console.error("[auth] code exchange failed", error);
      return toLogin("auth_failed");
    }
    const result = await completeLogin({ userId: data.user.id, email: data.user.email, next });
    if (result.ok) return redirectTo(result.destination);
    await supabase.auth.signOut({ scope: "local" });
    return toLogin(result.code);
  } catch (error) {
    console.error("[auth] completing login failed", error);
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return toLogin("auth_failed");
  }
}
