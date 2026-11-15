-- F001 auth.users integration (hand-written; drizzle's schema filter excludes the auth schema).
-- Domain gate BR-001 in two layers, one predicate:
--   1. before_user_created auth hook: the rejection message `domain_not_allowed` reaches
--      /auth/callback as `error_description` (spike 2026-11-15 on local GoTrue v2.197: a trigger
--      exception only surfaces as "Database error saving new user"). Enabled in
--      supabase/config.toml locally; hosted needs the same hook enabled in the dashboard.
--   2. BEFORE INSERT trigger + BEFORE UPDATE trigger WHEN the email actually changes: hard stop
--      for every write path, so a missing hook configuration still fails closed (generic
--      auth_failed instead of the specific message). An UPDATE that keeps the email (GoTrue
--      rewrites every column on sign-in) never re-checks it, so a row that predates the gate
--      (dashboard-created account, phone user without email) is not locked out.
-- The domain literal lives only in is_sunner_email(); tests assert it equals ALLOWED_EMAIL_DOMAIN.
-- All functions: empty search_path, fully-qualified names, EXECUTE revoked from client roles.

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_auth_users_id_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint

-- COLLATE "C": lower() folds ASCII A-Z only, so look-alikes such as KELVIN SIGN (U+212A) are
-- never turned into `k` by a libc/ICU locale (and the function is truly IMMUTABLE).
CREATE FUNCTION public.is_sunner_email(email text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT coalesce(lower(email COLLATE "C") ~ '^[^@\s]+@sun-asterisk\.com$', false)
$$;--> statement-breakpoint

CREATE FUNCTION public.before_user_created_hook(event jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path = '' AS $$
BEGIN
  IF public.is_sunner_email(event -> 'user' ->> 'email') THEN
    RETURN '{}'::jsonb;
  END IF;
  RETURN jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'domain_not_allowed'));
END
$$;--> statement-breakpoint

-- SECURITY INVOKER: touches no table. Writers of auth.users (supabase_auth_admin, postgres)
-- hold EXECUTE on is_sunner_email.
CREATE FUNCTION public.reject_foreign_domain() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NOT public.is_sunner_email(NEW.email) THEN
    RAISE EXCEPTION 'domain_not_allowed' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END
$$;--> statement-breakpoint

-- First sign-in only (D005): name/avatar from Google metadata; later metadata updates do not
-- touch the profile. ON CONFLICT keeps the insert idempotent (BR-004).
CREATE FUNCTION public.create_sunner_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    lower(NEW.email),
    coalesce(
      nullif(btrim(meta ->> 'full_name'), ''),
      nullif(btrim(meta ->> 'name'), ''),
      split_part(lower(NEW.email), '@', 1)
    ),
    coalesce(nullif(btrim(meta ->> 'avatar_url'), ''), nullif(btrim(meta ->> 'picture'), ''))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END
$$;--> statement-breakpoint

-- profiles.email follows the auth email (db W2): a stale copy would make a later sign-up with
-- the old address fail on profiles_email_unique ("Database error saving new user").
CREATE FUNCTION public.sync_profile_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.profiles SET email = lower(NEW.email) WHERE id = NEW.id;
  RETURN NEW;
END
$$;--> statement-breakpoint

CREATE TRIGGER reject_foreign_domain_on_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.reject_foreign_domain();--> statement-breakpoint

-- No `OF email`: the WHEN clause alone decides, so an email changed by any route is checked.
CREATE TRIGGER reject_foreign_domain_on_email_change
  BEFORE UPDATE ON auth.users
  FOR EACH ROW WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.reject_foreign_domain();--> statement-breakpoint

CREATE TRIGGER create_sunner_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_sunner_profile();--> statement-breakpoint

CREATE TRIGGER sync_profile_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.sync_profile_email();--> statement-breakpoint

-- Functions default to EXECUTE for PUBLIC; none of these may be called through the Data API.
REVOKE EXECUTE ON FUNCTION public.is_sunner_email(text), public.before_user_created_hook(jsonb),
  public.reject_foreign_domain(), public.create_sunner_profile(), public.sync_profile_email()
  FROM PUBLIC, anon, authenticated;--> statement-breakpoint

-- Supabase Auth runs the hook as supabase_auth_admin; the hook calls is_sunner_email.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.before_user_created_hook(jsonb), public.is_sunner_email(text)
  TO supabase_auth_admin;
