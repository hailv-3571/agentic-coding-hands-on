import type { NextRequest } from "next/server";
import { requestLocale } from "@/features/kudos-authoring/server/request-locale";
import { parseAdminKudoFilter } from "@/features/admin-moderation/schemas/admin-kudo-filter-schema";
import { adminApiError, requireAdminApi } from "@/features/admin-moderation/server/admin-api-guard";
import { KudoAdminQuery } from "@/features/admin-moderation/server/kudo-admin-query";

/**
 * GET /api/admin/kudos?page&sort&status&sender&receiver&from&to&q — Admin › Review content table page
 * (A1; the client's retry path for the error state). 200 `AdminKudoPage` (real senders, admin only) ·
 * 401 `unauthorized` · 403 `forbidden` (both before any param is read) · 400 `invalid_params` |
 * `invalid_date_range` · 500 `unexpected`. Every answer: `Cache-Control: private, no-store`.
 */
export async function GET(request: NextRequest) {
  const response = await listAdminKudos(request);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function listAdminKudos(request: NextRequest): Promise<Response> {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const filter = parseAdminKudoFilter(request.nextUrl.searchParams);
  if (!filter.ok) return adminApiError(400, filter.error);

  try {
    return Response.json(await KudoAdminQuery.list(filter.value, requestLocale(request)));
  } catch (error) {
    console.error("[admin-moderation] listing kudos failed", error);
    return adminApiError(500, "unexpected");
  }
}
