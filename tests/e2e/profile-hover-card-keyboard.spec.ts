import type { Page } from "@playwright/test";
import { allKudosFeed, expect, feedWindow, kudoCard, seedFeedKudo, test, type KudoPair } from "./kudos-feed/live-board-fixtures";
import { hoverCardOf } from "./profile-e2e-helpers";

/**
 * Hover card keyboard reach (phase 12 review W1, WCAG 2.1.1). The card opens from keyboard focus on
 * the name link, which exposes it (`aria-expanded` + `aria-controls`); Tab moves into the card (name
 * link, then "Gửi KUDO"), Shift+Tab and Esc return to the name, Tab past the card goes on to the next
 * control after the name and closes it. "Gửi KUDO" by keyboard opens the composer with that Sunner
 * locked; Esc returns focus to the name and the card stays closed.
 */
const COMPOSER = "Gửi lời cám ơn và ghi nhận đến đồng đội";

/** Live board with one seeded Kudo; focus lands on its sender's name by keyboard, which opens the card. */
async function openSenderCardByKeyboard(page: Page, pair: KudoPair, body: string) {
  const id = await seedFeedKudo(pair, { body, createdAt: feedWindow("top")() });
  await page.goto("/kudos");
  const card = kudoCard(allKudosFeed(page), id);
  const name = card.getByRole("link", { name: pair.sender.fullName });
  await expect(name).toHaveAttribute("aria-expanded", "false");
  await name.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(name).toBeFocused();
  const senderCard = hoverCardOf(page, pair.sender.fullName);
  await expect(senderCard).toBeVisible();
  return { card, name, senderCard };
}

test.describe("Avatar hover card by keyboard", () => {
  test("Tab moves into the open card and past it; Shift+Tab and Esc return to the name; the name exposes the card", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.recipient);
    const { card, name, senderCard } = await openSenderCardByKeyboard(page, pair, "Tab vào thẻ nhanh");
    await expect(name).toHaveAttribute("aria-expanded", "true");
    await expect(name).toHaveAttribute("aria-controls", (await senderCard.getAttribute("id"))!);
    const cardName = senderCard.getByRole("link", { name: pair.sender.fullName });
    const send = senderCard.getByRole("button", { name: "Gửi KUDO" });

    await page.keyboard.press("Tab");
    await expect(cardName).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(send).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(cardName).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(name).toBeFocused();
    await expect(senderCard).toBeVisible();

    // Esc inside the card closes it and puts focus back on the name, which does not reopen it.
    await page.keyboard.press("Tab");
    await expect(cardName).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(senderCard).toHaveCount(0);
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-expanded", "false");
    await page.waitForTimeout(800);
    await expect(senderCard).toHaveCount(0);

    // Focus leaving both the name and the card closes it; Tab goes on in page order after the name.
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(senderCard).toBeVisible();
    for (const stop of [cardName, send]) {
      await page.keyboard.press("Tab");
      await expect(stop).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(senderCard).toHaveCount(0);
    await expect(card.getByRole("link", { name: pair.recipient.fullName })).toBeFocused();
  });

  test("keyboard only: Tab to 'Gửi KUDO', Enter opens the composer with the recipient locked, Esc returns focus to the name", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.recipient);
    const { name, senderCard } = await openSenderCardByKeyboard(page, pair, "Gửi KUDO bằng bàn phím");
    const send = senderCard.getByRole("button", { name: "Gửi KUDO" });

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(send).toBeFocused();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: COMPOSER });
    const recipient = dialog.getByRole("textbox", { name: "Người nhận" });
    await expect(recipient).toHaveValue(pair.sender.fullName);
    await expect(recipient).toHaveAttribute("readonly", "");
    await expect(senderCard).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(name).toBeFocused();
    await page.waitForTimeout(800);
    await expect(senderCard).toHaveCount(0);
  });
});
