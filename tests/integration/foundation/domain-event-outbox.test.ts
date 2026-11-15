import { randomUUID } from "node:crypto";
import { inArray, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { domainEventOutbox } from "@/shared/db/schema";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import { testDb, withRollback } from "../../setup/integration-db";

const committedIds: string[] = [];

async function rowsForKudo(kudoId: string) {
  return testDb
    .select()
    .from(domainEventOutbox)
    .where(sql`${domainEventOutbox.payload} ->> 'kudoId' = ${kudoId}`);
}

afterAll(async () => {
  if (committedIds.length > 0) {
    await testDb.delete(domainEventOutbox).where(inArray(domainEventOutbox.id, committedIds));
  }
});

describe("DomainEventOutbox.add", () => {
  it("writes a pending row that becomes visible when the business transaction commits", async () => {
    const kudoId = randomUUID();
    const { id } = await testDb.transaction((tx) =>
      DomainEventOutbox.add(tx, "KudoCreated", { kudoId }),
    );
    committedIds.push(id);

    const [row] = await rowsForKudo(kudoId);
    expect(row).toMatchObject({
      id,
      eventType: "KudoCreated",
      payload: { kudoId },
      attempts: 0,
      consumedAt: null,
      failedAt: null,
      lastError: null,
    });
    expect(row.occurredAt).toBeInstanceOf(Date);
  });

  it("leaves no row when the business transaction fails after add", async () => {
    const kudoId = randomUUID();
    const businessFailure = new Error("business rule violated");

    await expect(
      testDb.transaction(async (tx) => {
        await DomainEventOutbox.add(tx, "HeartAdded", { kudoId, heartUserId: randomUUID() });
        throw businessFailure;
      }),
    ).rejects.toBe(businessFailure);

    expect(await rowsForKudo(kudoId)).toEqual([]);
  });

  it("rejects an invalid payload without writing", async () => {
    const kudoId = "not-a-uuid";
    await expect(
      testDb.transaction((tx) => DomainEventOutbox.add(tx, "KudoCreated", { kudoId })),
    ).rejects.toThrow(/kudoId/);
    expect(await rowsForKudo(kudoId)).toEqual([]);
  });

  it("rejects payload fields beyond ids (no Kudo body or names in events)", async () => {
    const kudoId = randomUUID();
    const leaky = { kudoId, body: "Cảm ơn bạn!" } as unknown as { kudoId: string };
    await expect(
      testDb.transaction((tx) => DomainEventOutbox.add(tx, "KudoCreated", leaky)),
    ).rejects.toThrow(/body/);
    expect(await rowsForKudo(kudoId)).toEqual([]);
  });

  it("accepts every other event in the F013 contract", async () => {
    const userId = randomUUID();
    const kudoId = randomUUID();
    const written = await withRollback(async (tx) => [
      await DomainEventOutbox.add(tx, "KudoMarkedSpam", {
        kudoId,
        ownerId: userId,
        moderatedAt: new Date().toISOString(),
      }),
      await DomainEventOutbox.add(tx, "BoxGranted", { userId, count: 2 }),
      await DomainEventOutbox.add(tx, "SetCompleted", { userId, giftName: "Áo phông SAA" }),
      await DomainEventOutbox.add(tx, "NationalKudosFinalized", {
        items: [{ kudoId, senderId: userId, rank: 1 }],
      }),
    ]);
    expect(written).toHaveLength(4);
  });
});
