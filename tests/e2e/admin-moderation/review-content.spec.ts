import { readFile } from "node:fs/promises";
import { serviceClient } from "../../setup/local-sunner-accounts";
import { expect, feedWindow, seedFeedKudo, test } from "../kudos-feed/live-board-fixtures";
import { bodyRows, openReview, REVIEW, reviewRow, searchParam, shortId, storedStatus } from "./review-content-e2e-steps";

/**
 * F007 Admin › Review content `/admin/review` (phase 08): admin-only (FR-601), Sender filter through
 * the Sunner search, any filter / search / sort change back to page 1 (FR-402), a page past the end
 * clamped to the last one, Mark Spam / Un Spam confirmed in the row popover and patched in place
 * without a reload (D004, FR-406), the real sender of an anonymous Kudo with the "Ẩn danh" chip
 * (D001), the reversed date range refusal and the CSV Export of the current filter (D007). Kudos are
 * seeded with the service role in far-future windows and scoped to their own sender, so parallel
 * workers and real data never interfere. English and phone width: review-content-english-and-phone.spec.ts.
 */
test.describe("Admin › Review content", () => {
  test("a non-admin gets the 403 page without the review table", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    const response = await page.goto(REVIEW);
    expect(response!.status()).toBe(403);
    await expect(page.getByRole("heading", { level: 1, name: "Không có quyền truy cập" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Export" })).toHaveCount(0);
  });

  test("filters by Sender through the Sunner search; every later change goes back to page 1", async ({ page, sunners, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    for (let index = 0; index < 12; index++) {
      await seedFeedKudo(pair, { body: `Lời cảm ơn số ${index}`, createdAt: at(index), status: index === 0 ? "spam" : "public" });
    }
    await auth.signIn(await sunners.create({ admin: true }));
    await openReview(page);
    await expect(page.getByRole("heading", { level: 1, name: "Review content" })).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveText(["ID", "Người gửi", "Người nhận", "Nội dung", "Hashtag", "Tim", "Trạng thái", "Thao tác"]);

    await page.getByRole("combobox", { name: "Người gửi" }).fill(pair.sender.fullName);
    await page.getByRole("option", { name: new RegExp(pair.sender.fullName) }).click();
    await expect.poll(() => searchParam(page, "sender")).toBe(pair.sender.id);
    await expect(bodyRows(page)).toHaveCount(10);
    await expect(bodyRows(page).filter({ hasText: pair.sender.fullName })).toHaveCount(10);

    const pagination = page.getByRole("navigation", { name: "Phân trang" });
    await pagination.getByRole("button", { name: "Trang 2" }).click();
    await expect.poll(() => searchParam(page, "page")).toBe("2");
    await expect(bodyRows(page)).toHaveCount(2);
    await expect(pagination.getByRole("button", { name: "Trang 2" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: /^Trạng thái/ }).click();
    await page.getByRole("option", { name: "Public" }).click();
    await expect.poll(() => searchParam(page, "status")).toBe("public");
    expect(searchParam(page, "page")).toBeNull();
    await expect(pagination.getByRole("button", { name: "Trang 1" })).toHaveAttribute("aria-current", "page");
    await expect(bodyRows(page).getByText("Spam", { exact: true })).toHaveCount(0);

    await pagination.getByRole("button", { name: "Trang 2" }).click();
    await expect.poll(() => searchParam(page, "page")).toBe("2");
    await page.getByRole("button", { name: "Tim" }).click();
    await expect.poll(() => searchParam(page, "sort")).toBe("hearts_desc");
    expect(searchParam(page, "page")).toBeNull();
    await expect(page.getByRole("columnheader", { name: "Tim" })).toHaveAttribute("aria-sort", "descending");

    await page.getByRole("searchbox", { name: "Tìm theo nội dung" }).fill("số 7");
    await expect.poll(() => searchParam(page, "q")).toBe("số 7");
    await expect(bodyRows(page)).toHaveCount(1);
    await expect(bodyRows(page)).toContainText("Lời cảm ơn số 7");
  });

  test("a page past the end shows the last page as current and Previous goes one page back", async ({ page, sunners, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    for (let index = 0; index < 21; index++) await seedFeedKudo(pair, { body: `Trang cuối ${index}`, createdAt: at(index) });
    await auth.signIn(await sunners.create({ admin: true }));
    await openReview(page, `?sender=${pair.sender.id}&page=99`);
    await expect(bodyRows(page)).toHaveCount(1);

    const pagination = page.getByRole("navigation", { name: "Phân trang" });
    await expect(pagination.getByRole("button", { name: "Trang 3" })).toHaveAttribute("aria-current", "page");
    await pagination.getByRole("button", { name: "Trang trước" }).click();
    await expect.poll(() => searchParam(page, "page")).toBe("2");
    await expect(pagination.getByRole("button", { name: "Trang 2" })).toHaveAttribute("aria-current", "page");
    await expect(bodyRows(page)).toHaveCount(10);
  });

  test("Mark Spam and Un Spam are confirmed in the popover and patch the row without a reload", async ({ page, sunners, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, {
      title: "Người truyền lửa",
      body: "Cảm ơn **rất nhiều** vì [bài này](https://example.com/a)",
      createdAt: feedWindow("top")(),
      anonymousNickname: "Bí Ẩn",
    });
    await auth.signIn(await sunners.create({ admin: true }));
    await openReview(page, `?sender=${pair.sender.id}`);
    const row = reviewRow(page, id);
    // D001: the admin sees the real sender of an anonymous Kudo, labelled; Markdown shows as plain text.
    await expect(row).toContainText(pair.sender.fullName);
    await expect(row.getByText("Ẩn danh", { exact: true })).toBeVisible();
    await expect(row).toContainText("Cảm ơn rất nhiều vì bài này");
    await expect(row).not.toContainText("**");
    await expect(row.getByText("Public", { exact: true })).toBeVisible();
    await page.evaluate(() => Object.assign(window, { sameDocument: true }));

    const markSpam = row.getByRole("button", { name: `Mark Spam Kudo ${shortId(id)}` });
    await markSpam.click();
    const confirmItem = page.getByRole("menu", { name: `Xác nhận Mark Spam Kudo ${shortId(id)}` }).getByRole("menuitem", { name: "Mark Spam" });
    await expect(confirmItem).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(confirmItem).toHaveCount(0);
    await expect(markSpam).toBeFocused();
    expect(await storedStatus(id)).toBe("public");

    await markSpam.click();
    await confirmItem.click();
    await expect(page.getByRole("status").filter({ hasText: "Đã đánh dấu Spam." })).toBeVisible();
    await expect(row.getByText("Spam", { exact: true })).toBeVisible();
    const unSpam = row.getByRole("button", { name: `Un Spam Kudo ${shortId(id)}` });
    await expect(unSpam).toBeVisible();
    expect(await storedStatus(id)).toBe("spam");

    await unSpam.click();
    await page.getByRole("menu", { name: `Xác nhận Un Spam Kudo ${shortId(id)}` }).getByRole("menuitem", { name: "Un Spam" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Đã chuyển Kudo về Public." })).toBeVisible();
    await expect(row.getByText("Public", { exact: true })).toBeVisible();
    expect(await storedStatus(id)).toBe("public");
    expect(await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument)).toBe(true);
  });

  test("a Kudo another admin already marked shows its current status with a notice", async ({ page, sunners, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const id = await seedFeedKudo(pair, { body: "Hai admin cùng bấm", createdAt: feedWindow("top")() });
    await auth.signIn(await sunners.create({ admin: true }));
    await openReview(page, `?sender=${pair.sender.id}`);
    const row = reviewRow(page, id);
    await expect(row.getByText("Public", { exact: true })).toBeVisible();

    const { error } = await serviceClient.from("kudos").update({ status: "spam" }).eq("id", id);
    if (error) throw error;
    await row.getByRole("button", { name: `Mark Spam Kudo ${shortId(id)}` }).click();
    await page.getByRole("menuitem", { name: "Mark Spam" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Kudo đã được cập nhật bởi Admin khác." })).toBeVisible();
    await expect(row.getByText("Spam", { exact: true })).toBeVisible();
  });

  test("a reversed date range is refused inline and the table filter stays", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create({ admin: true }));
    await openReview(page);
    await page.getByLabel("Ngày bắt đầu").fill("2026-12-10");
    await expect.poll(() => searchParam(page, "from")).toBe("2026-12-10");
    await page.getByLabel("Ngày kết thúc").fill("2026-12-05");
    await expect(page.getByRole("alert").filter({ hasText: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" })).toBeVisible();
    await expect(page.getByLabel("Ngày kết thúc")).toHaveAttribute("aria-invalid", "true");
    expect(searchParam(page, "to")).toBeNull();
  });

  test("Export downloads the CSV of the current filter", async ({ page, sunners, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    await seedFeedKudo(pair, { body: "Nội dung để xuất CSV", createdAt: feedWindow("top")() });
    await auth.signIn(await sunners.create({ admin: true }));
    await openReview(page, `?sender=${pair.sender.id}`);
    await expect(bodyRows(page)).toHaveCount(1);

    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export" }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    const csv = await readFile(await download.path(), "utf8");
    expect(csv).toContain("Nội dung để xuất CSV");
    expect(csv).toContain(pair.sender.fullName);
    expect(csv).not.toContain("Lời cảm ơn số");
  });
});
