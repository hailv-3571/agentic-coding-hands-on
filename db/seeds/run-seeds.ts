import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/shared/db/schema";
import { applyAllSeeds } from "./apply-all-seeds";

/** CLI entry for `npm run db:seed` (also the last step of `npm run db:reset`). */

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set (see .env.example).");
  }
  const client = postgres(databaseUrl, { max: 1, prepare: false, onnotice: () => {} });
  try {
    const report = await applyAllSeeds(drizzle(client, { schema }));
    const summary = Object.entries(report)
      .map(([table, count]) => `${table}=${count}`)
      .join(", ");
    console.log(`Seeds applied: ${summary}`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
