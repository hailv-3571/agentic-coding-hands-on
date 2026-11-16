-- F011 x2 heart campaigns, phase 06 (hand-written: drizzle-kit cannot express EXCLUDE).
-- BR-002 / FR-003: no two campaigns overlap on the half-open window [starts_at, ends_at). The
-- native range GiST opclass serves tstzrange `&&` (no btree_gist needed). A campaign that starts
-- exactly when another ends does not overlap. A concurrent overlapping write fails with SQLSTATE
-- 23P01, which the Server Actions map to the same OVERLAP error as their pre-check. The GiST index
-- behind the constraint also serves CampaignActiveReader (`starts_at <= $at < ends_at`).
-- Rollback: db/migrations/0012_campaigns_no_overlap_exclude.down.sql (drizzle-kit keeps no down files).
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_no_overlap"
  EXCLUDE USING gist (tstzrange("starts_at", "ends_at", '[)') WITH &&);--> statement-breakpoint
-- Defence in depth (C-20): both phase 06 tables already have RLS on with no policy (generated
-- migrations), and 0002 revoked default privileges; revoke explicitly as well.
REVOKE ALL ON "kudo_hearts", "campaigns" FROM anon, authenticated;
