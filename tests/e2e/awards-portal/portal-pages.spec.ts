import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures/auth-session";

/**
 * F006 portal pages (phase 07) on a launched server (LAUNCH_AT past, so the prelaunch gate lets
 * Sunners through and sends /countdown to /; the timer itself is unit-tested in
 * tests/unit/awards-portal/countdown-parts.test.ts). Homepage links and countdown (server clock,
 * BR-001), Awards anchors (FR-302..306), static Thể lệ / Tiêu chuẩn cộng đồng (FR-311/321/603).
 */
const AWARD_NAMES = ["Top Talent", "Top Project", "Top Project Leader", "Best Manager", "Signature 2025 - Creator", "MVP (Most Valuable Person)"];
const DAY_MS = 24 * 60 * 60 * 1000;

test.beforeEach(async ({ sunners, auth }) => {
  await auth.signIn(await sunners.create());
});

/** Whole minutes left, read from each unit's accessible label ("5 ngày", "3 giờ", "7 phút"). */
async function minutesLeft(page: Page): Promise<number> {
  const label = async (unit: string) =>
    parseInt((await page.locator(`[data-countdown-unit="${unit}"] .sr-only`).textContent()) ?? "", 10);
  return (await label("days")) * 1440 + (await label("hours")) * 60 + (await label("minutes"));
}

const anchorMenu = (page: Page) => page.getByRole("navigation", { name: "Danh sách giải thưởng" });

test.describe("Homepage", () => {
  test("shows hero, countdown, event info, theme, 6 award cards and the Kudos banner with their links", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "Root Further" })).toBeVisible();
    await expect(main.locator("[data-countdown-unit]")).toHaveCount(3);
    // "Sắp diễn ra" only while EVENT_AT is ahead (D005).
    await expect(main.getByText("Sắp diễn ra", { exact: true })).toHaveCount((await minutesLeft(page)) > 0 ? 1 : 0);
    await expect(main.locator("time")).toHaveText(/^\d{2}\/\d{2}\/\d{4}$/);
    await expect(main.getByText("Âu Cơ Art Center")).toBeVisible();
    await expect(main.getByText("Tường thuật trực tiếp qua sóng Livestream")).toBeVisible();
    await expect(main.getByText("“A tree with deep roots fears no storm”")).toBeVisible();

    const awards = main.getByRole("region", { name: "Hệ thống giải thưởng" });
    await expect(awards.getByRole("heading", { level: 3 })).toHaveText(AWARD_NAMES);
    await expect(awards.getByRole("img", { name: "Top Talent" })).toBeVisible();
    await expect(main.getByRole("link", { name: "ABOUT KUDOS" })).toHaveAttribute("href", "/kudos");
    const banner = main.getByRole("region", { name: "Sun* Kudos" });
    await expect(banner.getByRole("link", { name: "Chi tiết về Sun* Kudos" })).toHaveAttribute("href", "/kudos");

    await main.getByRole("link", { name: "ABOUT AWARDS" }).click();
    await expect(page).toHaveURL(/\/awards$/);
    await expect(page.getByRole("heading", { level: 1, name: "Hệ thống giải thưởng SAA 2025" })).toBeVisible();
  });

  test("an award card's Chi tiết lands on its block with the matching menu item active", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Chi tiết về giải Top Project", exact: true }).click();
    await expect(page).toHaveURL(/\/awards#top-project$/);
    await expect(page.locator("#top-project")).toBeInViewport();
    await expect(page.getByRole("heading", { level: 2, name: "Top Project", exact: true })).toBeInViewport();
    await expect(anchorMenu(page).getByRole("link", { name: "Top Project", exact: true })).toHaveAttribute("aria-current", "true");
    await expect(anchorMenu(page).locator('[aria-current="true"]')).toHaveCount(1);
  });

  test("the countdown follows the server clock, whatever the device clock says", async ({ page, context }) => {
    await page.goto("/");
    const serverBased = await minutesLeft(page);

    // A device clock far behind and far ahead: a client-clock countdown would read ~400 days
    // or 0 here instead of the server-based value.
    for (const skew of [-400 * DAY_MS, 400 * DAY_MS]) {
      const skewed = await context.newPage();
      await skewed.clock.setFixedTime(new Date(Date.now() + skew));
      await skewed.goto("/");
      // Once React has hydrated the timer (fiber keys on its nodes) and run its mount effect,
      // a visibilitychange makes it recompute "now" from the device clock plus the server offset.
      await skewed.waitForFunction(() => {
        const unit = document.querySelector("[data-countdown-unit]");
        return unit !== null && Object.keys(unit).some((key) => key.startsWith("__reactFiber"));
      });
      await skewed.waitForTimeout(300);
      await skewed.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      expect(Math.abs((await minutesLeft(skewed)) - serverBased)).toBeLessThanOrEqual(1);
      await skewed.close();
    }
  });
});

