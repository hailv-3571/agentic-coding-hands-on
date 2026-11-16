import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadKudoImage } from "@/features/kudos-authoring/components/kudo-image-upload-client";

// The browser env module parses NEXT_PUBLIC_* at import; the unit project has none. A failed sign
// returns before any Storage call, so the Supabase client is never created here.
vi.mock("@/shared/config/public-env", () => ({
  publicEnv: { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" },
}));

const png = () => new File([new Uint8Array([137, 80, 78, 71])], "a.png", { type: "image/png" });

function answerSign(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));
}

/** POST /api/kudos/images/sign failures (contract § 3) → the code the image picker renders. */
describe("uploadKudoImage sign failures", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [429, { code: "UPLOAD_LIMIT" }, "UPLOAD_LIMIT"],
    [413, { code: "PAYLOAD_TOO_LARGE" }, "UNEXPECTED"],
    [401, { code: "unauthorized" }, "UNAUTHENTICATED"],
    [403, { code: "WRITING_CLOSED" }, "WRITING_CLOSED"],
    [400, { code: "VALIDATION", fieldErrors: { size: ["invalid"] } }, "IMAGE_INVALID"],
    [500, { code: "UNEXPECTED" }, "UNEXPECTED"],
  ])("maps HTTP %i %j to %s", async (status, body, code) => {
    answerSign(status, body);
    await expect(uploadKudoImage(png())).resolves.toEqual({ ok: false, code });
  });
});
