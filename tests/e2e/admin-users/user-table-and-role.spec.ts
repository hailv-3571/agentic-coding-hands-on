import { readFile } from "node:fs/promises";
import { expect, feedWindow, seedFeedKudo, setFullName, test } from "../kudos-feed/live-board-fixtures";
import { bodyRows, openUsers, pick, searchParam, storedRole, tokenName, userRow } from "./admin-users-e2e-steps";

/**
 * F014 Admin › User `/admin/users` (phase 14): the search, Unit and Role filters and the sortable
 * headers all go back to page 1 (spec § 4), 20 rows per page, "(n)" = column total of the filter,
 * the zero-row empty state, the role change confirmed in a dialog (DEC-001, D007) with the actor's
 * own row locked, the CSV Export of the current filter, and the phone width. Every test names its
 * Sunners with its own token and searches for it, so parallel workers and real data never land in its rows.
 */
test.describe("Admin › User", () => {
  test("filters, sorts and pages the table; every filter or sort change goes back to page 1", async ({ page, sunners, auth, kudoUsers }) => {
    const tag = tokenName();
    const [top, second] = [await kudoUsers.pair(), await kudoUsers.pair()];
    const at = feedWindow("top");
    for (let index = 0; index < 3; index++) await seedFeedKudo(top, { body: `${tag} cảm ơn ${index}`, createdAt: at(index) });
    await seedFeedKudo(second, { body: `${tag} cảm ơn`, createdAt: at(10) });
    for (const [pair, label] of [[top, "Top"], [second, "Second"]] as const) {
      await Promise.all([setFullName(pair.sender.id, `${tag} Sender ${label}`), setFullName(pair.recipient.id, `${tag} Recipient ${label}`)]);
    }
    // 18 more: the first three have no unit ("Chưa gán đơn vị"), 22 matching users = 2 pages.
    await Promise.all(
      Array.from({ length: 18 }, async (_, index) => {
        const member = await sunners.create({ onboarded: index >= 3 });
        await setFullName(member.id, `${tag} Member ${String(index).padStart(2, "0")}`);
      }),
    );
    await auth.signIn(await sunners.create({ admin: true }));

    await openUsers(page, `?q=${"a".repeat(101)}`);
    await expect(page.getByRole("alert").filter({ hasText: "Từ khoá tối đa 100 ký tự" })).toBeVisible();

    await openUsers(page);
    await expect(page.getByRole("heading", { level: 1, name: "User" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Tìm theo tên hoặc email" }).fill(tag);
    await expect.poll(() => searchParam(page, "q")).toBe(tag);
    await expect(bodyRows(page)).toHaveCount(20);
    await expect(page.getByRole("columnheader", { name: /∑ sent Kudos \(4\)/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /∑ Received Kudos \(4\)/ })).toBeVisible();

    const pagination = page.getByRole("navigation", { name: "Phân trang" });
    await pagination.getByRole("button", { name: "Trang 2" }).click();
    await expect.poll(() => searchParam(page, "page")).toBe("2");
    await expect(bodyRows(page)).toHaveCount(2);

    await pick(page, /^Unit/, "Chưa gán đơn vị");
    await expect.poll(() => searchParam(page, "unit")).toBe("none");
    expect(searchParam(page, "page")).toBeNull();
    await expect(bodyRows(page)).toHaveCount(3);
    await expect(bodyRows(page).filter({ hasText: `${tag} Member 0` })).toHaveCount(3);
    await pick(page, /^Unit/, "Tất cả");
    await expect.poll(() => searchParam(page, "unit")).toBeNull();
    await expect(bodyRows(page)).toHaveCount(20);

    await pagination.getByRole("button", { name: "Trang 2" }).click();
    await expect.poll(() => searchParam(page, "page")).toBe("2");
    await page.getByRole("button", { name: /^∑ sent Kudos/ }).click();
    await expect.poll(() => searchParam(page, "dir")).toBe("desc");
    expect(searchParam(page, "sort")).toBe("sent");
    expect(searchParam(page, "page")).toBeNull();
    await expect(page.getByRole("columnheader", { name: /∑ sent Kudos/ })).toHaveAttribute("aria-sort", "descending");
    await expect(bodyRows(page).nth(0)).toContainText(`${tag} Sender Top`);
    await expect(bodyRows(page).nth(1)).toContainText(`${tag} Sender Second`);
    await page.getByRole("button", { name: /^∑ sent Kudos/ }).click();
    await expect.poll(() => searchParam(page, "dir")).toBe("asc");
    await expect(page.getByRole("columnheader", { name: /∑ sent Kudos/ })).toHaveAttribute("aria-sort", "ascending");

    await pick(page, /^Role/, "Admin");
    await expect.poll(() => searchParam(page, "role")).toBe("admin");
    await expect(page.getByText("Không có người dùng nào phù hợp bộ lọc.")).toBeVisible();
    await page.getByRole("button", { name: "Xoá bộ lọc" }).click();
    await expect.poll(() => searchParam(page, "role")).toBeNull();
    expect(searchParam(page, "q")).toBeNull();
  });

  test("a search that matches nobody shows the empty state with zero totals and no pager", async ({ page, sunners, auth }) => {
    const nobody = `Nobody${tokenName()}`;
    await auth.signIn(await sunners.create({ admin: true }));
    await openUsers(page);
    await page.getByRole("searchbox", { name: "Tìm theo tên hoặc email" }).fill(nobody);
    await expect.poll(() => searchParam(page, "q")).toBe(nobody);

    await expect(bodyRows(page).getByText("Không có người dùng nào phù hợp bộ lọc.")).toBeVisible();
    await expect(bodyRows(page)).toHaveCount(1);
    await expect(bodyRows(page).getByRole("button", { name: "Xoá bộ lọc" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /∑ sent Kudos \(0\)/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /∑ Received Kudos \(0\)/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Phân trang" })).toHaveCount(0);
  });

  test("Set as Admin / Set as User go through the confirm dialog; the actor's own row is locked", async ({ page, sunners, auth }) => {
    const tag = tokenName();
    const actor = await sunners.create({ admin: true });
    await setFullName(actor.id, `${tag} Actor`);
    const target = await sunners.create();
    await setFullName(target.id, `${tag} Target`);
    await auth.signIn(actor);
    await openUsers(page, `?q=${tag}`);
    await expect(bodyRows(page)).toHaveCount(2);

    const own = userRow(page, `${tag} Actor`).getByRole("button", { name: `Thao tác cho ${tag} Actor` });
    await expect(own).toHaveAttribute("aria-disabled", "true");
    await expect(own).toHaveAccessibleDescription("Bạn không thể tự hạ role của mình.");
    await own.hover();
    await expect(page.getByRole("tooltip", { name: "Bạn không thể tự hạ role của mình." })).toBeVisible();
    // A locked control stays focusable (aria-disabled) but opens nothing.
    await own.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toHaveCount(0);

    const row = userRow(page, `${tag} Target`);
    const trigger = row.getByRole("button", { name: `Thao tác cho ${tag} Target` });
    await expect(row.getByRole("cell", { name: "User", exact: true })).toBeVisible();
    await trigger.click();
    const setAdmin = page.getByRole("menuitem", { name: "Set as Admin" });
    await expect(setAdmin).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(setAdmin).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await setAdmin.click();
    const toAdmin = page.getByRole("alertdialog", { name: "Set as Admin" });
    await expect(toAdmin).toContainText(`${tag} Target`);
    await expect(toAdmin.getByRole("button", { name: "Huỷ" })).toBeFocused();
    await toAdmin.getByRole("button", { name: "Huỷ" }).click();
    await expect(toAdmin).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await storedRole(target.id)).toBe("user");

    await trigger.click();
    await setAdmin.click();
    await toAdmin.getByRole("button", { name: "Xác nhận" }).click();
    await expect(page.getByRole("status").filter({ hasText: `Đã đặt ${tag} Target làm Admin.` })).toBeVisible();
    await expect(toAdmin).toHaveCount(0);
    await expect(row.getByRole("cell", { name: "Admin", exact: true })).toBeVisible();
    await expect.poll(() => storedRole(target.id)).toBe("admin");

    await trigger.click();
    await page.getByRole("menuitem", { name: "Set as User" }).click();
    await page.getByRole("alertdialog", { name: "Set as User" }).getByRole("button", { name: "Xác nhận" }).click();
    await expect(page.getByRole("status").filter({ hasText: `Đã đặt ${tag} Target làm User.` })).toBeVisible();
    await expect(row.getByRole("cell", { name: "User", exact: true })).toBeVisible();
    await expect.poll(() => storedRole(target.id)).toBe("user");
  });

  test("Export downloads the CSV of the current filter", async ({ page, sunners, auth }) => {
    const tag = tokenName();
    const member = await sunners.create();
    await setFullName(member.id, `${tag} Exported`);
    await auth.signIn(await sunners.create({ admin: true }));
    await openUsers(page, `?q=${tag}`);
    await expect(bodyRows(page)).toHaveCount(1);

    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/^users-\d{8}-\d{4}\.csv$/);
    const csv = await readFile(await download.path(), "utf8");
    expect(csv).toContain(`${tag} Exported`);
    expect(csv).toContain(member.email);
    expect(csv.trim().split(/\r?\n/)).toHaveLength(2);
  });

  test.describe("at 375 px", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("the page has no horizontal scroll; the table scrolls inside its own container", async ({ page, sunners, auth }) => {
      const tag = tokenName();
      const member = await sunners.create();
      await setFullName(member.id, `${tag} Phone`);
      await auth.signIn(await sunners.create({ admin: true }));
      await openUsers(page, `?q=${tag}`);
      await expect(bodyRows(page)).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "horizontal page overflow at 375px").toBe(0);
      const scroller = await page.getByRole("table").evaluate((table) => {
        const box = table.parentElement!;
        return { overflowX: getComputedStyle(box).overflowX, scrolls: box.scrollWidth > box.clientWidth, right: box.getBoundingClientRect().right };
      });
      expect(scroller, "the table scrolls inside its own container").toEqual({ overflowX: "auto", scrolls: true, right: expect.any(Number) });
      expect(scroller.right).toBeLessThanOrEqual(375);
    });
  });
});
