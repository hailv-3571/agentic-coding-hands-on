import type { Page, Request } from "@playwright/test";
import {
  boxButton,
  expect,
  openBoxButton,
  openBoxOutOfBand,
  rewardsColumn,
  scriptedAnimations,
  secretBoxDialog,
  seedFullIconCollection,
  seedUnopenedBoxes,
  statValue,
  storedBoxCounts,
  test,
  unopenedCounter,
} from "./secret-box-e2e-fixtures";

/**
 * F010 open-box modal (SCR-secret-box-open, SM-002) against the real route handlers: waiting →
 * opening (box and close locked) → result → waiting/empty; a network failure keeps the box and the
 * retry re-sends the SAME Idempotency-Key, so the server replays the stored result (FR-402); 409
 * when another tab took the last box; the `?secretBox=open` deep link; closing refreshes the
 * column and returns focus to the button. Prizes are real draws: an icon or a gift.
 */
const OPEN_URL = "**/api/secret-boxes/open";
const CONGRATS = "Chúc mừng bạn đã nhận được phần quà từ BTC SAA 2025";
const DUPLICATE_CAPTION = "Bạn đã có icon này rồi";

const keyOf = (request: Request) => request.headers()["idempotency-key"];

/** Holds every open request until `release()` so the opening state can be observed. */
async function holdOpenRequests(page: Page) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(OPEN_URL, async (route) => {
    await released;
    await route.continue();
  });
  return release;
}

