import { requireSecretBoxUser, secretBoxError, secretBoxJson } from "@/features/secret-box-rewards/server/secret-box-api-session";
import { SecretBoxQuery } from "@/features/secret-box-rewards/server/secret-box-query";

/**
 * GET /api/secret-boxes/me — the open-box modal's state (A3, FR-301/303): 200 `SecretBoxScreenState`
 * `{ unopened }` after a reconcile (a box earned since the last visit is openable now). 401
 * `unauthorized` · 500 `unexpected`. `Cache-Control: private, no-store`.
 */
export async function GET() {
  const userId = await requireSecretBoxUser();
  if (userId instanceof Response) return userId;
  try {
    return secretBoxJson(await SecretBoxQuery.openScreenState(userId));
  } catch (error) {
    console.error("[secret-box] loading the open-box state failed", error);
    return secretBoxError(500, "unexpected");
  }
}
