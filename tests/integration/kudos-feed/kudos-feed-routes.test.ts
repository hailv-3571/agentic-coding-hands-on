import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as highlightRoute from "@/app/api/kudos/highlight/route";
import * as listRoute from "@/app/api/kudos/route";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as seed from "./kudo-feed-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);

/**
 * GET /api/kudos and GET /api/kudos/highlight (FR-601, FR-602): session required (401 JSON),
 * Zod-validated params (400), `Cache-Control: private, no-store` on every answer, and the JSON of
 * an anonymous Kudo carries no sender id, name, email, avatar or department.
 */
let anonSender: Sunner;
let recipient: Sunner;
let viewer: Sunner;
let tags: { id: string; label: string }[];
let senderDepartmentId: string;
const SENDER_AVATAR = "https://lh3.googleusercontent.com/route-anon-secret.png";

beforeAll(async () => {
  [anonSender, recipient, viewer] = await Promise.all([
    createSunner("route-anon", "Route Anonymous Sender"),
    createSunner("route-recipient", "Route Recipient"),
    createSunner("route-viewer", "Route Viewer"),
  ]);
  senderDepartmentId = await seed.moveToDepartment(anonSender, "CEVC2");
  await seed.moveToDepartment(recipient, "CEVC3");
  await seed.setAvatar(anonSender, SENDER_AVATAR);
  tags = await seed.createProbeHashtags(1);
  const hashtagIds = [tags[0].id];
  for (let second = 0; second < 12; second += 1) {
    const anonymous = second % 3 === 0;
    await seed.insertKudo({
      sender: anonymous ? anonSender : viewer,
      recipient,
      nickname: anonymous ? "Gió Lạ" : null,
      hashtagIds,
      createdAt: new Date(Date.UTC(2103, 0, 1, 0, 0, second)).toISOString(),
    });
  }
});
beforeEach(() => requestCookies.clear());
afterAll(async () => {
  await cleanupSunners([anonSender, recipient, viewer]);
  await seed.deleteProbeHashtags(tags.map((tag) => tag.id));
  await closeAppDb();
});

const get = async (handler: (request: NextRequest) => Promise<Response>, path: string) => {
  const response = await handler(new NextRequest(`http://localhost:3000${path}`));
  const text = await response.text();
  return { status: response.status, cacheControl: response.headers.get("cache-control"), text, json: JSON.parse(text) };
};
const signedIn = () => signInToJar(requestCookies, viewer.email);

describe("kudos feed routes — guards", () => {
  it.each([
    ["list", listRoute.GET, "/api/kudos"],
    ["highlight", highlightRoute.GET, "/api/kudos/highlight"],
  ])("%s answers 401 JSON without a session, never cacheable", async (_label, handler, path) => {
    const answer = await get(handler, path);
    expect(answer).toMatchObject({ status: 401, cacheControl: "private, no-store", json: { code: "UNAUTHENTICATED" } });
  });

  it.each([
    ["undecodable cursor", listRoute.GET, "/api/kudos?cursor=bad!", { cursor: ["invalid"] }],
    ["cursor over 200 chars", listRoute.GET, `/api/kudos?cursor=${"A".repeat(201)}`, { cursor: ["invalid"] }],
    ["empty cursor", listRoute.GET, "/api/kudos?cursor=", { cursor: ["invalid"] }],
    ["hashtag not a uuid", highlightRoute.GET, "/api/kudos/highlight?hashtag=abc", { hashtag: ["invalid"] }],
    ["empty department", highlightRoute.GET, "/api/kudos/highlight?department=", { department: ["invalid"] }],
  ])("answers 400 VALIDATION for an %s", async (_label, handler, path, fieldErrors) => {
    await signedIn();
    const answer = await get(handler, path);
    expect(answer).toMatchObject({ status: 400, cacheControl: "private, no-store", json: { code: "VALIDATION", fieldErrors } });
  });
});

describe("kudos feed routes — data", () => {
  it("GET /api/kudos pages with nextCursor, newest first, no-store", async () => {
    await signedIn();
    const first = await get(listRoute.GET, "/api/kudos");
    expect(first).toMatchObject({ status: 200, cacheControl: "private, no-store" });
    expect(first.json.items).toHaveLength(10);
    expect(first.json.nextCursor).toEqual(expect.any(String));
    const second = await get(listRoute.GET, `/api/kudos?cursor=${encodeURIComponent(first.json.nextCursor)}`);
    expect(second.status).toBe(200);
    const firstIds = new Set(first.json.items.map((item: { id: string }) => item.id));
    expect(second.json.items.some((item: { id: string }) => firstIds.has(item.id))).toBe(false);
  });

  it("GET /api/kudos/highlight returns { items, total } after the filters, no-store", async () => {
    await signedIn();
    const answer = await get(highlightRoute.GET, `/api/kudos/highlight?hashtag=${tags[0].id}`);
    expect(answer).toMatchObject({ status: 200, cacheControl: "private, no-store", json: { total: 5 } });
    expect(answer.json.items).toHaveLength(5);
    const none = await get(highlightRoute.GET, `/api/kudos/highlight?hashtag=${tags[0].id}&department=${senderDepartmentId}`);
    expect(none.json).toEqual({ items: [], total: 0 });
  });

  it("never puts an anonymous sender's identifiers in the JSON", async () => {
    await signedIn();
    const payloads = [
      (await get(listRoute.GET, "/api/kudos")).text,
      (await get(highlightRoute.GET, `/api/kudos/highlight?hashtag=${tags[0].id}`)).text,
    ];
    for (const payload of payloads) {
      expect(payload).toContain('"nickname":"Gió Lạ"');
      for (const secret of [anonSender.id, anonSender.fullName, anonSender.email, SENDER_AVATAR, senderDepartmentId]) {
        expect(payload).not.toContain(secret);
      }
    }
  });
});
