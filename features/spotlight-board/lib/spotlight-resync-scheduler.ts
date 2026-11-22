import type { SpotlightEvent } from "../schemas/spotlight-views";
import { MODERATION_RESYNC_DELAY_MS, MODERATION_RESYNC_JITTER_MS, SUBSCRIBE_RESYNC_JITTER_MS } from "./spotlight-ui-config";

/** When the board refetches its snapshot and REPLACEs its state. One refetch is pending at most. */
export type SpotlightResync = {
  /** After every (re)join: a random 0–2 s spread, so a Realtime blip does not refetch every board at once. */
  afterSubscribe(): void;
  /**
   * After a `removed`/`restored` event: 2–3 s after the last one of a burst. An event racing a
   * refetch can shift the counts (counted twice, or lost); the later snapshot settles them.
   * `added` needs none: a replayed `added` is deduped by kudo id.
   */
  afterEvent(type: SpotlightEvent["type"]): void;
  /** Tab visible again: refetch now and drop the pending one. */
  now(): void;
  /** Channel closed or board unmounted: drop the pending refetch. */
  dispose(): void;
};

/**
 * A new request replaces the pending one (trailing debounce), so a burst of moderation events, or
 * an event during the post-join wait, ends in a single refetch that starts after all of them.
 */
export function createSpotlightResync(run: () => void, random: () => number = Math.random): SpotlightResync {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const later = (delayMs: number, jitterMs: number) => {
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      run();
    }, delayMs + Math.floor(random() * jitterMs));
  };

  return {
    afterSubscribe: () => later(0, SUBSCRIBE_RESYNC_JITTER_MS),
    afterEvent: (type) => {
      if (type !== "added") later(MODERATION_RESYNC_DELAY_MS, MODERATION_RESYNC_JITTER_MS);
    },
    now: () => {
      cancel();
      run();
    },
    dispose: cancel,
  };
}
