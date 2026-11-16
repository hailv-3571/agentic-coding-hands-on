import { allKudosFeed, expect, feedWindow, highlightCarousel, kudoCard, seedFeedKudo, test } from "./live-board-fixtures";

/**
 * F004 Live board `/kudos` (phase 05): session gate (FR-601), All Kudos newest first with cursor
 * "Tải thêm" (D003), Highlight hashtag filter resetting the carousel (BR-002), the anonymous card
 * (DEC-001; FR-602: the sender never reaches the browser, RSC payload included) and the composer
 * launcher moved here from the placeholder home.
 */
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

test.describe("guest", () => {
  test("is redirected to /login from the Live board and from a Kudo detail", async ({ page }) => {
    await page.goto("/kudos");
    await expect(page).toHaveURL(/\/login\?next=%2Fkudos$/);
    await page.goto(`/kudos/${MISSING_ID}`);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=%2Fkudos%2F${MISSING_ID}$`));
  });
});

test.describe("Live board", () => {
  test("All Kudos lists newest first; Tải thêm appends older pages and disappears at the end", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("low");
    const seeded: string[] = [];
    for (let index = 0; index < 12; index += 1) {
      seeded.push(await seedFeedKudo(pair, { body: `Kudo số ${index}`, createdAt: at(index) }));
    }
    const newestFirst = [...seeded].reverse();
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    const feed = allKudosFeed(page);
    const cards = feed.locator("article[data-kudo-id]");
    await expect(cards).toHaveCount(10);
    const loadMore = feed.getByRole("button", { name: "Tải thêm" });

    // Loading state: the button is aria-disabled and busy until the page arrives, and keeps focus.
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/kudos?cursor=*", async (route) => {
      await held;
      await route.fallback();
    });
    await loadMore.click();
    await expect(loadMore).toHaveAttribute("aria-disabled", "true");
    await expect(loadMore).toHaveAttribute("aria-busy", "true");
    await expect(loadMore).toBeFocused();
    release();
    await expect(cards).not.toHaveCount(10);
    await page.unroute("**/api/kudos?cursor=*");
    // Every append moves focus to the first new card and announces the count.
    await expect(cards.nth(10)).toBeFocused();
    await expect(feed.getByRole("status")).toHaveText(/^Đã tải thêm \d+ Kudo$/);

    for (let clicks = 0; clicks < 30 && (await loadMore.count()) > 0; clicks += 1) {
      const before = await cards.count();
      await loadMore.click();
      await expect(cards).not.toHaveCount(before);
      expect(await cards.count()).toBeLessThanOrEqual(before + 10);
      await expect(cards.nth(before)).toBeFocused();
    }
    await expect(loadMore).toHaveCount(0);

    const ids = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-kudo-id")));
    const times = await feed.locator("article[data-kudo-id] time").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("datetime") ?? ""));
    expect(new Set(ids).size).toBe(ids.length);
    expect(times).toEqual([...times].sort().reverse());
    expect(ids.filter((id) => id !== null && seeded.includes(id))).toEqual(newestFirst);
  });

  test("the Hashtag filter narrows the Highlight and resets the carousel to the first card", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    const older = await seedFeedKudo(pair, { body: "Wasshoi cũ", createdAt: at(1), hashtags: ["wasshoi"] });
    const newer = await seedFeedKudo(pair, { body: "Wasshoi mới", createdAt: at(2), hashtags: ["wasshoi"] });
    await seedFeedKudo(pair, { body: "Không có Wasshoi 1", createdAt: at(3) });
    await seedFeedKudo(pair, { body: "Không có Wasshoi 2", createdAt: at(4) });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    const carousel = highlightCarousel(page);
    const pager = carousel.getByRole("status");
    await expect(pager).toHaveText(/^1\/[2-5]$/);
    await carousel.getByRole("button", { name: "Xem Kudo sau" }).click();
    await expect(pager).toHaveText(/^2\/[2-5]$/);

    const filter = page.getByRole("button", { name: /^Hashtag/ });
    await filter.click();
    const list = page.getByRole("listbox", { name: "Lọc theo hashtag" });
    await expect(list.getByRole("option").first()).toHaveText("Tất cả");
    const reloaded = page.waitForResponse((response) => response.url().includes("/api/kudos/highlight?hashtag="));
    await list.getByRole("option", { name: "#WASSHOI" }).click();
    expect((await reloaded).status()).toBe(200);

    await expect(filter).toContainText("#WASSHOI");
    await expect(pager).toHaveText("1/2");
    const activeSlide = carousel.getByRole("group");
    await expect(activeSlide).toHaveCount(1);
    await expect(kudoCard(activeSlide, newer)).toBeVisible();
    await expect(carousel.locator("article[data-kudo-id]")).toHaveCount(2);
    await expect(kudoCard(carousel, older)).toContainText("#WASSHOI");
    await expect(carousel.getByRole("button", { name: "Xem Kudo trước" })).toHaveAttribute("aria-disabled", "true");
  });

  test("an anonymous card shows the nickname and the sender never reaches the page HTML", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, {
      body: "Cảm ơn bạn từ một người giấu tên",
      createdAt: feedWindow("top")(),
      anonymousNickname: "Mèo Ẩn Danh",
      title: "Người truyền lửa",
    });
    await auth.signIn(pair.recipient);
    const response = await page.goto("/kudos");
    const html = await response!.text();

    const card = kudoCard(allKudosFeed(page), id);
    await expect(card.getByText("Mèo Ẩn Danh", { exact: true })).toBeVisible();
    await expect(card.getByText("Người gửi ẩn danh")).toBeVisible();
    await expect(card.getByRole("link", { name: pair.recipient.fullName }).first()).toHaveAttribute(
      "href",
      `/profile/${pair.recipient.id}`,
    );
    await expect(card.locator(`a[href="/profile/${pair.sender.id}"]`)).toHaveCount(0);

    const detailHtml = await (await page.goto(`/kudos/${id}`))!.text();
    await expect(page.getByText("Mèo Ẩn Danh", { exact: true })).toBeVisible();
    for (const document of [html, detailHtml]) {
      expect(document).toContain("Mèo Ẩn Danh");
      for (const secret of [pair.sender.fullName, pair.sender.id, pair.sender.email]) expect(document).not.toContain(secret);
    }
  });

  test("has no horizontal page scroll at 375 px and 1440 px", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    for (let index = 0; index < 3; index += 1) await seedFeedKudo(pair, { body: `Kudo rộng ${index} `.repeat(20), createdAt: at(index) });
    await auth.signIn(pair.recipient);
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/kudos");
      await expect(allKudosFeed(page).locator("article[data-kudo-id]").first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow at ${width}px`).toBe(0);
      await page.getByRole("button", { name: /^Hashtag/ }).click();
      const list = await page.getByRole("listbox", { name: "Lọc theo hashtag" }).boundingBox();
      expect(list!.x, `filter list inside the viewport at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(list!.x + list!.width).toBeLessThanOrEqual(width);
    }
  });

  test("the launcher pill on the Live board opens the Write Kudo modal", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    await expect(page.getByRole("combobox", { name: "Tìm kiếm profile Sunner" })).toBeVisible();
    await page.getByRole("button", { name: "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" }).click();
    await expect(page.getByRole("dialog", { name: "Gửi lời cám ơn và ghi nhận đến đồng đội" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sun* Kudos" }).first()).toHaveAttribute("aria-current", "page");
  });
});
