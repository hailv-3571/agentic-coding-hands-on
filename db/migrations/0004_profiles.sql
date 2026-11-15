CREATE TYPE "public"."profile_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"department_id" uuid,
	"role" "profile_role" DEFAULT 'user' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_department_id_idx" ON "profiles" USING btree ("department_id");--> statement-breakpoint
-- Defence in depth (C-20): RLS without a policy already blocks the client roles, and 0002 revoked
-- default privileges for the migration role only; revoke explicitly for this table too.
REVOKE ALL ON "profiles" FROM anon, authenticated;