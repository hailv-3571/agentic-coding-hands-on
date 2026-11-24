# rebuild-spec run — feature-specs pass 2, screen-specs pass, SCR sync and doc accuracy fixes

Date: 2026-11-24 · Skill: `rebuild-spec` (Skill tool) · Plan: `plans/261108-0048-saa-2025-kudos-platform/`
Wave log: `artifacts/_orchestrator-log.md` (section "FEATURE-SPECS PASS 2" onward). Nothing committed or pushed.
Kept decisions: docs root `docs/`, primary_lang vi, profile `web-js-ts`, `REBUILD_NO_GRAPH=1`, Python312 + the existing `run_with_posix_rename.py` shim for every writer script. No kit code under `.claude/` was edited and no `.env` file was read.

## 1. Outcome by step

| # | Step | Result |
|---|---|---|
| 1 | `--features F001,F002,F003,F004,F005,F007,F009,F011` | FS.1–FS.7 complete; all 8 now cite the current SCR/US/ROUTE codes. 16 files promoted, plus `fs7-complete.flag` |
| 2 | `--screen-specs` | SS.1–SS.3 complete. 20 specs (SCR001–SCR020) promoted to `docs/screens/`, plus `ss3-complete.flag` |
| 3 | Stale `docs/screens/` GC | 22 dirs deleted after inspection (plain `rm`, not staged) |
| 4 | `docs/_canonical-fcodes.json` | Replaced with the plan-dir canonical file (slugs identical) |
| 5 | Feature Entry Points in `screen-flow.md` | Filled from 15 real fragments (FS.1.5 done by hand) |
| 6 | Known accuracy errors plus open review warnings | All five named errors fixed after checking the code. Most other open warnings are fixed (see §4) |
| 7 | Consistency grep | No leftovers. The only non-matching SCR/US strings are template format examples and one historical changelog line |

## 2. Feature-specs pass 2 (8 features)

**FS.1 — drafting.**
- Every feature came back `chunk:false`, so each was drafted in a single pass.
- Wave 1: F001–F005. Wave 2: F007, F009, F011. Each researcher re-derived the spec from source; the published versions were stale pre-implementation takumi drafts.

**FS.2 — validators.** 0 critical; overall WARN. The warnings, all accepted:
- F001 `state_rung_missing` ×2 and F003 `alg_file_schema_missing` ×2. Both are heuristic false positives, confirmed by the reviewer.
- F009 `link.pre_migration`: F009 is a background feature with no SCR, so there is nothing to link.

**FS.5 — review.**
- Batch-01 (F001–F005) failed 5; batch-02 (F007/F009/F011) failed 3.
- All 8 criticals were the same reviewer-only rule: an FR in functional-spec § 4 with no SC `(covers …)` in technical-spec § 5.1.

**FS.6 — fix cycle 1.**
- 8 per-file fixers, then one re-reviewer. Result: **failed 0, missing 0**.
- A mechanical FR-minus-covers diff is empty for all 8 features.
- I fixed the two remaining warnings directly:
  - W4: region-token format.
  - W8: three SC lines now say which part has no automated test.

**FS.7 — promote and post-steps.**
- Gate passed, then promote with `--scope features --force`. `--force` was needed because the published destinations were `draft+takumi`.
- Then: confidence reports, `.stale` removed, cursor `feature-specs`, flag, navigation refresh.
- Translation: "Secondary languages: none registered"; `check_translation_gate` exit 0.

Findings the researchers raised from code, now recorded in the specs:
- **F003, anonymous → named edit.** The edit reveals the sender on the Kudo card, but the recipient's notification stays anonymous, because `actor_id` was written NULL at creation. Recorded as D004 / RISK-02.
- **F005, write window.** The write window is `[LAUNCH_AT, EVENT_END_AT)`, but the INSERT only checks the end. A heart sent before launch therefore gets the "event ended" copy. Recorded as RISK-01 / D001.
- **F007, `/api/admin/*` and the proxy.** `/api/admin/*` is not covered by proxy step 4b; only `requireAdminApi` guards it. ROUTE001 has no caller outside tests.
- **F011, campaign tooltip.** The "x2 tooltip" only uses a boolean. The migration comment about the GiST index serving `findActive` is wrong.

