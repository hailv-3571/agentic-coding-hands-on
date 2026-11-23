import "server-only";
import { env } from "@/shared/config/env";

/**
 * True for an `ADMIN_EMAILS` account. Phase 02's login step promotes these on EVERY login, so a UI
 * demotion would silently revert: the table shows "Admin · env" and the role service answers
 * 409 ENV_ADMIN. Same normalization as `completeLogin` (trim + lower case; the env list is lower case).
 */
export function isEnvAdminEmail(email: string): boolean {
  return env.ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
