import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaign } from "@/features/admin-campaigns/server/campaign-admin-actions";
import { CampaignOverlapCheck } from "@/features/admin-campaigns/server/campaign-overlap-check";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import * as fx from "./campaign-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

/**
 * BR-002 / SC-001 under concurrency: the EXCLUDE constraint is the last line when two admins save
 * overlapping campaigns at once; the action maps SQLSTATE 23P01 to the same OVERLAP answer.
 */
const P = fx.uniquePrefix("cmp-race");
let admin: fx.TestUser;

beforeAll(async () => {
  admin = await fx.createUser("race-admin", "admin");
});
beforeEach(async () => {
  requestCookies.clear();
  await signInToJar(requestCookies, admin.email);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await fx.deleteCampaignsNamed(P);
});
afterAll(async () => {
  await fx.deleteUsers([admin]);
  await closeAppDb();
});

/** Proves the second insert really runs concurrently: it is blocked behind the first transaction. */
async function waitUntilAnInsertWaitsOnALock(): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [row] = await testSql<{ waiting: number }[]>`
      select count(*)::int as waiting from pg_stat_activity
      where wait_event_type = 'Lock' and query like 'insert into public.campaigns%'`;
    if (row.waiting > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("the second insert never waited on the first transaction");
}

describe("campaign no-overlap under concurrency", () => {
  it("blocks the second of two concurrent overlapping inserts with 23P01 once the first commits", async () => {
    const first = await testSql.reserve();
    try {
      await first`begin`;
      await first`insert into public.campaigns (name, starts_at, ends_at)
                  values (${`${P} first`}, '2501-01-01T00:00:00Z', '2501-01-02T00:00:00Z')`;
      const second = testSql`insert into public.campaigns (name, starts_at, ends_at)
                             values (${`${P} second`}, '2501-01-01T12:00:00Z', '2501-01-03T00:00:00Z')`.then(
        () => "inserted",
        (error: { code?: string }) => error.code,
      );
      await waitUntilAnInsertWaitsOnALock();
      await first`commit`;
      expect(await second).toBe("23P01");
    } finally {
      first.release();
    }
    expect((await fx.campaignsNamed(P)).map((row) => row.name)).toEqual([`${P} first`]);
  });

  it("maps a 23P01 that slipped past the pre-check to OVERLAP, naming the committed campaign", async () => {
    await fx.insertCampaignAt(`${P} winner`, "2501-01-01T03:00:00Z", "2501-01-02T03:00:00Z");
    vi.spyOn(CampaignOverlapCheck, "find").mockResolvedValueOnce(null);
    const result = await createCampaign({ name: `${P} loser`, startsAt: "2501-01-01T20:00", endsAt: "2501-01-03T10:00" });
    expect(result).toEqual({
      ok: false,
      code: "OVERLAP",
      conflict: { name: `${P} winner`, startsAt: "01/01/2501 - 10:00", endsAt: "02/01/2501 - 10:00" },
    });
    expect((await fx.campaignsNamed(P)).map((row) => row.name)).toEqual([`${P} winner`]);
  });

  it("lets exactly one of five concurrent overlapping creates win", async () => {
    const results = await Promise.all(
      [0, 1, 2, 3, 4].map((index) =>
        createCampaign({ name: `${P} racer ${index}`, startsAt: `2501-02-0${index + 1}T00:00`, endsAt: "2501-02-09T00:00" }),
      ),
    );
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok).map((result) => (result as { code: string }).code)).toEqual(Array(4).fill("OVERLAP"));
    expect(await fx.campaignsNamed(P)).toHaveLength(1);
  });

  it("accepts two concurrent adjacent windows [a, b) and [b, c)", async () => {
    const results = await Promise.all([
      createCampaign({ name: `${P} a`, startsAt: "2501-03-01T00:00", endsAt: "2501-03-02T00:00" }),
      createCampaign({ name: `${P} b`, startsAt: "2501-03-02T00:00", endsAt: "2501-03-03T00:00" }),
    ]);
    expect(results.map((result) => result.ok)).toEqual([true, true]);
  });
});
