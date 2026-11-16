import type { NextRequest } from "next/server";
import { listActiveHashtags } from "@/features/kudos-authoring/server/hashtag-list-query";
import { requestLocale } from "@/features/kudos-authoring/server/request-locale";
import { kudoErrorResponse, requireApiSunner } from "@/features/kudos-authoring/server/require-api-sunner";

/**
 * GET /api/hashtags → 200 `[{ id, label }]`: active seeded hashtags in seed order, label in the
 * request locale (NEXT_LOCALE cookie, then Accept-Language, then vi).
 * 401 no session · 403 ONBOARDING_REQUIRED · 500 UNEXPECTED.
 */
export async function GET(request: NextRequest) {
  const sunner = await requireApiSunner();
  if (sunner instanceof Response) return sunner;

  try {
    return Response.json(await listActiveHashtags(requestLocale(request)));
  } catch (error) {
    console.error("[kudos] listing hashtags failed", error);
    return kudoErrorResponse("UNEXPECTED");
  }
}
