import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { loadRewardsColumnData } from "@/features/secret-box-rewards/server/rewards-column-data-loader";
import { LatestGiftWinnersQuery } from "@/features/secret-box-rewards/server/latest-gift-winners-query";
import { PersonalRewardStatsQuery } from "@/features/secret-box-rewards/server/personal-reward-stats-query";
import { closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as fx from "./secret-box-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) => (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()));
vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * Data of the Live board rewards column (FR-604: the winners list and the stats are for logged-in
 * Sunners only). A guest is sent to /login before either query runs, so no winner name or stat is
 * ever read for them; a Sunner gets their own stats (user id from the session) and the winners list.
 */
let viewer: Sunner;
const catchThrown = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);

beforeAll(async () => {
  [viewer] = await fx.createSunners(["sbx-column-viewer"]);
});
beforeEach(() => requestCookies.clear());
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await fx.cleanupSecretBoxUsers([viewer]);
  await closeAppDb();
});

describe("rewards column data loader", () => {
  it("redirects a guest to /login without reading the winners list or any stats", async () => {
    const winners = vi.spyOn(LatestGiftWinnersQuery, "top10");
    const stats = vi.spyOn(PersonalRewardStatsQuery, "forUser");

    expect(redirectLocationOf(await catchThrown(loadRewardsColumnData()))).toBe("/login");
    expect(winners).not.toHaveBeenCalled();
    expect(stats).not.toHaveBeenCalled();
  });

  it("serves a signed-in Sunner their own stats and the winners list", async () => {
    const stats = vi.spyOn(PersonalRewardStatsQuery, "forUser");
    await signInToJar(requestCookies, viewer.email);

    const data = await loadRewardsColumnData();
    expect(stats).toHaveBeenCalledWith(viewer.id);
    expect(data.stats).toMatchObject({ kudosReceived: 0, kudosSent: 0, boxesOpened: 0, boxesUnopened: 0 });
    expect(Array.isArray(data.winners)).toBe(true);
  });
});
