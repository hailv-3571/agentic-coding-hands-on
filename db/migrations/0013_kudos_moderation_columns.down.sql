-- Rollback of 0013_kudos_moderation_columns.sql, then delete its row from
-- drizzle.__drizzle_migrations (created_at = the journal entry's `when`). Spam rows keep
-- status = 'spam' (valid for phases 04/05); KudoMarkedSpam outbox rows stay, inert without a consumer.
-- Verified by tests/integration/admin-moderation/moderation-migration.test.ts in a rolled-back transaction.
ALTER TABLE "kudos" DROP CONSTRAINT IF EXISTS "kudos_moderated_by_needs_moderated_at";--> statement-breakpoint
ALTER TABLE "kudos" DROP CONSTRAINT IF EXISTS "kudos_moderated_by_profiles_id_fk";--> statement-breakpoint
ALTER TABLE "kudos" DROP COLUMN IF EXISTS "moderated_at";--> statement-breakpoint
ALTER TABLE "kudos" DROP COLUMN IF EXISTS "moderated_by";
