-- F013 Notifications, phase 13 (drizzle-generated from shared/db/schema/notifications.ts). Enum of the 7
-- real types, table, RLS on with no client policy and no client grant (C-20; 0002 default privileges).
-- Idempotency (BR-001): UNIQUE(event_id, recipient_id, type) + consumed_at set in the same transaction.
-- Hearts aggregate while unread: partial UNIQUE(recipient_id, dedupe_key) WHERE heart AND unread (BR-004).
-- Tier-up once per tier: partial UNIQUE(recipient_id, dedupe_key) WHERE hero_tier_up (BR-005).
-- FKs cascade (notifications are derived data: a deleted profile / outbox event takes its rows along).
-- Rollback: db/migrations/0018_notifications.down.sql (drizzle-kit keeps no down files).
CREATE TYPE "public"."notification_type" AS ENUM('kudo_received', 'heart_received', 'secret_box_granted', 'hero_tier_up', 'kudo_hidden_spam', 'icon_set_completed', 'national_kudos');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"event_id" uuid NOT NULL,
	"actor_id" uuid,
	"dedupe_key" text,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_event_id_recipient_id_type_unique" UNIQUE("event_id","recipient_id","type"),
	CONSTRAINT "notifications_count_positive" CHECK ("notifications"."count" >= 1),
	CONSTRAINT "notifications_params_object" CHECK (jsonb_typeof("notifications"."params") = 'object'),
	CONSTRAINT "notifications_dedupe_key_matches_type" CHECK (("notifications"."type" in ('heart_received', 'hero_tier_up')) = ("notifications"."dedupe_key" is not null))
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_profiles_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_domain_event_outbox_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."domain_event_outbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_unread_heart_dedupe_unique" ON "notifications" USING btree ("recipient_id","dedupe_key") WHERE "notifications"."type" = 'heart_received' and "notifications"."read_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_hero_tier_dedupe_unique" ON "notifications" USING btree ("recipient_id","dedupe_key") WHERE "notifications"."type" = 'hero_tier_up';--> statement-breakpoint
CREATE INDEX "notifications_recipient_occurred_at_id_idx" ON "notifications" USING btree ("recipient_id","occurred_at" DESC NULLS FIRST,"id" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "notifications_recipient_unread_idx" ON "notifications" USING btree ("recipient_id") WHERE "notifications"."read_at" is null;