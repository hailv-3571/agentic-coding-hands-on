import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { encodeKudoFeedCursor } from "@/features/kudos-feed/server/kudo-feed-cursor";
import { parseProfileKudosParams } from "@/features/profile/schemas/profile-kudos-request-schema";

/**
 * GET /api/profile/{userId}/kudos query (A3): `direction` is `received` (default) or `sent`; `cursor`
 * is the phase 05 feed cursor (the ONE cursor of KudoPublicQuery). Anything else present is a 400
 * VALIDATION `{ fieldErrors }`, answered before any DB read. There is no sender parameter at all.
 */
const params = (query: string) => parseProfileKudosParams(new URLSearchParams(query));
const cursor = encodeKudoFeedCursor({ createdAt: "2026-11-16T03:04:05.123456Z", id: randomUUID() });

describe("profile kudos request params", () => {
  it("defaults to the first page of 'received'", () => {
    expect(params("")).toEqual({ ok: true, data: { direction: "received" } });
  });

  it("accepts 'sent' and 'received' with an issued cursor", () => {
    expect(params(`direction=sent&cursor=${cursor}`)).toEqual({ ok: true, data: { direction: "sent", cursor } });
    expect(params(`direction=received&cursor=${cursor}`)).toEqual({ ok: true, data: { direction: "received", cursor } });
  });

  it.each([
    ["an unknown direction", "direction=all", { direction: ["invalid"] }],
    ["a direction in another case", "direction=SENT", { direction: ["invalid"] }],
    ["an empty direction", "direction=", { direction: ["invalid"] }],
    ["an undecodable cursor", "cursor=bad!", { cursor: ["invalid"] }],
    ["an empty cursor", "cursor=", { cursor: ["invalid"] }],
    ["a cursor over 200 chars", `cursor=${"A".repeat(201)}`, { cursor: ["invalid"] }],
  ])("rejects %s", (_label, query, fieldErrors) => {
    expect(params(query)).toEqual({ ok: false, fieldErrors });
  });

  it("ignores unknown keys, so no request can name a sender", () => {
    expect(params(`direction=received&senderId=${randomUUID()}&includeOwnSpam=true`)).toEqual({ ok: true, data: { direction: "received" } });
  });
});
