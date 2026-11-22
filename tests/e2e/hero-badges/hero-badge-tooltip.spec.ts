import type { Page } from "@playwright/test";
import { allKudosFeed, expect, feedWindow, kudoCard, seedFeedKudo, test, type KudoPair } from "../kudos-feed/live-board-fixtures";

/**
 * F009 Hero badges on Live board cards (phase 09): a badge after the department code for every
 * person with ≥ 1 distinct sender (US001), never for an anonymous sender (FR-603), and its tooltip
 * (DEC-003, SC-006): hover / keyboard focus / tap open it, leaving / Esc / a second tap close it,
 * a press inside it keeps it open, one open at a time, focus never trapped, inside a 375 px screen.
 */
const NEW_HERO_RULE = "Có 1–4 người gửi Kudos cho bạn";
const NEW_HERO_BODY = "Hành trình lan tỏa điều tốt đẹp bắt đầu – những lời cảm ơn và ghi nhận đầu tiên đã tìm đến bạn.";

/**
 * Sender → recipient (named) and recipient → sender (anonymous "Cú Mèo"): both now have 1 distinct
 * sender (the anonymous kudo counts, BR-003), so both hold "New Hero".
 */
async function seedTwoWayKudos(page: Page, pair: KudoPair, signIn: () => Promise<unknown>) {
  const at = feedWindow("top");
  const namedId = await seedFeedKudo(pair, { body: "Cảm ơn đồng đội", createdAt: at(2) });
  const reversed = { sender: pair.recipient, recipient: pair.sender };
  const anonymousId = await seedFeedKudo(reversed, { body: "Cảm ơn bạn, giấu tên", createdAt: at(1), anonymousNickname: "Cú Mèo" });
  await signIn();
  await page.goto("/kudos");
  const feed = allKudosFeed(page);
  return { named: kudoCard(feed, namedId), anonymous: kudoCard(feed, anonymousId) };
}

test.describe("Hero badge on Kudo cards", () => {
  test("named people get a New Hero badge; the anonymous sender never does", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const { named, anonymous } = await seedTwoWayKudos(page, pair, () => auth.signIn(pair.recipient));

    await expect(named.getByRole("button", { name: "New Hero" })).toHaveCount(2);
    const onlyBadge = anonymous.getByRole("button", { name: "New Hero" });
    await expect(onlyBadge).toHaveCount(1);
    // …and it is the recipient's: right of the anonymous sender's nickname.
    const nickname = await anonymous.getByText("Cú Mèo", { exact: true }).boundingBox();
    const badge = await onlyBadge.boundingBox();
    expect(badge!.x).toBeGreaterThan(nickname!.x + nickname!.width);
  });

  test("the tooltip opens on hover and on keyboard focus, closes on leave and Esc, one at a time", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const { named } = await seedTwoWayKudos(page, pair, () => auth.signIn(pair.recipient));
    const [senderBadge, recipientBadge] = [named.getByRole("button", { name: "New Hero" }).first(), named.getByRole("button", { name: "New Hero" }).last()];
    const tooltip = page.getByRole("tooltip");

    await recipientBadge.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(NEW_HERO_RULE);
    await expect(tooltip).toContainText(NEW_HERO_BODY);
    await expect(recipientBadge).toHaveAttribute("aria-describedby", (await tooltip.getAttribute("id"))!);
    // A press inside the open tooltip is not a press elsewhere: it stays open.
    await tooltip.click();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(1, 1);
    await expect(tooltip).toHaveCount(0);
    await expect(recipientBadge).not.toHaveAttribute("aria-describedby");

    // Keyboard: Tab from the recipient's name lands on the badge and opens it; Esc closes it.
    await named.getByRole("link", { name: pair.recipient.fullName }).focus();
    await page.keyboard.press("Tab");
    await expect(recipientBadge).toBeFocused();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await expect(recipientBadge).toBeFocused();

    // One open at a time: hovering the sender's badge replaces the focused one's tooltip.
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(tooltip).toBeVisible();
    await senderBadge.hover();
    await expect(tooltip).toHaveCount(1);
    await expect(senderBadge).toHaveAttribute("aria-describedby", (await tooltip.getAttribute("id"))!);
    await expect(recipientBadge).not.toHaveAttribute("aria-describedby");

    // Focus is never trapped: Tab moves past the badge and its tooltip closes on blur.
    await page.mouse.move(1, 1);
    await recipientBadge.focus();
    await page.keyboard.press("Tab");
    await expect(recipientBadge).not.toBeFocused();
    await expect(tooltip).toHaveCount(0);
  });
});

test.describe("Hero badge tooltip on a 375 px touch screen", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("a tap opens the tooltip inside the screen and a second tap closes it", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const { named } = await seedTwoWayKudos(page, pair, () => auth.signIn(pair.recipient));
    const recipientBadge = named.getByRole("button", { name: "New Hero" }).last();
    const tooltip = page.getByRole("tooltip");

    await recipientBadge.scrollIntoViewIfNeeded();
    await recipientBadge.tap();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(NEW_HERO_RULE);
    const box = (await tooltip.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(16);
    expect(box.x + box.width).toBeLessThanOrEqual(375 - 16);

    // A tap inside the open tooltip (the badge loses focus to it) keeps it open.
    await tooltip.tap();
    await expect(tooltip).toBeVisible();

    await recipientBadge.tap();
    await expect(tooltip).toHaveCount(0);
  });
});
