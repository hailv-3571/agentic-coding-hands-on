# Doc-writer report: phase 14 docs and plan sync (F014, F015)

Date: 2026-11-23. No git writes; `.claude/**`, code, tests and `.env.local` untouched. No `doc_lock: user` frontmatter found in the touched files. `.env.example` has no phase 14 diff, so no env/deploy doc changed.

## Files changed
Plan (English):
- `plans/261108-0048-saa-2025-kudos-platform/plan.md`: phase 14 row = "implemented, awaiting sign-off".
- `plans/261108-0048-saa-2025-kudos-platform/phase-14-admin-users-and-overview.md`: frontmatter and Overview status; todos checked where evidenced (sign-off and BTC left open); new Evidence section (5 reports, gates, `evidence/phase-14/`, screenshots, docs); Next Steps rewritten with follow-ups; Open items updated (unaccent resolved: reuses `f_unaccent` 0007).

Docs (Vietnamese, like the rest):
- `docs/features/F014_AdminUserManagement/technical-spec.md`: added "Thực tế implement" table (no list endpoint, server action in-band codes, no LevelQuery, URL param names, uuid unit, constants are not env); rewrote 5.2-5.4 (resolved vs open questions, source map). Now 434 lines.
- `docs/features/F015_AdminOverview/technical-spec.md`: same pattern (`from`/`to` not `dateFrom`/`dateTo`, All row in TS, no row cap, no migration); 5.2-5.4 rewritten.
- `docs/system/architecture.md`: new section "Admin User và Overview (F014, F015...)" (entry points, role-change lock order and guard order, migration 0022, planner guard `SET LOCAL enable_nestloop = off` with measured numbers, Overview attribution, shared/admin helpers); Module Boundaries rows F014/F015 and the `role_updated_*` ownership row updated. 563 lines.
- `docs/code-standards.md`: features list refreshed (added admin-overview, admin-users, notifications, profile); `shared/admin` now covers `adminCsvFilename` and `formatAdminDateTime` plus the rule "cross-admin helpers go in shared/admin"; bullet on report-query EXPLAIN budget and planner guard. 151 lines.
- `docs/project-changelog.md`: phase 14 entry (Added/Changed/Decisions/Chưa làm, test results). 386 lines.
- `docs/development-roadmap.md`: phase 14 "Đã implement, chờ ký duyệt"; 13/14 completed; phase 14 risks listed.
- This report.

All files are under 800 lines. Facts were taken from the five reports, decision-log and the code (grep/read of schema, service, routes, constants).

## Not done / left as is
- `functional-spec.md` for F014/F015 untouched (machine-owned sections; not surgically edited). Its D001 (LevelQuery) is superseded by C-12; the technical-spec note says so. Both technical specs still use "(planned)" handler names in §§ 2-4; the new table at the top of each is the correction. A `rebuild-spec` would clear that.
- `docs/system/permissions.md` not checked for role-change entries.
- Decision-log was not edited (already has the phase 14 entries per the task).

**Status:** DONE_WITH_CONCERNS
**Summary:** Plan, F014/F015 technical specs, architecture, code standards, changelog and roadmap now describe phase 14 as implemented and awaiting sign-off (not completed).
**Concerns/Blockers:** Specs keep stale "(planned)" names below the correction table; functional-spec D001 text stale. Open items recorded: BTC copy (English drafts, env-admin 409, English CSV headers), `adminKudoExportFilename` duplicate, linear heart aggregation, demoted-in-flight oracle, `test:prod` gap, coverage unmeasured.
