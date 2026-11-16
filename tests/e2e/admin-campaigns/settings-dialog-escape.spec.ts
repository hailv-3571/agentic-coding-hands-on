import { failServerActions } from "../kudos-hearts/kudo-heart-e2e-fixtures";
import { campaignRow, expect, farFutureWindow, rowActions, test } from "./campaign-e2e-fixtures";

/**
 * F011 dialogs keep their keyboard exit after a failed write (review 2026-11-17): while saving or
 * deleting, the locked buttons must not drop focus to <body>, and Esc must still close the dialog
 * once the write has failed, returning focus to the opener.
 */
const SETTINGS = "/admin/settings";

test.describe("Admin › Settings dialogs after a failed write", () => {
  test("Esc closes the Add dialog after a failed save and focus returns to Add Campaign", async ({ page, sunners, auth, campaigns }) => {
    await auth.signIn(await sunners.create({ admin: true }));
    await page.goto(SETTINGS);
    const opener = page.getByRole("button", { name: "Add Campaign" });
    await opener.click();
    const add = page.getByRole("dialog", { name: "Add Campaign" });
    const window = farFutureWindow();
    const name = campaigns.name("Lưu lỗi");
    await add.getByLabel("Campaign Name").fill(name);
    await add.getByLabel("Start Date").fill(window.at(3, 9));
    await add.getByLabel("End Date").fill(window.at(4, 9));

    await failServerActions(page);
    await add.getByRole("button", { name: "Add Campaign" }).click();
    await expect(add.getByRole("alert")).toHaveText("Không lưu được, vui lòng thử lại");
    await expect(page.locator("body")).not.toBeFocused();

    await page.keyboard.press("Escape");
    await expect(add).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await campaigns.find(name)).toBeNull();
  });

  test("Esc closes the Delete dialog after a failed delete and focus returns to the row menu", async ({ page, sunners, auth, campaigns }) => {
    const window = farFutureWindow();
    const name = await campaigns.seed({
      label: "Xoá lỗi",
      startsAt: new Date(Date.UTC(window.year, window.month - 1, 5)),
      endsAt: new Date(Date.UTC(window.year, window.month - 1, 6)),
    });
    await auth.signIn(await sunners.create({ admin: true }));
    await page.goto(SETTINGS);
    await rowActions(page, name).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Delete Campaign" });

    await failServerActions(page);
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(confirm.getByRole("alert")).toHaveText("Không xoá được, vui lòng thử lại");
    await expect(page.locator("body")).not.toBeFocused();

    await page.keyboard.press("Escape");
    await expect(confirm).toHaveCount(0);
    await expect(rowActions(page, name)).toBeFocused();
    await expect(campaignRow(page, name)).toBeVisible();
    expect(await campaigns.find(name)).not.toBeNull();
  });
});
