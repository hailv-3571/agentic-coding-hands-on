import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { secretBoxPrizeCatalog } from "@/db/seeds/secret-box-prize-catalog";
import { seedSecretBoxPrizes } from "@/db/seeds/secret-box-prize-loader";
import { SECRET_BOX_ICON_CODES } from "@/features/secret-box-rewards/schemas/secret-box-views";
import { withRollback } from "../../setup/integration-db";

/**
 * Prize loader (C-15, plan "stock re-seed safety"): upsert by code from the phase 01 catalog; a
 * re-seed applies BTC's new totals without resetting the issued count
 * (remaining = max(new total − (old total − old remaining), 0)); prizes dropped from the catalog
 * stop being drawn. Every case runs in a rolled-back transaction.
 */
type Tx = Parameters<Parameters<typeof withRollback>[0]>[0];
type PrizeRow = { id: string; code: string; kind: string; icon_code: string | null; name: string; weight: number; stock_total: number | null; stock_remaining: number | null; active: boolean };
const GIFT = secretBoxPrizeCatalog.find((seed) => seed.kind === "gift");
if (!GIFT) throw new Error("the catalog has no gift");
const prizesOf = (tx: Tx) => tx.execute<PrizeRow>(sql`select * from public.secret_box_prizes order by code`);
const giftOf = async (tx: Tx) => (await tx.execute<PrizeRow>(sql`select * from public.secret_box_prizes where code = ${GIFT.iconKey}`))[0];
const setGiftStock = (tx: Tx, total: number, remaining: number) =>
  tx.execute(sql`update public.secret_box_prizes set stock_total = ${total}, stock_remaining = ${remaining} where code = ${GIFT.iconKey}`);

describe("seedSecretBoxPrizes", () => {
  it("loads the catalog by code: 6 unlimited icons in code order, gifts with remaining = total", async () => {
    const rows = await withRollback(async (tx) => {
      expect(await seedSecretBoxPrizes(tx)).toBe(secretBoxPrizeCatalog.length);
      return (await prizesOf(tx)).filter((row) => secretBoxPrizeCatalog.some((seed) => seed.iconKey === row.code));
    });
    const icons = rows.filter((row) => row.kind === "icon");
    expect(icons.map((row) => row.icon_code).sort()).toEqual([...SECRET_BOX_ICON_CODES].sort());
    expect(icons.every((row) => row.active && row.stock_total === null && row.stock_remaining === null)).toBe(true);
    expect(rows.find((row) => row.code === "touch-of-light")).toMatchObject({ icon_code: "TOUCH_OF_LIGHT", name: "TOUCH OF LIGHT", weight: 10 });
    expect(rows.find((row) => row.code === GIFT.iconKey)).toMatchObject({
      kind: "gift",
      icon_code: null,
      name: GIFT.name,
      weight: GIFT.weight,
      stock_total: GIFT.stock,
      stock_remaining: GIFT.stock,
      active: true,
    });
  });

  it("is idempotent: a second run keeps ids and values", async () => {
    const [first, second] = await withRollback(async (tx) => {
      await seedSecretBoxPrizes(tx);
      const before = await prizesOf(tx);
      await seedSecretBoxPrizes(tx);
      return [before, await prizesOf(tx)];
    });
    expect(second).toEqual(first);
  });

  it("keeps the issued count across a re-seed with the same total", async () => {
    const gift = await withRollback(async (tx) => {
      await seedSecretBoxPrizes(tx);
      await setGiftStock(tx, GIFT.stock ?? 0, (GIFT.stock ?? 0) - 3);
      await seedSecretBoxPrizes(tx);
      return giftOf(tx);
    });
    expect(gift).toMatchObject({ stock_total: GIFT.stock, stock_remaining: (GIFT.stock ?? 0) - 3 });
  });

  it("applies a changed total minus what was already issued, never below zero", async () => {
    const [raised, lowered] = await withRollback(async (tx) => {
      await seedSecretBoxPrizes(tx);
      await setGiftStock(tx, 40, 37); // old total 40, 3 issued → new total applies with 3 still issued
      await seedSecretBoxPrizes(tx);
      const afterRaise = await giftOf(tx);
      await setGiftStock(tx, 100, 10); // 90 issued, more than the new total
      await seedSecretBoxPrizes(tx);
      return [afterRaise, await giftOf(tx)];
    });
    expect(raised).toMatchObject({ stock_total: GIFT.stock, stock_remaining: (GIFT.stock ?? 0) - 3 });
    expect(lowered).toMatchObject({ stock_total: GIFT.stock, stock_remaining: 0 });
  });

  it("restores edited names/weights/active flags and deactivates prizes dropped from the catalog", async () => {
    const [gift, dropped] = await withRollback(async (tx) => {
      await seedSecretBoxPrizes(tx);
      await tx.execute(sql`update public.secret_box_prizes set name = 'edited', weight = 99, active = false where code = ${GIFT.iconKey}`);
      await tx.execute(sql`
        insert into public.secret_box_prizes (code, kind, name, weight, stock_total, stock_remaining)
        values ('retired-gift', 'gift', 'Retired', 1, 5, 5)`);
      await seedSecretBoxPrizes(tx);
      const [retired] = await tx.execute<PrizeRow>(sql`select * from public.secret_box_prizes where code = 'retired-gift'`);
      return [await giftOf(tx), retired];
    });
    expect(gift).toMatchObject({ name: GIFT.name, weight: GIFT.weight, active: true });
    expect(dropped).toMatchObject({ active: false, stock_remaining: 5 });
  });
});
