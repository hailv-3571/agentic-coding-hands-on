import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decodeKudoFeedCursor,
  encodeKudoFeedCursor,
  KUDO_FEED_CURSOR_MAX_LENGTH,
} from "@/features/kudos-feed/server/kudo-feed-cursor";

/**
 * Feed cursor (phase 05): opaque base64url of `{ c, i }` = the last row's `created_at` at full
 * Postgres precision (microseconds, so equal-millisecond rows never repeat) and its id. Anything
 * that is not exactly what the encoder produces decodes to null (→ 400).
 */
const ID = randomUUID();
const AT = "2026-11-16T03:04:05.123456Z";
const toBase64Url = (value: string) => Buffer.from(value, "utf8").toString("base64url");

describe("kudo feed cursor", () => {
  it("round-trips the microsecond timestamp and id", () => {
    const raw = encodeKudoFeedCursor({ createdAt: AT, id: ID });
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(raw.length).toBeLessThanOrEqual(KUDO_FEED_CURSOR_MAX_LENGTH);
    expect(decodeKudoFeedCursor(raw)).toEqual({ createdAt: AT, id: ID });
    // The earliest instant Postgres stores (there is no year 0000 in timestamptz).
    const earliest = { createdAt: "0001-01-01T00:00:00.000000Z", id: ID };
    expect(decodeKudoFeedCursor(encodeKudoFeedCursor(earliest))).toEqual(earliest);
  });

  it("encodes exactly the {c, i} JSON as base64url without padding", () => {
    const raw = encodeKudoFeedCursor({ createdAt: AT, id: ID });
    expect(Buffer.from(raw, "base64url").toString("utf8")).toBe(JSON.stringify({ c: AT, i: ID }));
    expect(raw).not.toContain("=");
  });

  it.each([
    ["empty", ""],
    ["too long", "A".repeat(KUDO_FEED_CURSOR_MAX_LENGTH + 1)],
    ["standard base64 alphabet", `${toBase64Url(JSON.stringify({ c: AT, i: ID }))}+/`],
    ["padding", `${toBase64Url(JSON.stringify({ c: AT, i: ID }))}==`],
    ["not JSON", toBase64Url("not json")],
    ["JSON array", toBase64Url(JSON.stringify([AT, ID]))],
    ["JSON null", toBase64Url("null")],
    ["missing id", toBase64Url(JSON.stringify({ c: AT }))],
    ["extra key", toBase64Url(JSON.stringify({ c: AT, i: ID, s: "spam" }))],
    ["millisecond timestamp", toBase64Url(JSON.stringify({ c: "2026-11-16T03:04:05.123Z", i: ID }))],
    ["offset instead of Z", toBase64Url(JSON.stringify({ c: "2026-11-16T03:04:05.123456+07:00", i: ID }))],
    ["impossible date", toBase64Url(JSON.stringify({ c: "2026-02-30T03:04:05.123456Z", i: ID }))],
    ["impossible hour", toBase64Url(JSON.stringify({ c: "2026-11-16T24:04:05.123456Z", i: ID }))],
    // A real date for JS, but `::timestamptz` raises "out of range" (→ 500 instead of 400).
    ["year 0000", toBase64Url(JSON.stringify({ c: "0000-01-01T00:00:00.000000Z", i: ID }))],
    ["id not a uuid", toBase64Url(JSON.stringify({ c: AT, i: "1 or 1=1" }))],
    ["numeric timestamp", toBase64Url(JSON.stringify({ c: 1794794947001, i: ID }))],
  ])("rejects %s", (_label, raw) => {
    expect(decodeKudoFeedCursor(raw)).toBeNull();
  });

  it("rejects a non-canonical spelling of a valid cursor (one cursor, one spelling)", () => {
    const raw = encodeKudoFeedCursor({ createdAt: AT, id: ID });
    expect(decodeKudoFeedCursor(`${raw} `)).toBeNull();
    // Same fields, valid JSON, but not what the encoder writes.
    expect(decodeKudoFeedCursor(toBase64Url(`{ "c": "${AT}", "i": "${ID}" }`))).toBeNull();
    expect(decodeKudoFeedCursor(toBase64Url(JSON.stringify({ i: ID, c: AT })))).toBeNull();
  });
});
