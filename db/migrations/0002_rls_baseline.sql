-- RLS baseline (C-20): every table in `public` has row level security ON and NO policy
-- for anon/authenticated. All reads/writes go through server code (Drizzle, server role).
-- Convention for later phases: a migration that creates a table enables RLS for it in the
-- same migration. tests/integration/foundation/rls-baseline.test.ts enforces this.
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hashtags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "domain_event_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Defence in depth: even a table that forgets RLS is unreachable for the client roles
-- (PostgREST / Realtime), because they hold no privileges on it. Revoke what exists now and
-- what future tables created by the migration role would otherwise receive by default.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
