import type { z } from "zod";

/**
 * Result contract of the Kudo write side (createKudo / updateKudo actions and the F003 route
 * handlers). Client-safe: the composer maps `code` to `kudosComposer.errors.<CODE>` and each
 * field error key to `kudosComposer.errors.fields.<key>` (messages/*.json).
 *
 * HTTP status per code: route handlers answer with it; Server Actions always travel as HTTP 200
 * and carry the code in-band, the status column documents the meaning.
 */
export const KUDO_ERROR_STATUS = {
  /** DEC-001: recipient, body or hashtags missing ("Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag…"). */
  MISSING_REQUIRED: 400,
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  /** Session without a chosen department (route handlers; actions redirect to the picker). */
  ONBOARDING_REQUIRED: 403,
  FORBIDDEN: 403,
  WRITING_CLOSED: 403,
  NOT_FOUND: 404,
  /** Sign route: request body over KUDO_LIMITS.SIGN_BODY_MAX_BYTES. */
  PAYLOAD_TOO_LARGE: 413,
  SELF_SEND: 422,
  RECIPIENT_INVALID: 422,
  HASHTAG_INVALID: 422,
  IMAGE_INVALID: 422,
  /** The Kudo is marked spam: editing is locked (C-17). */
  SPAM_LOCKED: 423,
  /** Sign route: KUDO_LIMITS.PENDING_UPLOADS_MAX pending uploads within the rolling window. */
  UPLOAD_LIMIT: 429,
  UNEXPECTED: 500,
} as const;

export type KudoErrorCode = keyof typeof KUDO_ERROR_STATUS;

export type KudoField =
  | "recipientId"
  | "title"
  | "body"
  | "hashtagIds"
  | "imagePaths"
  | "isAnonymous"
  | "anonymousNickname";

export const KUDO_FIELD_ERROR_KEYS = [
  "required",
  "invalid",
  "bodyTooLong",
  "titleTooLong",
  "linkScheme",
  "imageNotAllowed",
  "nicknameRequired",
  "nicknameTooLong",
  "nicknameWithoutAnonymous",
  "hashtagsTooMany",
  "hashtagsDuplicate",
  "hashtagInactive",
  "imagesTooMany",
  "imagesDuplicate",
  "imagePathInvalid",
  "imageNotOwned",
  "recipientImmutable",
  "recipientInvalid",
  "selfSend",
] as const;

export type KudoFieldErrorKey = (typeof KUDO_FIELD_ERROR_KEYS)[number];
export type KudoFieldErrors = Partial<Record<KudoField, KudoFieldErrorKey[]>>;

export type KudoWriteFailure = { ok: false; code: KudoErrorCode; fieldErrors?: KudoFieldErrors };
export type KudoWriteResult = { ok: true; id: string } | KudoWriteFailure;

const knownKeys = new Set<string>(KUDO_FIELD_ERROR_KEYS);

/** Zod issues → `{ field: [key…] }`, first path segment as the field, unknown messages → "invalid". */
export function fieldErrorsFromIssues<F extends string = KudoField>(
  issues: readonly z.core.$ZodIssue[],
): Partial<Record<F, KudoFieldErrorKey[]>> {
  const errors: Record<string, KudoFieldErrorKey[]> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    const key = (knownKeys.has(issue.message) ? issue.message : "invalid") as KudoFieldErrorKey;
    const list = (errors[field] ??= []);
    if (!list.includes(key)) list.push(key);
  }
  return errors as Partial<Record<F, KudoFieldErrorKey[]>>;
}
