import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SpotlightSnapshot } from "@/features/spotlight-board/schemas/spotlight-views";
import { SpotlightSnapshotQuery } from "@/features/spotlight-board/server/spotlight-snapshot-query";
import { NAME_CLOUD_MAX, TICKER_HISTORY_ON_LOAD } from "@/features/spotlight-board/spotlight-config";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * SpotlightSnapshotQuery (A1, BR-001/003, US001) on the shared local DB: the cloud's top names and
 * the total count public kudos only, ties break on recipient id, the ticker preload is the latest
 * public kudos oldest first, and no shape carries a sender. Test recipients are pushed above every
 * existing name (counts relative to the current leader), so the assertions hold on any data set.
 */
let sender: Sunner;
let leader: Sunner;
let tiedA: Sunner;
let tiedB: Sunner;
let spamOnly: Sunner;
let before: SpotlightSnapshot;
let after: SpotlightSnapshot;
let lead: number;
let latest: string[];

/** `count` committed kudos, created a day ago (so they never reach the ticker preload). */
async function seed(recipient: Sunner, count: number, status: "public" | "spam") {
  await testSql`
    insert into public.kudos (sender_id, recipient_id, body, is_anonymous, anonymous_nickname, status, created_at)
    select ${sender.id}, ${recipient.id}, 'Spotlight seed', true, 'Bí Danh', ${status}::public.kudo_status, now() - interval '1 day'
    from generate_series(1, ${count})`;
}

/** One committed kudo `minutes` in the future: the newest rows of the whole table. */
async function future(recipient: Sunner, minutes: number, status: "public" | "spam" = "public"): Promise<string> {
  const [row] = await testSql<{ id: string }[]>`
    insert into public.kudos (sender_id, recipient_id, body, status, created_at)
    values (${sender.id}, ${recipient.id}, 'Spotlight latest', ${status}::public.kudo_status, now() + make_interval(mins => ${minutes}))
    returning id`;
  return row.id;
}

beforeAll(async () => {
  [sender, leader, tiedA, tiedB, spamOnly] = await Promise.all([
    createSunner("spot-snap-sender", "Spot Snap Sender"),
    createSunner("spot-snap-leader", "Spot Snap Leader"),
    createSunner("spot-snap-tied-a", "Spot Snap Tied A"),
    createSunner("spot-snap-tied-b", "Spot Snap Tied B"),
    createSunner("spot-snap-spam", "Spot Snap Spam Only"),
  ]);
  before = await SpotlightSnapshotQuery.load();
  lead = before.names[0]?.count ?? 0;
  await seed(leader, lead + 3, "public");
  await seed(leader, 2, "spam");
  await seed(tiedA, lead + 2, "public");
  await seed(tiedB, lead + 3, "public");
  await seed(spamOnly, lead + 9, "spam");
  latest = [await future(tiedA, 30), await future(leader, 31)];
  await future(spamOnly, 32, "spam");
  after = await SpotlightSnapshotQuery.load();
}, 60_000);
afterAll(async () => {
  await cleanupSunners([sender, leader, tiedA, tiedB, spamOnly]);
  await closeAppDb();
});

describe("SpotlightSnapshotQuery", () => {
  it("counts public kudos only, all time (spam never adds to the total)", async () => {
    const [row] = await testSql<{ total: number }[]>`select count(*)::int as total from public.kudos where status = 'public'`;
    expect(after.total).toBe(row.total);
    expect(after.total - before.total).toBe(3 * lead + 10);
  });

  it("ranks names by public count desc then recipient id asc, capped at NAME_CLOUD_MAX, spam excluded", () => {
    const tied = [tiedA, tiedB].sort((a, b) => a.id.localeCompare(b.id));
    expect(after.names.slice(0, 3)).toEqual([
      { recipientId: leader.id, name: leader.fullName, count: lead + 4 },
      ...tied.map((sunner) => ({ recipientId: sunner.id, name: sunner.fullName, count: lead + 3 })),
    ]);
    expect(after.names.length).toBeLessThanOrEqual(NAME_CLOUD_MAX);
    expect(after.names.some((name) => name.recipientId === spamOnly.id)).toBe(false);
    const counts = after.names.map((name) => name.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it("preloads the latest public kudos for the ticker, oldest first, never a spam one", () => {
    expect(after.recent).toHaveLength(TICKER_HISTORY_ON_LOAD);
    expect(after.recent.slice(-2)).toEqual([
      { kudoId: latest[0], recipientId: tiedA.id, recipientName: tiedA.fullName, occurredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) },
      { kudoId: latest[1], recipientId: leader.id, recipientName: leader.fullName, occurredAt: expect.any(String) },
    ]);
    const times = after.recent.map((item) => item.occurredAt);
    expect(times).toEqual([...times].sort());
  });

  it("carries no sender column, id or nickname anywhere in the snapshot (BR-003)", () => {
    expect(Object.keys(after).sort()).toEqual(["names", "recent", "total"]);
    for (const name of after.names) expect(Object.keys(name).sort()).toEqual(["count", "name", "recipientId"]);
    for (const item of after.recent) expect(Object.keys(item).sort()).toEqual(["kudoId", "occurredAt", "recipientId", "recipientName"]);
    const serialized = JSON.stringify(after);
    for (const secret of [sender.id, sender.fullName, "Bí Danh"]) expect(serialized).not.toContain(secret);
  });
});
