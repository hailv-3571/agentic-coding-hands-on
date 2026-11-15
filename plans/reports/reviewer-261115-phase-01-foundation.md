# Review — Phase 01 Foundation & Infrastructure

Score 8.5/10 | Critical 0 | Warning 3 | Suggestion 11 | Status: DONE_WITH_CONCERNS (no blockers; 3 warnings should be fixed before phase 02 builds on this)

## Scope
- Files: all in-scope paths (package.json, next/eslint/drizzle/vitest/playwright config, supabase/config.toml, app/*, shared/{config,db,events,admin,i18n}, messages, db/migrations 0000-0003 + meta, db/seeds, tests). Largest file 111 lines; all kebab-case.
- Depth: full read of every in-scope file + plan + Next 16 docs (instant, building, migrating-to-cache-components, authentication-with-cache-components).
- Run by me: `tsc --noEmit` clean, `eslint` clean, `vitest --project unit` 48/48 pass, `drizzle-kit check` OK, `Db -> DbTx` assignability probe (scratchpad), `LAUNCH_AT=bad next typegen`. Integration/e2e NOT re-run (relied on tester report).

## Assessment
Solid, plan-faithful foundation. Secrets split is correct, RLS baseline + test is the right shape, outbox contract is tight (type-level tx-only verified: `Db` is not assignable to `DbTx`), migrations share one journal, tests would fail on real bugs. No critical issue. Warnings are about CI ergonomics, one migration idempotency gap and pool lifecycle.

## Critical
None.

## Warning
W1. `next.config.ts:8` — `parseServerEnv(process.env)` at config load means `npm run typecheck` (`next typegen`), and any `next build` in an environment without runtime secrets (CI typecheck job, Docker build stage), fails. Verified: `LAUNCH_AT=bad npx next typegen` aborts with the Zod error. Cost: CI needs real/dummy secrets just to typecheck. Fix: keep fail-fast for dev/start/build but add an explicit opt-out used only by the typecheck script/CI, e.g. `if (!process.env.SKIP_ENV_VALIDATION) parseServerEnv(process.env);` and `"typecheck": "SKIP_ENV_VALIDATION=1 next typegen && tsc --noEmit"` (use `cross-env` on Windows, or ship a committed `.env.ci` with dummy values and document it). Alternative: validate only in `phase !== PHASE_PRODUCTION_BUILD`-aware function config.
W2. `db/migrations/0003_storage_kudo_images_bucket.sql:12` — `ON CONFLICT (id) DO NOTHING` silently keeps a pre-existing bucket that is public or has other limits/mime types (e.g. someone created `kudo-images` by hand on hosted). The security invariant (private, 5 MB, 3 mimes) then depends on luck, and the integration test only proves it on a fresh local DB. Fix: `ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;` (deviates from plan text; strictly safer, still idempotent).
W3. `shared/db/client.ts:26-30` — pool is cached on `globalThis` only when `NODE_ENV !== "production"`. In production correctness relies on module-instance uniqueness; with multiple server bundles (route handlers vs pages) a second module instance opens a second pool. Also `postgres()` has no `max`/`idle_timeout`/`connect_timeout` (default 10 conns per instance against Supabase pooler limits). Fix: `export const db = (globalForDb.__saaDb ??= createDb());` unconditionally, and pass `{ prepare: false, max: Number(process.env.DB_POOL_MAX ?? 10), idle_timeout: 20, connect_timeout: 10 }` (or hardcode a small max; env var is optional, YAGNI).

## Suggestion
S1. `shared/config/env.ts:9` + `env-schema.ts:16-18` — `Object.freeze` is shallow; `env.EVENT_END_AT` etc. are mutable `Date`s shared process-wide. One `.setHours()` in a later phase corrupts the event window. Fix: expose epoch ms (`z.transform(v => new Date(v).getTime())`) or return getters that clone; at minimum add a "do not mutate" note + lint habit.
S2. `shared/events/domain-event-outbox.ts:18` — tx-only is enforced by types only (I verified), but nothing locks it. Add a type test `// @ts-expect-error  DomainEventOutbox.add(db, ...)` in `tests/unit/shared/` (typecheck covers tests) so loosening `DbTx` to `Db | DbTx` fails CI. Runtime guard (`tx instanceof PgTransaction`) optional.
S3. `db/migrations/0002_rls_baseline.sql` — hard-codes 3 table names; protection for later tables is the test only. Defence in depth: `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated; ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;` so a table that forgets RLS is still not exposed through PostgREST. Also consider removing `public` from `[api].schemas` (supabase/config.toml, local) and from hosted "Exposed schemas" — the app never uses PostgREST; mirror the Realtime note in `.env.example`.
S4. `tests/integration/foundation/rls-baseline.test.ts` — add a check that `storage.objects` has no policy for `anon`/`authenticated`/`public` touching bucket `kudo-images` (private bucket is only private while no such policy exists).
S5. `shared/config/public-env.ts:1` imports `env-schema.ts`, which defines the whole server shape at module level; once a client component imports `publicEnv`, the server var NAMES (not values) and zod ship to the browser. Split `public-env-schema.ts` (publicShape only) and import it from both.
S6. `drizzle.config.ts:7-12` — throws without `DATABASE_URL` even for `db:generate [--custom]`, which needs no DB. Use `process.env.DATABASE_URL ?? ""` and fail only for migrate (drizzle-kit errors itself), or document.
S7. `shared/admin/csv-serializer.ts:9` and `tests/unit/shared/csv-serializer.test.ts:4` — BOM is an invisible literal U+FEFF in source; an editor/formatter stripping it would silently drop the BOM and the test (same literal) would still pass. Use `"﻿"` in both. Guard coverage otherwise complete (= + - @ TAB CR; header cells guarded; numbers typed). Optional: also guard a leading LF.
S8. `app/layout.tsx:29` — `<NextIntlClientProvider>` with no `messages` prop forwards the full catalog to the client; each phase adds a namespace. Later pass only client-needed namespaces (`messages={pick(messages, [...])}`).
S9. `vitest.config.ts` — see verdict 3c (rename to `.mts`).
S10. `.env.example:11` — add hosted notes: `sslmode=require` and pooler port 6543 (the `prepare: false` comment in client.ts assumes it); mention disabling email/password sign-up (local `[auth] enable_signup = true`, `minimum_password_length = 6` in supabase/config.toml) for phase 02.
S11. `db/seeds/apply-all-seeds.ts:1` — keep `import type` from `@/shared/db/client`; a value import pulls `server-only` and throws under `tsx`. Add a one-line comment so phase 10's loader author does not trip on it. Also note: re-running `db:seed` resets `is_active`/labels (test enshrines it); if admin ever edits hashtags in UI, seeds must stop overwriting.

## Verdicts on implementer-flagged decisions
3a `export const instant = false` (app/layout.tsx:25): ACCEPT. Docs confirm: without it `next build` fails with "blocking-prerender-dynamic" because `<html lang>` awaits `cookies()` and cannot be wrapped in Suspense; docs sanction it for session-reading apps (authentication-with-cache-components, migrating-to-cache-components). It does not change the rendering model. Real consequences: (1) root-level `false` disables static-shell validation for the whole app (instant.md: "place false as low as possible"), (2) every direct visit waits on the cookie read (no static shell anywhere); client navigations below the root layout can still be instant. For an authenticated/personalised app that is acceptable. Better patterns are worse here: `[lang]` URL segment (plan rejected prefix) or static `lang="vi"` + client switch (a11y/SEO regression). Condition: record it in decision-log/plan.md; later pages can still export `instant = true` for navigation validation; revisit only if phase 07 landing page needs a CDN-cached shell (then a locale segment or `use cache: private` pattern).
3b Out-of-list items: ACCEPT all. `db/seeds/apply-all-seeds.ts`, extra tests (event-window, export-limit, storage bucket) are inside ownership globs `db/seeds/**`, `tests/unit/shared/**`, `tests/integration/foundation/**`; apply-all-seeds is justified (test imports it without running the CLI). `supabase/.gitignore` is `supabase init` output (ignores .temp/.branches/.env.local). `@next/env` devDep is correct (explicit instead of transitive; used by drizzle.config + run-seeds; note seeds need devDeps installed wherever `db:seed` runs). `@types/node ^24` matches runtime Node v24.20. `postgres` is `^3.4.9` (caret, not pinned as the brief said) — fine, lockfile pins. ESLint ignoring `.claude/**` and Playwright output: fine, not app code.
3c Vitest ESM warning: confirmed (`vitest.config.ts:1:1 ESM syntax in file loaded as CommonJS`). Rename to `vitest.config.mts` (zero config change; tsconfig already includes `**/*.mts`; update plan file_ownership name). Do NOT set `"type":"module"` — it changes how Next, drizzle-kit, tsx and any `.js`/`.cjs` tooling load files across the repo for a one-file cosmetic warning.

## Edge cases turned up
- DST/zone math verified (NY 2025-03-09) and half-open Vietnam day boundaries; `to` rolls month/year. Fine.
- `EVENT_END_AT = 23:59:59+07:00` in .env.example with exclusive end: the final second is closed; confirm BTC intent (use next-day 00:00:00 for a clean boundary).
- Bucket `allowed_mime_types` trusts client-declared Content-Type: phase 04 must sniff magic bytes / re-encode.
- Zod error output verified to omit rejected values (secrets safe in boot logs).
- Env refinements skipped when operand invalid (no cascade noise) — verified.

## Done well
Strict-object ids-only outbox union with real rollback/commit tests; `withRollback` helper; RLS test queries pg_class/pg_policies incl. PUBLIC role and an anon-role probe; seeds in one tx with upsert-by-key and ids-stable idempotency test; env schema pure + testable, empty-string-as-unset; `server-only` stubbed via alias for Vitest; single drizzle journal with snapshots for custom SQL (`drizzle-kit check` OK); `.env*` ignored with `!.env.example`; tokens in `@theme`; e2e covers locale cookie switch.

## Acceptance criteria
Env fail-fast readable (met, verified); outbox only on commit (met, test); RLS test fails if table lacks RLS/client policy (met); bucket private/5MB/mimes (met, W2 caveat); CSV BOM + formula guard (met); date-range half-open (met); seeds idempotent (met); scripts/vitest projects/playwright (met); files <200 lines, kebab-case (met); no out-of-phase YAGNI creep (met). Fresh-clone `supabase start && db:reset && test:integration` relies on tester report (not re-run).

## Actions in order
1. W1 typecheck/CI env opt-out. 2. W2 bucket DO UPDATE. 3. W3 pool global + limits. 4. Rename vitest.config.mts (3c). 5. S2, S3, S4, S7 (cheap, high value). 6. Record 3a in decision log. 7. Remaining suggestions opportunistically.

## Numbers
Type errors 0; lint findings 0; unit 48/48; tester integration/e2e green (not re-run); coverage not measured (no coverage run configured).

## Still unresolved
EVENT_END_AT final-second intent; phase 02 must lock sign-up to Google/domain (local email sign-up currently enabled); whether admin may edit hashtags (conflicts with seed overwrite).

```json
{ "score": 8.5, "criticalCount": 0, "decision": "SEALED",
  "acceptanceCovered": ["env fail-fast", "outbox commit/rollback", "RLS baseline test", "private bucket 5MB/3 mimes", "CSV BOM+formula guard", "half-open date range", "seed idempotency", "tooling scripts"],
  "regressionChecked": ["Db not assignable to DbTx", "tsc/eslint/unit clean", "drizzle-kit check", "next typegen env dependency"],
  "contractStatus": "OK", "refuted": [], "unproven": [], "reachableRegressions": [],
  "findings": [
    { "severity": "Warning", "category": "Build", "location": "next.config.ts:8", "summary": "boot env parse breaks next typegen/typecheck and secret-less builds", "disposition": "Accept" },
    { "severity": "Warning", "category": "Security", "location": "db/migrations/0003_storage_kudo_images_bucket.sql:12", "summary": "ON CONFLICT DO NOTHING keeps a pre-existing public/misconfigured bucket", "disposition": "Accept" },
    { "severity": "Warning", "category": "Performance", "location": "shared/db/client.ts:26", "summary": "pool singleton not cached in production; no max/timeouts", "disposition": "Accept" }
  ] }
```
