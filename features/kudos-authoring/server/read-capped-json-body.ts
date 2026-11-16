import "server-only";

/**
 * Reads a small JSON request body for the F003 route handlers (review S1): the media type must
 * be exactly `application/json` (parameters such as `charset` allowed), and at most `maxBytes`
 * are read — checked on the declared Content-Length first, then while streaming, since the
 * header may be absent (chunked) or wrong. Invalid JSON is `value: undefined`; the caller's
 * schema then reports it like any other malformed body.
 */
export type CappedJsonBody =
  | { ok: true; value: unknown }
  | { ok: false; reason: "unsupported_media_type" | "too_large" };

/** True for `application/json` with optional parameters, case-insensitive; nothing else. */
export function isJsonMediaType(contentType: string | null): boolean {
  const essence = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  return essence === "application/json";
}

export async function readCappedJsonBody(request: Request, maxBytes: number): Promise<CappedJsonBody> {
  if (!isJsonMediaType(request.headers.get("content-type"))) return { ok: false, reason: "unsupported_media_type" };
  if (Number(request.headers.get("content-length")) > maxBytes) return { ok: false, reason: "too_large" };

  const text = await readTextUpTo(request.body, maxBytes);
  if (text === null) return { ok: false, reason: "too_large" };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: true, value: undefined };
  }
}

/** UTF-8 text of `body`, or null as soon as it exceeds `maxBytes` (the rest is never read). */
async function readTextUpTo(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<string | null> {
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    bytes += chunk.value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
  return text + decoder.decode();
}
