-- F013 outbox drain, phase 13 (custom SQL). pg_cron calls POST /api/internal/notifications/drain every
-- 5 seconds through pg_net (kick + sweep in one mechanism, FR-402 "within a few seconds"); the endpoint
-- turns pending domain_event_outbox rows into notifications (NotificationEventProcessor.drain). The URL
-- and the secret live in Vault, never in this file; set them per environment (the secret = the app's
-- OUTBOX_DRAIN_SECRET):
--   select vault.create_secret('<OUTBOX_DRAIN_SECRET>', 'saa_outbox_drain_secret');
--   select vault.create_secret('https://<app-origin>/api/internal/notifications/drain', 'saa_notifications_drain_url');
-- (local Docker stack: http://host.docker.internal:3000/api/internal/notifications/drain). Until both
-- exist the job sends nothing. Drains are idempotent and safe to overlap (per-event row lock + SKIP
-- LOCKED); a missed one only delays notifications to the next run.
-- Portability: a database without pg_cron or pg_net (available AND preloaded) or without Vault (plain
-- Postgres in CI, a dev DB) gets a NOTICE and no change, so later migrations still apply; schedule the
-- drain there with a host cron POSTing the same endpoint (x-drain-secret header), e.g. every minute.
-- cron.schedule with a job name upserts, so re-running this file is safe. Each run adds one row to
-- cron.job_run_details (~17k/day): prune it with the project's usual pg_cron housekeeping.
-- Rollback: db/migrations/0020_notifications_drain_cron.down.sql (drizzle-kit keeps no down files).
DO $drain$
DECLARE
  preloaded text := coalesce(current_setting('shared_preload_libraries', true), '');
  missing text[] := ARRAY(
    SELECT ext FROM unnest(ARRAY['pg_cron', 'pg_net']) AS ext
    WHERE position(ext IN preloaded) = 0
       OR NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = ext)
  );
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    missing := missing || 'vault'::text;
  END IF;
  IF cardinality(missing) > 0 THEN
    RAISE NOTICE 'saa-notifications-drain not scheduled, unavailable: %; use a host cron instead', array_to_string(missing, ', ');
    RETURN;
  END IF;
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  PERFORM cron.schedule('saa-notifications-drain', '5 seconds', $job$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'saa_notifications_drain_url'),
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'x-drain-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'saa_outbox_drain_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    )
    WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'saa_notifications_drain_url')
      AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'saa_outbox_drain_secret')
  $job$);
END
$drain$;
