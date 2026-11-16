import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as editRoute from "@/app/api/kudos/[id]/edit/route";
import * as hashtagsRoute from "@/app/api/hashtags/route";
import * as signRoute from "@/app/api/kudos/images/sign/route";
import * as searchRoute from "@/app/api/sunners/search/route";
import * as createAction from "@/features/kudos-authoring/server/create-kudo-action";
import * as updateAction from "@/features/kudos-authoring/server/update-kudo-action";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { openWriting } from "./event-end-override";
import * as fixtures from "./kudo-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) =>
  (await import("./event-end-override")).withEventEndOverride(await original<{ env: object }>()),
);

/** GET /api/kudos/{id}/edit (FR-401, C-17) and GET /api/hashtags; no delete path anywhere. */
let owner: fixtures.Sunner;
let recipient: fixtures.Sunner;
let stranger: fixtures.Sunner;
let tags: { id: string; label_vi: string }[];
let probeTags: { active: string; inactive: string };
let kudoId: string;
let imagePath: string;

beforeAll(async () => {
  owner = await fixtures.createSunner("edit-owner", "Edit Owner");
  recipient = await fixtures.createSunner("edit-recipient", "Edit Recipient");
  stranger = await fixtures.createSunner("edit-stranger", "Edit Stranger");
  tags = await testSql`select id, label_vi from public.hashtags where is_active order by sort_order limit 2`;
  const suffix = Date.now();
  const [active, inactive] = await testSql<{ id: string }[]>`
    insert into public.hashtags (slug, label_vi, label_en, sort_order, is_active)
    values (${`probe-on-${suffix}`}, '#THỬ', '#PROBE', -1, true), (${`probe-off-${suffix}`}, '#TẮT', '#OFF', -2, false)
    returning id`;
  probeTags = { active: active.id, inactive: inactive.id };

  openWriting();
  await signInToJar(requestCookies, owner.email);
  const signed = await (await signRoute.POST(jsonPost({ contentType: "image/png", size: 68 }))).json();
  await fixtures.uploadWithSignedToken(signed.path, signed.token);
  imagePath = signed.path;
  const created = await createAction.createKudo({
    recipientId: recipient.id,
    title: "Người truyền lửa",
    body: "Cảm ơn **bạn**",
    hashtagIds: [tags[1].id, tags[0].id, probeTags.active],
    imagePaths: [imagePath],
    isAnonymous: true,
    anonymousNickname: "Mèo Mun",
  });
  kudoId = (created as { id: string }).id;
  // Retire one attached hashtag afterwards: the prefill offers active hashtags only (re-pick rule).
  await testSql`update public.hashtags set is_active = false where id = ${probeTags.active}`;
});
beforeEach(() => requestCookies.clear());
afterAll(async () => {
  await fixtures.cleanupSunners([owner, recipient, stranger]);
  await testSql`delete from public.hashtags where id in (${probeTags.active}, ${probeTags.inactive})`;
  await closeAppDb();
});

