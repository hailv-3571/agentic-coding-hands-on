import { TransactionRollbackError } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Db, DbTx } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";

/**
 * Integration-test database handle for the local Supabase stack (`npx supabase start`).
 * Same driver + schema as shared/db/client.ts, without the app env (tests only need
 * DATABASE_URL, loaded from .env.local by vitest.config.mts).
 */

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set: run `npx supabase start`, fill .env.local (see .env.example), then `npm run db:reset`.",
  );
}

export const testSql = postgres(databaseUrl, {
  max: 3,
  prepare: false,
  onnotice: () => {},
});

export const testDb: Db = drizzle(testSql, { schema });

/** Runs `fn` inside a transaction that is always rolled back, so tests leave no rows. */
export async function withRollback<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
  let result: { value: T } | undefined;
  try {
    await testDb.transaction(async (tx) => {
      result = { value: await fn(tx) };
      tx.rollback();
    });
  } catch (error) {
    if (!(error instanceof TransactionRollbackError)) throw error;
  }
  if (!result) throw new Error("withRollback: callback did not complete");
  return result.value;
}

export async function closeTestDb(): Promise<void> {
  await testSql.end({ timeout: 5 });
}
