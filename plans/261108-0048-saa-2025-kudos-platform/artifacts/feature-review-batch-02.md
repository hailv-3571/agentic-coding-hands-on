---
failed: 2
warnings: 3
missing: 0
result: FAIL
---
<!--
`failed`: count of critical issues (0 = all pass).
`warnings`: count of warning issues.
`missing`: fcodes flagged MISSING due to `.pending` marker (none: F014 and F015 each hold exactly technical-spec.md + functional-spec.md, no `.pending`).
`result`: PASS iff `failed === 0 && missing === 0`.
Batch: WaveFS5.batch-02 (feature-spec-review F014..F015). Core artifact sections skipped (handled by W7a).
-->

# Review Report — Rebuild-Spec Feature Specs (batch-02)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: 2 feature specs (F014_AdminUserManagement, F015_AdminOverview); core artifacts not re-reviewed (W7a)
**Validator pre-check**: `fs-validation-summary.json` F014 PASS (0/0), F015 PASS (0/0); citation, feature_screen_link, feature_api_link, reading_guide_db_impact all PASS. No warning rule_ids to cite for these two fcodes (overall WARN comes from F010, outside this batch).

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 0 core + 2 feature specs (4 files) |
| Critical issues | 2 |
| Warnings | 3 |
| Missing (`.pending` markers) | 0 |
| Result | **FAIL** |

Semantic read: both specs are well grounded. About 75 `Source` citations spot-checked against real code (all ranges contain the described logic), cross-refs to feature-list / user-stories / screen-list / route-list / entities / permissions-matrix resolve, UI strings match `messages/vi.json`. Defects are verification coverage (reviewer-only rule, no validator catches it) and three behavior/wording inaccuracies.

---

## Critical Issues

### C1: F014 — five FRs verified by no SC (§ 5.1 coverage hole) — OPEN
- **Severity**: critical
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F014_AdminUserManagement/technical-spec.md:411-421`
- **Description**: Checklist rule "Every FR-### is covered by >=1 SC-### via the `(covers ...)` back-ref in § 5.1; uncovered FR = critical". Set difference of the 29 FR-### in `functional-spec.md § 4` vs the union of `(covers ...)` in SC-001..SC-011 leaves FR-101 (menu entry), FR-102 (URL is the state), FR-201 (column set, 8-char id, date format), FR-208 ("—" for empty cells), FR-210 (header totals over the whole filter). No validator enforces this, so the deterministic PASS says nothing about it. The US009 Acceptance Scenarios (lines 429-432) cover paging, `q` too long, page clamp and unaccented search only, so they do not close the gap. These are the A1 behaviours a tester most needs (columns, dash, whole-filter totals, URL round-trip).
- **Fix**: add two SC lines under § 5.1, e.g. `SC-012 (A1) Bảng có đủ 12 cột đúng thứ tự, ID rút gọn 8 ký tự, ô chưa có giá trị hiện "—", tiêu đề hai cột Kudo kèm tổng của cả bộ lọc chứ không chỉ trang đang xem (covers FR-201, FR-208, FR-210)` and `SC-013 (A1) Mục "User" trên menu Admin mở /admin/users; đổi lọc, tìm, sắp xếp, trang ghi lên URL, tải lại hoặc mở link ở tab khác ra cùng kết quả (covers FR-101, FR-102)`. Optionally mirror FR-102/FR-208/FR-210 in `functional-spec.md § 10`.

### C2: F015 — three FRs verified by no SC (§ 5.1 coverage hole) — OPEN
- **Severity**: critical
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F015_AdminOverview/technical-spec.md:386-395`
- **Description**: Same rule as C1. Of 18 FR-###, uncovered by any `(covers ...)` in SC-001..SC-010: FR-001 (each Sunner in at most one unit, figures follow the current `department_id`, no history), FR-101 (Overview tab and Dashboard menu entry), FR-206 (whole table on one page, no pagination; only mentioned as an assumption at line 422, not verified). SC-010 covers FR-102 only.
- **Fix**: extend `SC-010` to `(A1) /admin chuyển về /admin/overview; tab "Overview" và mục "Dashboard" cùng mở trang (covers FR-101, FR-102)`; add `SC-011 (A2) Đổi department_id của một Sunner thì lần đọc kế số liệu của người đó chuyển sang đơn vị mới (hoặc "Chưa gán đơn vị"), không có lịch sử (covers FR-001)`; append to `SC-001` or `SC-007` "nhiều đơn vị vẫn hiện trên một trang, không phân trang (covers FR-206)".

---

## Warnings

