import { waitForRouterRefresh } from "./kudo-composer-e2e-steps";
import { expect, kudosSentBy, seedKudo, test } from "./kudo-e2e-fixtures";

/**
 * F003 composer, edit mode (US004, FR-401/402): the form opens prefilled from
 * GET /api/kudos/{id}/edit, the recipient is locked, and "Lưu" updates the same kudo.
 * Until phase 05 adds the edit button on Kudo cards, the placeholder home opens the editor
 * from `/?editKudo={id}` (owner-checked by the edit route like any other entry).
 */
test.describe("Kudo composer — edit", () => {
  test("opens prefilled with the recipient locked, then saves the changed body in place", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    const seeded = await seedKudo(pair, { title: "Người truyền lửa", body: "Cảm ơn bạn", hashtagCount: 2 });
    await auth.signIn(pair.sender);
    await page.goto(`/?editKudo=${seeded.id}`);

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

  test("another Sunner cannot open someone else's kudo for editing", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const seeded = await seedKudo(pair, { title: null, body: "Cảm ơn bạn", hashtagCount: 1 });
    await auth.signIn(pair.recipient);
    await page.goto(`/?editKudo=${seeded.id}`);

    const dialog = page.getByRole("dialog", { name: "Chỉnh sửa bài viết của bạn" });
    await expect(dialog.getByRole("alert")).toHaveText("Bạn không có quyền sửa Kudo này.");
    await expect(dialog.getByRole("textbox", { name: "Lời nhắn" })).toHaveCount(0);
    await expect(dialog.getByText("Cảm ơn bạn")).toHaveCount(0);
  });
});
