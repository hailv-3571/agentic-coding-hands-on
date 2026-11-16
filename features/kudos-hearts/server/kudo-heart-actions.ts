"use server";

import { z } from "zod";
import { requireSunner } from "@/shared/auth/current-user";
import type { HeartActionResult } from "../schemas/kudo-heart-result";
import { KudoHeartQuery } from "./kudo-heart-query";
import { KudoHeartError, KudoHeartService } from "./kudo-heart-service";

/**
 * Heart toggle Server Actions (F005 A1/A2, C-18: mutations through Server Actions). Untrusted POST
 * entry points: the user always comes from the session (FR-602) — a guest is redirected to
 * /login by `requireSunner()` —, the only input is a kudo id. After the write they answer the
 * fresh raw count and the viewer's state (no revalidatePath: the button applies the answer and
 * other viewers see it on their next load, D008). Nothing else leaves the server (D009).
 */
type HeartWrite = (kudoId: string, userId: string) => Promise<unknown>;

async function toggleHeart(rawKudoId: unknown, write: HeartWrite, operation: string): Promise<HeartActionResult> {
  const { userId } = await requireSunner();
  const kudoId = z.uuid().safeParse(rawKudoId);
  if (!kudoId.success) return { ok: false, error: "KUDO_UNAVAILABLE" };
  try {
    await write(kudoId.data, userId);
    const summary = (await KudoHeartQuery.summaryForKudos([kudoId.data], userId)).get(kudoId.data);
    return { ok: true, heartCount: summary?.heartCount ?? 0, heartedByMe: summary?.heartedByMe ?? false };
  } catch (error) {
    if (error instanceof KudoHeartError) return { ok: false, error: error.code };
    console.error(`[hearts] ${operation} failed`, error);
    return { ok: false, error: "UNEXPECTED" };
  }
}

/** Hearts a public Kudo (idempotent). Errors: SELF_HEART, KUDO_UNAVAILABLE, EVENT_ENDED, UNEXPECTED. */
export async function addHeartAction(kudoId: string): Promise<HeartActionResult> {
  return toggleHeart(kudoId, (id, userId) => KudoHeartService.add(id, userId), "add");
}

/** Takes the viewer's heart back (idempotent). Errors: KUDO_UNAVAILABLE (bad id), EVENT_ENDED, UNEXPECTED. */
export async function removeHeartAction(kudoId: string): Promise<HeartActionResult> {
  return toggleHeart(kudoId, (id, userId) => KudoHeartService.remove(id, userId), "remove");
}
