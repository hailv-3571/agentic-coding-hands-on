import "server-only";
import { randomInt as cryptoRandomInt } from "node:crypto";

/**
 * Weighted prize pick (ALG-002, BR-004) — pure. The pool is every drawable prize: unlimited
 * (`stockRemaining` NULL) or with stock left; sold-out gifts drop out of the pool AND the total.
 * The fallback (`iconsOnly`) keeps unlimited icons only, so it never needs a stock reservation.
 * `randomInt(max)` must return an integer in [0, max): the CSPRNG `crypto.randomInt` by default
 * (FR-602: the result is decided server-side), injectable for exact tests.
 */
export type DrawablePrize = { id: string; kind: "icon" | "gift"; weight: number; stockRemaining: number | null };
export type RandomInt = (maxExclusive: number) => number;

const isDrawable = (prize: DrawablePrize) => prize.stockRemaining === null || prize.stockRemaining > 0;
const isUnlimitedIcon = (prize: DrawablePrize) => prize.kind === "icon" && prize.stockRemaining === null;

export function pickPrize<T extends DrawablePrize>(
  prizes: readonly T[],
  randomInt: RandomInt = cryptoRandomInt,
  { iconsOnly = false }: { iconsOnly?: boolean } = {},
): T | null {
  const pool = prizes.filter(iconsOnly ? isUnlimitedIcon : isDrawable);
  if (pool.length === 0) return null;
  for (const prize of pool) {
    // The DB CHECK keeps weights positive integers; a bad row must fail loudly, not skew the odds.
    if (!Number.isSafeInteger(prize.weight) || prize.weight <= 0) throw new RangeError(`invalid prize weight: ${prize.id}`);
  }
  const total = pool.reduce((sum, prize) => sum + prize.weight, 0);
  const ticket = randomInt(total);
  if (!Number.isInteger(ticket) || ticket < 0 || ticket >= total) throw new RangeError("random ticket out of range");

  let remaining = ticket;
  for (const prize of pool) {
    if (remaining < prize.weight) return prize;
    remaining -= prize.weight;
  }
  throw new RangeError("random ticket out of range"); // unreachable: ticket < total
}
