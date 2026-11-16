import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HIGHLIGHT_COUNT, listHighlightKudos } from "@/features/kudos-feed/server/kudo-highlight-query";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { db } from "@/shared/db/client";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as seed from "./kudo-feed-fixtures";

/**
 * Highlight (BR-002, BR-004, D001, D002): hashtag AND department (the recipient's) filter the
 * public candidates inside `publicKudoIdsSubquery`; the heart seam ranks them (phase 05 default:
 * newest first, phase 06 swaps in heart counts); at most HIGHLIGHT_COUNT cards, masked.
 */
let sender: Sunner;
let inX: Sunner;
let inY: Sunner;
let tags: { id: string; label: string }[];
let deptX: string;
const k: Record<string, string> = {};
const many: string[] = [];
const at = (seconds: number) => new Date(Date.UTC(2101, 5, 1, 0, 0, seconds)).toISOString();

beforeAll(async () => {
  [sender, inX, inY] = await Promise.all([
    createSunner("hl-sender", "Highlight Sender"),
    createSunner("hl-x", "Recipient X"),
    createSunner("hl-y", "Recipient Y"),
  ]);
  deptX = await seed.moveToDepartment(inX, "CEVC3");
  await seed.moveToDepartment(inY, "CEVC4");
  tags = await seed.createProbeHashtags(3);
  const [a, b, cap] = tags.map((tag) => tag.id);
  k.aX = await seed.insertKudo({ sender, recipient: inX, hashtagIds: [a], createdAt: at(50) });
  k.abX = await seed.insertKudo({ sender, recipient: inX, hashtagIds: [a, b], nickname: "Cú Mèo", createdAt: at(40) });
  k.aY = await seed.insertKudo({ sender, recipient: inY, hashtagIds: [a], createdAt: at(30) });
  k.bX = await seed.insertKudo({ sender, recipient: inX, hashtagIds: [b], createdAt: at(20) });
  k.spamAX = await seed.insertKudo({ sender, recipient: inX, hashtagIds: [a], status: "spam", createdAt: at(60) });
  for (let index = 0; index < 7; index += 1) {
    many.push(await seed.insertKudo({ sender, recipient: inY, hashtagIds: [cap], createdAt: at(index) }));
  }
});
afterAll(async () => {
  await cleanupSunners([sender, inX, inY]);
  await seed.deleteProbeHashtags(tags.map((tag) => tag.id));
  await closeAppDb();
});

const highlight = (filters: { hashtagId?: string; departmentId?: string }) =>
  listHighlightKudos({ viewerId: inY.id, locale: "vi", ...filters });

describe("listHighlightKudos", () => {
  it("applies hashtag AND department (recipient's), excludes spam, ranks newest first by default", async () => {
    const [a, b] = tags.map((tag) => tag.id);
    const both = await highlight({ hashtagId: a, departmentId: deptX });
    expect(both.items.map((item) => item.id)).toEqual([k.aX, k.abX]);
    expect(both.total).toBe(2);
    expect((await highlight({ hashtagId: b, departmentId: deptX })).items.map((item) => item.id)).toEqual([k.abX, k.bX]);
    expect((await highlight({ hashtagId: a })).items.map((item) => item.id)).toEqual([k.aX, k.abX, k.aY]);
  });

  it("masks anonymous senders and keeps the card shape of the feed", async () => {
    const [, anon] = (await highlight({ hashtagId: tags[0].id, departmentId: deptX })).items;
    expect(anon.sender).toEqual({ anonymous: true, nickname: "Cú Mèo" });
    expect(JSON.stringify(anon)).not.toContain(sender.id);
    expect([anon.heartCount, anon.heartedByMe, anon.isOwner, anon.isSpam]).toEqual([0, false, false, false]);
  });

  it(`returns at most ${HIGHLIGHT_COUNT} cards and total = cards returned`, async () => {
    const top = await highlight({ hashtagId: tags[2].id });
    expect(HIGHLIGHT_COUNT).toBe(5);
    expect(top.items.map((item) => item.id)).toEqual(many.slice(-5).reverse());
    expect(top.total).toBe(5);
  });

  it("returns an empty list (not an error) when nothing matches", async () => {
    expect(await highlight({ hashtagId: tags[2].id, departmentId: deptX })).toEqual({ items: [], total: 0 });
  });
});

describe("KudoPublicQuery.publicKudoIdsSubquery", () => {
  it("is a reusable (id, createdAt) subquery of public kudos with the AND filters", async () => {
    const candidates = KudoPublicQuery.publicKudoIdsSubquery({ hashtagId: tags[0].id, departmentId: deptX });
    const rows = await db.select({ id: candidates.id, createdAt: candidates.createdAt }).from(candidates);
    expect(rows.map((row) => row.id).sort()).toEqual([k.aX, k.abX].sort());
    expect(rows.every((row) => row.createdAt instanceof Date)).toBe(true);
  });
});