function jsonPost(body: unknown) {
  return new Request("http://localhost:3000/api/kudos/images/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
async function loadEdit(id: string) {
  const response = await editRoute.GET(new NextRequest(`http://localhost:3000/api/kudos/${id}/edit`), {
    params: Promise.resolve({ id }),
  });
  return { status: response.status, json: await response.json() };
}

describe("GET /api/kudos/{id}/edit", () => {
  it("returns the owner's prefill with active hashtags, image previews and locked=false", async () => {
    await signInToJar(requestCookies, owner.email);
    const { status, json } = await loadEdit(kudoId);
    expect(status).toBe(200);
    expect(json).toEqual({
      id: kudoId,
      recipient: expect.objectContaining({ id: recipient.id, fullName: "Edit Recipient", email: recipient.email }),
      title: "Người truyền lửa",
      body: "Cảm ơn **bạn**",
      hashtags: tags.map((tag) => ({ id: tag.id, label: tag.label_vi })),
      images: [{ path: imagePath, position: 0, previewUrl: expect.stringContaining(imagePath) }],
      isAnonymous: true,
      anonymousNickname: "Mèo Mun",
      locked: false,
    });
    expect(json.images[0].previewUrl.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/`)).toBe(true);
  });

  it("marks a spam kudo as locked for its owner", async () => {
    await testSql`update public.kudos set status = 'spam' where id = ${kudoId}`;
    try {
      await signInToJar(requestCookies, owner.email);
      expect(await loadEdit(kudoId)).toMatchObject({ status: 200, json: { id: kudoId, locked: true } });
    } finally {
      await testSql`update public.kudos set status = 'public' where id = ${kudoId}`;
    }
  });

  it("sends Cache-Control: private, no-store on the prefill and on every refusal", async () => {
    const cacheControlOf = async (id: string) =>
      (await editRoute.GET(new NextRequest(`http://localhost:3000/api/kudos/${id}/edit`), { params: Promise.resolve({ id }) }))
        .headers.get("cache-control");
    expect(await cacheControlOf(kudoId)).toBe("private, no-store"); // 401 guest
    await signInToJar(requestCookies, owner.email);
    expect(await cacheControlOf(kudoId)).toBe("private, no-store"); // 200 prefill (signed URLs, nickname)
    expect(await cacheControlOf("not-a-uuid")).toBe("private, no-store"); // 404
  });

  it("answers 403 to a non-owner, 404 for unknown or malformed ids, 401 to a guest — with no content", async () => {
    expect(await loadEdit(kudoId)).toEqual({ status: 401, json: { code: "UNAUTHENTICATED" } });
    await signInToJar(requestCookies, stranger.email);
    expect(await loadEdit(kudoId)).toEqual({ status: 403, json: { code: "FORBIDDEN" } });
    expect(await loadEdit("7d1c5e9a-2b4f-4c6d-8e0f-1a2b3c4d5e6f")).toEqual({ status: 404, json: { code: "NOT_FOUND" } });
    expect(await loadEdit("not-a-uuid")).toEqual({ status: 404, json: { code: "NOT_FOUND" } });
  });
});

describe("GET /api/hashtags", () => {
  const list = async (headers: Record<string, string> = {}) => {
    const response = await hashtagsRoute.GET(new NextRequest("http://localhost:3000/api/hashtags", { headers }));
    return { status: response.status, json: await response.json() };
  };

  it("answers 401 without a session", async () => {
    expect(await list()).toEqual({ status: 401, json: { code: "UNAUTHENTICATED" } });
  });

  it("lists active hashtags in seed order with the label of the request locale", async () => {
    await signInToJar(requestCookies, stranger.email);
    await testSql`update public.hashtags set is_active = true where id = ${probeTags.active}`;
    try {
      const en = await list({ cookie: "NEXT_LOCALE=en" });
      expect(en.status).toBe(200);
      expect(en.json[0]).toEqual({ id: probeTags.active, label: "#PROBE" });
      expect(en.json.map((tag: { id: string }) => tag.id)).not.toContain(probeTags.inactive);
      expect((await list({ "accept-language": "vi-VN,vi;q=0.9" })).json[0]).toEqual({ id: probeTags.active, label: "#THỬ" });
      expect(en.json).toHaveLength(9);
    } finally {
      await testSql`update public.hashtags set is_active = false where id = ${probeTags.active}`;
    }
  });
});

describe("no delete path for Kudos", () => {
  it("exposes no DELETE handler and no delete action", () => {
    for (const route of [editRoute, hashtagsRoute, signRoute, searchRoute]) expect(Object.keys(route)).not.toContain("DELETE");
    expect(Object.keys(createAction)).toEqual(["createKudo"]);
    expect(Object.keys(updateAction)).toEqual(["updateKudo"]);
  });
});
