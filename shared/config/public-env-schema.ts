import { z } from "zod";
import { parseOrThrow, type EnvSource } from "./parse-or-throw";

/**
 * Browser-safe environment schema. Kept apart from `env-schema.ts` so a client component
 * importing `public-env.ts` never pulls the server variable names into its bundle.
 */
export const publicShape = {
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
};

export const publicEnvSchema = z.object(publicShape);

export type PublicEnv = z.output<typeof publicEnvSchema>;

export function parsePublicEnv(source: EnvSource): PublicEnv {
  return parseOrThrow(publicEnvSchema, source);
}
