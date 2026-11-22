import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PersonalRewardStatsQuery } from "@/features/secret-box-rewards/server/personal-reward-stats-query";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { deleteCampaigns, insertActiveCampaign, insertHeart } from "../kudos-hearts/kudo-heart-fixtures";
import * as fx from "./secret-box-fixtures";
import { resetSecretBoxEnv } from "./secret-box-env-override";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * PersonalRewardStatsQuery (A5, FR-201..203, D011): public kudos received/sent (anonymous counted for
 * the sender, spam excluded), weighted hearts + the x2 flag, opened/unopened boxes — after a reconcile,
 * so the counts already include a box earned since the last visit.
 */
let me: Sunner;
let peer: Sunner;
let fans: Sunner[];
const campaignIds: number[] = [];

beforeAll(async () => {
  [me, peer, ...fans] = await fx.createSunners(["sbx-stats-me", "sbx-stats-peer", "sbx-stats-fan-a", "sbx-stats-fan-b"]);
  const sent = await insertKudo({ sender: me, recipient: peer });
  const sentAnonymously = await insertKudo({ sender: me, recipient: peer, nickname: "Bí Ẩn" });
  await insertKudo({ sender: me, recipient: peer, status: "spam" });
  await insertKudo({ sender: peer, recipient: me });
  await insertKudo({ sender: peer, recipient: me, status: "spam" });
  await insertHeart(sent, fans[0].id, 2);
  await insertHeart(sent, fans[1].id, 2);
  await insertHeart(sentAnonymously, fans[0].id, 2); // weighted 6 → 1 box
});
beforeEach(async () => {
  resetSecretBoxEnv();
  await fx.resetRewards([me.id]);
});
afterAll(async () => {
  await deleteCampaigns(campaignIds.splice(0));
  await fx.cleanupSecretBoxUsers([me, peer, ...fans]);
  await closeAppDb();
});

describe("PersonalRewardStatsQuery.forUser", () => {
  it("reconciles, then counts public kudos, weighted hearts and boxes by status", async () => {
    expect(await PersonalRewardStatsQuery.forUser(me.id)).toEqual({
      kudosReceived: 1,
      kudosSent: 2,
      heartsReceived: 6,
      campaignActive: false,
      boxesOpened: 0,
      boxesUnopened: 1,
    });
  });

  it("splits opened from unopened boxes and flags an active x2 campaign", async () => {
    await fx.grantBoxes(me.id, 2);
    await testSql`
      update public.secret_boxes set status = 'opened', opened_at = now(), open_request_id = gen_random_uuid(),
        prize_id = (select id from public.secret_box_prizes where kind = 'icon' limit 1)
      where user_id = ${me.id} and seq = 1`;
    campaignIds.push(await insertActiveCampaign("Stats x2"));
    expect(await PersonalRewardStatsQuery.forUser(me.id)).toMatchObject({ campaignActive: true, boxesOpened: 1, boxesUnopened: 1 });
  });
});
