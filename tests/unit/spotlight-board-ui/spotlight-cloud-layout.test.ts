import { describe, expect, it } from "vitest";
import {
  layoutNameCloud,
  nameTiers,
  topNames,
  type CloudLayoutInput,
  type CloudPlacement,
  type CloudRect,
} from "@/features/spotlight-board/lib/spotlight-cloud-layout";
import type { SpotlightName } from "@/features/spotlight-board/schemas/spotlight-views";

/**
 * ALG-001 / BR-002: 4 size tiers (most Kudos → largest, equal counts → same tier), top N by count
 * then id, a deterministic layout seeded by the recipient id, and names that keep their place when
 * only counts change (same tier) or when another name joins the cloud.
 */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const person = (n: number, count: number): SpotlightName => ({ recipientId: id(n), name: `Nguyễn Văn ${n}`, count });
const FONT_SIZES = [6.7, 7.9, 10.2, 11.3];

function input(names: SpotlightName[], overrides: Partial<CloudLayoutInput> = {}): CloudLayoutInput {
  return { names, max: 60, width: 1100, height: 470, fontSizes: FONT_SIZES, obstacles: [], ...overrides };
}

const byId = (placements: CloudPlacement[]) => new Map(placements.map((placement) => [placement.recipientId, placement]));
const position = (placement: CloudPlacement | undefined) => placement && { x: placement.x, y: placement.y };

/** Pixel box of a placement, with the same text-size estimate the layout uses (via its own fields). */
function rectOf(placement: CloudPlacement, width: number, height: number): CloudRect {
  return {
    x: placement.x * width - placement.width / 2,
    y: placement.y * height - placement.height / 2,
    width: placement.width,
    height: placement.height,
  };
}

const overlaps = (a: CloudRect, b: CloudRect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("nameTiers (BR-002)", () => {
  it("puts the highest count in the largest tier, equal counts in one tier, the lowest in tier 1", () => {
    const names = [person(1, 9), person(2, 5), person(3, 5), person(4, 3), person(5, 1), person(6, 1)];
    const tiers = nameTiers(names, 4);
    expect(tiers.get(id(1))).toBe(4);
    expect(tiers.get(id(2))).toBe(tiers.get(id(3)));
    expect(tiers.get(id(5))).toBe(1);
    expect(tiers.get(id(6))).toBe(1);
    expect(tiers.get(id(4))!).toBeLessThan(tiers.get(id(2))!);
  });

  it("keeps a long tail of 1-Kudo names in the smallest tier", () => {
    const names = [person(1, 4), person(2, 3), person(3, 2), ...Array.from({ length: 40 }, (_, n) => person(10 + n, 1))];
    const tiers = nameTiers(names, 4);
    expect(tiers.get(id(10))).toBe(1);
    expect(tiers.get(id(1))).toBe(4);
  });
});

describe("topNames", () => {
  it("keeps the N highest counts, ties broken by recipient id", () => {
    const names = [person(5, 1), person(4, 3), person(3, 1), person(2, 3), person(1, 1)];
    expect(topNames(names, 3).map((name) => name.recipientId)).toEqual([id(2), id(4), id(1)]);
  });
});

describe("layoutNameCloud (ALG-001)", () => {
  const names = Array.from({ length: 30 }, (_, n) => person(n + 1, (n % 5) + 1));

  it("is deterministic: the same names in any order give the same layout", () => {
    const first = layoutNameCloud(input(names), null);
    const second = layoutNameCloud(input([...names].reverse()), null);
    expect(byId(second.placements)).toEqual(byId(first.placements));
  });

  it("places every name inside the board without overlapping another name or an obstacle", () => {
    const obstacles: CloudRect[] = [{ x: 0, y: 360, width: 420, height: 110 }];
    const layout = layoutNameCloud(input(names, { obstacles }), null);
    expect(layout.placements).toHaveLength(30);
    for (const [index, placement] of layout.placements.entries()) {
      const rect = rectOf(placement, 1100, 470);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(1100);
      expect(rect.y + rect.height).toBeLessThanOrEqual(470);
      expect(overlaps(rect, obstacles[0])).toBe(false);
      for (const other of layout.placements.slice(index + 1)) expect(overlaps(rect, rectOf(other, 1100, 470))).toBe(false);
    }
  });

  it("keeps every position when a count changes without changing its tier", () => {
    const before = layoutNameCloud(input(names), null);
    const bumped = names.map((name) => (name.recipientId === id(4) ? { ...name, count: name.count + 1 } : name));
    expect(nameTiers(bumped, 4).get(id(4))).toBe(nameTiers(names, 4).get(id(4)));
    const after = layoutNameCloud(input(bumped), before);
    for (const placement of before.placements) expect(position(byId(after.placements).get(placement.recipientId))).toEqual(position(placement));
  });

  it("keeps the placed names where they were when a new name joins", () => {
    const before = layoutNameCloud(input(names), null);
    const after = layoutNameCloud(input([...names, person(99, 1)]), before);
    expect(after.placements).toHaveLength(31);
    for (const placement of before.placements) expect(position(byId(after.placements).get(placement.recipientId))).toEqual(position(placement));
  });

  it("shows only the top `max` names and gives each its tier", () => {
    const layout = layoutNameCloud(input(names, { max: 10 }), null);
    expect(layout.placements).toHaveLength(10);
    expect(layout.placements.every((placement) => placement.tier >= 1 && placement.tier <= 4)).toBe(true);
    expect(byId(layout.placements).get(id(5))?.tier).toBe(4);
  });

  it("leaves out a name that has no free spot rather than covering a name or a control", () => {
    const obstacles: CloudRect[] = [{ x: 0, y: 0, width: 260, height: 30 }];
    const layout = layoutNameCloud(input(names, { width: 260, height: 90, obstacles }), null);
    expect(layout.placements.length).toBeGreaterThan(0);
    expect(layout.placements.length).toBeLessThan(names.length);
    for (const [index, placement] of layout.placements.entries()) {
      const rect = rectOf(placement, 260, 90);
      expect(overlaps(rect, obstacles[0])).toBe(false);
      for (const other of layout.placements.slice(index + 1)) expect(overlaps(rect, rectOf(other, 260, 90))).toBe(false);
    }
  });

  it("lays out from scratch when the board size changes", () => {
    const before = layoutNameCloud(input(names), null);
    const resized = layoutNameCloud(input(names, { width: 343, height: 300 }), before);
    expect(resized).toEqual(layoutNameCloud(input(names, { width: 343, height: 300 }), null));
  });
});
