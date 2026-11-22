-- F013 Notifications review fixes, phase 13 (drizzle-generated from shared/db/schema/notifications.ts and
-- shared/db/schema/domain-event-outbox.ts). 0018-0020 stay untouched.
-- 1. notifications.event_id: ON DELETE CASCADE -> SET NULL (column nullable), so pruning
--    domain_event_outbox never wipes notification history. De-duplication is unaffected: the processor
--    always inserts a non-null event_id, and an event deleted from the outbox can never be drained again,
--    so a NULL event_id never has to collide with anything (UNIQUE(event_id, recipient_id, type) treats
--    NULLs as distinct, which only concerns those historic rows). The heart / tier keys ignore event_id.
-- 2. domain_event_outbox.next_attempt_at (nullable, null = due now): exponential backoff between failed
--    drain attempts (NotificationEventProcessor: 1, 2, 4, 8 min). Existing rows stay due. Manual replay
--    of parked events once the cause is fixed:
--      update public.domain_event_outbox set failed_at = null, attempts = 0, next_attempt_at = null
--      where consumed_at is null and failed_at is not null;  -- one event: and id = '<event uuid>'
-- The FK is dropped and re-added: one validating scan under lock (the table is small before launch).
-- Rollback: db/migrations/0021_notifications_retry_backoff_and_event_fk.down.sql (drizzle-kit keeps no down files).
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_event_id_domain_event_outbox_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "event_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "domain_event_outbox" ADD COLUMN "next_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_domain_event_outbox_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."domain_event_outbox"("id") ON DELETE set null ON UPDATE no action;