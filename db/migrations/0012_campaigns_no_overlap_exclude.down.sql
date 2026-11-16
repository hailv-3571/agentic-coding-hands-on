-- Rollback of 0012_campaigns_no_overlap_exclude.sql. Run the *.down.sql files newest first
-- (0012, 0011, 0010), then delete the matching rows from drizzle.__drizzle_migrations
-- (created_at = the journal entry's `when`). Verified by tests/integration/admin-campaigns/
-- hearts-and-campaigns-migrations.test.ts inside a rolled-back transaction.
ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "campaigns_no_overlap";
