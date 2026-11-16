import type { NextRequest } from "next/server";
import { requestLocale } from "@/features/kudos-authoring/server/request-locale";
import { kudoErrorResponse, requireApiSunner } from "@/features/kudos-authoring/server/require-api-sunner";
import { parseSunnerSearchParams } from "@/features/sunner-search/schemas/sunner-search-params-schema";
import { searchSunners } from "@/features/sunner-search/server/sunner-search-query";

/**
 * GET /api/sunners/search?q=<1..50>&limit=<1..20, default 10>&excludeSelf=<true|false, default false>
 * (C-06, the one Sunner search) → 200 SunnerOption[] ordered by name.
 * 401 no session · 403 ONBOARDING_REQUIRED · 400 VALIDATION `{ fieldErrors }` · 500 UNEXPECTED.
 */
export async function GET(request: NextRequest) {
  const sunner = await requireApiSunner();
  if (sunner instanceof Response) return sunner;

  const params = parseSunnerSearchParams(request.nextUrl.searchParams);
  if (!params.ok) return kudoErrorResponse("VALIDATION", { fieldErrors: params.fieldErrors });

  try {
    const { q, limit, excludeSelf } = params.data;
    return Response.json(await searchSunners(q, { viewerId: sunner.userId, limit, excludeSelf, locale: requestLocale(request) }));
  } catch (error) {
    console.error("[sunner-search] search failed", error);
    return kudoErrorResponse("UNEXPECTED");
  }
}
