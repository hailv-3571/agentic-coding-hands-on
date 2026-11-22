import type { TestInfo } from "@playwright/test";
import { expect, test } from "../fixtures/auth-session";
import { PRELAUNCH_PROJECT } from "./prelaunch-server";

/**
 * Phase 07 prelaunch gate (C-09 step 5, BR-002, DEC-001) on a real server. The gate follows the
 * SERVER's LAUNCH_AT, so each group runs on its own server and skips itself on the other:
 *  - "before LAUNCH_AT": `npm run test:e2e:prelaunch` (playwright.prelaunch.config.ts, +30 days);
 *  - "after LAUNCH_AT": the normal `npm run test:e2e` dev server, whose LAUNCH_AT is in the past.
 */
const onPrelaunchServer = (testInfo: TestInfo) => testInfo.project.name === PRELAUNCH_PROJECT;
const pathOf = (url: string) => new URL(url).pathname;

test.describe("before LAUNCH_AT", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!onPrelaunchServer(testInfo), "needs the future-LAUNCH_AT server: npm run test:e2e:prelaunch");
  });

  test("sends a signed-in Sunner from app pages to the countdown", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    for (const path of ["/", "/kudos", "/awards"]) {
      const response = await page.goto(path);
      expect(pathOf(page.url()), `from ${path}`).toBe("/countdown");
      expect(response?.status()).toBe(200);
    }
  });

  test("answers a Sunner's Server Action outside the allowlist with JSON 403", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    const response = await page.request.post("/kudos", { headers: { "next-action": "0000" }, maxRedirects: 0 });
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ code: "prelaunch" });
  });

  test("lets an admin reach the home page and the admin area", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create({ admin: true }));
    for (const path of ["/", "/admin/overview"]) {
      const response = await page.goto(path);
      expect(pathOf(page.url())).toBe(path);
      expect(response?.status()).toBe(200);
    }
  });

  test("shows a guest the countdown and the login page, and still sends / to /login", async ({ page }) => {
    for (const path of ["/countdown", "/login"]) {
      const response = await page.goto(path);
      expect(pathOf(page.url())).toBe(path);
      expect(response?.status()).toBe(200);
    }
    await page.goto("/");
    expect(pathOf(page.url())).toBe("/login");
  });

  test("counts down to LAUNCH_AT with no link to the awards, then asks for the home page once the clock passes it", async ({ page, sunners, auth }) => {
    await auth.signIn(await sunners.create());
    await page.clock.install({ time: new Date() });
    await page.goto("/countdown");

    for (const unit of ["days", "hours", "minutes"]) {
      await expect(page.locator(`[data-countdown-unit="${unit}"]`)).toHaveCount(1);
    }
    // LAUNCH_AT is 30 days after the server was built, so the days left read 29 or 30.
    const days = Number(await page.locator('[data-countdown-unit="days"] > span[aria-hidden]').first().textContent());
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(30);
    await expect(page.locator('a[href*="/awards"]')).toHaveCount(0);

    // Redirect-on-zero: the timer's router.replace("/") is a non-prefetch RSC request to "/".
    // Prefetches of "/" (e.g. a logo link) carry next-router-prefetch and are not counted.
    const homeAttempt = page.waitForRequest(
      (request) => new URL(request.url()).pathname === "/" && !request.headers()["next-router-prefetch"],
      { timeout: 15_000 },
    );
    await page.clock.fastForward(31 * 24 * 60 * 60 * 1000);
    await homeAttempt;
    // The server is still prelaunch, so the proxy sends this user back to the countdown.
    await expect(page).toHaveURL(/\/countdown$/);
  });
});

test.describe("after LAUNCH_AT", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(onPrelaunchServer(testInfo), "runs on the normal dev server (LAUNCH_AT in the past)");
  });

  test("sends /countdown to the home page, for guests and Sunners", async ({ page, request, baseURL, sunners, auth }) => {
    const guest = await request.get("/countdown", { maxRedirects: 0 });
    expect(guest.status()).toBe(307);
    expect(pathOf(new URL(guest.headers().location, baseURL).href)).toBe("/");

    await auth.signIn(await sunners.create());
    const response = await page.goto("/countdown");
    expect(pathOf(page.url())).toBe("/");
    expect(response?.status()).toBe(200);
  });
});
