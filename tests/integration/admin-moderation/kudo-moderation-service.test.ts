import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { KudoModerationService } from "@/features/admin-moderation/server/kudo-moderation-service";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { makeAdmin, moderationOf, spamOutboxRows } from "./admin-moderation-fixtures";

/**
 * KudoModerationService.transition (A2/A3, BR-001, SM-001, FR-406, INT-001, SC-001/002/009): one
 * conditional UPDATE per call, idempotent and race-safe; KudoMarkedSpam goes to the outbox in the
 * same transaction only on a real public → spam change; Un Spam emits nothing (D005).
 */
let owner: Sunner, recipient: Sunner, admin: Sunner, otherAdmin: Sunner;
let kudoId: string;

beforeAll(async () => {
  [owner, recipient, admin, otherAdmin] = await Promise.all([
    createSunner("mod-owner", "Mod Owner"),
    createSunner("mod-recipient", "Mod Recipient"),
    createSunner("mod-admin", "Mod Admin"),
    createSunner("mod-admin2", "Mod Admin Two"),
  ]);
  await Promise.all([makeAdmin(admin), makeAdmin(otherAdmin)]);
});
beforeEach(async () => {
  kudoId = await insertKudo({ sender: owner, recipient });
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await cleanupSunners([owner, recipient, admin, otherAdmin]);
  await closeAppDb();
});

describe("Mark Spam", () => {
  it("flips public → spam, records the admin and time, and emits one KudoMarkedSpam", async () => {
    expect(await KudoModerationService.transition(kudoId, "spam", admin.id)).toEqual({ status: "spam", changed: true });
    const row = await moderationOf(kudoId);
    expect(row).toMatchObject({ status: "spam", moderated_by: admin.id, moderated_at: expect.any(String) });
    const events = await spamOutboxRows(kudoId);
    expect(events).toHaveLength(1);
    expect(events[0].payload).toEqual({ kudoId, ownerId: owner.id, moderatedAt: expect.any(String) });
    expect(new Date(events[0].payload.moderatedAt).getTime()).toBe(new Date(row!.moderated_at!).getTime());
  });

  it("is idempotent: a repeat answers changed:false, keeps moderated_* and emits nothing more", async () => {
    await KudoModerationService.transition(kudoId, "spam", admin.id);
    const before = await moderationOf(kudoId);
    expect(await KudoModerationService.transition(kudoId, "spam", otherAdmin.id)).toEqual({ status: "spam", changed: false });
    expect(await moderationOf(kudoId)).toEqual(before);
    expect(await spamOutboxRows(kudoId)).toHaveLength(1);
  });

  it("lets 10 concurrent calls write once: 1 change, 9 no-ops, 1 outbox row, 0 errors", async () => {
    const admins = [admin, otherAdmin];
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, index) => KudoModerationService.transition(kudoId, "spam", admins[index % 2].id)),
    );
    const winners = results.flatMap((result, index) => (result?.changed ? [admins[index % 2].id] : []));
    expect(winners).toHaveLength(1);
    expect(results.every((result) => result?.status === "spam")).toBe(true);
    expect(await spamOutboxRows(kudoId)).toHaveLength(1);
    expect((await moderationOf(kudoId))?.moderated_by).toBe(winners[0]);
  });

  it("rolls the status change and the outbox row back when the transaction fails after the UPDATE", async () => {
    const add = DomainEventOutbox.add;
    vi.spyOn(DomainEventOutbox, "add").mockImplementation(async (tx, type, payload) => {
      await add(tx, type, payload);
      throw new Error("forced failure after the outbox insert");
    });
    await expect(KudoModerationService.transition(kudoId, "spam", admin.id)).rejects.toThrow("forced failure");
    expect(await moderationOf(kudoId)).toEqual({ status: "public", moderated_by: null, moderated_at: null });
    expect(await spamOutboxRows(kudoId)).toEqual([]);
  });
});

describe("Un Spam", () => {
  it("flips spam → public, records the latest admin (D008) and emits nothing", async () => {
    await KudoModerationService.transition(kudoId, "spam", admin.id);
    const spammed = await moderationOf(kudoId);
    expect(await KudoModerationService.transition(kudoId, "public", otherAdmin.id)).toEqual({ status: "public", changed: true });
    const row = await moderationOf(kudoId);
    expect(row).toMatchObject({ status: "public", moderated_by: otherAdmin.id });
    expect(new Date(row!.moderated_at!).getTime()).toBeGreaterThanOrEqual(new Date(spammed!.moderated_at!).getTime());
    expect(await spamOutboxRows(kudoId)).toHaveLength(1);
  });

  it("answers changed:false for a kudo that is already public and leaves it untouched", async () => {
    expect(await KudoModerationService.transition(kudoId, "public", admin.id)).toEqual({ status: "public", changed: false });
    expect(await moderationOf(kudoId)).toEqual({ status: "public", moderated_by: null, moderated_at: null });
  });
});

describe("unknown kudo", () => {
  it("answers null (not found) for both directions and writes nothing", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(await KudoModerationService.transition(missing, "spam", admin.id)).toBeNull();
    expect(await KudoModerationService.transition(missing, "public", admin.id)).toBeNull();
    expect(await spamOutboxRows(missing)).toEqual([]);
  });
});
