import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import { assertLocalSupabaseUrl } from "../../setup/assert-local-supabase-url";
import { testSql } from "../../setup/integration-db";

/**
 * Auth fixtures for integration tests on the local Supabase stack. Users are created through
 * the real Auth admin API (so the auth.users triggers and the before_user_created hook run)
 * and signed in with the LOCAL-ONLY email+password provider (supabase/config.toml).
 * Refuses to load unless NEXT_PUBLIC_SUPABASE_URL is localhost / 127.0.0.1 (db W1).
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (start Supabase, fill .env.local).`);
  return value;
}

const supabaseUrl = assertLocalSupabaseUrl(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const noPersistence = { auth: { persistSession: false, autoRefreshToken: false } };

export const TEST_PASSWORD = "integration-Password-1";

export const adminAuth = createClient(supabaseUrl, serviceRoleKey, noPersistence).auth.admin;

export function createAnonClient() {
  return createClient(supabaseUrl, anonKey, noPersistence);
}

export function uniqueEmail(prefix: string, domain = "sun-asterisk.com"): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@${domain}`;
}

export async function createAuthUser(email: string, metadata: Record<string, unknown> = {}): Promise<User> {
  const { data, error } = await adminAuth.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user) throw error ?? new Error(`createUser returned no user for ${email}`);
  return data.user;
}

/** Deletes auth users (profiles cascade). Ignores ids that are already gone. */
export async function deleteAuthUsers(ids: Iterable<string>): Promise<void> {
  for (const id of ids) {
    const { error } = await adminAuth.deleteUser(id);
    if (error && error.status !== 404) throw error;
  }
}

/** Creates a user for a fixed address (e.g. an ADMIN_EMAILS entry), replacing a leftover one. */
export async function recreateAuthUser(email: string, metadata: Record<string, unknown> = {}): Promise<User> {
  const leftovers = await testSql<{ id: string }[]>`select id from auth.users where lower(email) = lower(${email})`;
  await deleteAuthUsers(leftovers.map((row) => row.id));
  return createAuthUser(email, metadata);
}

/** Closes the app's own pool (shared/db/client) used by the code under test. */
export async function closeAppDb(): Promise<void> {
  const { db } = await import("@/shared/db/client");
  // Drizzle keeps the postgres-js client on `$client`; it is not part of the exported `Db` type.
  const { $client } = db as unknown as { $client: { end(options: { timeout: number }): Promise<void> } };
  await $client.end({ timeout: 5 });
}

/** Id of a seeded department (phase 01 seeds), by code. */
export async function departmentIdByCode(code: string): Promise<string> {
  const [row] = await testSql<{ id: string }[]>`select id from public.departments where code = ${code}`;
  if (!row) throw new Error(`department ${code} is not seeded (run npm run db:reset)`);
  return row.id;
}

type StoredCookie = { name: string; value: string };

/**
 * In-memory stand-in for Next's `cookies()` store, holding real `@supabase/ssr` session
 * cookies. Implements the subset the app's server client uses (`getAll`, `set`).
 */
export class TestCookieJar {
  private readonly cookies = new Map<string, string>();

  getAll(): StoredCookie[] {
    return [...this.cookies].map(([name, value]) => ({ name, value }));
  }

  set(name: string, value: string, options?: { maxAge?: number }): void {
    if (!value || options?.maxAge === 0) this.cookies.delete(name);
    else this.cookies.set(name, value);
  }

  clear(): void {
    this.cookies.clear();
  }
}

function jarClient(jar: TestCookieJar) {
  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  });
}

/** Signs `email` in with the test password and stores the SSR session cookies in `jar`. */
export async function signInToJar(jar: TestCookieJar, email: string): Promise<void> {
  const { error } = await jarClient(jar).auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (error) throw error;
}

/** Signs the jar's session out on the Auth server (as another tab/device would) but leaves the jar's cookies. */
export async function revokeSessionOf(jar: TestCookieJar): Promise<void> {
  const copy = new TestCookieJar();
  for (const { name, value } of jar.getAll()) copy.set(name, value);
  const { error } = await jarClient(copy).auth.signOut({ scope: "local" });
  if (error) throw error;
}

/** Access token of a fresh password sign-in, for raw supabase-js calls as `authenticated`. */
export async function accessTokenFor(email: string): Promise<string> {
  const { data, error } = await createAnonClient().auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (error || !data.session) throw error ?? new Error(`no session for ${email}`);
  return data.session.access_token;
}

/** Location of a `redirect()` thrown by next/navigation (digest `NEXT_REDIRECT;type;url;status;`). */
export function redirectLocationOf(error: unknown): string | null {
  const digest = (error as { digest?: unknown } | null)?.digest;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT;")) return null;
  return digest.split(";").slice(2, -2).join(";");
}

/** HTTP status of an auth interrupt (`forbidden()` → 403, `unauthorized()` → 401), else null. */
export function authInterruptStatusOf(error: unknown): number | null {
  const digest = (error as { digest?: unknown } | null)?.digest;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;")) return null;
  return Number(digest.split(";")[1]);
}
