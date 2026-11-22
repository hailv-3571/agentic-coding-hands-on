import { randomUUID } from "node:crypto";
import { kudosSentBy } from "./kudos-authoring/kudo-e2e-fixtures";
import { pickHashtags } from "./kudos-authoring/kudo-composer-e2e-steps";
import { allKudosFeed, expect, feedWindow, kudoCard, seedFeedKudo, test } from "./kudos-feed/live-board-fixtures";
import { profileKudosRegion, reversed, tabStops } from "./profile-e2e-helpers";
import { cloudName, openLiveBoard, spotlightSearch } from "./spotlight-board-e2e-helpers";

/**
 * F012 Profile pages (phase 12): own profile with the "Đã gửi"/"Đã nhận" filter and the owner's
 * spam under the phase 08 overlay (nothing under it takes Tab, decision-log 2026-11-22); another
 * Sunner's profile (received only, no stats, send pill → composer with the recipient locked, D008);
 * own id → /profile; unknown id → not-found; card and Spotlight names reach the profile.
 */
const WARNING = "Cảnh báo vi phạm tiêu chuẩn cộng đồng";
const COMPOSER = "Gửi lời cám ơn và ghi nhận đến đồng đội";

test.describe("Profile pages", () => {
  test("own profile: header, icons, stats, 'Đã gửi' by default with own spam blurred, then 'Đã nhận'", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    const sentPublic = await seedFeedKudo(pair, { body: "Tôi gửi công khai", createdAt: at(1) });
    const sentSpam = await seedFeedKudo(pair, { body: "Tôi gửi bị đánh dấu spam", createdAt: at(2), status: "spam" });
    const received = await seedFeedKudo(reversed(pair), { body: "Tôi được cảm ơn", createdAt: at(3) });
    await auth.signIn(pair.sender);
    await page.goto("/profile");

    await expect(page.getByRole("heading", { level: 1, name: pair.sender.fullName })).toBeVisible();
    await expect(page.getByRole("list", { name: "Bộ sưu tập icon của tôi" }).getByRole("listitem")).toHaveCount(6);
    await expect(page.getByRole("region", { name: "Thống kê của bạn" })).toBeVisible();
    const kudos = profileKudosRegion(page);
    const filter = kudos.getByRole("button", { name: "Đã gửi (2)" });
    await expect(filter).toBeVisible();
    const cards = kudos.locator("article[data-kudo-id]");
    await expect(cards).toHaveCount(2);
    // Newest first across public and spam (one keyset, ALG-001).
    await expect(cards.first()).toHaveAttribute("data-kudo-id", sentSpam);
    await expect(cards.last()).toHaveAttribute("data-kudo-id", sentPublic);
    const spamCard = kudoCard(kudos, sentSpam);
    await expect(spamCard.getByRole("note")).toContainText(WARNING);
    await expect(spamCard.getByText("Spam", { exact: true })).toBeVisible();

    const stops = await tabStops(page, `article[data-kudo-id="${sentSpam}"]`);
    expect(stops.length).toBeGreaterThan(5);
    expect(stops.filter((stop) => stop.inside)).toEqual([]);

    await filter.click();
    await page.getByRole("option", { name: "Đã nhận (1)" }).click();
    await expect(kudos.getByRole("button", { name: "Đã nhận (1)" })).toBeVisible();
    await expect(kudoCard(kudos, received)).toBeVisible();
    await expect(cards).toHaveCount(1);
  });

  test("other profile: received list only, no stats, the send pill opens the composer with the recipient locked", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Cảm ơn đồng đội", createdAt: feedWindow("top")() });
    await auth.signIn(pair.sender);
    await page.goto(`/profile/${pair.recipient.id}`);

    await expect(page.getByRole("heading", { level: 1, name: pair.recipient.fullName })).toBeVisible();
    await expect(page.getByRole("list", { name: "Bộ sưu tập icon" }).getByRole("listitem")).toHaveCount(6);
    await expect(page.getByRole("region", { name: "Thống kê của bạn" })).toHaveCount(0);
    const kudos = profileKudosRegion(page);
    await expect(kudos.getByText("Đã nhận: 1 Kudos")).toBeVisible();
    await expect(kudos.getByRole("button", { name: /^Đã gửi/ })).toHaveCount(0);
    await expect(kudoCard(kudos, id)).toBeVisible();

    await page.getByRole("button", { name: `Gửi lời cảm ơn và ghi nhận tới ${pair.recipient.fullName}` }).click();
    const dialog = page.getByRole("dialog", { name: COMPOSER });
    const recipient = dialog.getByRole("textbox", { name: "Người nhận" });
    await expect(recipient).toHaveValue(pair.recipient.fullName);
    await expect(recipient).toHaveAttribute("readonly", "");
    await dialog.getByRole("textbox", { name: "Lời nhắn" }).fill("Gửi từ trang profile");
    await pickHashtags(dialog, ["#BE A TEAM"]);
    await dialog.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "Đã gửi Kudo thành công!" })).toBeVisible();
    const sent = (await kudosSentBy(pair.sender.id)).filter((kudo) => kudo.body === "Gửi từ trang profile");
    expect(sent).toHaveLength(1);
    expect(sent[0].recipient_id).toBe(pair.recipient.id);
  });

  test("your own id redirects to /profile; an unknown or malformed id shows the not-found page", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    await page.goto(`/profile/${pair.sender.id}`);
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { level: 1, name: pair.sender.fullName })).toBeVisible();
    await expect(profileKudosRegion(page).getByRole("button", { name: "Đã gửi (0)" })).toBeVisible();

    for (const id of [randomUUID(), "not-a-uuid"]) {
      await page.goto(`/profile/${id}`);
      await expect(page.getByRole("heading", { level: 1, name: "Không tìm thấy Sunner này." })).toBeVisible();
    }
  });

  test("a Kudo card's name link and a Spotlight name open that Sunner's profile", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Theo link tới profile", createdAt: feedWindow("top")() });
    await auth.signIn(pair.sender);
    await openLiveBoard(page);

    await kudoCard(allKudosFeed(page), id).getByRole("link", { name: pair.recipient.fullName }).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${pair.recipient.id}$`));
    await expect(page.getByRole("heading", { level: 1, name: pair.recipient.fullName })).toBeVisible();

    await openLiveBoard(page);
    await spotlightSearch(page).fill(pair.recipient.fullName);
    await cloudName(page, pair.recipient.fullName).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${pair.recipient.id}$`));
    await expect(page.getByRole("heading", { level: 1, name: pair.recipient.fullName })).toBeVisible();
  });
});
