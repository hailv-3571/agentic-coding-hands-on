-- Rollback of 0019_notifications_realtime.sql (run before 0018_notifications.down.sql), then delete its
-- row from drizzle.__drizzle_migrations (created_at = the journal entry's `when`). Notification writes are
-- unaffected; open bells stop receiving live signals and re-sync on reconnect / tab focus. Messages
-- already in realtime.messages expire with Realtime's own partitions.
-- Verified by tests/integration/notifications/notification-migration.test.ts in a rolled-back transaction.
DROP POLICY IF EXISTS notifications_recipient_read ON realtime.messages;--> statement-breakpoint
DROP TRIGGER IF EXISTS notifications_publish_signal ON public.notifications;--> statement-breakpoint
DROP FUNCTION IF EXISTS public.notifications_publish_signal();
