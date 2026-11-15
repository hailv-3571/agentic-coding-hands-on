import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/shared/config/public-env";

/**
 * Per-request Supabase client bound to the request cookies (Server Components, Server
 * Actions, Route Handlers). Create a new one for every request; never share it.
 * Uses the public anon key, so it only does what the signed-in user may do (RLS, C-20).
 * The proxy uses its own request/response cookie adapter (session-proxy.ts).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot write cookies. The session proxy already refreshed the
          // session for this request and will write any rotated tokens on the next one.
        }
      },
    },
  });
}
