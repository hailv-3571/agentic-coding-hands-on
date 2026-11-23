-- Rollback of 0023_housekeeping_outbox_and_cron_history_prune.sql (run first, before the 0022 down script),
-- then delete its row from drizzle.__drizzle_migrations (created_at = the journal entry's `when`).
-- Unschedules both prune jobs only: pg_cron stays (shared with phases 10 and 13) and rows already pruned
-- stay deleted. Without the jobs, domain_event_outbox and cron.job_run_details simply grow again.
-- Symmetric with the up script: where pg_cron is not installed (the up script scheduled nothing), a
-- NOTICE and no change.
-- Verified by tests/integration/housekeeping/housekeeping-migration.test.ts in a rolled-back transaction.
DO $housekeeping$
BEGIN
  IF to_regclass('cron.job') IS NULL THEN
    RAISE NOTICE 'saa-outbox-prune, saa-cron-history-prune: pg_cron is not installed, nothing to unschedule';
    RETURN;
  END IF;
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('saa-outbox-prune', 'saa-cron-history-prune');
END
$housekeeping$;
