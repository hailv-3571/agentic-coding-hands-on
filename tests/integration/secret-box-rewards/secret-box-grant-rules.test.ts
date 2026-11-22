import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SecretBoxGrantService } from "@/features/secret-box-rewards/server/secret-box-grant-service";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart, resetHearts } from "../kudos-hearts/kudo-heart-fixtures";
import { boxesOf, cleanupSecretBoxUsers, createSunners, eventsFor, resetRewards } from "./secret-box-fixtures";
import { resetSecretBoxEnv, secretBoxEnv } from "./secret-box-env-override";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));
// Pass-through with switches: an outbox write failure (rollback) and a heart-total read failure.
const failures = vi.hoisted(() => ({ outbox: false, heartStats: false }));
vi.mock("@/shared/events/domain-event-outbox", async (original) => {
  const real = await original<typeof import("@/shared/events/domain-event-outbox")>();
  return {
    DomainEventOutbox: {
      add: (...args: Parameters<typeof real.DomainEventOutbox.add>) => {
        if (failures.outbox) return Promise.reject(new Error("outbox down"));
        return real.DomainEventOutbox.add(...args);
      },
    },
  };
});
vi.mock("@/features/kudos-hearts/server/heart-stats-query", async (original) => {
  const real = await original<typeof import("@/features/kudos-hearts/server/heart-stats-query")>();
  const guard = <T>(read: () => Promise<T>) => (failures.heartStats ? Promise.reject(new Error("stats down")) : read());
  return {
    HeartStatsQuery: {
      receivedByUser: (...args: Parameters<typeof real.HeartStatsQuery.receivedByUser>) => guard(() => real.HeartStatsQuery.receivedByUser(...args)),
      receivedByUsers: (...args: Parameters<typeof real.HeartStatsQuery.receivedByUsers>) => guard(() => real.HeartStatsQuery.receivedByUsers(...args)),
    },
  };
});

/**
 * Grant rules (ALG-001 adjusted, C-02, BR-002, BR-007, D001, D002): progress = phase 06's weighted
 * total of hearts on the kudos the user SENT (x2 counts 2, anonymous counts, spam stops counting) up to
 * min(now, EVENT_END_AT); boxes are never taken back; the event is written in the grant transaction.
 */
let sender: Sunner;
let fans: Sunner[];
const kudoIds: string[] = [];
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const kudo = async (nickname: string | null = null) => {
  const id = await insertKudo({ sender, recipient: fans[0], nickname });
  kudoIds.push(id);
  return id;
};
const heart = (kudoId: string, fanIndex: number, multiplier: number, createdAt?: string) => insertHeart(kudoId, fans[fanIndex].id, multiplier, createdAt);
const reconcile = (now?: Date) => SecretBoxGrantService.reconcileForSender(sender.id, now);
const setStatus = (kudoId: string, status: "public" | "spam") => testSql`update public.kudos set status = ${status} where id = ${kudoId}`;

beforeAll(async () => {
  [sender, ...fans] = await createSunners(["sbx-rule-sender", "sbx-rule-a", "sbx-rule-b", "sbx-rule-c"]);
});
beforeEach(async () => {
  resetSecretBoxEnv();
  failures.outbox = false;
  failures.heartStats = false;
  await resetHearts(kudoIds);
  await testSql`update public.kudos set status = 'public' where id = any(${kudoIds}::uuid[])`;
  await resetRewards([sender.id]);
});
afterAll(async () => {
  await cleanupSecretBoxUsers([sender, ...fans]);
  await closeAppDb();
});

describe("SecretBoxGrantService grant rules", () => {
  it("counts an x2 heart as 2: weighted 5 from 3 hearts grants a box (D001)", async () => {
    const id = await kudo();
    await heart(id, 0, 2);
    await heart(id, 1, 2);
    await heart(id, 2, 1);
    expect((await reconcile()).granted).toBe(1);
    expect(await eventsFor("BoxGranted", sender.id)).toEqual([{ userId: sender.id, count: 1 }]);
  });

  it("counts hearts on the sender's anonymous kudos (BR-007)", async () => {
    const id = await kudo("Cú Đêm");
    await heart(id, 0, 2);
    await heart(id, 1, 2);
    await heart(id, 2, 1);
    expect((await reconcile()).granted).toBe(1);
  });

  it("keeps boxes when a kudo is marked spam and grants again only past the next threshold (BR-002)", async () => {
    const [a, b, c] = [await kudo(), await kudo(), await kudo()];
    for (const fanIndex of [0, 1, 2]) await heart(a, fanIndex, 2); // 6
    await heart(b, 0, 2);
    await heart(b, 1, 2);
    await heart(b, 2, 1); // 5 → total 11
    expect((await reconcile()).granted).toBe(2);

    await setStatus(b, "spam"); // total 6: boxes stay
    await heart(c, 0, 2);
    await heart(c, 1, 2); // total 10: still entitled to 2
    expect(await reconcile()).toMatchObject({ granted: 0, stats: { weightedTotal: 10 } });
    expect(await boxesOf(sender.id)).toHaveLength(2);

    await setStatus(b, "public"); // Un Spam: total 15 → third box
    expect((await reconcile()).granted).toBe(1);
    expect(await boxesOf(sender.id)).toEqual([1, 2, 3].map((seq) => ({ seq, status: "unopened" })));
    expect(await eventsFor("BoxGranted", sender.id)).toEqual([
      { userId: sender.id, count: 2 },
      { userId: sender.id, count: 1 },
    ]);
  });

  it("ignores hearts after EVENT_END_AT yet still grants the in-window boxes on a late reconcile", async () => {
    secretBoxEnv.eventEndAt = Date.now() - 60 * 60_000;
    const id = await kudo();
    await heart(id, 0, 2, ago(120));
    await heart(id, 1, 2, ago(120));
    await heart(id, 2, 1, ago(90)); // in window: 5
    const late = await kudo();
    for (const fanIndex of [0, 1, 2]) await heart(late, fanIndex, 2, ago(10)); // after the event: ignored
    expect(await reconcile()).toMatchObject({ granted: 1, stats: { weightedTotal: 5 } });
  });

  it("writes no box when the BoxGranted event cannot be written (same transaction)", async () => {
    const id = await kudo();
    for (const fanIndex of [0, 1, 2]) await heart(id, fanIndex, 2);
    failures.outbox = true;
    await expect(reconcile()).rejects.toThrow("outbox down");
    expect(await boxesOf(sender.id)).toEqual([]);
  });

  it("throws and writes nothing when the heart totals cannot be read", async () => {
    const id = await kudo();
    for (const fanIndex of [0, 1, 2]) await heart(id, fanIndex, 2);
    failures.heartStats = true;
    await expect(reconcile()).rejects.toThrow("stats down");
    expect(await boxesOf(sender.id)).toEqual([]);
    expect(await eventsFor("BoxGranted", sender.id)).toEqual([]);
  });
});
