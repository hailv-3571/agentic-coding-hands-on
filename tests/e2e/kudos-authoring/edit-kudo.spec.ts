import { waitForRouterRefresh } from "./kudo-composer-e2e-steps";
import { expect, feedWindow, kudosSentBy, seedKudo, test } from "./kudo-e2e-fixtures";

/**
 * F003 composer, edit mode (US004, FR-401/402): the owner opens it from the pen on their own Kudo
 * card on the Live board (phase 05). The form opens prefilled from GET /api/kudos/{id}/edit, the
 * recipient is locked, and "Lưu" updates the same kudo. Seeded kudos get a far-future
 * `created_at` so they sit on the first feed page.
 */
const feedCard = (page: import("@playwright/test").Page, id: string) =>
  page.getByRole("region", { name: "ALL KUDOS" }).locator(`article[data-kudo-id="${id}"]`);

test.describe("Kudo composer — edit", () => {
  test("opens prefilled with the recipient locked, then saves the changed body in place", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const seeded = await seedKudo(pair, {
      title: "Người truyền lửa",
      body: "Cảm ơn bạn",
      hashtagCount: 2,
      createdAt: feedWindow("top")(),
    });
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    await feedCard(page, seeded.id).getByRole("button", { name: "Chỉnh sửa Kudo" }).click();

    const dialog = page.getByRole("dialog", { name: "Chỉnh sửa bài viết của bạn" });
    await expect(dialog).toBeVisible();

    // Recipient: shown, but not searchable or editable.
    await expect(dialog.getByRole("combobox", { name: "Người nhận" })).toHaveCount(0);
    const recipient = dialog.getByRole("textbox", { name: "Người nhận" });
    await expect(recipient).toHaveValue(pair.recipient.fullName);
    await expect(recipient).toHaveAttribute("readonly", "");

    const title = dialog.getByRole("textbox", { name: "Danh hiệu" });
    await expect(title).toHaveValue("Người truyền lửa");
    await expect(title).toBeFocused(); // first editable field once the prefill has loaded
    const body = dialog.getByRole("textbox", { name: "Lời nhắn" });
    await expect(body).toHaveValue("Cảm ơn bạn");
    for (const label of seeded.hashtagLabels) {
      await expect(dialog.getByRole("button", { name: `Bỏ ${label}` })).toBeVisible();
    }

    await body.fill("Cảm ơn bạn, đã sửa lại");
    const refreshed = waitForRouterRefresh(page);
    await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "Đã lưu thay đổi." })).toBeVisible();
    await refreshed;
    await expect(feedCard(page, seeded.id).getByText("Cảm ơn bạn, đã sửa lại")).toBeVisible();

    const kudos = await kudosSentBy(pair.sender.id);
    expect(kudos).toHaveLength(1);
    expect(kudos[0]).toMatchObject({
      id: seeded.id,
      recipient_id: pair.recipient.id,
      title: "Người truyền lửa",
      body: "Cảm ơn bạn, đã sửa lại",
    });
    expect(kudos[0].kudo_hashtags).toHaveLength(2);
  });

  test("another Sunner gets no edit pen and the edit route refuses them", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const seeded = await seedKudo(pair, { title: null, body: "Cảm ơn bạn", hashtagCount: 1, createdAt: feedWindow("top")() });
    await auth.signIn(pair.recipient);
    await page.goto("/kudos");

    const card = feedCard(page, seeded.id);
    await expect(card.getByText("Cảm ơn bạn")).toBeVisible();
    await expect(card.getByRole("button", { name: "Chỉnh sửa Kudo" })).toHaveCount(0);

    const response = await page.request.get(`/api/kudos/${seeded.id}/edit`);
    expect(response.status()).toBe(403);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ code: "FORBIDDEN" });
    expect(text).not.toContain("Cảm ơn bạn");
  });
});
