---
phase: 02
feature: F001
priority: P0
status: completed
depends_on: [01]
file_ownership:
  - proxy.ts                                   # phase 07 adds ONE prelaunch step (sanctioned, serial edit)
  - shared/auth/**
  - shared/db/schema/profiles.ts
  - features/auth/**
  - app/(public)/login/**
  - app/auth/callback/route.ts
  - app/onboarding/**
  - db/migrations/<next>_profiles.sql, <next>_auth_user_triggers.sql
  - supabase/config.toml  [auth] section only
  - messages/*.json key `auth` only
  - tests/unit/auth/**, tests/integration/auth/**, tests/e2e/auth/**, tests/e2e/fixtures/auth-session.ts
---

# Phase 02 — Auth & Onboarding (F001)

## Context Links
- Spec: [spec/auth/functional-spec.md](spec/auth/functional-spec.md), [spec/auth/technical-spec.md](spec/auth/technical-spec.md), [spec/auth/screens/SCR-login/spec.md](spec/auth/screens/SCR-login/spec.md)
- Decisions: [spec/decision-log.md](spec/decision-log.md) — `ADMIN_EMAILS` auto-admin; seeded departments + first-login self-select; Countdown public + admin bypass
- Architecture: [spec/system/architecture.md](spec/system/architecture.md) § Cross-Feature Contracts (`AdminGuard#requireAdmin`, `SessionProxy`), C-08, C-09, C-20, C-21
- Permissions: [spec/system/permissions.md](spec/system/permissions.md) § Access Boundaries, § Supabase RLS
- Foundation: [phase-01-foundation-infrastructure.md](phase-01-foundation-infrastructure.md) (env, `departments` seed, RLS test)
- Figma: Login frame `662:14387`
- Next.js 16 docs: `node_modules/next/dist/docs/` (proxy, route handlers, server actions, `forbidden()`/`unauthorized()`)

## Overview
- Priority: P0
- Status: completed (2026-11-15, SEALED; not committed yet)
- Description: Google sign-in restricted to `@sun-asterisk.com`, profile auto-creation, `ADMIN_EMAILS` bootstrap, first-login department picker, session proxy with public-path allowlist, logout, `AdminGuard#requireAdmin`, current-user helpers consumed by every later phase.

## Key Insights
- Resolves **C-09** (proxy order + allowlist), **C-20** (profiles RLS on, no client policy; FR-604 read as "server-only access"), **C-21** (table `profiles`, entity `Profile`), **C-08** (enum `profile_role` = DISC-001 owned by F001; `kudo_status` enum + `kudos.status` column created by phase 04, transitions owned by phase 08; other DISC codes assigned at promote).
- **Decision overrides spec:** BR-002 ("never auto-admin") is superseded by `ADMIN_EMAILS`. D002 superseded: department chosen by Sunner on first login. D003 superseded: env bootstrap.
- `ADMIN_EMAILS` promotion runs **on every successful login** in the callback (`UPDATE profiles SET role='admin' WHERE id=$1 AND role<>'admin'`), not in the DB trigger (trigger cannot read env). Env list = bootstrap + recovery path. Consequence for phase 14: demoting an env-listed admin reverts at their next login — phase 14 must surface this (label "env admin").
- Domain gate: BEFORE INSERT trigger on `auth.users` (spec A3) is the hard stop; callback re-checks the session email domain (defence-in-depth, signs out on mismatch). Spike first: if Supabase wraps the trigger exception as generic "Database error saving new user", switch to the `before_user_created` Auth Hook (Postgres function) which returns a distinguishable error. Either way the callback maps to `domain_not_allowed | auth_failed`.
- Domain constant lives in two places by design (env `ALLOWED_EMAIL_DOMAIN` for `hd` hint, literal in DB function); an integration test asserts they match.
- Proxy reads DB role **only while `isPrelaunch(now)`** (admin bypass, added by phase 07) — no per-request DB cost after launch.
- Onboarding redirect is enforced in `requireSunner()` (used by phase 03 `(app)` layout and every Sunner action), not in the proxy → no DB read in proxy for it.

## Requirements
Functional (spec codes)
- Login: FR-201..204, US001, US002 — single Google button, `hd` hint, button disabled while pending, error banner by code.
- Callback `/auth/callback`: FR-202, FR-402, BR-005, DEC-001 — exchange code, domain re-check, `last_login_at = now()`, `ADMIN_EMAILS` promotion, redirect to safe `next` (internal path starting `/`, not `//`, not `/\`) else `/`; if `department_id` null → `/onboarding/department?next=…`.
- Triggers: FR-601, BR-001 (reject foreign domain), FR-001..003, FR-401, BR-004 (create profile `role=user`, name fallback = email local part, avatar null if absent; D005 name/avatar captured first time only).
- Onboarding: Sunner picks one department from seeded `departments`; required; `chooseDepartment` only succeeds when `department_id IS NULL` (later changes out of scope).
- Proxy (C-09 order): (1) static/asset matcher excluded; (2) refresh Supabase session; (3) public allowlist `/login`, `/auth/callback`, `/countdown` → pass (signed-in user on `/login` → `/`, FR-102); (4) no session on protected path → `/login?next=<path>` (FR-101); (5) [phase 07] prelaunch gate.
- Logout: FR-403 server action → `signOut` → `/login`.
- `AdminGuard#requireAdmin`: FR-602, FR-603, BR-003 — role from DB every call; non-admin → `forbidden()`; no session → `unauthorized()`/redirect login.
- API/action without session → 401; non-admin → 403 (permissions.md Special Conditions).

Non-functional
- Session validated server-side (`getUser`/`getClaims` per docs), never trusting raw cookie.
- Files < 200 lines; `server-only` on all `shared/auth` server modules.

## Architecture
```
Browser ─► proxy.ts ─► shared/auth/session-proxy.ts
              │  updateSession (@supabase/ssr cookies) → user?
              │  decideRouteAccess({path, user})  (pure, shared/auth/route-access-policy.ts)
              ▼
 /login (public) ─ signInWithGoogle action ─► Supabase Auth ─► Google
                                              │ auth.users INSERT
                                              ├ BEFORE: reject_foreign_domain()  (or before_user_created hook)
                                              └ AFTER : create_sunner_profile()  → profiles(role=user)
 /auth/callback ─ exchangeCodeForSession ─ domain re-check ─ touch last_login_at ─ promote ADMIN_EMAILS
                ─► dept null ? /onboarding/department : safe next
 Server code ─► shared/auth/current-user.ts: getSessionUser() · requireSunner() · requireAdmin()
```
Exports for later phases: `requireSunner(): Promise<{userId, profile}>`, `requireAdmin()`, `getSessionUser()`, `signOut` action, `profiles` schema, `createSupabaseServerClient()`.

Data: `profiles(id uuid pk → auth.users.id on delete cascade, email text unique not null, full_name text not null, avatar_url text, department_id int null → departments.id, role profile_role not null default 'user', last_login_at timestamptz, created_at timestamptz default now())`. Index `(department_id)`. `role_updated_by/at` columns are added later by phase 14 (spec: migration applied by owner — phase 14 writes it, phase 02 owner acknowledges).

## Related Code Files
Create
- `proxy.ts` (thin: calls `runSessionProxy`, exports `config.matcher`)
- `shared/auth/supabase-server-client.ts`, `shared/auth/session-proxy.ts`, `shared/auth/route-access-policy.ts`, `shared/auth/public-paths.ts`, `shared/auth/safe-next-path.ts`, `shared/auth/current-user.ts`, `shared/auth/admin-guard.ts`, `shared/auth/sign-out-action.ts`
- `shared/db/schema/profiles.ts` (+ export line in `shared/db/schema/index.ts`)
- `features/auth/server/sign-in-with-google-action.ts`, `features/auth/server/complete-login.ts` (touch last_login, promote admin, decide destination), `features/auth/server/choose-department-action.ts`, `features/auth/server/department-options-query.ts`
- `features/auth/components/google-sign-in-button.tsx`, `features/auth/components/login-error-banner.tsx`, `features/auth/components/department-picker-form.tsx`
- `features/auth/schemas/choose-department-schema.ts`
- `app/(public)/login/page.tsx`, `app/auth/callback/route.ts`, `app/onboarding/department/page.tsx`
- `db/migrations/<next>_profiles.sql` (generated: enum `profile_role`, table, RLS enable), `db/migrations/<next>_auth_user_triggers.sql` (custom: two `SECURITY DEFINER` functions with `set search_path = ''`, triggers on `auth.users`)
- Tests: `tests/unit/auth/route-access-policy.test.ts`, `tests/unit/auth/safe-next-path.test.ts`, `tests/integration/auth/auth-user-triggers.test.ts`, `tests/integration/auth/complete-login.test.ts`, `tests/integration/auth/choose-department.test.ts`, `tests/integration/auth/admin-guard.test.ts`, `tests/integration/auth/anon-key-cannot-read.test.ts`, `tests/e2e/fixtures/auth-session.ts`, `tests/e2e/auth/guest-redirect-and-logout.spec.ts`

Modify
- `shared/db/schema/index.ts` (one export line), `supabase/config.toml` (`[auth.external.google]` env refs, site_url/redirect URLs; email+password provider enabled **local only** for test fixtures), `messages/vi.json` + `en.json` (`auth` key), `.env.example` (Google client id/secret placeholders for local)

Delete — none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/`: `proxy` (runtime, matcher, cookies), route handlers, server actions, `forbidden()`/`unauthorized()` (+ any `authInterrupts` flag), redirects. Read `@supabase/ssr` Next guide for the proxy cookie pattern.
2. Spike on local Supabase: trigger exception on `auth.users` — what reaches `/auth/callback` (`error_description`)? Decide trigger vs `before_user_created` hook; record result in this file.
3. Profiles schema + migration (enum, table, RLS enable); triggers migration (`reject_foreign_domain`, `create_sunner_profile` reading `raw_user_meta_data->>'full_name'|'name'`, `'avatar_url'|'picture'`, `on conflict (id) do nothing`). `db:reset`.
4. Integration tests for triggers (foreign email insert fails, no row; valid → one profile role user; re-insert path idempotent; domain literal == env `ALLOWED_EMAIL_DOMAIN`).
5. `supabase-server-client.ts` (cookie adapter for server components/actions/handlers), `safe-next-path.ts` + unit tests (open-redirect cases).
6. `route-access-policy.ts` (pure) + unit tests for every DEC-002 row; `public-paths.ts`; `session-proxy.ts` + `proxy.ts` with matcher excluding `_next`, static assets, images.
7. `sign-in-with-google-action.ts` (`signInWithOAuth`, `redirectTo` `/auth/callback?next=`, `queryParams.hd`), login page + button (pending state via `useFormStatus`) + error banner (copy verbatim from Figma `662:14387`).
8. `complete-login.ts` + callback route: exchange code; on `error` map codes; domain re-check → signOut + `domain_not_allowed`; update `last_login_at`; promote if email ∈ `env.ADMIN_EMAILS`; destination. Integration test with seeded auth user.
9. `current-user.ts` (`getSessionUser`, `requireSunner` → redirect `/onboarding/department` if dept null), `admin-guard.ts` (`requireAdmin`, DB read each call), `sign-out-action.ts`. Integration tests: user → forbidden, admin → pass, demoted mid-session → forbidden on next call.
10. Onboarding page + `department-options-query.ts` + `choose-department-action.ts` (Zod id, `UPDATE … WHERE id=$me AND department_id IS NULL`, verify department exists); tests incl. second call no-op.
11. `anon-key-cannot-read.test.ts`: supabase-js with anon key (and with an authenticated user token) selecting `profiles` returns zero rows (SC-006).
12. E2E fixture: create `@sun-asterisk.com` user via service role on local stack, sign in with password, inject `@supabase/ssr` cookies. Spec: guest `/kudos` → `/login?next=%2Fkudos`; signed-in `/login` → `/`; logout → protected path redirects; new user lands on onboarding.
13. `typecheck`, `lint`, unit + integration + e2e green.

## Todo List
- [x] Next 16 + @supabase/ssr docs read
- [x] Spike: domain-rejection error surface → trigger or hook decided (both shipped)
- [x] `profiles` migration + triggers migration
- [x] Trigger integration tests
- [x] Server client, safe-next, route-access policy (+ unit tests)
- [x] `proxy.ts` + session proxy
- [x] Login page, Google action, error banner
- [x] Callback: last_login, ADMIN_EMAILS promotion, destination
- [x] `requireSunner` / `requireAdmin` / sign-out + tests
- [x] Onboarding department picker + tests
- [x] Anon-key RLS test
- [ ] E2E auth fixture + guest/logout/onboarding specs (fixture and guest/logout spec exist; onboarding spec missing, see delivery notes)

## Success Criteria
- SC-001..SC-006 of technical spec pass (SC-001 domain rejection via integration test on local stack; real Google flow verified manually once).
- Email in `ADMIN_EMAILS` is admin after login; others `user`.
- First login always passes through department picker before any `(app)` page.
- `next=//evil.com`, `https://…`, `/\evil` all fall back to `/`.
- `rls-baseline.test.ts` (phase 01) still green with `profiles`.

## Scope Contract
- **Changed:** `proxy.ts`, `shared/auth/*`, `profiles` + auth triggers migrations, login/callback/onboarding routes.
- **Impacted:** every route (proxy), every later server action/handler (`requireSunner`/`requireAdmin`), phase 07 proxy extension, phase 14 role management.
- **Will verify:** unit (policy, safe-next); integration on local Supabase (triggers, callback logic, guards, onboarding, anon-key denial); e2e (redirects, logout, onboarding).
- **Deliberately skipped:** real Google consent screen in CI (manual check once per environment); prelaunch gate (phase 07).
- **Safety-critical (auth, sessions, RBAC, migrations) → full test set required.**

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Trigger error not distinguishable at callback | M | M | Step 2 spike; fallback `before_user_created` hook; callback re-check |
| Trigger on `auth.users` restricted on hosted | L | H | Same migration verified on hosted before go-live; hook fallback |
| Proxy runtime cannot use DB driver (needed by phase 07 admin bypass) | M | M | Docs check step 1; fallback: role lookup via service-role Supabase REST in proxy |
| Env-admin re-promotion surprises phase 14 | M | L | Documented here; phase 14 labels env admins |
| Local email/password provider leaks to hosted | L | H | Only in local `config.toml`; hosted dashboard keeps Google-only; checklist item |
| Next 16 `forbidden()` needs flag | M | L | Enable per docs; fallback render 403 page from phase 03 |

Rollback: revert proxy file to pass-through; migrations additive (drop triggers migration if spike fails).

## Security Considerations
- Domain enforced in DB before account creation; `hd` is UX only.
- Role always read from DB (BR-003); never in cookie/JWT claims.
- Open-redirect guard on `next`.
- Trigger functions `SECURITY DEFINER` with empty `search_path`, fully-qualified names.
- `profiles` RLS enabled, no client policy; anon/auth keys cannot read.
- `userId` always from session in actions (`chooseDepartment` ignores client ids).
- Service role key only in server modules and test fixtures.

## Next Steps
- Phase 03 consumes `requireSunner`, `requireAdmin`, `signOut`, profile (name/avatar) for header.
- Phase 07 adds prelaunch step (`isPrelaunch(now)` + admin bypass) to `session-proxy.ts` call chain in `proxy.ts`.
- Phase 14 adds `role_updated_by/at` and must handle env-admin re-promotion.
- Go-live checklist (owner: Hai Luong): enable the `before_user_created` hook; Google provider on, email off; set the redirect URL; make `INTERNAL_APP_ORIGIN` reachable from the server; before applying `0005`, check `auth.users` for rows outside the Sunner domain.
- OAuth `redirectTo` is built from Host. Decide at hosting time (owner: Hai Luong): A = fixed `APP_ORIGIN` for one origin, B = origin allow-list if previews exist. Done when the choice is recorded in the decision log and the callback follows it.
- Deferred, low priority: S-N2 cache the 403 HTML per locale (`shared/auth/access-denied-response.ts`); db S4 no length cap on `full_name` / `avatar_url`; W3 `getUser` runs twice per request; IPv6-only bind breaks the default self-fetch (falls back to plain 403); test-only trigger DDL on `auth.users` locks until rollback (run that file serially if flakes appear).
- Phase 07: prelaunch gate must let guests reach `/access-denied`.

## Delivery notes / deviations
- Delivered 2026-11-15. Evidence: tester `plans/reports/tester-261115-phase-02-03-final.md` (8/8 commands exit 0; unit 176, integration 108, e2e 30, test:prod 13/13); reviewer `plans/reports/reviewer-261115-phase-02-03-final-recheck.md` (9/10, APPROVE); `evidence/phase-02-03/inspection-verdict.json` (SEALED, human signed off). Not committed yet.
- Deviations (shared with phase 03):
  1. Admin 403 is served by the proxy (step 4b). It fetches the public `/access-denied` page from `INTERNAL_APP_ORIGIN` or `127.0.0.1:$PORT`, because Cache Components sends a 200 shell and neither `forbidden()` nor a status rewrite can set 403. `authInterrupts` is enabled (decision 2026-11-15).
  2. New public route `app/access-denied`.
  3. New optional env var `INTERNAL_APP_ORIGIN` (http/https origin only).
  4. The `auth.users` domain trigger is split into insert and email-change triggers. The spike shipped both the `before_user_created` hook and the triggers.
  5. New `sync_profile_email` trigger.
  6. New npm script `test:prod` (node script against `next start`).
  7. 404 is bare per Figma, replacing F002 D005.
  8. 403 page has a "Về trang chủ" button (not in Figma).
  9. Leftover `public/*.svg` template files deleted.
  10. Header uses `bg-container` with no blur, per Figma.
- Open, not covered by evidence:
  - Real Google sign-in checked manually once per environment (plan success criterion). Owner: Hai Luong.
  - Onboarding E2E spec (step 12) not written; onboarding is covered by `choose-department.test.ts` only. Owner: tester.
  - Decision 2026-11-15 "env admin" also applies here. Phase 02 delivers promotion on login. The `ENV_ADMIN` badge and 409 demotion guard belong to phase 14.
