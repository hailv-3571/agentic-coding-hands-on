import "server-only";
import { eq, sql } from "drizzle-orm";
import { onboardingPathWith } from "@/shared/auth/public-paths";
import { safeNextPath } from "@/shared/auth/safe-next-path";
import { env } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { profiles } from "@/shared/db/schema";
import type { LoginErrorCode } from "../login-error-codes";

export type CompleteLoginInput = {
  userId: string;
  /** Email of the freshly exchanged session (Supabase Auth user). */
  email: string | null | undefined;
  /** Raw `next` from the callback URL; sanitized here. */
  next: string | null | undefined;
};

export type CompleteLoginResult =
  | { ok: true; destination: string }
  | { ok: false; code: LoginErrorCode };

/** Exactly one `@`, and the part after it equals the allowed domain (no sub-domains). */
function isAllowedEmail(email: string, domain: string): boolean {
  const at = email.indexOf("@");
  return at > 0 && at === email.lastIndexOf("@") && email.slice(at + 1) === domain;
}

/**
 * Post-exchange login step of /auth/callback (A2: FR-402, BR-005, DEC-001):
 * 1. Defence-in-depth domain re-check of the session email (the DB gate is the hard stop).
 * 2. One UPDATE: `last_login_at = now()` and, for `ADMIN_EMAILS`, `role = 'admin'`. This runs
 *    on EVERY login, so an env-listed admin demoted in the UI is admin again next time
 *    (decision-log 2026-11-15; phase 14 shows "Admin · env" and refuses the demotion).
 * 3. Destination: department picker first (first login), else the safe `next`.
 * DB errors propagate; the caller signs the session out and reports `auth_failed`.
 */
export async function completeLogin({ userId, email, next }: CompleteLoginInput): Promise<CompleteLoginResult> {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  if (!isAllowedEmail(normalizedEmail, env.ALLOWED_EMAIL_DOMAIN)) {
    return { ok: false, code: "domain_not_allowed" };
  }

  const isEnvAdmin = env.ADMIN_EMAILS.includes(normalizedEmail);
  const [profile] = await db
    .update(profiles)
    .set({ lastLoginAt: sql`now()`, ...(isEnvAdmin ? { role: "admin" as const } : {}) })
    .where(eq(profiles.id, userId))
    .returning({ departmentId: profiles.departmentId });
  if (!profile) return { ok: false, code: "auth_failed" };

  const safeNext = safeNextPath(next);
  return { ok: true, destination: profile.departmentId ? safeNext : onboardingPathWith(safeNext) };
}
