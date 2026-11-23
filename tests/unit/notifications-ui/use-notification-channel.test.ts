// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationChannel } from "@/features/notifications/hooks/use-notification-channel";

type FakeChannel = {
  topic: string;
  options: unknown;
  broadcast(payload: unknown): void;
  status(state: string): void;
};

/** The browser Supabase client is the Realtime network boundary; this fake records what the hook does with it. */
const supabase = vi.hoisted(() => {
  const state = {
    channels: [] as FakeChannel[],
    authListener: null as null | ((event: string, session: { access_token: string } | null) => void),
    unsubscribeAuth: vi.fn(),
    getSession: vi.fn(),
    setAuth: vi.fn(async (token: string | null) => void token),
    removeChannel: vi.fn(async (channel: unknown) => void channel),
  };
  const client = {
    auth: {
      getSession: state.getSession,
      onAuthStateChange: (listener: typeof state.authListener) => {
        state.authListener = listener;
        return { data: { subscription: { unsubscribe: state.unsubscribeAuth } } };
      },
    },
    realtime: { setAuth: state.setAuth },
    removeChannel: state.removeChannel,
    channel: vi.fn((topic: string, options: unknown) => {
      const handlers: { event?: string; onBroadcast?(message: { payload: unknown }): void; onStatus?(s: string): void } = {};
      const channel = {
        on(type: string, filter: { event: string }, callback: (message: { payload: unknown }) => void) {
          if (type === "broadcast") Object.assign(handlers, { event: filter.event, onBroadcast: callback });
          return channel;
        },
        subscribe(callback: (s: string) => void) {
          handlers.onStatus = callback;
          return channel;
        },
      };
      state.channels.push({
        topic,
        options,
        broadcast: (payload) => handlers.event === "notification" && handlers.onBroadcast?.({ payload }),
        status: (s) => handlers.onStatus?.(s),
      });
      return channel;
    }),
  };
  return { state, client };
});
vi.mock("@/shared/auth/supabase-browser-client", () => ({ browserSupabase: () => supabase.client }));

const { state } = supabase;
const signal = { notificationId: "n1", type: "kudo_received", occurredAt: "2026-11-23T10:00:00.000Z" };
const handlers = () => ({ onSignal: vi.fn(), onResync: vi.fn() });

async function joined(count = 1) {
  await waitFor(() => expect(state.channels).toHaveLength(count));
  return state.channels[count - 1];
}

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => value });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  state.channels = [];
  state.getSession.mockResolvedValue({ data: { session: { access_token: "token-1" } } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useNotificationChannel", () => {
  it("joins the user's private topic with the session token, resyncs on every SUBSCRIBED, forwards valid signals only", async () => {
    const h = handlers();
    renderHook(() => useNotificationChannel("user-1", h));
    const channel = await joined();
    expect(channel).toMatchObject({ topic: "notifications:user-1", options: { config: { private: true } } });
    expect(state.setAuth).toHaveBeenCalledWith("token-1");
    expect(state.setAuth.mock.invocationCallOrder[0]).toBeLessThan(supabase.client.channel.mock.invocationCallOrder[0]);

    act(() => channel.status("SUBSCRIBED"));
    act(() => channel.status("SUBSCRIBED")); // Supabase rejoined by itself after a drop
    expect(h.onResync).toHaveBeenCalledTimes(2);

    act(() => channel.broadcast({ notificationId: 42 }));
    act(() => channel.broadcast(signal));
    expect(h.onSignal.mock.calls).toEqual([[signal]]);
  });

  it("calls the latest render's handlers without rejoining", async () => {
    const first = handlers();
    const latest = handlers();
    const { rerender } = renderHook((h) => useNotificationChannel("user-1", h), { initialProps: first });
    const channel = await joined();
    rerender(latest);
    act(() => channel.broadcast(signal));
    expect(latest.onSignal).toHaveBeenCalledWith(signal);
    expect(first.onSignal).not.toHaveBeenCalled();
    expect(supabase.client.channel).toHaveBeenCalledTimes(1);
  });

  it("leaves the channel when offline and joins a fresh one when online, ignoring the old channel's late status", async () => {
    const h = handlers();
    renderHook(() => useNotificationChannel("user-1", h));
    const stale = await joined();

    act(() => void window.dispatchEvent(new Event("offline")));
    expect(state.removeChannel).toHaveBeenCalledTimes(1);
    act(() => void window.dispatchEvent(new Event("online")));
    const fresh = await joined(2);

    act(() => stale.status("SUBSCRIBED"));
    expect(h.onResync).not.toHaveBeenCalled();
    act(() => fresh.status("SUBSCRIBED"));
    expect(h.onResync).toHaveBeenCalledTimes(1);
  });

  it("resyncs when the tab becomes visible and re-authorises realtime on a token refresh", async () => {
    const h = handlers();
    renderHook(() => useNotificationChannel("user-1", h));
    await joined();

    act(() => setVisibility("hidden"));
    expect(h.onResync).not.toHaveBeenCalled();
    act(() => setVisibility("visible"));
    expect(h.onResync).toHaveBeenCalledTimes(1);

    act(() => state.authListener?.("SIGNED_IN", { access_token: "ignored" }));
    act(() => state.authListener?.("TOKEN_REFRESHED", { access_token: "token-2" }));
    expect(state.setAuth.mock.calls).toEqual([["token-1"], ["token-2"]]);
  });

  it("tears everything down on unmount, and never joins when unmounted before the session resolved", async () => {
    const h = handlers();
    const { unmount } = renderHook(() => useNotificationChannel("user-1", h));
    await joined();
    unmount();
    expect(state.removeChannel).toHaveBeenCalledTimes(1);
    expect(state.unsubscribeAuth).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event("online"));
    setVisibility("visible");
    expect(h.onResync).not.toHaveBeenCalled();

    let resolveSession!: (value: unknown) => void;
    state.getSession.mockReturnValue(new Promise((resolve) => (resolveSession = resolve)));
    renderHook(() => useNotificationChannel("user-2", handlers())).unmount();
    await act(async () => resolveSession({ data: { session: { access_token: "token-3" } } }));
    expect(state.channels).toHaveLength(1);
    expect(state.setAuth).not.toHaveBeenCalledWith("token-3");
  });
});
