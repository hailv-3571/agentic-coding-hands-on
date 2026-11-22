import { describe, expect, it } from "vitest";
import { SpotlightEventSchema, SpotlightSnapshotSchema } from "@/features/spotlight-board/schemas/spotlight-event-schema";

/**
 * Zod contract of the private Broadcast payload and of GET /api/spotlight (client-side guard, FR-602):
 * a trigger payload parses to exactly the 5 contract keys (`realtime.send` appends its own message
 * `id`, which is dropped), anything malformed is rejected, and unknown keys never survive a parse.
 */
const KUDO_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const RECIPIENT_ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";
const triggerPayload = {
  type: "added",
  kudoId: KUDO_ID,
  recipientId: RECIPIENT_ID,
  recipientName: "Nguyễn Bá Chức",
  occurredAt: "2026-11-22T15:31:37.123Z",
  id: "3f1c2b9e-3d4a-4e5f-9a8b-7c6d5e4f3a2b",
};

describe("SpotlightEventSchema", () => {
  it("accepts the trigger payload and keeps exactly the 5 contract keys", () => {
    const parsed = SpotlightEventSchema.parse(triggerPayload);
    expect(parsed).toEqual({ type: "added", kudoId: KUDO_ID, recipientId: RECIPIENT_ID, recipientName: "Nguyễn Bá Chức", occurredAt: "2026-11-22T15:31:37.123Z" });
  });

  it.each(["added", "removed", "restored"])("accepts type %s", (type) => {
    expect(SpotlightEventSchema.safeParse({ ...triggerPayload, type }).success).toBe(true);
  });

  it.each([
    ["an unknown type", { type: "deleted" }],
    ["a non-uuid kudo id", { kudoId: "42" }],
    ["a non-uuid recipient id", { recipientId: "x" }],
    ["an empty recipient name", { recipientName: "" }],
    ["a null recipient name", { recipientName: null }],
    ["a non-ISO time", { occurredAt: "22/11/2026 15:31" }],
  ])("rejects %s", (_label, patch) => {
    expect(SpotlightEventSchema.safeParse({ ...triggerPayload, ...patch }).success).toBe(false);
  });

  it("drops sender-like keys if they ever appeared", () => {
    const parsed = SpotlightEventSchema.parse({ ...triggerPayload, senderId: RECIPIENT_ID, isAnonymous: true });
    expect(Object.keys(parsed).sort()).toEqual(["kudoId", "occurredAt", "recipientId", "recipientName", "type"]);
  });
});

describe("SpotlightSnapshotSchema", () => {
  const snapshot = {
    total: 3,
    names: [{ recipientId: RECIPIENT_ID, name: "Nguyễn Bá Chức", count: 3 }],
    recent: [{ kudoId: KUDO_ID, recipientId: RECIPIENT_ID, recipientName: "Nguyễn Bá Chức", occurredAt: "2026-11-22T15:31:37.123Z" }],
  };

  it("accepts a snapshot and an empty board", () => {
    expect(SpotlightSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(SpotlightSnapshotSchema.parse({ total: 0, names: [], recent: [] })).toEqual({ total: 0, names: [], recent: [] });
  });

  it("strips unknown keys at every level", () => {
    const leaky = {
      ...snapshot,
      senderId: KUDO_ID,
      names: [{ ...snapshot.names[0], senderName: "x" }],
      recent: [{ ...snapshot.recent[0], isAnonymous: false }],
    };
    expect(SpotlightSnapshotSchema.parse(leaky)).toEqual(snapshot);
  });

  it.each([
    ["a negative total", { total: -1 }],
    ["a fractional total", { total: 1.5 }],
    ["a zero name count", { names: [{ recipientId: RECIPIENT_ID, name: "A", count: 0 }] }],
  ])("rejects %s", (_label, patch) => {
    expect(SpotlightSnapshotSchema.safeParse({ ...snapshot, ...patch }).success).toBe(false);
  });
});
