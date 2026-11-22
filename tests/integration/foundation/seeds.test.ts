import { asc, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { applyAllSeeds } from "@/db/seeds/apply-all-seeds";
import { departmentSeeds } from "@/db/seeds/departments";
import { hashtagSeeds } from "@/db/seeds/hashtags";
import { secretBoxPrizeCatalog } from "@/db/seeds/secret-box-prize-catalog";
import { departments, hashtags } from "@/shared/db/schema";
import { testDb } from "../../setup/integration-db";

async function snapshot() {
  const [deps, tags] = await Promise.all([
    testDb.select().from(departments).orderBy(asc(departments.sortOrder)),
    testDb.select().from(hashtags).orderBy(asc(hashtags.sortOrder)),
  ]);
  return { deps, tags };
}

describe("reference data seeds", () => {
  it("are idempotent: a second run keeps the same rows and ids", async () => {
    const firstReport = await applyAllSeeds(testDb);
    const first = await snapshot();
    const secondReport = await applyAllSeeds(testDb);
    const second = await snapshot();

    expect(secondReport).toEqual(firstReport);
    expect(second).toEqual(first);
    expect(firstReport).toEqual({
      departments: departmentSeeds.length,
      hashtags: hashtagSeeds.length,
      secretBoxPrizes: secretBoxPrizeCatalog.length,
    });
  });

  it("load the Figma lists in display order", async () => {
    await applyAllSeeds(testDb);
    const { deps, tags } = await snapshot();
    expect(deps.map((d) => d.code)).toEqual(["CEVC1", "CEVC2", "CEVC3", "CEVC4", "OPD", "Infra"]);
    expect(tags.map((t) => t.slug)).toEqual([
      "high-performing",
      "be-professional",
      "be-optimistic",
      "be-a-team",
      "think-outside-the-box",
      "get-risky",
      "go-fast",
      "wasshoi",
    ]);
    expect(tags.find((t) => t.slug === "high-performing")?.labelVi).toBe("#High-performing");
  });

  it("restore edited rows to the seed values (seed file is the source of truth)", async () => {
    await applyAllSeeds(testDb);
    await testDb
      .update(hashtags)
      .set({ labelVi: "edited", isActive: false })
      .where(eq(hashtags.slug, "go-fast"));

    await applyAllSeeds(testDb);

    const [row] = await testDb.select().from(hashtags).where(eq(hashtags.slug, "go-fast"));
    expect(row).toMatchObject({ labelVi: "#GO FAST", labelEn: "#GO FAST", isActive: true });
    const [{ total }] = await testDb.execute<{ total: number }>(
      sql`select count(*)::int as total from hashtags where slug = 'go-fast'`,
    );
    expect(total).toBe(1);
  });
});
