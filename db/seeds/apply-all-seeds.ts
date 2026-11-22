// Keep this a TYPE-only import: the db client module imports `server-only`, which throws
// when loaded by `tsx` (db:seed). run-seeds.ts builds its own connection instead.
import type { Db } from "@/shared/db/client";
import { seedDepartments } from "./departments";
import { seedHashtags } from "./hashtags";
import { seedSecretBoxPrizes } from "./secret-box-prize-loader";

/** Rows written per table by one seed run. */
export interface SeedReport {
  departments: number;
  hashtags: number;
  secretBoxPrizes: number;
}

/**
 * Applies every seed in one transaction (all or nothing). Each loader upserts by its
 * natural key, so running this repeatedly is safe. Later phases append their loader here
 * (phase 10: Secret Box prizes from `secret-box-prize-catalog.ts`, stock-safe re-seed).
 */
export async function applyAllSeeds(db: Db): Promise<SeedReport> {
  return db.transaction(async (tx) => ({
    departments: await seedDepartments(tx),
    hashtags: await seedHashtags(tx),
    secretBoxPrizes: await seedSecretBoxPrizes(tx),
  }));
}
