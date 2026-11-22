import type { Locator, Page } from "@playwright/test";
import { allKudosFeed, expect, feedWindow, kudoCard, kudoDetailPanel, seedFeedKudo, test } from "../kudos-feed/live-board-fixtures";

/**
 * The author's own spam Kudo (F007 FR-301/302, D012, decision-log 2026-11-22): on the Live board and
 * on its detail page it carries the orange "Spam" tag and the blurred, non-closable Alert Overlay
 * "Cảnh báo vi phạm tiêu chuẩn cộng đồng"; its text stays in the DOM; hearts, Copy Link and the pen
 * are gone. Everyone else gets the uniform not-found page and never sees it on the Live board (C-17).
 */
const WARNING = "Cảnh báo vi phạm tiêu chuẩn cộng đồng";
const NOT_FOUND_COPY = "Kudo này không tồn tại hoặc đã bị gỡ.";

/** True when the point at the centre of `target` belongs to the overlay (the content is not clickable). */
async function coveredByOverlay(page: Page, target: Locator): Promise<boolean> {
  const box = await target.boundingBox();
  if (!box) throw new Error("target is not rendered");
  return page.evaluate(
    ({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('[role="note"]')),
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
}

/**
 * Every element Tab reaches from the top of the page, in order, until focus wraps around or leaves
 * the page; `inside` says whether it sits in `scope` (a CSS selector).
 */
async function tabStops(page: Page, scope: string): Promise<{ inside: boolean; name: string }[]> {
  const stops: { inside: boolean; name: string }[] = [];
  for (let press = 0; press < 100; press++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate((selector) => {
      const element = document.activeElement;
      if (!element || element === document.body || element.hasAttribute("data-tab-seen")) return null;
      element.setAttribute("data-tab-seen", "");
      const name = element.getAttribute("aria-label") ?? element.textContent ?? "";
      return { inside: element.closest(selector) !== null, name: name.trim() };
    }, scope);
    if (!stop) break;
    stops.push(stop);
  }
  return stops;
}

async function expectOwnSpamView(page: Page, scope: Locator, body: string) {
  await expect(scope.getByRole("note")).toContainText(WARNING);
  await expect(scope.getByText("Spam", { exact: true })).toBeVisible();
  await expect(scope.getByText(body)).toHaveCount(1);
  expect(await coveredByOverlay(page, scope.getByText(body))).toBe(true);
  await expect(scope.getByRole("button")).toHaveCount(0);
}

test.describe("Owner's spam Kudo", () => {
  test("the author sees it blurred under the warning on its detail page, with only Đóng left usable", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const body = "Kudo của tôi bị tạm ẩn";
    const id = await seedFeedKudo(pair, { body, title: "Người truyền lửa", createdAt: feedWindow("top")(), status: "spam" });
    await auth.signIn(pair.sender);
    await page.goto(`/kudos/${id}`);

    const detail = kudoDetailPanel(page, id);
    await expectOwnSpamView(page, detail, body);
    await detail.getByRole("link", { name: "Đóng" }).click();
    await expect(page).toHaveURL(/\/kudos$/);
  });

  // Review W1 (WCAG 2.4.11): nothing under the blur takes keyboard focus; its text stays readable.
  test("Tab never lands inside the blurred Kudo except on Đóng, and its content stays readable", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, {
      body: "Kudo bị ẩn, xem [bài viết gốc](https://example.com/spam)",
      createdAt: feedWindow("top")(),
      status: "spam",
      images: 1,
    });
    await auth.signIn(pair.sender);
    await page.goto(`/kudos/${id}`);
    const detail = kudoDetailPanel(page, id);
    await expect(detail.getByRole("note")).toContainText(WARNING);

    // "Đóng" is the last element of the panel, so reaching it means Tab walked the whole Kudo.
    const stops = await tabStops(page, `article[data-kudo-id="${id}"]`);
    expect(stops.filter((stop) => stop.inside).map((stop) => stop.name)).toEqual(["Đóng"]);
    // Still in the accessibility tree for screen readers: people, the body link and the image.
    await expect(detail.getByText(pair.sender.fullName)).toHaveCount(1);
    await expect(detail.getByText(pair.recipient.fullName)).toHaveCount(1);
    await expect(detail.getByRole("link", { name: "bài viết gốc" })).toHaveCount(1);
    await expect(detail.getByRole("img", { name: "Ảnh đính kèm 1" })).toHaveCount(1);
  });

  // Decision 2026-11-22: the Live board never lists spam, not even the author's own (phase 05 design);
  // the author reaches it through its detail page now and the Profile "Đã gửi" tab in phase 12.
  test("the author does not see it on the Live board", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const body = "Bài của tôi trên Live board";
    const at = feedWindow("top");
    const id = await seedFeedKudo(pair, { body, createdAt: at(), status: "spam" });
    // Control: a public Kudo by the same author proves the feed loaded and lists this author.
    const publicId = await seedFeedKudo(pair, { body: "Bài công khai của tôi", createdAt: at() });
    await auth.signIn(pair.sender);
    await page.goto("/kudos");

    await expect(kudoCard(allKudosFeed(page), publicId)).toBeVisible();
    await expect(kudoCard(allKudosFeed(page), id)).toHaveCount(0);
  });

  test("another Sunner gets the not-found page and never sees it on the Live board", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const body = "Không ai khác được thấy";
    const id = await seedFeedKudo(pair, { body, createdAt: feedWindow("top")(), status: "spam" });
    await auth.signIn(pair.recipient);

    await page.goto(`/kudos/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: NOT_FOUND_COPY })).toBeVisible();
    await expect(page.getByText(body)).toHaveCount(0);

    await page.goto("/kudos");
    await expect(allKudosFeed(page)).toBeVisible();
    await expect(kudoCard(allKudosFeed(page), id)).toHaveCount(0);
  });
});
