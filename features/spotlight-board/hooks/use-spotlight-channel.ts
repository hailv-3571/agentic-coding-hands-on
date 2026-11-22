"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { parseSpotlightEvent } from "../lib/fetch-spotlight-snapshot";
import { spotlightBrowserSupabase } from "../lib/spotlight-browser-supabase";
import {
  INITIAL_CHANNEL_STATE,
  nextChannelState,
  type SpotlightChannelSignal,
  type SpotlightChannelStatus,
} from "../lib/spotlight-channel-state";
import { createSpotlightResync } from "../lib/spotlight-resync-scheduler";
import type { SpotlightEvent } from "../schemas/spotlight-views";
import { SPOTLIGHT_EVENT, SPOTLIGHT_TOPIC } from "../spotlight-config";

type ChannelHandlers = {
  onEvent(event: SpotlightEvent): void;
  /** Refetch the snapshot and REPLACE the state; the hook decides when (see `createSpotlightResync`). */
  onResync(): void;
};

/**
 * Private Broadcast channel `spotlight`, event `kudo` (INT-001, D007). `realtime.setAuth` with the
 * session token before joining and again on every token refresh. Supabase rejoins by itself after a
 * drop; the SM-001 state (`nextChannelState`) counts failures, and the 5th in a row removes the
 * channel (`failed`) until `retry()`. Going offline pauses; coming back online joins a fresh
 * channel. Missed events are never replayed: the snapshot refetch after each join (jittered), 2–3 s
 * after a moderation event and on tab visible is what heals the state.
 */
export function useSpotlightChannel(handlers: ChannelHandlers): { status: SpotlightChannelStatus; retry(): void } {
  const [status, setStatus] = useState<SpotlightChannelStatus>(INITIAL_CHANNEL_STATE.status);
  const [generation, setGeneration] = useState(0);
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const supabase = spotlightBrowserSupabase();
    const resync = createSpotlightResync(() => handlersRef.current.onResync());
    let disposed = false;
    let channel: RealtimeChannel | null = null;
    let machine = INITIAL_CHANNEL_STATE;

    const step = (signal: SpotlightChannelSignal) => {
      machine = nextChannelState(machine, signal);
      setStatus(machine.status);
    };

    const close = () => {
      const current = channel;
      channel = null;
      if (current) void supabase.removeChannel(current);
    };

    const open = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (disposed) return;
        await supabase.realtime.setAuth(data.session?.access_token ?? null);
      } catch (error) {
        console.error("[spotlight] realtime auth failed", error);
      }
      if (disposed || channel) return;
      const current = supabase.channel(SPOTLIGHT_TOPIC, { config: { private: true } });
      channel = current;
      current
        .on("broadcast", { event: SPOTLIGHT_EVENT }, ({ payload }) => {
          const event = parseSpotlightEvent(payload);
          if (!event) return;
          handlersRef.current.onEvent(event);
          resync.afterEvent(event.type);
        })
        .subscribe((state) => {
          if (disposed || channel !== current) return;
          step(state);
          if (state === "SUBSCRIBED") resync.afterSubscribe();
          else if (machine.status === "failed") close();
        });
    };

    const auth = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) void supabase.realtime.setAuth(session.access_token);
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") resync.now();
    };
    const onOffline = () => {
      close();
      step("offline");
    };
    const onOnline = () => {
      close();
      step("online");
      void open();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    void open();

    return () => {
      disposed = true;
      resync.dispose();
      close();
      auth.data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [generation]);

  const retry = useCallback(() => {
    setStatus(INITIAL_CHANNEL_STATE.status);
    setGeneration((value) => value + 1);
  }, []);

  return { status, retry };
}
