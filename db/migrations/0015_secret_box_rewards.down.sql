-- Rollback of 0015_secret_box_rewards.sql (run after 0016_secret_box_tick_cron.down.sql), then delete
-- its row from drizzle.__drizzle_migrations (created_at = the journal entry's `when`). FK order. Opened
-- boxes, icons and awards are LOST: after the event goes live, roll forward only. BoxGranted /
-- SetCompleted / NationalKudosFinalized outbox rows stay; they are inert without a consumer.
-- Verified by tests/integration/secret-box-rewards/secret-box-migration.test.ts in a rolled-back transaction.
DROP TABLE IF EXISTS "national_kudos";--> statement-breakpoint
DROP TABLE IF EXISTS "mystery_gift_awards";--> statement-breakpoint
DROP TABLE IF EXISTS "user_icons";--> statement-breakpoint
DROP TABLE IF EXISTS "secret_boxes";--> statement-breakpoint
DROP TABLE IF EXISTS "secret_box_prizes";
