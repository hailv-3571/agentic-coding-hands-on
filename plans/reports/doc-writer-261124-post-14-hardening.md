# doc-writer report: docs sync after post-phase-14 hardening

Date: 2026-11-24. Surgical sync only. `/tkm:rebuild-spec` was NOT run (no Python 3); `docs/.rebuild-state.json` and `docs/generated/**` untouched. No git writes, no code/tests/.claude edits, no secret files read. No `doc_lock: user` found in any edited file.

## Files changed
| File | Change |
|---|---|
| `docs/project-changelog.md` | New 2026-11-24 entry "Hardening sau phase 14" (Added/Changed/Fixed/Verified/Chưa làm) |
| `docs/system/architecture.md` | Drain section: item 5 replaced by 0023 prune jobs (table, 30d/7d, safety predicate, RLS scope, upsert, NOTICE no-op, host-cron `psql` fallback, no batching/index), item 6 other ops, item 7 local end-to-end verified (staging still open); fixed two stale statements (cron mechanism "TBD", "no cleanup") |
| `docs/features/F006_AwardsPortal/technical-spec.md` | Drift fixed: no `/awards` link on countdown, `/awards` gated pre-launch, real handler names (A1-A6), A1 assumption, Unresolved Question 1 resolved (proxy.ts) |
| `docs/features/F013_Notifications/technical-spec.md` | §4.1 File column: 9 `TBD (draft)` cells replaced with real paths (§2 names were already real) |
| `docs/features/F014_AdminUserManagement/technical-spec.md` | §2 table, §3 headers and BE lines (A1-A4), §4.1 rows now use real names/paths (`AdminUsersPage`, `UserFilterOptionsQuery.get`, `setUserRoleAction` -> `UserRoleService.setRole`, export route, `parseUserListParams`; `LevelQuery` marked non-existent) |
| `docs/features/F015_AdminOverview/technical-spec.md` | §2 table, §3 headers and BE lines, §4.1 rows: real names/paths, params `from`/`to`, `parseOverviewParams`, `adminDateRangeSchema`, `serializeCsv` |
| `plans/261108-0048-saa-2025-kudos-platform/phase-07-awards-portal.md` | O13 closed (spec fixed; roadmap row 07, phase 07 changelog entry and `test:e2e:prelaunch` row in code-standards verified present); L155 note updated |
| `plans/261108-0048-saa-2025-kudos-platform/handover-open-decisions.md` | C6 closed; section D row (~123): local cron drain verified, prune scheduled (0023), hosted/staging check stays open; new section E (rebuild-spec blocked, coverage 49% + 10 lowest files, push pending, 11 dev-only audit findings, staging check); TOC link |
| `docs/development-roadmap.md` | "Sau phase 14" note and remaining items; phase 14 risk line trimmed of closed items |

## Verification done
- Real names confirmed by grep/read: handlers, query objects, routes, params schemas, components, `0019` trigger migration, outbox schema and `DomainEventOutbox.add`.
- Migration 0023 schedule and command text read from the .sql file; coverage, test counts and cron-drain figures taken from the tester/implementer reports.
- `npm audit --omit=dev`: 0 vulnerabilities; `npm audit`: 11 moderate (confirmed).
- `PUBLIC_PATHS` (read): `/login`, `/auth/callback`, `/countdown`, `/access-denied` plus two internal job endpoints (`/api/internal/secret-box/tick`, `/api/internal/notifications/drain`). The user-facing allowlist is the four in the brief; the F006 A1 assumption names both groups.
- The two `psql` lines in architecture.md copy the migration's job commands; not executed against a DB.

## Left unchanged (needs rebuild-spec or a rewrite)
- F006/F013/F014/F015 `technical-spec.md`: remaining `TBD (draft)` Source cells (F006 27, F013 about 27, F014 25, F015 27) and §5 verification/source sections. Machine-owned; not surgically fixable.
- F014 (14 hits) and F015 (5 hits) still mention planned names (`LevelQuery`, `AdminUserFilterSchema`, `AdminOverviewFilterSchema`, `CsvSerializer`, `AdminDateRangeFilter`) in §4.4-4.6 and §5 prose; the "Thực tế implement" banner atop each covers them.
- F006 DEC-001 rows 3-4 still carry `TBD (draft)` as source.
- Phase 14 changelog "Chưa làm" lines (test:prod, coverage, filename Low) kept as historical record; the new entry supersedes them.
- `docs/code-standards.md` line 94 (cron scheduling) not edited; architecture.md carries the prune details.

**Status:** DONE_WITH_CONCERNS
**Summary:** Changelog, ops docs (architecture.md drain section with the two prune jobs, retention, RLS note, host-cron fallback), F006/F013/F014/F015 specs (surgical name and drift fixes), phase 07 O13, handover and roadmap are updated against the code.
**Concerns/Blockers:** rebuild-spec is still blocked (Python 3 missing), so remaining `TBD (draft)` cells and the §4.4-5 planned-name prose in F006/F013/F014/F015 stay; the staging cron check and the push are still open.
