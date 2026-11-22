import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSpotlightSnapshot } from "@/features/spotlight-board/lib/fetch-spotlight-snapshot";
import type { SpotlightSnapshot } from "@/features/spotlight-board/schemas/spotlight-views";

/**
 * The region's refetch (A1): the error state's "Thử lại", every resync after a (re)join, a
 * moderation event or tab visible all call `GET /api/spotlight` (session cookie, no cache) and use
 * the body only when it parses; any failure is `null`, so the caller keeps what is on screen.
 */
const ana = "00000000-0000-4000-8000-00000000000a";
const snapshot: SpotlightSnapshot = {
  total: 2,
  names: [{ recipientId: ana, name: "Ana", count: 2 }],
  recent: [{ kudoId: "00000000-0000-4000-8000-0000000000c1", recipientId: ana, recipientName: "Ana", occurredAt: "2026-11-22T13:30:00.000Z" }],
};

const fetchMock = vi.fn<typeof fetch>();
const answer = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce(Response.json(body, { status }));

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("fetchSpotlightSnapshot", () => {
  it("GETs /api/spotlight without the HTTP cache and returns the parsed snapshot", async () => {
    vi.stubGlobal("fetch", fetchMock);
    answer({ ...snapshot, extra: "dropped" });
    await expect(fetchSpotlightSnapshot()).resolves.toEqual(snapshot);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/spotlight");
    expect(init?.method ?? "GET").toBe("GET");
    expect(init?.cache).toBe("no-store");
  });

  it.each([401, 500])("is null when the route answers %i", async (status) => {
    vi.stubGlobal("fetch", fetchMock);
    answer({ code: "unexpected" }, status);
    await expect(fetchSpotlightSnapshot()).resolves.toBeNull();
  });

  it("is null for a body that does not match the snapshot contract", async () => {
    vi.stubGlobal("fetch", fetchMock);
    answer({ total: -1, names: [], recent: [] });
    await expect(fetchSpotlightSnapshot()).resolves.toBeNull();
  });

  it("is null when the network fails or the request is aborted", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(fetchSpotlightSnapshot()).resolves.toBeNull();
    fetchMock.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));
    await expect(fetchSpotlightSnapshot(AbortSignal.abort())).resolves.toBeNull();
  });
});
