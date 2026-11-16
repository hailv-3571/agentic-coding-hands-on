import { expect, kudosSentBy, PNG_BYTES, test } from "./kudo-e2e-fixtures";
import {
  DEC_001,
  fillRequired,
  isServerAction,
  LAUNCHER,
  openComposer,
  pickHashtags,
  pickRecipient,
  waitForRouterRefresh,
} from "./kudo-composer-e2e-steps";

/**
 * F003 composer, create mode (phase 04 e2e scope): full compose with every optional part,
 * DEC-001, the anonymous nickname rule, double-submit safety and the dirty-form Esc guard.
 * The launcher pill lives on the Live board (`/kudos`) since phase 05.
 */

test.describe("Kudo composer — create", () => {
  test("sends a kudo with title, bold body, 2 hashtags, 1 image and an anonymous nickname", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    const dialog = await openComposer(page);

    await pickRecipient(dialog, pair);
    await dialog.getByRole("textbox", { name: "Danh hiệu" }).fill("Người truyền lửa");

    const body = dialog.getByRole("textbox", { name: "Lời nhắn" });
    await body.fill("Cảm ơn bạn rất nhiều");
    await body.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(7, 10)); // "bạn"
    await dialog.getByRole("button", { name: "In đậm" }).click();
    await expect(body).toHaveValue("Cảm ơn **bạn** rất nhiều");
    await expect(dialog.getByText("24/1.000")).toBeVisible();

    await pickHashtags(dialog, ["#BE PROFESSIONAL", "#BE A TEAM"]);

    await dialog.locator('input[type="file"]').setInputFiles({ name: "team.png", mimeType: "image/png", buffer: PNG_BYTES });
    const thumbnail = dialog.getByTestId("kudo-image-thumbnail");
    await expect(thumbnail).toHaveCount(1);
    await expect(thumbnail).toHaveAttribute("data-upload-status", "done", { timeout: 15_000 });

    await dialog.getByRole("checkbox", { name: "Gửi lời cám ơn và ghi nhận ẩn danh" }).check();
    await dialog.getByRole("textbox", { name: "Nickname ẩn danh" }).fill("Doraemon");
    const refreshed = waitForRouterRefresh(page);
    await dialog.getByRole("button", { name: "Gửi", exact: true }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "Đã gửi Kudo thành công!" })).toBeVisible();
    await refreshed;

    const [kudo, ...others] = await kudosSentBy(pair.sender.id);
    expect(others).toHaveLength(0);
    expect(kudo).toMatchObject({
      recipient_id: pair.recipient.id,
      title: "Người truyền lửa",
      body: "Cảm ơn **bạn** rất nhiều",
      is_anonymous: true,
      anonymous_nickname: "Doraemon",
    });
    expect(kudo.kudo_hashtags).toHaveLength(2);
    expect(kudo.kudo_images).toHaveLength(1);
    expect(kudo.kudo_images[0]).toMatchObject({ position: 0, storage_path: expect.stringMatching(/^kudos\/[0-9a-f-]{36}\.png$/) });
  });

  test("shows the DEC-001 sentence when recipient, message and hashtag are missing", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    const dialog = await openComposer(page);

    await dialog.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(dialog.getByRole("alert")).toHaveText(DEC_001);
    await expect(dialog.getByRole("combobox", { name: "Người nhận" })).toHaveAttribute("aria-invalid", "true");
    await expect(dialog).toBeVisible();
    expect(await kudosSentBy(pair.sender.id)).toHaveLength(0);
  });

  test("asks for a nickname when sending anonymously without one", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    const dialog = await openComposer(page);

    await fillRequired(dialog, pair);
    await dialog.getByRole("checkbox", { name: "Gửi lời cám ơn và ghi nhận ẩn danh" }).check();
    const nickname = dialog.getByRole("textbox", { name: "Nickname ẩn danh" });
    await expect(nickname).toHaveAttribute("aria-required", "true");
    await dialog.getByRole("button", { name: "Gửi", exact: true }).click();

    await expect(dialog.getByText("Vui lòng nhập nickname ẩn danh.")).toBeVisible();
    await expect(nickname).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByText(DEC_001)).toHaveCount(0);
    expect(await kudosSentBy(pair.sender.id)).toHaveLength(0);
  });

  test("a double click on Gửi creates exactly one kudo", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    const dialog = await openComposer(page);

    await fillRequired(dialog, pair);
    const actionCalls: string[] = [];
    page.on("request", (request) => isServerAction(request) && actionCalls.push(request.url()));
    const refreshed = waitForRouterRefresh(page);
    await dialog.getByRole("button", { name: "Gửi", exact: true }).dblclick();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "Đã gửi Kudo thành công!" })).toBeVisible();
    await refreshed;
    expect(actionCalls).toHaveLength(1);
    expect(await kudosSentBy(pair.sender.id)).toHaveLength(1);
  });

  test("Esc on a dirty form asks before discarding; Esc on a clean form just closes", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    let dialog = await openComposer(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: LAUNCHER })).toBeFocused();

    dialog = await openComposer(page);
    const body = dialog.getByRole("textbox", { name: "Lời nhắn" });
    await body.fill("Nội dung đang soạn dở");
    await body.press("Escape");
    const confirm = page.getByRole("alertdialog", { name: "Bỏ nội dung đang soạn?" });
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Tiếp tục soạn" }).click();
    await expect(confirm).toBeHidden();
    await expect(body).toHaveValue("Nội dung đang soạn dở");

    await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Bỏ nội dung" }).click();
    await expect(dialog).toBeHidden();
  });
});
