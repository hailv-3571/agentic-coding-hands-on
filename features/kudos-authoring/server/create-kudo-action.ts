"use server";

import { requireSunner } from "@/shared/auth/current-user";
import { isEventWritingOpen } from "@/shared/config/event-window";
import { db } from "@/shared/db/client";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import { KudoInputSchema, parseKudoInput, type KudoCreateInput } from "../schemas/kudo-input-schema";
import type { KudoWriteResult } from "../schemas/kudo-write-result";
import { kudoWriteFailureOf } from "./kudo-write-error";
import { insertKudoGraph } from "./kudo-write-repository";

/**
 * createKudo (tech spec A4, FR-601/603). An untrusted POST entry point like every Server Action:
 * session → write window → the shared Zod schema → one transaction holding the Kudo, its
 * hashtags/images and the `KudoCreated` outbox row (C-01), so either all of it commits or none.
 * The sender always comes from the session; `status` is never written (DB default 'public').
 * The composer calls `router.refresh()` after `{ ok: true }`.
 */
export async function createKudo(input: KudoCreateInput): Promise<KudoWriteResult> {
  const { userId } = await requireSunner();
  if (!isEventWritingOpen(new Date())) return { ok: false, code: "WRITING_CLOSED" };

  const parsed = parseKudoInput(KudoInputSchema, input);
  if (!parsed.ok) return parsed;
  if (parsed.data.recipientId === userId) {
    return { ok: false, code: "SELF_SEND", fieldErrors: { recipientId: ["selfSend"] } };
  }

  try {
    const id = await db.transaction(async (tx) => {
      const kudoId = await insertKudoGraph(tx, userId, parsed.data);
      await DomainEventOutbox.add(tx, "KudoCreated", { kudoId });
      return kudoId;
    });
    return { ok: true, id };
  } catch (error) {
    return kudoWriteFailureOf(error, "create");
  }
}
