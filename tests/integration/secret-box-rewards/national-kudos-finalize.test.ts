import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NationalKudosFinalizeJob } from "@/features/secret-box-rewards/server/national-kudos-finalize-job";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart } from "../kudos-hearts/kudo-heart-fixtures";
import * as fx from "./secret-box-fixtures";
import { resetSecretBoxEnv, secretBoxEnv } from "./secret-box-env-override";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * Kudos Quốc Dân (A7, ALG-003, BR-007/008, FR-406): the 5 public kudos with the most RAW hearts up to
 * NATIONAL_KUDOS_FINALIZE_AT, ties → older kudo first, written exactly once with one
 * `NationalKudosFinalized` event (sender ids internal, anonymous included). FINALIZE_AT is pinned to
 * 2000-01-01 and this file's hearts are dated 1999, so the rest of the shared DB counts 0 and drops out.
 */
const FINALIZE_AT = Date.UTC(2000, 0, 1);
const day = (n: number) => new Date(Date.UTC(1999, 0, n)).toISOString();
let named: Sunner;
let anonymous: Sunner;
let fans: Sunner[];
const k: Record<string, string> = {};

type NationalRow = { kudo_id: string; rank: number; hearts_at_finalize: number };
const nationalRows = () => testSql<NationalRow[]>`select kudo_id, rank, hearts_at_finalize from public.national_kudos order by rank`;
const finalizedEvents = () =>
  testSql<{ payload: { items: { kudoId: string; senderId: string; rank: number }[] } }[]>`
    select payload from public.domain_event_outbox where event_type = 'NationalKudosFinalized'
      and exists (select 1 from jsonb_array_elements(payload -> 'items') i where i ->> 'kudoId' = any(${Object.values(k)}::text[]))`;
const resetNationalKudos = async () => {
  await testSql`delete from public.national_kudos where kudo_id = any(${Object.values(k)}::uuid[])`;
  await testSql`
    delete from public.domain_event_outbox where event_type = 'NationalKudosFinalized'
      and exists (select 1 from jsonb_array_elements(payload -> 'items') i where i ->> 'kudoId' = any(${Object.values(k)}::text[]))`;
};

beforeAll(async () => {
  const [existing] = await testSql<{ count: number }[]>`select count(*)::int as count from public.national_kudos`;
  if (existing.count > 0) throw new Error("national_kudos already holds rows: these tests need it empty (finalized for real?)");
  [named, anonymous, ...fans] = await fx.createSunners(["sbx-nk-named", "sbx-nk-anon", "sbx-nk-a", "sbx-nk-b", "sbx-nk-c", "sbx-nk-d"]);
  const kudo = (key: string, createdDay: number, extra: { nickname?: string; status?: "spam" } = {}) =>
    insertKudo({ sender: extra.nickname ? anonymous : named, recipient: fans[0], createdAt: day(createdDay), ...extra }).then((id) => (k[key] = id));
  const hearts = async (key: string, count: number, at = day(20)) => {
    for (const fan of fans.slice(0, count)) await insertHeart(k[key], fan.id, 2, at);
  };
  await kudo("four", 1);
  await kudo("threeAnonymous", 2, { nickname: "Quạ Đen" });
  await kudo("twoNewer", 5);
  await kudo("twoOlder", 3);
  await kudo("oneOlder", 6);
  await kudo("oneNewer", 7);
  await kudo("spam", 1, { status: "spam" });
  await kudo("lateHearts", 1);
  await hearts("four", 4);
  await hearts("threeAnonymous", 3);
  await hearts("twoNewer", 2);
  await hearts("twoOlder", 2);
  await hearts("oneOlder", 1);
  await hearts("oneNewer", 1);
  await hearts("spam", 4);
  await hearts("lateHearts", 4, new Date(Date.UTC(2000, 5, 1)).toISOString());
}, 60_000);
beforeEach(async () => {
  resetSecretBoxEnv();
  secretBoxEnv.finalizeAt = FINALIZE_AT;
  await resetNationalKudos();
});
afterAll(async () => {
  await resetNationalKudos();
  await fx.cleanupSecretBoxUsers([named, anonymous, ...fans]);
  await closeAppDb();
});

describe("NationalKudosFinalizeJob.run", () => {
  it("does nothing before NATIONAL_KUDOS_FINALIZE_AT", async () => {
    expect(await NationalKudosFinalizeJob.run(new Date(FINALIZE_AT - 1))).toEqual({ status: "not_due", count: 0 });
    expect(await nationalRows()).toEqual([]);
  });

  it("finalizes the top 5 once for concurrent runs: raw hearts, older first on ties, spam and late hearts out", async () => {
    const outcomes = await Promise.all(Array.from({ length: 5 }, () => NationalKudosFinalizeJob.run(new Date())));

    expect(outcomes.filter((outcome) => outcome.status === "finalized")).toEqual([{ status: "finalized", count: 5 }]);
    expect(outcomes.filter((outcome) => outcome.status === "already_finalized")).toHaveLength(4);
    const expected = [
      [k.four, 4],
      [k.threeAnonymous, 3],
      [k.twoOlder, 2],
      [k.twoNewer, 2],
      [k.oneOlder, 1],
    ] as const;
    expect(await nationalRows()).toEqual(expected.map(([kudoId, hearts], index) => ({ kudo_id: kudoId, rank: index + 1, hearts_at_finalize: hearts })));
    const events = await finalizedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].payload.items).toEqual(
      expected.map(([kudoId], index) => ({ kudoId, senderId: kudoId === k.threeAnonymous ? anonymous.id : named.id, rank: index + 1 })),
    );
  });

  it("leaves the result unchanged on a rerun, even after a kudo is marked spam", async () => {
    await NationalKudosFinalizeJob.run(new Date());
    const first = await nationalRows();
    await testSql`update public.kudos set status = 'spam' where id = ${k.four}`;
    try {
      expect(await NationalKudosFinalizeJob.run(new Date())).toEqual({ status: "already_finalized", count: 0 });
      expect(await nationalRows()).toEqual(first);
      expect(await finalizedEvents()).toHaveLength(1);
    } finally {
      await testSql`update public.kudos set status = 'public' where id = ${k.four}`;
    }
  });
});
