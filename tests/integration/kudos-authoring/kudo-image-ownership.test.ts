import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as signImage } from "@/app/api/kudos/images/sign/route";
import { KUDO_IMAGE_PATH_PATTERN } from "@/features/kudos-authoring/kudo-authoring-limits";
import { createKudo } from "@/features/kudos-authoring/server/create-kudo-action";
import { updateKudo } from "@/features/kudos-authoring/server/update-kudo-action";
import type { KudoCreateInput } from "@/features/kudos-authoring/schemas/kudo-input-schema";
import { testSql } from "../../setup/integration-db";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { closeWriting, openWriting } from "./event-end-override";
import * as fixtures from "./kudo-test-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) =>
  (await import("./event-end-override")).withEventEndOverride(await original<{ env: object }>()),
);

/** POST /api/kudos/images/sign + upload ownership (BR-003 via kudo_image_uploads + storage.objects). */
let sender: fixtures.Sunner;
let recipient: fixtures.Sunner;
let other: fixtures.Sunner;
let tag: string;

beforeAll(async () => {
  sender = await fixtures.createSunner("img-sender", "Image Sender");
  recipient = await fixtures.createSunner("img-recipient", "Image Recipient");
  other = await fixtures.createSunner("img-other", "Image Other");
  [tag] = await fixtures.activeHashtagIds(1);
});
beforeEach(async () => {
  openWriting();
  await signInAs(sender);
});
afterAll(async () => {
  await fixtures.cleanupSunners([sender, recipient, other]);
  await closeAppDb();
});

async function signInAs(user: fixtures.Sunner) {
  requestCookies.clear();
  await signInToJar(requestCookies, user.email);
}
async function sign(body: unknown) {
  const response = await signImage(
    new Request("http://localhost:3000/api/kudos/images/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: response.status, json: await response.json() };
}
async function signAndUpload(): Promise<string> {
  const { json } = await sign({ contentType: "image/png", size: fixtures.PNG_BYTES.length });
  await fixtures.uploadWithSignedToken(json.path, json.token);
  return json.path;
}
const kudoWith = (imagePaths: string[]): KudoCreateInput => ({ recipientId: recipient.id, body: "Ảnh", hashtagIds: [tag], imagePaths });
const imagesOf = (kudoId: string) =>
  testSql`select storage_path, position from public.kudo_images where kudo_id = ${kudoId} order by position`;
const uploadRowsFor = (paths: string[]) =>
  testSql`select storage_path, uploader_id from public.kudo_image_uploads where storage_path = any(${paths}::text[])`;
const imageInvalid = { ok: false, code: "IMAGE_INVALID", fieldErrors: { imagePaths: ["imageNotOwned"] } };

describe("POST /api/kudos/images/sign", () => {
  it("issues a kudos/{uuid}.{ext} path without the sender id and records the uploader", async () => {
    const { status, json } = await sign({ contentType: "image/jpeg", size: 1024 });
    expect(status).toBe(200);
    expect(json).toEqual({ path: expect.stringMatching(KUDO_IMAGE_PATH_PATTERN), token: expect.any(String), signedUrl: expect.any(String) });
    expect(json.path.endsWith(".jpg")).toBe(true);
    expect(json.path).not.toContain(sender.id);
    expect(json.signedUrl.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/`)).toBe(true);
    expect(await uploadRowsFor([json.path])).toEqual([{ storage_path: json.path, uploader_id: sender.id }]);
  });

  it("refuses a guest, a non-image type, an oversize file and writing after EVENT_END_AT", async () => {
    expect(await sign({ contentType: "image/gif", size: 10 })).toEqual({
      status: 400,
      json: { code: "VALIDATION", fieldErrors: { contentType: ["invalid"] } },
    });
    expect(await sign({ contentType: "image/png", size: 5 * 1024 * 1024 + 1 })).toEqual({
      status: 400,
      json: { code: "VALIDATION", fieldErrors: { size: ["invalid"] } },
    });
    closeWriting();
    expect(await sign({ contentType: "image/png", size: 10 })).toEqual({ status: 403, json: { code: "WRITING_CLOSED" } });
    requestCookies.clear();
    expect(await sign({ contentType: "image/png", size: 10 })).toEqual({ status: 401, json: { code: "UNAUTHENTICATED" } });
  });
});

describe("image ownership on write", () => {
  it("attaches owned, uploaded images in the given order and consumes their upload rows", async () => {
    const [first, second] = [await signAndUpload(), await signAndUpload()];
    const result = await createKudo(kudoWith([second, first]));
    expect(result.ok).toBe(true);
    expect(await imagesOf((result as { id: string }).id)).toEqual([
      { storage_path: second, position: 0 },
      { storage_path: first, position: 1 },
    ]);
    expect(await uploadRowsFor([first, second])).toEqual([]);
  });

  it("rejects a path uploaded by another Sunner and leaves their upload untouched", async () => {
    await signInAs(other);
    const foreign = await signAndUpload();
    await signInAs(sender);
    const before = await fixtures.kudoCountBySender(sender.id);
    expect(await createKudo(kudoWith([foreign]))).toEqual(imageInvalid);
    expect(await fixtures.kudoCountBySender(sender.id)).toBe(before);
    expect(await uploadRowsFor([foreign])).toHaveLength(1);
  });

  it("rejects a well-formed path that was never issued and an issued path never uploaded", async () => {
    expect(await createKudo(kudoWith(["kudos/5e4d3c2b-1a09-4f8e-9d7c-6b5a49382716.png"]))).toEqual(imageInvalid);
    const { json } = await sign({ contentType: "image/webp", size: 10 });
    expect(await createKudo(kudoWith([json.path]))).toEqual(imageInvalid);
  });

  it("rejects reusing a path that is already attached to a kudo", async () => {
    const path = await signAndUpload();
    expect((await createKudo(kudoWith([path]))).ok).toBe(true);
    expect(await createKudo(kudoWith([path]))).toEqual(imageInvalid);
  });

  it("rejects 6 images before touching the database", async () => {
    const six = Array.from({ length: 6 }, (_, i) => `kudos/5e4d3c2b-1a09-4f8e-9d7c-6b5a4938271${i}.png`);
    expect(await createKudo(kudoWith(six))).toEqual({ ok: false, code: "VALIDATION", fieldErrors: { imagePaths: ["imagesTooMany"] } });
  });

  it("on edit keeps attached images, adds new owned uploads and drops removed ones", async () => {
    const [kept, dropped, added] = [await signAndUpload(), await signAndUpload(), await signAndUpload()];
    const { id } = (await createKudo(kudoWith([kept, dropped]))) as { id: string };
    const edit = { body: "Ảnh mới", hashtagIds: [tag] };
    expect(await updateKudo(id, { ...edit, imagePaths: [added, kept] })).toEqual({ ok: true, id });
    expect(await imagesOf(id)).toEqual([
      { storage_path: added, position: 0 },
      { storage_path: kept, position: 1 },
    ]);
    await signInAs(other);
    const foreign = await signAndUpload();
    await signInAs(sender);
    expect(await updateKudo(id, { ...edit, imagePaths: [foreign] })).toEqual(imageInvalid);
    expect(await imagesOf(id)).toHaveLength(2);
  });
});
