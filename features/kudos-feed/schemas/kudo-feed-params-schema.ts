import { z } from "zod";
import { decodeKudoFeedCursor, KUDO_FEED_CURSOR_MAX_LENGTH } from "../server/kudo-feed-cursor";

/**
 * Query params of the F004 data routes. Absent key = default ("Tất cả", first page); a key that is
 * present but empty or malformed is `invalid` (→ 400 VALIDATION `{ fieldErrors }`), as in
 * GET /api/sunners/search. Unknown keys are ignored. Server-side only (the cursor check uses Buffer).
 *   GET /api/kudos?cursor=<opaque ≤ 200>
 *   GET /api/kudos/highlight?hashtag=<uuid>&department=<uuid>
 */
const cursor = z
  .string()
  .max(KUDO_FEED_CURSOR_MAX_LENGTH, { error: "invalid" })
  .refine((raw) => decodeKudoFeedCursor(raw) !== null, { error: "invalid" });
const uuid = z.uuid({ error: "invalid" });

export const KudoFeedListParamsSchema = z.object({ cursor: cursor.optional() });
export const KudoHighlightParamsSchema = z.object({ hashtag: uuid.optional(), department: uuid.optional() });

export type KudoFeedFieldErrors = Record<string, "invalid"[]>;
export type KudoFeedParamsResult<T> = { ok: true; data: T } | { ok: false; fieldErrors: KudoFeedFieldErrors };

/** Reads only the schema's keys from `params` (first value wins) and validates them. */
export function parseKudoFeedParams<T extends z.ZodObject>(
  schema: T,
  params: URLSearchParams,
): KudoFeedParamsResult<z.output<T>> {
  const raw = Object.fromEntries(
    Object.keys(schema.shape).flatMap((key) => {
      const value = params.get(key);
      return value === null ? [] : [[key, value]];
    }),
  );
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const fieldErrors: KudoFeedFieldErrors = {};
  for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = ["invalid"];
  return { ok: false, fieldErrors };
}
