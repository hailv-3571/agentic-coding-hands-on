import type { NextRequest } from "next/server";
import { requestLocale } from "@/features/kudos-authoring/server/request-locale";
import { kudoErrorResponse, requireApiSunner } from "@/features/kudos-authoring/server/require-api-sunner";
import { KudoHighlightParamsSchema, parseKudoFeedParams } from "@/features/kudos-feed/schemas/kudo-feed-params-schema";
import { listHighlightKudos } from "@/features/kudos-feed/server/kudo-highlight-query";

/**
 * GET /api/kudos/highlight?hashtag=<uuid>&department=<uuid> — Highlight carousel (F004 A1):
 * 200 `{ items: KudoCardView[], total }` (≤ 5, hashtag AND recipient department, ranked by the
 * heart seam; absent param = "Tất cả"). 401 UNAUTHENTICATED · 403 ONBOARDING_REQUIRED ·
 * 400 VALIDATION `{ fieldErrors: { hashtag | department: ["invalid"] } }` · 500 UNEXPECTED.
 * `Cache-Control: private, no-store`.
 */
export async function GET(request: NextRequest) {
  const response = await loadHighlight(request);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function loadHighlight(request: NextRequest): Promise<Response> {
  const sunner = await requireApiSunner();
  if (sunner instanceof Response) return sunner;

  const params = parseKudoFeedParams(KudoHighlightParamsSchema, request.nextUrl.searchParams);
  if (!params.ok) return kudoErrorResponse("VALIDATION", { fieldErrors: params.fieldErrors });

  try {
    const highlight = await listHighlightKudos({
      viewerId: sunner.userId,
      locale: requestLocale(request),
      hashtagId: params.data.hashtag,
      departmentId: params.data.department,
    });
    return Response.json(highlight);
  } catch (error) {
    console.error("[kudos-feed] loading the highlight failed", error);
    return kudoErrorResponse("UNEXPECTED");
  }
}