test.describe("Open Secret Box modal", () => {
  test("opens boxes through the modal states and refreshes the column on close", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await seedUnopenedBoxes(pair.sender.id, 2);
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    await openBoxButton(page).click();

    const dialog = secretBoxDialog(page);
    await expect(dialog).toHaveAccessibleName("KHÁM PHÁ SECRET BOX CỦA BẠN");
    await expect(unopenedCounter(dialog)).toHaveText("02");
    await expect(dialog.getByText("Click vào box để mở")).toBeVisible();
    await expect(boxButton(dialog)).toBeFocused();

    const release = await holdOpenRequests(page);
    const answered = page.waitForResponse((response) => response.url().endsWith("/api/secret-boxes/open"));
    await page.keyboard.press("Enter");
    await expect(dialog).toHaveAttribute("aria-busy", "true");
    await expect(boxButton(dialog)).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape"); // locked while opening: the prize is never missed
    await expect(dialog).toBeVisible();
    await expect.poll(() => scriptedAnimations(dialog)).toBeGreaterThan(0); // the wobble (motion allowed here)
    release();
    const first = await (await answered).json();
    await page.unroute(OPEN_URL);

    await expect(unopenedCounter(dialog)).toHaveText("01");
    await expect(dialog.getByRole("status")).toContainText(first.kind === "icon" ? `Bạn nhận được icon ${first.name}` : `Bạn nhận được ${first.name}`);
    expect(first.duplicate).toBe(false); // the user's very first prize cannot be a duplicate
    await expect(dialog.getByText(DUPLICATE_CAPTION, { exact: true })).toHaveCount(0);
    if (first.kind === "gift" || first.setCompleted) await expect(dialog).toHaveAccessibleName(CONGRATS);
    if (first.kind === "gift") await expect(dialog.getByText(first.name, { exact: true })).toBeVisible();

    await boxButton(dialog).click(); // from the result, the next click opens the next box
    await expect(unopenedCounter(dialog)).toHaveText("00");
    await expect(boxButton(dialog)).toHaveAttribute("aria-disabled", "true");
    expect(await storedBoxCounts(pair.sender.id)).toEqual({ opened: 2, unopened: 0 });

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    const column = rewardsColumn(page);
    await expect(statValue(column, "Số Secret Box bạn đã mở:")).toHaveText("2");
    await expect(statValue(column, "Số Secret Box chưa mở:")).toHaveText("0");
    await expect(openBoxButton(page)).toHaveAttribute("aria-disabled", "true");
    await expect(openBoxButton(page)).toBeFocused();
  });

  test("a network failure keeps the box and the retry replays the same result", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await seedUnopenedBoxes(pair.sender.id, 1);
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    await openBoxButton(page).click();
    const dialog = secretBoxDialog(page);
    await expect(unopenedCounter(dialog)).toHaveText("01");

    // First attempt reaches the server (the box IS opened there) but the answer is lost on the way back.
    const keys: string[] = [];
    let attempt = 0;
    await page.route(OPEN_URL, async (route) => {
      keys.push(keyOf(route.request()));
      attempt += 1;
      if (attempt > 1) return route.continue();
      await route.fetch();
      await route.abort("internetdisconnected");
    });
    await boxButton(dialog).click();
    await expect(page.getByRole("alert").filter({ hasText: "Không thể mở hộp, vui lòng thử lại" })).toBeVisible();
    await expect(unopenedCounter(dialog)).toHaveText("01");
    await expect(boxButton(dialog)).not.toHaveAttribute("aria-disabled");
    expect(await storedBoxCounts(pair.sender.id)).toEqual({ opened: 1, unopened: 0 });

    const replay = page.waitForResponse((response) => response.url().endsWith("/api/secret-boxes/open"));
    await boxButton(dialog).click();
    const body = await (await replay).json();
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(body).toMatchObject({ replayed: true, unopenedLeft: 0 });
    await expect(unopenedCounter(dialog)).toHaveText("00");
    expect(await storedBoxCounts(pair.sender.id)).toEqual({ opened: 1, unopened: 0 });
  });

  test("when another tab took the last box the modal switches to empty (409)", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await seedUnopenedBoxes(pair.sender.id, 1);
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    await openBoxButton(page).click();
    const dialog = secretBoxDialog(page);
    await expect(unopenedCounter(dialog)).toHaveText("01");

    await openBoxOutOfBand(pair.sender.id, { kind: "icon" });
    const answered = page.waitForResponse((response) => response.url().endsWith("/api/secret-boxes/open"));
    await boxButton(dialog).click();
    expect((await answered).status()).toBe(409);
    await expect(dialog.getByRole("paragraph").filter({ hasText: /^Bạn chưa có Secret Box nào để mở$/ })).toBeVisible();
    await expect(dialog.getByRole("status")).toHaveText("Bạn chưa có Secret Box nào để mở");
    await expect(unopenedCounter(dialog)).toHaveText("00");
    await expect(boxButton(dialog)).toHaveAttribute("aria-disabled", "true");
  });

  test("the ?secretBox=open deep link opens the modal; closing removes the param", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await seedUnopenedBoxes(pair.sender.id, 1);
    await auth.signIn(pair.sender);
    await page.goto("/kudos?secretBox=open");

    const dialog = secretBoxDialog(page);
    await expect(dialog).toBeVisible();
    await expect(unopenedCounter(dialog)).toHaveText("01");
    await page.mouse.click(4, 400); // the mask closes it
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL((url) => url.pathname === "/kudos" && !url.searchParams.has("secretBox"));
    await expect(openBoxButton(page)).toBeFocused();

    // Re-opening from the button still works after the deep link was dismissed.
    await openBoxButton(page).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Đóng" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("an icon the user already owns comes with 'Bạn đã có icon này rồi' (E08)", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await seedFullIconCollection(pair.sender.id);
    await seedUnopenedBoxes(pair.sender.id, 1);
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    await openBoxButton(page).click();
    const dialog = secretBoxDialog(page);
    await expect(unopenedCounter(dialog)).toHaveText("01");

    const answered = page.waitForResponse((response) => response.url().endsWith("/api/secret-boxes/open"));
    await boxButton(dialog).click();
    const result = await (await answered).json();
    await expect(unopenedCounter(dialog)).toHaveText("00");
    // A real draw: almost always an icon (always owned already here); a gift is never a duplicate.
    expect(result.duplicate).toBe(result.kind === "icon");
    const caption = dialog.getByText(DUPLICATE_CAPTION, { exact: true });
    if (result.kind === "icon") {
      await expect(caption).toBeVisible();
      await expect(dialog.getByRole("status")).toContainText(DUPLICATE_CAPTION);
    } else {
      await expect(caption).toHaveCount(0);
    }
  });
});
