# Tester report: phase 14 full run (F014 Admin users, F015 Admin overview)

Date: 2026-11-23 · Tree: working tree on `main` (uncommitted) · Dev server: reused `:3000` (not stale, not restarted)
Inputs: `plans/reports/implementer-261123-phase-14-admin-backend.md`, `plans/reports/implementer-261123-phase-14-admin-ui.md`, `plans/261108-0048-saa-2025-kudos-platform/evidence/phase-14/study-context.json`

## Scope Contract (as run)
- **Changed:** F014/F015 features, `/admin/users` and `/admin/overview` pages, two export routes, `setUserRoleAction`, migration 0022, phase 08 shared admin components, i18n.
- **Impacted:** `requireAdmin` (reads `profiles.role`), admin layout/nav, Review content screen (shared components and CSV export), HeartStats/HeroTier fragments.
- **Will verify:** the full suite, all layers, because the change touches permissions, role mutation and a migration (safety-critical).
- **Deliberately skipped:** nothing. Coverage measurement was not part of the requested gates and was not run.

## Commands (serial, in the requested order)

| # | Command | Exit | Result | Wall time |
|---|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | No type errors | 3.9 s |
| 2 | `npm run lint` | 0 | eslint clean | 10.8 s |
| 3 | `npm run test:unit` | 0 | 85 files, **943 passed**, 0 failed | 11.6 s (vitest 7.4 s) |
| 4 | `npm run db:reset` | 0 | migrations 0000→0022 applied; seeds departments=6, hashtags=8, secretBoxPrizes=9 | 22.8 s |
| 5 | `npm run test:integration` (alone) | 0 | 93 files, **598 passed**, 0 failed | 2 m 44 s |
| 5a | admin count before/after integration | — | before: 0 admins / 0 profiles; after: 0 admins / 0 profiles. Nobody left demoted | — |
| 6 | `npx playwright test --timeout 90000 --workers=3` (alone) | 0 | **139 passed**, 0 failed, 5 skipped (144 total) | ~2 m 34 s |
| 7 | `npm run test:e2e:prelaunch` | 0 | 5 passed, 1 skipped (the skip is the normal-server-only gate) | 30.2 s tests (plus its build) |
| 8 | `npm run build` | 0 | Compiled, no warnings in the log. Routes present: `/admin/users`, `/admin/overview`, `/api/admin/users/export`, `/api/admin/overview/export` | 11.1 s (Turbopack cache) |
| 9 | `npm run test:prod` | 0 | 16 of 16 status checks PASS | 4.8 s |

Exit codes come from `EXIT=$?` written to each log in the scratchpad (`p14run/`). None were rounded.

Flakes: none seen in this single pass. The two known flakes (spotlight-board counter, edit-kudo toast) passed on their first run, so no reruns were needed. This is one pass per gate, not a repeat-run flake study.

Screenshots (step not in the list, done after step 9): desktop 1440×900 and mobile 375×812 of `/admin/users` and `/admin/overview`, saved to `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-14/`:
- `desktop-admin-users-tester.png`, `mobile-admin-users-tester.png`
- `desktop-admin-overview-tester.png`, `mobile-admin-overview-tester.png`

Every page returned 200 with the correct H1 and 0 px horizontal page overflow. The capture ran as a Node script (`@playwright/test` chromium) with a temporary local admin, which was deleted afterwards. The capture command exit was masked by a `| tail` pipe; the output shows all four captures completed.

## Phase 14 e2e and integration by name (the criterion → test map)

Status key: PASS = asserted and passing. PARTIAL = a part is asserted, a named part is not. GAP = no test.

