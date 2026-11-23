---
phase: 14
feature: F014, F015
priority: P2/P3
status: completed
depends_on: [08, 09, 10]
file_ownership:
  - features/admin-users/**
  - features/admin-overview/**
  - app/admin/users/**
  - app/admin/overview/**
  - app/api/admin/users/**
  - app/api/admin/overview/**
  - db/migrations/*_profiles_role_audit*
  - db/migrations/*_unaccent_search*        # only if phase 08 did not already ship it (see Open items)
  - tests/**/admin-users/**
  - tests/**/admin-overview/**
resolves: [C-11 (consumer), C-12, C-13 (F014/F015 side), C-14 (consumer), C-20 (no new table; profiles columns)]
---

# Phase 14 — Admin users & overview (F014 + F015)

## Context Links
- Spec: `spec/admin-user-management/functional-spec.md`, `technical-spec.md` (A1–A4, § 4.2, SM-001); `spec/admin-overview/functional-spec.md`, `technical-spec.md` (A1–A2, ALG-001)
- Screens: `spec/admin-user-management/screens/SCR-admin-user/spec.md` (Figma `773:26403`; dropdowns Unit `1002:15708`, Level `1002:15711`, Role `1002:15714`); `spec/admin-overview/screens/SCR-admin-overview/spec.md` (Figma `620:7712`, `860:14284`, `2492:9140`)
- Decisions: `spec/decision-log.md` — Level = Hero tier (C-12); hearts = hearts on kudos the user SENT, raw (C-11, D010); spam stops counting; `ADMIN_EMAILS` admins; Unit "Chưa gán đơn vị" row kept; Admin nav label "User"
- Conflicts: `spec/system/architecture.md` § Consistency Check C-11, C-12, C-13, C-14, C-20
- Upstream: 01 (`shared/admin/*`: `csv-serializer`, `date-range-filter`, `timezone`, `export-limit`; env `ADMIN_TIMEZONE`, `EXPORT_MAX_ROWS`, `ADMIN_EMAILS`), 02 (`profiles`, `departments`, `requireAdmin`, `last_login_at`), 06 (`HeartStatsQuery.receivedByUsers`, `heartCountsSubquery`), 08 (admin layout + top nav, `kudo_status`), 09 (`HeroTierQuery#getTiersByRecipientIds`, `tierFromCount`), 10 (`secret_boxes.granted_at`, `user_icons`, `mystery_gift_awards.completed_at`)

## Overview
- Priority: F014 P2, F015 P3 · Status: completed (2026-11-23; conditional pre-approved sign-off applied after all 3 conditions held — role mutation + migration are safety-critical)
- F014: Admin › User table (ID, Name, Email, Σ sent, Σ received, Total Heart, Level, Number of Badges, Time to get 6 Badges, Last logged in, Role, ⋯), filters Unit/Level/Role, accent-insensitive search, sortable columns, 20/page, CSV export, role change with guards.
- F015: Admin › Overview per-unit statistics with date range, "All" row, CSV export.
- Built together: both are read-mostly admin reports over the same tables + shared CSV/date utils (C-14); one migration only (role audit columns).

## Key Insights
- No own counts (C-11/C-12): Total Heart = `rawTotal` of `HeartStatsQuery`; Level = Hero tier of `HeroTierQuery`. Sort/filter across all users needs SQL, so the query reuses the upstream SQL fragments (`heartCountsSubquery` from 06; distinct-sender-count fragment + `tierFromCount` bounds from 09) and a **parity test** asserts page values equal `receivedByUsers(...).rawTotal` and `getTiersByRecipientIds(...)`. If 09 does not export a fragment, ask phase 09 owner to add `distinctSenderCountSubquery()` + `tierCountRange(tier)` (no SQL copy here).
- Level filter: `New | Rising | Super | Legend | none`; sort Level = sort by distinct-sender count (tier is monotone in it), NULLS FIRST asc.
- Counts = public kudos only (`status='public'`), evaluated at query time → Un Spam restores (BR-005). Anonymous kudos count for the real sender (C-13: admin sees real numbers; no sender identity shown on these screens anyway).
- Badges = `count(DISTINCT icon)` in `user_icons` (0–6, D002); Time to get 6 = `mystery_gift_awards.completed_at` else "—" (D003). Boxes are not clawed back on spam (BR-005 F015).
- Role change race (FR-406): one tx, `SELECT id FROM profiles WHERE role='admin' ORDER BY id FOR UPDATE` (deterministic lock order → no deadlock); actor must be in the locked set (re-check, closes the requireAdmin→tx gap); conditional `UPDATE … WHERE id=$u AND role<>$r` makes duplicates no-ops (BR-001).
- Env admins (phase 02 promotes on every login): demoting them would revert at next login. Planner decision: Role cell shows "Admin · env" badge, "Set as User" disabled with tooltip, server rejects `409 ENV_ADMIN`. Remove from `ADMIN_EMAILS` first.
- Overview attribution: sent → sender's unit, received + "users with ≥1 received" → recipient's unit, boxes → owner's unit (`granted_at`). Total member ignores date range (D004). "All" = sum of unit rows + unassigned row (BR-006), computed in TS from the same result → equality by construction. Each user in ≤1 unit → distinct-recipient sum is exact.
- Pages are RSC reading `searchParams` (URL = state, FR-401/FR-402); no `GET /api/admin/users` list endpoint (YAGNI). Exports are GET route handlers (file response). Role change = server action (C-18).

## Requirements
- F014: FR-001, FR-002, FR-101, FR-201..209, FR-401..408, FR-601..603; BR-001..006; DEC-001..003; SM-001; D002–D012 recommended defaults; D001 resolved by C-12.
- F015: FR-001, FR-002, FR-101, FR-201..207, FR-401..403, FR-601, FR-602; BR-001..006; DEC-001, DEC-002; D001..D011 recommended defaults (≥1 **received**; no presets D009; labels "Total received kudos", "Total users with at least 1 kudo", "Total received secret box" D010; units natural A–Z, unassigned last D011).
- Search: trim, max 100 chars (else validation message), `f_unaccent(lower(x)) LIKE '%'||f_unaccent(lower($q))||'%'` on name OR email, `%`/`_` escaped.
- Export: same filter/sort as table; `count > EXPORT_MAX_ROWS` → 422 `EXPORT_TOO_LARGE`, no file (DEC-002). Overview export includes "All" row.
- Non-functional: user page p95 < 500 ms at 5k users / 100k kudos; overview p95 < 500 ms; files < 200 lines.

## Architecture
```
/admin/users (RSC, requireAdmin) ─ userListParamsSchema(searchParams) ─► UserAdminQuery.listPage(params) ─► {rows,total}
   CTE base: profiles p LEFT JOIN departments d
     sent   = kudos public GROUP BY sender_id      recv = kudos public GROUP BY recipient_id
     hearts = heartCountsSubquery() ⋈ kudos public GROUP BY sender_id (raw)   [06 fragment]
     tierN  = distinctSenderCountSubquery()                                   [09 fragment]
     icons  = user_icons GROUP BY user_id count(DISTINCT icon) ; gift = mystery_gift_awards
   WHERE unit/role/tier-range/search ; ORDER BY <whitelisted col> NULLS LAST, id ; LIMIT 20 OFFSET ; count(*) OVER()
   row.level = tierFromCount(tierN)                                            [09 pure fn]
UserFilterOptionsQuery.get() → departments, 4 tiers + none, roles
RoleMenu (client) ─ confirm ─► setUserRoleAction ─► UserRoleService.setRole(tx) ─► {id, role} ; revalidatePath
GET /api/admin/users/export → requireAdmin → same params → count → assertWithinExportLimit → listAll → csv-serializer
/admin/overview (RSC, requireAdmin) ─ dateRangeFilter(searchParams) ─► UnitStatsQuery.byUnit([start,end)) ─► addAllRow()
GET /api/admin/overview/export → same → csv (All row first)
```
- Migration: `profiles ADD role_updated_by uuid NULL REFERENCES profiles(id) ON DELETE SET NULL, ADD role_updated_at timestamptz NULL` (additive, nullable). Unaccent: `CREATE EXTENSION IF NOT EXISTS unaccent` + `CREATE OR REPLACE FUNCTION f_unaccent(text) … IMMUTABLE` wrapper.
- Overview SQL: four grouped CTEs keyed by `department_id` (NULL = unassigned) LEFT JOINed onto `departments` ∪ {NULL}; COALESCE 0; unassigned row dropped when member count 0.

## Related Code Files
Create:
- `db/migrations/NNNN_profiles_role_audit.sql` (+ `shared/db/schema` profiles columns via drizzle — coordinate one-line edit with phase 02 owner), `db/migrations/NNNN_unaccent_search.sql` (conditional, see Open items)
- `features/admin-users/schemas/user-list-params-schema.ts`, `set-user-role-input-schema.ts`
- `features/admin-users/server/user-admin-query.ts`, `user-admin-sql-fragments.ts`, `user-filter-options-query.ts`, `user-role-service.ts`, `set-user-role-action.ts`, `user-export-columns.ts`
- `features/admin-users/components/user-table.tsx`, `user-table-filters.tsx`, `user-sortable-header.tsx`, `user-role-menu.tsx`, `user-role-confirm-dialog.tsx`, `user-pagination.tsx`
- `features/admin-overview/server/unit-stats-query.ts`, `add-all-row.ts`, `overview-export-columns.ts`
- `features/admin-overview/components/unit-stats-table.tsx`, `overview-date-range-picker.tsx`
- `app/admin/users/page.tsx`, `app/admin/users/error.tsx`, `app/admin/overview/page.tsx`, `app/admin/overview/error.tsx`, `app/api/admin/users/export/route.ts`, `app/api/admin/overview/export/route.ts`
- Tests: `tests/unit/admin-users/user-list-params-schema.test.ts`, `tests/unit/admin-overview/add-all-row.test.ts`; `tests/integration/admin-users/user-role-concurrency.test.ts`, `user-role-service.test.ts`, `user-admin-query.test.ts` (filters, search, sort, parity), `user-export-route.test.ts`; `tests/integration/admin-overview/unit-stats-query.test.ts`, `overview-export-route.test.ts`; `tests/integration/admin-users/profiles-role-audit-migration.test.ts`; `tests/e2e/admin-users/user-table-and-role.spec.ts`, `tests/e2e/admin-overview/overview-date-range.spec.ts`
Modify: `messages/vi.json`, `messages/en.json` — `adminUsers.*`, `adminOverview.*` only. Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` for route handler file responses (`Content-Disposition`), `searchParams` as Promise in pages, `forbidden()`; reuse the C-18 server-action convention from phase 06.
2. Migration (audit columns; unaccent if absent) + RLS stays on/no policy; up/down on local Supabase.
3. `user-list-params-schema.ts` (Zod: `page≥1`, `unit` int|`none`, `level` tier|`none`, `role`, `q≤100`, `sort` whitelist enum, `dir`); unit tests.
4. `user-admin-sql-fragments.ts`: aggregate CTEs composed from 06/09 fragments; `user-admin-query.ts`: `listPage`, `countAll`, `listAll(limit)` share one builder (BR-004).
5. Parity integration test vs `HeartStatsQuery.receivedByUsers` and `HeroTierQuery#getTiersByRecipientIds` on seeded data incl. spam + anonymous kudos.
6. `user-role-service.ts` per pseudocode (spec A3) + actor-in-locked-set check + env-admin check + conditional UPDATE; errors `NOT_FOUND 404`, `SELF_DEMOTE 403`, `LAST_ADMIN 409`, `ENV_ADMIN 409`. Action: `requireAdmin` → Zod → service → `{ok, id, role} | {error}`.
7. Concurrency tests (see Success Criteria) before UI.
8. Users page: filters (reset to page 1 on change), search debounce 300 ms, sortable headers, "—" for nulls (FR-208), ID = first 8 chars, dates `dd/MM/yyyy HH:mm` via `formatInZone`, empty/error states with retry.
9. Role menu (DEC-001) + confirm dialog; pending lock; update row on success; inline error copy from spec.
10. Users export route: columns = table minus actions; filename `users-YYYYMMDD-HHmm.csv` (admin tz).
11. `unit-stats-query.ts` + `add-all-row.ts` (pure; natural sort via `Intl.Collator('vi',{numeric:true})`); overview page with date range picker (from > to → error, table kept, FR-403), loading/error states.
12. Overview export route (All row first); i18n; tests per Scope Contract; reviewer.

## Todo List
- [x] Next.js 16 route handler / searchParams docs read (reviewer confirmed `error.tsx` `retry` prop against bundled docs)
- [x] Role audit migration 0022 (no unaccent migration: reuses `public.f_unaccent` from 0007)
- [x] User list params schema (+unit)
- [x] UserAdminQuery with 06/09 fragments + parity test
- [x] UserRoleService + action + guards; concurrency tests (20 races)
- [x] Users page, filters, sort, pagination, role menu + confirm
- [x] Users CSV export route
- [x] UnitStatsQuery + All row + overview page + date range
- [x] Overview CSV export route
- [x] e2e users + overview (141 passed incl. Overview at 375 px and users empty state)
- [x] Human sign-off (authz, role mutation, migration 0022) — conditional pre-approval applied 2026-11-23, gate SEALED
- [ ] BTC copy confirmation (see Next Steps)

## Evidence
- Reports in `plans/reports/`: `implementer-261123-phase-14-admin-backend.md`, `implementer-261123-phase-14-admin-ui.md`, `implementer-261123-phase-14-review-fixes.md`, `tester-261123-phase-14-full-run.md`, `reviewer-261123-phase-14.md`.
- Gates on final code (review-fix run, serial): tsc 0, lint 0, unit 943, integration 598, e2e 141 passed / 5 skipped by design, prelaunch 5, build 0, `test:prod` 16 PASS. Coverage not measured.
- Reviewer: 0 critical, 0 high, 1 Medium (fixed: helpers moved to `shared/admin/`), Lows deferred; verdict SEALED, `humanSignedOff: false`.
- `evidence/phase-14/` (inspection-verdict, study-context, RED logs), `evidence/screenshots/phase-14/` (desktop 1440x900, mobile 375x812).
- Docs: `docs/features/F014_AdminUserManagement/`, `docs/features/F015_AdminOverview/`, `docs/system/architecture.md` section "Admin User và Overview (F014, F015)".

## Success Criteria
- Admins A, B (only two) demote each other concurrently (20 iterations) → exactly one succeeds, other `409 LAST_ADMIN`; always ≥1 admin; no deadlock.
- Two admins promote the same user concurrently → both ok, one write; `role_updated_by` = first writer.
- Self-demotion → 403 even with other admins; env admin demotion → 409; non-admin calling action/export/page → 403, no write; actor demoted mid-flight → 403.
- Total Heart and Level equal `HeartStatsQuery.rawTotal` / `HeroTierQuery` for every row; spam kudo excluded, Un Spam restores; anonymous counted for sender.
- Search "nguyen" finds "Nguyễn", "đ" ↔ "d"; filters AND-combined; export rows = table rows across all pages; `> EXPORT_MAX_ROWS` → 422, no file; `=cmd` name rendered as text.
- Overview: All = Σ units + unassigned for every column; unassigned row only when such profiles exist; zero-activity units show 0; kudo at 23:59 +07 on `to` day included, 00:00 next day excluded; empty range = all time; URL reload reproduces numbers.

## Scope Contract
- **Changed:** admin-users + admin-overview features, two admin routes, two export routes, `profiles` audit columns migration, i18n keys.
- **Impacted:** `profiles` (02 schema + `requireAdmin` reads role), admin layout/nav (08), consumers of 06/09 fragments (read-only use), `shared/admin/*` (read-only use).
- **Will verify:** unit (params schema, All row); integration on local Supabase (role concurrency incl. double-demotion, all guards, BR-001 idempotency, migration up/down, query filters/search/sort/pagination, parity with 06/09, spam/anonymous rules, overview attribution + tz boundaries, export limit + CSV injection, 403 on every entry point); e2e (filter→sort→page→role change→export; overview range + export).
- **Deliberately skipped:** correctness of tier/heart/box rules themselves (06, 09, 10 own tests); CSV serializer internals (01 tests); login-time env promotion (02 tests).
- **Safety-critical → full test set required:** permissions (role change, admin guard), data mutation (`profiles.role`), migration (audit columns).

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Zero admins via concurrent demotion | M | H | FOR UPDATE on admin set, ordered by id; actor re-check; concurrency test |
| Drift from 06/09 count definitions | M | M | Reuse fragments only; parity test fails on drift |
| Slow page (5 aggregates × all users per request) | M | M | Grouped CTEs, indexes on `kudos(sender_id,status)`, `kudos(recipient_id,status)`; measure at 5k/100k; materialize only if p95 > 500 ms |
| Env admin demoted then silently re-promoted | M | L | Blocked with 409 + badge |
| Timezone off-by-one in range | M | M | `date-range-filter` half-open `[start,end)`; boundary tests |
| Unaccent missing / non-immutable in index | L | M | Extension `IF NOT EXISTS`, IMMUTABLE wrapper; seq scan acceptable at 5k users |

Rollback: down migration drops the two audit columns (no readers outside this phase); remove admin routes → nav links 404 only; no data rewritten. Role changes already made remain valid data (`user`/`admin`).

## Security Considerations
- `requireAdmin` first in every page, action and route; actor id from session only; role re-verified inside the tx.
- Sort/filter values whitelisted by Zod; search parameterized and LIKE-escaped; no raw interpolation.
- CSV via shared serializer (BOM + formula guard, FR-603/FR-602). Exports carry no kudo text or sender identity.
- RLS on, no client policies (C-20); all reads server-side.

## Next Steps
- Signed off 2026-11-23 (conditional pre-approval); status flipped to completed.
- Phase 09 fragments and phase 10 column names confirmed by use (parity test green).
- Docs promoted 2026-11-23 (F014/F015 technical specs, architecture, code standards, changelog, roadmap).
- Follow-ups, all Low, none blocks sign-off:
  - BTC to confirm English drafts, env-admin 409 `ENV_ADMIN` and English CSV headers.
  - `adminKudoExportFilename` (`features/admin-moderation/server/admin-kudo-export.ts`) duplicates `adminCsvFilename` (`shared/admin/admin-csv-filename.ts`); delegate when phase 08 code is next touched.
  - Per-page heart aggregation reads every heart on public kudos (233 ms at 100k kudos, grows linearly); revisit at 10x.
  - A demoted-in-flight actor can get `ok:true`, ENV_ADMIN or LAST_ADMIN before FORBIDDEN (no write possible; state oracle). Deferred.
  - `test:prod` does not cover `/admin/users` or the export routes; coverage not measured.
  - The query-plan test (budget 500 ms, local worst 237 ms) may flake on slow CI; `user-role-concurrency` must not run beside Playwright.

## Open items
- Env-admin demotion block (409 `ENV_ADMIN`) is a planner decision (phase 02 note); confirm with BTC.
- If phase 08 already ships `unaccent` + `f_unaccent` for Review content search, drop `*_unaccent_search*` here and reuse. Resolved: reused `public.f_unaccent` (0007); no unaccent migration.
- Still open: BTC confirmation of env-admin 409 and English CSV headers/copy.
