import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import type { Tx } from "../spotlight-board/spotlight-message-fixtures";

/**
 * realtime.messages RLS for `notifications:{user}` (FR-602, INT-002, phase 11 lesson): Realtime
 * authorizes a private join by reading this table as the client's role with realtime.topic set. A
 * Sunner reads broadcasts of their OWN topic only: not another user's topic (join or row), not
 * presence, not via another policy's join (`spotlight`); anon reads nothing; nobody can INSERT.
 */
let alice: Sunner;
let bob: Sunner;
beforeAll(async () => {
  [alice, bob] = await Promise.all([createSunner("noti-policy-alice", "Noti Alice"), createSunner("noti-policy-bob", "Noti Bob")]);
});
afterAll(async () => cleanupSunners([alice, bob]));

const topic = (user: Sunner) => `notifications:${user.id}`;

async function seed(tx: Tx): Promise<string[]> {
  const seeds = [
    [topic(alice), "broadcast"],
    [topic(alice), "presence"],
    [topic(bob), "broadcast"],
    ["spotlight", "broadcast"],
  ];
  const ids: string[] = [];
  for (const [name, extension] of seeds) {
    const [row] = await tx.execute<{ id: string }>(sql`
      insert into realtime.messages (topic, extension, payload, event, private)
      values (${name}, ${extension}, '{"probe":true}'::jsonb, 'notification', true) returning id::text as id`);
    ids.push(row.id);
  }
  return ids;
}

async function actAs(tx: Tx, role: "authenticated" | "anon", joinTopic: string, sub: string | null): Promise<void> {
  const claims = JSON.stringify(sub ? { sub, role, aud: role } : { role });
  await tx.execute(sql`
    select set_config('request.jwt.claims', ${claims}, true), set_config('request.jwt.claim.sub', ${sub ?? ""}, true),
           set_config('realtime.topic', ${joinTopic}, true)`);
  await tx.execute(sql.raw(`set local role ${role}`));
}

const label = (name: string) => name.replace(alice.id, "alice").replace(bob.id, "bob");

function visible(role: "authenticated" | "anon", joinTopic: string, sub: string | null): Promise<string[]> {
  return withRollback(async (tx) => {
    const ids = await seed(tx);
    await actAs(tx, role, joinTopic, sub);
    const rows = await tx.execute<{ topic: string; extension: string }>(sql`
      select topic, extension from realtime.messages where id::text in ${ids} order by topic, extension`);
    return rows.map((row) => `${label(row.topic)}/${row.extension}`);
  });
}

describe("realtime.messages policy for notifications:{user}", () => {
  it("lets a Sunner read broadcasts of their own topic only", async () => {
    expect(await visible("authenticated", topic(alice), alice.id)).toEqual(["notifications:alice/broadcast"]);
  });

  it("denies another user's topic, whether joined directly or reached from another policy's join", async () => {
    expect(await visible("authenticated", topic(bob), alice.id)).toEqual([]);
    expect(await visible("authenticated", "spotlight", alice.id)).toEqual(["spotlight/broadcast"]);
  });

  it("denies the anon role", async () => {
    expect(await visible("anon", topic(alice), null)).toEqual([]);
  });

  it.each([
    ["authenticated", true],
    ["anon", false],
  ] as const)("refuses an INSERT by %s, so no client can forge a signal", async (role, signedIn) => {
    const insert = withRollback(async (tx) => {
      await actAs(tx, role, topic(alice), signedIn ? alice.id : null);
      await tx.execute(sql`
        insert into realtime.messages (topic, extension, payload, event, private)
        values (${topic(alice)}, 'broadcast', '{"forged":true}'::jsonb, 'notification', true)`);
    });
    await expect(insert).rejects.toMatchObject({ cause: expect.objectContaining({ code: "42501" }) });
  });
});
