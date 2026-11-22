-- F010 Secret Box tick, phase 10 (custom SQL). pg_cron calls POST /api/internal/secret-box/tick every
-- minute through pg_net: SecretBoxSweepJob (timely BoxGranted) then NationalKudosFinalizeJob (once, at
-- NATIONAL_KUDOS_FINALIZE_AT). The URL and the secret live in Vault, never in this file; set them per
-- environment (the secret = the app's INTERNAL_JOB_SECRET):
--   select vault.create_secret('<INTERNAL_JOB_SECRET>', 'saa_internal_job_secret');
--   select vault.create_secret('https://<app-origin>/api/internal/secret-box/tick', 'saa_secret_box_tick_url');
-- (local Docker stack: http://host.docker.internal:3000/api/internal/secret-box/tick). Until both exist
-- the job sends nothing. Ticks are idempotent and a missed one only delays a notification: every read
-- path reconciles boxes itself.
-- Portability: a database without pg_cron or pg_net (available AND preloaded) or without Vault (plain
-- Postgres in CI, a dev DB) gets a NOTICE and no change, so later migrations still apply; schedule the
-- tick there with a host cron POSTing the same endpoint every minute (x-job-secret header).
-- cron.schedule with a job name upserts, so re-running this file is safe.
-- Rollback: db/migrations/0016_secret_box_tick_cron.down.sql (drizzle-kit keeps no down files).
DO $tick$
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
    RAISE NOTICE 'saa-secret-box-tick not scheduled, unavailable: %; use a host cron instead', array_to_string(missing, ', ');
    RETURN;
  END IF;
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  PERFORM cron.schedule('saa-secret-box-tick', '* * * * *', $job$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'saa_secret_box_tick_url'),
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'x-job-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'saa_internal_job_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    )
    WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'saa_secret_box_tick_url')
      AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'saa_internal_job_secret')
  $job$);
END
$tick$;
