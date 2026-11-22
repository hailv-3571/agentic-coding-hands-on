import { describe, expect, it } from "vitest";
import { mapEventToNotifications, type KudoFacts } from "@/features/notifications/server/map-event-to-notifications";
import type { DomainEvent } from "@/shared/events/domain-event-types";

/**
 * ALG-001: one validated outbox event (+ the kudo facts and tier-up the processor read inside its
 * transaction) → the notifications it owes. Self actions owe nothing (BR-002), a kudo that is not
 * public owes no kudo_received / heart / tier-up (BR-003, FR-408), kudo_hidden_spam is always owed,
 * anonymous senders never become an actor (BR-006), national kudos never carry a senderId (phase 10).
 */
const SENDER = "11111111-1111-4111-8111-111111111111";
const RECIPIENT = "22222222-2222-4222-8222-222222222222";
const FAN = "33333333-3333-4333-8333-333333333333";
const KUDO = "44444444-4444-4444-8444-444444444444";
const KUDO_2 = "55555555-5555-4555-8555-555555555555";
const kudo = (overrides: Partial<KudoFacts> = {}): KudoFacts => ({
  id: KUDO,
  senderId: SENDER,
  recipientId: RECIPIENT,
  isAnonymous: false,
  isPublic: true,
  ...overrides,
});
const none = { kudo: null, tierUp: null };

describe("KudoCreated", () => {
  const event = { type: "KudoCreated", payload: { kudoId: KUDO } } as const;

  it("owes the recipient a kudo_received with the sender as actor", () => {
    expect(mapEventToNotifications(event, { kudo: kudo(), tierUp: null })).toEqual([
      { recipientId: RECIPIENT, type: "kudo_received", actorId: SENDER, dedupeKey: null, params: { kudoId: KUDO } },
    ]);
  });

  it("never records an anonymous sender as actor", () => {
    expect(mapEventToNotifications(event, { kudo: kudo({ isAnonymous: true }), tierUp: null })).toEqual([
      { recipientId: RECIPIENT, type: "kudo_received", actorId: null, dedupeKey: null, params: { kudoId: KUDO } },
    ]);
  });

  it("adds a hero_tier_up keyed by tier when the kudo lifted the recipient's tier", () => {
    const drafts = mapEventToNotifications(event, { kudo: kudo({ isAnonymous: true }), tierUp: { tier: "rising", senderCount: 5 } });
    expect(drafts[1]).toEqual({
      recipientId: RECIPIENT,
      type: "hero_tier_up",
      actorId: null,
      dedupeKey: "rising",
      params: { tier: "rising", senderCount: 5 },
    });
    expect(JSON.stringify(drafts)).not.toContain(SENDER);
  });

  it.each([
    ["a kudo no longer public", { kudo: kudo({ isPublic: false }), tierUp: { tier: "new" as const, senderCount: 1 } }],
    ["a missing kudo", { kudo: null, tierUp: null }],
    ["a self-sent kudo", { kudo: kudo({ senderId: RECIPIENT }), tierUp: null }],
  ])("owes nothing for %s", (_label, context) => {
    expect(mapEventToNotifications(event, context)).toEqual([]);
  });
});

describe("HeartAdded", () => {
  const event = { type: "HeartAdded", payload: { kudoId: KUDO, heartUserId: FAN } } as const;

  it("owes the kudo's sender one heart_received keyed by kudo, with no actor (the giver stays unknown)", () => {
    expect(mapEventToNotifications(event, { kudo: kudo({ isAnonymous: true }), tierUp: null })).toEqual([
      { recipientId: SENDER, type: "heart_received", actorId: null, dedupeKey: KUDO, params: { kudoId: KUDO } },
    ]);
  });

  it.each([
    ["a hidden kudo", kudo({ isPublic: false })],
    ["a heart from the sender on their own kudo", kudo({ senderId: FAN })],
    ["a missing kudo", null],
  ])("owes nothing for %s", (_label, facts) => {
    expect(mapEventToNotifications(event, { kudo: facts, tierUp: null })).toEqual([]);
  });
});

describe("events without a kudo read", () => {
  it("KudoMarkedSpam always owes the owner a kudo_hidden_spam", () => {
    const event = { type: "KudoMarkedSpam", payload: { kudoId: KUDO, ownerId: SENDER, moderatedAt: "2026-11-23T01:00:00.000Z" } } as const;
    expect(mapEventToNotifications(event, none)).toEqual([
      { recipientId: SENDER, type: "kudo_hidden_spam", actorId: null, dedupeKey: null, params: { kudoId: KUDO } },
    ]);
  });

  it("BoxGranted owes secret_box_granted with the box count", () => {
    expect(mapEventToNotifications({ type: "BoxGranted", payload: { userId: FAN, count: 2 } }, none)).toEqual([
      { recipientId: FAN, type: "secret_box_granted", actorId: null, dedupeKey: null, params: { count: 2 } },
    ]);
  });

  it("SetCompleted owes icon_set_completed with the gift name", () => {
    expect(mapEventToNotifications({ type: "SetCompleted", payload: { userId: FAN, giftName: "Áo Root Further" } }, none)).toEqual([
      { recipientId: FAN, type: "icon_set_completed", actorId: null, dedupeKey: null, params: { giftName: "Áo Root Further" } },
    ]);
  });

  it("NationalKudosFinalized owes one national_kudos per sender, items by rank, never the senderId", () => {
    const event = {
      type: "NationalKudosFinalized",
      payload: {
        items: [
          { kudoId: KUDO_2, senderId: SENDER, rank: 4 },
          { kudoId: "66666666-6666-4666-8666-666666666666", senderId: FAN, rank: 2 },
          { kudoId: KUDO, senderId: SENDER, rank: 1 },
        ],
      },
    } satisfies DomainEvent;
    const drafts = mapEventToNotifications(event, none);
    expect(drafts).toEqual([
      {
        recipientId: SENDER,
        type: "national_kudos",
        actorId: null,
        dedupeKey: null,
        params: { items: [{ kudoId: KUDO, rank: 1 }, { kudoId: KUDO_2, rank: 4 }] },
      },
      {
        recipientId: FAN,
        type: "national_kudos",
        actorId: null,
        dedupeKey: null,
        params: { items: [{ kudoId: "66666666-6666-4666-8666-666666666666", rank: 2 }] },
      },
    ]);
    expect(drafts.map((draft) => JSON.stringify(draft.params)).join()).not.toMatch(/senderId|11111111|33333333/);
  });
});
