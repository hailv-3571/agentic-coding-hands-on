/**
 * Login error codes shown on the login screen (`/login?error=<code>`), shared by the OAuth
 * callback (server) and the login page/form (client). Pure module, no server imports.
 */
export const LOGIN_ERROR_CODES = ["domain_not_allowed", "auth_failed"] as const;

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];

/**
 * Message raised by the `before_user_created` auth hook (db/migrations/0005_auth_user_triggers.sql).
 * Supabase Auth forwards it verbatim as `error_description` on the OAuth redirect; any other
 * failure (user cancelled, generic DB error, Google error) is a plain `auth_failed`.
 */
const DOMAIN_REJECTION_MESSAGE = "domain_not_allowed";

export function loginErrorFromOAuth(errorDescription: string | null): LoginErrorCode {
  return errorDescription === DOMAIN_REJECTION_MESSAGE ? "domain_not_allowed" : "auth_failed";
}

export function parseLoginErrorCode(raw: unknown): LoginErrorCode | null {
  return typeof raw === "string" && (LOGIN_ERROR_CODES as readonly string[]).includes(raw)
    ? (raw as LoginErrorCode)
    : null;
}
