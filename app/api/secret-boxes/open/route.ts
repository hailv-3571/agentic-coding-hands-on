import type { NextRequest } from "next/server";
import { IDEMPOTENCY_KEY_HEADER, parseIdempotencyKey } from "@/features/secret-box-rewards/schemas/open-secret-box-schemas";
import { requireSecretBoxUser, secretBoxError, secretBoxJson } from "@/features/secret-box-rewards/server/secret-box-api-session";
import { NoBoxLeftError, SecretBoxOpenService } from "@/features/secret-box-rewards/server/secret-box-open-service";

/**
 * POST /api/secret-boxes/open (A2, FR-402, FR-602) — header `Idempotency-Key: <uuid v4>`, no body
 * (anything sent is ignored: the box owner is the session user). 200 `OpenSecretBoxResult` (the same
 * stored result with `replayed: true` when the key was already processed) · 401 `unauthorized` (before
 * any DB read) · 400 `invalid_idempotency_key` · 409 `no_box_left` · 500 `unexpected`.
 * `Cache-Control: private, no-store`.
 */
export async function POST(request: NextRequest) {
  const userId = await requireSecretBoxUser();
  if (userId instanceof Response) return userId;
  const key = parseIdempotencyKey(request.headers.get(IDEMPOTENCY_KEY_HEADER));
  if (!key) return secretBoxError(400, "invalid_idempotency_key");
  try {
    return secretBoxJson(await SecretBoxOpenService.openNext(userId, key));
  } catch (error) {
    if (error instanceof NoBoxLeftError) return secretBoxError(409, "no_box_left");
    console.error("[secret-box] opening a box failed", error);
    return secretBoxError(500, "unexpected");
  }
}
