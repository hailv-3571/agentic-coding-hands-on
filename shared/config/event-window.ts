import "server-only";
import { env } from "./env";

/**
 * Single source for "can users still write Kudos / hearts / open the write window"
 * (phases 04, 06, 10). Writing closes at `EVENT_END_AT` (exclusive).
 * `now` is passed in so callers control the clock (request time, tests).
 */
export function isEventWritingOpen(now: Date): boolean {
  return now.getTime() < env.EVENT_END_AT;
}
