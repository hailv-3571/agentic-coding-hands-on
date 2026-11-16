import { describe, expect, it } from "vitest";
import { isJsonMediaType, readCappedJsonBody } from "@/features/kudos-authoring/server/read-capped-json-body";

/** Reviewer S1 (actions): exact `application/json` media type, and a byte cap enforced before parsing. */
const URL = "http://localhost:3000/api/kudos/images/sign";
const post = (body: BodyInit, headers: Record<string, string> = { "content-type": "application/json" }) =>
  new Request(URL, { method: "POST", headers, body, duplex: "half" } as RequestInit);

/** A body streamed in chunks, with no Content-Length (chunked transfer). */
function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

describe("isJsonMediaType", () => {
  it.each(["application/json", "application/json; charset=utf-8", "Application/JSON ;charset=UTF-8", " application/json "])(
    "accepts %j",
    (value) => expect(isJsonMediaType(value)).toBe(true),
  );

  it.each([null, "", "application/jsonx", "application/json-patch+json", "text/json", "application/x-www-form-urlencoded", "text/plain;application/json"])(
    "rejects %j",
    (value) => expect(isJsonMediaType(value)).toBe(false),
  );
});

describe("readCappedJsonBody", () => {
  it("parses a small JSON body, and yields undefined for invalid or empty JSON", async () => {
    expect(await readCappedJsonBody(post('{"size":1}'), 64)).toEqual({ ok: true, value: { size: 1 } });
    expect(await readCappedJsonBody(post("{not json"), 64)).toEqual({ ok: true, value: undefined });
    expect(await readCappedJsonBody(post(""), 64)).toEqual({ ok: true, value: undefined });
  });

  it("refuses another media type without reading the body", async () => {
    const request = post('{"size":1}', { "content-type": "application/jsonx" });
    expect(await readCappedJsonBody(request, 64)).toEqual({ ok: false, reason: "unsupported_media_type" });
    expect(request.bodyUsed).toBe(false);
  });

  it("refuses a declared Content-Length above the cap without reading the body", async () => {
    const request = post("{}", { "content-type": "application/json", "content-length": "65" });
    expect(await readCappedJsonBody(request, 64)).toEqual({ ok: false, reason: "too_large" });
    expect(request.bodyUsed).toBe(false);
  });

  it("stops reading a streamed body once it passes the cap, whatever Content-Length claims", async () => {
    expect(await readCappedJsonBody(post(streamOf('{"pad":"', "x".repeat(60), '"}')), 64)).toEqual({ ok: false, reason: "too_large" });
    expect(await readCappedJsonBody(post(streamOf('{"a":', "1}")), 64)).toEqual({ ok: true, value: { a: 1 } });
  });

  it("counts bytes, not characters (multi-byte UTF-8)", async () => {
    const body = JSON.stringify({ t: "đ".repeat(30) }); // 38 characters, 68 bytes
    expect(await readCappedJsonBody(post(body), 64)).toEqual({ ok: false, reason: "too_large" });
    expect(await readCappedJsonBody(post(body), 68)).toEqual({ ok: true, value: { t: "đ".repeat(30) } });
  });
});
