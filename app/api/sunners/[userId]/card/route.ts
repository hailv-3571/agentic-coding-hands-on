import type { NextRequest } from "next/server";
import { requestLocale } from "@/features/kudos-authoring/server/request-locale";
import { kudoErrorResponse, requireApiSunner } from "@/features/kudos-authoring/server/require-api-sunner";
import { getSunnerCard } from "@/features/profile/server/sunner-card-query";

type SunnerCardRouteContext = { params: Promise<{ userId: string }> };

/**
 * GET /api/sunners/{userId}/card — the avatar hover card (F012 A5): 200 `SunnerCardView`
 * `{ id, fullName, departmentName, heroTier, kudosReceived, kudosSent, canSendKudo }` and nothing
 * else (no email, role, avatar, Kudo or sender data). 401 UNAUTHENTICATED · 403 ONBOARDING_REQUIRED
 * · 404 NOT_FOUND (malformed or unknown id) · 500 UNEXPECTED. The client caches it per page;
 * `Cache-Control: private, no-store` keeps every other layer from storing a count.
 */
export async function GET(request: NextRequest, context: SunnerCardRouteContext) {
  const response = await loadCard(request, context);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function loadCard(request: NextRequest, { params }: SunnerCardRouteContext): Promise<Response> {
  const sunner = await requireApiSunner();
  if (sunner instanceof Response) return sunner;
  const { userId } = await params;

  try {
    const card = await getSunnerCard(sunner.userId, userId, requestLocale(request));
    return card ? Response.json(card) : kudoErrorResponse("NOT_FOUND");
  } catch (error) {
    console.error("[profile] loading a sunner card failed", error);
    return kudoErrorResponse("UNEXPECTED");
  }
}
