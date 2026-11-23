import { pickHashtags } from "./kudos-authoring/kudo-composer-e2e-steps";
import { allKudosFeed, expect, feedWindow, kudoCard, seedFeedKudo, test } from "./kudos-feed/live-board-fixtures";
import { avatarOf, hoverCardOf, recordRequests } from "./profile-e2e-helpers";

/**
 * Avatar hover card (F012 A5, Figma 721:5827 / 2268:35101, decision 2026-11-23): a named avatar on a
 * Kudo card turns gold on hover and, after a short delay, opens the card (name link, unit, counts,
 * "Gửi KUDO" → composer with that Sunner locked); leaving or Esc closes it; one card at a time; one
 * request per Sunner per page. Keyboard focus on the name opens it too. Never on an anonymous
 * sender. On a touch screen a tap goes straight to the profile (D007).
 */
const GOLD = "rgb(255, 234, 158)";
const COMPOSER = "Gửi lời cám ơn và ghi nhận đến đồng đội";

test.describe("Avatar hover card", () => {
  test("hover rings the avatar and opens the card; leave closes it; one request per Sunner; one card at a time", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Rê chuột lên avatar", createdAt: feedWindow("top")() });
    await auth.signIn(pair.recipient);
    const requests = recordRequests(page, "/api/sunners/");
    await page.goto("/kudos");
    const card = kudoCard(allKudosFeed(page), id);
    const senderAvatar = avatarOf(card, pair.sender.id);

    await senderAvatar.hover();
    await expect(senderAvatar).toHaveCSS("border-top-color", GOLD);
    const senderCard = hoverCardOf(page, pair.sender.fullName);
    await expect(senderCard).toBeVisible();
    await expect(senderCard.getByRole("link", { name: pair.sender.fullName })).toHaveAttribute("href", `/profile/${pair.sender.id}`);
    await expect(senderCard).toContainText("Tên đơn vị: OPD");
    await expect(senderCard).toContainText("Số Kudos nhận được: 0");
    await expect(senderCard).toContainText("Số Kudos đã gửi: 1");
    await expect(senderCard.getByRole("button", { name: "Gửi KUDO" })).toBeVisible();

    await page.mouse.move(1, 1);
    await expect(senderCard).toHaveCount(0);
    await senderAvatar.hover();
    await expect(senderCard).toBeVisible();
    expect(requests.filter((path) => path === `/api/sunners/${pair.sender.id}/card`)).toHaveLength(1);

    // The viewer's own card has no "Gửi KUDO"; opening it replaces the sender's card.
    await avatarOf(card, pair.recipient.id).hover();
    const ownCard = hoverCardOf(page, pair.recipient.fullName);
    await expect(ownCard).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(ownCard.getByRole("button", { name: "Gửi KUDO" })).toHaveCount(0);
  });

  test("keyboard focus on the name opens the card and Esc closes it, focus staying on the name", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Bàn phím mở thẻ", createdAt: feedWindow("top")() });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");
    const name = kudoCard(allKudosFeed(page), id).getByRole("link", { name: pair.sender.fullName });

    await name.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(name).toBeFocused();
    const senderCard = hoverCardOf(page, pair.sender.fullName);
    await expect(senderCard).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(senderCard).toHaveCount(0);
    await expect(name).toBeFocused();
  });

  test("'Gửi KUDO' opens the composer with that Sunner locked; after sending, the card shows the new count", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Gửi lại từ thẻ nhanh", createdAt: feedWindow("top")() });
    await auth.signIn(pair.recipient);
    const requests = recordRequests(page, `/api/sunners/${pair.sender.id}/card`);
    await page.goto("/kudos");
    const senderAvatar = avatarOf(kudoCard(allKudosFeed(page), id), pair.sender.id);
    const senderCard = hoverCardOf(page, pair.sender.fullName);

    await senderAvatar.hover();
    await expect(senderCard).toContainText("Số Kudos nhận được: 0");
    await senderCard.getByRole("button", { name: "Gửi KUDO" }).click();
    const dialog = page.getByRole("dialog", { name: COMPOSER });
    await expect(dialog.getByRole("textbox", { name: "Người nhận" })).toHaveValue(pair.sender.fullName);
    await expect(dialog.getByRole("textbox", { name: "Người nhận" })).toHaveAttribute("readonly", "");
    await expect(senderCard).toHaveCount(0);
    await dialog.getByRole("textbox", { name: "Lời nhắn" }).fill("Gửi từ thẻ nhanh");
    await pickHashtags(dialog, ["#BE A TEAM"]);
    await dialog.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "Đã gửi Kudo thành công!" })).toBeVisible();

    // Review W2: the sent Kudo drops the cached card, so the next open asks again and counts it. The
    // send refreshes the page and realtime updates follow; one landing during the open delay moves
    // the avatar from under the pointer (no card, rightly), so hover again until the card opens.
    await expect(allKudosFeed(page).getByText("Gửi từ thẻ nhanh")).toBeVisible();
    await expect(async () => {
      await page.mouse.move(1, 1);
      await senderAvatar.hover();
      await expect(senderCard).toBeVisible({ timeout: 2_000 });
    }).toPass();
    await expect(senderCard).toContainText("Số Kudos nhận được: 1");
    expect(requests).toHaveLength(2);
  });

  test("an anonymous sender's avatar opens nothing and asks the server nothing", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Ẩn danh thì không có thẻ", createdAt: feedWindow("top")(), anonymousNickname: "Mèo Ẩn Danh" });
    await auth.signIn(pair.recipient);
    const requests = recordRequests(page, "/api/sunners/");
    await page.goto("/kudos");
    const card = kudoCard(allKudosFeed(page), id);

    await card.locator('img[src*="avatar-anonymous"]').hover();
    // A negative check needs the open delay to pass: wait well beyond it, then prove nothing opened.
    await page.waitForTimeout(800);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(requests).toEqual([]);
    // Control: the named recipient on the same card does get a card.
    await avatarOf(card, pair.recipient.id).hover();
    await expect(hoverCardOf(page, pair.recipient.fullName)).toBeVisible();
  });
});

test.describe("Avatar hover card on a 375 px touch screen", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("a tap on an avatar opens the profile, without a card", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Chạm để mở profile", createdAt: feedWindow("top")() });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");
    const avatar = avatarOf(kudoCard(allKudosFeed(page), id), pair.sender.id);

    await avatar.scrollIntoViewIfNeeded();
    await avatar.tap();
    await expect(page).toHaveURL(new RegExp(`/profile/${pair.sender.id}$`));
    await expect(page.getByRole("heading", { level: 1, name: pair.sender.fullName })).toBeVisible();
    await expect(hoverCardOf(page, pair.sender.fullName)).toHaveCount(0);
  });
});
