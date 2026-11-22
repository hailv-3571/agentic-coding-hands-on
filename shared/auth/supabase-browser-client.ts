import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/shared/config/public-env";

/**
 * Browser Supabase client for private Realtime channels (phase 11 `spotlight`, phase 13
 * `notifications:{userId}`). Pages read data through Route Handlers; this client only joins
 * channels, no table reads. @supabase/ssr reads the same session cookies the session proxy writes
 * (not httpOnly), keeps the access token fresh and is a per-tab singleton, so every channel in the
 * tab shares one socket.
 */
let client: SupabaseClient | null = null;

export function browserSupabase(): SupabaseClient {
  client ??= createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    // The PKCE code exchange belongs to /auth/callback (server); never consume a URL code here.
    auth: { detectSessionInUrl: false },
  });
  return client;
}