| # | Criterion (study-context.json) | Tests that map to it | Status |
|---|---|---|---|
| C1 | Two admins demote each other concurrently: exactly one succeeds, the other gets 409 LAST_ADMIN; at least one admin remains; no deadlock | integration `user-role-concurrency.test.ts` "never leaves zero admins: one wins, the other gets LAST_ADMIN (N races)"; "cannot be demoted by a caller who already lost the role"; `user-role-service.test.ts` "demotes another admin while other admins remain" | PARTIAL. Exactly-one and at-least-one-admin PASS. The refusal is asserted as in-band `LAST_ADMIN`, not HTTP 409 (see D1). "No deadlock" is only implied by the test completing; no explicit timeout assertion |
| C2 | Concurrent promotions of the same user are idempotent, one write; `role_updated_by` records the first writer | `user-role-service.test.ts` "two admins promoting the same user: both ok, one write, audited to the first writer (FR-406)"; "answers a repeat with the current role and keeps the first audit (BR-001)"; `profiles-role-audit-migration.test.ts` (columns, FK SET NULL) | PASS |
| C3 | Self-demotion 403; env-admin demotion 409 ENV_ADMIN; non-admin on page, action or export gets 403 with no write; actor demoted mid-flight gets 403 | `user-role-service.test.ts` "refuses self-demotion with SELF_DEMOTE…" and "refuses to demote an ADMIN_EMAILS admin with ENV_ADMIN…"; `set-user-role-action.test.ts` "answers 403 to a user and to an admin demoted after signing in, and writes nothing" (HTTP 403 asserted); `admin-users-page.test.ts` page and export 403 cases; `user-role-service.test.ts` "an actor demoted while its change waits on the lock gets FORBIDDEN…"; prod `member /admin/overview → 403` | PARTIAL. Non-admin page, action, export and "demoted after sign-in" PASS with HTTP 403. Self, ENV_ADMIN and mid-flight refusals are asserted as in-band codes, not 403/409 (D1) |
| C4 | Total Heart and Level equal HeartStatsQuery.rawTotal and HeroTierQuery for every row; spam excluded and Un Spam restores; anonymous kudos counted for the real sender | `user-admin-query.test.ts` "matches HeartStatsQuery.rawTotal and HeroTierQuery for every row…"; "stops counting a kudo marked spam and restores it on Un Spam"; "returns every column… counting public kudos only and anonymous ones for the real sender" | PASS |
| C5 | Search accent-insensitive on name or email; filters AND; sort and pagination follow the URL; q > 100 chars shows a validation message | `user-admin-query.test.ts` "searches name OR email ignoring case and Vietnamese marks"; "AND-combines unit, role, level and search"; `user-admin-query-paging.test.ts` "pages 20 at a time…"; unit `admin-user-url-params.test.ts` (URL writes filter, sort, dir, page); unit `user-list-params-schema.test.ts` "caps q at 100 characters…"; e2e `user-table-and-role.spec.ts` "filters, sorts and pages the table…" (asserts alert "Từ khoá tối đa 100 ký tự") | PASS |
| C6 | User export rows equal table rows across all pages; more than EXPORT_MAX_ROWS returns 422 with no file; formula-like values neutralised | `user-export-route.test.ts` "exports every page of the filter: the same rows in the same order as the table…"; "answers 422 export_too_large, with no file… exactly at the limit"; "writes a formula-looking name as text"; unit `user-export-columns.test.ts` "neutralises formula names and emails (FR-603)"; e2e `user-table-and-role.spec.ts` "Export downloads the CSV of the current filter" | PASS |
| C7 | Overview All row = sum of unit rows plus unassigned row, every column; unassigned row only when such profiles exist; zero-activity units show 0; date range half-open in ADMIN_TIMEZONE; empty range = all time; URL reproduces numbers; export includes All row | unit `add-all-row.test.ts` "sums every column over the unit rows and the unassigned row"; "keeps zero-activity units with zeros…"; integration `unit-stats-query.test.ts` "shows the unassigned row last, exactly when unassigned profiles exist, and All = Σ rows"; "attributes a Vietnamese-day range per unit…"; "counts all time without a range…"; "reproduces the same numbers on a reload"; unit `overview-params-schema.test.ts` "turns a day range into the half-open UTC range of Vietnamese days"; "reads no params… as all time"; `overview-export-route.test.ts` "matches the table for the same range: All first…"; unit `overview-export-columns.test.ts` "writes the All row first…"; e2e `overview-date-range.spec.ts` "…survives a reload, and All stays the sum of the units" and "Export downloads the CSV… with the All row first" | PASS |
| C8 | Both screens match the Figma layout on desktop; stay usable at 375 px; empty, loading and error states | Desktop Figma: no automated check (visual only, qualitative; see D2). 375 px Users: e2e "at 375 px › the page has no horizontal scroll; the table scrolls inside its own container" PASS. 375 px Overview: no test. Empty state: none at UI level. Loading: `loading.tsx` added, no test. Error: integration "sets loadError with an empty page when the table read fails…" and "sets loadError with no table when the read fails" (server state only, not rendered UI) | GAP / PARTIAL (see gaps G1–G4) |

Regression for shared components (phase 08 generalisation): all 13 `tests/e2e/admin-moderation` specs PASS, including "Export downloads the CSV of the current filter" for Review content. Integration `admin-moderation/admin-kudo-export-route.test.ts` PASS as part of the 598.

## Failures

None. No gate failed, no test failed on a rerun, and no test was edited, skipped or weakened. Production code was not touched.

## Discrepancies (need a decision; not failures of the run)

- **D1. HTTP status codes in the criteria vs in-band codes in the code.** Criteria C1 to C3 say 403 (self-demotion, mid-flight demotion) and 409 (ENV_ADMIN, LAST_ADMIN). `setUserRoleAction` and `UserRoleService` return in-band `{ ok: false, error: "SELF_DEMOTE" | "ENV_ADMIN" | "LAST_ADMIN" | "FORBIDDEN" }`, as `set-user-role-action.test.ts` ("passes guard refusals through in-band") and `user-role-concurrency.test.ts` assert. No test checks an HTTP 403 or 409 for these refusals. The mid-flight case gives in-band `FORBIDDEN` with no status. Options: (a) amend the criteria to in-band codes, or (b) add an explicit status mapping and tests. I did not change either.
- **D2. Figma layout differences, as the UI implementer documented them.** Nothing automated checks Figma. The implementer's list, which I did not re-verify pixel-by-pixel, includes: the users table is 1152 px wide instead of 1280, so headers wrap to 2–3 lines; Level shows the tier label ("New Hero"…) where Figma shows 1–5; the ID column is an 8-char short id; Level and Role selects are 144 px; the "All" row is Medium weight where the spec infers bold; the overview date inputs are 296 px instead of 256; the overview export-failure copy differs from the spec copy; English labels and headers with Vietnamese placeholders; the en copy is a draft. Per the visual-contract rules, these are discrepancies, not PASS. The screenshots are a qualitative judgment only, with no deterministic metric.

