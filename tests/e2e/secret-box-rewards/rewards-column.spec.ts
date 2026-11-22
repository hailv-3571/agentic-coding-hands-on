import {
  expect,
  feedWindow,
  HEARTS_PER_BOX,
  openBoxButton,
  openBoxOutOfBand,
  rewardsColumn,
  secretBoxDialog,
  seedFeedKudo,
  seedHeartsOnSentKudos,
  seedUnopenedBoxes,
  statValue,
  test,
} from "./secret-box-e2e-fixtures";

/**
 * F010 rewards column of the Live board (SCR-live-board-rewards-column): personal stats from the
 * real queries, the "Mở Secret Box" button (DEC-001: dimmed with a tooltip at 0, never opens), the
 * grant from hearts on the user's SENT kudos (reconcile-on-read), the latest gift winners list
 * with real names, and the column stacking under the feed on a phone.
 */
test.describe("Live board rewards column", () => {
  test("without a box the button is dimmed, explains why and opens nothing", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    const column = rewardsColumn(page);

    await expect(statValue(column, "Số Secret Box chưa mở:")).toHaveText("0");
    await expect(statValue(column, "Số Secret Box bạn đã mở:")).toHaveText("0");
    const button = openBoxButton(page);
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).toHaveAccessibleDescription("Bạn chưa có Secret Box nào");

    const tooltip = page.getByRole("tooltip");
    await button.hover();
    await expect(tooltip).toHaveText("Bạn chưa có Secret Box nào");
    // Playwright treats aria-disabled as not enabled; a real click still lands on it.
    await button.click({ force: true });
    await expect(secretBoxDialog(page)).toHaveCount(0);
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();

    // Keyboard: focus shows it, Esc hides it (WCAG 1.4.13), Enter still opens nothing.
    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await page.keyboard.press("Enter");
    await expect(secretBoxDialog(page)).toHaveCount(0);
  });

  test("hearts on the user's sent kudos grant a box and enable the button", async ({ page, auth, boxUsers }) => {
    test.slow();
    const pair = await boxUsers.pair();
    await seedHeartsOnSentKudos(pair, HEARTS_PER_BOX);
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    const column = rewardsColumn(page);

    await expect(statValue(column, "Số Kudos bạn đã gửi:")).toHaveText(String(HEARTS_PER_BOX));
    await expect(statValue(column, "Số tim bạn nhận được:")).toHaveText(String(HEARTS_PER_BOX));
    await expect(statValue(column, "Số Secret Box chưa mở:")).toHaveText("1");
    await expect(openBoxButton(page)).not.toHaveAttribute("aria-disabled");

    // The recipient got kudos but sent none: no hearts toward boxes (hearts count on SENT kudos).
    await page.context().clearCookies();
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");
    await expect(statValue(column, "Số Kudos bạn nhận được:")).toHaveText(String(HEARTS_PER_BOX));
    await expect(statValue(column, "Số Secret Box chưa mở:")).toHaveText("0");
  });

  test("the latest gift winners list shows the real name and the gift", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await seedUnopenedBoxes(pair.recipient.id, 1);
    // Far-future opened_at keeps this row on top even while other workers open boxes.
    const { prizeName } = await openBoxOutOfBand(pair.recipient.id, { kind: "gift", openedAt: "5999-01-01T00:00:00Z" });
    await auth.signIn(pair.sender);
    await page.goto("/kudos");

    const list = rewardsColumn(page).getByRole("list", { name: "10 SUNNER NHẬN QUÀ MỚI NHẤT" });
    const first = list.getByRole("listitem").first();
    await expect(first).toContainText(pair.recipient.fullName);
    await expect(first).toContainText(`Nhận được ${prizeName}`);
    expect(await list.getByRole("listitem").count()).toBeLessThanOrEqual(10);
  });

  test("a guest never receives the column: /kudos redirects to /login with no winners data", async ({ page, request }) => {
    const response = await request.get("/kudos", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location ?? "", "http://localhost").pathname).toBe("/login");
    expect(await response.text()).not.toContain("10 SUNNER NHẬN QUÀ MỚI NHẤT");

    await page.goto("/kudos");
    await expect(page).toHaveURL((url) => url.pathname === "/login");
    await expect(rewardsColumn(page)).toHaveCount(0);
    await expect(page.getByText("10 SUNNER NHẬN QUÀ MỚI NHẤT")).toHaveCount(0);
  });

  test("on a phone the column stacks under the feed at full width", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await seedUnopenedBoxes(pair.sender.id, 2);
    await seedFeedKudo(pair, { body: "Cảm ơn bạn", createdAt: feedWindow("top")() }); // the shared feed may be empty
    await page.setViewportSize({ width: 375, height: 812 });
    await auth.signIn(pair.sender);
    await page.goto("/kudos");

    const column = rewardsColumn(page);
    await expect(statValue(column, "Số Secret Box chưa mở:")).toHaveText("2");
    const box = await column.boundingBox();
    const lastCard = await page.getByRole("region", { name: "ALL KUDOS" }).locator("article").last().boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(375 - 32 - 1);
    expect(box!.y).toBeGreaterThanOrEqual(lastCard!.y + lastCard!.height);
  });
});
