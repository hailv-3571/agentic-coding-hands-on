import { revalidatePath } from "next/cache";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaign, removeCampaign, updateCampaign } from "@/features/admin-campaigns/server/campaign-admin-actions";
import { authInterruptStatusOf, closeAppDb, redirectLocationOf, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import * as fx from "./campaign-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

/** createCampaign / updateCampaign / removeCampaign (F011 A2–A4, BR-002/003/004/006, FR-601). */
const P = fx.uniquePrefix("cmp-actions");
let admin: fx.TestUser;
let member: fx.TestUser;
const window2401 = { startsAt: "2401-12-23T10:00", endsAt: "2401-12-24T10:00" };

beforeAll(async () => {
  [admin, member] = await Promise.all([fx.createUser("cmp-admin", "admin"), fx.createUser("cmp-member", "user")]);
});
beforeEach(async () => {
  requestCookies.clear();
  vi.mocked(revalidatePath).mockClear();
  await signInToJar(requestCookies, admin.email);
});
afterEach(async () => fx.deleteCampaignsNamed(P));
afterAll(async () => {
  await fx.deleteUsers([admin, member]);
  await closeAppDb();
});

const thrownBy = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);
const asMember = async () => {
  requestCookies.clear();
  await signInToJar(requestCookies, member.email);
};

