import type { AdminKudoStatus } from "./admin-kudo-row";

/**
 * Result of the `markKudoSpam` / `unSpamKudo` server actions. `changed: false` means the Kudo was
 * already in the target state (e.g. another admin got there first): the row should show the
 * returned status and a "updated by another admin" notice. Client-safe: types only.
 */
export type KudoModerationResult =
  | { ok: true; status: AdminKudoStatus; changed: boolean }
  | { ok: false; code: "not_found" | "invalid" | "unexpected" };
