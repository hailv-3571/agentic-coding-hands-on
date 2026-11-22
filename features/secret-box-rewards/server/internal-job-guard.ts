import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/shared/config/env";

/**
 * Guard of the internal job endpoint (FR-603: no browser path can trigger the tick). The caller
 * (pg_cron via pg_net, secret read from Vault; or a host cron) sends INTERNAL_JOB_SECRET in the
 * `x-job-secret` header. Both values are SHA-256 hashed before `timingSafeEqual`, so the comparison
 * takes the same time whatever the length or the first differing byte. Unset secret → not configured.
 */
export const INTERNAL_JOB_SECRET_HEADER = "x-job-secret";

export type InternalJobAccess = "granted" | "not_configured" | "unauthorized";

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

export function checkInternalJobSecret(provided: string | null): InternalJobAccess {
  const expected = env.INTERNAL_JOB_SECRET;
  if (!expected) return "not_configured";
  if (!provided) return "unauthorized";
  return timingSafeEqual(digest(provided), digest(expected)) ? "granted" : "unauthorized";
}
