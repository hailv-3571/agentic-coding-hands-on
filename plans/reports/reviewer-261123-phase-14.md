# Review: phase 14 (F014 Admin users, F015 Admin overview)

Status: DONE. Static review only (tester was running suites; no tests run, no DB touched).

## Scope
- Files: features/admin-users/**, features/admin-overview/**, app/admin/{users,overview}/**, app/api/admin/{users,overview}/export, db/migrations/0022_* (+ snapshot, journal), shared/db/schema/profiles.ts, phase 08 components in features/admin-moderation/components, messages/*.json, tests/**/admin-users*, admin-overview*.
- Size: ~2,170 lines new feature code, 314/-151 in diff; no code file over 200 lines (max 159 new, 136 shared).
- Depth: full on the safety-critical paths.

## Assessment
Ready. No critical or high findings. The role-change service is correct: one lock order, a fresh re-read after the wait, and no path to zero admins. Access control, input handling and CSV are sound. One Medium (coupling), six Low (deferred).

## Critical
None.

## High
None.

## Medium
1. **Cross-feature coupling.** `app/api/admin/overview/export/route.ts:6` imports `adminCsvFilename` from `features/admin-users/server/user-export-columns.ts:54`. Fix: move it to `shared/admin/csv-filename.ts`, import from both routes. The other coupling in the reports (CSV uses `features/admin-users/lib/format-admin-date-time.ts`) stays inside the same feature and is a pure function, so it is fine.

## Low
- `user-role-service.ts:40-47`: a demoted-in-flight actor can get `ok:true` for an already-satisfied role, or ENV_ADMIN / LAST_ADMIN, before FORBIDDEN. No write possible. Deliberate (spec 3.4), minor state oracle. Defer.
- `user-admin-sql-fragments.ts:36`: every page and export aggregates all public-kudo hearts (233 ms at 100k kudos, within budget; linear growth). Defer.
- `user-admin-query.ts:35`: `enable_nestloop=off` is statement-wide; clamped page can open 3 transactions; the 500 ms plan test may flake on slow CI. Defer.
- `0022_profiles_role_audit.sql:10`: self-FK has no index; profile delete seq-scans (negligible at 5k). Defer.
- `user-role-concurrency.test.ts:17-21`: demotes all other admins in the shared DB until `afterAll`; local DB only. Defer.
- Plan todo boxes unchecked; decision-log, docs and changelog pending (delivery-tracker, doc-writer). Defer.

## Edge cases turned up (scouting)
- Two admins demote each other: set = {A,B} locked in id order; loser re-reads after the wait, B is no longer `role='admin'`, set = {A}, so LAST_ADMIN. Verified by reading; the 20-race test encodes the same.
- Stale-page actor who is the last admin's only peer: LAST_ADMIN, no write.
- Env admin promoted by login while a demotion runs: only raises the admin count; with a stale smaller set the answer errs toward LAST_ADMIN or ENV_ADMIN (safe side).
- Promotion of the same user twice: the second sees `role` already set (fresh statement), no write, `role_updated_by` = first writer.
- Out-of-range `?page`: clamped to the last page. Repeated query keys: invalid_params. q of 101 code points: query_too_long, and export 400.
- Unassigned unit: FULL JOIN + IS NOT DISTINCT FROM; row exists only when unassigned profiles exist.
- Leading `=`, `+`, `-`, `@`, tab, CR in name or email: apostrophe-guarded by the shared serializer.

