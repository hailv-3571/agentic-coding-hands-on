"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { browserSupabase } from "@/shared/auth/supabase-browser-client";
import { isNotificationSignal } from "../lib/fetch-notifications";
import { NOTIFICATION_SIGNAL_EVENT, notificationTopicFor } from "../notification-config";
import type { NotificationSignal } from "../schemas/notification-views";

type ChannelHandlers = {
  /** A new or updated (aggregated heart) notification for this user; payload ids only. */
  onSignal(signal: NotificationSignal): void;
  /** Signals may have been missed (every join and rejoin, tab visible again, back online). */
  onResync(): void;
};

/**
 * Private Broadcast channel `notifications:{userId}`, event `notification` (phase 13 INT). Same
 * join recipe as phase 11's Spotlight hook: `realtime.setAuth` with the session token before
 * joining and again on every token refresh; the topic policy only lets the user read their own
 * topic. Supabase rejoins by itself after a drop; each SUBSCRIBED (first join included) asks for a
 * resync because Broadcast never replays. Offline closes the channel, online joins a fresh one.
 */
export function useNotificationChannel(userId: string, handlers: ChannelHandlers): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const supabase = browserSupabase();
    let disposed = false;
    let channel: RealtimeChannel | null = null;

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
        console.error("[notifications] realtime auth failed", error);
      }
      if (disposed || channel) return;
      const current = supabase.channel(notificationTopicFor(userId), { config: { private: true } });
      channel = current;
      current
        .on("broadcast", { event: NOTIFICATION_SIGNAL_EVENT }, ({ payload }) => {
          if (isNotificationSignal(payload)) handlersRef.current.onSignal(payload);
        })
        .subscribe((state) => {
          if (disposed || channel !== current) return;
          if (state === "SUBSCRIBED") handlersRef.current.onResync();
        });
    };

    const auth = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) void supabase.realtime.setAuth(session.access_token);
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") handlersRef.current.onResync();
    };
    const onOffline = () => close();
    const onOnline = () => {
      close();
      void open();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    void open();

    return () => {
      disposed = true;
      close();
      auth.data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [userId]);
}
