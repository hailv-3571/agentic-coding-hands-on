import { describe, expect, it, vi } from "vitest";
import { createSecretBoxOpener } from "@/features/secret-box-rewards/components/secret-box-opener";
import type { OpenSecretBoxResult } from "@/features/secret-box-rewards/schemas/secret-box-views";

/**
 * SM-002 of the open-box modal (waiting|empty → opening → result → waiting|empty) and the
 * Idempotency-Key contract of POST /api/secret-boxes/open: one new key per click, the same key
 * again when the previous click's outcome is unknown (network error, 5xx, session), so a retry
 * replays the stored result instead of opening a second box.
 */
const iconResult: OpenSecretBoxResult = {
  kind: "icon",
  iconCode: "TOUCH_OF_LIGHT",
  name: "TOUCH OF LIGHT",
  setCompleted: false,
  giftName: null,
  duplicate: false,
  unopenedLeft: 2,
  replayed: false,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

type Reply = Response | Error | (() => Promise<Response>);

/** A fetch double answering the queued replies in order and recording every call. */
function fakeFetch(...replies: Reply[]) {
  const calls: { url: string; method: string; key: string | null }[] = [];
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ url, method: init?.method ?? "GET", key: headers.get("Idempotency-Key") });
    const reply = replies.shift();
    if (!reply) throw new Error(`unexpected request ${url}`);
    if (reply instanceof Error) throw reply;
    return typeof reply === "function" ? reply() : reply;
  });
  return { fetch, calls, opens: () => calls.filter((call) => call.method === "POST") };
}

function sequentialKeys() {
  let next = 0;
  return vi.fn(() => `key-${++next}`);
}

async function loadedOpener(unopened: number, ...openReplies: Reply[]) {
  const net = fakeFetch(json(200, { unopened }), ...openReplies);
  const newKey = sequentialKeys();
  const opener = createSecretBoxOpener({ fetch: net.fetch, newKey, minOpeningMs: 0 });
  await opener.load();
  return { opener, net, newKey };
}

