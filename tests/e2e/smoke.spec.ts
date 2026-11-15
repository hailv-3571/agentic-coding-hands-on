import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home responds without a server error and defaults to Vietnamese", async ({ page }) => {
    // Follows redirects (later phases gate `/` behind login/countdown).
    const response = await page.goto("/");
    expect(response, "navigation returned no response").not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });

  test("NEXT_LOCALE cookie switches the document language", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL! }]);
    const response = await page.goto("/");
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
