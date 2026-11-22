import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as route from "@/app/api/profile/[userId]/kudos/route";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { callRoute, cleanupProfileWorld, seedProfileWorld, type ProfileWorld } from "./profile-kudos-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/**
 * GET /api/profile/{userId}/kudos guards (FR-601, FR-603, BR-002, DEC-002): 401 before anything
 * without a session, 400 VALIDATION for a bad direction/cursor, 404 for a malformed or unknown
 * user, 403 FORBIDDEN `{ code }` only for another Sunner's "Đã gửi" — whatever exists — and
 * `Cache-Control: private, no-store` on every answer.
 */
let world: ProfileWorld | undefined;
const get = (userId: string, query = "") => callRoute(route.GET, `/api/profile/${userId}/kudos${query}`, { userId });
const signInAs = (email: string) => signInToJar(requestCookies, email);

beforeAll(async () => {
  world = await seedProfileWorld("profile-guard");
});
beforeEach(() => requestCookies.clear());
afterAll(async () => {
  await cleanupProfileWorld(world);
  await closeAppDb();
});

describe("profile kudos route — guards", () => {
  it.each(["", "?direction=sent", "?direction=received"])("answers 401 JSON without a session (%s)", async (query) => {
    const answer = await get(world!.owner.id, query);
    expect(answer).toMatchObject({ status: 401, cacheControl: "private, no-store", json: { code: "UNAUTHENTICATED" } });
  });

  it.each([
    ["an unknown direction", "?direction=all", { direction: ["invalid"] }],
    ["an undecodable cursor", "?direction=sent&cursor=bad!", { cursor: ["invalid"] }],
    ["an empty cursor", "?cursor=", { cursor: ["invalid"] }],
  ])("answers 400 VALIDATION for %s", async (_label, query, fieldErrors) => {
    await signInAs(world!.owner.email);
    const answer = await get(world!.owner.id, query);
    expect(answer).toMatchObject({ status: 400, cacheControl: "private, no-store", json: { code: "VALIDATION", fieldErrors } });
  });

  it.each([
    ["a malformed user id", "not-a-uuid"],
    ["an unknown user id", randomUUID()],
  ])("answers 404 NOT_FOUND for %s", async (_label, userId) => {
    await signInAs(world!.owner.email);
    const answer = await get(userId, "?direction=received");
    expect(answer).toMatchObject({ status: 404, cacheControl: "private, no-store", json: { code: "NOT_FOUND" } });
  });

  it("refuses another Sunner's 'Đã gửi' with 403 and no data, in both directions of the pair", async () => {
    await signInAs(world!.owner.email);
    const asOwner = await get(world!.peer.id, "?direction=sent");
    expect(asOwner).toMatchObject({ status: 403, cacheControl: "private, no-store" });
    expect(asOwner.json).toEqual({ code: "FORBIDDEN" });

    await signInAs(world!.peer.email);
    const asPeer = await get(world!.owner.id, "?direction=sent");
    expect(asPeer.status).toBe(403);
    expect(asPeer.json).toEqual({ code: "FORBIDDEN" });
    // Even an unknown id is refused, never probed (no existence oracle through "sent").
    expect((await get(randomUUID(), "?direction=sent")).status).toBe(403);
  });

  it("serves the own 'Đã gửi' and anyone's 'Đã nhận' with no-store", async () => {
    await signInAs(world!.owner.email);
    expect(await get(world!.owner.id, "?direction=sent")).toMatchObject({ status: 200, cacheControl: "private, no-store" });
    expect(await get(world!.peer.id, "?direction=received")).toMatchObject({ status: 200, cacheControl: "private, no-store" });
    expect(await get(world!.peer.id)).toMatchObject({ status: 200, json: { counts: { received: 12 } } });
  });
});
