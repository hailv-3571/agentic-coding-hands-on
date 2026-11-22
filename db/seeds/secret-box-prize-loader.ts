import { notInArray, sql } from "drizzle-orm";
import type { DbTx } from "@/shared/db/client";
import { secretBoxPrizes } from "@/shared/db/schema";
import { secretBoxPrizeCatalog, type SecretBoxPrizeSeed } from "./secret-box-prize-catalog";

/**
 * Loads the Secret Box prize catalog (C-15, D003) into `secret_box_prizes`, upserting by `code`
 * (= the catalog's stable `iconKey`). Icon rows get `icon_code` = the key in UPPER_SNAKE
 * (`touch-of-light` → `TOUCH_OF_LIGHT`, one of SECRET_BOX_ICON_CODES; the DB CHECK rejects others).
 * Stock re-seed safety: a new row starts with remaining = total; an existing one keeps its issued
 * count, remaining = max(new total − (old total − old remaining), 0), so BTC can raise or lower a
 * total by editing the catalog and re-running `npm run db:seed`. Prizes no longer in the catalog are
 * deactivated (never deleted: opened boxes reference them).
 */
const iconCodeOf = (seed: SecretBoxPrizeSeed) => (seed.kind === "icon" ? seed.iconKey.toUpperCase().replaceAll("-", "_") : null);

const rowsOf = (catalog: readonly SecretBoxPrizeSeed[]) =>
  catalog.map((seed) => ({
    code: seed.iconKey,
    kind: seed.kind,
    iconCode: iconCodeOf(seed),
    name: seed.name,
    weight: seed.weight,
    stockTotal: seed.stock,
    stockRemaining: seed.stock,
    active: true,
  })) satisfies (typeof secretBoxPrizes.$inferInsert)[];

/** Upserts every catalog prize; returns the number of rows written. */
export async function seedSecretBoxPrizes(tx: DbTx): Promise<number> {
  const rows = rowsOf(secretBoxPrizeCatalog);
  const written = await tx
    .insert(secretBoxPrizes)
    .values(rows)
    .onConflictDoUpdate({
      target: secretBoxPrizes.code,
      set: {
        kind: sql`excluded.kind`,
        iconCode: sql`excluded.icon_code`,
        name: sql`excluded.name`,
        weight: sql`excluded.weight`,
        active: sql`excluded.active`,
        stockTotal: sql`excluded.stock_total`,
        stockRemaining: sql`case when excluded.stock_total is null then null else greatest(
          excluded.stock_total - (coalesce(${secretBoxPrizes.stockTotal}, 0) - coalesce(${secretBoxPrizes.stockRemaining}, 0)), 0) end`,
      },
    })
    .returning({ id: secretBoxPrizes.id });
  await tx
    .update(secretBoxPrizes)
    .set({ active: false })
    .where(notInArray(secretBoxPrizes.code, rows.map((row) => row.code)));
  return written.length;
}
