# Tester Report: Phase 01 Foundation & Infrastructure

Date: 2026-11-15 | Plan: 261108-0048-saa-2025-kudos-platform | Scope: full set per Scope Contract (safety-critical: migrations, config, RLS)

**Status:** DONE_WITH_CONCERNS

## Command results

| # | Command | Exit | Result |
|---|---------|------|--------|
| 1 | `npm run db:reset` (run 1, from reset) | 0 | migrations applied; `Seeds applied: departments=6, hashtags=8` |
| 2 | `npm run db:reset` (run 2) | 0 | same; departments=6, hashtags=8 |
| 3 | `npm run db:seed` (re-run, no reset) | 0 | departments=6, hashtags=8 (idempotent) |
| 4 | DB row count (psql in container) | 0 | departments=6, hashtags=8, domain_event_outbox=0 |
| 5 | `npm run test:unit` | 0 | 5 files, 48 passed, 0 failed (475 ms) |
| 6 | `npm run test:integration` | 0 | 4 files, 13 passed, 0 failed (3.7 s) |
| 7 | `npm run test:integration` (rerun) | 0 | 4 files, 13 passed, 0 failed (stable) |
| 8 | `npm run test:e2e` | 0 | 2 passed, 0 failed (8.3 s) |
| 9 | `npm run typecheck` | 0 | route types generated; `tsc --noEmit` clean |
| 10 | `npm run lint` | 0 | no findings |
| 11 | `npm run build` | 0 | compiled; routes `/` and `/_not-found`; no warnings |
| 12 | `LAUNCH_AT=garbage npm run build` | 1 (expected) | fails at config load with readable Zod error (see below) |
| 13 | RLS negative probe (see below) | 1 (expected) | `rls-baseline` failed on the probe table as required |

## Checks from the Scope Contract

- **Fresh DB reset:** passes twice, and the seed re-run leaves counts unchanged (no duplicates).
- **Fail-fast env:** `LAUNCH_AT=garbage` in the process env only. Build exit 1 with:
  `Error: Invalid environment configuration (see .env.example)` / `✖ Expected ISO-8601 with offset, e.g. 2026-11-01T00:00:00+07:00` / `→ at LAUNCH_AT` (raised from `shared/config/env-schema.ts:84`). `.env.local` md5 unchanged.
- **`.env.local` git-ignored:** `git check-ignore -v` → `.gitignore:38:.env*`, exit 0. Not tracked.
- **`.env.example`:** placeholders only (`<db-password>`, `<anon-key>`, `<service-role-key>`, `<admin@sun-asterisk.com>`). No real keys.
- **File size (<200 lines):** 38 `.ts/.tsx/.css/.sql` files under `shared/`, `db/`, `tests/`, `app/`. None at or above 200. Largest is `tests/unit/shared/env-schema.test.ts` at 131 lines.
- **Migrations:** `db/migrations/0000_reference_data.sql`, `0001_domain_event_outbox.sql`, `0002_rls_baseline.sql`, `0003_storage_kudo_images_bucket.sql` all present and applied.

## RLS negative probe (Success Criterion: the guard must fail on a non-RLS table)

I created `public.rls_probe_tmp` with no RLS, ran `rls-baseline.test.ts`, then dropped the table. Result: `× enables row level security on every public table`, with `expected [ 'rls_probe_tmp' ] to deeply equal []`. The other 3 tests passed. The probe table is confirmed dropped (`to_regclass` is null). The guard works.

## Failures

None. No suite failed on a real run.

## Concerns (non-blocking)

1. **Vitest config warning.** `vitest.config.ts` uses ESM syntax but `package.json` has no `"type": "module"`. Vite prints "ESM syntax in a file loaded as CommonJS" on every run. Fix: rename to `vitest.config.mts`, or add `"type": "module"` to the package. Not changed here (no app-code edits).
2. **Coverage not measured.** No `test:coverage` script exists and it was not in the verify list. Line/branch/function numbers are unknown for this phase.
3. **Flakiness sampled lightly.** Integration ran 2 times green. Unit and e2e ran once each. No failures observed, but this is not a repeat-run soak.
4. **Phase file not reconciled.** `phase-01-foundation-infrastructure.md` still shows `status: pending` and unchecked todos. Delivery tracker should update it.
5. **Supabase partial start.** `supabase status` reports analytics, vector, imgproxy, and pooler stopped. Not needed for this phase's scope, and the DB, Auth, and Storage paths tested fine.

## Evidence

Logs in scratchpad `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\`: `db-reset-1.log`, `db-reset-2.log`, `db-seed-rerun.log`, `unit.log`, `typecheck.log`, `lint.log`, `integration.log`, `integration-rerun.log`, `e2e.log`, `build.log`, `build-bad-env.log`, `rls-negative-probe.log`.

## Open questions

- Should the vitest config ESM warning be fixed in this phase or deferred? It is a one-line rename.
- Should coverage be added to the verify list for later phases?
