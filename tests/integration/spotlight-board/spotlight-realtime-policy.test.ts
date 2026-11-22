import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import type { Tx } from "./spotlight-message-fixtures";

/**
 * RLS on the Supabase system table `realtime.messages` (A0, C-20 sanctioned exception): Realtime
 * authorizes a private channel join by reading this table as the client's role with
 * `realtime.topic` set. One SELECT policy, `authenticated` only, topic `spotlight`, broadcast only;
 * no INSERT policy, so no client can forge a spotlight event; other topics gain nothing.
 * Every probe runs inside a transaction that is rolled back.
 */
let viewer: Sunner;
beforeAll(async () => {
  viewer = await createSunner("spot-policy-viewer", "Spot Policy Viewer");
});
afterAll(async () => cleanupSunners([viewer]));

const SEEDS = [
  ["spotlight", "broadcast"],
  ["spotlight", "presence"],
  ["notifications:probe", "broadcast"],
  ["spotlight-copy", "broadcast"],
] as const;

/** Seeds one private message per (topic, extension) as the server role; returns their ids. */
async function seedMessages(tx: Tx): Promise<string[]> {
  const ids: string[] = [];
  for (const [topic, extension] of SEEDS) {
    const [row] = await tx.execute<{ id: string }>(sql`
      insert into realtime.messages (topic, extension, payload, event, private)
      values (${topic}, ${extension}, '{"probe":true}'::jsonb, 'kudo', true) returning id::text as id`);
    ids.push(row.id);
  }
  return ids;
}

/** Switches the transaction to a client role exactly as Realtime does before its checks. */
async function actAs(tx: Tx, role: "authenticated" | "anon", topic: string, sub: string | null): Promise<void> {
  const claims = JSON.stringify(sub ? { sub, role, aud: role } : { role });
  await tx.execute(sql`
    select set_config('request.jwt.claims', ${claims}, true), set_config('request.jwt.claim.sub', ${sub ?? ""}, true),
           set_config('realtime.topic', ${topic}, true)`);
  await tx.execute(sql.raw(`set local role ${role}`));
}

async function visibleTo(role: "authenticated" | "anon", topic: string, sub: string | null): Promise<string[]> {
  return withRollback(async (tx) => {
    const ids = await seedMessages(tx);
    await actAs(tx, role, topic, sub);
    const rows = await tx.execute<{ topic: string; extension: string }>(sql`
      select topic, extension from realtime.messages where id::text in ${ids} order by topic, extension`);
    return rows.map((row) => `${row.topic}/${row.extension}`);
  });
}

function insertAs(role: "authenticated" | "anon", sub: string | null) {
  return withRollback(async (tx) => {
    await actAs(tx, role, "spotlight", sub);
    await tx.execute(sql`
      insert into realtime.messages (topic, extension, payload, event, private)
      values ('spotlight', 'broadcast', '{"type":"added"}'::jsonb, 'kudo', true)`);
  });
}

describe("realtime.messages policy for topic spotlight", () => {
  it("lets an authenticated Sunner read spotlight broadcasts only (not presence, not other topics)", async () => {
    expect(await visibleTo("authenticated", "spotlight", viewer.id)).toEqual(["spotlight/broadcast"]);
  });

  it("grants nothing on other topics (phase 13 `notifications:*` stays independent)", async () => {
    expect(await visibleTo("authenticated", "notifications:probe", viewer.id)).toEqual([]);
    expect(await visibleTo("authenticated", "spotlight-copy", viewer.id)).toEqual([]);
  });

  it("denies the anon role", async () => {
    expect(await visibleTo("anon", "spotlight", null)).toEqual([]);
  });

  it.each([
    ["authenticated", "viewer"],
    ["anon", null],
  ] as const)("refuses an INSERT by %s, so no client can forge a spotlight event", async (role, who) => {
    await expect(insertAs(role, who ? viewer.id : null)).rejects.toMatchObject({
      cause: expect.objectContaining({ code: "42501" }),
    });
  });

  it("is the only spotlight policy: SELECT, authenticated, scoped to topic + broadcast", async () => {
    const policies = await testSql<{ policyname: string; cmd: string; roles: string[]; qual: string; with_check: string | null }[]>`
      select policyname, cmd, roles::text[] as roles, qual, with_check from pg_policies
      where schemaname = 'realtime' and tablename = 'messages' and coalesce(qual, '') || coalesce(with_check, '') like '%spotlight%'`;
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatchObject({ policyname: "spotlight_authenticated_read", cmd: "SELECT", roles: ["authenticated"], with_check: null });
    expect(policies[0].qual).toContain("realtime.topic()");
    expect(policies[0].qual).toContain("'broadcast'");
    expect(policies[0].qual).toContain("(topic = 'spotlight'"); // the row's own topic, not only the join's
  });
});
