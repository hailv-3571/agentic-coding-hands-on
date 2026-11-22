import type { NextRequest } from "next/server";
import { NotificationEventProcessor } from "@/features/notifications/server/notification-event-processor";
import { checkOutboxDrainSecret, OUTBOX_DRAIN_SECRET_HEADER } from "@/features/notifications/server/outbox-drain-guard";

/**
 * POST /api/internal/notifications/drain — called every 5 s by pg_cron (db/migrations/*_notifications_drain_cron.sql)
 * or a host cron; no session (exact public path in the proxy), guarded by the `x-drain-secret` header.
 * 503 `not_configured` while OUTBOX_DRAIN_SECRET is unset · 401 `unauthorized` · 200
 * `{ processed, malformed, retrying, failed }` for one drain run · 500 `unexpected` when the run could
 * not start. Drains are idempotent and safe to overlap, so retried or concurrent calls are harmless.
 */
const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

export async function POST(request: NextRequest) {
  const access = checkOutboxDrainSecret(request.headers.get(OUTBOX_DRAIN_SECRET_HEADER));
  if (access === "not_configured") return json({ code: "not_configured" }, 503);
  if (access === "unauthorized") return json({ code: "unauthorized" }, 401);

  try {
    return json(await NotificationEventProcessor.drain());
  } catch (error) {
    console.error("[notifications] drain could not run", error);
    return json({ code: "unexpected" }, 500);
  }
}
