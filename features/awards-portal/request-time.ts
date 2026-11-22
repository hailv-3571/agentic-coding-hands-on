import "server-only";
import { connection } from "next/server";

/**
 * The server's clock for this request (epoch ms), the only "now" the countdowns trust (BR-001).
 * `connection()` first: reading the clock is request-time work under Cache Components, never
 * part of a prerendered shell (same pattern as `isKudoWritingOpen`).
 */
export async function readRequestTimeMs(): Promise<number> {
  await connection();
  return Date.now();
}
