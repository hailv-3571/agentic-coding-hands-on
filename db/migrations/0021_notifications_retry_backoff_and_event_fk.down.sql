-- Rollback of 0021_notifications_retry_backoff_and_event_fk.sql (run first, before the 0020 -> 0018 down
-- scripts, and only with the pre-0021 app code deployed: the processor reads next_attempt_at), then delete
-- its row from drizzle.__drizzle_migrations (created_at = the journal entry's `when`).
-- Restores NOT NULL + ON DELETE CASCADE: notifications whose outbox event was already deleted
-- (event_id null) are DELETED, as the 0018 cascade would have done. Drops next_attempt_at: events
-- waiting on a backoff become due at once (the pre-0021 processor retries on every drain run).
-- Verified by tests/integration/notifications/notification-migration.test.ts in a rolled-back transaction.
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_event_id_domain_event_outbox_id_fk";--> statement-breakpoint
DELETE FROM "notifications" WHERE "event_id" IS NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "event_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_domain_event_outbox_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."domain_event_outbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_event_outbox" DROP COLUMN IF EXISTS "next_attempt_at";
