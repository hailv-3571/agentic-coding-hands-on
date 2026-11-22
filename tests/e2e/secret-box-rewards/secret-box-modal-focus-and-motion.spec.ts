import {
  boxButton,
  expect,
  openBoxButton,
  scriptedAnimations,
  secretBoxDialog,
  seedUnopenedBoxes,
  test,
  unopenedCounter,
} from "./secret-box-e2e-fixtures";

/**
 * Open-box modal accessibility (SCR-secret-box-open § 9): Tab and Shift+Tab cycle inside the
 * dialog (close button ↔ box) and never reach the page behind; under `prefers-reduced-motion:
 * reduce` no scripted animation runs (no box wobble, no prize reveal) and the opening frame is not
 * held (900 ms with motion, 0 ms here). The motion-on control is in secret-box-open-flow.spec.ts.
 */
const OPEN_URL = "**/api/secret-boxes/open";

test.describe("Open Secret Box modal — focus and motion", () => {
  test("Tab and Shift+Tab cycle inside the dialog", async ({ page, auth, boxUsers }) => {
    const pair = await boxUsers.pair();
    await seedUnopenedBoxes(pair.sender.id, 1);
    await auth.signIn(pair.sender);
    await page.goto("/kudos");
    await openBoxButton(page).click();
    const dialog = secretBoxDialog(page);
    await expect(unopenedCounter(dialog)).toHaveText("01");
    const box = boxButton(dialog);
    const close = dialog.getByRole("button", { name: "Đóng" });
    await expect(box).toBeFocused();

    for (const [key, target] of [
      ["Tab", close],
      ["Tab", box],
      ["Shift+Tab", close],
      ["Shift+Tab", box],
    ] as const) {
      await page.keyboard.press(key);
      await expect(target).toBeFocused();
    }
    for (let press = 0; press < 5; press++) {
      await page.keyboard.press(press % 2 === 0 ? "Tab" : "Shift+Tab");
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
  });

  test.describe("with prefers-reduced-motion: reduce", () => {
    test.use({ reducedMotion: "reduce" });

    test("no scripted animation runs and the opening frame is not held", async ({ page, auth, boxUsers }) => {
      const pair = await boxUsers.pair();
      await seedUnopenedBoxes(pair.sender.id, 2);
      await auth.signIn(pair.sender);
      await page.goto("/kudos");
      await openBoxButton(page).click();
      const dialog = secretBoxDialog(page);
      await expect(unopenedCounter(dialog)).toHaveText("02");

      // Real open, held at the network so the opening state can be inspected: no wobble, then no reveal.
      let release!: () => void;
      const released = new Promise<void>((resolve) => (release = resolve));
      await page.route(OPEN_URL, async (route) => {
        await released;
        await route.continue();
      });
      await boxButton(dialog).click();
      await expect(dialog).toHaveAttribute("aria-busy", "true");
      expect(await scriptedAnimations(dialog)).toBe(0);
      release();
      await expect(unopenedCounter(dialog)).toHaveText("01");
      expect(await scriptedAnimations(dialog)).toBe(0);
      await page.unroute(OPEN_URL);

      // An instant answer (network stub, so only the client's timing is measured) shows the result
      // at once: the 900 ms minimum opening frame applies only with motion on.
      const body = { kind: "icon", iconCode: "REVIVAL", name: "REVIVAL", setCompleted: false, giftName: null, duplicate: false, unopenedLeft: 0, replayed: false };
      await page.route(OPEN_URL, (route) => route.fulfill({ json: body }));
      const clickedAt = Date.now();
      await boxButton(dialog).click();
      await expect(unopenedCounter(dialog)).toHaveText("00");
      expect(Date.now() - clickedAt).toBeLessThan(800);
      expect(await scriptedAnimations(dialog)).toBe(0);
    });
  });
});