describe("createCampaign", () => {
  it("stores Vietnam wall-clock input as UTC, trims the name and refreshes /admin/settings", async () => {
    const result = await createCampaign({ name: `  ${P} launch  `, ...window2401 });
    expect(result).toEqual({ ok: true, id: expect.any(Number) });
    const row = await fx.campaignRow((result as { id: number }).id);
    expect(row).toMatchObject({ name: `${P} launch` });
    expect([row?.starts_at.toISOString(), row?.ends_at.toISOString()]).toEqual(["2401-12-23T03:00:00.000Z", "2401-12-24T03:00:00.000Z"]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it.each<[string, Record<string, unknown>, object]>([
    ["a blank name", { name: "   " }, { name: ["nameRequired"] }],
    ["a 101-character name", { name: "a".repeat(101) }, { name: ["nameRequired"] }],
    ["a missing start", { startsAt: "" }, { startsAt: ["startRequired"] }],
    ["a malformed end", { endsAt: "24/12/2401 10:00" }, { endsAt: ["invalidDateTime"] }],
    ["an end equal to the start", { endsAt: window2401.startsAt }, { endsAt: ["endBeforeStart"] }],
    ["an end in the past", { startsAt: "2020-01-01T00:00", endsAt: "2020-01-02T00:00" }, { endsAt: ["endInPast"] }],
  ])("rejects %s with field errors and writes nothing", async (_label, patch, fieldErrors) => {
    expect(await createCampaign({ name: `${P} x`, ...window2401, ...patch } as never)).toEqual({ ok: false, code: "VALIDATION", fieldErrors });
    expect(await fx.campaignsNamed(P)).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an overlap and names the campaign it collides with, in Vietnam time", async () => {
    await createCampaign({ name: `${P} first`, ...window2401 });
    const result = await createCampaign({ name: `${P} second`, startsAt: "2401-12-23T18:00", endsAt: "2401-12-25T10:00" });
    expect(result).toEqual({
      ok: false,
      code: "OVERLAP",
      conflict: { name: `${P} first`, startsAt: "23/12/2401 - 10:00", endsAt: "24/12/2401 - 10:00" },
    });
    expect((await fx.campaignsNamed(P)).map((row) => row.name)).toEqual([`${P} first`]);
  });

  it("accepts [a, b) followed by [b, c)", async () => {
    expect((await createCampaign({ name: `${P} a`, ...window2401 })).ok).toBe(true);
    expect((await createCampaign({ name: `${P} b`, startsAt: window2401.endsAt, endsAt: "2401-12-25T10:00" })).ok).toBe(true);
  });
});

describe("updateCampaign", () => {
  it("changes every field of an upcoming campaign", async () => {
    const id = await fx.insertCampaignAt(`${P} up`, "2401-12-23T03:00:00Z", "2401-12-24T03:00:00Z");
    expect(await updateCampaign({ id, name: `${P} moved`, startsAt: "2401-12-26T08:00", endsAt: "2401-12-27T08:30" })).toEqual({ ok: true, id });
    const row = await fx.campaignRow(id);
    expect([row?.name, row?.starts_at.toISOString(), row?.ends_at.toISOString()]).toEqual([
      `${P} moved`,
      "2401-12-26T01:00:00.000Z",
      "2401-12-27T01:30:00.000Z",
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("lets an active campaign change its name and end, keeping (or resending) its start (DEC-002)", async () => {
    const id = await fx.insertCampaignAround(`${P} live`, -60, 60);
    const start = (await fx.campaignRow(id))!.starts_at;
    expect(await updateCampaign({ id, name: `${P} live 2`, endsAt: fx.vnLocal(start, 180) })).toEqual({ ok: true, id });
    expect(await updateCampaign({ id, name: `${P} live 3`, startsAt: fx.vnLocal(start), endsAt: fx.vnLocal(start, 150) })).toEqual({ ok: true, id });
    const row = await fx.campaignRow(id);
    expect([row?.name, row?.starts_at, row?.ends_at.getTime()]).toEqual([`${P} live 3`, start, start.getTime() + 150 * 60_000]);
  });

  it("rejects moving the start of an active campaign, even by a direct call", async () => {
    const id = await fx.insertCampaignAround(`${P} live`, -60, 60);
    const before = await fx.campaignRow(id);
    const start = before!.starts_at;
    expect(await updateCampaign({ id, name: `${P} live`, startsAt: fx.vnLocal(start, 30), endsAt: fx.vnLocal(start, 120) })).toEqual({
      ok: false,
      code: "VALIDATION",
      fieldErrors: { startsAt: ["startLocked"] },
    });
    expect(await fx.campaignRow(id)).toEqual(before);
  });

  it("refuses to edit an ended campaign (ENDED) and leaves it as it was", async () => {
    const id = await fx.insertCampaignAround(`${P} old`, -180, -120);
    const before = await fx.campaignRow(id);
    expect(await updateCampaign({ id, name: `${P} renamed`, endsAt: fx.vnLocalFromNow(60) })).toEqual({ ok: false, code: "ENDED" });
    expect(await fx.campaignRow(id)).toEqual(before);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("answers NOT_FOUND for a deleted or malformed id", async () => {
    const input = { name: `${P} ghost`, ...window2401 };
    expect(await updateCampaign({ id: 2_000_000_000, ...input })).toEqual({ ok: false, code: "NOT_FOUND" });
    expect(await updateCampaign({ id: -1, ...input })).toEqual({ ok: false, code: "NOT_FOUND" });
  });

  it("excludes the campaign itself from the overlap check but not its neighbours", async () => {
    const id = await fx.insertCampaignAt(`${P} self`, "2401-12-23T03:00:00Z", "2401-12-24T03:00:00Z");
    await fx.insertCampaignAt(`${P} next`, "2401-12-25T03:00:00Z", "2401-12-26T03:00:00Z");
    expect((await updateCampaign({ id, name: `${P} self`, startsAt: "2401-12-23T12:00", endsAt: "2401-12-25T10:00" })).ok).toBe(true);
    expect(await updateCampaign({ id, name: `${P} self`, startsAt: "2401-12-23T12:00", endsAt: "2401-12-25T10:01" })).toMatchObject({
      ok: false,
      code: "OVERLAP",
      conflict: { name: `${P} next` },
    });
  });
});

describe("removeCampaign", () => {
  it("hard-deletes an upcoming or an active campaign", async () => {
    const upcoming = await fx.insertCampaignAt(`${P} up`, "2401-12-23T03:00:00Z", "2401-12-24T03:00:00Z");
    const active = await fx.insertCampaignAround(`${P} live`, -60, 60);
    expect(await removeCampaign(upcoming)).toEqual({ ok: true, id: upcoming });
    expect(await removeCampaign(active)).toEqual({ ok: true, id: active });
    expect(await fx.campaignsNamed(P)).toEqual([]);
  });

  it("refuses to delete an ended campaign and answers NOT_FOUND for a missing one", async () => {
    const ended = await fx.insertCampaignAround(`${P} old`, -180, -120);
    expect(await removeCampaign(ended)).toEqual({ ok: false, code: "ENDED" });
    expect(await fx.campaignRow(ended)).toBeDefined();
    expect(await removeCampaign(2_000_000_000)).toEqual({ ok: false, code: "NOT_FOUND" });
  });
});

describe("admin guard (FR-601, SC-006)", () => {
  it("answers 403 to a non-admin on every action and writes nothing", async () => {
    const id = await fx.insertCampaignAt(`${P} keep`, "2401-12-23T03:00:00Z", "2401-12-24T03:00:00Z");
    const before = await fx.campaignsNamed(P);
    await asMember();
    const thrown = await Promise.all([
      thrownBy(createCampaign({ name: `${P} sneaky`, startsAt: "2402-01-01T00:00", endsAt: "2402-01-02T00:00" })),
      thrownBy(updateCampaign({ id, name: `${P} hacked`, ...window2401 })),
      thrownBy(removeCampaign(id)),
    ]);
    expect(thrown.map(authInterruptStatusOf)).toEqual([403, 403, 403]);
    expect(await fx.campaignsNamed(P)).toEqual(before);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("redirects a guest to /login", async () => {
    requestCookies.clear();
    expect(redirectLocationOf(await thrownBy(createCampaign({ name: `${P} guest`, ...window2401 })))).toBe("/login");
    expect(await fx.campaignsNamed(P)).toEqual([]);
  });
});
