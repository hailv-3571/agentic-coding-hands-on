import { sql } from "drizzle-orm";
import type { DbTx } from "@/shared/db/client";
import { departments } from "@/shared/db/schema";

/**
 * Departments, verbatim from the Live board "Phòng ban" filter (Figma 721:5684).
 * BTC has not confirmed the final list: edit here and re-run `npm run db:seed`
 * (upsert by `code`, so existing ids — and profiles pointing at them — are kept).
 */
export const departmentSeeds = [
  { code: "CEVC1", nameVi: "CEVC1", nameEn: "CEVC1", sortOrder: 1 },
  { code: "CEVC2", nameVi: "CEVC2", nameEn: "CEVC2", sortOrder: 2 },
  { code: "CEVC3", nameVi: "CEVC3", nameEn: "CEVC3", sortOrder: 3 },
  { code: "CEVC4", nameVi: "CEVC4", nameEn: "CEVC4", sortOrder: 4 },
  { code: "OPD", nameVi: "OPD", nameEn: "OPD", sortOrder: 5 },
  { code: "Infra", nameVi: "Infra", nameEn: "Infra", sortOrder: 6 },
] as const satisfies readonly (typeof departments.$inferInsert)[];

/** Upserts every seed department; returns the number of rows written. */
export async function seedDepartments(tx: DbTx): Promise<number> {
  const rows = await tx
    .insert(departments)
    .values([...departmentSeeds])
    .onConflictDoUpdate({
      target: departments.code,
      set: {
        nameVi: sql`excluded.name_vi`,
        nameEn: sql`excluded.name_en`,
        sortOrder: sql`excluded.sort_order`,
      },
    })
    .returning({ id: departments.id });
  return rows.length;
}
