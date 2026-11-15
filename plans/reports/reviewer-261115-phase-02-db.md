# Reviewer: phase-02 DB/auth security (narrow)

Scope: db/migrations/0004_profiles.sql, 0005_auth_user_triggers.sql, shared/db/schema/profiles.ts, supabase/config.toml (auth parts), tests/integration/auth/{auth-user-triggers,anon-key-cannot-read}.test.ts. Not run, read only.

## Verdict: 0 critical, 3 warning, 5 suggestion. Score 8.5/10. Sound, mergeable after warnings are triaged.

## Checks passed
- is_sunner_email: `lower()` + `^[^@\s]+@sun-asterisk\.com$`. Postgres ARE `$` matches only at end of string, so a trailing newline is rejected. Rejects whitespace, subdomain, `.com.evil.io`, trailing dot, a second `@` and NULL (coalesce false).
- Hook and trigger use the same predicate. The trigger is BEFORE INSERT OR UPDATE OF email and fails closed on NULL email, so anonymous and phone sign-ups are rejected too. The hook URI format is correct. The hook is granted to supabase_auth_admin only.
- All 4 functions pin `search_path = ''` and use schema-qualified names. EXECUTE is revoked from PUBLIC, anon, authenticated, and a test asserts it through has_function_privilege.
- profiles: RLS is enabled with no policy and 0004 adds no grants. 0002 revoked the default privileges and ran before 0004. The FK to auth.users has ON DELETE CASCADE. Role is a DB enum with default `user`, never read from metadata.
- create_sunner_profile is SECURITY DEFINER with ON CONFLICT (id) DO NOTHING and reads metadata only at insert.

## Warning
1. supabase/config.toml:236 (`[auth.email] enable_confirmations = false`) plus :225-231. The local email+password provider has no email confirmation, and the repo does not stop it reaching a hosted project. `supabase config push` or a copied config would enable password sign-up there, with user-controlled `raw_user_meta_data`. The domain gate would then be satisfied by any unverified claimed `@sun-asterisk.com` address, which is an account-takeover/impersonation path. Cheap guards:
   - Make tests/e2e/fixtures/auth-session.ts and tests/integration/auth/auth-test-users.ts throw unless `NEXT_PUBLIC_SUPABASE_URL` host is `127.0.0.1` or `localhost`.
   - Add a CI grep that fails if app/ or features/ call `signUp` or `signInWithPassword`.
   - Do not run `supabase config push` for this section.
2. db/migrations/0005_auth_user_triggers.sql:47-58. Profile email is never synced after `UPDATE auth.users SET email`. The `profiles_email_unique` constraint is not covered by `ON CONFLICT (id)`. If a Sunner changes their auth email, the profile keeps the stale email. A later sign-up with the old address then raises a unique violation, which surfaces as "Database error saving new user". Fix: either add an AFTER UPDATE OF email trigger that updates profiles.email, or document that the profile email is immutable and use `ON CONFLICT DO NOTHING` without a target. Low likelihood today because there is no change-email UI.
3. tests/integration/auth/auth-user-triggers.test.ts "keeps the first-login name ... no duplicate" (lines ~101-109). It does not exercise ON CONFLICT: the AFTER INSERT trigger fires once, so the test passes even without the clause. It also misses the D005 failure mode (a trigger on UPDATE of metadata). Fix: assert the row count is 1 after the metadata update (already done) and add an explicit idempotency check, e.g. pre-insert a profile with the same id (disable the FK in a transaction, or call `public.create_sunner_profile` through a temp trigger). Otherwise relabel the test honestly.

## Suggestion
1. 0005:17 Unicode lookalike. `lower()` on a UTF-8 libc/ICU database maps KELVIN SIGN U+212A to `k`, so `sun-asteriſk`-style input with U+212A in "asterisk" would pass the gate. Practical risk is low because Google issues the emails. Fix: `lower(email COLLATE "C")`, or `email ~ '^[^@\s]+@sun-asterisk\.com$' COLLATE "C"` with an ASCII-only `[A-Za-z]` match. Also IMMUTABLE with locale-dependent `lower()` is technically STABLE.
2. 0005:30-31 `reject_foreign_domain` is SECURITY DEFINER with no need (it touches no table). Drop SECURITY DEFINER, or keep it and accept the extra privileged surface (search_path is pinned, so low risk).
3. 0004 relies on migration 0002's default-privilege REVOKE, which applies to the migration role only. Add an explicit `REVOKE ALL ON "profiles" FROM anon, authenticated;` to 0004 for defense in depth. RLS with no policy already blocks it, and the anon test covers this.
4. 0005:51-56 full_name and avatar_url come from Google metadata with no length cap or URL scheme check. Fix: `left(..., 200)` on the name and require `^https://` on the avatar, or rely on next/image remotePatterns when rendering.
5. config.toml `additional_redirect_urls` uses `/**` while the comment says `/auth/callback`. Narrow to `http://localhost:3000/auth/callback` and `http://127.0.0.1:3000/auth/callback`. Local only, so low risk.

## Test adequacy
Good: foreign domain through the real Auth API (proves the hook message, not just the trigger), subdomain, look-alike suffix, email UPDATE, an uppercase mixed-case accept, the metadata fallbacks, FK cascade, privilege matrix for anon and authenticated. The anon tests would fail if grants or RLS were removed and a row were readable.
Gaps: no is_sunner_email cases for NULL, trailing dot, whitespace or newline, leading/trailing space; no anonymous sign-in rejection case. Add one `it.each` against `public.is_sunner_email`.

## Done well
Two-layer gate with one predicate, spiked hook message, empty search_path everywhere, explicit EXECUTE revoke, FK in hand-written SQL with the reason documented, the hosted-dashboard caveat written in the config comments.

## Score: 8.5/10. Verdict: DONE_WITH_CONCERNS (no blockers; fix warning 1 guard and warning 2 before hosted deploy).
