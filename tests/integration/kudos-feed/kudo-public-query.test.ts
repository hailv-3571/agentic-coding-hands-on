import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { KudoCardView } from "@/features/kudos-feed/schemas/kudo-card-view";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as seed from "./kudo-feed-fixtures";

/**
 * KudoPublicQuery.list (phase 05, C-05/C-17): status filter, AND filters, the anonymous-sender
 * guard on `senderId`, `includeOwnSpam` only for the viewer's own sent list, masking, batch-loaded
 * hashtags/images and the seam defaults. Seeds use far-future timestamps so they sort first.
 */
let alice: Sunner;
let bob: Sunner;
let r1: Sunner;
let r2: Sunner;
let tags: { id: string; label: string }[];
let dept: Record<"alice" | "r1" | "r2", string>;
const k: Record<string, string> = {};
let imagePaths: string[];
const ALICE_AVATAR = "https://lh3.googleusercontent.com/feed-alice-secret.png";
const at = (seconds: number) => new Date(Date.UTC(2101, 0, 1, 0, 0, seconds)).toISOString();

beforeAll(async () => {
  [alice, bob, r1, r2] = await Promise.all([
    createSunner("feed-alice", "Alice Feed"),
    createSunner("feed-bob", "Bob Feed"),
    createSunner("feed-r1", "Recipient One"),
    createSunner("feed-r2", "Recipient Two"),
  ]);
  dept = {
    alice: await seed.moveToDepartment(alice, "CEVC2"),
    r1: await seed.moveToDepartment(r1, "CEVC3"),
    r2: await seed.moveToDepartment(r2, "CEVC4"),
  };
  await seed.setAvatar(alice, ALICE_AVATAR);
  tags = await seed.createProbeHashtags(2);
  const [h0, h1] = tags.map((tag) => tag.id);
  k.named = await seed.insertKudo({ sender: alice, recipient: r1, title: "Người truyền lửa", hashtagIds: [h0], createdAt: at(10) });
  k.toR2 = await seed.insertKudo({ sender: alice, recipient: r2, hashtagIds: [h1], createdAt: at(9) });
  k.anon = await seed.insertKudo({ sender: alice, recipient: r1, nickname: "Mèo Mun", hashtagIds: [h1, h0], createdAt: at(8) });
  k.bob = await seed.insertKudo({ sender: bob, recipient: r1, hashtagIds: [h1], createdAt: at(7) });
  k.spam = await seed.insertKudo({ sender: alice, recipient: r2, status: "spam", hashtagIds: [h0], createdAt: at(6) });
  imagePaths = await seed.attachImages(k.named, [1, 0]);
});
afterAll(async () => {
  await cleanupSunners([alice, bob, r1, r2]);
  await seed.deleteProbeHashtags(tags.map((tag) => tag.id));
  await closeAppDb();
});

const ids = (items: KudoCardView[]) => items.map((item) => item.id);
const list = (viewer: Sunner, filters: Omit<Parameters<typeof KudoPublicQuery.list>[0], "viewerId" | "locale"> = {}) =>
  KudoPublicQuery.list({ viewerId: viewer.id, locale: "vi", ...filters });

describe("KudoPublicQuery.list — filters", () => {
  it("returns public kudos only, newest first, filtered by recipient", async () => {
    expect(ids((await list(bob, { recipientId: r1.id })).items)).toEqual([k.named, k.anon, k.bob]);
    expect(ids((await list(bob, { recipientId: r2.id })).items)).toEqual([k.toR2]);
  });

  it("ANDs hashtag, department (the recipient's) and sender filters", async () => {
    const [h0, h1] = tags.map((tag) => tag.id);
    expect(ids((await list(bob, { hashtagId: h0, departmentId: dept.r1 })).items)).toEqual([k.named, k.anon]);
    expect(ids((await list(bob, { hashtagId: h1, departmentId: dept.r1 })).items)).toEqual([k.anon, k.bob]);
    expect(ids((await list(bob, { hashtagId: h1, departmentId: dept.r2 })).items)).toEqual([k.toR2]);
    expect(ids((await list(bob, { hashtagId: h1, senderId: bob.id })).items)).toEqual([k.bob]);
    // The sender's own department never matches: alice is in CEVC2, nobody received in CEVC2.
    expect((await list(bob, { hashtagId: h0, departmentId: dept.alice })).items).toEqual([]);
  });
});

