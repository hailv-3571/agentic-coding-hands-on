import { openReview, reviewRow, shortId } from "./admin-moderation/review-content-e2e-steps";
import { expect, seedFeedKudo, test } from "./kudos-feed/live-board-fixtures";
import {
  cloudName,
  expectTotalMatchesDatabase,
  markDocument,
  nextResync,
  openLiveBoard,
  resyncNow,
  sameDocument,
  signedInContext,
  spotlightTicker,
  spotlightWindow,
} from "./spotlight-board-e2e-helpers";

/**
 * F008 Spotlight Board on the Live board (phase 11, SC-003/SC-004): the server snapshot renders
 * (counter = public Kudos in the DB, recipient in the cloud and the ticker); a Kudo written
 * elsewhere reaches two independent browsers within 5 s without a reload, its name briefly in
 * #F17676; an admin's Mark Spam (in another browser, through the real Review screen) takes it off
 * the board and Un Spam brings the count back without a new ticker line. Real Realtime, local stack.
 * Serial: the counter is global, so this file's tests never write Kudos at the same time.
 */
test.describe.configure({ mode: "serial" });

const SPOTLIGHT_RED = "rgb(241, 118, 118)";

test.describe("Spotlight Board", () => {
  test("renders the snapshot, then a new Kudo appears in two browsers within 5 s without reload", async ({
    page,
    browser,
    baseURL,
    auth,
    kudoUsers,
    sunners,
  }) => {
    const known = await kudoUsers.pair();
    await seedFeedKudo(known, { body: "Spotlight snapshot", createdAt: spotlightWindow()() });
    await auth.signIn(known.sender);
    const otherBrowser = await signedInContext(browser, baseURL!, await sunners.create());
    try {
      const other = await otherBrowser.newPage();
      await Promise.all([openLiveBoard(page), openLiveBoard(other)]);

      await expect(cloudName(page, known.recipient.fullName)).toHaveAccessibleName(`${known.recipient.fullName}, 1 Kudos`);
      await expect(spotlightTicker(page).getByText(known.recipient.fullName)).toBeVisible();
      await Promise.all([resyncNow(page), resyncNow(other)]);
      await markDocument(page);
      await markDocument(other);

      const fresh = await kudoUsers.pair();
      await seedFeedKudo(fresh, { body: "Spotlight live", createdAt: spotlightWindow()() });
      await Promise.all(
        [page, other].map((viewer) => expect(spotlightTicker(viewer).getByText(fresh.recipient.fullName)).toBeVisible({ timeout: 5_000 })),
      );
      await expect(cloudName(page, fresh.recipient.fullName)).toHaveCSS("color", SPOTLIGHT_RED);
      await expect(cloudName(other, fresh.recipient.fullName)).toHaveAccessibleName(`${fresh.recipient.fullName}, 1 Kudos`);
      for (const viewer of [page, other]) {
        await expectTotalMatchesDatabase(viewer);
        expect(await sameDocument(viewer)).toBe(true);
      }
      // The highlight is temporary (a few seconds), then the name turns white again.
      await expect(cloudName(page, fresh.recipient.fullName)).toHaveCSS("color", "rgb(255, 255, 255)", { timeout: 8_000 });
    } finally {
      await otherBrowser.close();
    }
  });

  test("Mark Spam then Un Spam by an admin in another browser returns the counter and adds no ticker line", async ({
    page,
    browser,
    baseURL,
    auth,
    kudoUsers,
    sunners,
  }) => {
    const pair = await kudoUsers.pair();
    const name = pair.recipient.fullName;
    const id = await seedFeedKudo(pair, { body: "Spotlight moderation", createdAt: spotlightWindow()() });
    await auth.signIn(pair.sender);
    const adminBrowser = await signedInContext(browser, baseURL!, await sunners.create({ admin: true }));
    try {
      const admin = await adminBrowser.newPage();
      await openLiveBoard(page);
      await markDocument(page);
      await expect(spotlightTicker(page).getByText(name)).toHaveCount(1);
      await expect(cloudName(page, name)).toBeVisible();

      await openReview(admin, `?sender=${pair.sender.id}`);
      const row = reviewRow(admin, id);
      await resyncNow(page);
      await row.getByRole("button", { name: `Mark Spam Kudo ${shortId(id)}` }).click();
      await admin.getByRole("menuitem", { name: "Mark Spam" }).click();
      await expect(row.getByText("Spam", { exact: true })).toBeVisible();

      await expect(cloudName(page, name)).toHaveCount(0, { timeout: 5_000 });
      await expect(spotlightTicker(page).getByText(name)).toHaveCount(0);
      await expectTotalMatchesDatabase(page);

      await resyncNow(page);
      await row.getByRole("button", { name: `Un Spam Kudo ${shortId(id)}` }).click();
      const settled = nextResync(page);
      await admin.getByRole("menuitem", { name: "Un Spam" }).click();
      await expect(row.getByText("Public", { exact: true })).toBeVisible();

      await expect(cloudName(page, name)).toHaveAccessibleName(`${name}, 1 Kudos`, { timeout: 5_000 });
      await expectTotalMatchesDatabase(page);
      // DEC-001: restored is not news — its line does not come back and no new line appears.
      await expect(spotlightTicker(page).getByText(name)).toHaveCount(0);
      // 2–3 s after `restored` the board refetches and REPLACEs (review M1): the counts still match
      // the database and the restored line stays out of the ticker.
      await settled;
      await expectTotalMatchesDatabase(page);
      await expect(cloudName(page, name)).toHaveAccessibleName(`${name}, 1 Kudos`);
      await expect(spotlightTicker(page).getByText(name)).toHaveCount(0);
      expect(await sameDocument(page)).toBe(true);
    } finally {
      await adminBrowser.close();
    }
  });
});
