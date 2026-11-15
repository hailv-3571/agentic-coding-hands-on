import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";

type BucketRow = {
  public: boolean;
  file_size_limit: string;
  allowed_mime_types: string[];
};

const MIGRATION_SQL = readFileSync(
  new URL("../../../db/migrations/0003_storage_kudo_images_bucket.sql", import.meta.url),
  "utf8",
);

function expectKudoImageSettings(bucket: BucketRow | undefined) {
  expect(bucket).toBeDefined();
  expect(bucket!.public).toBe(false);
  expect(Number(bucket!.file_size_limit)).toBe(5 * 1024 * 1024);
  expect([...bucket!.allowed_mime_types].sort()).toEqual([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
}

describe("storage bucket kudo-images (D012)", () => {
  it("is private, capped at 5 MB and limited to JPG/PNG/WEBP", async () => {
    const [bucket] = await testSql<BucketRow[]>`
      select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'kudo-images'`;
    expectKudoImageSettings(bucket);
  });

  it("corrects a pre-existing public or misconfigured bucket when the migration re-runs", async () => {
    const corrected = await withRollback(async (tx) => {
      await tx.execute(sql`
        update storage.buckets
        set public = true, file_size_limit = 1, allowed_mime_types = array['text/html']
        where id = 'kudo-images'`);
      await tx.execute(sql.raw(MIGRATION_SQL));
      const rows = await tx.execute<BucketRow>(sql`
        select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'kudo-images'`);
      return rows[0];
    });
    expectKudoImageSettings(corrected);
  });
});