describe("KudoPublicQuery.list — anonymous sender (FR-602)", () => {
  it("masks the anonymous sender for every viewer and flags only the owner", async () => {
    for (const viewer of [bob, r1, alice]) {
      const card = (await list(viewer, { recipientId: r1.id })).items.find((item) => item.id === k.anon);
      expect(card?.sender).toEqual({ anonymous: true, nickname: "Mèo Mun" });
      expect(card?.isOwner).toBe(viewer === alice);
      const payload = JSON.stringify(card);
      for (const secret of [alice.id, alice.fullName, alice.email, ALICE_AVATAR, dept.alice]) {
        expect(payload).not.toContain(secret);
      }
    }
  });

  it("never lets a senderId filter reveal someone else's anonymous kudos (C-05)", async () => {
    expect(ids((await list(bob, { senderId: alice.id })).items)).toEqual([k.named, k.toR2]);
    const own = await list(alice, { senderId: alice.id });
    expect(ids(own.items)).toEqual([k.named, k.toR2, k.anon]);
    expect(own.items.find((item) => item.id === k.anon)?.sender).toEqual({ anonymous: true, nickname: "Mèo Mun" });
  });

  it("shows a named sender in full, with the department code", async () => {
    const [card] = (await list(bob, { recipientId: r1.id })).items;
    expect(card.sender).toEqual({
      anonymous: false,
      id: alice.id,
      name: "Alice Feed",
      avatarUrl: ALICE_AVATAR,
      department: { id: dept.alice, code: "CEVC2" },
      tier: null,
    });
    expect(card.recipient).toEqual({ id: r1.id, name: "Recipient One", avatarUrl: null, department: { id: dept.r1, code: "CEVC3" }, tier: null });
  });
});

describe("KudoPublicQuery.list — own spam (C-17)", () => {
  it("adds own spam, flagged, only when senderId is the viewer", async () => {
    const own = await list(alice, { senderId: alice.id, includeOwnSpam: true });
    expect(ids(own.items)).toEqual([k.named, k.toR2, k.anon, k.spam]);
    expect(own.items.map((item) => item.isSpam)).toEqual([false, false, false, true]);
  });

  it("ignores includeOwnSpam for another sender or without a sender filter", async () => {
    expect(ids((await list(bob, { senderId: alice.id, includeOwnSpam: true })).items)).toEqual([k.named, k.toR2]);
    expect(ids((await list(alice, { recipientId: r2.id, includeOwnSpam: true })).items)).toEqual([k.toR2]);
  });
});

describe("KudoPublicQuery.list — card content", () => {
  it("loads hashtags (seed order, localized), images (position order, signed) and seam defaults", async () => {
    const [named, anon] = (await list(bob, { recipientId: r1.id })).items;
    expect(anon.hashtags).toEqual(tags);
    expect(named.title).toBe("Người truyền lửa");
    expect(named.images.map((image) => image.position)).toEqual([0, 1]);
    named.images.forEach((image, position) => {
      expect(image.url).toContain(`/object/sign/kudo-images/${imagePaths[position]}?token=`);
    });
    expect(anon.images).toEqual([]);
    expect([named.heartCount, named.heartedByMe, named.isSpam]).toEqual([0, false, false]);
    expect(named.createdAt).toBe(at(10));
    const english = (await KudoPublicQuery.list({ viewerId: bob.id, locale: "en", recipientId: r1.id })).items[1];
    expect(english.hashtags.map((tag) => tag.label)).toEqual(["#PROBE0", "#PROBE1"]);
  });
});
