import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { InvalidKudoFeedCursorError } from "@/features/kudos-feed/server/kudo-feed-cursor";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { db } from "@/shared/db/client";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as seed from "./kudo-feed-fixtures";

/**
 * Cursor stability (SC-004, BR-005): `(created_at DESC, id DESC)` with the tuple predicate never
 * repeats or skips a row — not with 25 identical timestamps, not with rows a microsecond apart
 * (a millisecond cursor would re-serve them). Also: the unfiltered Live board path, a bad cursor,
 * and a constant statement count per page (hashtags + images + heart summary are batch-loaded, no N+1).
 */
let sender: Sunner;
let sameInstant: Sunner;
let microApart: Sunner;
let tags: { id: string; label: string }[];
const tied: string[] = [];
const micro: string[] = [];
const latest: string[] = [];

beforeAll(async () => {
  [sender, sameInstant, microApart] = await Promise.all([
    createSunner("page-sender", "Page Sender"),
    createSunner("page-tied", "Tied Recipient"),
    createSunner("page-micro", "Micro Recipient"),
  ]);
  tags = await seed.createProbeHashtags(1);
  for (let index = 0; index < 25; index += 1) {
    tied.push(await seed.insertKudo({ sender, recipient: sameInstant, createdAt: "2100-02-01T00:00:00.123456Z", hashtagIds: [tags[0].id] }));
  }
  for (const micros of ["000001", "000002", "000003"]) {
    micro.push(await seed.insertKudo({ sender, recipient: microApart, createdAt: `2100-03-01T00:00:00.${micros}Z` }));
  }
  for (const second of [3, 2, 1]) {
    latest.push(await seed.insertKudo({ sender, recipient: microApart, createdAt: `2102-01-01T00:00:0${second}Z` }));
  }
  await seed.attachImages(latest[0], [0, 1]);
});
afterAll(async () => {
  await cleanupSunners([sender, sameInstant, microApart]);
  await seed.deleteProbeHashtags(tags.map((tag) => tag.id));
  await closeAppDb();
});

async function pageThrough(recipientId: string, limit?: number) {
  const pages: string[][] = [];
  let cursor: string | undefined;
  do {
    const page = await KudoPublicQuery.list({ viewerId: sender.id, locale: "vi", recipientId, cursor, limit });
    pages.push(page.items.map((item) => item.id));
    cursor = page.nextCursor;
  } while (cursor && pages.length < 10);
  return pages;
}

describe("KudoPublicQuery cursor", () => {
  it("pages 25 kudos with one identical timestamp as 10/10/5, id DESC, no duplicate, no gap", async () => {
    const pages = await pageThrough(sameInstant.id);
    expect(pages.map((page) => page.length)).toEqual([10, 10, 5]);
    expect(pages.flat()).toEqual([...tied].sort().reverse());
  });

  it("keeps microsecond precision in the cursor (rows inside one millisecond)", async () => {
    const pages = await pageThrough(microApart.id, 1);
    expect(pages.flat()).toEqual([...latest, ...micro.slice().reverse()]);
  });

  it("serves the unfiltered Live board newest first", async () => {
    const { items, nextCursor } = await KudoPublicQuery.list({ viewerId: sender.id, locale: "vi" });
    expect(items.slice(0, 3).map((item) => item.id)).toEqual(latest);
    expect(items).toHaveLength(10);
    expect(nextCursor).toEqual(expect.any(String));
  });

  it("rejects a cursor it did not issue and an out-of-range limit", async () => {
    await expect(KudoPublicQuery.list({ viewerId: sender.id, locale: "vi", cursor: "bm90LWEtY3Vyc29y" })).rejects.toBeInstanceOf(
      InvalidKudoFeedCursorError,
    );
    for (const limit of [0, 51, 1.5]) {
      await expect(KudoPublicQuery.list({ viewerId: sender.id, locale: "vi", limit })).rejects.toBeInstanceOf(RangeError);
    }
  });
});

describe("KudoPublicQuery statement count (no N+1)", () => {
  const client = (db as unknown as { $client: { unsafe: (...args: unknown[]) => unknown } }).$client;

  async function statementsFor(run: () => Promise<unknown>): Promise<number> {
    const spy = vi.spyOn(client, "unsafe");
    try {
      await run();
      return spy.mock.calls.length;
    } finally {
      spy.mockRestore();
    }
  }

  it("issues the same five statements (rows, tags, images, hearts, Hero tiers) for a page of 10 and a page of 6", async () => {
    const tenWithTags = await statementsFor(() => KudoPublicQuery.list({ viewerId: sender.id, locale: "vi", recipientId: sameInstant.id }));
    const sixWithImages = await statementsFor(() => KudoPublicQuery.list({ viewerId: sender.id, locale: "vi", recipientId: microApart.id }));
    expect([tenWithTags, sixWithImages]).toEqual([5, 5]);
  });

  it("issues one statement for an empty page", async () => {
    const unknownRecipient = "00000000-0000-4000-8000-000000000000";
    expect(await statementsFor(() => KudoPublicQuery.list({ viewerId: sender.id, locale: "vi", recipientId: unknownRecipient }))).toBe(1);
  });
});