test.describe("Awards page", () => {
  test("menu click scrolls to the block, writes the hash and moves the active item", async ({ page }) => {
    await page.goto("/awards");
    const menu = anchorMenu(page);
    await expect(menu.getByRole("link")).toHaveText(["Top Talent", "Top Project", "Top Project Leader", "Best Manager", "Signature 2025 Creator", "MVP"]);
    await expect(menu.getByRole("link", { name: "Top Talent" })).toHaveAttribute("aria-current", "true");

    await menu.getByRole("link", { name: "Best Manager" }).click();
    await expect(page).toHaveURL(/\/awards#best-manager$/);
    await expect(page.locator("#best-manager")).toBeInViewport();
    await expect(menu.getByRole("link", { name: "Best Manager" })).toHaveAttribute("aria-current", "true");
    await expect(menu.locator('[aria-current="true"]')).toHaveCount(1);
  });

  test("jumping straight back to the top re-selects the first award", async ({ page }) => {
    await page.goto("/awards#mvp");
    const menu = anchorMenu(page);
    await expect(menu.getByRole("link", { name: "MVP" })).toHaveAttribute("aria-current", "true");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(menu.getByRole("link", { name: "Top Talent" })).toHaveAttribute("aria-current", "true");
  });

  test("an unknown hash keeps the page at the top without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/awards#khong-co-giai-nay");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(anchorMenu(page).getByRole("link", { name: "Top Talent" })).toHaveAttribute("aria-current", "true");
    expect(errors).toEqual([]);
  });

  test("blocks show quantity and value from the awards module; Signature has two values", async ({ page }) => {
    await page.goto("/awards");
    const signature = page.locator("#signature-2025-creator");
    await expect(signature).toContainText("01");
    await expect(signature).toContainText("Cá nhân hoặc tập thể");
    await expect(signature.getByText(/VNĐ$/)).toHaveText(["5.000.000 VNĐ", "8.000.000 VNĐ"]);
    await expect(signature.getByText("Hoặc", { exact: true })).toBeVisible();
    await expect(signature).toContainText("cho giải cá nhân");
    await expect(signature).toContainText("cho giải tập thể");

    const bestManager = page.locator("#best-manager");
    await expect(bestManager.getByText(/VNĐ$/)).toHaveText(["10.000.000 VNĐ"]);
    await expect(bestManager).not.toContainText("cho mỗi giải thưởng");
    await expect(page.locator("#top-talent")).toContainText("cho mỗi giải thưởng");
  });

  test("switching to English re-renders the headings and labels", async ({ page }) => {
    await page.goto("/awards");
    await page.getByRole("banner").getByRole("button", { name: /Ngôn ngữ/ }).click();
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1, name: "SAA 2025 award system" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Awards" })).toBeVisible();
    await expect(page.locator("#top-talent")).toContainText("Number of awards:");
    await expect(page.locator("#top-talent")).toContainText("per award");
  });
});

test.describe("static pages (FR-603)", () => {
  test("Thể lệ: 4 Hero tiers, 6 Secret Box icons, no form or input; Viết KUDOS → /kudos, Đóng → back", async ({ page }) => {
    await page.goto("/community-standards");
    await page.goto("/rules");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "Thể lệ" })).toBeVisible();
    for (const tier of ["New Hero", "Rising Hero", "Super Hero", "Legend Hero"]) {
      await expect(main.getByRole("img", { name: tier })).toBeVisible();
    }
    await expect(main.getByRole("list", { name: "6 icon Secret Box" }).getByRole("img")).toHaveCount(6);
    await expect(main.locator("form, input, textarea, select")).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Viết KUDOS" })).toHaveAttribute("href", "/kudos");

    await main.getByRole("button", { name: "Đóng" }).click();
    await expect(page).toHaveURL(/\/community-standards$/);
  });

  test("Thể lệ opened directly: Đóng goes to the Homepage", async ({ page }) => {
    await page.goto("/rules");
    await page.getByRole("main").getByRole("button", { name: "Đóng" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("Tiêu chuẩn cộng đồng: 10 rules and Tiêu chuẩn bảo mật, no form or input", async ({ page }) => {
    await page.goto("/community-standards");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "Tiêu chuẩn cộng đồng" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Tiêu chuẩn bảo mật" })).toBeVisible();
    await expect(main.locator("ol > li")).toHaveCount(10);
    await expect(main.locator("form, input, textarea, select")).toHaveCount(0);
  });
});

test.describe("phones (375 px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no page scrolls sideways; the Awards menu is a chip bar", async ({ page }) => {
    for (const path of ["/", "/awards", "/rules", "/community-standards"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await page.goto("/awards");
    await anchorMenu(page).getByRole("link", { name: "MVP" }).click();
    await expect(page).toHaveURL(/\/awards#mvp$/);
    await expect(page.getByRole("heading", { level: 2, name: "MVP (Most Valuable Person)" })).toBeInViewport();
  });
});
