-- F009 Hero badges, phase 09 (drizzle-generated from shared/db/schema/kudos.ts). HeroTierQuery counts
-- DISTINCT sender_id per recipient over public kudos (`status = 'public' AND sender_id <> recipient_id
-- AND recipient_id IN (...) GROUP BY recipient_id`); this partial index holds exactly those rows, so
-- the aggregate reads only the index (spam rows never enter it). Plain CREATE INDEX (not
-- CONCURRENTLY): drizzle-kit migrate runs in a transaction and the table is small before launch.
-- Rollback: db/migrations/0014_kudos_hero_tier_index.down.sql (drizzle-kit keeps no down files).
CREATE INDEX "kudos_public_recipient_sender_idx" ON "kudos" USING btree ("recipient_id","sender_id") WHERE "kudos"."status" = 'public';
