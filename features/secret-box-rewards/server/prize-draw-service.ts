import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import type { DbTx } from "@/shared/db/client";
import { secretBoxPrizes } from "@/shared/db/schema";
import type { SecretBoxIconCode } from "../schemas/secret-box-views";
import { MAX_REDRAW } from "../secret-box-config";
import { pickPrize } from "./prize-weighted-pick";

/**
 * PrizeDrawService (ALG-002, BR-004, FR-403), inside the caller's open transaction. Draws over the
 * active prizes; an unlimited prize is final, a gift must win the conditional decrement
 * (`UPDATE … SET stock_remaining = stock_remaining - 1 WHERE stock_remaining > 0`, serialised by the
 * row lock, so stock never goes negative and is never over-issued). A lost race re-reads the pool and
 * redraws, at most MAX_REDRAW times, then the draw falls back to the unlimited icons. A transaction
 * holds at most one prize row lock (a failed decrement keeps none), so opens cannot deadlock on stock.
 */
export type DrawnPrize = { id: string; kind: "icon" | "gift"; iconCode: SecretBoxIconCode | null; name: string };

async function activePrizes(tx: DbTx) {
  const rows = await tx
    .select({
      id: secretBoxPrizes.id,
      kind: secretBoxPrizes.kind,
      iconCode: secretBoxPrizes.iconCode,
      name: secretBoxPrizes.name,
      weight: secretBoxPrizes.weight,
      stockRemaining: secretBoxPrizes.stockRemaining,
    })
    .from(secretBoxPrizes)
    .where(eq(secretBoxPrizes.active, true))
    .orderBy(secretBoxPrizes.code);
  // The DB CHECK limits icon_code to SECRET_BOX_ICON_CODES.
  return rows.map((row) => ({ ...row, iconCode: row.iconCode as SecretBoxIconCode | null }));
}

async function reserveOne(tx: DbTx, prizeId: string): Promise<boolean> {
  const reserved = await tx
    .update(secretBoxPrizes)
    .set({ stockRemaining: sql`${secretBoxPrizes.stockRemaining} - 1` })
    .where(and(eq(secretBoxPrizes.id, prizeId), gt(secretBoxPrizes.stockRemaining, 0)))
    .returning({ id: secretBoxPrizes.id });
  return reserved.length > 0;
}

const toDrawn = ({ id, kind, iconCode, name }: DrawnPrize): DrawnPrize => ({ id, kind, iconCode, name });

async function draw(tx: DbTx): Promise<DrawnPrize> {
  for (let attempt = 0; attempt < MAX_REDRAW; attempt += 1) {
    const prize = pickPrize(await activePrizes(tx));
    if (!prize) break;
    if (prize.stockRemaining === null || (await reserveOne(tx, prize.id))) return toDrawn(prize);
  }
  const icon = pickPrize(await activePrizes(tx), undefined, { iconsOnly: true });
  if (!icon) throw new Error("secret box prize pool has no active unlimited icon (run npm run db:seed)");
  return toDrawn(icon);
}

export const PrizeDrawService = { draw } as const;
