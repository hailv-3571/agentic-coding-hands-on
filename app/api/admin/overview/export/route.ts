import type { NextRequest } from "next/server";
import { adminCsvFilename } from "@/shared/admin/admin-csv-filename";
import { adminApiError, requireAdminApi } from "@/features/admin-moderation/server/admin-api-guard";
import { parseOverviewParams } from "@/features/admin-overview/schemas/overview-params-schema";
import { serializeOverviewCsv } from "@/features/admin-overview/server/overview-export-columns";
import { UnitStatsQuery } from "@/features/admin-overview/server/unit-stats-query";

/**
 * GET /api/admin/overview/export?from&to — the Overview table for the same range (F015 A2, FR-402): the
 * same `UnitStatsQuery` as the page, so file and table never differ; "All" first, then the units in
 * table order. 200 `text/csv` attachment `overview-{yyyyMMdd-HHmm}.csv` (ADMIN_TIMEZONE), BOM + formula
 * guard (FR-602). 401 / 403 before any param is read; 400 `invalid_date_range` / `invalid_params` like
 * the page. Labels are the table's; unassigned is "Chưa gán đơn vị". Every answer is `private, no-store`.
 */
export async function GET(request: NextRequest) {
  const response = await exportOverview(request);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function exportOverview(request: NextRequest): Promise<Response> {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const params = parseOverviewParams(request.nextUrl.searchParams);
  if (!params.ok) return adminApiError(400, params.error);

  try {
    const table = await UnitStatsQuery.forRange(params.range, "vi");
    return new Response(serializeOverviewCsv(table), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${adminCsvFilename("overview", new Date())}"`,
      },
    });
  } catch (error) {
    console.error("[admin-overview] exporting unit statistics failed", error);
    return adminApiError(500, "unexpected");
  }
}
