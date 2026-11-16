import { z } from "zod";

/**
 * Opaque feed cursor (phase 05, C-05: the ONE cursor of KudoPublicQuery, reused by phase 12):
 * base64url of `{"c": <created_at>, "i": <id>}` for the last row of a page. `c` keeps Postgres'
 * microsecond precision (`2026-11-16T03:04:05.123456Z`): a JS Date would round it to
 * milliseconds and re-serve rows inside the same millisecond. Ordering is
 * `(created_at DESC, id DESC)`; the next page is `(created_at, id) < (c, i)`.
 * Decoding is strict: anything the encoder would not have written exactly is rejected.
 */
export type KudoFeedCursor = { createdAt: string; id: string };

export const KUDO_FEED_CURSOR_MAX_LENGTH = 200;

/** Thrown by KudoPublicQuery.list for a cursor that does not decode (routes answer 400 first). */
export class InvalidKudoFeedCursorError extends Error {
  constructor() {
    super("invalid kudo feed cursor");
    this.name = "InvalidKudoFeedCursorError";
  }
}

const BASE64URL = /^[A-Za-z0-9_-]+$/;
const MICROSECOND_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

/** A real calendar instant: the millisecond prefix survives a Date round trip unchanged. */
function isRealInstant(value: string): boolean {
  const millisecondIso = `${value.slice(0, 23)}Z`;
  const time = Date.parse(millisecondIso);
  return Number.isFinite(time) && new Date(time).toISOString() === millisecondIso;
}

/**
 * Postgres has no year 0000 (`::timestamptz` raises "out of range", i.e. a 500) while JS accepts
 * it. Lexicographic order is chronological for the fixed-width format the regex enforces.
 */
const isPostgresYear = (value: string) => value >= "0001-01-01";

const CursorPayloadSchema = z.strictObject({
  c: z.string().regex(MICROSECOND_ISO).refine(isRealInstant).refine(isPostgresYear),
  i: z.uuid(),
});

export function encodeKudoFeedCursor({ createdAt, id }: KudoFeedCursor): string {
  return Buffer.from(JSON.stringify({ c: createdAt, i: id }), "utf8").toString("base64url");
}

/** The cursor, or null when `raw` is not exactly an encoder output. */
export function decodeKudoFeedCursor(raw: string): KudoFeedCursor | null {
  if (raw.length === 0 || raw.length > KUDO_FEED_CURSOR_MAX_LENGTH || !BASE64URL.test(raw)) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const parsed = CursorPayloadSchema.safeParse(payload);
  if (!parsed.success) return null;
  const cursor = { createdAt: parsed.data.c, id: parsed.data.i };
  // One cursor, one spelling: reject re-ordered keys, whitespace or stray base64 bits.
  return encodeKudoFeedCursor(cursor) === raw ? cursor : null;
}
