import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Same .env* resolution as Next.js (.env.local included outside NODE_ENV=test).
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const databaseUrl = process.env.DATABASE_URL;
// `generate` and `check` only read schema/migration files; every other command needs the DB.
const offline = process.argv.some((arg) => arg === "generate" || arg === "check");
if (!databaseUrl && !offline) {
  throw new Error(
    "DATABASE_URL is not set. Start the local stack (`npx supabase start`) and fill .env.local (see .env.example).",
  );
}

/**
 * drizzle-kit owns the single migration journal (db/migrations). Hand-written SQL (RLS,
 * triggers, storage buckets, realtime) is added with `npm run db:generate -- --custom --name <slug>`
 * so it is ordered in the same journal. supabase/migrations stays empty.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./shared/db/schema/index.ts",
  out: "./db/migrations",
  dbCredentials: { url: databaseUrl ?? "" },
  // Only manage the app schema; auth/storage/realtime belong to Supabase.
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
