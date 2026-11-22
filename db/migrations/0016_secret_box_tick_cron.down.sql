-- Rollback of 0016_secret_box_tick_cron.sql (run before 0015_secret_box_rewards.down.sql), then delete
-- its row from drizzle.__drizzle_migrations (created_at = the journal entry's `when`). Unschedules the
-- job only: pg_cron / pg_net and the Vault secrets stay (shared, phase 13 may reuse them). Without the
-- job, boxes are still granted on every read path; only BoxGranted notifications wait for a visit.
-- Symmetric with the up script: where pg_cron is not installed (the up script scheduled nothing), a
-- NOTICE and no change.
-- Verified by tests/integration/secret-box-rewards/secret-box-migration.test.ts in a rolled-back transaction.
DO $tick$
BEGIN
  IF to_regclass('cron.job') IS NULL THEN
    RAISE NOTICE 'saa-secret-box-tick: pg_cron is not installed, nothing to unschedule';
    RETURN;
  END IF;
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'saa-secret-box-tick';
END
$tick$;
