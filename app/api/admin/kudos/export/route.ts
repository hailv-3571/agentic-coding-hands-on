import type { NextRequest } from "next/server";
import { assertWithinExportLimit, ExportLimitExceededError } from "@/shared/admin/export-limit";
import { env } from "@/shared/config/env";
import { parseAdminKudoFilter } from "@/features/admin-moderation/schemas/admin-kudo-filter-schema";
import { adminApiError, requireAdminApi } from "@/features/admin-moderation/server/admin-api-guard";
import { adminKudoExportFilename, serializeAdminKudoCsv } from "@/features/admin-moderation/server/admin-kudo-export";
import { KudoAdminQuery } from "@/features/admin-moderation/server/kudo-admin-query";

/**
 * GET /api/admin/kudos/export?<same params as the table> — CSV of EVERY row of the current filter in
 * table order (A4, FR-405; `page` is ignored). One bounded read of EXPORT_MAX_ROWS + 1 rows: getting
 * the extra row → 422 `export_too_large`, no file (DEC-002), so rows inserted while exporting can never
 * push the file past the limit (review S1). 200 `text/csv` attachment `kudos-{yyyyMMdd-HHmm}.csv`
 * (ADMIN_TIMEZONE), BOM + formula guard via the phase 01 serializer. 401 / 403 before any param is
 * read, 400 like the table. Every answer: `Cache-Control: private, no-store`. Labels are Vietnamese.
 */
export async function GET(request: NextRequest) {
  const response = await exportAdminKudos(request);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function exportAdminKudos(request: NextRequest): Promise<Response> {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const filter = parseAdminKudoFilter(request.nextUrl.searchParams);
  if (!filter.ok) return adminApiError(400, filter.error);

  try {
    const rows = await KudoAdminQuery.listForExport(filter.value, "vi", env.EXPORT_MAX_ROWS + 1);
    assertWithinExportLimit(rows.length);
    return new Response(serializeAdminKudoCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${adminKudoExportFilename(new Date())}"`,
      },
    });
  } catch (error) {
    if (error instanceof ExportLimitExceededError) return adminApiError(422, "export_too_large");
    console.error("[admin-moderation] exporting kudos failed", error);
    return adminApiError(500, "unexpected");
  }
}
