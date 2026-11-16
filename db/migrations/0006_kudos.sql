CREATE TYPE "public"."kudo_status" AS ENUM('public', 'spam');--> statement-breakpoint
CREATE TABLE "kudo_hashtags" (
	"kudo_id" uuid NOT NULL,
	"hashtag_id" uuid NOT NULL,
	CONSTRAINT "kudo_hashtags_kudo_id_hashtag_id_pk" PRIMARY KEY("kudo_id","hashtag_id")
);
--> statement-breakpoint
ALTER TABLE "kudo_hashtags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "kudo_image_uploads" (
	"storage_path" text PRIMARY KEY NOT NULL,
	"uploader_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kudo_image_uploads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "kudo_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kudo_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "kudo_images_storage_path_unique" UNIQUE("storage_path"),
	CONSTRAINT "kudo_images_kudo_id_position_unique" UNIQUE("kudo_id","position")
);
--> statement-breakpoint
ALTER TABLE "kudo_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "kudos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"title" varchar(50),
	"body" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"anonymous_nickname" varchar(30),
	"status" "kudo_status" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kudos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kudo_hashtags" ADD CONSTRAINT "kudo_hashtags_kudo_id_kudos_id_fk" FOREIGN KEY ("kudo_id") REFERENCES "public"."kudos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kudo_hashtags" ADD CONSTRAINT "kudo_hashtags_hashtag_id_hashtags_id_fk" FOREIGN KEY ("hashtag_id") REFERENCES "public"."hashtags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kudo_image_uploads" ADD CONSTRAINT "kudo_image_uploads_uploader_id_profiles_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kudo_images" ADD CONSTRAINT "kudo_images_kudo_id_kudos_id_fk" FOREIGN KEY ("kudo_id") REFERENCES "public"."kudos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_recipient_id_profiles_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kudo_hashtags_hashtag_id_idx" ON "kudo_hashtags" USING btree ("hashtag_id");