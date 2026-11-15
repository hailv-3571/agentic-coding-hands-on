import { expect, test } from "../fixtures/auth-session";

const UNKNOWN_PATH = "/this-page-does-not-exist-saa";
const ADMIN_PAGE = "/admin/overview";

test.describe("unknown path as a guest", () => {
  test("is redirected to /login with next by the protect-by-default proxy (C-09)", async ({ page }) => {
    await page.goto(UNKNOWN_PATH);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(UNKNOWN_PATH)}$`));
    await expect(page.getByRole("heading", { level: 1, name: "KHÔNG TÌM THẤY" })).toHaveCount(0);
  });
});

test.describe("404 page (signed-in)", () => {
  test("responds 404 with localized copy, Home button and no internals", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    const response = await page.goto(UNKNOWN_PATH);
    expect(response!.status()).toBe(404);

    await expect(page.getByRole("heading", { level: 1, name: "KHÔNG TÌM THẤY" })).toBeVisible();
    await expect(page.getByText("Tài nguyên bạn tìm không tồn tại hoặc đã bị xóa.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");

    // Full-bleed bare page: no site header/footer, and nothing technical leaks (FR-603).
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/\bat .*\.(t|j)sx?:\d+|Error:/);
  });

  test("renders in English when the cookie says so", async ({ page, context, baseURL, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    await context.addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL! }]);
    const response = await page.goto(UNKNOWN_PATH);
    expect(response!.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "NOT FOUND" })).toBeVisible();
    await expect(
      page.getByText("The resource you’re looking for doesn’t exist or has been removed."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
  });
});

test.describe("admin area", () => {
  test("a guest is sent to /login and never sees the admin top bar", async ({ page }) => {
    await page.goto(ADMIN_PAGE);
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Foverview$/);
    await expect(page.getByRole("navigation", { name: "Điều hướng quản trị" })).toHaveCount(0);
    await expect(page.getByText("ADMIN", { exact: true })).toHaveCount(0);
  });

  test("a non-admin gets the 403 Access Denied page with no admin markup (FR-602, SC-004)", async ({
    page,
    context,
    baseURL,
    sunners,
    auth,
  }) => {
    await auth.signIn(await sunners.create());
    await context.addCookies([{ name: "NEXT_LOCALE", value: "en", url: baseURL! }]);
    // /admin exists today (it redirects); the layout guard answers before the page runs.
    const response = await page.goto("/admin");
    expect(response!.status()).toBe(403);

    await expect(page.getByRole("heading", { level: 1, name: "Access Denied" })).toBeVisible();
    await expect(page.getByText("You don’t have permission to access this resource.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await expect(page.getByText("ADMIN", { exact: true })).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/Overview|Review content/);

    // The page is fully interactive: Home leaves the admin URL for the Sunner area.
    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("an admin sees exactly four top-bar items with Overview active", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create({ admin: true }));
    const response = await page.goto(ADMIN_PAGE);
    expect(response!.status()).toBe(200);

    const header = page.getByRole("banner");
    await expect(header.getByText("ADMIN", { exact: true })).toBeVisible();
    const items = header.getByRole("navigation", { name: "Điều hướng quản trị" }).getByRole("link");
    await expect(items).toHaveText(["Overview", "Review content", "User", "Settings"]);
    await expect(items.nth(0)).toHaveAttribute("aria-current", "page");
    for (const index of [1, 2, 3]) await expect(items.nth(index)).not.toHaveAttribute("aria-current", "page");

    // Admin pages carry the minimal footer: copyright only.
    await expect(page.getByRole("contentinfo")).toHaveText("Bản quyền thuộc về Sun* © 2025");
  });

  test("the ADMIN logo links back to the Sunner area", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create({ admin: true }));
    await page.goto(ADMIN_PAGE);
    // Label in name (WCAG 2.5.3): the accessible name contains the visible "ADMIN" text.
    await page.getByRole("link", { name: /ADMIN.*Về khu Sunner/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("navigation", { name: "Điều hướng quản trị" })).toHaveCount(0);
  });
});
