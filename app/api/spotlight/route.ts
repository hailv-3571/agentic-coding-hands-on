import { SpotlightSnapshotQuery } from "@/features/spotlight-board/server/spotlight-snapshot-query";
import { getSessionUser } from "@/shared/auth/current-user";

/**
 * GET /api/spotlight — the Spotlight Board snapshot (A1, C-18): 200 `SpotlightSnapshot`
 * `{ total, names, recent }` (public kudos only, no sender data). The region calls it on retry and
 * on every Realtime (re)subscribe, then replaces its state. 401 `{ code: "unauthorized" }` before
 * any DB read · 500 `{ code: "unexpected" }` (no detail). `Cache-Control: private, no-store`: the
 * session check (cookies + connection()) already makes the handler request-time, and no layer may
 * keep a copy after a Mark Spam.
 */
const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ code: "unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE });
  try {
    return Response.json(await SpotlightSnapshotQuery.load(), { headers: PRIVATE_NO_STORE });
  } catch (error) {
    console.error("[spotlight-board] GET /api/spotlight failed", error);
    return Response.json({ code: "unexpected" }, { status: 500, headers: PRIVATE_NO_STORE });
  }
}
