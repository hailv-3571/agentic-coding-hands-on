import { RECONNECT_MAX_ATTEMPTS } from "./spotlight-ui-config";

/** SM-001 connection state of the region. */
export type SpotlightChannelStatus = "connecting" | "live" | "reconnecting" | "failed";

export type SpotlightChannelState = { status: SpotlightChannelStatus; failures: number };

/** What moves the state: the channel's subscribe callback, or the browser going offline / online. */
export type SpotlightChannelSignal = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED" | "offline" | "online";

/** A fresh channel: the first mount and every `retry()`. */
export const INITIAL_CHANNEL_STATE: SpotlightChannelState = { status: "connecting", failures: 0 };

/**
 * Pure SM-001 transition. A join → `live` and the failure count resets; CHANNEL_ERROR, TIMED_OUT
 * and CLOSED each count (Supabase rejoins by itself meanwhile) and the RECONNECT_MAX_ATTEMPTS-th in
 * a row → `failed`, where the hook removes the channel until `retry()`. Offline → `reconnecting`;
 * online resets the count while the hook joins a fresh channel (the label stays until it joins).
 */
export function nextChannelState(state: SpotlightChannelState, signal: SpotlightChannelSignal): SpotlightChannelState {
  switch (signal) {
    case "SUBSCRIBED":
      return { status: "live", failures: 0 };
    case "offline":
      return { ...state, status: "reconnecting" };
    case "online":
      return { ...state, failures: 0 };
    default: {
      const failures = state.failures + 1;
      return { status: failures >= RECONNECT_MAX_ATTEMPTS ? "failed" : "reconnecting", failures };
    }
  }
}
