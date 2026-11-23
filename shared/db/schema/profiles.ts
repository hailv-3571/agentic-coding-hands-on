import { index, pgEnum, pgTable, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { departments } from "./reference-data";

/**
 * Sunner profile (F001, C-21: table `profiles`, entity `Profile`). One row per `auth.users`
 * row, created by the `create_sunner_profile` trigger (db/migrations/0005_auth_user_triggers.sql,
 * which also adds the `id → auth.users.id ON DELETE CASCADE` foreign key; the auth schema is
 * outside drizzle's schema filter). RLS on, no client policy (C-20): server code only.
 */

/** DISC-001 (C-08, owned by F001). Role is always read from this table, never from a cookie. */
export const profileRole = pgEnum("profile_role", ["user", "admin"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    /** Null until the Sunner picks a department on first login (decision-log: self-select). */
    departmentId: uuid("department_id").references(() => departments.id),
    role: profileRole("role").notNull().default("user"),
    /** Admin of the latest role change (phase 14, FR-002); null until changed or once that admin is deleted. */
    roleUpdatedBy: uuid("role_updated_by").references((): AnyPgColumn => profiles.id, { onDelete: "set null" }),
    /** Time of the latest role change (phase 14); null until the role is first changed from the admin UI. */
    roleUpdatedAt: timestamp("role_updated_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("profiles_department_id_idx").on(table.departmentId)],
).enableRLS();

export type Profile = typeof profiles.$inferSelect;
export type ProfileRole = (typeof profileRole.enumValues)[number];
