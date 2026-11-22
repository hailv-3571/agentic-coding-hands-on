import { mergeTests } from "@playwright/test";
import { serviceClient } from "../../setup/local-sunner-accounts";
import { test as campaignTest } from "../admin-campaigns/campaign-e2e-fixtures";
import { expect, rewardsColumn, statValue, test as secretBoxTest } from "./secret-box-e2e-fixtures";

/**
 * The x2 flame next to "Số tim bạn nhận được:" (FR-202, Figma 2940:13489) renders only while a heart
 * campaign is live. Campaigns are global and cannot overlap: `seedActive` (F011 fixtures) waits out
 * any other live window, so during this test the seeded one is the only campaign holding "now". It
 * is deleted as soon as the badge was seen, to keep the x2 window short for parallel specs.
 */
const test = mergeTests(secretBoxTest, campaignTest);
const MINUTE = 60_000;

test("the x2 flame shows next to the hearts only while a heart campaign is live", async ({ page, auth, boxUsers, campaigns }) => {
  const pair = await boxUsers.pair();
  await auth.signIn(pair.sender);
  const column = rewardsColumn(page);
  const badge = column.getByRole("img", { name: "Tim đang được nhân đôi" });

  const name = await campaigns.seedActive("Secret Box x2", { fromNowMs: 0, toNowMs: 10 * MINUTE });
  await page.goto("/kudos");
  await expect(statValue(column, "Số tim bạn nhận được:")).toHaveText("0");
  await expect(badge).toBeVisible();

  const { error } = await serviceClient.from("campaigns").delete().eq("name", name);
  if (error) throw error;
  await page.reload();
  await expect(statValue(column, "Số tim bạn nhận được:")).toHaveText("0");
  await expect(badge).toHaveCount(0);
});
