"use server";

import { z } from "zod";
import { requireSunner } from "@/shared/auth/current-user";
import { isEventWritingOpen } from "@/shared/config/event-window";
import { db } from "@/shared/db/client";
import { KudoUpdateSchema, parseKudoInput, type KudoUpdateInput } from "../schemas/kudo-input-schema";
import type { KudoWriteResult } from "../schemas/kudo-write-result";
import { kudoWriteFailureOf } from "./kudo-write-error";
import { updateOwnPublicKudo } from "./kudo-write-repository";

/**
 * updateKudo (tech spec A5, US004, FR-402/602). Owner only, `status = 'public'` only (C-17),
 * every field except the recipient; hashtag and image sets are replaced. created_at, hearts and
 * status stay as they are, and no outbox event is emitted (none exists for edits; YAGNI).
 * NOT_FOUND / FORBIDDEN / SPAM_LOCKED carry no Kudo content.
 */
export async function updateKudo(kudoId: string, input: KudoUpdateInput): Promise<KudoWriteResult> {
  const { userId } = await requireSunner();
  if (!isEventWritingOpen(new Date())) return { ok: false, code: "WRITING_CLOSED" };
  if (!z.uuid().safeParse(kudoId).success) return { ok: false, code: "NOT_FOUND" };

  const parsed = parseKudoInput(KudoUpdateSchema, input);
  if (!parsed.ok) return parsed;

  try {
    await db.transaction((tx) => updateOwnPublicKudo(tx, kudoId, userId, parsed.data));
    return { ok: true, id: kudoId };
  } catch (error) {
    return kudoWriteFailureOf(error, "update");
  }
}
