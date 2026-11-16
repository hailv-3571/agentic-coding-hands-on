-- F004 Kudos feed, phase 05 (drizzle-generated from shared/db/schema/kudos.ts). KudoPublicQuery
-- pages by the tuple (created_at, id) < (cursor) in ORDER BY created_at DESC, id DESC; each index
-- serves one entry point: status (Live board / Highlight), recipient_id and sender_id (phase 12).
-- "DESC NULLS FIRST" is Postgres' plain DESC. Plain CREATE INDEX (not CONCURRENTLY): drizzle-kit
-- migrate runs in a transaction and the table is small before launch.
-- Rollback (drizzle-kit keeps no down files; run by hand, then delete this file and its journal
-- entry + 0009 snapshot): DROP INDEX IF EXISTS "kudos_status_created_at_id_idx",
--   "kudos_recipient_id_created_at_id_idx", "kudos_sender_id_created_at_id_idx";
CREATE INDEX "kudos_status_created_at_id_idx" ON "kudos" USING btree ("status","created_at" DESC NULLS FIRST,"id" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "kudos_recipient_id_created_at_id_idx" ON "kudos" USING btree ("recipient_id","created_at" DESC NULLS FIRST,"id" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "kudos_sender_id_created_at_id_idx" ON "kudos" USING btree ("sender_id","created_at" DESC NULLS FIRST,"id" DESC NULLS FIRST);