### W1: F014 — functional spec states the wrong trigger for the in-dialog "Bạn không còn quyền Admin." — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F014_AdminUserManagement/functional-spec.md:206-208` (same claim again at `:250`; related `:154`, `:167`)
- **Description**: § 8 scenario "Error: người thao tác đã bị hạ" says an Admin demoted while the dialog is open, on "Xác nhận", sees "Bạn không còn quyền Admin." in the dialog; § 9 row at :250 repeats it for "bị hạ trong lúc đang mở trang". Code: `setUserRoleAction` calls `requireAdmin()` first (`set-user-role-action.ts:19`), which re-reads `profiles.role` and calls `forbidden()` (`shared/auth/admin-guard.ts:30-35`); on a server-action POST the proxy step 4b already answers JSON 403 (`shared/auth/session-proxy.ts:93-110`). Test `tests/integration/admin-users/set-user-role-action.test.ts:48` ("answers 403 to ... an admin demoted after signing in, and writes nothing"). The in-band `FORBIDDEN` (dialog text) only occurs when the actor is demoted while the transaction waits on the admin-row lock (`user-role-service.ts:47`), exactly what canonical `user-stories.md:669` ("Actor bị hạ trong lúc chờ khoá") and `technical-spec.md:442` say. The twin tech spec already has it right (edge row `:191`). A QA case written from § 8/§ 9 would fail against the build. Which UI the 403 produces (403 page vs generic "Không cập nhật được role...") was not run here, so it is unproven.
- **Fix**: § 8: change the Given to "Admin bị hạ trong lúc lệnh của họ đang chờ khoá" (keep the dialog message). Add a second scenario/§ 9 row "Admin đã bị hạ trước khi bấm Xác nhận → bị chặn ở lớp kiểm tra quyền (403), không ghi gì", user-facing message taken from an e2e observation or tagged `[UNVERIFIED]`. Reword :250 to the lock-wait case.

### W2: F015 — department example "CECV2 / CECV10" is a typo of the real names "CEVC2 / CEVC10" — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F015_AdminOverview/functional-spec.md:51` (also `functional-spec.md:210`, `technical-spec.md:103`, `technical-spec.md:356`, `technical-spec.md:392`)
- **Description**: Seeded names are `CEVC1..` (`db/seeds/departments.ts:11-14`), the code comment says "CEVC2 before CEVC10" (`features/admin-overview/server/add-all-row.ts:7`), and sibling F014 spells it correctly. The ordering rule (FR-202, SC-007, ALG-002) is expressed through a department name that does not exist; a tester seeding "CECV2" or searching the table for it gets nothing.
- **Fix**: replace `CECV` with `CEVC` in all five places.

### W3: F015 — § 9 contradicts itself (and canonical US004) on what Export shows after a lost Admin role — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F015_AdminOverview/functional-spec.md:201`
- **Description**: Row :201 "Admin bị hạ role giữa chừng | thao tác kế (đổi ngày, Export) bị từ chối | 'Bạn không có quyền truy cập tài nguyên này.'" while row :198 and § 8 `US004 — Error` (:172) give "Không xuất được tệp. Vui lòng thử lại." for the same Export call, and canonical `user-stories.md:386` says "Endpoint trả 403, hiện toast lỗi". Code: Export route returns JSON `{ code: "forbidden" }` (`admin-api-guard.ts:22`) and `ReviewExportButton` maps any `!response.ok` to the `export.failed` toast (`review-export-button.tsx:46`); the 403-page copy appears only for page navigation (date change). Related: row :199 lists the 403-page sentence for a direct Export call (JSON only, no message), and row :198 lists "khoảng ngày sai" as a UI Export failure although the UI exports all-time on a bad range (DEC-003, `admin-overview-screen.tsx:57`), so it is reachable only by a hand-built URL.
- **Fix**: split :201 into "đổi ngày → trang bị từ chối (403 page)" and "Export → toast 'Không xuất được tệp...', không tệp"; in :199 say "gọi thẳng Export: JSON 403, không có số liệu"; in :198 drop "khoảng ngày sai" or note it applies to a hand-built URL only.

---

## Notes (non-blocking, not counted)

