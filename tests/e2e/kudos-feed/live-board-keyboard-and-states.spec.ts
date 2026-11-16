import { expect, feedWindow, highlightCarousel, seedFeedKudo, test } from "./live-board-fixtures";

/**
 * F004 Live board keyboard and edge states (phase 05 UI review): the Highlight filter list is a
 * single tab stop (roving tabindex; arrows/Home/End move, Tab moves on and closes, Esc returns to
 * the button), the carousel pager keeps focus at the last card, and an expired session inside a
 * region offers a sign-in link back to the Live board.
 */
test.describe("Live board keyboard and states", () => {
  test("the filter list is one tab stop; Tab moves on and closes it, Esc returns to the button", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    const trigger = page.getByRole("button", { name: /^Hashtag/ });
    const list = page.getByRole("listbox", { name: "Lọc theo hashtag" });
    const options = list.getByRole("option");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(options.first()).toBeFocused();
    await expect(list.locator('[tabindex="0"]')).toHaveCount(1);

    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toBeFocused();
    await expect(options.nth(1)).toHaveAttribute("tabindex", "0");
    await expect(options.first()).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("End");
    await expect(options.last()).toBeFocused();
    await page.keyboard.press("Home");
    await expect(options.first()).toBeFocused();
    await expect(list.locator('[tabindex="0"]')).toHaveCount(1);

    // Tab leaves the list for the next control (the Phòng ban filter) and closes it.
    await page.keyboard.press("Tab");
    await expect(list).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Phòng ban/ })).toBeFocused();

    // Shift+Tab goes back to the button and closes the list.
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(options.first()).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(list).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(list).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("the pager keeps focus on its button at the last card", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    await seedFeedKudo(pair, { body: "Highlight một", createdAt: at(1) });
    await seedFeedKudo(pair, { body: "Highlight hai", createdAt: at(2) });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    const carousel = highlightCarousel(page);
    const pager = carousel.getByRole("status");
    await expect(pager).toHaveText(/^1\/[2-5]$/);
    const total = Number((await pager.textContent())!.split("/")[1]);
    const next = carousel.getByRole("button", { name: "Trang sau" });
    await next.focus();
    for (let index = 1; index < total; index += 1) await page.keyboard.press("Enter");
    await expect(pager).toHaveText(`${total}/${total}`);
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(pager).toHaveText(`${total}/${total}`);
    await expect(carousel.getByRole("button", { name: "Trang trước" })).not.toHaveAttribute("aria-disabled", "true");
  });

  test("an expired session in a region offers a sign-in link back to the Live board", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");
    await page.route("**/api/kudos/highlight?*", (route) => route.fulfill({ status: 401, json: { code: "unauthorized" } }));

    await page.getByRole("button", { name: /^Hashtag/ }).click();
    await page.getByRole("listbox", { name: "Lọc theo hashtag" }).getByRole("option").nth(1).click();
    const alert = page.getByRole("alert").filter({ hasText: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." });
    await expect(alert.getByRole("link", { name: "Đăng nhập lại" })).toHaveAttribute("href", "/login?next=%2Fkudos");
  });
});
