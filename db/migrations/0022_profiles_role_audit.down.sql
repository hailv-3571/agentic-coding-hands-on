-- Rollback of 0022_profiles_role_audit.sql, then delete its row from drizzle.__drizzle_migrations
-- (created_at = the journal entry's `when`). Run with the pre-phase-14 app code deployed (the role
-- service writes these columns). Roles already changed stay valid data (`user` / `admin`); only the
-- audit trail (who / when) is lost. No other reader exists.
-- Verified by tests/integration/admin-users/profiles-role-audit-migration.test.ts in a rolled-back transaction.
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_role_updated_by_profiles_id_fk";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "role_updated_at";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "role_updated_by";