- N1 (F015 tech `:250,259,268`): `Source: docs/generated/entities.md § Profile|Kudo|SecretBox > Discriminator Fields` use short names; real headings are `MODEL004_Profile`, `MODEL003_Kudo`, `MODEL011_SecretBox` (F014 uses the full form). Align for anchor resolution.
- N2 (F014 tech `:477`): § 5.3 item 3 is a resolved drift log vs the "previously published spec" (US001-004 renamed, etc.) filed under "Unresolved Questions". Belongs in a journal/changelog; keep § 5.3 for open items only.
- N3 (F014 functional § 9): BR-004 documents LIKE-wildcard escaping (`\`, `%`, `_`) but no QA-visible edge row exists for searching those characters, nor for a valid-uuid `unit` that matches no department (empty table + "Xoá bộ lọc").
- N4 (core artifacts, route to W7a owner): `feature-list.md` F014 lists only MODEL004 and PERM017/018, F015 lists "Related Permissions: None"; `traceability-matrix.md:29` shows F015 PERM "—". The specs' § 5.5 (MODEL001/003/004/008/012/013 + PERM006/014/015; PERM003/014/015) match code and `permissions-matrix.md:576,613`. No spec change.
- N5 (code-side, informational): comments in `features/admin-users/server/env-admin-email.ts` ("answers 409 ENV_ADMIN") and `lib/admin-user-role-menu-state.ts` ("403 SELF_DEMOTE") describe HTTP codes; the specs correctly say refusals are in-band (C-18). Not a spec defect.
- N6 (trivial range drift, no action): F015 tech cites `admin-overview-skeleton.tsx:9-22` (actual 9-23), `use-external-reset-key.ts:13-20` (13-21), `admin-csv-filename.ts:5-9` (4-9); logic is inside each range.

---

## Passed Checks

<!-- Reviewer task closure: on successful write of this file, call
     TaskUpdate(status=completed) on your task id before returning. -->

✓ existence.folder_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ existence.folder_incomplete @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ existence.slug_format @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ existence.orphan_folder @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ existence.canonical_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.required_sections @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.screen_flow_crossref @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.bw_steps @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.deprecated_headings @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.no_appendix @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.edge_cases @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.f_code_format @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.sm_mermaid @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.pseudocode_length @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.pseudocode_fence @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ Universal.no_placeholder @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ citation.file_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ citation.range_invalid @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ citation.range_inverted @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ citation.path_traversal @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ citation.unreadable @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.linked_fr_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.br_linked_fr_present @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.disc_boolean @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.missing_client_behavior_anchor @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.alg_file_schema_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.retired_section_present @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.tech_sections_pre_sot @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.sysdesign_subsections @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.verification_subsections @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.capability_buckets_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.capability_twin_skew @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.us_narrative_present @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.action_index_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.action_key_not_handler @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.action_unclaimed @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.rung_order @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.rung_empty_rendered @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.state_rung_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.action_ref_unglossed @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.rule_bin_misplaced @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.crosscutting_unlabelled @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.diagram_required_missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.diagram_cites_file_line @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.diagram_over_cap @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.missing @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.missing_h2 @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.sections_pre_sot @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.dev_token @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.secret_shape @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.screens_scr_unresolved @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.edge_cases_few_rows @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.rule_density @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.open_decisions_shape @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.code_orphan @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.code_unsurfaced @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.edge_behaviour_dangling @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.capabilities_empty @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.capability_fr_dangling @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.risk_as_rule @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ func.user_story_shape @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ cap.code_unclaimed @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ cap.double_claimed @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ cap.claims_unfilled @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ cap.analysis_required @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ cap.review_advised @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ cap.promote_candidate @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ link.route_unresolved @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ link.feature_unresolved @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ link.owner_mismatch @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ link.pre_migration @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ link.unmapped @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ link.inventory_absent @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ reading_guide.pre_migration @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ reading_guide.malformed @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ reading_guide.unmapped @ F014_AdminUserManagement..F015_AdminOverview (2/2) [deterministic-pass]
✓ FeatureSpec.polymorphic_behavior_present @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass: validator gated on retired § 3.2, read § 4.2 by hand]
✓ FeatureSpec.dec_blocks_well_formed @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass: DEC rows are table-shaped, validator vacuous, 5 columns + Source read by hand]
✓ FeatureSpec.dec_lazy_na @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass: no N/A DEC sections]
✓ FeatureSpec.source_citations_ground_truth @ F014_AdminUserManagement [manual-pass]
✓ FeatureSpec.source_citations_ground_truth @ F015_AdminOverview [manual-pass]
✓ FeatureSpec.crossref_featurelist @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FeatureSpec.crossref_userstories @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FeatureSpec.crossref_screens @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FeatureSpec.crossref_routes @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FeatureSpec.crossref_entities @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FeatureSpec.crossref_permissions @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FeatureSpec.br_depth_and_grounding @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ func.dev_identifier_leak @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FeatureSpec.pending_marker_rule @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FailureTrap.1_proliferation @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass: SCR018/SCR019 atomic, no REG]
✓ FailureTrap.2_tab_stepper @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FailureTrap.3_shared_data @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FailureTrap.4_loc_over_split @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FailureTrap.5_spec_orphan @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]
✓ FailureTrap.6_inferred_signal_abuse @ F014_AdminUserManagement..F015_AdminOverview (2/2) [manual-pass]

Not credited (superseded/retired in the coverage table, so no verdict): `FeatureSpec.ccl_subsections`, `FeatureSpec.ccl_blank`, `FeatureSpec.mapping_table_missing`, `FeatureSpec.mapping_restates_story`, `FeatureSpec.decision_logic_section_present`, `FeatureSpec.action_double_claimed`, `db_impact.*`. Out of FS.5 scope: `BehaviorLogic.*`, `gate.*`.

---

## Metrics

| Metric | Value |
|--------|-------|
| Feature Specs | 2 |
| User Stories | 6 (US009-US012, US003, US004) |
| Screens | 2 (SCR018, SCR019) |
| Background Logic Items | 0 |
| Permissions | 6 referenced (PERM003, 006, 014, 015, 017, 018) |
| Backend Route Rows | 3 (ROUTE003, ROUTE004, ROUTE032) |
| Frontend Pages | 2 (/admin/users, /admin/overview; /admin is a redirect) |
| Data Model Entities | 7 referenced (MODEL001, 003, 004, 008, 011, 012, 013) |

---

## Edge Cases Turned Up (scouting pass, beyond the diff)

- Demoted actor has two distinct paths (guard 403 before the service vs in-band `FORBIDDEN` while waiting on the admin-row lock); only the second shows the dialog text. Drives W1.
- `target.role === role` returns ok before the actor-still-admin check (`user-role-service.ts:40` before `:47`): a demoted actor re-promoting an existing Admin gets success with no write. Already recorded as F014 RISK-01, correct.
- Mutual demotion with exactly two Admins: traced through READ COMMITTED lock re-check; loser sees `admins.length == 1` and gets `LAST_ADMIN` before the `FORBIDDEN` check, as the spec says.
- `/api/admin/*` is outside proxy gate 4b (`isAdminPath` matches `/admin`, `/admin/*` only): export routes rely solely on `requireAdminApi()`; both specs document this (F014 RISK-02, F015 RISK-07). `tests/prod/production-admin-403-status.ts:144-152` covers it.
- F015: unit with zero members and zero activity still renders (FULL JOIN + coalesce); a recipient with NULL `department_id` lands in "Chưa gán đơn vị" and in "All"; sum of the distinct-recipient column is valid only while a profile has one department (assumption recorded at § 5.2).
- F015: Export on a bad URL range exports all-time (DEC-003); a hand-built bad range returns 400 from the route.
- F014: LIKE wildcards in search are escaped (`user-admin-sql-fragments.ts:71`); `page` regex caps at 9 digits so `page=0`/10 digits is `invalid_params` (covered by "giá trị lạ", not itemised).
- F014 `listForExport` computes `count(*) over ()` / `sum(...) over ()` windows it does not need; perf only, RISK-03 already covers cost growth.

---

## Done Well

- Citations are precise and verified: F014 role service, guards, SQL fragments, CSV, UI handlers; F015 query, date-range, table, screen. Only trivial off-by-one drift (N6), no fabricated ranges.
- Honest uncertainty: `[INFERRED]` / `[UNVERIFIED]` tags, "did not run app/test/DB" assumptions, F015 declining to repeat an `EXPLAIN ANALYZE` figure it could not find evidence for.
- Safety-critical F014 logic (lock order, three guards in a stated order, conditional UPDATE, in-band refusals) is described exactly as coded, with the concurrency edge cases and RISK-01 side effect called out.
- Cross-cutting guard documented once as A0/Bin 3 with the proxy gap on `/api/admin/*` made explicit; shared components credited to F007/F011/F002 instead of re-described.
- Twin-file discipline held: functional file free of class names, HTTP verbs, paths; UI copy matches `messages/vi.json`.

---

## Actions In Order

1. C1 (F014) and C2 (F015): add the missing `(covers ...)` SC lines in § 5.1 (3 SC edits F015, 2 SC lines F014). Smallest fix that flips `failed` to 0.
2. W1 (F014): correct the demoted-actor scenario/edge row in `functional-spec.md` § 8 and § 9; add the pre-submit 403 case.
3. W3 (F015): split row :201 (page 403 vs Export toast) and tidy :198/:199.
4. W2 (F015): `CECV` to `CEVC` in five places.
5. Optional: N1-N3. Route N4 to the core-artifact owner.

---

## Still Unresolved

- Observable UI after a pre-submit demotion (403 page vs generic failure toast) was not run; W1 fix must take it from an e2e/manual observation or mark `[UNVERIFIED]`.
- `TaskUpdate(status=completed)` could not be called: no task id was supplied and the tool is not available in this reviewer session; orchestrator should close the task.
