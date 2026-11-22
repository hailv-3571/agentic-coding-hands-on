-- F007 admin moderation, phase 08 (columns drizzle-generated from shared/db/schema/kudos.ts; the
-- CHECK is hand-written, like 0007). Latest moderation only (D008, no history table): who and when.
-- An admin profile deleted later → moderated_by SET NULL, moderated_at kept, hence the one-way CHECK.
-- `kudo_status` / `status` already exist (phase 04, C-08) and are not touched. Search reuses
-- public.f_unaccent (0007). No new index: EXPLAIN at 10k kudos shows seq scan + top-N sort in
-- under 15 ms for every list page and ~95 ms for the diacritic search (budget 300 ms).
-- Rollback: db/migrations/0013_kudos_moderation_columns.down.sql (drizzle-kit keeps no down files).
ALTER TABLE "kudos" ADD COLUMN "moderated_by" uuid;--> statement-breakpoint
ALTER TABLE "kudos" ADD COLUMN "moderated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_moderated_by_profiles_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_moderated_by_needs_moderated_at"
  CHECK ("moderated_by" IS NULL OR "moderated_at" IS NOT NULL);
