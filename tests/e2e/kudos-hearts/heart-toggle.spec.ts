import { allKudosFeed, expect, feedWindow, kudoCard, kudoDetailPanel, seedFeedKudo, test } from "../kudos-feed/live-board-fixtures";
import {
  countServerActions,
  failServerActions,
  heartButton,
  markKudoSpam,
  nextServerAction,
  seedHeart,
  storedHeartCount,
} from "./kudo-heart-e2e-fixtures";

/**
 * F005 heart button (phase 06) on the feed card and the detail panel: optimistic toggle with the
 * raw count (D003), one heart per Sunner even on a double click (FR-001/FR-403), the sender's
 * disabled heart with its reason (DEC-001, FR-405), and revert + toast when the server refuses or
 * the network fails (FR-401). The Highlight cases live in heart-highlight-ranking-and-sync.spec.ts.
 */
const SELF_HEART = "Bạn không thể thả tim cho Kudo của mình";

test.describe("heart button", () => {
  test("hearting and unhearting update the count at once and persist, on the card and the detail panel", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Thả tim cho mình nhé", createdAt: feedWindow("top")() });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    const heart = heartButton(kudoCard(allKudosFeed(page), id));
    await expect(heart).toHaveAttribute("aria-pressed", "false");
    await expect(heart).toHaveAccessibleName("0 lượt thả tim");

    const added = nextServerAction(page);
    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await expect(heart).toHaveAccessibleName("1 lượt thả tim");
    await (await added).finished();
    await expect.poll(() => storedHeartCount(id)).toBe(1);

    await page.reload();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await expect(heart).toHaveAccessibleName("1 lượt thả tim");

    const removed = nextServerAction(page);
    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "false");
    await expect(heart).toHaveAccessibleName("0 lượt thả tim");
    await (await removed).finished();
    await expect.poll(() => storedHeartCount(id)).toBe(0);

    // A double click toggles once: the second click lands while the first is pending.
    const doubled = nextServerAction(page);
    await heart.dblclick();
    await (await doubled).finished();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await expect(heart).toHaveAccessibleName("1 lượt thả tim");
    await expect.poll(() => storedHeartCount(id)).toBe(1);

    await page.goto(`/kudos/${id}`);
    const detailHeart = heartButton(kudoDetailPanel(page, id));
    await expect(detailHeart).toHaveAttribute("aria-pressed", "true");
    const takenBack = nextServerAction(page);
    await detailHeart.click();
    await expect(detailHeart).toHaveAccessibleName("0 lượt thả tim");
    await (await takenBack).finished();
    await expect.poll(() => storedHeartCount(id)).toBe(0);
  });

  test("the sender's own Kudo (anonymous too) shows a disabled heart with the reason and sends nothing", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    const named = await seedFeedKudo(pair, { body: "Kudo của chính tôi", createdAt: at(1) });
    const anonymous = await seedFeedKudo(pair, { body: "Kudo ẩn danh của tôi", createdAt: at(2), anonymousNickname: "Mèo Ẩn" });
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    const posts = countServerActions(page);

    for (const id of [named, anonymous]) {
      const card = kudoCard(allKudosFeed(page), id);
      const heart = heartButton(card);
      await expect(heart).toHaveAttribute("aria-disabled", "true");
      await expect(heart).toHaveAccessibleDescription(SELF_HEART);
      await expect(card.getByRole("tooltip")).toBeHidden();
      await heart.hover();
      await expect(card.getByRole("tooltip")).toHaveText(SELF_HEART);
      await expect(card.getByRole("tooltip")).toBeVisible();
      // WCAG 1.4.13: Esc hides the tooltip while the pointer stays on the heart. The CSS hover works
      // from the server HTML, but Esc is a document listener: a press before hydration is not replayed.
      await expect(async () => {
        await page.keyboard.press("Escape");
        await expect(card.getByRole("tooltip")).toBeHidden({ timeout: 1_000 });
      }).toPass({ timeout: 10_000 });
      await heart.click({ force: true });
      await expect(heart).toHaveAttribute("aria-pressed", "false");
      await expect(heart).toHaveAccessibleName("0 lượt thả tim");
    }
    await page.goto(`/kudos/${named}`);
    const detailHeart = heartButton(kudoDetailPanel(page, named));
    await expect(detailHeart).toHaveAttribute("aria-disabled", "true");
    // A touch tap brings no hover and (on iOS) no focus: pressing the heart shows the reason in the toast.
    await detailHeart.click({ force: true });
    await expect(page.getByRole("alert").filter({ hasText: SELF_HEART })).toBeVisible();
    expect(posts()).toBe(0);
    expect(await storedHeartCount(named)).toBe(0);
  });

  test("a refused or failed toggle reverts the heart and shows why", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    const turnsSpam = await seedFeedKudo(pair, { body: "Sắp bị đánh dấu spam", createdAt: at(1) });
    const alreadyHearted = await seedFeedKudo(pair, { body: "Đã thả tim từ trước", createdAt: at(2) });
    await seedHeart(alreadyHearted, pair.recipient.id);
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    // Marked spam by an admin while this page is open → "Kudo này không còn khả dụng".
    const spamHeart = heartButton(kudoCard(allKudosFeed(page), turnsSpam));
    await expect(spamHeart).toHaveAttribute("aria-pressed", "false");
    await markKudoSpam(turnsSpam);
    const refused = nextServerAction(page);
    await spamHeart.click();
    await (await refused).finished();
    await expect(page.getByRole("alert").filter({ hasText: "Kudo này không còn khả dụng" })).toBeVisible();
    await expect(spamHeart).toHaveAttribute("aria-pressed", "false");
    await expect(spamHeart).toHaveAccessibleName("0 lượt thả tim");
    expect(await storedHeartCount(turnsSpam)).toBe(0);

    // Offline while taking a heart back → back to hearted, "Không thể cập nhật, vui lòng thử lại".
    const heart = heartButton(kudoCard(allKudosFeed(page), alreadyHearted));
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await failServerActions(page);
    await heart.click();
    await expect(page.getByRole("alert").filter({ hasText: "Không thể cập nhật, vui lòng thử lại" })).toBeVisible();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await expect(heart).toHaveAccessibleName("1 lượt thả tim");
    expect(await storedHeartCount(alreadyHearted)).toBe(1);
  });
});