## Focus checklist
- **Race / lock order:** pass. `ORDER BY id FOR UPDATE` in every change; LockRows sits above Sort so locks follow id order; no other writer locks several admin rows, so no cycle. FK check on `role_updated_by` hits the already-locked actor row.
- **Zero admins:** impossible. Demotion needs locked set >= 2, actor in set, actor != target; the actor remains. Conditional UPDATE is a second guard. A demoted actor cannot write: every write passes the actor-in-set check, with 3+ admins it gets FORBIDDEN.
- **Check order decision:** safe (see Low 1).
- **Access control:** `requireAdmin` first on both pages and the action (before Zod); `requireAdminApi` first on both exports, before param read. Actor id from session only; the input schema has `userId` and `role` only.
- **Injection:** sort via fixed column map after a Zod enum; unit is `uuid | "none"`, bound via `eq`; q is trimmed, LIKE-escaped (`\ % _`), bound, `escape '\'`.
- **Reuse:** hearts = `heartCountsSubquery` on public kudos joined to sender, asOf = now (matches `HeartStatsQuery.rawTotal`); Level = `HeroTierQuery.distinctSenderCountSubquery` + `tierCountRange`. No copied SQL.
- **Planner guard:** `SET LOCAL` inside `db.transaction`, ends at commit/rollback, cannot leak via pool or transaction-mode pooler. Hack but scoped, measured (15.7 s to 48 ms), documented, tested.
- **CSV:** guard via shared serializer, 422 on EXPORT_MAX_ROWS+1 in one read, no kudo text, `private, no-store`, code-only error bodies.
- **Overview:** one grouped subquery per metric, no cross join; All summed in TS from the same rows (distinct recipients add up because one department per profile); half-open range in ADMIN_TIMEZONE via the shared schema; `z.iso.date` rejects impossible dates.
- **Phase 08 generalisation:** thin wrapper with same props/labels/classes; optional props default to old copy; Review content call sites updated (href, fallbackFilename). No regression found by reading; the tester suites should confirm.
- **Accessibility:** menu and alertdialog semantics, focus return, busy lock, role=alert refusals. OK.
- **Migration:** additive, nullable, SET NULL FK, snapshot chain and journal consistent, down script present and tested in a rolled-back transaction.
- **Size:** all under 200 lines. i18n en/vi key sets identical. Next 16 `error.tsx` `retry` prop confirmed in bundled docs.

## Done well
- Lock-order and re-read reasoning written into the service header; 20-iteration race test with a held lock for a real race.
- Single query builder for page, totals and export (BR-004), window functions for totals, id tiebreak for stable pages.
- Planner problem measured and fixed at the narrowest scope with a regression test.
- Shared UI extracted (`AdminFilterSelect`, error panel, carets, skeleton) instead of copied.
- Down migration present and verified.

## Actions in order
1. Move `adminCsvFilename` to `shared/admin` (Medium, small).
2. Confirm with tester: Review content suites green after the generalisation, then plan test budget stability on CI.
3. Tick plan todos, log decisions (guard order, 422 code, planner guard, uuid contract), docs and changelog via doc-writer.
4. Human sign-off (role mutation, migration are safety-critical).

## Numbers
- Type coverage: not measured (static review; implementer reports whole-project tsc clean).
- Test coverage: not measured; 9 integration, 2 e2e, 9 unit files for this phase present.
- Lint findings: not run.

## Still unresolved
- Suites running at review time; results from the tester not seen.
- Env-admin 409 and English CSV headers still to confirm with BTC (implementer open item).
- Human sign-off pending (`humanSignedOff: false`).

Verdict JSON: plans/261108-0048-saa-2025-kudos-platform/evidence/phase-14/inspection-verdict.json

## Delta review (review-fix round)

- Medium resolved: `adminCsvFilename` now single-defined in `shared/admin/admin-csv-filename.ts` (server-only); both export routes import it. No reference to `format-admin-date-time` or the old definition remains. Body identical to before (same as kudos variant with prefix param).
- Boundary: `shared/admin/admin-date-time-format.ts` is pure (type-only import), safe for the users screen and CSV columns. No touched file over 200 lines (max 186).
- Tests: unit moves intact; `tsc --noEmit` clean, `vitest run tests/unit/shared` 63/63. New e2e (Overview 375 px, users empty state) assert real layout/behaviour, not just visibility. Integration/playwright not rerun (implementer gates).
- New Low (Defer): `features/admin-moderation/server/admin-kudo-export.ts:53` `adminKudoExportFilename` duplicates the shared helper; phase 08 code, replace when next touched.
- Verdict: SEALED, 0 critical; humanSignedOff stays false.

## Delta review (review-fix round)

- Medium resolved: `adminCsvFilename` now single-defined in `shared/admin/admin-csv-filename.ts` (server-only); both export routes import it. No reference to `format-admin-date-time` or the old definition remains. Body identical to the kudos variant (prefix param).
- Boundary: `shared/admin/admin-date-time-format.ts` is pure (type-only import), safe for the users screen and CSV columns. No touched file over 200 lines (max 186).
- Tests: `tsc --noEmit` clean, `vitest run tests/unit/shared` 63/63. New e2e (Overview 375 px, users empty state) assert real layout/behaviour. Integration/playwright not rerun (implementer gates).
- New Low (Defer): `features/admin-moderation/server/admin-kudo-export.ts:53` `adminKudoExportFilename` duplicates the shared helper; phase 08 code, replace when next touched.
- Verdict: SEALED, 0 critical; humanSignedOff stays false.
