import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listHighlightKudos } from "@/features/kudos-feed/server/kudo-highlight-query";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { HeartRankingQuery, heartCountsSubquery } from "@/features/kudos-hearts/server/heart-ranking-query";
import { db } from "@/shared/db/client";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as seed from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart } from "./kudo-heart-fixtures";

/**
 * HeartRankingQuery (C-19): raw heart count DESC, created_at DESC, id DESC over any public-kudo
 * candidate subquery, optionally cut at `asOf`; the Highlight carousel (phase 05 seam) ranks by it
 * and every card carries the real raw count. Multipliers never change the rank (D003).
 */
let sender: Sunner;
let fans: Sunner[];
let tagId: string;
let duelTagId: string;
const k: Record<string, string> = {};
const at = (seconds: number) => new Date(Date.UTC(2025, 5, 1, 0, 0, seconds)).toISOString();
const OLD = at(0);
const RECENT = at(100);

beforeAll(async () => {
  [sender, ...fans] = await Promise.all(
    ["rank-sender", "rank-a", "rank-b", "rank-c", "rank-d", "rank-e"].map((prefix) => createSunner(prefix, prefix)),
  );
  [{ id: tagId }, { id: duelTagId }] = await seed.createProbeHashtags(2);
  const kudo = (createdAt: string, extra: Partial<seed.SeedKudo> = {}) =>
    seed.insertKudo({ sender, recipient: fans[0], hashtagIds: [tagId], createdAt, ...extra });
  k.three = await kudo(at(5));
  k.twoNewer = await kudo(at(20), { nickname: "Ẩn Danh" });
  k.twoOlderWeighted = await kudo(at(10));
  [k.tieX, k.tieY] = [await kudo(at(1)), await kudo(at(1))];
  k.none = await kudo(at(30));
  k.spam = await kudo(at(40), { status: "spam" });
  k.duelTwoSingle = await kudo(at(50), { hashtagIds: [duelTagId] });
  k.duelOneDouble = await kudo(at(60), { hashtagIds: [duelTagId] });
  for (const fan of fans.slice(0, 3)) await insertHeart(k.three, fan.id, 1, fan === fans[0] ? OLD : RECENT);
  for (const fan of fans.slice(0, 2)) await insertHeart(k.twoNewer, fan.id, 1, OLD);
  for (const fan of fans.slice(0, 2)) await insertHeart(k.twoOlderWeighted, fan.id, 2, OLD);
  await insertHeart(k.tieX, fans[0].id, 1, OLD);
  await insertHeart(k.tieY, fans[0].id, 1, OLD);
  for (const fan of fans) await insertHeart(k.spam, fan.id, 1, OLD);
  for (const fan of fans.slice(0, 2)) await insertHeart(k.duelTwoSingle, fan.id, 1, OLD);
  await insertHeart(k.duelOneDouble, fans[0].id, 2, OLD);
});
afterAll(async () => {
  await cleanupSunners([sender, ...fans]);
  await seed.deleteProbeHashtags([tagId, duelTagId]);
  await closeAppDb();
});

const tieOrder = () => [k.tieX, k.tieY].sort().reverse();
const candidates = () => KudoPublicQuery.publicKudoIdsSubquery({ hashtagId: tagId });

describe("HeartRankingQuery.rankKudoIds", () => {
  it("orders by raw count DESC, then created_at DESC, then id DESC, and drops non-candidates (spam)", async () => {
    expect(await HeartRankingQuery.rankKudoIds(candidates(), 10)).toEqual([
      k.three,
      k.twoNewer,
      k.twoOlderWeighted,
      ...tieOrder(),
      k.none,
    ]);
  });

  it("applies the limit after ranking", async () => {
    expect(await HeartRankingQuery.rankKudoIds(candidates(), 2)).toEqual([k.three, k.twoNewer]);
  });

  it("counts only hearts created up to asOf", async () => {
    const ranked = await HeartRankingQuery.rankKudoIds(candidates(), 10, { asOf: new Date(OLD) });
    expect(ranked).toEqual([k.twoNewer, k.twoOlderWeighted, k.three, ...tieOrder(), k.none]);
  });

  it("breaks ties oldest first with tieBreak 'oldest' (Kudos Quốc Dân, BR-008), default unchanged", async () => {
    expect(await HeartRankingQuery.rankKudoIds(candidates(), 10, { tieBreak: "oldest" })).toEqual([
      k.three,
      k.twoOlderWeighted,
      k.twoNewer,
      ...tieOrder().reverse(),
      k.none,
    ]);
    expect(await HeartRankingQuery.rankKudoIds(candidates(), 10, { tieBreak: "newest" })).toEqual(
      await HeartRankingQuery.rankKudoIds(candidates(), 10),
    );
  });

  it("puts two x1 hearts above one x2 heart: the raw count ranks, not the multiplier sum (D003)", async () => {
    // Both sum to 2, so ranking by the sum would tie and put the newer x2 kudo first.
    const duel = KudoPublicQuery.publicKudoIdsSubquery({ hashtagId: duelTagId });
    expect(await HeartRankingQuery.rankKudoIds(duel, 10)).toEqual([k.duelTwoSingle, k.duelOneDouble]);
  });
});

describe("heartCountsSubquery", () => {
  it("is the (kudoId, rawCount) fragment other queries join, counting only the given kudos", async () => {
    // No outer filter: any other hearted kudo in the table would show up if the bound leaked.
    const counts = heartCountsSubquery([k.three, k.twoOlderWeighted, k.spam, k.none]);
    const rows = await db.select({ kudoId: counts.kudoId, rawCount: counts.rawCount }).from(counts);
    expect(Object.fromEntries(rows.map((row) => [row.kudoId, row.rawCount]))).toEqual({
      [k.three]: 3,
      [k.twoOlderWeighted]: 2,
      [k.spam]: 5,
    });
  });
});

describe("Highlight and feed cards (phase 05 heart seam)", () => {
  it("ranks the Highlight by hearts and shows the raw count and the viewer's heart on each card", async () => {
    const { items, total } = await listHighlightKudos({ viewerId: fans[2].id, locale: "vi", hashtagId: tagId });
    expect(items.map((item) => item.id)).toEqual([k.three, k.twoNewer, k.twoOlderWeighted, ...tieOrder()]);
    expect(items.map((item) => [item.heartCount, item.heartedByMe])).toEqual([
      [3, true],
      [2, false],
      [2, false],
      [1, false],
      [1, false],
    ]);
    expect(total).toBe(5);
    expect(items[1].sender).toEqual({ anonymous: true, nickname: "Ẩn Danh" });
    expect(JSON.stringify(items[1])).not.toContain(sender.id);
  });

  it("enriches feed cards with the real summary", async () => {
    const { items } = await KudoPublicQuery.list({ viewerId: fans[0].id, locale: "vi", hashtagId: tagId });
    const byId = new Map(items.map((item) => [item.id, item]));
    expect(byId.get(k.twoOlderWeighted)).toMatchObject({ heartCount: 2, heartedByMe: true });
    expect(byId.get(k.none)).toMatchObject({ heartCount: 0, heartedByMe: false });
  });
});
