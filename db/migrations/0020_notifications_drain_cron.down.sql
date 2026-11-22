-- Rollback of 0020_notifications_drain_cron.sql (run first, before 0019 and 0018 down scripts), then
-- delete its row from drizzle.__drizzle_migrations (created_at = the journal entry's `when`).
-- Unschedules the job only: pg_cron / pg_net and the Vault secrets stay (shared with phase 10). Without
-- the job, outbox rows wait unconsumed (safe, replayable) until a host cron or a re-run drains them.
-- Symmetric with the up script: where pg_cron is not installed (the up script scheduled nothing), a
-- NOTICE and no change.
-- Verified by tests/integration/notifications/notification-migration.test.ts in a rolled-back transaction.
DO $drain$
BEGIN
  IF to_regclass('cron.job') IS NULL THEN
    RAISE NOTICE 'saa-notifications-drain: pg_cron is not installed, nothing to unschedule';
    RETURN;
  END IF;
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'saa-notifications-drain';
END
$drain$;
