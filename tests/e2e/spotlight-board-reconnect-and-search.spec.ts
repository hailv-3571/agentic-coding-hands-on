import { expect, seedFeedKudo, test } from "./kudos-feed/live-board-fixtures";
import {
  cloudName,
  expectTotalMatchesDatabase,
  nextResync,
  openLiveBoard,
  spotlightRegion,
  spotlightSearch,
  spotlightTicker,
  spotlightTotal,
  spotlightWindow,
} from "./spotlight-board-e2e-helpers";

/**
 * F008 Spotlight Board beyond the live path (phase 11): SM-001 offline → "Đang kết nối lại…" →
 * online rejoins, refetches and REPLACES (a Kudo written while offline counts once); the in-board
 * search ignores case and diacritics, dims the other names to 25 % and says when nothing matches
 * (DEC-002); an empty snapshot shows "0 KUDOS" and the empty message (FR-206).
 * Serial: the counter is global, so this file's tests never write Kudos at the same time.
 */
test.describe.configure({ mode: "serial" });

test.describe("Spotlight Board reconnect, search and empty state", () => {
  test("offline shows the reconnecting label; back online it refetches without double counting", async ({ page, context, auth, kudoUsers }) => {
    const pair = await kudoUsers.pair();
    const name = pair.recipient.fullName;
    const at = spotlightWindow();
    await seedFeedKudo(pair, { body: "Trước khi mất mạng", createdAt: at(0) });
    await auth.signIn(pair.sender);
    await openLiveBoard(page);
    await expect(cloudName(page, name)).toHaveAccessibleName(`${name}, 1 Kudos`);

    await context.setOffline(true);
    await expect(spotlightRegion(page).getByRole("status").getByText("Đang kết nối lại…")).toBeVisible();
    await expect(cloudName(page, name)).toBeVisible();
    await seedFeedKudo(pair, { body: "Trong lúc mất mạng", createdAt: at(1) });

    const resynced = nextResync(page);
    await context.setOffline(false);
    await resynced;
    await expect(spotlightRegion(page).getByText("Đang kết nối lại…")).toHaveCount(0);
    await expect(cloudName(page, name)).toHaveAccessibleName(`${name}, 2 Kudos`);
    await expect(spotlightTicker(page).getByText(name)).toHaveCount(2);
    await expectTotalMatchesDatabase(page);
  });

  test("search ignores case and diacritics, dims the other names and says when nothing matches", async ({ page, auth, kudoUsers }) => {
    const found = await kudoUsers.pair();
    const other = await kudoUsers.pair();
    const at = spotlightWindow();
    await seedFeedKudo(found, { body: "Được tìm thấy", createdAt: at(0) });
    await seedFeedKudo(other, { body: "Bị làm mờ", createdAt: at(1) });
    await auth.signIn(found.sender);
    await openLiveBoard(page);
    const foundName = cloudName(page, found.recipient.fullName);
    const otherName = cloudName(page, other.recipient.fullName);
    await expect(otherName).toHaveCSS("opacity", "1");

    // "Đồng Đội ab12cd" typed without marks and in capitals.
    const token = found.recipient.fullName.split(" ").at(-1)!;
    await spotlightSearch(page).fill(`DONG DOI ${token}`);
    await expect(otherName).toHaveCSS("opacity", "0.25");
    await expect(foundName).toHaveCSS("opacity", "1");
    await expect(spotlightRegion(page).getByText("Không tìm thấy tên nào")).toHaveCount(0);

    await spotlightSearch(page).fill("zzzz không có ai");
    await expect(spotlightRegion(page).getByText("Không tìm thấy tên nào")).toBeVisible();
    await expect(foundName).toHaveCSS("opacity", "0.25");

    await spotlightSearch(page).fill("");
    await expect(spotlightRegion(page).getByText("Không tìm thấy tên nào")).toHaveCount(0);
    await expect(otherName).toHaveCSS("opacity", "1");
    await expect(spotlightSearch(page)).toHaveAttribute("maxlength", "50");
  });

  // The database is shared with other specs, so "no public Kudo yet" is produced by answering the
  // region's own refetch with an empty snapshot; the page and the channel stay real.
  test("an empty snapshot shows 0 KUDOS and the empty message", async ({ page, auth, sunners }) => {
    await page.route("**/api/spotlight", (route) => route.fulfill({ json: { total: 0, names: [], recent: [] } }));
    await auth.signIn(await sunners.create());
    await openLiveBoard(page);
    await expect(spotlightTotal(page)).toHaveText("0 KUDOS");
    await expect(spotlightRegion(page).getByText("Chưa có Kudos nào để vinh danh.")).toBeVisible();
    await expect(spotlightTicker(page).getByRole("listitem")).toHaveCount(0);
    await expect(spotlightRegion(page).getByRole("link")).toHaveCount(0);
  });
});
