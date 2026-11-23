import type { NextRequest } from "next/server";
import { adminCsvFilename } from "@/shared/admin/admin-csv-filename";
import { assertWithinExportLimit, ExportLimitExceededError } from "@/shared/admin/export-limit";
import { env } from "@/shared/config/env";
import { adminApiError, requireAdminApi } from "@/features/admin-moderation/server/admin-api-guard";
import { parseUserListParams } from "@/features/admin-users/schemas/user-list-params-schema";
import { UserAdminQuery } from "@/features/admin-users/server/user-admin-query";
import { serializeAdminUserCsv } from "@/features/admin-users/server/user-export-columns";

/**
 * GET /api/admin/users/export?<same params as /admin/users> — CSV of EVERY row of the current filter in
 * table order (F014 A4, FR-403, BR-004; `page` is ignored). One bounded read of EXPORT_MAX_ROWS + 1 rows:
 * getting the extra row → 422 `export_too_large`, no file (DEC-002). 200 `text/csv` attachment
 * `users-{yyyyMMdd-HHmm}.csv` (ADMIN_TIMEZONE), BOM + formula guard via the phase 01 serializer (FR-603).
 * 401 / 403 before any param is read (phase 08 admin API guard); 400 `invalid_params` for anything the
 * table refuses (q over 100 characters included). Every answer: `Cache-Control: private, no-store`.
 */
export async function GET(request: NextRequest) {
  const response = await exportAdminUsers(request);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function exportAdminUsers(request: NextRequest): Promise<Response> {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const filter = parseUserListParams(request.nextUrl.searchParams);
  if (!filter.ok) return adminApiError(400, "invalid_params");

  try {
    const rows = await UserAdminQuery.listForExport(filter.value, "vi", env.EXPORT_MAX_ROWS + 1);
    assertWithinExportLimit(rows.length);
    return new Response(serializeAdminUserCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${adminCsvFilename("users", new Date())}"`,
      },
    });
  } catch (error) {
    if (error instanceof ExportLimitExceededError) return adminApiError(422, "export_too_large");
    console.error("[admin-users] exporting users failed", error);
    return adminApiError(500, "unexpected");
  }
}
