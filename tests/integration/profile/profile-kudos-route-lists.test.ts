import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as route from "@/app/api/profile/[userId]/kudos/route";
import type { KudoCardView } from "@/features/kudos-feed/schemas/kudo-card-view";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import {
  callRoute,
  cleanupProfileWorld,
  expectedSentOrder,
  GHOST_AVATAR,
  GHOST_NICKNAME,
  OWNER_NICKNAME,
  seedProfileWorld,
  type ProfileWorld,
} from "./profile-kudos-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/**
 * GET /api/profile/{userId}/kudos lists (BR-001..BR-003, BR-006, ALG-001, FR-602, FR-604): masking
 * comes only from KudoPublicQuery — an anonymous sender never reaches the JSON, not even for the
 * recipient or the author; the owner's spam appears only in the owner's "Đã gửi", flagged
 * `isSpam`; paginating to the end yields every kudo once in `(created_at, id)` DESC order across
 * the public/spam interleave, and each count equals that total.
 */
type Page = { items: KudoCardView[]; nextCursor?: string; counts: { received: number; sent?: number } };

let world: ProfileWorld;
const signInAs = (email: string) => signInToJar(requestCookies, email);

async function pageThrough(userId: string, direction: "sent" | "received") {
  const pages: Page[] = [];
  const texts: string[] = [];
  let cursor: string | undefined;
  do {
    const query = `?direction=${direction}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const answer = await callRoute(route.GET, `/api/profile/${userId}/kudos${query}`, { userId });
    expect(answer.status).toBe(200);
    pages.push(answer.json as Page);
    texts.push(answer.text);
    cursor = (answer.json as Page).nextCursor;
  } while (cursor && pages.length < 10);
  return { pages, texts, items: pages.flatMap((page) => page.items), counts: pages[0].counts };
}

beforeAll(async () => {
  world = await seedProfileWorld("profile-list");
});
beforeEach(() => requestCookies.clear());
afterAll(async () => {
  await cleanupProfileWorld(world);
  await closeAppDb();
});

describe("own 'Đã gửi' (public + own spam, one keyset)", () => {
  it("pages 10 + 6 with every kudo exactly once in (created_at, id) DESC order across the spam merge", async () => {
    await signInAs(world.owner.email);
    const { pages, items, counts } = await pageThrough(world.owner.id, "sent");
    expect(pages.map((page) => page.items.length)).toEqual([10, 6]);
    const ids = items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(await expectedSentOrder(world.owner.id));
    // BR-006 / D006: the dropdown number is what the list shows, own spam included.
    expect(counts).toEqual({ received: 4, sent: 16 });
    expect(items).toHaveLength(counts.sent!);
  });

  it("flags exactly the owner's spam and still masks the owner's own anonymous kudos", async () => {
    await signInAs(world.owner.email);
    const { items } = await pageThrough(world.owner.id, "sent");
    expect(items.filter((item) => item.isSpam).map((item) => item.id).sort()).toEqual([...world.ownerSpamIds].sort());
    expect(items.every((item) => item.isOwner)).toBe(true);
    for (const id of world.ownerAnonymousIds) {
      const card = items.find((item) => item.id === id)!;
      // An anonymous spam kudo goes through the same mask (BR-003): nickname only.
      expect(card.sender).toEqual({ anonymous: true, nickname: OWNER_NICKNAME });
    }
  });
});

describe("'Đã nhận' (public only, anonymous masked for everyone)", () => {
  it.each(["owner", "peer"] as const)("never shows the anonymous sender to the %s, recipient included", async (who) => {
    await signInAs(world[who].email);
    const { items, texts, counts } = await pageThrough(world.owner.id, "received");
    expect(counts.received).toBe(4);
    expect(items).toHaveLength(4);
    expect(items.filter((item) => item.sender.anonymous)).toHaveLength(2);
    const payload = texts.join("");
    expect(payload).toContain(`"nickname":"${GHOST_NICKNAME}"`);
    for (const secret of [world.ghost.id, world.ghost.fullName, world.ghost.email, GHOST_AVATAR]) {
      expect(payload).not.toContain(secret);
    }
    // Nobody's spam is in a received list, not the recipient's, not the sender's.
    for (const spamId of [world.ghostSpamId, world.thirdSpamId]) expect(payload).not.toContain(spamId);
    expect(items.some((item) => item.isSpam)).toBe(false);
  });

  it("gives another Sunner only the received count, equal to the paginated total, without the owner's spam", async () => {
    await signInAs(world.owner.email);
    const { items, counts, texts } = await pageThrough(world.peer.id, "received");
    expect(counts).toEqual({ received: 12 });
    expect(items).toHaveLength(12);
    for (const spamId of world.ownerSpamIds) expect(texts.join("")).not.toContain(spamId);
    for (const id of world.ownerAnonymousIds.filter((id) => !world.ownerSpamIds.includes(id))) {
      expect(items.find((item) => item.id === id)!.sender).toEqual({ anonymous: true, nickname: OWNER_NICKNAME });
    }
  });

  it("shows the peer's own received list with the author's anonymous kudos still masked", async () => {
    await signInAs(world.peer.email);
    const { items, counts } = await pageThrough(world.peer.id, "received");
    expect(counts).toEqual({ received: 12, sent: 1 });
    const anonymous = items.filter((item) => item.sender.anonymous);
    expect(anonymous).toHaveLength(2);
    expect(JSON.stringify(anonymous)).not.toContain(world.owner.id);
    expect(JSON.stringify(anonymous)).not.toContain(world.owner.fullName);
  });
});
