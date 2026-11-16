import { KUDO_LIMITS } from "@/features/kudos-authoring/kudo-authoring-limits";
import { fieldErrorsFromIssues } from "@/features/kudos-authoring/schemas/kudo-write-result";
import { KudoImageSignSchema } from "@/features/kudos-authoring/schemas/kudo-image-sign-schema";
import { signKudoImageUpload } from "@/features/kudos-authoring/server/kudo-image-upload-service";
import { KudoWriteError } from "@/features/kudos-authoring/server/kudo-write-error";
import { readCappedJsonBody } from "@/features/kudos-authoring/server/read-capped-json-body";
import { kudoErrorResponse, requireApiSunner } from "@/features/kudos-authoring/server/require-api-sunner";
import { isEventWritingOpen } from "@/shared/config/event-window";

/**
 * POST /api/kudos/images/sign — body `{ contentType, size }` (JSON) → 200 `{ path, token, signedUrl }`
 * for the browser's `uploadToSignedUrl`. 401 no session · 403 WRITING_CLOSED / ONBOARDING_REQUIRED ·
 * 400 VALIDATION (media type other than `application/json`, malformed body, type outside
 * jpeg/png/webp, size outside 1..5 MB) · 413 PAYLOAD_TOO_LARGE (body > 4 KB, never parsed) ·
 * 429 UPLOAD_LIMIT (20 pending uploads in 24 h) · 500 UNEXPECTED.
 * Requiring a JSON content type keeps cross-site "simple" form posts out.
 */
export async function POST(request: Request) {
  const sunner = await requireApiSunner();
  if (sunner instanceof Response) return sunner;
  if (!isEventWritingOpen(new Date())) return kudoErrorResponse("WRITING_CLOSED");

  const body = await readCappedJsonBody(request, KUDO_LIMITS.SIGN_BODY_MAX_BYTES);
  if (!body.ok && body.reason === "too_large") return kudoErrorResponse("PAYLOAD_TOO_LARGE");
  const parsed = KudoImageSignSchema.safeParse(body.ok ? body.value : undefined);
  if (!parsed.success) {
    return kudoErrorResponse("VALIDATION", { fieldErrors: fieldErrorsFromIssues<string>(parsed.error.issues) });
  }

  try {
    return Response.json(await signKudoImageUpload(sunner.userId, parsed.data.contentType));
  } catch (error) {
    if (error instanceof KudoWriteError) return kudoErrorResponse(error.code);
    console.error("[kudos] signing an image upload failed", error);
    return kudoErrorResponse("UNEXPECTED");
  }
}
