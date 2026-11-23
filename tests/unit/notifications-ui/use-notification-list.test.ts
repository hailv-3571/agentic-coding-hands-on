// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationList } from "@/features/notifications/hooks/use-notification-list";
import type { NotificationPage, NotificationView } from "@/features/notifications/schemas/notification-views";

// The read-state server actions are POST round trips to the server: the network boundary.
const actions = vi.hoisted(() => ({ markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn() }));
vi.mock("@/features/notifications/server/notification-actions", () => actions);

const view = (id: string, read = false): NotificationView => ({
  id,
  type: "kudo_received",
  occurredAt: "2026-11-23T10:00:00.000Z",
  read,
  href: `/kudos/${id}`,
  params: { actorName: "An" },
});
const page = (items: NotificationView[], nextCursor: string | null = null): NotificationPage => ({ items, nextCursor });

type Pending = { url: string; signal: AbortSignal; resolve(page: NotificationPage): void; fail(status: number): void };
let requests: Pending[];

/** GET /api/notifications answered by the test, one request at a time; aborting rejects like fetch. */
const fetchMock = vi.fn(
  (url: string, init: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      const signal = init.signal as AbortSignal;
      signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      requests.push({
        url,
        signal,
        resolve: (body) => resolve({ ok: true, status: 200, json: async () => body } as Response),
        fail: (status) => resolve({ ok: false, status } as Response),
      });
    }),
);

const ids = (items: NotificationView[]) => items.map((item) => `${item.id}${item.read ? ":read" : ""}`);

async function mountWith(first: NotificationPage, pageSize = 10) {
  const hook = renderHook(() => useNotificationList(pageSize));
  await act(async () => requests[0].resolve(first));
  return hook;
}

beforeEach(() => {
  requests = [];
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("useNotificationList", () => {
  it("loads the first page on mount, then appends the next cursor's page once even when asked twice", async () => {
    const { result } = renderHook(() => useNotificationList(10));
    expect(result.current.status).toBe("loading");
    await act(async () => requests[0].resolve(page([view("a"), view("b")], "c1")));
    expect(requests[0].url).toBe("/api/notifications?limit=10");
    expect(result.current).toMatchObject({ status: "ready", hasMore: true });

    act(() => {
      void result.current.loadMore();
      void result.current.loadMore();
    });
    expect(requests.map((request) => request.url)).toEqual([requests[0].url, "/api/notifications?limit=10&cursor=c1"]);
    expect(result.current.moreStatus).toBe("loading");
    await act(async () => requests[1].resolve(page([view("b"), view("c")])));
    expect(ids(result.current.items)).toEqual(["a", "b", "c"]);
    expect(result.current).toMatchObject({ hasMore: false, moreStatus: "idle" });
  });

  it("drops a first-page response that arrives after a newer refresh's response", async () => {
    const { result } = await mountWith(page([view("a")]));
    act(() => {
      void result.current.refresh();
      void result.current.refresh();
    });
    await act(async () => requests[2].resolve(page([view("newer"), view("a")])));
    await act(async () => requests[1].resolve(page([view("older"), view("a")])));
    expect(ids(result.current.items)).toEqual(["newer", "a"]);
  });

  it("shows the error state when the first load fails, and recovers through reload", async () => {
    const { result } = renderHook(() => useNotificationList(10));
    await act(async () => requests[0].fail(500));
    expect(result.current.status).toBe("error");

    act(() => void result.current.reload());
    expect(result.current.status).toBe("loading");
    await act(async () => requests[1].resolve(page([view("a")])));
    expect(result.current.status).toBe("ready");

    act(() => void result.current.refresh());
    await act(async () => requests[2].fail(503));
    expect(result.current.status).toBe("ready");
    expect(ids(result.current.items)).toEqual(["a"]);
  });

  it("marks a row read optimistically and makes it unread again when the server refuses", async () => {
    const { result } = await mountWith(page([view("a")]));
    let refuse!: (value: unknown) => void;
    actions.markNotificationRead.mockReturnValue(new Promise((resolve) => (refuse = resolve)));

    let settled!: Promise<boolean>;
    act(() => void (settled = result.current.markRead(result.current.items[0])));
    expect(actions.markNotificationRead).toHaveBeenCalledWith("a");
    expect(ids(result.current.items)).toEqual(["a:read"]);
    await act(async () => refuse({ ok: false, code: "unexpected" }));
    expect(ids(result.current.items)).toEqual(["a"]);
    await expect(settled).resolves.toBe(false);
  });

  it("keeps a row read over a refetched page that still reports it unread", async () => {
    const { result } = await mountWith(page([view("a"), view("b")]));
    actions.markNotificationRead.mockResolvedValue({ ok: true, unread: 1 });
    await act(async () => void (await result.current.markRead(result.current.items[0])));

    act(() => void result.current.refresh());
    await act(async () => requests[1].resolve(page([view("a"), view("b")])));
    expect(ids(result.current.items)).toEqual(["a:read", "b"]);
  });

  it("marks every loaded row read and, when that throws, reverts only the rows it changed", async () => {
    const { result } = await mountWith(page([view("a"), view("b", true)]));
    let fail!: (error: Error) => void;
    actions.markAllNotificationsRead.mockReturnValue(new Promise((_, reject) => (fail = reject)));

    let settled!: Promise<boolean>;
    act(() => void (settled = result.current.markAllRead()));
    expect(ids(result.current.items)).toEqual(["a:read", "b:read"]);
    await act(async () => fail(new Error("offline")));
    expect(ids(result.current.items)).toEqual(["a", "b:read"]);
    await expect(settled).resolves.toBe(false);
  });

  it("aborts its in-flight request on unmount without reporting a failure", async () => {
    const { unmount } = renderHook(() => useNotificationList(10));
    unmount();
    expect(requests[0].signal.aborted).toBe(true);
    await new Promise((settle) => setTimeout(settle, 0)); // let the rejection reach the hook
    expect(console.error).not.toHaveBeenCalled();
  });
});
