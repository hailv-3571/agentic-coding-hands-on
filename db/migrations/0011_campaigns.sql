-- F011 x2 heart campaigns, phase 06 (drizzle-generated from shared/db/schema/campaigns.ts). The
-- no-overlap EXCLUDE constraint is hand-written in 0012_campaigns_no_overlap_exclude.sql.
-- Rollback: db/migrations/0011_campaigns.down.sql (drizzle-kit keeps no down files).
CREATE TABLE "campaigns" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "campaigns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_ends_after_starts" CHECK ("campaigns"."ends_at" > "campaigns"."starts_at"),
	CONSTRAINT "campaigns_name_not_blank" CHECK (btrim("campaigns"."name") <> '')
);
--> statement-breakpoint
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;