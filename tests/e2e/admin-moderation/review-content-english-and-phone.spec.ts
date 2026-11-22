import { expect, feedWindow, seedFeedKudo, test } from "../kudos-feed/live-board-fixtures";
import { bodyRows, openReview } from "./review-content-e2e-steps";

/**
 * F007 Admin › Review content smokes beyond the Vietnamese desktop view (phase 08 AC 9, decision-log
 * UI 2026-11-22): the English screen keeps "Review content" / "Export" / Public and labels the columns
 * and filters in English; at 375 px the page itself never scrolls sideways while the 960 px table
 * scrolls inside its own container. Kudos are seeded for their own sender in far-future windows.
 */
test.describe("Admin › Review content in English and at phone width", () => {
  test("renders the heading, filters, columns and pagination in English", async ({ page, context, baseURL, sunners, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    for (let index = 0; index < 11; index++) await seedFeedKudo(pair, { body: `English smoke ${index}`, createdAt: at(index) });
    await auth.signIn(await sunners.create({ admin: true }));
    await context.addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL! }]);
    await openReview(page, `?sender=${pair.sender.id}`);

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1, name: "Review content" })).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveText(["ID", "Sender", "Receiver", "Content", "Hashtag", "Heart", "Status", "Actions"]);
    await expect(page.getByRole("combobox", { name: "Sender" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Receiver" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Status/ })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search by content" })).toBeVisible();
    await expect(page.getByLabel("Start date")).toBeVisible();
    await expect(page.getByLabel("End date")).toBeVisible();
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
    await expect(bodyRows(page)).toHaveCount(10);
    await expect(bodyRows(page).getByText("Public", { exact: true })).toHaveCount(10);
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(pagination.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    await expect(pagination.getByRole("button", { name: "Next page" })).toBeVisible();
  });

  test.describe("at 375 px", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("the page has no horizontal scroll; the table scrolls inside its own container", async ({ page, sunners, auth, kudoUsers }) => {
      const pair = await kudoUsers.pair();
      const at = feedWindow("top");
      for (let index = 0; index < 2; index++) await seedFeedKudo(pair, { body: `Phone smoke ${index}`, createdAt: at(index) });
      await auth.signIn(await sunners.create({ admin: true }));
      await openReview(page, `?sender=${pair.sender.id}`);
      await expect(page.getByRole("heading", { level: 1, name: "Review content" })).toBeVisible();
      await expect(bodyRows(page)).toHaveCount(2);

      const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(pageOverflow, "horizontal page overflow at 375px").toBe(0);
      const scroller = await page.getByRole("table").evaluate((table) => {
        const box = table.parentElement!;
        return {
          overflowX: getComputedStyle(box).overflowX,
          scrolls: box.scrollWidth > box.clientWidth,
          right: box.getBoundingClientRect().right,
          viewport: document.documentElement.clientWidth,
        };
      });
      expect(scroller.overflowX).toBe("auto");
      expect(scroller.scrolls, "the table is wider than its container and scrolls inside it").toBe(true);
      expect(scroller.right).toBeLessThanOrEqual(scroller.viewport);
    });
  });
});
