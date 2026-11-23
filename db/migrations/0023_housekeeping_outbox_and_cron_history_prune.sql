-- Post-phase-14 housekeeping (custom SQL). Two daily pg_cron jobs keep the two ever-growing tables bounded:
--   saa-outbox-prune        19:00 UTC (02:00 ICT): domain_event_outbox rows CONSUMED more than 30 days ago.
--   saa-cron-history-prune  19:15 UTC (02:15 ICT): cron.job_run_details rows that ENDED more than 7 days ago
--                           (the 5-second drain alone adds ~17k rows a day).
-- Outbox safety: the predicate requires consumed_at, so pending events (consumed_at null) and parked ones
-- (failed_at set, consumed_at null, waiting for the manual replay SQL of 0021) are never deleted, whatever
-- their age. The only reader of the outbox is NotificationEventProcessor, and it only reads pending rows;
-- producers (kudos, hearts, moderation, secret box) only insert; national-kudos "once" is guarded by its own
-- table, the spotlight board by a realtime trigger, not the outbox. notifications.event_id is ON DELETE SET
-- NULL (0021), so notification history survives with event_id null and no realtime signal fires (the
-- notifications trigger is UPDATE OF count only). 30 days keeps a month of consumed events, malformed ones
-- included (their last_error), for incident forensics; nothing reads them after that.
-- Cost: one DELETE a day bounded by a day's volume; no index on consumed_at and no batching (a seq scan of
-- a few weeks of events is cheap; revisit if the outbox grows past ~1M rows).
-- Role: pg_cron runs each job as the role that scheduled it (the migration role). On Supabase that role
-- (postgres) is not a superuser, and cron.job_run_details RLS (username = current_user) limits the history
-- prune to the jobs that role owns — every saa-* job; jobs of other roles keep their history.
-- Portability: a database without pg_cron (available AND preloaded) gets a NOTICE and no change, so later
-- migrations still apply; prune there with a host cron running the same two DELETE statements daily.
-- cron.schedule with a job name upserts, so re-running this file is safe.
-- Rollback: db/migrations/0023_housekeeping_outbox_and_cron_history_prune.down.sql (drizzle-kit keeps no down files).
DO $housekeeping$
DECLARE
  preloaded text := coalesce(current_setting('shared_preload_libraries', true), '');
BEGIN
  IF position('pg_cron' IN preloaded) = 0
     OR NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    RAISE NOTICE 'saa-outbox-prune, saa-cron-history-prune not scheduled, unavailable: pg_cron; use a host cron instead';
    RETURN;
  END IF;
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule('saa-outbox-prune', '0 19 * * *', $job$
    DELETE FROM public.domain_event_outbox
    WHERE consumed_at IS NOT NULL AND consumed_at < now() - interval '30 days'
  $job$);
  PERFORM cron.schedule('saa-cron-history-prune', '15 19 * * *', $job$
    DELETE FROM cron.job_run_details
    WHERE end_time < now() - interval '7 days'
  $job$);
END
$housekeeping$;
