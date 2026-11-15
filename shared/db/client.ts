import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/config/env";
import * as schema from "./schema";

/**
 * Drizzle over postgres-js, connected as a server role: it BYPASSES RLS. RLS is only
 * defence-in-depth (C-20); every authorization check lives in server code.
 */
export type Db = PostgresJsDatabase<typeof schema>;
/** Transaction handle passed to `db.transaction(async (tx) => …)` callbacks. */
export type DbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Pool limits sized for Supabase pooler connection caps; failures surface fast, not hang. */
const POOL_MAX = 10;
const IDLE_TIMEOUT_SECONDS = 20;
const CONNECT_TIMEOUT_SECONDS = 10;

function createDb(): Db {
  const client = postgres(env.DATABASE_URL, {
    // Supabase's transaction pooler (port 6543) does not support prepared statements.
    prepare: false,
    max: POOL_MAX,
    idle_timeout: IDLE_TIMEOUT_SECONDS,
    connect_timeout: CONNECT_TIMEOUT_SECONDS,
  });
  return drizzle(client, { schema });
}

// One pool per process: cached on globalThis so dev HMR reloads and separate server
// bundles (route handlers vs pages) in production share it instead of each opening a pool.
const globalForDb = globalThis as typeof globalThis & { __saaDb?: Db };

export const db: Db = (globalForDb.__saaDb ??= createDb());
