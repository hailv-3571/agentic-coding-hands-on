import type { DomainEvent } from "@/shared/events/domain-event-types";
import type { NotificationType } from "../schemas/notification-views";
import type { HeroTierUp } from "./detect-hero-tier-up";

/** The kudo as the processor read it inside the event's transaction (status re-check, FR-408). */
export type KudoFacts = { id: string; senderId: string; recipientId: string; isAnonymous: boolean; isPublic: boolean };

/** What the processor read for one event: the kudo (KudoCreated / HeartAdded) and a tier-up (KudoCreated). */
export type EventContext = { kudo: KudoFacts | null; tierUp: HeroTierUp | null };

/** One notification to write. `params` hold ids/values only: never a sender id or name (BR-006). */
export type NotificationDraft = {
  recipientId: string;
  type: NotificationType;
  actorId: string | null;
  dedupeKey: string | null;
  params: Record<string, unknown>;
};

const draft = (recipientId: string, type: NotificationType, params: Record<string, unknown>, extra: Partial<NotificationDraft> = {}): NotificationDraft => ({
  recipientId,
  type,
  actorId: null,
  dedupeKey: null,
  params,
  ...extra,
});

/** A kudo that may still notify: present, public, and not self-sent (BR-002, BR-003). */
const liveKudo = (kudo: KudoFacts | null): kudo is KudoFacts => Boolean(kudo?.isPublic && kudo.senderId !== kudo.recipientId);

function kudoCreated(context: EventContext): NotificationDraft[] {
  const { kudo, tierUp } = context;
  if (!liveKudo(kudo)) return [];
  // BR-006: an anonymous sender is never an actor; the list shows the kudo's nickname instead.
  const drafts = [draft(kudo.recipientId, "kudo_received", { kudoId: kudo.id }, { actorId: kudo.isAnonymous ? null : kudo.senderId })];
  if (tierUp) {
    drafts.push(draft(kudo.recipientId, "hero_tier_up", { tier: tierUp.tier, senderCount: tierUp.senderCount }, { dedupeKey: tierUp.tier }));
  }
  return drafts;
}

function heartAdded(heartUserId: string, kudo: KudoFacts | null): NotificationDraft[] {
  if (!liveKudo(kudo) || heartUserId === kudo.senderId) return [];
  // No actor: who hearted is never stored (spec § 4.2). Aggregated per kudo while unread (BR-004).
  return [draft(kudo.senderId, "heart_received", { kudoId: kudo.id }, { dedupeKey: kudo.id })];
}

/**
 * Phase 10 constraint: `items[].senderId` is the REAL sender (anonymous kudos included). It only
 * picks the recipient (the sender themself); params keep `{kudoId, rank}` and nothing derived from it.
 */
function nationalKudos(items: { kudoId: string; senderId: string; rank: number }[]): NotificationDraft[] {
  const bySender = new Map<string, { kudoId: string; rank: number }[]>();
  for (const { kudoId, senderId, rank } of items) bySender.set(senderId, [...(bySender.get(senderId) ?? []), { kudoId, rank }]);
  return [...bySender].map(([senderId, owned]) => draft(senderId, "national_kudos", { items: owned.sort((a, b) => a.rank - b.rank) }));
}

/**
 * ALG-001 (FR-001/004, BR-001..006): one validated outbox event → the notifications it owes. Pure; the
 * result depends only on the event and the context read in the same transaction.
 */
export function mapEventToNotifications(event: DomainEvent, context: EventContext): NotificationDraft[] {
  switch (event.type) {
    case "KudoCreated":
      return kudoCreated(context);
    case "HeartAdded":
      return heartAdded(event.payload.heartUserId, context.kudo);
    case "KudoMarkedSpam":
      // Always owed, even if the kudo was restored since (D005: Un Spam sends nothing, BR-008).
      return [draft(event.payload.ownerId, "kudo_hidden_spam", { kudoId: event.payload.kudoId })];
    case "BoxGranted":
      return [draft(event.payload.userId, "secret_box_granted", { count: event.payload.count })];
    case "SetCompleted":
      return [draft(event.payload.userId, "icon_set_completed", { giftName: event.payload.giftName })];
    case "NationalKudosFinalized":
      return nationalKudos(event.payload.items);
  }
}
