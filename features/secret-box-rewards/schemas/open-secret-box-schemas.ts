import { z } from "zod";

/**
 * POST /api/secret-boxes/open request contract (FR-402, C-18: a route handler because it depends on
 * a header). Client-safe: the modal sends a fresh `crypto.randomUUID()` per click and reuses it when
 * retrying that click; the server answers 400 `invalid_idempotency_key` for anything but a UUID v4.
 */
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

const idempotencyKeySchema = z.uuidv4().transform((key) => key.toLowerCase());

/** The normalised key, or null when the header is missing or not a UUID v4. */
export function parseIdempotencyKey(value: string | null): string | null {
  const parsed = idempotencyKeySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
