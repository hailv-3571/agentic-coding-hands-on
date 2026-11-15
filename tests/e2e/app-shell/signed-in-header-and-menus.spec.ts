import { expect, test } from "../fixtures/auth-session";

// Any (app) page works; the placeholder home is the one that exists until phase 07.
const APP_PAGE = "/";

test.describe("signed-in header and footer", () => {
  test("shows the avatar initial, the three links with active state, and the footer", async ({
    page,
    sunners,
    auth,
  }) => {
    await auth.signIn(await sunners.create());
    await page.goto(APP_PAGE);

    const header = page.getByRole("banner");
    const account = header.getByRole("button", { name: "Menu tài khoản: E2E Sunner" });
    await expect(account).toBeVisible();
    await expect(account).toHaveText("E");

    const links = header.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link");
    await expect(links).toHaveText(["About SAA 2025", "Award Information", "Sun* Kudos"]);
    await expect(links.nth(0)).toHaveAttribute("aria-current", "page");
    await expect(links.nth(1)).not.toHaveAttribute("aria-current", "page");
    await expect(links.nth(2)).not.toHaveAttribute("aria-current", "page");

    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "Tiêu chuẩn chung" })).toBeVisible();
    await expect(footer).toContainText("Bản quyền thuộc về Sun* © 2025");
  });
});

test.describe("mobile menu (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens, then closes on outside click and on Escape", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    await page.goto(APP_PAGE);

    const header = page.getByRole("banner");
    const toggle = header.getByRole("button", { name: "Mở menu" });
    const panelLinks = header.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link");
    await expect(panelLinks).toHaveCount(0); // collapsed: only rendered while the panel is open

    await toggle.click();
    await expect(header.getByRole("button", { name: "Đóng menu" })).toHaveAttribute("aria-expanded", "true");
    await expect(panelLinks).toHaveCount(3);
    await expect(panelLinks.nth(0)).toHaveAttribute("aria-current", "page");

    await page.mouse.click(300, 600); // outside the panel
    await expect(panelLinks).toHaveCount(0);

    await toggle.click();
    await expect(panelLinks).toHaveCount(3);
    await page.keyboard.press("Escape");
    await expect(panelLinks).toHaveCount(0);
    await expect(toggle).toBeFocused();
  });
});

test.describe("account menu", () => {
  test("offers Profile and Logout, but no Dashboard, to a regular user", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    await page.goto(APP_PAGE);
    const trigger = page.getByRole("button", { name: /^Menu tài khoản/ });
    await expect(trigger).not.toHaveAttribute("aria-haspopup"); // a plain disclosure, not an ARIA menu
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  });

  test("offers Dashboard to an admin, leading to the admin area", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create({ admin: true }));
    await page.goto(APP_PAGE);
    await page.getByRole("button", { name: /^Menu tài khoản/ }).click();

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/admin\/overview$/);
    await expect(page.getByRole("banner").getByText("ADMIN", { exact: true })).toBeVisible();
  });

  test("Logout ends the session: a protected path then redirects to /login", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    await page.goto(APP_PAGE);
    await page.getByRole("button", { name: /^Menu tài khoản/ }).click();
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/kudos");
    await expect(page).toHaveURL(/\/login\?next=%2Fkudos$/);
  });
});

test.describe("language switch while signed in", () => {
  test("VN to EN re-renders the shell and persists in the cookie, then back to VN", async ({
    page,
    context,
    sunners,
    auth,
  }) => {
    await auth.signIn(await sunners.create());
    await page.goto(APP_PAGE);
    const header = page.getByRole("banner");
    const cookieValue = async () => (await context.cookies()).find((cookie) => cookie.name === "NEXT_LOCALE")?.value;

    await header.getByRole("button", { name: /Ngôn ngữ/ }).click();
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(header.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(header.getByRole("button", { name: /^Account menu/ })).toBeVisible();
    expect(await cookieValue()).toBe("en");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await header.getByRole("button", { name: /Language/ }).click();
    await page.getByRole("button", { name: "Tiếng Việt" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(header.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
    expect(await cookieValue()).toBe("vi");
  });
});
