# Reviewer recheck: phase-02 DB (narrow)
Previous: reviewer-261115-phase-02-db.md (8.5). Read only, nothing executed (tests not run).

## Score: 9.3/10. 0 critical, 1 warning, 3 suggestion. Status: DONE

## Old findings
- W1 (fixtures hit non-local Supabase): RESOLVED. assert-local-supabase-url.ts parses with `new URL`, exact hostname in {localhost, 127.0.0.1}; userinfo trick, look-alike host, LAN, missing and invalid URL all refused (unit test covers each). Called at load in auth-test-users.ts:20 and local-sunner-accounts.ts:22. A unit test scans app/, features/, shared/, proxy.ts for signUp / signInWithPassword. Residual: config.toml:231/236 still enable email without confirmation; a `supabase config push` is guarded only by the comment, not by code.
- W2 (profiles.email not synced): RESOLVED. sync_profile_email 0005:69-75 is SECURITY DEFINER, search_path '', AFTER UPDATE OF email with WHEN IS DISTINCT, lower(); EXECUTE revoked 0005:91-93 and asserted by test. Test at triggers.test.ts:130 proves sync and that old address is reusable.
- W3 (fake ON CONFLICT test): RESOLVED. Test :115 adds a temp AFTER UPDATE trigger re-firing create_sunner_profile; without ON CONFLICT it would PK-fail. Rolled back by withRollback.
- S1 COLLATE "C": RESOLVED. 0005:19. Kelvin, Cyrillic, dotless-I cases added in is-sunner-email.test.ts:36-38, plus NULL, trailing dot, whitespace, newline.
- S2 drop SECURITY DEFINER on reject_foreign_domain: RESOLVED (0005:34-35, INVOKER). Writers of auth.users (supabase_auth_admin, postgres) hold EXECUTE on is_sunner_email; USAGE on schema granted at 0005:96.
- S3 explicit REVOKE: RESOLVED. 0004:19.
- S5 redirect URLs: RESOLVED. config.toml additional_redirect_urls = exact /auth/callback on both local hosts.
- S4 (length cap / avatar scheme, not in your list): still open, unchanged. Low.

## sync_profile_email checks
- Definer + empty search_path + schema-qualified: OK. Owner bypasses RLS (not FORCE), RLS stays on, 0004 grants nothing to client roles, no policy added.
- EXECUTE revoke: OK. Trigger functions are not EXECUTE-checked on fire, so revoke does not break them.
- Non-Sunner new email: BEFORE trigger reject_foreign_domain runs first and raises domain_not_allowed, so the AFTER sync never fires; whole UPDATE aborts. Tested (:41).
- Uniqueness: profiles_email_unique violation would abort the auth email change with a generic error. Practically unreachable: auth.users already enforces unique lower(email) and profiles cascade-delete with their user. Fail-loud, acceptable. No profile row = silent no-op, fine.

## Migrations / journal / hosted
- Journal idx 4,5 present, `when` strictly increasing (1794730802432, 1794730812020 > 0003), tags match files, snapshots 0004/0005 exist. drizzle applies once, atomically per migration; plain CREATE FUNCTION is fine under that.
- Hosted 0005: FK to auth.users, triggers on auth.users, GRANT to supabase_auth_admin are the documented patterns for the postgres role. Hook must be enabled manually in dashboard (documented 0005:6, config.toml:298); without it the trigger still fails closed.

## New findings
- WARNING 0005:77-79: the BEFORE UPDATE OF email trigger fires on any UPDATE that lists the email column (GoTrue may rewrite all columns on sign-in). Any pre-existing non-Sunner row in hosted auth.users (dashboard-created admin, test user, phone user with NULL email) would then fail to sign in or update with domain_not_allowed. Fix: before applying 0005 to hosted, run `select id,email from auth.users where not public.is_sunner_email(email)` (after the function exists) and delete or migrate those rows; add to the deploy checklist. Alternative: add `WHEN (NEW.email IS DISTINCT FROM OLD.email)` to reject_foreign_domain on the UPDATE path (needs splitting INSERT and UPDATE triggers); this also removes the lockout risk.
- SUGGESTION triggers.test.ts:119-120: `create trigger` takes a strong lock on auth.users until rollback; parallel integration files calling the Auth API will block briefly. Run this file serially or accept.
- SUGGESTION local-only-password-auth.test.ts:9: the text scan is bypassable (aliased destructuring, `auth["signUp"]`). Fine as a tripwire; do not treat as a hard guarantee.
- SUGGESTION assert-local-supabase-url.ts:5: `[::1]` is refused; add only if someone runs Supabase on IPv6. Ignore otherwise.

## Done well
Fixes are minimal and each has a test that can actually fail; the host guard is parsed, not substring-matched; the Unicode look-alike tests pin the COLLATE "C" decision.
