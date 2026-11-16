import { allKudosFeed, expect, feedWindow, highlightCarousel, kudoCard, kudoDetailPanel, seedFeedKudo, test } from "../kudos-feed/live-board-fixtures";
import {
  filterHighlightByHashtag,
  heartButton,
  HIGHLIGHT_ONLY_HASHTAGS,
  nextServerAction,
  seedHeart,
  storedHeartCount,
} from "./kudo-heart-e2e-fixtures";

/**
 * F005 hearts in the Highlight (phase 06): the carousel ranked by hearts then newest (C-19), and
 * one Kudo shown in the Highlight and in All Kudos at once keeping both copies in step after a
 * toggle (the actions do not revalidate; the copies share the last server answer). Each test
 * filters the Highlight by a hashtag reserved for it, so other specs' Kudos cannot crowd it.
 */
test.describe("hearts in the Highlight", () => {
  test("the Highlight ranks by hearts and breaks a tie with the newest Kudo", async ({ page, auth, kudoUsers, sunners }) => {
    const { slug, label } = HIGHLIGHT_ONLY_HASHTAGS.ranking;
    const pair = await kudoUsers.pair();
    const fan = await sunners.create();
    const at = feedWindow("top");
    const older = await seedFeedKudo(pair, { body: "Cũ hơn nhưng có tim", createdAt: at(1), hashtags: [slug] });
    const newer = await seedFeedKudo(pair, { body: "Mới hơn", createdAt: at(2), hashtags: [slug] });
    await seedHeart(older, fan.id);
    await auth.signIn(pair.recipient);

    const carousel = highlightCarousel(page);
    async function openFilteredHighlight() {
      await page.goto("/kudos");
      await filterHighlightByHashtag(page, label);
    }
    const rankOf = () =>
      carousel
        .locator("article[data-kudo-id]")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-kudo-id")))
        .then((ids) => ids.filter((id) => id === older || id === newer));

    await openFilteredHighlight();
    await expect.poll(rankOf).toEqual([older, newer]);

    // The viewer hearts the newer one: 1 heart each, so the newest goes first.
    await page.goto(`/kudos/${newer}`);
    const added = nextServerAction(page);
    await heartButton(kudoDetailPanel(page, newer)).click();
    await (await added).finished();
    await expect.poll(() => storedHeartCount(newer)).toBe(1);

    await openFilteredHighlight();
    await expect.poll(rankOf).toEqual([newer, older]);
    const top = heartButton(kudoCard(carousel, newer));
    await expect(top).toHaveAttribute("aria-pressed", "true");
    await expect(top).toHaveAccessibleName("1 lượt thả tim");
  });

  test("a heart given in the Highlight shows on the same Kudo in All Kudos, and taken back there shows in the Highlight", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const { slug, label } = HIGHLIGHT_ONLY_HASHTAGS.sync;
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Một Kudo, hai bản", createdAt: feedWindow("top")(), hashtags: [slug] });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");
    await filterHighlightByHashtag(page, label);

    const inHighlight = heartButton(kudoCard(highlightCarousel(page), id));
    const inFeed = heartButton(kudoCard(allKudosFeed(page), id));
    await expect(inHighlight).toHaveAttribute("aria-pressed", "false");
    await expect(inFeed).toHaveAttribute("aria-pressed", "false");
    await expect(inFeed).toHaveAccessibleName("0 lượt thả tim");

    const added = nextServerAction(page);
    await inHighlight.click();
    await (await added).finished();
    await expect(inHighlight).toHaveAccessibleName("1 lượt thả tim");
    await expect(inFeed).toHaveAttribute("aria-pressed", "true");
    await expect(inFeed).toHaveAccessibleName("1 lượt thả tim");
    await expect.poll(() => storedHeartCount(id)).toBe(1);

    const removed = nextServerAction(page);
    await inFeed.click();
    await (await removed).finished();
    await expect(inFeed).toHaveAccessibleName("0 lượt thả tim");
    await expect(inHighlight).toHaveAttribute("aria-pressed", "false");
    await expect(inHighlight).toHaveAccessibleName("0 lượt thả tim");
    await expect.poll(() => storedHeartCount(id)).toBe(0);
  });
});
