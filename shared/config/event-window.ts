import "server-only";
import { env } from "./env";

/**
 * Single source for "can users still write Kudos / hearts / open the write window"
 * (phases 04, 06, 10). Writing is open from `LAUNCH_AT` (inclusive) to `EVENT_END_AT`
 * (exclusive). The `LAUNCH_AT` bound backs up the proxy prelaunch gate, which only guards
 * page loads: a Server Action posted to an allowlisted path such as /countdown still lands
 * here (decision 2026-11-22; admins too). `now` is passed in so callers control the clock.
 */
export function isEventWritingOpen(now: Date): boolean {
  const nowMs = now.getTime();
  return nowMs >= env.LAUNCH_AT && nowMs < env.EVENT_END_AT;
}
