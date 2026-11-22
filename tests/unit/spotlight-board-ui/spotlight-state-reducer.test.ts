import { describe, expect, it } from "vitest";
import { initSpotlightState, spotlightReducer, type SpotlightState } from "@/features/spotlight-board/lib/spotlight-state-reducer";
import type { SpotlightEvent, SpotlightSnapshot } from "@/features/spotlight-board/schemas/spotlight-views";

/**
 * DEC-001 client state: `added` (unseen kudoId) → +1 and a ticker line; `removed` → −1, the line
 * leaves, the name goes at 0, never below 0, also for a kudo first known from the snapshot;
 * `restored` → +1 without a line. Replays of the same kudoId never count twice; a REPLACE (refetch
 * after (re)subscribe) is the new truth.
 */
const ana = "00000000-0000-4000-8000-00000000000a";
const binh = "00000000-0000-4000-8000-00000000000b";
const chi = "00000000-0000-4000-8000-00000000000c";

const line = (n: number, recipientId = ana, recipientName = "Ana") => ({
  kudoId: `k${n}`,
  recipientId,
  recipientName,
  occurredAt: `2026-11-22T10:0${n}:00.000Z`,
});

const snapshot: SpotlightSnapshot = {
  total: 7,
  names: [
    { recipientId: ana, name: "Ana", count: 5 },
    { recipientId: binh, name: "Bình", count: 2 },
  ],
  recent: [line(1), line(2), line(3), line(4, binh, "Bình"), line(5), line(6, binh, "Bình")],
};

const event = (type: SpotlightEvent["type"], kudoId: string, recipientId = ana, recipientName = "Ana"): SpotlightEvent => ({
  type,
  kudoId,
  recipientId,
  recipientName,
  occurredAt: "2026-11-22T11:00:00.000Z",
});

const apply = (state: SpotlightState, ...events: SpotlightEvent[]) =>
  events.reduce((current, next) => spotlightReducer(current, { type: "event", event: next }), state);
const countOf = (state: SpotlightState, id: string) => state.names.find((name) => name.recipientId === id)?.count;
const tickerIds = (state: SpotlightState) => state.ticker.map((item) => item.kudoId);

describe("spotlight state from a snapshot", () => {
  it("keeps the total and names and preloads the last 5 lines, oldest first", () => {
    const state = initSpotlightState(snapshot);
    expect(state.total).toBe(7);
    expect(state.names).toEqual(snapshot.names);
    expect(tickerIds(state)).toEqual(["k2", "k3", "k4", "k5", "k6"]);
    expect(state.spotlit).toBeNull();
  });
});

describe("spotlightReducer — added", () => {
  it("adds 1 to the total and the recipient, appends a line at the bottom and spotlights the name", () => {
    const state = apply(initSpotlightState(snapshot), event("added", "n1", binh, "Bình"));
    expect(state.total).toBe(8);
    expect(countOf(state, binh)).toBe(3);
    expect(tickerIds(state)).toEqual(["k3", "k4", "k5", "k6", "n1"]);
    expect(state.spotlit).toEqual({ recipientId: binh, kudoId: "n1" });
  });

  it("adds a recipient that was not in the cloud yet with a count of 1", () => {
    const state = apply(initSpotlightState(snapshot), event("added", "n1", chi, "Chi"));
    expect(state.names).toContainEqual({ recipientId: chi, name: "Chi", count: 1 });
  });

  it("counts the same kudoId once, including a kudo the snapshot already listed", () => {
    const initial = initSpotlightState(snapshot);
    const once = apply(initial, event("added", "n1"));
    expect(apply(once, event("added", "n1"))).toBe(once);
    expect(apply(initial, event("added", "k6"))).toBe(initial);
  });
});