## 3. Screen-specs pass (20 screens)

- **SS.1.** 4 batches of 5. Because the existing `docs/screens` specs were takumi drafts with old codes, all 20 screens were treated as affected.
- **SS.2.** 4 reviewer batches; only batch-02 had a critical:
  - batch-01: failed 0, 7 warnings
  - batch-02: failed 1, 6 warnings. The critical was SCR010 citing line ranges past end of file.
  - batch-03: failed 0, 4 warnings
  - batch-04: failed 0, 8 warnings
- **Fixes.**
  - I fixed the critical directly.
  - My own scan found 16 more out-of-range `file:line` citations in the screen drafts and 2 in `docs/generated/permissions-matrix.md`. `validate_source_citations` does not catch these. All are fixed, and a re-scan shows 0.
  - One fix agent cleared the 25 warnings. Three of its fixes deviate from the reviewer's wording to match the code.
  - Merged result: `artifacts/screen-review-report.md` PASS.
- **Citation re-pointing.** The Entry Points insert shifted `screen-flow.md` by about 110 lines. I re-pointed 35 `screen-flow.md:NN` citations in the screen drafts by matching content (script plus 6 manual overrides). The fix agent re-checked them.
- **SS.3.** `promote_drafts --mode incremental --affected-screens SCR001..SCR020 --force`. The incremental scope promotes no core artifacts; it re-copies only `docs/system/overview.md`, which I verified was byte-identical first. Then:
  - confidence reports, navigation refresh and the translation gates (exit 0);
  - `build_source_to_fcode --mode incremental`, which updated `screen_spec_shas`. I then removed the stale SCR021–SCR027 keys.

## 4. Doc accuracy fixes — each checked against code (OOB edits to promoted docs)

**The five named errors**
- **F013, anonymous → named.**
  - Functional § 9 row: split into the two directions. Anonymous → named still shows "Một Sunner ẩn danh…".
  - Technical: BR-006 now states the asymmetry, and § 3.6 has a new edge row.
  - Evidence: `map-event-to-notifications.ts:36`, `notification-query.ts:42-43`.
- **F014, demoted admin.**
  - Functional § 8: the scenario is split. An admin already demoted gets a proxy 403 (`session-proxy.ts:93-110`). The client wrapper turns that into "Không cập nhật được role. Vui lòng thử lại." (`admin-user-role-menu.tsx:24-33`).
  - "Bạn không còn quyền Admin." appears only when the admin is demoted while the lock wait is in progress. The § 9 row and two AC bullets are corrected to match.
  - Tech § 3 edge row updated. The client-side message is inferred from code, not run.
- **F015, typos and Export rows.** `CECV` → `CEVC` in all 5 places. § 9 Export rows are split:
  - an Export failure shows the "Không xuất được tệp…" toast;
  - a date change after losing the role shows the 403 page;
  - a direct Export call gets a JSON 403;
  - "khoảng ngày sai" now applies only to a hand-built URL.
- **F013, links.** The 12 `../../docs/` links are fixed. F003 had the same defect and was fixed in its regenerated draft.
- **F008, prelaunch gate.**
  - A0 now states the proxy prelaunch gate: it runs after the session check, sends `/kudos` → 307 `/countdown`, and answers `GET /api/spotlight` → 403 `{code:"prelaunch"}`. A matching edge row was added, citing `prelaunch-gate.ts:56-70` and `session-proxy.ts:112-120`.
  - Also fixed: the leaked English template trailer (W7) and the A4 State rung, which now lists all 8 SM-001 edges (W8).

**Other pass-1 feature warnings, all fixed**
- F013: the bell's "tối đa 10" is a page size, not a cap (FR-201, § 6, § 10, § 13, CAP-03, tech A9).
- F012:
  - the A1 Writes cell now reads read-only, indirect through F010;
  - CAP-02/CAP-03 Screens cells corrected;
  - the API Map box is ticked, and BL009 is marked as an indirect dependency through `KudoPublicQuery`.

