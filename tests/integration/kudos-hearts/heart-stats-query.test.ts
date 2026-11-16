import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { HeartStatsQuery } from "@/features/kudos-hearts/server/heart-stats-query";
import { KudoHeartQuery } from "@/features/kudos-hearts/server/kudo-heart-query";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import * as hearts from "./kudo-heart-fixtures";

/**
 * HeartStatsQuery (C-02, C-11, SC-004): hearts RECEIVED = hearts on kudos the user SENT,
 * anonymous included, spam excluded at query time, cut at `asOf`; weighted = Σ multiplier.
 * KudoHeartQuery.summaryForKudos (A3): raw count + heartedByMe per kudo, zero-filled.
 */
let sender: Sunner;
let sender2: Sunner;
let fanA: Sunner;
let fanB: Sunner;
let nobody: Sunner;
const k: Record<string, string> = {};
const campaignIds: number[] = [];
const UNKNOWN_ID = "9b2f7c1e-4d3a-4b5c-8d6e-7f8091a2b3c4";
const at = (seconds: number) => new Date(Date.UTC(2025, 5, 1, 0, 0, seconds)).toISOString();

beforeAll(async () => {
  [sender, sender2, fanA, fanB, nobody] = await Promise.all(
    ["stats-sender", "stats-sender2", "stats-fan-a", "stats-fan-b", "stats-nobody"].map((p) => createSunner(p, p)),
  );
  k.named = await insertKudo({ sender, recipient: fanB });
  k.anonymous = await insertKudo({ sender, recipient: fanB, nickname: "Cú Mèo" });
  k.spam = await insertKudo({ sender, recipient: fanB, status: "spam" });
  k.other = await insertKudo({ sender: sender2, recipient: fanB });
  await hearts.insertHeart(k.named, fanA.id, 1, at(10));
  await hearts.insertHeart(k.named, fanB.id, 2, at(20));
  await hearts.insertHeart(k.anonymous, fanA.id, 2, at(30));
  await hearts.insertHeart(k.spam, fanA.id, 1, at(40));
  await hearts.insertHeart(k.spam, fanB.id, 1, at(50));
  await hearts.insertHeart(k.other, fanA.id, 1, at(60));
});
afterEach(async () => {
  await hearts.deleteCampaigns(campaignIds.splice(0));
  await testSql`update public.kudos set status = 'spam' where id = ${k.spam}`;
});
afterAll(async () => {
  await cleanupSunners([sender, sender2, fanA, fanB, nobody]);
  await closeAppDb();
});

const stats = (weightedTotal: number, rawTotal: number, campaignActive = false) => ({ weightedTotal, rawTotal, campaignActive });

describe("HeartStatsQuery.receivedByUsers", () => {
  it("sums multipliers over the public kudos each user sent (anonymous included), zero-filling the rest", async () => {
    const result = await HeartStatsQuery.receivedByUsers([sender.id, sender2.id, nobody.id]);
    expect(Object.fromEntries(result)).toEqual({
      [sender.id]: stats(5, 3),
      [sender2.id]: stats(1, 1),
      [nobody.id]: stats(0, 0),
    });
  });

  it("ignores hearts created after asOf (inclusive cut)", async () => {
    const result = await HeartStatsQuery.receivedByUsers([sender.id], new Date(at(20)));
    expect(result.get(sender.id)).toEqual(stats(3, 2));
  });

  it("stops counting a kudo marked spam and counts it again after Un Spam", async () => {
    await testSql`update public.kudos set status = 'public' where id = ${k.spam}`;
    expect((await HeartStatsQuery.receivedByUsers([sender.id])).get(sender.id)).toEqual(stats(7, 5));
  });

  it("flags campaignActive while an x2 campaign runs", async () => {
    campaignIds.push(await hearts.insertActiveCampaign());
    expect(await HeartStatsQuery.receivedByUser(sender.id)).toEqual(stats(5, 3, true));
  });

  it("returns an empty map for no users", async () => {
    expect((await HeartStatsQuery.receivedByUsers([])).size).toBe(0);
  });
});

describe("KudoHeartQuery.summaryForKudos", () => {
  it("returns the raw count (never multiplied) and heartedByMe for the viewer, zero-filled", async () => {
    const forFanA = await KudoHeartQuery.summaryForKudos([k.named, k.anonymous, k.spam, UNKNOWN_ID], fanA.id);
    expect(Object.fromEntries(forFanA)).toEqual({
      [k.named]: { heartCount: 2, heartedByMe: true },
      [k.anonymous]: { heartCount: 1, heartedByMe: true },
      [k.spam]: { heartCount: 2, heartedByMe: true },
      [UNKNOWN_ID]: { heartCount: 0, heartedByMe: false },
    });
    const forNobody = await KudoHeartQuery.summaryForKudos([k.named, k.anonymous], nobody.id);
    expect([...forNobody.values()]).toEqual([
      { heartCount: 2, heartedByMe: false },
      { heartCount: 1, heartedByMe: false },
    ]);
  });

  it("returns an empty map for no kudos", async () => {
    expect((await KudoHeartQuery.summaryForKudos([], fanA.id)).size).toBe(0);
  });
});
