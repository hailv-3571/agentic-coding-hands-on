import { describe, expect, it } from "vitest";
import { pickPrize, type DrawablePrize } from "@/features/secret-box-rewards/server/prize-weighted-pick";

/**
 * ALG-002 pick (BR-004): weighted over the drawable pool (stock NULL = unlimited, or > 0), zero-stock
 * gifts excluded, icon-only fallback. The random source is injected (`randomInt(max)` → [0, max)),
 * so the ticket → prize mapping is checked exactly instead of statistically.
 */
const prize = (id: string, kind: DrawablePrize["kind"], weight: number, stockRemaining: number | null): DrawablePrize => ({
  id,
  kind,
  weight,
  stockRemaining,
});
const icon = prize("icon", "icon", 3, null);
const gift = prize("gift", "gift", 1, 5);
const soldOut = prize("sold-out", "gift", 100, 0);
const fixed = (ticket: number) => () => ticket;

describe("pickPrize", () => {
  it("maps every ticket of [0, total weight) to exactly one prize, proportionally to its weight", () => {
    const pool = [icon, gift, prize("rare", "gift", 2, 1)];
    const seen: string[] = [];
    let total = -1;
    for (let ticket = 0; ticket < 6; ticket += 1) {
      seen.push(
        pickPrize(pool, (max) => {
          total = max;
          return ticket;
        })?.id ?? "none",
      );
    }
    expect(total).toBe(6);
    expect(seen).toEqual(["icon", "icon", "icon", "gift", "rare", "rare"]);
  });

  it("excludes sold-out gifts from the pool and from the total weight", () => {
    let total = -1;
    const picked = pickPrize([soldOut, icon, gift], (max) => {
      total = max;
      return max - 1;
    });
    expect(total).toBe(4);
    expect(picked?.id).toBe("gift");
  });

  it("keeps unlimited prizes (stock NULL) drawable", () => {
    expect(pickPrize([prize("unlimited-gift", "gift", 1, null)], fixed(0))?.id).toBe("unlimited-gift");
  });

  it("draws among unlimited icons only for the fallback", () => {
    const limitedIcon = prize("limited-icon", "icon", 50, 3);
    let total = -1;
    const picked = pickPrize([gift, limitedIcon, icon], (max) => {
      total = max;
      return 0;
    }, { iconsOnly: true });
    expect(total).toBe(3);
    expect(picked?.id).toBe("icon");
  });

  it("returns null when nothing is drawable", () => {
    expect(pickPrize([], fixed(0))).toBeNull();
    expect(pickPrize([soldOut], fixed(0))).toBeNull();
    expect(pickPrize([gift], fixed(0), { iconsOnly: true })).toBeNull();
  });

  it("rejects a random source that leaves [0, total)", () => {
    expect(() => pickPrize([icon], fixed(3))).toThrow(RangeError);
    expect(() => pickPrize([icon], fixed(-1))).toThrow(RangeError);
  });

  it("rejects a non-positive or fractional weight instead of skewing the draw", () => {
    expect(() => pickPrize([prize("zero", "icon", 0, null)], fixed(0))).toThrow(RangeError);
    expect(() => pickPrize([prize("half", "icon", 1.5, null)], fixed(0))).toThrow(RangeError);
  });

  it("uses the CSPRNG by default and always lands in the pool", () => {
    const pool = [icon, gift];
    for (let run = 0; run < 50; run += 1) expect(pool).toContain(pickPrize(pool));
  });
});
