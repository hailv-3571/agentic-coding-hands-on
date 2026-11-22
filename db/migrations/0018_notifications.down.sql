-- Rollback of 0018_notifications.sql (run after 0020 and 0019 down scripts), then delete its row from
-- drizzle.__drizzle_migrations (created_at = the journal entry's `when`). Every notification is LOST
-- (read state included); outbox rows keep their consumed_at, so a roll-forward does not replay them.
-- Verified by tests/integration/notifications/notification-migration.test.ts in a rolled-back transaction.
DROP TABLE IF EXISTS "notifications";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."notification_type";
