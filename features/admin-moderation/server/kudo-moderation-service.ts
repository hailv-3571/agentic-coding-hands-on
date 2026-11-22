import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { kudos, type KudoStatus } from "@/shared/db/schema";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";

/**
 * KudoModerationService (A2/A3, SM-001 public ↔ spam). One transaction per call:
 *   UPDATE kudos SET status = :to, moderated_by, moderated_at = now() WHERE id AND status = :from RETURNING
 * — idempotent and race-safe without explicit locks (BR-001, FR-406): concurrent callers queue on the
 * row lock and re-check `status = :from`, so exactly one of them changes the row. Only a real
 * public → spam change adds `KudoMarkedSpam{kudoId, ownerId, moderatedAt}` to the outbox in the SAME
 * transaction (C-01, payload ids only); Un Spam emits nothing (D005). Zero rows → re-read: missing →
 * null (not found), otherwise the current status with `changed: false` and `moderated_*` untouched.
 * Counters are never written (spam is excluded at query time everywhere, D002 / BR-003).
 */
export type KudoTransitionResult = { status: KudoStatus; changed: boolean };

const SOURCE_STATUS: Record<KudoStatus, KudoStatus> = { spam: "public", public: "spam" };

async function transition(kudoId: string, to: KudoStatus, adminId: string): Promise<KudoTransitionResult | null> {
  return db.transaction(async (tx) => {
    const [changed] = await tx
      .update(kudos)
      .set({ status: to, moderatedBy: adminId, moderatedAt: sql`now()` })
      .where(and(eq(kudos.id, kudoId), eq(kudos.status, SOURCE_STATUS[to])))
      .returning({ ownerId: kudos.senderId, moderatedAt: kudos.moderatedAt });
    if (changed) {
      if (to === "spam") {
        // RETURNING carries the now() this UPDATE just wrote: never null here (column type is nullable).
        await DomainEventOutbox.add(tx, "KudoMarkedSpam", {
          kudoId,
          ownerId: changed.ownerId,
          moderatedAt: changed.moderatedAt!.toISOString(),
        });
      }
      return { status: to, changed: true };
    }
    const [current] = await tx.select({ status: kudos.status }).from(kudos).where(eq(kudos.id, kudoId));
    return current ? { status: current.status, changed: false } : null;
  });
}

export const KudoModerationService = { transition } as const;
