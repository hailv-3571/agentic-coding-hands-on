import type { NextRequest } from "next/server";
import { z } from "zod";
import { requestLocale } from "@/features/kudos-authoring/server/request-locale";
import { kudoErrorResponse, requireApiSunner } from "@/features/kudos-authoring/server/require-api-sunner";
import { parseProfileKudosParams } from "@/features/profile/schemas/profile-kudos-request-schema";
import { listProfileKudos } from "@/features/profile/server/profile-kudos-list-service";

type ProfileKudosRouteContext = { params: Promise<{ userId: string }> };

/**
 * GET /api/profile/{userId}/kudos?direction=received|sent&cursor=<opaque> — a page of a profile's
 * KUDOS section (F012 A3): 200 `{ items: KudoCardView[], nextCursor?, counts: { received, sent? } }`,
 * 10 per page, `(created_at, id)` DESC, anonymous senders masked for every viewer. "sent" is the
 * session user's own list only (public + own spam flagged `isSpam`); for anyone else → 403.
 * 401 UNAUTHENTICATED · 403 ONBOARDING_REQUIRED / FORBIDDEN · 400 VALIDATION `{ fieldErrors }` ·
 * 404 NOT_FOUND (malformed or unknown user) · 500 UNEXPECTED. Error bodies are `{ code }` only.
 * Per-viewer data: `Cache-Control: private, no-store` on every answer.
 */
export async function GET(request: NextRequest, context: ProfileKudosRouteContext) {
  const response = await listPage(request, context);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function listPage(request: NextRequest, { params }: ProfileKudosRouteContext): Promise<Response> {
  const sunner = await requireApiSunner();
  if (sunner instanceof Response) return sunner;

  const query = parseProfileKudosParams(request.nextUrl.searchParams);
  if (!query.ok) return kudoErrorResponse("VALIDATION", { fieldErrors: query.fieldErrors });
  const { userId } = await params;
  if (!z.uuid().safeParse(userId).success) return kudoErrorResponse("NOT_FOUND");

  try {
    const result = await listProfileKudos({
      viewerId: sunner.userId,
      profileUserId: userId,
      direction: query.data.direction,
      cursor: query.data.cursor,
      locale: requestLocale(request),
    });
    if (result.status === "forbidden") return kudoErrorResponse("FORBIDDEN");
    if (result.status === "not_found") return kudoErrorResponse("NOT_FOUND");
    return Response.json(result.page);
  } catch (error) {
    console.error("[profile] listing profile kudos failed", error);
    return kudoErrorResponse("UNEXPECTED");
  }
}