**Core W7a warnings fixed** (in `docs/generated` and `docs/system`)
- W1: ROUTE018 owners are now `F003, F004, F007`. It is used by F003, the F004 REG002 search and the F007 person filter. Updated in route-list, feature-list for F004/F007, and both canonical JSONs.
- W6: GUARD-004 pseudo-logic order corrected.
- W7/W8/W9 in entities.md:
  - the db-objects references are replaced with real BL/PERM codes;
  - the MODEL ranges in the Summary are fixed;
  - logical relations get their cardinality;
  - the UserIcon wording is corrected.
- W10/W11: checkboxes ticked only after a mechanical cross-reference check passed. The BL→US box stays unticked with a backlog note listing the 11 BL codes.
- W15: `SCR003_AppLayout/REG001_NotificationBell` slug.
- W16: Components counts are now one definition, `components/*.tsx`, across all 15 features.
- W18: the test devDependencies are added to architecture.md.

**New errors the researchers and reviewers found, verified and fixed in core docs**
- Footer label: "Tiêu chuẩn chung" and "About SAA 2025 / Award Information".
- Login button: "LOGIN With Google".
- PERM025: the edit-load route has no write-window check.
- US040 hosts: SCR006 added.
- Screen-flow:
  - SCR002 account-menu exits (Profile, Dashboard, Logout) added.
  - SCR010→Login: the trigger is a typed URL.
  - REG003→SCR015 row added; SCR015 self-link added.
  - Rules "Đóng": the Navigation API is tried first.
  - `requireSunner` redirects to onboarding without `next`.
  - SCR020 `unexpected` error added.
  - SCR019: changing only one end of the date range still navigates.
  - SCR018: there are 12 columns, the role menu on your own row is locked rather than hidden, the unit-options error is wrong, and a demoted-admin row was added.
  - SCR013: export 422 shows the `tooLarge` toast.
  - Spam: the Live board never shows spam cards.
  - SCR016→SCR015 condition.
  - SCR005: the Login branch is reachable only with a session that has no profile row; real guests are redirected to `/login` first.
- Screen-list:
  - SCR013 shows anonymous Kudos as the real name plus an "Ẩn danh" chip.
  - SCR014 has no status column, and the phase is `active`.
  - SCR015 header reads "Đã nhận: {count} Kudos".
  - The SCR018 table and role menu.
- Traceability matrix rebuilt: F004/F007 now include ROUTE018. Validator PASS.

**Open warnings left as-is (style only, or by design)**
- Core W2: PERM Related Modules hold F### suffixes.
- Core W3: the F005 `ui` vs F009 `background` convention.
- Core W4: SCR005 has no route row.
- Core W12: US034–048 have no `Criterion N:` labels.
- Core W13/W14: IPE notes.
- Core W17: the behavior-logic appendix sections.
- Core W19: bare `REG###` mentions.
- F010/F012/F013 `state_rung_missing` warnings: heuristic false positives.

## 5. Validators (final)
- `validate_screen_flow`, `validate_screen_list`, `validate_route_list`, `validate_feature_api_link` (docs root) and `validate_traceability_matrix`: all PASS.
- `fs-validation-summary.json`: WARN, 0 critical.
- `validate_reading_guide_db_impact`: PASS.
- `check_translation_gate`: exit 0 for both `feature-specs` and `screen-specs`.
- Out-of-range citation scan across all drafts and `docs/`: 0.

## 6. Files

**Modified (docs/)**
- State files: `.rebuild-state.json`, `_canonical-fcodes.json`, `_source-to-fcode.json`.
- Navigation READMEs: `README.md` plus those under `features/`, `generated/`, `system/` and `journals/`.
- All 15 `features/F###/README.md`.
- Feature specs, both files: F001, F002, F003, F004, F005, F007, F009, F011 (regenerated); F012, F013, F014, F015 (fixed).
- F008: `technical-spec.md` and its confidence report.
- `generated/`: behavior-logic, entities, feature-list, permissions-matrix, route-list, screen-flow, screen-list, traceability-matrix, user-stories.
- `system/architecture.md`.

