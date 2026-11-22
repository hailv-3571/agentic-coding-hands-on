-- Rollback of 0014_kudos_hero_tier_index.sql, then delete its row from drizzle.__drizzle_migrations
-- (created_at = the journal entry's `when`). No data changes: the Hero tier query still answers
-- correctly without the index, only slower (seq scan / the recipient feed index).
-- Verified by tests/integration/hero-badges/hero-tier-index-migration.test.ts in a rolled-back transaction.
DROP INDEX IF EXISTS "kudos_public_recipient_sender_idx";
