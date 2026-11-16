# Phase 06 delivery sync (F005 hearts, F011 x2 campaigns)

Date: 2026-11-17 · Plan: `plans/261108-0048-saa-2025-kudos-platform/` · Edits: plan and docs only, no code.

## Task status

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | `phase-06-kudos-hearts-and-campaigns.md`: status completed, todos ticked, Delivery notes | Done | 11/11 todos ticked, each against a file or test that exists. Next steps line corrected (phase 08 seam not created) |
| 2 | Record 10 deviations | Done | Delivery notes, "Decisions that overrode the phase text" |
| 3 | Record 8 deferrals | Done | Delivery notes, "Deferrals and follow-ups" |
| 4 | `plan.md`: phase 06 completed | Done | Row 06 now `completed` |
| 5 | `docs/development-roadmap.md`: 6/14 | Done | Row 06 "Hoàn thành (2026-11-17)"; progress 6/14 |
| 6 | `docs/project-changelog.md`: phase 06 entry | Done | Entry added above phase 05 |

Verification done: `evidence/phase-06/inspection-verdict.json` is SEALED, 0 critical, `humanSignedOff: true`. The code checks for each todo and deviation were run by grep and glob: migrations 0010–0012 and `.down.sql`, `bigint` identity, `heartCountsSubquery(kudoIds, asOf?)`, `zonedDateTimeToUtc`, `workers: 3`, `writingOpen` on the detail page, the seam rewrites, and the absent phase 08 seam file.

## Test results (from the reports; not re-run here)
- `db:reset`, typecheck, lint, build: exit 0
- Unit 438/438 (36 files, UI fix round)
- Integration 269/269 (35 files, tester run before the UI fix round)
- E2E 71/71 on two consecutive runs (UI fix round, 3 workers)
- `test:prod` 13/13 (tester run before the UI fix round)

The tester report's BLOCKED status is superseded by the UI fix round. It is kept as written.

## Risk register

| Risk | Status | Note |
|------|--------|------|
| Duplicate hearts or double events under race | Closed | 20-way concurrency test, 1 row and 1 event |
| Overlapping campaigns via concurrent admins | Closed | EXCLUDE plus 23P01 mapping test |
| Grouped heart counts slow at scale | **Open** | `heartCountsSubquery` at about 50k hearts not measured |
| Timezone bugs in campaign input | Closed | 25 boundary cases. A years 0–99 bug was found and fixed in the shared helper |
| Reader failure blocks hearting | Closed | Resolver never throws; unit tests cover it |
| Heart spam clicking | Mitigated | Pending lock and unique constraint; rate limit deferred per plan |
| Phase 08 plan still names the seam file | **Open** (new) | Phase 08 must be updated by its owner |
| D003 ranking test never shown to fail under the bug | **Open** (new) | Needs a scratch mutation run |
| E2E flake under contention | Mitigated, not root-caused | Worker cap of 3 locally. Watch it on the next full run |
| Heart store not reset on sign-out | Accepted (low) | Stale entry only if props match; sign-out code outside ownership |

## Blockers
None hard. Phase 06 is complete on its done-criteria. Open items above do not stop phase 07 or 08 work.

## Next moves

1. **Phase 08 owner**: update the phase 08 plan text and `file_ownership` to drop `admin-kudo-heart-counts.ts`. Phase 08 counts come from `heartCountsSubquery` directly. Done when the phase 08 file no longer names the seam.
2. **Tester (needs user approval for a scratch edit)**: break the ranking to use the multiplier sum, run the D003 test, confirm it fails, then restore. Done when the test fails on the broken build and `git diff` on the implementation file is clean.
3. **Phase 06 backend owner**: time `heartCountsSubquery` with about 50k hearts. Done when p95 is written to the plan risk row. If p95 is over 300 ms, open a count-column phase. Or the user waives it in the decision log.
4. **Tester**: add a non-admin 403 check for `/admin/settings` to `test:prod`. Done when the check passes.
5. **Phase 01 owner**: decide the year floor for `adminDateRangeSchema`. Done when it is recorded in the decision log.
6. **Phase 10 and 13 owners**: confirm `HeartAdded` without `multiplier` is enough. Phase 10 should derive Secret Box totals from `HeartStatsQuery`. Done when each plan file says so.
7. **Main agent**: decide whether to rebuild the F005 and F011 feature docs with `/tkm:rebuild-spec --features F005,F011`. Done when run or waived by the user.

## Concerns/Blockers
- The report path follows the file name the user gave, not the `## Naming` pattern (`delivery-tracker-261117-0103-{slug}-report.md`). Say if the pattern should win.
- The architecture doc already has a phase 06 section. I did not edit it.
- Items 1 to 3 are new open gaps, not closed by this sync.
