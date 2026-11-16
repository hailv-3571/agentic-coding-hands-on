import { expect, kudosSentBy, PNG_BYTES, test } from "./kudo-e2e-fixtures";
import { fillRequired, isServerAction, openComposer, waitForRouterRefresh } from "./kudo-composer-e2e-steps";

/**
 * F003 composer guards from UI review round 1: no cancel while a send is in flight (W1), the
 * mention popup's ARIA wiring on the message textarea (W2), and the image slot cap / upload
 * limit message when files arrive faster than a re-render.
 */
test.describe("Kudo composer — guards", () => {
  test("Hủy and Esc do nothing while the kudo is being sent; exactly one kudo is created", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    const dialog = await openComposer(page);
    await fillRequired(dialog, pair);

    // Hold the Server Action request until the test has tried to cancel.
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/*", async (route) => {
      if (isServerAction(route.request())) await held;
      await route.fallback();
    });

    await dialog.getByRole("button", { name: "Gửi", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Đang gửi…" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Hủy", exact: true })).toBeDisabled();
    await dialog.getByRole("textbox", { name: "Lời nhắn" }).press("Escape");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(dialog).toBeVisible();

    const refreshed = waitForRouterRefresh(page);
    release();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "Đã gửi Kudo thành công!" })).toBeVisible();
    await refreshed;
    expect(await kudosSentBy(pair.sender.id)).toHaveLength(1);
  });

  test("the message textarea stays a textbox and points at the mention list only while it is open", async ({
    page,
    auth,
    kudoUsers,
  }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    const dialog = await openComposer(page);

    const body = dialog.getByRole("textbox", { name: "Lời nhắn" });
    await expect(body).toHaveAttribute("aria-autocomplete", "list");
    await expect(body).toHaveAttribute("aria-haspopup", "listbox");
    await expect(body).not.toHaveAttribute("aria-controls");

    await body.fill(`Cảm ơn @${pair.recipient.fullName}`);
    const list = dialog.getByRole("listbox", { name: "Gợi ý đồng nghiệp" });
    await expect(list).toBeVisible();
    await expect(body).toHaveAttribute("aria-controls", (await list.getAttribute("id"))!);
    const option = list.getByRole("option", { name: new RegExp(pair.recipient.fullName) });
    await expect(option).toHaveAttribute("aria-selected", "true");
    await expect(body).toHaveAttribute("aria-activedescendant", (await option.getAttribute("id"))!);
    await expect(dialog.locator('[aria-live="polite"]').filter({ hasText: "1 kết quả" })).toHaveCount(1);
    await expect(dialog.getByRole("combobox", { name: "Lời nhắn" })).toHaveCount(0);

    await body.press("Enter");
    await expect(body).toHaveValue(`Cảm ơn @${pair.recipient.fullName} `);
    await expect(list).toHaveCount(0);
    await expect(body).not.toHaveAttribute("aria-controls");
    await expect(body).not.toHaveAttribute("aria-activedescendant");
    await body.pressSequentially("nhé"); // typing on after a picked mention keeps the list closed
    await expect(body).toHaveValue(`Cảm ơn @${pair.recipient.fullName} nhé`);
    await expect(list).toHaveCount(0);
  });

  test("two quick picks never pass 5 images; a 429 sign shows the upload-limit message", async ({ page, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await auth.signIn(pair.sender);
    await page.route("**/api/kudos/images/sign", (route) =>
      route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ code: "UPLOAD_LIMIT" }) }),
    );
    const dialog = await openComposer(page);

    // Two change events in one task: no re-render can happen between them.
    await dialog.locator('input[type="file"]').evaluate((input: HTMLInputElement, bytes: number[]) => {
      for (const batch of [3, 3]) {
        const files = new DataTransfer();
        for (let index = 0; index < batch; index += 1) {
          files.items.add(new File([new Uint8Array(bytes)], `p${batch}-${index}.png`, { type: "image/png" }));
        }
        input.files = files.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, [...PNG_BYTES]);

    await expect(dialog.getByTestId("kudo-image-thumbnail")).toHaveCount(5);
    await expect(dialog.getByText("Bạn đã tải lên quá nhiều ảnh trong thời gian ngắn. Vui lòng thử lại sau.")).toBeVisible();
    await expect(dialog.getByText("Đính tối đa 5 ảnh.")).toBeVisible(); // the 6th file was dropped
  });
});
