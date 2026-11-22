-- Rollback of 0017_spotlight_realtime.sql, then delete its row from drizzle.__drizzle_migrations
-- (created_at = the journal entry's `when`). Kudo writes are unaffected (the trigger only ever sent
-- broadcasts); open boards stop receiving live events and keep their last snapshot. Messages already
-- in realtime.messages expire with Realtime's own partitions.
-- Verified by tests/integration/spotlight-board/spotlight-migration.test.ts in a rolled-back transaction.
DROP POLICY IF EXISTS spotlight_authenticated_read ON realtime.messages;--> statement-breakpoint
DROP TRIGGER IF EXISTS spotlight_publish_kudo_event ON public.kudos;--> statement-breakpoint
DROP FUNCTION IF EXISTS public.spotlight_publish_kudo_event();
