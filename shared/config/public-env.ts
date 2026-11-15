import { parsePublicEnv, type PublicEnv } from "./public-env-schema";

/**
 * Browser-safe environment: only `NEXT_PUBLIC_*` values.
 * Each variable is referenced literally so Next.js can inline it into client bundles.
 */
export const publicEnv: Readonly<PublicEnv> = Object.freeze(
  parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }),
);
