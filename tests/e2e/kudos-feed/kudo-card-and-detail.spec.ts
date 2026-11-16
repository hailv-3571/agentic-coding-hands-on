import { allKudosFeed, expect, feedWindow, kudoCard, kudoDetailPanel, seedFeedKudo, setFullName, test } from "./live-board-fixtures";

/**
 * F004 Kudo card actions and the detail page (phase 05): Copy Link (FR-301, clipboard fallback),
 * Xem chi tiết → `/kudos/{id}` → Đóng (D004), uniform not-found (C-17), the owner's edit pen
 * (E22, opens the phase 04 composer), the whitelist Markdown renderer and the card time format.
 */
const NOT_FOUND_COPY = "Kudo này không tồn tại hoặc đã bị gỡ.";

test.describe("Kudo card", () => {
  test("Copy Link copies the absolute detail URL and confirms with a toast", async ({ page, context, auth, kudoUsers, baseURL }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Cảm ơn vì link này", createdAt: feedWindow("top")() });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    await kudoCard(allKudosFeed(page), id).getByRole("button", { name: "Copy Link" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Đã sao chép liên kết" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}/kudos/${id}`);
  });

  test("a blocked clipboard shows an error with the link for manual copy", async ({ page, auth, kudoUsers, baseURL }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Clipboard bị chặn", createdAt: feedWindow("top")() });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException("blocked", "NotAllowedError")) },
      });
    });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    await kudoCard(allKudosFeed(page), id).getByRole("button", { name: "Copy Link" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Không sao chép được liên kết, vui lòng thử lại." });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("textbox")).toHaveValue(`${baseURL}/kudos/${id}`);
  });

  test("Xem chi tiết opens the detail page and Đóng returns to the Live board", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Nội dung đầy đủ của Kudo", title: "Người truyền lửa", createdAt: feedWindow("top")() });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    await kudoCard(allKudosFeed(page), id).getByRole("link", { name: "Xem chi tiết" }).click();
    await expect(page).toHaveURL(new RegExp(`/kudos/${id}$`));
    const detail = kudoDetailPanel(page, id);
    await expect(detail.getByText("Nội dung đầy đủ của Kudo")).toBeVisible();
    // Under the page's (visually hidden) h1, the title is the next level down.
    await expect(detail.getByRole("heading", { level: 2, name: "Người truyền lửa" })).toBeVisible();
    await expect(detail.getByRole("button", { name: "Copy Link" })).toBeVisible();
    await detail.getByRole("link", { name: "Đóng" }).click();
    await expect(page).toHaveURL(/\/kudos$/);
  });

  test("the owner gets an edit pen that opens the composer prefilled; others get none", async ({ page, context, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Bài của chính tôi", createdAt: feedWindow("top")() });
    await auth.signIn(pair.sender);
    await page.goto("/kudos");

    await kudoCard(allKudosFeed(page), id).getByRole("button", { name: "Chỉnh sửa Kudo" }).click();
    const dialog = page.getByRole("dialog", { name: "Chỉnh sửa bài viết của bạn" });
    await expect(dialog.getByRole("textbox", { name: "Lời nhắn" })).toHaveValue("Bài của chính tôi");
    await expect(dialog.getByRole("textbox", { name: "Người nhận" })).toHaveValue(pair.recipient.fullName);
    // Portalled out of the card: under the title row transform it rendered clipped and hidden.
    await expect(dialog.getByRole("button", { name: "Bỏ #High-performing" })).toBeVisible();
    // The detail page has no pen, even for the owner (Figma 520:18779; edit from the card).
    await page.goto(`/kudos/${id}`);
    await expect(kudoDetailPanel(page, id).getByText("Bài của chính tôi")).toBeVisible();
    await expect(kudoDetailPanel(page, id).getByRole("button", { name: "Chỉnh sửa Kudo" })).toHaveCount(0);

    await context.clearCookies();
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");
    const othersCard = kudoCard(allKudosFeed(page), id);
    await expect(othersCard.getByText("Bài của chính tôi")).toBeVisible();
    await expect(othersCard.getByRole("button", { name: "Chỉnh sửa Kudo" })).toHaveCount(0);
  });

  test("a pen left in a tab after switching accounts opens only the refusal, no Kudo content", async ({
    page,
    context,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Bài của chính tôi", createdAt: feedWindow("top")() });
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    const pen = kudoCard(allKudosFeed(page), id).getByRole("button", { name: "Chỉnh sửa Kudo" });
    await expect(pen).toBeVisible();

    // Another tab signs in as the recipient: same cookie jar, so this page is now stale.
    await context.clearCookies();
    await auth.signIn(pair.recipient);
    await pen.click();
    const dialog = page.getByRole("dialog", { name: "Chỉnh sửa bài viết của bạn" });
    await expect(dialog.getByRole("alert")).toHaveText("Bạn không có quyền sửa Kudo này.");
    await expect(dialog.getByRole("textbox")).toHaveCount(0);
    await expect(dialog).not.toContainText("Bài của chính tôi");
  });

  test("long unbroken text wraps inside the card and the detail panel", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const longName = `Đồng${"Đội".repeat(30)}`;
    await setFullName(pair.recipient.id, longName);
    const word = `Cảmơn${"x".repeat(200)}`;
    const id = await seedFeedKudo(pair, { body: word, createdAt: feedWindow("top")() });
    await auth.signIn(pair.sender);
    await page.goto("/kudos");

    const insideOwnBox = (node: Element) => node.scrollWidth <= node.clientWidth;
    const card = kudoCard(allKudosFeed(page), id);
    expect(await card.locator("p", { hasText: word }).evaluate(insideOwnBox), "card body wraps").toBe(true);
    const cardBox = (await card.boundingBox())!;
    const name = (await card.getByRole("link", { name: longName }).boundingBox())!;
    expect(name.x + name.width, "recipient name stays inside the card").toBeLessThanOrEqual(cardBox.x + cardBox.width);

    await page.goto(`/kudos/${id}`);
    expect(await kudoDetailPanel(page, id).locator("p", { hasText: word }).evaluate(insideOwnBox), "detail body wraps").toBe(true);
  });

  test("the body renders whitelisted Markdown; a javascript: link stays plain text", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, {
      body: "**Đậm nhé** cảm ơn [Trang Sun](https://sun-asterisk.com/) và [xấu](javascript:alert(1))",
      createdAt: feedWindow("top")(),
    });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    const card = kudoCard(allKudosFeed(page), id);
    await expect(card.locator("strong", { hasText: "Đậm nhé" })).toBeVisible();
    const link = card.getByRole("link", { name: "Trang Sun" });
    await expect(link).toHaveAttribute("href", "https://sun-asterisk.com/");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow");
    await expect(card.locator('a[href^="javascript:"]')).toHaveCount(0);
    await expect(card.getByText("[xấu](javascript:alert(1))")).toBeVisible();
  });
});

test.describe("Kudo detail", () => {
  test("shows the time as HH:mm - MM/DD/YYYY in Vietnam time", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Giờ Việt Nam", createdAt: "2025-10-30T03:00:00.000Z" });
    await auth.signIn(pair.recipient);
    await page.goto(`/kudos/${id}`);
    await expect(kudoDetailPanel(page, id).locator("time")).toHaveText("10:00 - 10/30/2025");
  });

  test("an unknown or malformed id renders the uniform not-found copy", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.recipient);
    for (const id of ["00000000-0000-4000-8000-000000000000", "not-a-uuid"]) {
      await page.goto(`/kudos/${id}`);
      await expect(page.getByRole("heading", { level: 1, name: NOT_FOUND_COPY })).toBeVisible();
    }
    await page.getByRole("link", { name: "Quay lại Live board" }).click();
    await expect(page).toHaveURL(/\/kudos$/);
  });

  test("the author sees a read-only spam view of their own spam Kudo; others get the uniform not-found copy", async ({ page, context, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Kudo bị đánh dấu spam", createdAt: feedWindow("top")(), status: "spam" });
    await auth.signIn(pair.sender);
    await page.goto(`/kudos/${id}`);
    const detail = kudoDetailPanel(page, id);
    await expect(detail.getByText("Spam", { exact: true })).toBeVisible();
    await expect(detail.getByText("Kudo này đã bị đánh dấu spam nên không thể sửa.")).toBeVisible();
    await expect(detail.getByRole("button", { name: "Copy Link" })).toHaveCount(0);
    await expect(detail.getByRole("button", { name: "Chỉnh sửa Kudo" })).toHaveCount(0);

    await context.clearCookies();
    await auth.signIn(pair.recipient);
    await page.goto(`/kudos/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: NOT_FOUND_COPY })).toBeVisible();
    await expect(page.getByText("Kudo bị đánh dấu spam")).toHaveCount(0);
  });
});
