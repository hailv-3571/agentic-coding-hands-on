import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSpotlightResync } from "@/features/spotlight-board/lib/spotlight-resync-scheduler";
import { initSpotlightState, spotlightReducer, type SpotlightState } from "@/features/spotlight-board/lib/spotlight-state-reducer";
import type { SpotlightEvent, SpotlightSnapshot } from "@/features/spotlight-board/schemas/spotlight-views";

/**
 * When the board refetches its snapshot (review M1/M2): a `removed`/`restored` event triggers one
 * refetch 2–3 s after the last event of a burst, so the snapshot has the final word on counts that
 * an event/snapshot race could have shifted; the refetch after a (re)join waits a random 0–2 s so a
 * Realtime blip does not make every board refetch at once; tab-visible refetches right away.
 */
const ana = "00000000-0000-4000-8000-00000000000a";
const binh = "00000000-0000-4000-8000-00000000000b";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function scheduler(random = 0) {
  const run = vi.fn();
  return { run, resync: createSpotlightResync(run, () => random) };
}

describe("refetch after a moderation event", () => {
  it.each(["removed", "restored"] as const)("refetches once, 2 s plus jitter after a %s event", (type) => {
    const { run, resync } = scheduler(0.5);
    resync.afterEvent(type);
    vi.advanceTimersByTime(2499);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10_000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("keeps the jitter under 1 s, so the refetch lands between 2 and 3 s", () => {
    const early = scheduler(0);
    early.resync.afterEvent("removed");
    vi.advanceTimersByTime(2000);
    expect(early.run).toHaveBeenCalledTimes(1);

    const late = scheduler(0.9999);
    late.resync.afterEvent("removed");
    vi.advanceTimersByTime(2998);
    expect(late.run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(late.run).toHaveBeenCalledTimes(1);
  });

  it("coalesces a burst into one refetch after the last event", () => {
    const { run, resync } = scheduler(0);
    resync.afterEvent("removed");
    vi.advanceTimersByTime(1000);
    resync.afterEvent("restored");
    vi.advanceTimersByTime(800);
    resync.afterEvent("removed");
    vi.advanceTimersByTime(1999);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("does not refetch for an added event", () => {
    const { run, resync } = scheduler(0);
    resync.afterEvent("added");
    vi.advanceTimersByTime(10_000);
    expect(run).not.toHaveBeenCalled();
  });
});

describe("refetch after a (re)join and on tab visible", () => {
  it("waits a random 0–2 s after the channel joined", () => {
    const { run, resync } = scheduler(0.75);
    resync.afterSubscribe();
    vi.advanceTimersByTime(1499);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("refetches right away on now() and drops a pending refetch", () => {
    const { run, resync } = scheduler(0);
    resync.afterEvent("removed");
    resync.now();
    expect(run).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10_000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("drops a pending refetch on dispose", () => {
    const { run, resync } = scheduler(0);
    resync.afterSubscribe();
    resync.afterEvent("restored");
    resync.dispose();
    vi.advanceTimersByTime(10_000);
    expect(run).not.toHaveBeenCalled();
  });
});

describe("counter drift from a late moderation event (review M1)", () => {
  const line = (n: number) => ({ kudoId: `k${n}`, recipientId: binh, recipientName: "Bình", occurredAt: `2026-11-22T10:0${n}:00.000Z` });
  const before: SpotlightSnapshot = { total: 7, names: [{ recipientId: ana, name: "Ana", count: 5 }, { recipientId: binh, name: "Bình", count: 2 }], recent: [line(1), line(2)] };
  // The server already counts Ana's kudo `x9` (not in the ticker) as spam.
  const after: SpotlightSnapshot = { ...before, total: 6, names: [{ recipientId: ana, name: "Ana", count: 4 }, before.names[1]] };
  const removedX9: SpotlightEvent = { type: "removed", kudoId: "x9", recipientId: ana, recipientName: "Ana", occurredAt: "2026-11-22T11:00:00.000Z" };
  const anaCount = (state: SpotlightState) => state.names.find((name) => name.recipientId === ana)?.count;

  it("lets the refetched snapshot undo a removal counted twice", () => {
    let state = initSpotlightState(before);
    const resync = createSpotlightResync(() => {
      state = spotlightReducer(state, { type: "replace", snapshot: after });
    }, () => 0);

    // The post-join refetch already reflects the removal, then its broadcast arrives late.
    state = spotlightReducer(state, { type: "replace", snapshot: after });
    state = spotlightReducer(state, { type: "event", event: removedX9 });
    resync.afterEvent(removedX9.type);
    expect(state.total).toBe(5);
    expect(anaCount(state)).toBe(3);

    vi.advanceTimersByTime(2000);
    expect(state.total).toBe(6);
    expect(anaCount(state)).toBe(4);
  });
});
