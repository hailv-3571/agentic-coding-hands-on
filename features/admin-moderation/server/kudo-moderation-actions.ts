"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/shared/auth/admin-guard";
import type { KudoStatus } from "@/shared/db/schema";
import { ADMIN_ROUTES } from "@/shared/ui/app-routes";
import type { KudoModerationResult } from "../schemas/kudo-moderation-result";
import { KudoModerationService, type KudoTransitionResult } from "./kudo-moderation-service";

/**
 * Mark Spam / Un Spam Server Actions (A2/A3, D004: the popover click is the confirmation, no reason).
 * Untrusted POST entry points: `requireAdmin()` runs FIRST, like every admin action (guest → /login,
 * non-admin → 403 `forbidden()`; the admin layout does not protect actions). The acting admin comes
 * from the session only. Expected outcomes are in-band results; `/admin/review` is refreshed whenever
 * the DB was read (changed, already in the target state, or gone), so the table re-renders in the
 * same round trip.
 */
async function moderate(kudoId: unknown, to: KudoStatus): Promise<KudoModerationResult> {
  const { userId: adminId } = await requireAdmin();
  const parsed = z.uuid().safeParse(kudoId);
  if (!parsed.success) return { ok: false, code: "invalid" };

  let result: KudoTransitionResult | null;
  try {
    result = await KudoModerationService.transition(parsed.data, to, adminId);
  } catch (error) {
    console.error("[admin-moderation] moderation failed", error);
    return { ok: false, code: "unexpected" };
  }
  revalidatePath(ADMIN_ROUTES.review);
  return result ? { ok: true, ...result } : { ok: false, code: "not_found" };
}

/** public → spam. `changed: false` when it was already spam (e.g. another admin got there first). */
export async function markKudoSpam(kudoId: string): Promise<KudoModerationResult> {
  return moderate(kudoId, "spam");
}

/** spam → public. Emits no event (D005). */
export async function unSpamKudo(kudoId: string): Promise<KudoModerationResult> {
  return moderate(kudoId, "public");
}
