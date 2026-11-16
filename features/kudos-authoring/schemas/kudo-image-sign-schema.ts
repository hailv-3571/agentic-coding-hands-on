import { z } from "zod";
import { KUDO_IMAGE_CONTENT_TYPES, KUDO_LIMITS } from "../kudo-authoring-limits";

/**
 * Body of POST /api/kudos/images/sign: the file's declared type and size, checked before a
 * path is issued (early, friendly rejection). The bucket enforces the same type list and the
 * 5 MB cap on the actual upload. Client-safe.
 */
export const KudoImageSignSchema = z.object({
  contentType: z.enum(KUDO_IMAGE_CONTENT_TYPES, { error: "invalid" }),
  size: z
    .number({ error: "invalid" })
    .int({ error: "invalid" })
    .min(1, { error: "invalid" })
    .max(KUDO_LIMITS.IMAGE_MAX_BYTES, { error: "invalid" }),
});

export type KudoImageSignInput = z.input<typeof KudoImageSignSchema>;

/** What the browser needs for `storage.from(KUDO_IMAGE_BUCKET).uploadToSignedUrl(path, token, file)`. */
export type KudoImageUploadTicket = { path: string; token: string; signedUrl: string };
