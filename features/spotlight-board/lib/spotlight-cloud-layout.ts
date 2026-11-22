import type { SpotlightName } from "../schemas/spotlight-views";
import { SIZE_TIERS } from "./spotlight-ui-config";

/**
 * ALG-001 name cloud layout, pure. Tiers per BR-002; each name tries positions from a pseudo-random
 * sequence seeded by its recipient id (so a person always lands in the same spot for the same
 * board) and takes the first one that overlaps no placed name and no obstacle (search, counter,
 * ticker, buttons); a name with no free spot is left out. Passing the previous layout keeps every
 * name whose tier and text did not change exactly where it was, so live updates never shuffle it.
 */
export type CloudRect = { x: number; y: number; width: number; height: number };

export type CloudLayoutInput = {
  names: SpotlightName[];
  /** Names shown: the top `max` by count, then recipient id. */
  max: number;
  /** Board size in px. */
  width: number;
  height: number;
  /** Font size (px) per tier, index 0 = tier 1. */
  fontSizes: readonly number[];
  /** Areas names must not cover, in board px. */
  obstacles: CloudRect[];
};

/** `x`/`y` = centre as a fraction of the board; `width`/`height` = estimated text box in px. */
export type CloudPlacement = SpotlightName & { tier: number; fontSize: number; x: number; y: number; width: number; height: number };
export type CloudLayout = { key: string; placements: CloudPlacement[] };

/** Bold Montserrat averages ~0.62 em per character; boxes are estimates, padded by `GAP`. */
const CHAR_WIDTH_EM = 0.62;
const LINE_HEIGHT_EM = 1.3;
const GAP = 3;
const EDGE = 4;
const MAX_TRIES = 120;

const byId = (a: SpotlightName, b: SpotlightName) => (a.recipientId < b.recipientId ? -1 : a.recipientId > b.recipientId ? 1 : 0);
const byCountThenId = (a: SpotlightName, b: SpotlightName) => b.count - a.count || byId(a, b);

export function topNames(names: SpotlightName[], max: number): SpotlightName[] {
  return [...names].sort(byCountThenId).slice(0, Math.max(0, max));
}

/**
 * BR-002 `tier = SIZE_TIERS − floor(rank × SIZE_TIERS / n)`, ranked over the distinct counts of the
 * names shown: the most Kudos → the largest tier, equal counts → one tier, and a long tail of
 * 1-Kudo names stays small (plain positional ranks would lift the whole tail to the top tier).
 */
export function nameTiers(names: SpotlightName[], tiers: number = SIZE_TIERS): Map<string, number> {
  const distinct = [...new Set(names.map((name) => name.count))].sort((a, b) => b - a);
  const rankOf = new Map(distinct.map((count, rank) => [count, rank]));
  return new Map(names.map((name) => [name.recipientId, tiers - Math.floor((rankOf.get(name.count)! * tiers) / distinct.length)]));
}

/** FNV-1a 32-bit hash: the per-person seed. */
function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: small deterministic PRNG in [0, 1). */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const overlaps = (a: CloudRect, b: CloudRect) =>
  a.x < b.x + b.width + GAP && b.x < a.x + a.width + GAP && a.y < b.y + b.height + GAP && b.y < a.y + a.height + GAP;

function textBox(name: string, fontSize: number) {
  return { width: Math.ceil(name.length * fontSize * CHAR_WIDTH_EM), height: Math.ceil(fontSize * LINE_HEIGHT_EM) };
}

/** First free spot in the person's sequence; null when the board has no room left for this box. */
function findSpot(recipientId: string, box: { width: number; height: number }, blocked: CloudRect[], input: CloudLayoutInput): CloudRect | null {
  const random = seededRandom(hashSeed(recipientId));
  const spanX = Math.max(0, input.width - box.width - 2 * EDGE);
  const spanY = Math.max(0, input.height - box.height - 2 * EDGE);
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const rect = { x: EDGE + random() * spanX, y: EDGE + random() * spanY, ...box };
    if (!blocked.some((other) => overlaps(rect, other))) return rect;
  }
  return null;
}

const rectOf = (placement: CloudPlacement, input: CloudLayoutInput): CloudRect => ({
  x: placement.x * input.width - placement.width / 2,
  y: placement.y * input.height - placement.height / 2,
  width: placement.width,
  height: placement.height,
});

export function layoutNameCloud(input: CloudLayoutInput, previous: CloudLayout | null): CloudLayout {
  const key = `${Math.round(input.width)}x${Math.round(input.height)}:${input.fontSizes.join("/")}`;
  const shown = topNames(input.names, input.max);
  const tiers = nameTiers(shown);
  const kept = new Map(previous?.key === key ? previous.placements.map((placement) => [placement.recipientId, placement]) : []);

  const placements: CloudPlacement[] = [];
  const blocked: CloudRect[] = [...input.obstacles];
  const pending: SpotlightName[] = [];
  for (const name of shown) {
    const before = kept.get(name.recipientId);
    if (before && before.tier === tiers.get(name.recipientId) && before.name === name.name) {
      const placement = { ...before, count: name.count };
      placements.push(placement);
      blocked.push(rectOf(placement, input));
    } else {
      pending.push(name);
    }
  }

  // Larger names first, so they get the free space; id order keeps it deterministic.
  pending.sort((a, b) => tiers.get(b.recipientId)! - tiers.get(a.recipientId)! || byId(a, b));
  for (const name of pending) {
    const tier = tiers.get(name.recipientId)!;
    const fontSize = input.fontSizes[tier - 1] ?? input.fontSizes[input.fontSizes.length - 1];
    const rect = findSpot(name.recipientId, textBox(name.name, fontSize), blocked, input);
    if (!rect) continue; // A crowded (phone) board shows fewer names instead of stacking them.
    blocked.push(rect);
    placements.push({
      ...name,
      tier,
      fontSize,
      x: (rect.x + rect.width / 2) / input.width,
      y: (rect.y + rect.height / 2) / input.height,
      width: rect.width,
      height: rect.height,
    });
  }
  return { key, placements };
}
