import "server-only";
import { connection } from "next/server";
import { isEventWritingOpen } from "@/shared/config/event-window";

/**
 * Whether Kudos can still be written or edited right now (decision-log: closed from
 * `EVENT_END_AT`). Server components pass it to `KudoComposerLauncher`; the actions re-check
 * on every call. `connection()` first: reading the clock is request-time work under Cache
 * Components, never part of a prerendered shell.
 */
export async function isKudoWritingOpen(): Promise<boolean> {
  await connection();
  return isEventWritingOpen(new Date());
}
