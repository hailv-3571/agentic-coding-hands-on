import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { campaignActiveReader } from "@/features/admin-campaigns/server/campaign-active-reader";
import { CampaignAdminQuery } from "@/features/admin-campaigns/server/campaign-admin-query";
import { authInterruptStatusOf, closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import * as fx from "./campaign-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/** CampaignAdminQuery.list (F011 A1, FR-201/202, BR-004/006) and CampaignActiveReader (A5, ALG-001). */
const P = fx.uniquePrefix("cmp-query");
let admin: fx.TestUser;
let member: fx.TestUser;

beforeAll(async () => {
  [admin, member] = await Promise.all([fx.createUser("query-admin", "admin"), fx.createUser("query-member", "user")]);
});
beforeEach(() => requestCookies.clear());
afterEach(async () => fx.deleteCampaignsNamed(P));
afterAll(async () => {
  await fx.deleteUsers([admin, member]);
  await closeAppDb();
});

describe("CampaignAdminQuery.list", () => {
  it("lists every campaign newest start first (id DESC on ties) with phase and Vietnam-time strings", async () => {
    const ended = await fx.insertCampaignAround(`${P} ended`, -180, -120);
    const active = await fx.insertCampaignAround(`${P} active`, -60, 60);
    const tieLow = await fx.insertCampaignAt(`${P} tie low`, "2601-12-23T03:00:00Z", "2601-12-23T04:00:00Z");
    const upcoming = await fx.insertCampaignAt(`${P} upcoming`, "2601-12-24T17:00:00Z", "2601-12-25T17:30:00Z");
    await signInToJar(requestCookies, admin.email);

    const mine = (await CampaignAdminQuery.list()).filter((item) => item.name.startsWith(P));
    expect(mine.map((item) => [item.id, item.phase])).toEqual([
      [upcoming, "upcoming"],
      [tieLow, "upcoming"],
      [active, "active"],
      [ended, "ended"],
    ]);
    expect(mine[0]).toEqual({
      id: upcoming,
      name: `${P} upcoming`,
      startsAt: "2601-12-24T17:00:00.000Z",
      endsAt: "2601-12-25T17:30:00.000Z",
      phase: "upcoming",
      startsAtLocal: "2601-12-25T00:00",
      endsAtLocal: "2601-12-26T00:30",
      startsAtDisplay: "25/12/2601 - 00:00",
      endsAtDisplay: "26/12/2601 - 00:30",
    });
  });

  it("answers 403 to a non-admin before reading anything", async () => {
    await signInToJar(requestCookies, member.email);
    const thrown = await CampaignAdminQuery.list().then(() => null, (error: unknown) => error);
    expect(authInterruptStatusOf(thrown)).toBe(403);
  });
});

describe("campaignActiveReader.findActive", () => {
  const START = "2601-06-01T03:00:00.000Z";
  const END = "2601-06-01T05:00:00.000Z";

  it("finds the campaign on [startsAt, endsAt): from the start, not at the end", async () => {
    const id = await fx.insertCampaignAt(`${P} window`, START, END);
    expect(await campaignActiveReader.findActive(new Date(START))).toEqual({
      id,
      name: `${P} window`,
      startsAt: new Date(START),
      endsAt: new Date(END),
    });
    expect(await campaignActiveReader.findActive(new Date("2601-06-01T04:59:59.999Z"))).toMatchObject({ id });
    expect(await campaignActiveReader.findActive(new Date(END))).toBeNull();
    expect(await campaignActiveReader.findActive(new Date("2601-06-01T02:59:59.999Z"))).toBeNull();
  });

  it("returns null after the campaign is deleted (FR-402)", async () => {
    await fx.insertCampaignAt(`${P} gone`, START, END);
    await fx.deleteCampaignsNamed(P);
    expect(await campaignActiveReader.findActive(new Date(START))).toBeNull();
  });
});
