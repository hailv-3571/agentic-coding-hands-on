import { describe, expect, it } from "vitest";
import { parseNotificationListParams } from "@/features/notifications/server/notification-list-params";
import { encodeKudoFeedCursor } from "@/features/kudos-feed/server/kudo-feed-cursor";

/**
 * GET /api/notifications?limit&cursor: limit defaults to the page size (20) and is clamped to 50;
 * a non-positive or non-numeric limit and any cursor the encoder would not write are rejected (400).
 */
const ID = "99999999-9999-4999-8999-999999999999";
const parse = (query: string) => parseNotificationListParams(new URLSearchParams(query));

describe("parseNotificationListParams", () => {
  it("defaults to the first page of 20", () => {
    expect(parse("")).toEqual({ ok: true, limit: 20, cursor: null });
  });

  it("keeps a limit in range and clamps a larger one to 50", () => {
    expect(parse("limit=10")).toEqual({ ok: true, limit: 10, cursor: null });
    expect(parse("limit=500")).toEqual({ ok: true, limit: 50, cursor: null });
  });

  it.each(["limit=0", "limit=-1", "limit=abc", "limit=2.5", "limit=", "limit=1e3"])("rejects %s", (query) => {
    expect(parse(query)).toEqual({ ok: false });
  });

  it("decodes a cursor with microsecond precision", () => {
    const cursor = encodeKudoFeedCursor({ createdAt: "2026-11-23T01:02:03.456789Z", id: ID });
    expect(parse(`cursor=${cursor}`)).toEqual({ ok: true, limit: 20, cursor: { occurredAt: "2026-11-23T01:02:03.456789Z", id: ID } });
  });

  it.each(["cursor=", "cursor=not-a-cursor", `cursor=${Buffer.from('{"c":"x","i":"y"}').toString("base64url")}`])("rejects %s", (query) => {
    expect(parse(query)).toEqual({ ok: false });
  });
});
