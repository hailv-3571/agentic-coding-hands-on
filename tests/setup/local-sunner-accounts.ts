import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { assertLocalSupabaseUrl } from "./assert-local-supabase-url";

/**
 * Sunner accounts on the LOCAL Supabase stack for browser-level checks (Playwright e2e and the
 * production status check in tests/prod). Created with the service role, so the domain hook
 * and profile trigger run, then signed in through the LOCAL-ONLY email+password provider
 * (supabase/config.toml): the @supabase/ssr session cookies land in a CookieJar.
 * Refuses to load unless NEXT_PUBLIC_SUPABASE_URL is localhost / 127.0.0.1 (db W1).
 */
loadEnvConfig(process.cwd());

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (start Supabase, fill .env.local).`);
  return value;
}

const supabaseUrl = assertLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const serviceClient = createClient(supabaseUrl, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const PASSWORD = "e2e-Password-1";

export type TestSunner = { id: string; email: string };
export type CookieJar = Map<string, string>;

/** @supabase/ssr client whose cookie storage is `jar` (what the browser would hold). */
export function cookieClient(jar: CookieJar) {
  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) =>
        cookies.forEach(({ name, value, options }) =>
          value && options.maxAge !== 0 ? jar.set(name, value) : jar.delete(name),
        ),
    },
  });
}

export const cookieHeader = (jar: CookieJar) => [...jar].map(([name, value]) => `${name}=${value}`).join("; ");

export async function createLocalSunner({ onboarded = true, admin = false } = {}): Promise<TestSunner> {
  const email = `e2e-${randomUUID().slice(0, 8)}@sun-asterisk.com`;
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "E2E Sunner" },
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  if (onboarded) {
    const { data: department } = await serviceClient.from("departments").select("id").eq("code", "OPD").single();
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({ department_id: department?.id })
      .eq("id", data.user.id);
    if (updateError) throw updateError;
  }
  if (admin) {
    const { error: roleError } = await serviceClient.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
    if (roleError) throw roleError;
  }
  return { id: data.user.id, email };
}

/** Deletes the auth user (the profile cascades). An already deleted user is fine. */
export async function deleteLocalSunner(id: string): Promise<void> {
  const { error } = await serviceClient.auth.admin.deleteUser(id);
  if (error && error.status !== 404) throw error;
}

/** Password sign-in; returns the session cookies a browser would store. */
export async function signInToCookieJar(sunner: TestSunner): Promise<CookieJar> {
  const jar: CookieJar = new Map();
  const { error } = await cookieClient(jar).auth.signInWithPassword({ email: sunner.email, password: PASSWORD });
  if (error) throw error;
  return jar;
}

/** Ends the session held in `jar` on the Auth server (what the logout action does). */
export async function revokeCookieJarSession(jar: CookieJar): Promise<void> {
  const { error } = await cookieClient(jar).auth.signOut({ scope: "local" });
  if (error) throw error;
}
