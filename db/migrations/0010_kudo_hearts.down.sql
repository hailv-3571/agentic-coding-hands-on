-- Rollback of 0010_kudo_hearts.sql (run after 0011_campaigns.down.sql). HeartAdded rows in
-- domain_event_outbox stay; they are inert without a consumer.
DROP TABLE IF EXISTS "kudo_hearts";
