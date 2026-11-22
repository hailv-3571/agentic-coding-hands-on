import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/shared/config/env";

/**
 * Guard of the internal drain endpoint (no browser path can drain): pg_cron via pg_net (secret read
 * from Vault) or a host cron sends OUTBOX_DRAIN_SECRET in `x-drain-secret`. Both values are SHA-256
 * hashed before `timingSafeEqual`, so the comparison takes the same time whatever the length or the
 * first differing byte (same scheme as phase 10's tick guard). Unset secret → not configured.
 */
export const OUTBOX_DRAIN_SECRET_HEADER = "x-drain-secret";

export type OutboxDrainAccess = "granted" | "not_configured" | "unauthorized";

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

export function checkOutboxDrainSecret(provided: string | null): OutboxDrainAccess {
  const expected = env.OUTBOX_DRAIN_SECRET;
  if (!expected) return "not_configured";
  if (!provided) return "unauthorized";
  return timingSafeEqual(digest(provided), digest(expected)) ? "granted" : "unauthorized";
}