**New (docs/)**
- 8 `features/F###/confidence-report_technical-spec.md`.
- `screens/SCR006_KudoDetail` … `SCR020_OnboardingDepartment`: new directories, each with `spec.md` and `confidence-report_spec.md`.
- SCR001–SCR005: spec rewritten, confidence report added.

**Deleted (docs/screens/, 22 dirs; each held one tracked, unmodified takumi draft `spec.md`)**
SCR006_WriteKudoModal, SCR007_KudoDetail, SCR008_KudosLiveBoardFeed, SCR009_AwardsSystem, SCR010_CommunityStandards, SCR011_CountdownPrelaunch, SCR012_Homepage, SCR013_Rules, SCR014_AdminReviewContent, SCR015_SpamAlertOverlay, SCR016_SpotlightBoardRegion, SCR017_LiveBoardRewardsColumn, SCR018_SecretBoxOpen, SCR019_AdminCampaignSettings, SCR020_CampaignFormModal, SCR021_AvatarHoverCard, SCR022_OtherProfile, SCR023_OwnProfile, SCR024_AllNotifications, SCR025_NotificationDropdown, SCR026_AdminUser, SCR027_AdminOverview.

**Plan artifacts** (`plans/261108-0048-saa-2025-kudos-platform/artifacts/`)
- New drafts: `features/F00{1,2,3,4,5,7,9}`, `F011`, and `screens/SCR001-020`.
- Reports: `feature-review-batch-01/02.md`, `feature-review-report.md`, `screen-review-batch-01..04.md`, `screen-review-report.md`.
- Validation: `validation/fs-validation-summary.json` and `_fs1-*`, `_fs2b-*`, `_ss1-*`, `_post-*` JSONs.
- Flags: `fs7-complete.flag`, `ss3-complete.flag`.
- Archive: `_archive-fs-pass1-F006-F015/`.
- Updated: `_canonical-fcodes.json` (ROUTE018 and the REG slug).
- Re-synced from the promoted docs: drafts for F006/F008/F010/F012–F015 and the core drafts. Done so a later promote does not revert the out-of-band fixes.

## 7. Concerns
1. **Navigation README dead links (kit defect, not fixed).**
   - `build_navigation.py` writes 9 per-feature README links to `screens/SCR###_X/REG###_Y/spec.md`, which never exists because regions have no screen spec.
   - Affected: F003, F004, F005, F008, F010 and F013.
   - The links sit in the generated zone, so a hand fix would be overwritten. The kit should link to the parent SCR spec instead.
2. **Validator gaps (kit).**
   - `validate_source_citations` does not flag line ranges past end of file; 18 slipped through and were caught by my own scan.
   - The pipeline's `--plan-dir … --spec` form is still rejected, and `--spec` takes a file, not a dir.
   - FS.1.5 is still a no-op once the core W9 has stubbed `{POPULATED_BY_W6}`. I consolidated the fragments by hand.
3. **Out-of-band edits.**
   - About 20 promoted core docs were hand-edited after verification against code. The next incremental core run will print `[OUT_OF_BAND_EDIT]`, which is non-blocking.
   - I synced the core drafts in the plan dir to match.
   - The `wave9-complete.flag` hash list no longer matches those docs.
4. **Cursors.** `last_rebuild_sha` and `last_feature_spec_run_sha` are now `b68d523` (HEAD). The commits since `6e34454` are docs/chore only.
5. **Concurrency.** Peak concurrency briefly reached 6 agents, one over the 5-agent cap, during FS.6 because I miscounted. I also ran the screen-specs pass in parallel with feature-specs; the skill allows this and the cap otherwise held.
6. **Not run in a browser.**
   - A few UI outcomes are inferred from code and marked as such in the specs: the generic error copy after a proxy 403 on a Server Action, and the SCR004 prelaunch exit.
   - Some SC lines say no automated test exists, e.g. the F003 5-hashtag lock and the F001 button lock.
7. **Untracked agent memory.** Subagents may have written their own memory under the untracked `.claude/agent-memory/`. Exclude it from the commit if it is unwanted.

**Status:** DONE_WITH_CONCERNS
