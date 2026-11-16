-- F005 hearts, phase 06 (drizzle-generated from shared/db/schema/kudo-hearts.ts). One heart per
-- (kudo, user): the UNIQUE constraint backs INSERT ... ON CONFLICT DO NOTHING (BR-001) and every lookup
-- by kudo_id; kudo_hearts_user_id_idx serves per-user reads. multiplier is snapshotted at heart time.
-- Rollback: db/migrations/0010_kudo_hearts.down.sql (drizzle-kit keeps no down files).
CREATE TABLE "kudo_hearts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kudo_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"multiplier" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kudo_hearts_kudo_id_user_id_unique" UNIQUE("kudo_id","user_id"),
	CONSTRAINT "kudo_hearts_multiplier_positive" CHECK ("kudo_hearts"."multiplier" >= 1)
);
--> statement-breakpoint
ALTER TABLE "kudo_hearts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kudo_hearts" ADD CONSTRAINT "kudo_hearts_kudo_id_kudos_id_fk" FOREIGN KEY ("kudo_id") REFERENCES "public"."kudos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kudo_hearts" ADD CONSTRAINT "kudo_hearts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kudo_hearts_user_id_idx" ON "kudo_hearts" USING btree ("user_id");