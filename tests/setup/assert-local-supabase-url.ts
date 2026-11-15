/**
 * Guard for test fixtures that use the LOCAL-ONLY email+password provider and the service
 * role (db W1): they must never run against a hosted Supabase project. Returns the URL when
 * its host is exactly `localhost` or `127.0.0.1`, otherwise throws.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null; // not a URL at all: refused below like any non-local host
  }
}

export function assertLocalSupabaseUrl(url: string | undefined): string {
  const hostname = url ? hostnameOf(url) : null;
  if (!url || !hostname || !LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `Test fixtures only run against a local Supabase stack (localhost / 127.0.0.1); got ${url ?? "no NEXT_PUBLIC_SUPABASE_URL"}.`,
    );
  }
  return url;
}
