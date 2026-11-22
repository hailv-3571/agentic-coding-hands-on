import { expect, test } from "./kudos-authoring/kudo-e2e-fixtures";
import {
  bell,
  drainUntil,
  nextUnreadCountRead,
  panel,
  removeSeededEvents,
  rowWith,
  rows,
  seedSecretBoxNotifications,
  sendKudoThroughComposer,
  unreadIdsOf,
} from "./notifications-e2e-helpers";
import { markDocument, sameDocument } from "./spotlight-board-e2e-helpers";

/**
 * Phase 13 Notifications (F013) end to end on the local stack: a kudo sent through the composer
 * reaches the recipient's bell over the private Realtime channel without a reload, the panel row
 * opens the kudo and is marked read, mark-all clears every dot, an anonymous kudo shows only its
 * nickname, and `/notifications` pages older rows in on scroll. A first kudo also lifts the
 * recipient to New Hero, so rows are matched by text, never by position or count.
 */
const BOX_COPY = "Chúc mừng! Bạn vừa nhận được lượt mở Secret Box mới!";

test.describe("Notifications", () => {
  test("a kudo lights the recipient's bell live; the row opens the kudo and turns read; mark all clears", async ({
    page,
    auth,
    kudoUsers,
    browser,
    baseURL,
  }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.recipient);
    const joined = nextUnreadCountRead(page);
    await page.goto("/kudos");
    await joined;
    await expect(bell(page)).toHaveAttribute("data-unread", "false");
    await markDocument(page);

    const kudoId = await sendKudoThroughComposer(browser, baseURL!, pair);
    await drainUntil(pair.recipient.id, 1);
    await expect(bell(page)).toHaveAttribute("data-unread", "true", { timeout: 15_000 });
    await expect(bell(page)).toHaveAccessibleName("Thông báo (có thông báo chưa đọc)");
    expect(await sameDocument(page)).toBe(true);

    await bell(page).click();
    await expect(bell(page)).toHaveAttribute("aria-expanded", "true");
    const dialog = panel(page);
    await expect(dialog).toBeFocused();
    const row = rowWith(dialog, `Sunner ${pair.sender.fullName} vừa gửi đến bạn lời ghi nhận đầy yêu thương!`);
    await expect(row).toHaveAttribute("data-read", "false");
    await expect(row.locator("time")).toHaveText(/^(Vừa xong|1 phút trước)$/);
    const rowId = (await row.getAttribute("data-notification-id")) ?? "";

    await row.getByRole("link").first().click();
    await expect(page).toHaveURL(new RegExp(`/kudos/${kudoId}$`));
    await expect(dialog).toBeHidden();
    await expect.poll(async () => (await unreadIdsOf(pair.recipient.id)).includes(rowId)).toBe(false);

    await bell(page).click();
    await expect(rowWith(panel(page), pair.sender.fullName)).toHaveAttribute("data-read", "true");
    await panel(page).getByRole("button", { name: "Đánh dấu đọc tất cả" }).click();
    await expect(panel(page).locator('li[data-read="false"]')).toHaveCount(0);
    await expect(bell(page)).toHaveAttribute("data-unread", "false");
    await expect.poll(() => unreadIdsOf(pair.recipient.id)).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(bell(page)).toBeFocused();
  });

  test("an anonymous kudo shows its nickname and never the sender's name, in the panel and the API", async ({
    page,
    auth,
    kudoUsers,
    browser,
    baseURL,
  }) => {
    const pair = await kudoUsers.pair();
    const nickname = `Mèo Bí Ẩn ${pair.sender.fullName.slice(-6)}`;
    await sendKudoThroughComposer(browser, baseURL!, pair, { anonymousNickname: nickname });
    await drainUntil(pair.recipient.id, 1);

    await auth.signIn(pair.recipient);
    await page.goto("/kudos");
    await expect(bell(page)).toHaveAttribute("data-unread", "true");
    await bell(page).click();
    const row = rowWith(panel(page), `Sunner ${nickname} (ẩn danh) vừa gửi đến bạn lời ghi nhận đầy yêu thương!`);
    await expect(row).toBeVisible();
    await expect(panel(page)).not.toContainText(pair.sender.fullName);

    const response = await page.request.get("/api/notifications?limit=10");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain(nickname);
    expect(body).not.toContain(pair.sender.fullName);
    expect(body).not.toContain(pair.sender.id);
  });

  test("/notifications: empty state, then 20 rows that load older ones on scroll; 'Xem tất cả' leads here", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const { recipient } = await kudoUsers.pair();
    await auth.signIn(recipient);
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: "Thông báo" })).toBeVisible();
    await expect(page.getByText("Bạn chưa có thông báo nào")).toBeVisible();

    const seeded = await seedSecretBoxNotifications(recipient.id, 27);
    try {
      await page.goto("/kudos");
      await bell(page).click();
      await expect(rows(panel(page)).nth(9)).toBeAttached();
      await panel(page).getByRole("link", { name: "Xem tất cả" }).click();
      await expect(page).toHaveURL(/\/notifications$/);

      const list = page.getByRole("list", { name: "Thông báo" });
      await expect(rows(list)).toHaveCount(20);
      await expect(rowWith(list, BOX_COPY).first().locator("time")).toHaveText("1 giờ trước");
      await rows(list).last().scrollIntoViewIfNeeded();
      await expect(rows(list)).toHaveCount(27);

      await page.getByRole("button", { name: "Đánh dấu đọc tất cả" }).click();
      await expect(list.locator('li[data-read="false"]')).toHaveCount(0);
      await expect(bell(page)).toHaveAttribute("data-unread", "false");
      await expect.poll(() => unreadIdsOf(recipient.id)).toEqual([]);
    } finally {
      await removeSeededEvents(seeded);
    }
  });
});
