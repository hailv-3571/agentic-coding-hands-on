import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as route from "@/app/api/sunners/[userId]/card/route";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { closeWriting, openWriting } from "../kudos-authoring/event-end-override";
import { moveToDepartment } from "../kudos-feed/kudo-feed-fixtures";
import { callRoute, cleanupProfileWorld, GHOST_AVATAR, GHOST_NICKNAME, seedProfileWorld, type ProfileWorld } from "./profile-kudos-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) =>
  (await import("../kudos-authoring/event-end-override")).withEventEndOverride(await original()),
);

/**
 * GET /api/sunners/{userId}/card — avatar hover card (A5, BR-007, decision 2026-11-23): a fixed
 * whitelist (no email, role, avatar, sender or Kudo data); "Số Kudos nhận được" = public kudos
 * received (= the profile's "Đã nhận"); "Số Kudos đã gửi" of SOMEONE ELSE excludes anonymous and
 * spam kudos (a changing number must not reveal an anonymous send), while the viewer's own card
 * counts their public anonymous kudos like the stats panel. "Gửi KUDO" never on the own card.
 */
const CARD_KEYS = ["canSendKudo", "departmentName", "fullName", "heroTier", "id", "kudosReceived", "kudosSent"];

let world: ProfileWorld;
const card = (userId: string) => callRoute(route.GET, `/api/sunners/${userId}/card`, { userId });
const signInAs = (email: string) => signInToJar(requestCookies, email);

beforeAll(async () => {
  world = await seedProfileWorld("profile-card");
  await moveToDepartment(world.owner, "CEVC3");
});
beforeEach(() => {
  requestCookies.clear();
  openWriting();
});
afterAll(async () => {
  await cleanupProfileWorld(world);
  await closeAppDb();
});

describe("sunner card route", () => {
  it("answers 401 JSON without a session, never cacheable", async () => {
    expect(await card(world.owner.id)).toMatchObject({ status: 401, cacheControl: "private, no-store", json: { code: "UNAUTHENTICATED" } });
  });

  it.each([
    ["a malformed id", "nope"],
    ["an unknown id", randomUUID()],
  ])("answers 404 NOT_FOUND for %s", async (_label, userId) => {
    await signInAs(world.peer.email);
    expect(await card(userId)).toMatchObject({ status: 404, cacheControl: "private, no-store", json: { code: "NOT_FOUND" } });
  });

  it("returns only the whitelisted fields, with the localized department name and the Hero tier", async () => {
    await signInAs(world.peer.email);
    const answer = await card(world.owner.id);
    expect(answer).toMatchObject({ status: 200, cacheControl: "private, no-store" });
    expect(Object.keys(answer.json).sort()).toEqual(CARD_KEYS);
    // Received from ghost, third and peer: three distinct public senders → New Hero.
    expect(answer.json).toMatchObject({ id: world.owner.id, fullName: "Profile Owner", departmentName: "CEVC3", heroTier: "new" });
    expect(answer.text).not.toContain(world.owner.email);
  });

  it("counts someone else's sent kudos without anonymous or spam ones; received = public received", async () => {
    await signInAs(world.peer.email);
    // Owner sent 12 public (2 anonymous) + 4 spam; received 4 public (2 anonymous) + 2 spam.
    expect((await card(world.owner.id)).json).toMatchObject({ kudosReceived: 4, kudosSent: 10, canSendKudo: true });
    // Ghost only ever sent anonymously: someone else sees 0, the number never moves with a new one.
    expect((await card(world.ghost.id)).json).toMatchObject({ kudosReceived: 0, kudosSent: 0 });
  });

  it("drops 'Gửi KUDO' once writing has closed (EVENT_END_AT)", async () => {
    await signInAs(world.peer.email);
    closeWriting();
    expect((await card(world.owner.id)).json).toMatchObject({ canSendKudo: false });
  });

  it("counts the viewer's own public anonymous kudos on their own card and hides 'Gửi KUDO'", async () => {
    await signInAs(world.owner.email);
    expect((await card(world.owner.id)).json).toMatchObject({ kudosReceived: 4, kudosSent: 12, canSendKudo: false });
    await signInAs(world.ghost.email);
    expect((await card(world.ghost.id)).json).toMatchObject({ kudosSent: 2, canSendKudo: false });
  });

  it("never carries a sender's identity: the card of an anonymous-kudo recipient names no sender", async () => {
    await signInAs(world.peer.email);
    const { text } = await card(world.owner.id);
    for (const secret of [world.ghost.id, world.ghost.fullName, world.ghost.email, GHOST_AVATAR, GHOST_NICKNAME, world.third.id]) {
      expect(text).not.toContain(secret);
    }
  });
});
