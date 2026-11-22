import { randomUUID } from "node:crypto";
import { and, gte, inArray, lte, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { HERO_QUERY_MAX_IDS } from "@/features/hero-badges/server/hero-tier-constants";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import { tierCountRange } from "@/features/hero-badges/server/tier-from-count";
import { db } from "@/shared/db/client";
import { testDb, testSql, withRollback } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";

/**
 * HeroTierQuery (F009 A1) on the local Supabase stack: DISTINCT public senders per recipient
 * (BR-001..003), one statement per batch (no N+1), tier names keyed by the requested ids only
 * (FR-602), and the count subquery phase 14 filters with `tierCountRange` (C-12).
 */
let senders: Sunner[];
let oneSenderTenKudos: Sunner;
let fiveSenders: Sunner;
let nobody: Sunner;
let anonymousKudoId: string;

beforeAll(async () => {
  senders = await Promise.all([1, 2, 3, 4, 5].map((n) => createSunner(`hero-s${n}`, `Hero Sender ${n}`)));
  [oneSenderTenKudos, fiveSenders, nobody] = await Promise.all([
    createSunner("hero-r1", "Hero One Sender"),
    createSunner("hero-r2", "Hero Five Senders"),
    createSunner("hero-r3", "Hero Nobody"),
  ]);
  for (let index = 0; index < 10; index += 1) await insertKudo({ sender: senders[0], recipient: oneSenderTenKudos });
  for (const sender of senders.slice(0, 4)) await insertKudo({ sender, recipient: fiveSenders });
  anonymousKudoId = await insertKudo({ sender: senders[4], recipient: fiveSenders, nickname: "Cú Đêm" });
});
afterAll(async () => {
  await cleanupSunners([...senders, oneSenderTenKudos, fiveSenders, nobody]);
  await closeAppDb();
});

const client = (db as unknown as { $client: { unsafe: (...args: unknown[]) => unknown } }).$client;
async function statementsFor(run: () => Promise<unknown>): Promise<number> {
  const spy = vi.spyOn(client, "unsafe");
  try {
    await run();
    return spy.mock.calls.length;
  } finally {
    spy.mockRestore();
  }
}
const setStatus = (id: string, status: "public" | "spam") => testSql`update public.kudos set status = ${status} where id = ${id}`;

describe("HeroTierQuery — counting rules", () => {
  it("counts a sender once however many kudos they sent (BR-002, SC-002)", async () => {
    const counts = await HeroTierQuery.getDistinctSenderCounts([oneSenderTenKudos.id]);
    expect(counts.get(oneSenderTenKudos.id)).toBe(1);
    expect(await HeroTierQuery.getTiersByRecipientIds([oneSenderTenKudos.id])).toEqual({ [oneSenderTenKudos.id]: "new" });
  });

  it("counts an anonymous sender like any other (BR-003): the 5th sender is anonymous → rising", async () => {
    expect((await HeroTierQuery.getDistinctSenderCounts([fiveSenders.id])).get(fiveSenders.id)).toBe(5);
    expect(await HeroTierQuery.getTiersByRecipientIds([fiveSenders.id])).toEqual({ [fiveSenders.id]: "rising" });
  });

  it("drops a spam kudo on the next read and restores it after un-spam, with no recompute (BR-001, SC-003)", async () => {
    try {
      await setStatus(anonymousKudoId, "spam");
      expect(await HeroTierQuery.getTiersByRecipientIds([fiveSenders.id])).toEqual({ [fiveSenders.id]: "new" });
    } finally {
      await setStatus(anonymousKudoId, "public");
    }
    expect(await HeroTierQuery.getTiersByRecipientIds([fiveSenders.id])).toEqual({ [fiveSenders.id]: "rising" });
  });

  it("never counts a self-sent row, even if the no-self CHECK were gone (BR-002, SC-004)", async () => {
    const count = await withRollback(async (tx) => {
      await tx.execute(sql`alter table public.kudos drop constraint kudos_no_self_send`);
      await tx.execute(sql`insert into public.kudos (sender_id, recipient_id, body) values (${nobody.id}, ${nobody.id}, 'tự gửi')`);
      await tx.execute(sql`insert into public.kudos (sender_id, recipient_id, body) values (${senders[0].id}, ${nobody.id}, 'x')`);
      return (await HeroTierQuery.getDistinctSenderCounts([nobody.id], tx)).get(nobody.id);
    });
    expect(count).toBe(1);
  });

  it("reports 0 senders for a requested id without kudos and gives it no tier (DEC-001)", async () => {
    expect(await HeroTierQuery.getDistinctSenderCounts([nobody.id])).toEqual(new Map([[nobody.id, 0]]));
    expect(await HeroTierQuery.getTiersByRecipientIds([nobody.id])).toEqual({});
  });

  it("returns tier names keyed by the requested ids only, never a sender id (FR-602, SC-005)", async () => {
    const tiers = await HeroTierQuery.getTiersByRecipientIds([oneSenderTenKudos.id, fiveSenders.id, nobody.id, senders[0].id]);
    expect(tiers).toEqual({ [oneSenderTenKudos.id]: "new", [fiveSenders.id]: "rising" });
    const payload = JSON.stringify(tiers);
    for (const sender of senders) expect(payload).not.toContain(sender.id);
  });
});

describe("HeroTierQuery — batching (no N+1)", () => {
  it("issues no statement for an empty batch", async () => {
    let tiers: unknown;
    expect(await statementsFor(async () => (tiers = await HeroTierQuery.getTiersByRecipientIds([])))).toBe(0);
    expect(tiers).toEqual({});
  });

  it("issues exactly one statement for a page of 50 recipients", async () => {
    const ids = [oneSenderTenKudos.id, fiveSenders.id, ...Array.from({ length: 48 }, () => randomUUID())];
    let tiers: unknown;
    expect(await statementsFor(async () => (tiers = await HeroTierQuery.getTiersByRecipientIds(ids)))).toBe(1);
    expect(tiers).toEqual({ [oneSenderTenKudos.id]: "new", [fiveSenders.id]: "rising" });
  });

  it("de-duplicates ids before querying", async () => {
    const ids = [fiveSenders.id, fiveSenders.id, oneSenderTenKudos.id, fiveSenders.id];
    let counts: Map<string, number> | undefined;
    expect(await statementsFor(async () => (counts = await HeroTierQuery.getDistinctSenderCounts(ids)))).toBe(1);
    expect(counts).toEqual(new Map([[fiveSenders.id, 5], [oneSenderTenKudos.id, 1]]));
  });

  it(`splits a batch above HERO_QUERY_MAX_IDS (${HERO_QUERY_MAX_IDS}) into chunks, one statement each`, async () => {
    const ids = [...Array.from({ length: HERO_QUERY_MAX_IDS }, () => randomUUID()), fiveSenders.id];
    let tiers: unknown;
    expect(await statementsFor(async () => (tiers = await HeroTierQuery.getTiersByRecipientIds(ids)))).toBe(2);
    expect(tiers).toEqual({ [fiveSenders.id]: "rising" });
  });
});

describe("distinctSenderCountSubquery (phase 14 Level filter)", () => {
  it("gives the same counts, so a tierCountRange filter selects the same people as getTiersByRecipientIds", async () => {
    const counts = HeroTierQuery.distinctSenderCountSubquery();
    const ids = [oneSenderTenKudos.id, fiveSenders.id, nobody.id];
    const { min, max } = tierCountRange("rising");
    const rising = await testDb
      .select({ id: counts.recipientId, senderCount: counts.senderCount })
      .from(counts)
      .where(and(inArray(counts.recipientId, ids), gte(counts.senderCount, min), max === null ? undefined : lte(counts.senderCount, max)));
    expect(rising).toEqual([{ id: fiveSenders.id, senderCount: 5 }]);
  });
});
