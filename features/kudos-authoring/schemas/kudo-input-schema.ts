import { z } from "zod";
import { KUDO_IMAGE_PATH_PATTERN, KUDO_LIMITS, kudoTextLength } from "../kudo-authoring-limits";
import { findDisallowedLinks, findMarkdownImages } from "./kudo-body-link-policy";
import { fieldErrorsFromIssues, type KudoFieldErrors } from "./kudo-write-result";

/**
 * Kudo create/update input (F003), shared by the composer and the Server Actions (FR-603: the
 * server re-runs the same schema). Issue messages are field error keys (kudo-write-result.ts).
 * Sender and status never come from the client: unknown keys are stripped.
 * Client-safe: no server imports.
 */

const missingOr = (fallback: string) => (issue: { input?: unknown }) =>
  issue.input === undefined || issue.input === null ? "required" : fallback;
const isUuid = (value: string) => z.uuid().safeParse(value).success;
const isUnique = (values: readonly string[]) => new Set(values).size === values.length;
const withinChars = (max: number) => (value: string) => kudoTextLength(value) <= max;
/** A browser form submits textarea newlines as CRLF; count and store them as one LF. */
const normalizeNewlines = (value: string) => value.replace(/\r\n?/g, "\n");

const recipientId = z
  .string({ error: missingOr("invalid") })
  .trim()
  .min(1, { error: "required" })
  .refine((value) => value === "" || isUuid(value), { error: "invalid" });

const editableShape = {
  /** Danh hiệu: optional (decision-log 2026-11-15), blank → null. */
  title: z
    .string({ error: "invalid" })
    .trim()
    .refine(withinChars(KUDO_LIMITS.TITLE_MAX), { error: "titleTooLong" })
    .nullish()
    .transform((value) => value || null),
  /** Raw restricted Markdown, 1–1,000 characters after trim; links must be http(s); no images. */
  body: z
    .string({ error: missingOr("invalid") })
    .overwrite(normalizeNewlines)
    .trim()
    .min(1, { error: "required" })
    // abort: the link scan only ever sees ≤ 1,000 characters (an Action body can be ~1 MB).
    .refine(withinChars(KUDO_LIMITS.BODY_MAX), { error: "bodyTooLong", abort: true })
    .refine((value) => findDisallowedLinks(value).length === 0, { error: "linkScheme" })
    .refine((value) => findMarkdownImages(value).length === 0, { error: "imageNotAllowed" }),
  hashtagIds: z
    .array(z.uuid({ error: "invalid" }), { error: missingOr("invalid") })
    .min(KUDO_LIMITS.HASHTAGS_MIN, { error: "required" })
    .max(KUDO_LIMITS.HASHTAGS_MAX, { error: "hashtagsTooMany" })
    .refine(isUnique, { error: "hashtagsDuplicate" }),
  /** Storage paths from POST /api/kudos/images/sign, in display order (position 0..4). */
  imagePaths: z
    .array(z.string({ error: "imagePathInvalid" }).regex(KUDO_IMAGE_PATH_PATTERN, { error: "imagePathInvalid" }), {
      error: "invalid",
    })
    .max(KUDO_LIMITS.IMAGES_MAX, { error: "imagesTooMany" })
    .refine(isUnique, { error: "imagesDuplicate" })
    .default([]),
  isAnonymous: z.boolean({ error: "invalid" }).default(false),
  /** Required (1–30) when anonymous, null otherwise; DB CHECK `kudos_anonymous_nickname`. */
  anonymousNickname: z
    .string({ error: "invalid" })
    .trim()
    .refine(withinChars(KUDO_LIMITS.NICKNAME_MAX), { error: "nicknameTooLong" })
    .nullish()
    .transform((value) => value || null),
};

/**
 * Cross-field nickname rule. Zod skips object refinements after an aborting child issue, so the
 * field checks above never abort: the form gets every field error in one round.
 */
function checkAnonymity(value: { isAnonymous?: unknown; anonymousNickname?: unknown }, ctx: z.RefinementCtx) {
  const raw = value.anonymousNickname;
  const hasNickname = typeof raw === "string" && raw.trim().length > 0;
  if (value.isAnonymous === true && !hasNickname) {
    ctx.addIssue({ code: "custom", path: ["anonymousNickname"], message: "nicknameRequired" });
  }
  if (value.isAnonymous !== true && hasNickname) {
    ctx.addIssue({ code: "custom", path: ["anonymousNickname"], message: "nicknameWithoutAnonymous" });
  }
}

export const KudoInputSchema = z.object({ recipientId, ...editableShape }).superRefine(checkAnonymity);

/** Edit: every field except the recipient, which is immutable (a value is rejected, not ignored). */
export const KudoUpdateSchema = z
  .object({ recipientId: z.undefined({ error: "recipientImmutable" }).optional(), ...editableShape })
  .superRefine(checkAnonymity);

/** What the composer sends. */
export type KudoCreateInput = z.input<typeof KudoInputSchema>;
export type KudoUpdateInput = z.input<typeof KudoUpdateSchema>;
/** Normalized values after parsing (what the server writes). */
export type KudoCreateData = z.output<typeof KudoInputSchema>;
export type KudoUpdateData = z.output<typeof KudoUpdateSchema>;

const DEC_001_FIELDS = new Set(["recipientId", "body", "hashtagIds"]);

export type KudoInputParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "MISSING_REQUIRED" | "VALIDATION"; fieldErrors: KudoFieldErrors };

/** Parses `input`; a missing recipient/body/hashtag makes the whole failure DEC-001 (MISSING_REQUIRED). */
export function parseKudoInput<S extends typeof KudoInputSchema | typeof KudoUpdateSchema>(
  schema: S,
  input: unknown,
): KudoInputParseResult<z.output<S>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data as z.output<S> };
  const missingRequired = parsed.error.issues.some(
    (issue) => issue.message === "required" && DEC_001_FIELDS.has(String(issue.path[0])),
  );
  return {
    ok: false,
    code: missingRequired ? "MISSING_REQUIRED" : "VALIDATION",
    fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
  };
}
