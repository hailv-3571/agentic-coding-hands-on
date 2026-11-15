import { expect, test } from "@playwright/test";

// Language switching runs on a public page: the (public) layout carries the switcher (D002).
const PUBLIC_PAGE = "/login";

test.describe("locale resolution (BR-001)", () => {
  test.describe("with an English browser", () => {
    test.use({ locale: "en-US" });

    test("first visit without a cookie follows Accept-Language", async ({ page }) => {
      await page.goto(PUBLIC_PAGE);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });

    test("a saved cookie wins over Accept-Language", async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "NEXT_LOCALE", value: "vi", url: baseURL! }]);
      await page.goto(PUBLIC_PAGE);
      await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    });
  });

  test("an invalid cookie is ignored and falls back to vi", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "NEXT_LOCALE", value: "fr", url: baseURL! }]);
    await page.goto(PUBLIC_PAGE);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });
});

test.describe("language switcher", () => {
  test("switching to English re-renders and persists across reload", async ({ page, context }) => {
    await page.goto(PUBLIC_PAGE);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");

    const trigger = page.getByRole("button", { name: /Ngôn ngữ/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).not.toHaveAttribute("aria-haspopup"); // a plain disclosure, not an ARIA menu
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: "English" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const cookies = await context.cookies();
    const localeCookie = cookies.find((cookie) => cookie.name === "NEXT_LOCALE");
    expect(localeCookie?.value).toBe("en");
    expect(localeCookie?.sameSite).toBe("Lax");
    expect(localeCookie?.httpOnly).toBe(true);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("button", { name: /Language/ })).toBeVisible();
  });

  test("a failed switch says so in an alert and keeps the current language", async ({ page }) => {
    await page.goto(PUBLIC_PAGE);
    // Fail only the Server Action POST (setLocaleAction); the page itself loads normally.
    await page.route("**/login", (route) =>
      route.request().method() === "POST" && route.request().headers()["next-action"]
        ? route.fulfill({ status: 500, body: "" })
        : route.continue(),
    );
    await page.getByRole("button", { name: /Ngôn ngữ/ }).click();
    await page.getByRole("button", { name: "English" }).click();

    // Scoped to the header: Next's route announcer is also role="alert".
    await expect(page.getByRole("banner").getByRole("alert")).toHaveText("Không thể đổi ngôn ngữ, vui lòng thử lại.");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });

  test("Escape and outside click close the list; Escape returns focus to the trigger", async ({ page }) => {
    await page.goto(PUBLIC_PAGE);
    const trigger = page.getByRole("button", { name: /Ngôn ngữ/ });

    await trigger.click();
    await expect(page.getByRole("button", { name: "English" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "English" })).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.mouse.click(5, 400);
    await expect(page.getByRole("button", { name: "English" })).toBeHidden();
  });

  test("public header shows logo and switcher only (no navigation)", async ({ page }) => {
    await page.goto(PUBLIC_PAGE);
    const header = page.getByRole("banner");
    await expect(header.getByRole("img", { name: "Sun* Annual Awards 2025" })).toBeVisible();
    await expect(header.getByRole("navigation")).toHaveCount(0);
  });

  test("each control's accessible name starts with its visible code (label in name, WCAG 2.5.3)", async ({ page }) => {
    await page.goto(PUBLIC_PAGE);
    const trigger = page.getByRole("banner").getByRole("button", { name: /Ngôn ngữ/ });
    await expect(trigger).toHaveText("VN");
    await expect(trigger).toHaveAccessibleName("VN, Ngôn ngữ: Tiếng Việt");
    await trigger.click();
    await expect(page.getByRole("button", { name: "VN Tiếng Việt", exact: true })).toHaveText("VN");
    await expect(page.getByRole("button", { name: "EN English", exact: true })).toHaveText("EN");
  });
});
