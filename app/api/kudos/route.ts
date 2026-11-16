import type { NextRequest } from "next/server";
import { requestLocale } from "@/features/kudos-authoring/server/request-locale";
import { kudoErrorResponse, requireApiSunner } from "@/features/kudos-authoring/server/require-api-sunner";
import { KudoFeedListParamsSchema, parseKudoFeedParams } from "@/features/kudos-feed/schemas/kudo-feed-params-schema";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";

/**
 * GET /api/kudos?cursor=<opaque> — All Kudos "Tải thêm" (F004 A2): 200 `{ items: KudoCardView[],
 * nextCursor?: string }`, 10 per page, newest first, public only, anonymous senders masked.
 * 401 UNAUTHENTICATED · 403 ONBOARDING_REQUIRED · 400 VALIDATION `{ fieldErrors: { cursor: ["invalid"] } }`
 * · 500 UNEXPECTED. Per-viewer data (isOwner, signed image URLs): `Cache-Control: private, no-store`.
 */
export async function GET(request: NextRequest) {
  const response = await listKudosPage(request);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function listKudosPage(request: NextRequest): Promise<Response> {
  const sunner = await requireApiSunner();
  if (sunner instanceof Response) return sunner;

  const params = parseKudoFeedParams(KudoFeedListParamsSchema, request.nextUrl.searchParams);
  if (!params.ok) return kudoErrorResponse("VALIDATION", { fieldErrors: params.fieldErrors });

  try {
    const page = await KudoPublicQuery.list({
      viewerId: sunner.userId,
      locale: requestLocale(request),
      cursor: params.data.cursor,
    });
    return Response.json(page);
  } catch (error) {
    console.error("[kudos-feed] listing kudos failed", error);
    return kudoErrorResponse("UNEXPECTED");
  }
}
