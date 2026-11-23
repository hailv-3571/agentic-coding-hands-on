import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { serviceClient } from "../../setup/local-sunner-accounts";
import { expect, feedWindow, seedFeedKudo, test } from "../kudos-feed/live-board-fixtures";

/**
 * F015 Admin › Overview `/admin/overview` (phase 14): the "All" row first and equal to the sum of the
 * unit rows in every column (BR-006), a date range that narrows the Kudo figures and survives a
 * reload (URL = state, FR-401), the reversed range refused inline with the table kept (FR-403), the
 * CSV Export of the same range with "All" first, and the phone width. Kudos are seeded on a random
 * far-future day, so a one-day range holds only this test's Kudos while parallel workers seed theirs.
 */
const OVERVIEW = "/admin/overview";
const COLUMNS = ["No", "Unit", "Total member", "Total sent kudos", "Total received kudos", "Total users with at least 1 kudo", "Total received secret box"];
const searchParam = (page: Page, name: string) => new URL(page.url()).searchParams.get(name);

type TableRow = { unit: string; counts: number[] };

/** Opens the page and waits until React has hydrated the date range (a fill before that is lost on `next dev`). */
async function openOverview(page: Page, query = ""): Promise<void> {
  await page.goto(`${OVERVIEW}${query}`);
  await page.waitForFunction(() => {
    const range = document.querySelector('[role="group"]');
    return range !== null && Object.keys(range).some((key) => key.startsWith("__reactFiber"));
  });
}

/** Unit label and the five counts of every body row ("1.234" → 1234). */
async function readTable(page: Page): Promise<TableRow[]> {
  return page.locator("table tbody tr").evaluateAll((rows) =>
    rows.map((row) => {
      const cells = [...row.querySelectorAll("th, td")].map((cell) => cell.textContent?.trim() ?? "");
      return { unit: cells[1] ?? "", counts: cells.slice(2).map((value) => Number(value.replace(/\D/g, ""))) };
    }),
  );
}

/** "All" first, then for each count column: All = Σ unit rows (incl. "Chưa gán đơn vị"). */
function expectAllIsTheSum(rows: TableRow[]): void {
  const [all, ...units] = rows;
  expect(all.unit).toBe("All");
  all.counts.forEach((total, column) => {
    expect(units.reduce((sum, row) => sum + row.counts[column], 0), `column ${COLUMNS[column + 2]}`).toBe(total);
  });
}

async function departmentName(code: string): Promise<string> {
  const { data, error } = await serviceClient.from("departments").select("name_vi").eq("code", code).single();
  if (error) throw error;
  return (data as { name_vi: string }).name_vi;
}

test.describe("Admin › Overview", () => {
  test("a date range narrows the figures, survives a reload, and All stays the sum of the units", async ({ page, sunners, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    for (let index = 0; index < 3; index++) await seedFeedKudo(pair, { body: `Overview ${index}`, createdAt: at(index) });
    const day = at(0).slice(0, 10);
    const unit = await departmentName("OPD");
    await auth.signIn(await sunners.create({ admin: true }));

    await openOverview(page);
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveText(COLUMNS);
    expectAllIsTheSum(await readTable(page));

    await page.getByLabel("Ngày bắt đầu").fill(day);
    await expect.poll(() => searchParam(page, "from")).toBe(day);
    await page.getByLabel("Ngày kết thúc").fill(day);
    await expect.poll(() => searchParam(page, "to")).toBe(day);
    // One day holds only the three seeded Kudos: sent and received by the pair's unit, one recipient.
    await expect.poll(async () => (await readTable(page))[0].counts.slice(1)).toEqual([3, 3, 1, 0]);
    const ranged = await readTable(page);
    expectAllIsTheSum(ranged);
    expect(ranged.find((row) => row.unit === unit)?.counts.slice(1)).toEqual([3, 3, 1, 0]);

    await page.reload();
    await expect(page.getByLabel("Ngày bắt đầu")).toHaveValue(day);
    expect((await readTable(page))[0].counts.slice(1)).toEqual([3, 3, 1, 0]);
  });

  test("a reversed range is refused inline and the table stays; one in the URL shows all time", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create({ admin: true }));
    await openOverview(page);
    await page.getByLabel("Ngày bắt đầu").fill("2026-12-10");
    await expect.poll(() => searchParam(page, "from")).toBe("2026-12-10");
    await page.getByLabel("Ngày kết thúc").fill("2026-12-05");
    await expect(page.getByRole("alert").filter({ hasText: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" })).toBeVisible();
    await expect(page.getByLabel("Ngày kết thúc")).toHaveAttribute("aria-invalid", "true");
    expect(searchParam(page, "to")).toBeNull();
    await expect(page.getByRole("rowheader", { name: "All" })).toBeVisible();

    await openOverview(page, "?from=2026-12-10&to=2026-12-05");
    await expect(page.getByRole("alert").filter({ hasText: "Khoảng ngày không hợp lệ, đang hiện số liệu toàn thời gian." })).toBeVisible();
    expectAllIsTheSum(await readTable(page));
  });

  test("Export downloads the CSV of the same range with the All row first", async ({ page, sunners, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const at = feedWindow("top");
    for (let index = 0; index < 2; index++) await seedFeedKudo(pair, { body: `Overview export ${index}`, createdAt: at(index) });
    const day = at(0).slice(0, 10);
    await auth.signIn(await sunners.create({ admin: true }));
    await openOverview(page, `?from=${day}&to=${day}`);
    expect((await readTable(page))[0].counts.slice(1)).toEqual([2, 2, 1, 0]);

    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export" }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/^overview-\d{8}-\d{4}\.csv$/);
    const lines = (await readFile(await download.path(), "utf8")).replace(/^﻿/, "").trim().split(/\r?\n/);
    expect(lines[0]).toBe(COLUMNS.join(","));
    const allRow = lines[1].split(",");
    expect(allRow.slice(0, 2)).toEqual(["", "All"]);
    // Total member is all time; the sent, received, recipients and boxes of the day follow it.
    expect(allRow.slice(-4)).toEqual(["2", "2", "1", "0"]);
  });

  test.describe("at 375 px", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("the page has no horizontal scroll; the table scrolls inside its own container", async ({ page, sunners, auth }) => {
      await auth.signIn(await sunners.create({ admin: true }));
      await openOverview(page);
      await expect(page.getByRole("rowheader", { name: "All" })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "horizontal page overflow at 375px").toBe(0);
      const table = page.getByRole("table");
      const scroller = await table.evaluate((element) => {
        const box = element.parentElement!;
        return { overflowX: getComputedStyle(box).overflowX, scrolls: box.scrollWidth > box.clientWidth, right: box.getBoundingClientRect().right };
      });
      expect(scroller, "the table scrolls inside its own container").toEqual({ overflowX: "auto", scrolls: true, right: expect.any(Number) });
      expect(scroller.right).toBeLessThanOrEqual(375);

      // The last column is off screen until its container (not the page) scrolls to it.
      const lastColumn = page.getByRole("columnheader", { name: "Total received secret box", exact: true });
      await expect(lastColumn).not.toBeInViewport();
      await lastColumn.scrollIntoViewIfNeeded();
      await expect(lastColumn).toBeInViewport();
      expect(await table.evaluate((element) => element.parentElement!.scrollLeft)).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollX)).toBe(0);
    });
  });
});
