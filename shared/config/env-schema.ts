import { z } from "zod";
import { parseOrThrow, type EnvSource } from "./parse-or-throw";
import { publicShape } from "./public-env-schema";

/**
 * Pure server environment schema (no `process.env` access) so it can be unit-tested and
 * reused by `env.ts` (server) and `next.config.ts` (boot check). The browser-safe subset
 * lives in `public-env-schema.ts`.
 */

/** `.env` files yield "" for `KEY=`; treat that as unset so defaults apply. */
const unsetIfEmpty = (value: unknown) => (value === "" ? undefined : value);

const withDefault = <T extends z.ZodType>(schema: T) =>
  z.preprocess(unsetIfEmpty, schema);

/**
 * Milestones are exposed as epoch milliseconds, not `Date`: `Object.freeze` is shallow, so a
 * shared `Date` could be mutated process-wide (`setHours`) and corrupt the event window.
 */
const isoInstant = z.iso
  .datetime({ offset: true, message: "Expected ISO-8601 with offset, e.g. 2026-11-01T00:00:00+07:00" })
  .transform((value) => Date.parse(value));

const isIanaTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const emailList = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(z.array(z.email()).min(1, "At least one admin email is required"))
  .transform((emails) => Object.freeze(emails));

/** `scheme://host[:port]` only (a trailing `/` is fine), normalized to `URL.origin`. */
const httpOrigin = z
  .url({ protocol: /^https?$/, message: "Expected an http(s) origin, e.g. http://127.0.0.1:3000" })
  .refine((value) => {
    const url = new URL(value);
    return url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
  }, "Expected an origin only (scheme://host:port), without path, query or credentials")
  .transform((value) => new URL(value).origin);

const serverShape = {
  ...publicShape,
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, message: "Expected a postgres:// connection URL" }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  LAUNCH_AT: isoInstant,
  EVENT_AT: isoInstant,
  EVENT_END_AT: isoInstant,
  NATIONAL_KUDOS_FINALIZE_AT: isoInstant,
  ADMIN_EMAILS: emailList,
  ALLOWED_EMAIL_DOMAIN: withDefault(
    z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^([a-z0-9-]+\.)+[a-z]{2,}$/, "Expected a bare domain, e.g. sun-asterisk.com")
      .default("sun-asterisk.com"),
  ),
  HEART_CAMPAIGN_MULTIPLIER: withDefault(z.coerce.number().int().min(2).default(2)),
  SECRET_BOX_HEARTS_PER_BOX: withDefault(z.coerce.number().int().min(1).default(5)),
  ADMIN_TIMEZONE: withDefault(
    z.string().refine(isIanaTimeZone, "Unknown IANA time zone").default("Asia/Ho_Chi_Minh"),
  ),
  EXPORT_MAX_ROWS: withDefault(z.coerce.number().int().min(1).default(10000)),
  // Where the server reaches its own pages (the proxy's 403 view). Unset: http://127.0.0.1:$PORT.
  INTERNAL_APP_ORIGIN: withDefault(httpOrigin.optional()),
  // Shared secret of POST /api/internal/secret-box/tick (pg_cron reads it from Vault). Optional so a
  // missing key never blocks boot: unset, the tick answers 503 `not_configured` (phase 10).
  INTERNAL_JOB_SECRET: withDefault(z.string().min(32, "Expected at least 32 characters").optional()),
};

/** Run a cross-field check only when the fields it compares parsed cleanly. */
const whenValid =
  (...fields: string[]) =>
  (payload: z.core.ParsePayload) =>
    !payload.issues.some((issue) => fields.includes(String(issue.path?.[0])));

export const serverEnvSchema = z
  .object(serverShape)
  .refine((env) => env.LAUNCH_AT < env.EVENT_END_AT, {
    path: ["EVENT_END_AT"],
    message: "EVENT_END_AT must be after LAUNCH_AT",
    when: whenValid("LAUNCH_AT", "EVENT_END_AT"),
  })
  .refine((env) => env.EVENT_END_AT <= env.NATIONAL_KUDOS_FINALIZE_AT, {
    path: ["NATIONAL_KUDOS_FINALIZE_AT"],
    message: "NATIONAL_KUDOS_FINALIZE_AT must not be before EVENT_END_AT",
    when: whenValid("EVENT_END_AT", "NATIONAL_KUDOS_FINALIZE_AT"),
  });

export type ServerEnv = z.output<typeof serverEnvSchema>;

export function parseServerEnv(source: EnvSource): ServerEnv {
  return parseOrThrow(serverEnvSchema, source);
}
