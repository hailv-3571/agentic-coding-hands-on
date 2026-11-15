import "server-only";
import { parseServerEnv, type ServerEnv } from "./env-schema";

/**
 * Server environment, parsed once per server process and frozen.
 * Importing this module with a missing/invalid variable throws a readable Zod error.
 * `next.config.ts` runs the same schema at boot so `next dev|build|start` fail fast.
 */
export const env: Readonly<ServerEnv> = Object.freeze(parseServerEnv(process.env));
