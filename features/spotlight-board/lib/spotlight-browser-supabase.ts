import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/shared/config/public-env";

/**
 * Browser Supabase client for the Spotlight Realtime channel (INT-001). `shared/` has no browser
 * session client yet (pages talk to Route Handlers), so this one lives with its only consumer.
 * @supabase/ssr reads the same session cookies the session proxy writes (not httpOnly), keeps the
 * access token fresh and is a per-tab singleton. It only joins the channel; no table reads.
 */
let client: SupabaseClient | null = null;

export function spotlightBrowserSupabase(): SupabaseClient {
  client ??= createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    // The PKCE code exchange belongs to /auth/callback (server); never consume a URL code here.
    auth: { detectSessionInUrl: false },
  });
  return client;
}
