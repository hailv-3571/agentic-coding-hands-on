import { expect, test } from "../fixtures/auth-session";

/**
 * F001 end-to-end on the local stack: proxy redirects (FR-101/102), login error banners
 * (FR-202/203), revoked sessions (FR-403), first-login onboarding through the real
 * /auth/callback code exchange (FR-401 + decision-log department self-select).
 */

// Copy assertions are the Vietnamese defaults; pin the browser language accordingly.
test.use({ locale: "vi-VN" });

test.describe("guest", () => {
  test("is sent from a protected page to /login with next, and sees the login screen", async ({ page }) => {
    await page.goto("/kudos");
    await expect(page).toHaveURL(/\/login\?next=%2Fkudos$/);
    await expect(page.getByText("Bắt đầu hành trình của bạn cùng SAA 2025.")).toBeVisible();
    await expect(page.getByRole("button", { name: /LOGIN With Google/ })).toBeEnabled();
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  });

  test("gets 401 JSON instead of a redirect from an API route", async ({ request }) => {
    const response = await request.get("/api/anything", { maxRedirects: 0 });
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ code: "unauthorized" });
  });

  test("sees the company-accounts-only banner after a domain rejection", async ({ page }) => {
    await page.goto("/auth/callback?error=access_denied&error_description=domain_not_allowed&next=%2Fkudos");
    await expect(page).toHaveURL(/\/login\?next=%2Fkudos&error=domain_not_allowed$/);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Chỉ tài khoản @sun-asterisk.com được phép đăng nhập.");
  });

  test("sees the generic banner after a cancelled or failed sign-in", async ({ page }) => {
    await page.goto("/auth/callback?error=server_error&error_description=Database+error+saving+new+user");
    await expect(page).toHaveURL(/\/login\?error=auth_failed$/);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Đăng nhập không thành công, vui lòng thử lại.");
  });
});

test.describe("signed-in Sunner", () => {
  test("is sent from /login to the home page", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);
  });

  test("loses access once the session is signed out: protected pages redirect to /login", async ({
    page,
    sunners,
    auth,
  }) => {
    const jar = await auth.signIn(await sunners.create());
    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);

    await auth.revoke(jar); // same session the browser still holds in its cookies
    await page.goto("/kudos");
    await expect(page).toHaveURL(/\/login\?next=%2Fkudos$/);
  });
});

test.describe("first login", () => {
  test("goes through /auth/callback to the department picker, then on to next", async ({ page, sunners, auth }) => {
    const sunner = await sunners.create({ onboarded: false });
    const link = await auth.magicLink(sunner, "/kudos");

    await page.goto(link);
    await expect(page).toHaveURL(/\/onboarding\/department\?next=%2Fkudos$/);
    await expect(page.getByRole("heading", { name: "Chọn đơn vị của bạn" })).toBeVisible();

    await page.getByRole("radio", { name: "CEVC2" }).check();
    await page.getByRole("button", { name: "Tiếp tục" }).click();
    await expect(page).toHaveURL(/\/kudos$/);

    // Onboarding is once only: the picker now forwards straight to next.
    await page.goto("/onboarding/department?next=%2Flogin-help");
    await expect(page).toHaveURL(/\/login-help$/);
  });
});
