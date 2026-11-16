import "server-only";
import type { KudoErrorCode, KudoFieldErrors, KudoWriteFailure } from "../schemas/kudo-write-result";

/**
 * Expected rejection raised inside a write transaction (recipient gone, hashtag inactive,
 * image not owned, not owner, spam-locked…). Throwing it rolls the transaction back; the
 * action turns it into its in-band result. Anything else is unexpected and only logged.
 */
export class KudoWriteError extends Error {
  constructor(
    readonly code: KudoErrorCode,
    readonly fieldErrors?: KudoFieldErrors,
  ) {
    super(code);
    this.name = "KudoWriteError";
  }
}

export function kudoWriteFailureOf(error: unknown, operation: string): KudoWriteFailure {
  if (error instanceof KudoWriteError) {
    return error.fieldErrors ? { ok: false, code: error.code, fieldErrors: error.fieldErrors } : { ok: false, code: error.code };
  }
  console.error(`[kudos] ${operation} failed`, error);
  return { ok: false, code: "UNEXPECTED" };
}