## Gaps (untested, ranked by risk)

1. **G1. Overview at 375 px.** No test. Users has one (no page-level horizontal scroll). In my 375 px capture, Overview has 0 px page overflow, but only the No, Unit and Total member columns are visible without scrolling inside the table container. The rest is reachable only by scrolling that container, with no visible affordance. Usable in the spec sense, but not tested or confirmed.
2. **G2. Loading state.** `app/admin/users/loading.tsx` and `app/admin/overview/loading.tsx` were added late by the orchestrator. No test asserts a skeleton renders, so they are unverified.
3. **G3. Empty states at UI level.** The "empty filter → page 1 of 1" case is tested at query level only. No test renders the zero-row message on either screen.
4. **G4. Error rendering.** `loadError` is asserted at server-state level. The error panel and its retry button are not checked in a browser.
5. **G5. "No deadlock" in C1** has no explicit assertion (no timeout or bounded-wait check). The current test only proves that the race finishes.
6. **G6. Production smoke does not cover the new screen.** `test:prod` checks `/admin/overview` and `/admin/review` only. It does not touch `/admin/users` or either export route.
7. **G7. Coverage not measured.** No coverage run was in the requested gates. Line, branch and function coverage are unknown for the phase 14 code.
8. **G8. Repeatability.** Each gate ran once. The concurrency tests (20 races) and the 375 px e2e have not been repeated to check for flakiness.

## Raw runs

Pipe-masked lines are noted in the summary. Those commands printed success output but their own exit codes were masked.

```json
[
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "No type errors; 3.9 s"},
  {"command": "npm run lint", "exitCode": 0, "summary": "eslint clean; 10.8 s"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "85 files, 943 tests passed, 0 failed"},
  {"command": "npm run db:reset", "exitCode": 0, "summary": "migrations 0000-0022 applied; seeds departments=6 hashtags=8 secretBoxPrizes=9"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "93 files, 598 tests passed, 0 failed; admins 0 before and 0 after"},
  {"command": "npx playwright test --timeout 90000 --workers=3", "exitCode": 0, "summary": "139 passed, 0 failed, 5 skipped of 144; all 7 phase 14 e2e pass; spotlight and edit-kudo passed first time"},
  {"command": "npm run test:e2e:prelaunch", "exitCode": 0, "summary": "5 passed, 1 skipped (normal-server gate)"},
  {"command": "npm run build", "exitCode": 0, "summary": "Compiled; admin users/overview pages and export routes present; no warnings in log"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "16 of 16 production status checks PASS (no /admin/users coverage)"},
  {"command": "node-capture-phase14 (4 screenshots, desktop 1440x900 and mobile 375x812)", "exitCode": 0, "summary": "pipe-masked (| tail); all 4 PNGs written with 200 status and 0 px page overflow"},
  {"command": "node-cleanup-temp-admin (deleteLocalSunner)", "exitCode": 0, "summary": "pipe-masked (| tail); temp admin deleted, profiles back to 0"}
]
```

## Concerns and actions taken
- `user-role-concurrency.test.ts` demotes every other admin for its duration and restores them in `afterAll`. The before/after check shows nothing was left demoted, and the run was alone.
- A stray helper file (`.scratch-log-path.tmp`) was created in the repo root during setup and deleted right away. No git writes, no `.env.local` read, nothing under `.claude/**` touched.
- The `:3000` dev server kept serving correct pages after `npm run build` overwrote `.next` mid-session. It was not restarted.
- Test-data cleanup: the temporary screenshot admin was deleted and its session file removed. The DB ends at 0 profiles, the same as the baseline.

**Status:** DONE_WITH_CONCERNS

**Summary:** All nine requested gates exited 0 with real codes: tsc, lint, unit 943/943, db:reset, integration 598/598 with no admin left demoted, e2e 139 passed and 0 failed (7/7 phase 14), prelaunch 5 passed, build clean, test:prod 16/16. The 8 acceptance criteria all have passing tests on the behaviour side. Two items need a decision: the criteria say 403/409 but the code returns in-band codes (D1), and the Figma differences are documented but not tested (D2).

**Concerns/Blockers:**
- D1: decide whether criteria C1 to C3 should use in-band codes or whether an HTTP mapping plus tests should be added.
- D2: accept or fix the documented Figma deviations. The UI agent also flagged the en copy as draft and the "All" row weight as open.
- G1 to G4: 375 px Overview, loading, empty and error UI states are untested. The loading files were added late and have no test.
- G6: `test:prod` does not cover `/admin/users` or the export routes.
- G7: coverage was not measured.
