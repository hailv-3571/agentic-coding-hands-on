import { campaignRow, expect, farFutureWindow, rowActions, test } from "./campaign-e2e-fixtures";

/**
 * F011 Admin › Settings `/admin/settings` (phase 06): admin-only page (FR-601), add with field
 * errors (FR-303), edit and delete through the row menu (FR-302/FR-308), the overlap refusal naming
 * the other campaign (FR-304), the active campaign's locked start (DEC-002) and the read-only ended
 * row (DEC-001). Instants are typed as ADMIN_TIMEZONE wall clock in the datetime-local inputs.
 */
const SETTINGS = "/admin/settings";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** `yyyy-MM-ddTHH:mm` + hours, as pure wall-clock arithmetic (the zone has no DST). */
function addHours(local: string, hours: number): string {
  return new Date(Date.parse(`${local}:00Z`) + hours * HOUR).toISOString().slice(0, 16);
}

test.describe("Admin › Settings", () => {
  test("a non-admin gets the 403 page without any campaign markup", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    const response = await page.goto(SETTINGS);
    expect(response!.status()).toBe(403);
    await expect(page.getByRole("heading", { level: 1, name: "Không có quyền truy cập" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Campaign" })).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("an admin adds a campaign (field errors first), edits it and deletes it", async ({ page, sunners, auth, campaigns }) => {
    await auth.signIn(await sunners.create({ admin: true }));
    await page.goto(SETTINGS);
    await expect(page.getByRole("heading", { level: 1, name: "Setting" })).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveText(["ID", "Name", "Time", "Actions"]);

    await page.getByRole("button", { name: "Add Campaign" }).click();
    const add = page.getByRole("dialog", { name: "Add Campaign" });
    const nameInput = add.getByLabel("Campaign Name");
    await expect(nameInput).toBeFocused();
    await add.getByRole("button", { name: "Add Campaign" }).click();
    await expect(nameInput).toHaveAccessibleDescription("Vui lòng nhập tên chiến dịch (tối đa 100 ký tự)");
    await expect(add.getByLabel("Start Date")).toHaveAccessibleDescription("Vui lòng chọn giờ bắt đầu");
    await expect(add.getByLabel("End Date")).toHaveAccessibleDescription("Vui lòng chọn giờ kết thúc");

    const window = farFutureWindow();
    const name = campaigns.name("Ngày x2 tim");
    await nameInput.fill(name);
    await expect(nameInput).not.toHaveAccessibleDescription(/Vui lòng/);
    await add.getByLabel("Start Date").fill(window.at(10, 10));
    await add.getByLabel("End Date").fill(window.at(9, 10));
    await add.getByRole("button", { name: "Add Campaign" }).click();
    await expect(add.getByLabel("End Date")).toHaveAccessibleDescription("Giờ kết thúc phải sau giờ bắt đầu");

    await add.getByLabel("End Date").fill(window.at(12, 18));
    await add.getByRole("button", { name: "Add Campaign" }).click();
    await expect(add).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Đã thêm chiến dịch" })).toBeVisible();
    const row = campaignRow(page, name);
    await expect(row).toContainText(window.displayDate(10));
    await expect(row).toContainText("10:00");
    await expect(row).toContainText(window.displayDate(12));
    await expect(row).toContainText("18:00");

    await rowActions(page, name).click();
    await page.getByRole("menu").getByRole("menuitem", { name: "Edit" }).click();
    const edit = page.getByRole("dialog", { name: "Edit Campaign" });
    await expect(edit.getByLabel("Campaign Name")).toHaveValue(name);
    await expect(edit.getByLabel("Start Date")).toHaveValue(window.at(10, 10));
    await expect(edit.getByLabel("Start Date")).toBeEditable();
    await expect(edit.getByLabel("End Date")).toHaveValue(window.at(12, 18));
    const renamed = campaigns.name("Ngày x2 tim (đổi tên)");
    await edit.getByLabel("Campaign Name").fill(renamed);
    await edit.getByLabel("Start Date").fill(window.at(11, 8));
    await edit.getByRole("button", { name: "Save Campaign" }).click();
    await expect(edit).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Đã lưu chiến dịch" })).toBeVisible();
    await expect(campaignRow(page, renamed)).toContainText(window.displayDate(11));
    await expect(campaignRow(page, renamed)).toContainText("08:00");

    await rowActions(page, renamed).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Delete Campaign" });
    await expect(confirm).toContainText("Bạn có chắc chắn muốn xoá campaign");
    await expect(confirm).toContainText(renamed);
    await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(confirm).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Đã xoá chiến dịch" })).toBeVisible();
    await expect(campaignRow(page, renamed)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add Campaign" })).toBeFocused();
    expect(await campaigns.find(renamed)).toBeNull();
  });

  test("an overlapping window is refused under End Date, naming the other campaign", async ({ page, sunners, auth, campaigns }) => {
    const window = farFutureWindow();
    const other = await campaigns.seed({
      label: "Đang chiếm chỗ",
      startsAt: new Date(Date.UTC(window.year, window.month - 1, 1)),
      endsAt: new Date(Date.UTC(window.year, window.month - 1, 10)),
    });
    await auth.signIn(await sunners.create({ admin: true }));
    await page.goto(SETTINGS);

    await page.getByRole("button", { name: "Add Campaign" }).click();
    const add = page.getByRole("dialog", { name: "Add Campaign" });
    const name = campaigns.name("Trùng giờ");
    await add.getByLabel("Campaign Name").fill(name);
    await add.getByLabel("Start Date").fill(window.at(5, 10));
    await add.getByLabel("End Date").fill(window.at(15, 10));
    await add.getByRole("button", { name: "Add Campaign" }).click();

    await expect(add.getByLabel("End Date")).toHaveAccessibleDescription(
      new RegExp(`^Khoảng thời gian trùng với chiến dịch ${other} \\(01/${String(window.month).padStart(2, "0")}/${window.year} - 07:00 - `),
    );
    await expect(add).toBeVisible();
    expect(await campaigns.find(name)).toBeNull();
  });

  test("an active campaign keeps its start locked while the name and end still save", async ({ page, sunners, auth, campaigns }) => {
    // The only campaign live now: seedActive waits out or names any other window holding the present.
    const name = await campaigns.seedActive("Đang chạy", { fromNowMs: -HOUR, toNowMs: 2 * HOUR });
    const stored = (await campaigns.find(name))!;
    await auth.signIn(await sunners.create({ admin: true }));
    await page.goto(SETTINGS);

    await rowActions(page, name).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const edit = page.getByRole("dialog", { name: "Edit Campaign" });
    const start = edit.getByLabel("Start Date");
    await expect(start).not.toBeEditable();
    await expect(start).toHaveAccessibleDescription("Chiến dịch đang chạy, không thể đổi giờ bắt đầu");
    const end = edit.getByLabel("End Date");
    await expect(end).toBeEditable();

    const renamed = campaigns.name("Đang chạy (gia hạn)");
    await edit.getByLabel("Campaign Name").fill(renamed);
    await end.fill(addHours(await end.inputValue(), 1));
    await edit.getByRole("button", { name: "Save Campaign" }).click();
    await expect(edit).toHaveCount(0);
    await expect(campaignRow(page, renamed)).toBeVisible();

    const saved = (await campaigns.find(renamed))!;
    expect(Date.parse(saved.starts_at)).toBe(Date.parse(stored.starts_at));
    expect(Date.parse(saved.ends_at)).toBe(Date.parse(stored.ends_at) + HOUR);
  });

  test("an ended row has no actions; the row menu works from the keyboard", async ({ page, sunners, auth, campaigns }) => {
    const past = Date.UTC(1990 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 27));
    const ended = await campaigns.seed({ label: "Đã kết thúc", startsAt: new Date(past), endsAt: new Date(past + DAY) });
    const window = farFutureWindow();
    const upcoming = await campaigns.seed({
      label: "Sắp chạy",
      startsAt: new Date(Date.UTC(window.year, window.month - 1, 3)),
      endsAt: new Date(Date.UTC(window.year, window.month - 1, 4)),
    });
    await auth.signIn(await sunners.create({ admin: true }));
    await page.goto(SETTINGS);

    await expect(campaignRow(page, ended)).toBeVisible();
    await expect(campaignRow(page, ended).getByRole("button")).toHaveCount(0);

    const trigger = rowActions(page, upcoming);
    const menu = page.getByRole("menu");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("menuitem", { name: "Edit" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(menu).toHaveCount(0);

    await trigger.click();
    await page.getByRole("heading", { level: 1, name: "Setting" }).click();
    await expect(menu).toHaveCount(0);

    // Phone width: the table fits, no horizontal page scroll.
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(campaignRow(page, upcoming)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "horizontal overflow at 375px").toBe(0);
  });
});
