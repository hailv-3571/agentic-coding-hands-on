import type { NextRequest } from "next/server";
import { checkInternalJobSecret, INTERNAL_JOB_SECRET_HEADER } from "@/features/secret-box-rewards/server/internal-job-guard";
import { SecretBoxTickJob } from "@/features/secret-box-rewards/server/secret-box-tick-job";

/**
 * POST /api/internal/secret-box/tick — called every minute by pg_cron (db/migrations/*_secret_box_tick_cron.sql)
 * or a host cron; no session (public path in the proxy), guarded by the `x-job-secret` header.
 * 503 `not_configured` while INTERNAL_JOB_SECRET is unset · 401 `unauthorized` · 200 `{ skipped: true }`
 * while another tick still runs · 200 `{ sweep: {senders, granted, failed, deferred}, nationalKudos:
 * {status, count} }` · 500 `unexpected` when a job failed (the other still ran) or the tick could not
 * start. Both jobs are idempotent, so retried ticks are safe.
 */
const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

export async function POST(request: NextRequest) {
  const access = checkInternalJobSecret(request.headers.get(INTERNAL_JOB_SECRET_HEADER));
  if (access === "not_configured") return json({ code: "not_configured" }, 503);
  if (access === "unauthorized") return json({ code: "unauthorized" }, 401);

  try {
    const outcome = await SecretBoxTickJob.run(new Date());
    if (outcome.skipped) return json({ skipped: true });
    if (!outcome.sweep || !outcome.nationalKudos) return json({ code: "unexpected" }, 500);
    return json({ sweep: outcome.sweep, nationalKudos: outcome.nationalKudos });
  } catch (error) {
    console.error("[secret-box] tick could not run", error);
    return json({ code: "unexpected" }, 500);
  }
}