describe("spotlightReducer — removed (public → spam)", () => {
  it("subtracts 1 for a kudo first known from the snapshot and drops its line", () => {
    const state = apply(initSpotlightState(snapshot), event("removed", "k5"));
    expect(state.total).toBe(6);
    expect(countOf(state, ana)).toBe(4);
    expect(tickerIds(state)).toEqual(["k2", "k3", "k4", "k6"]);
  });

  it("subtracts 1 even when the kudo was never seen by this client", () => {
    const state = apply(initSpotlightState(snapshot), event("removed", "old-1", binh, "Bình"));
    expect(state.total).toBe(6);
    expect(countOf(state, binh)).toBe(1);
  });

  it("removes the name when its count reaches 0", () => {
    const state = apply(initSpotlightState(snapshot), event("removed", "x1", binh), event("removed", "x2", binh));
    expect(countOf(state, binh)).toBeUndefined();
  });

  it("never goes below 0", () => {
    const empty = initSpotlightState({ total: 0, names: [], recent: [] });
    const state = apply(empty, event("removed", "x1"));
    expect(state.total).toBe(0);
    expect(state.names).toEqual([]);
  });

  it("applies a repeated removal once and ends the spotlight of that kudo", () => {
    const spotlit = apply(initSpotlightState(snapshot), event("added", "n1"));
    const removed = apply(spotlit, event("removed", "n1"));
    expect(apply(removed, event("removed", "n1"))).toBe(removed);
    expect(removed.total).toBe(7);
    expect(removed.spotlit).toBeNull();
  });
});

describe("spotlightReducer — restored (spam → public)", () => {
  it("Mark Spam then Un Spam returns the counts and adds no ticker line", () => {
    const initial = initSpotlightState(snapshot);
    const state = apply(initial, event("removed", "k6", binh, "Bình"), event("restored", "k6", binh, "Bình"));
    expect(state.total).toBe(initial.total);
    expect(countOf(state, binh)).toBe(2);
    expect(tickerIds(state)).toEqual(["k2", "k3", "k4", "k5"]);
    expect(state.spotlit).toBeNull();
  });

  it("brings back a name that had dropped to 0 and ignores a repeated restore", () => {
    const zero = apply(initSpotlightState(snapshot), event("removed", "x1", binh), event("removed", "x2", binh));
    const restored = apply(zero, event("restored", "x2", binh, "Bình"));
    expect(countOf(restored, binh)).toBe(1);
    expect(apply(restored, event("restored", "x2", binh, "Bình"))).toBe(restored);
  });
});

describe("spotlightReducer — replace and unspotlight", () => {
  it("replaces the whole state with a refetched snapshot (no double count after reconnect)", () => {
    const live = apply(initSpotlightState(snapshot), event("added", "n1"));
    const refetched: SpotlightSnapshot = { ...snapshot, total: 8, recent: [...snapshot.recent, line(7)] };
    const state = spotlightReducer(live, { type: "replace", snapshot: refetched });
    expect(state.total).toBe(8);
    expect(apply(state, event("added", "k7")).total).toBe(8);
  });

  it("keeps a kudo restored on this board out of the ticker after a refetch (restored is not news)", () => {
    const restored = apply(initSpotlightState(snapshot), event("removed", "k6", binh, "Bình"), event("restored", "k6", binh, "Bình"));
    const state = spotlightReducer(restored, { type: "replace", snapshot });
    expect(state.total).toBe(7);
    expect(countOf(state, binh)).toBe(2);
    expect(tickerIds(state)).toEqual(["k2", "k3", "k4", "k5"]);
    expect(tickerIds(spotlightReducer(state, { type: "replace", snapshot }))).toEqual(["k2", "k3", "k4", "k5"]);
  });

  it("clears the spotlight only for the kudo it belongs to", () => {
    const state = apply(initSpotlightState(snapshot), event("added", "n1"), event("added", "n2", binh, "Bình"));
    expect(spotlightReducer(state, { type: "unspotlight", kudoId: "n1" })).toBe(state);
    expect(spotlightReducer(state, { type: "unspotlight", kudoId: "n2" }).spotlit).toBeNull();
  });
});
