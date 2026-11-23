-- F014 admin users, phase 14 (drizzle-generated from shared/db/schema/profiles.ts). Role audit (FR-002,
-- D007: latest change only, no history table): who changed a profile's role last and when. Written only
-- by UserRoleService (features/admin-users/server/user-role-service.ts) inside the role-change
-- transaction. An acting admin deleted later -> role_updated_by SET NULL, role_updated_at kept.
-- Additive and nullable: existing rows stay NULL (never changed from the admin UI). RLS on profiles is
-- untouched (on, no client policy, C-20). Search reuses public.f_unaccent (0007), so no unaccent migration.
-- Rollback: db/migrations/0022_profiles_role_audit.down.sql (drizzle-kit keeps no down files).
ALTER TABLE "profiles" ADD COLUMN "role_updated_by" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "role_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_updated_by_profiles_id_fk" FOREIGN KEY ("role_updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
