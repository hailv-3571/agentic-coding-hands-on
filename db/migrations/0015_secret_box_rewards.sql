-- F010 Secret Box rewards, phase 10 (drizzle-generated from shared/db/schema/secret-box-rewards.ts).
-- 5 tables, RLS on and no client policy (C-20). UNIQUE(user_id, seq) backs the grant reconcile,
-- UNIQUE(user_id, open_request_id) the Idempotency-Key replay, UNIQUE(rank)/(kudo_id) the one-time
-- Kudos Quốc Dân. Icons are unlimited (stock NULL) so the icon fallback pool never empties; gifts keep
-- stock_total + stock_remaining so a re-seed preserves the issued count. Prizes are seeded by
-- db/seeds/secret-box-prize-loader.ts (npm run db:seed), not here.
-- Rollback: db/migrations/0015_secret_box_rewards.down.sql (drizzle-kit keeps no down files).
CREATE TABLE "mystery_gift_awards" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"gift_name" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mystery_gift_awards_gift_name_not_blank" CHECK (btrim("mystery_gift_awards"."gift_name") <> '')
);
--> statement-breakpoint
ALTER TABLE "mystery_gift_awards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "national_kudos" (
	"kudo_id" uuid PRIMARY KEY NOT NULL,
	"rank" smallint NOT NULL,
	"hearts_at_finalize" integer NOT NULL,
	"finalized_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "national_kudos_rank_unique" UNIQUE("rank"),
	CONSTRAINT "national_kudos_rank_range" CHECK ("national_kudos"."rank" between 1 and 5),
	CONSTRAINT "national_kudos_hearts_positive" CHECK ("national_kudos"."hearts_at_finalize" >= 1)
);
--> statement-breakpoint
ALTER TABLE "national_kudos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "secret_box_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"kind" text NOT NULL,
	"icon_code" text,
	"name" text NOT NULL,
	"weight" integer NOT NULL,
	"stock_total" integer,
	"stock_remaining" integer,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "secret_box_prizes_code_unique" UNIQUE("code"),
	CONSTRAINT "secret_box_prizes_kind_valid" CHECK ("secret_box_prizes"."kind" in ('icon', 'gift')),
	CONSTRAINT "secret_box_prizes_icon_code_matches_kind" CHECK (("secret_box_prizes"."kind" = 'icon') = ("secret_box_prizes"."icon_code" is not null)),
	CONSTRAINT "secret_box_prizes_icon_code_valid" CHECK ("secret_box_prizes"."icon_code" is null or "secret_box_prizes"."icon_code" in ('REVIVAL', 'TOUCH_OF_LIGHT', 'STAY_GOLD', 'FLOW_TO_HORIZON', 'BEYOND_THE_BOUNDARY', 'ROOT_FURTHER')),
	CONSTRAINT "secret_box_prizes_name_not_blank" CHECK (btrim("secret_box_prizes"."name") <> ''),
	CONSTRAINT "secret_box_prizes_weight_positive" CHECK ("secret_box_prizes"."weight" > 0),
	CONSTRAINT "secret_box_prizes_stock_valid" CHECK (("secret_box_prizes"."stock_total" is null) = ("secret_box_prizes"."stock_remaining" is null) and ("secret_box_prizes"."stock_remaining" is null or "secret_box_prizes"."stock_remaining" between 0 and "secret_box_prizes"."stock_total")),
	CONSTRAINT "secret_box_prizes_icons_unlimited" CHECK ("secret_box_prizes"."kind" <> 'icon' or "secret_box_prizes"."stock_total" is null)
);
--> statement-breakpoint
ALTER TABLE "secret_box_prizes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "secret_boxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"status" text DEFAULT 'unopened' NOT NULL,
	"prize_id" uuid,
	"open_request_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone,
	CONSTRAINT "secret_boxes_user_id_seq_unique" UNIQUE("user_id","seq"),
	CONSTRAINT "secret_boxes_user_id_open_request_id_unique" UNIQUE("user_id","open_request_id"),
	CONSTRAINT "secret_boxes_seq_positive" CHECK ("secret_boxes"."seq" >= 1),
	CONSTRAINT "secret_boxes_status_valid" CHECK ("secret_boxes"."status" in ('unopened', 'opened')),
	CONSTRAINT "secret_boxes_opened_has_result" CHECK (("secret_boxes"."status" = 'opened') = ("secret_boxes"."prize_id" is not null and "secret_boxes"."opened_at" is not null and "secret_boxes"."open_request_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "secret_boxes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_icons" (
	"user_id" uuid NOT NULL,
	"icon_code" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"first_obtained_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_icons_pk" PRIMARY KEY("user_id","icon_code"),
	CONSTRAINT "user_icons_icon_code_valid" CHECK ("user_icons"."icon_code" in ('REVIVAL', 'TOUCH_OF_LIGHT', 'STAY_GOLD', 'FLOW_TO_HORIZON', 'BEYOND_THE_BOUNDARY', 'ROOT_FURTHER')),
	CONSTRAINT "user_icons_quantity_positive" CHECK ("user_icons"."quantity" >= 1)
);
--> statement-breakpoint
ALTER TABLE "user_icons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mystery_gift_awards" ADD CONSTRAINT "mystery_gift_awards_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "national_kudos" ADD CONSTRAINT "national_kudos_kudo_id_kudos_id_fk" FOREIGN KEY ("kudo_id") REFERENCES "public"."kudos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secret_boxes" ADD CONSTRAINT "secret_boxes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secret_boxes" ADD CONSTRAINT "secret_boxes_prize_id_secret_box_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."secret_box_prizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_icons" ADD CONSTRAINT "user_icons_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "secret_box_prizes_icon_code_unique" ON "secret_box_prizes" USING btree ("icon_code") WHERE "secret_box_prizes"."kind" = 'icon';--> statement-breakpoint
CREATE INDEX "secret_boxes_user_id_status_idx" ON "secret_boxes" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "secret_boxes_status_opened_at_idx" ON "secret_boxes" USING btree ("status","opened_at" DESC NULLS LAST);