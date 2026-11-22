import { describe, expect, it } from "vitest";
import {
  INITIAL_CHANNEL_STATE,
  nextChannelState,
  type SpotlightChannelSignal,
  type SpotlightChannelState,
} from "@/features/spotlight-board/lib/spotlight-channel-state";

/**
 * SM-001 connection state of the Spotlight region: a join → `live`; each CHANNEL_ERROR / TIMED_OUT /
 * CLOSED counts, a join resets the count, and the 5th failure in a row → `failed` (the hook then
 * removes the channel and shows "Thử lại"). `retry()` starts a fresh channel from the initial
 * state, so it takes another 5 failures to stop again. Offline → `reconnecting`; online resets the
 * count while a fresh channel joins.
 */
const run = (signals: SpotlightChannelSignal[], from: SpotlightChannelState = INITIAL_CHANNEL_STATE) =>
  signals.reduce(nextChannelState, from);
const errors = (n: number): SpotlightChannelSignal[] => Array.from({ length: n }, () => "CHANNEL_ERROR");

describe("spotlight channel state", () => {
  it("starts connecting and goes live on the first join", () => {
    expect(INITIAL_CHANNEL_STATE).toEqual({ status: "connecting", failures: 0 });
    expect(run(["SUBSCRIBED"])).toEqual({ status: "live", failures: 0 });
  });

  it("shows reconnecting for failures 1 to 4 and fails on the 5th in a row", () => {
    for (let n = 1; n <= 4; n += 1) expect(run(errors(n))).toEqual({ status: "reconnecting", failures: n });
    expect(run(errors(5))).toEqual({ status: "failed", failures: 5 });
  });

  it("counts timeouts and closes like errors", () => {
    expect(run(["CHANNEL_ERROR", "TIMED_OUT", "CLOSED", "TIMED_OUT", "CLOSED"]).status).toBe("failed");
  });

  it("resets the count on a successful join, so only consecutive failures stop the channel", () => {
    const state = run([...errors(4), "SUBSCRIBED", ...errors(4)]);
    expect(state).toEqual({ status: "reconnecting", failures: 4 });
    expect(run(["SUBSCRIBED"], state)).toEqual({ status: "live", failures: 0 });
  });

  it("retry() starts over: a fresh channel needs 5 more failures to fail again", () => {
    expect(run(errors(5)).status).toBe("failed");
    const retried = INITIAL_CHANNEL_STATE;
    expect(run(errors(4), retried).status).toBe("reconnecting");
    expect(run(errors(5), retried).status).toBe("failed");
    expect(run(["SUBSCRIBED"], retried).status).toBe("live");
  });

  it("offline shows reconnecting; online resets the count until the fresh channel joins", () => {
    const offline = run(["SUBSCRIBED", "offline"]);
    expect(offline).toEqual({ status: "reconnecting", failures: 0 });
    const online = run(["online"], run(errors(3), offline));
    expect(online).toEqual({ status: "reconnecting", failures: 0 });
    expect(run(errors(4), online).status).toBe("reconnecting");
    expect(run(["SUBSCRIBED"], online).status).toBe("live");
  });
});
