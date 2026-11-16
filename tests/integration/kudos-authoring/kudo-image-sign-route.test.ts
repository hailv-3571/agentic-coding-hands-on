import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as signImage } from "@/app/api/kudos/images/sign/route";
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

/**
 * POST /api/kudos/images/sign hardening (phase 04 review round 1): exact JSON media type,
 * a 4 KB body cap (413) and at most 20 pending uploads per Sunner in a rolling 24 h (429).
 * Signing alone uploads nothing, so only kudo_image_uploads rows need cleaning (cascade).
 */
let uploader: fixtures.Sunner;
const VALID = JSON.stringify({ contentType: "image/png", size: 68 });

beforeAll(async () => {
  uploader = await fixtures.createSunner("sign-cap", "Sign Cap");
});
beforeEach(async () => {
  openWriting();
  requestCookies.clear();
  await signInToJar(requestCookies, uploader.email);
});
afterAll(async () => {
  await fixtures.cleanupSunners([uploader]);
  await closeAppDb();
});

async function sign(body: string = VALID, contentType = "application/json") {
  const response = await signImage(
    new Request("http://localhost:3000/api/kudos/images/sign", {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    }),
  );
  return { status: response.status, json: await response.json() };
}
const pendingOf = async (userId: string) =>
  (await testSql<{ count: number }[]>`
    select count(*)::int as count from public.kudo_image_uploads where uploader_id = ${userId}`)[0].count;

describe("POST /api/kudos/images/sign request hardening", () => {
  it("compares the media type exactly: parameters are fine, look-alike types are not", async () => {
    expect((await sign(VALID, "application/json; charset=utf-8")).status).toBe(200);
    expect(await sign(VALID, "application/jsonx")).toEqual({
      status: 400,
      json: { code: "VALIDATION", fieldErrors: { form: ["invalid"] } },
    });
    expect((await sign(VALID, "text/plain")).status).toBe(400);
  });

  it("answers 413 PAYLOAD_TOO_LARGE to a body over 4 KB, before parsing it", async () => {
    const padded = JSON.stringify({ contentType: "image/png", size: 68, pad: "x".repeat(4096) });
    const before = await pendingOf(uploader.id);
    expect(await sign(padded)).toEqual({ status: 413, json: { code: "PAYLOAD_TOO_LARGE" } });
    expect(await pendingOf(uploader.id)).toBe(before);
  });
});

describe("pending upload cap", () => {
  it("allows 20 pending uploads per Sunner and answers the 21st with 429 UPLOAD_LIMIT, even in a burst", async () => {
    await testSql`delete from public.kudo_image_uploads where uploader_id = ${uploader.id}`;
    const burst = await Promise.all(Array.from({ length: 21 }, () => sign()));
    expect(burst.filter((result) => result.status === 200)).toHaveLength(20);
    expect(burst.filter((result) => result.status !== 200)).toEqual([{ status: 429, json: { code: "UPLOAD_LIMIT" } }]);
    expect(await pendingOf(uploader.id)).toBe(20);
    expect(await sign()).toEqual({ status: 429, json: { code: "UPLOAD_LIMIT" } });

    // Rows older than the 24 h window stop counting, so an abandoned upload never locks a Sunner out.
    await testSql`
      update public.kudo_image_uploads set created_at = now() - interval '25 hours'
      where storage_path = (select storage_path from public.kudo_image_uploads where uploader_id = ${uploader.id} limit 1)`;
    expect((await sign()).status).toBe(200);
    expect(await pendingOf(uploader.id)).toBe(21);
  });

  it("counts each Sunner separately", async () => {
    const other = await fixtures.createSunner("sign-cap-other", "Sign Cap Other");
    try {
      requestCookies.clear();
      await signInToJar(requestCookies, other.email);
      expect((await sign()).status).toBe(200);
    } finally {
      await fixtures.cleanupSunners([other]);
    }
  });
});
