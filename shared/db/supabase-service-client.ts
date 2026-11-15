import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/shared/config/env";

/**
 * Service-role Supabase client for trusted server work only (Storage signed URLs, Auth
 * admin calls). It bypasses RLS — never expose it, its key, or its raw results to clients.
 * User-session clients (cookies via @supabase/ssr) are created in phase 02.
 */
let serviceClient: SupabaseClient | undefined;

export function getSupabaseServiceClient(): SupabaseClient {
  serviceClient ??= createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return serviceClient;
}
