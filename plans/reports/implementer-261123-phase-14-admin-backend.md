# Implementer report — phase 14 backend (F014 Admin users + F015 Admin overview)

Date: 2026-11-23 · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-14-admin-users-and-overview.md`
Status: **DONE_WITH_CONCERNS** (all gates green; concerns are operational, listed at the end)

## Scope Contract (as executed)
- **Changed:** migration 0022 (`profiles.role_updated_by/at`) + drizzle schema/snapshot/journal; `features/admin-users/{schemas,server}`; `features/admin-overview/{schemas,server}`; `app/admin/users/{page,error}.tsx`, `app/admin/overview/{page,error}.tsx`; `app/api/admin/{users,overview}/export/route.ts`; the two contract files (uuid ids, see Deviation).
- **Impacted:** `profiles` (requireAdmin reads role — untouched), phase 06/09 fragments (read-only reuse), `shared/admin/*` (read-only), UI components (compile against contracts — tsc green).
- **Verified:** unit (params, All row, both CSV mappers, overview params) + integration on local Supabase (migration up/down, role guards, 20-race double demotion, same-user promotion race, mid-flight demotion, action access, query numbers/filters/search/sort/pages, parity vs HeartStatsQuery/HeroTierQuery, spam/anonymous, overview attribution + tz boundaries + unassigned row, both exports incl. 422 + formula guard, 401/403 on every page/route/action, query-plan budget).
- **Skipped:** e2e (orchestrator's tester), tier/heart/box rule internals (06/09/10 own tests), CSV serializer internals (01).

## Files (all < 200 lines)
- `db/migrations/0022_profiles_role_audit.sql` + `.down.sql`, `db/migrations/meta/0022_snapshot.json`, `_journal.json` (drizzle-generated, header added like 0013/0021); `shared/db/schema/profiles.ts` (2 columns, self-FK `ON DELETE SET NULL`). RLS untouched. No unaccent migration (reuses `public.f_unaccent`, 0007).
- `features/admin-users/schemas/user-list-params-schema.ts`, `set-user-role-input-schema.ts`
- `features/admin-users/server/`: `user-admin-sql-fragments.ts`, `user-admin-query.ts`, `user-filter-options-query.ts`, `user-role-service.ts`, `set-user-role-action.ts`, `user-export-columns.ts`, `env-admin-email.ts`
- `features/admin-overview/schemas/overview-params-schema.ts`; `features/admin-overview/server/`: `unit-stats-query.ts`, `add-all-row.ts`, `overview-export-columns.ts`
- Routes/pages: `app/api/admin/users/export/route.ts`, `app/api/admin/overview/export/route.ts`, `app/admin/users/page.tsx` + `error.tsx`, `app/admin/overview/page.tsx` (placeholder replaced) + `error.tsx`
- Tests: `tests/unit/admin-users/{user-list-params-schema,user-export-columns}.test.ts`, `tests/unit/admin-overview/{add-all-row,overview-params-schema,overview-export-columns}.test.ts`, `tests/integration/admin-users/*` (fixtures + 9 files), `tests/integration/admin-overview/*` (3 files)
- Admin nav: "User" already linked `ADMIN_ROUTES.users` (`/admin/users`) — **no change**.

## RED evidence (each test written first, failing for the intended reason)
| Test | RED | GREEN |
|---|---|---|
| profiles-role-audit-migration | 4 failed: `column "role_updated_by" of relation "profiles" does not exist` (RLS-unchanged case passed) | 5/5 |
| user-list-params-schema (unit) | module not found | 17/17 |
| add-all-row (unit) | module not found | 4/4 |
| user-role-service + user-role-concurrency | module not found | 12/12 (one test-data fix: env list is lower-case by schema) |
| ↳ mutation: naive check-then-act (admin count read before the lock, no actor check) | race test fails: `expected [ok, ok] to have a length of 1 but got 2` (zero admins) | restored byte-identical |
| user-admin-query + user-admin-query-paging | module not found | 21/21 |
| ↳ mutation: hearts over spam kudos + drop `nulls last` | 5 fail (numbers, spam, **parity**, six_badges_at desc, last_login_at desc) | restored |
| set-user-role-action | module not found | 7/7 |
| user-export-columns (unit) | module not found | 5/5 |
| user-export-route | module not found | 9/9 (one test-data fix: formula name must start with `=`) |
| overview-params-schema (unit) | module not found | 8/8 |
| unit-stats-query | module not found | 5/5 |
| ↳ mutation `lt(end)`→`lte(end)` | 3 fail: `[2,4,3,2,1]` vs `[2,3,3,2,1]` (00:00 next day leaked in) | restored |
| ↳ mutation `IS NOT DISTINCT FROM`→`=` | unassigned row metrics 0 (`expected 0 >= 1`) | restored |
| overview-export-columns (unit) | module moved aside → not found | 2/2 |
| overview-export-route | module not found | 5/5 |
| admin-users-page / admin-overview-page | users page missing; overview placeholder: `expected null to be '/login'`, `t is not a function` (5 fails) | 12/12 |
| admin-report-query-plan | `expected 15698.334 to be less than 500` (search + level filter) | worst 237 ms after planner guard |

## Gates (serial, final code)
| Gate | Result |
|---|---|
| `npx tsc --noEmit -p .` | exit 0 (whole project, UI components included) |
| `npm run lint` | exit 0 |
| `npm run test:unit` | 85 files / 943 tests passed |
| `npm run db:reset` | exit 0 (0000→0022 applied from scratch, seeds ok) |
| `npm run test:integration` | 93 files / 598 tests passed (147.7 s) |

## Contract deviation (forced)
`departments.id` is a **uuid** (phase 01 schema), the contracts said `number`. Changed to `string`:
`AdminUserRow.department.id`, `AdminUserFilterValues.unit` (`string | null`, `"none"` = unassigned), `AdminUserFilterOptions.departments[].id`, `UnitStatsRow.unitId`. Done first, before the UI agent's components landed; whole-project tsc passes. No other shape changed.

## Decisions made (please log)
1. **Role guard order:** lock admins `FOR UPDATE ORDER BY id` → NOT_FOUND → no-op if role already equal (BR-001) → SELF_DEMOTE → ENV_ADMIN → LAST_ADMIN → actor-in-locked-set (FORBIDDEN) → conditional UPDATE. Business guards precede the actor re-check so the double-demotion loser gets **409 LAST_ADMIN** (Success Criteria, spec §3.4: after a READ COMMITTED re-read the loser is no longer in the locked set); a demoted actor still never writes (every write path passes the actor check). With 3+ admins a mid-flight-demoted actor gets FORBIDDEN (tested).
2. `dir` default `desc` (matches UI `nextUserSort`); `sort` absent = name A–Z, id asc (dir ignored).
3. Sort: counts sort as numbers (0 when none); Level = distinct-sender count (no tier first asc, last desc); `six_badges_at`/`last_login_at` NULLS LAST both ways; final tie-break id asc.
4. Export errors reuse phase 08 `adminApiError`: **422 `{"code":"export_too_large"}`** (lower case, same as kudos export), **400 `invalid_params`** (q > 100 included), overview 400 `invalid_date_range`/`invalid_params`; 401/403 JSON before params; `Cache-Control: private, no-store`.
5. Users CSV: table headers in English (`ID, User, Email, Sent Kudos, Received Kudos, Total Heart, Level, Number of Badges, Time to get 6 Badges, Last Logged in, Role`), Level `New/Rising/Super/Legend Hero`, instants `dd/MM/yyyy HH:mm` ADMIN_TIMEZONE (reuses UI's `formatAdminDateTime`), "—" = empty cell, full uuid. Overview CSV: `No, Unit, Total member, Total sent kudos, Total received kudos, Total users with at least 1 kudo, Total received secret box`; "All" first with empty No; no row cap (spec A2).
6. Overview URL params `from`/`to` (same as UI helper). Invalid → `filter` = all time + `filterError` + all-time table; users invalid → default filter + unfiltered page 1.
7. Unassigned unit name from the server: `Chưa gán đơn vị` (vi) / `Unassigned` (en).
8. Unit filter options natural A–Z (vi collator), like Overview units. Options read failure → empty dropdown, **not** `loadError` (spec §5 filter-options-error); table failure → `loadError`.
9. `envAdmin` computed in TS from `ADMIN_EMAILS` with `completeLogin`'s normalization (trim + lower).
10. Header totals and `total` come from window functions in the page statement (one pass); page past the end clamped (extra probe only then).
11. **Planner guard:** `UserAdminQuery` reads run in a transaction with `SET LOCAL enable_nestloop = off` (see query plan notes).

## Query plan notes (EXPLAIN ANALYZE, local Supabase Postgres, worst of 3)
Seeded copy: TEMP tables `LIKE public.* INCLUDING ALL` with 5,000 profiles, 100,000 kudos (10 % spam), 200,000 hearts, 12k icons, 500 gifts, 10k boxes; exact app statements captured from the pool. Kept as `tests/integration/admin-users/admin-report-query-plan.test.ts` (budget 500 ms, ~7 s).

| Shape | Before guard | After guard |
|---|---|---|
| users default (name) | 182 ms* | 237 ms |
| users sort hearts desc | 120 ms* | 233 ms |
| users search + level rising | **15,698 ms** | 48 ms |
| users level new / role admin | — | 217 / 209 ms |
| users unit + sort level asc | — | 209 ms |
| users export 10,001 rows | — | 224 ms |
| overview from 2025-01-01 / all time | 86 ms | 90 / 82 ms |

\*before the seed fix, hearts were dated after `asOf` and not counted, so these were understated.
Root cause: `f_unaccent(...) ILIKE` on `profiles` is estimated at 1 row (actual 1,111), so the planner nested-loops over the aggregates. Hash aggregates survive rescans, but phase 09's `count(DISTINCT sender_id)` is a GroupAggregate and was recomputed per row (1,111 × 66k index rows). Drizzle can't emit `MATERIALIZED` CTEs or `OFFSET 0`, and the upstream fragment must not be copied, so the statement-scoped `SET LOCAL` was the least invasive fix. Main remaining cost: the hearts aggregation (all hearts on public kudos).

## Concerns
- `user-role-concurrency.test.ts` demotes every other admin in the shared DB for its duration (restored in `afterAll`). A crash mid-run would leave them demoted (env admins re-promote at next login). Integration must not run beside Playwright.
- The plan test asserts a 500 ms budget (local worst 237 ms) and could flag slow CI hardware.
- Cross-owner dependencies: CSV reuses UI-owned `features/admin-users/lib/format-admin-date-time.ts`; the error boundaries and metadata use UI-owned keys `adminUsers|adminOverview.{metaTitle,table.loadFailed,table.retry}` (a rename breaks them silently at runtime); the overview route imports `adminCsvFilename` from admin-users.
- `loading.tsx` for `/admin/users` and `/admin/overview` not created (outside my ownership; the admin layout is `instant = false`, so the pages block like `/admin/settings`). The UI has skeleton components if wanted.
- Docs impact: minor. Decision-log entries for items 1, 4 and 11, plus the uuid contract change.

## Unresolved questions
- Should the env-admin 409 and the English CSV headers be confirmed with BTC (plan Open items)?