describe("secret box opener — loading", () => {
  it("starts in loading, then waits with the unopened count from GET /api/secret-boxes/me", async () => {
    const net = fakeFetch(json(200, { unopened: 5 }));
    const opener = createSecretBoxOpener({ fetch: net.fetch, newKey: sequentialKeys(), minOpeningMs: 0 });
    expect(opener.getState().phase).toBe("loading");
    await opener.load();
    expect(net.calls[0]).toMatchObject({ url: "/api/secret-boxes/me", method: "GET" });
    expect(opener.getState()).toMatchObject({ phase: "waiting", unopened: 5, result: null, notice: null });
  });

  it("goes straight to empty when the user has no unopened box", async () => {
    const { opener } = await loadedOpener(0);
    expect(opener.getState()).toMatchObject({ phase: "empty", unopened: 0 });
  });

  it("shows the unavailable state when the count cannot be read, and a reload can recover", async () => {
    const net = fakeFetch(new TypeError("Failed to fetch"), json(500, { code: "unexpected" }), json(200, { unopened: 1 }));
    const opener = createSecretBoxOpener({ fetch: net.fetch, newKey: sequentialKeys(), minOpeningMs: 0 });
    await opener.load();
    expect(opener.getState().phase).toBe("unavailable");
    await opener.load();
    expect(opener.getState().phase).toBe("unavailable");
    await opener.load();
    expect(opener.getState()).toMatchObject({ phase: "waiting", unopened: 1 });
  });

  it("notifies subscribers on every change until they unsubscribe", async () => {
    const net = fakeFetch(json(200, { unopened: 1 }), json(200, { unopened: 1 }));
    const opener = createSecretBoxOpener({ fetch: net.fetch, newKey: sequentialKeys(), minOpeningMs: 0 });
    const listener = vi.fn();
    const unsubscribe = opener.subscribe(listener);
    await opener.load();
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    await opener.load();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("secret box opener — opening", () => {
  it("posts with a uuid key, locks the box while opening and shows the result with the new count", async () => {
    let answer!: (response: Response) => void;
    const { opener, net } = await loadedOpener(3, () => new Promise<Response>((resolve) => (answer = resolve)));
    const pending = opener.open();
    expect(opener.getState().phase).toBe("opening");
    await opener.open(); // a second click while opening is ignored
    expect(net.opens()).toHaveLength(1);
    expect(net.opens()[0]).toMatchObject({ url: "/api/secret-boxes/open", key: "key-1" });

    answer(json(200, iconResult));
    await pending;
    expect(opener.getState()).toMatchObject({ phase: "result", unopened: 2, result: iconResult, notice: null });
  });

  it("uses a new key for every click after a confirmed answer", async () => {
    const { opener, net } = await loadedOpener(3, json(200, iconResult), json(200, { ...iconResult, unopenedLeft: 1 }));
    await opener.open();
    await opener.open(); // clicking the box again from the result opens the next box
    expect(net.opens().map((call) => call.key)).toEqual(["key-1", "key-2"]);
    expect(opener.getState()).toMatchObject({ phase: "result", unopened: 1 });
  });

  it("after a network error goes back to waiting with a notice, and the retry replays the same key", async () => {
    const replayed = { ...iconResult, replayed: true };
    const { opener, net, newKey } = await loadedOpener(3, new TypeError("Failed to fetch"), json(200, replayed));
    await opener.open();
    expect(opener.getState()).toMatchObject({ phase: "waiting", unopened: 3, result: null, notice: "openFailed" });

    await opener.open();
    expect(net.opens().map((call) => call.key)).toEqual(["key-1", "key-1"]);
    expect(newKey).toHaveBeenCalledTimes(1);
    expect(opener.getState()).toMatchObject({ phase: "result", result: replayed, unopened: 2, notice: null });
  });

  it("keeps the key after a 5xx or an unreadable 200 body (the outcome is unknown)", async () => {
    const { opener, net } = await loadedOpener(
      2,
      json(500, { code: "unexpected" }),
      json(200, { kind: "nope" }),
      json(200, iconResult),
    );
    await opener.open();
    expect(opener.getState()).toMatchObject({ phase: "waiting", notice: "openFailed" });
    await opener.open();
    expect(opener.getState()).toMatchObject({ phase: "waiting", notice: "openFailed" });
    await opener.open();
    expect(net.opens().map((call) => call.key)).toEqual(["key-1", "key-1", "key-1"]);
    expect(opener.getState().phase).toBe("result");
  });

  it("asks to sign in again on 401 and keeps the key for the retry", async () => {
    const { opener, net } = await loadedOpener(1, json(401, { code: "unauthorized" }), json(200, { ...iconResult, unopenedLeft: 0 }));
    await opener.open();
    expect(opener.getState()).toMatchObject({ phase: "waiting", notice: "sessionExpired" });
    await opener.open();
    expect(net.opens().map((call) => call.key)).toEqual(["key-1", "key-1"]);
  });

  it("switches to empty on 409 no_box_left and drops any earlier result", async () => {
    const { opener, net } = await loadedOpener(2, json(200, iconResult), json(409, { code: "no_box_left" }));
    await opener.open();
    await opener.open();
    expect(opener.getState()).toMatchObject({ phase: "empty", unopened: 0, result: null });
    await opener.open(); // nothing left: no request
    expect(net.opens()).toHaveLength(2);
  });

  it("drops a key the server rejected (400) so the next click gets a fresh one", async () => {
    const { opener, net } = await loadedOpener(1, json(400, { code: "invalid_idempotency_key" }), json(200, iconResult));
    await opener.open();
    expect(opener.getState()).toMatchObject({ phase: "waiting", notice: "openFailed" });
    await opener.open();
    expect(net.opens().map((call) => call.key)).toEqual(["key-1", "key-2"]);
  });

  it("keeps the last result on screen but sends nothing more once no box is left", async () => {
    const last = { ...iconResult, kind: "gift" as const, iconCode: null, name: "1 Áo phông SAA", unopenedLeft: 0 };
    const { opener, net } = await loadedOpener(1, json(200, last));
    await opener.open();
    expect(opener.getState()).toMatchObject({ phase: "result", unopened: 0, result: last });
    await opener.open();
    expect(net.opens()).toHaveLength(1);
  });

  it("does not open while loading or unavailable", async () => {
    const net = fakeFetch(new TypeError("offline"));
    const opener = createSecretBoxOpener({ fetch: net.fetch, newKey: sequentialKeys(), minOpeningMs: 0 });
    await opener.open();
    await opener.load();
    await opener.open();
    expect(net.opens()).toHaveLength(0);
  });

  it("clears the notice on demand", async () => {
    const { opener } = await loadedOpener(1, new TypeError("offline"));
    await opener.open();
    opener.dismissNotice();
    expect(opener.getState()).toMatchObject({ phase: "waiting", notice: null });
  });
});
