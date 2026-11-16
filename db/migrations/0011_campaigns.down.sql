-- Rollback of 0011_campaigns.sql (run after 0012_campaigns_no_overlap_exclude.down.sql).
-- No other table references campaigns: hearts snapshot their multiplier (BR-005).
DROP TABLE IF EXISTS "campaigns";
