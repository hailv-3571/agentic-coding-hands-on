---
failed: 0
warnings: 12
missing: 0
result: PASS
---
<!--
`failed`: count of still-OPEN critical issues (C1, C2 re-verified FIXED in WaveFS6 cycle-1).
`warnings`: reviewer-found warnings only, carried forward unchanged from batch-01 (W1-W9) and batch-02 (renumbered W10-W12). Validator warnings are cited under "Validator Notes" and NOT double-counted here; see fs-validation-summary.json.
`missing`: fcodes flagged MISSING due to `.pending` marker (none: each of the 7 folders holds exactly technical-spec.md + functional-spec.md, no `.pending`).
`result`: PASS iff `failed === 0 && missing === 0`.
Merged report: WaveFS5.batch-01 (F006/F008/F010/F012/F013) + WaveFS5.batch-02 (F014/F015) + WaveFS6.cycle-1 re-review (F014/F015 only).
-->

# Review Report — Rebuild-Spec Feature Specs (WaveFS5 batch-01 + batch-02, WaveFS6 cycle-1 re-review)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: 7 feature specs (14 files): F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards, F012_Profile, F013_Notifications, F014_AdminUserManagement, F015_AdminOverview. Semantic pass only; core artifacts skipped (W7a). Static read, no app/test/db runs. Cycle-1 re-read: only F014 and F015 (the two specs with OPEN criticals); the other five were not re-reviewed.

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 0 core + 7 feature specs (14 files) |
| Critical issues | 0 (2 found in batch-02, both FIXED in cycle-1) |
| Warnings | 12 |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

Method (batch-01): read both specs per fcode in full; cross-ref F### entry in `docs/generated/feature-list.md`, `route-list`, `api-map`, `screen-list`, `user-stories`, `traceability-matrix`; read the cited code for every DEC/BR/ALG/SM claim (≈200+ `Source` ranges checked incl. migrations, route handlers, services, hooks, 17 test pointers, i18n strings). Result: 0 fabricated or off-range citations; every numeric threshold matched code (60/24 names, 4 s highlight, 5 attempts, 1-2-4-8 min backoff, 300/150 ms, 60 s TTL, 500/tick, 15 s timeout, 900 ms opening). All 9 batch-01 findings are doc-accuracy / consistency, none blocks promotion.

Method (batch-02): both specs well grounded; about 75 `Source` citations spot-checked against real code (all ranges contain the described logic), cross-refs to feature-list / user-stories / screen-list / route-list / entities / permissions-matrix resolve, UI strings match `messages/vi.json`. Defects were verification coverage (reviewer-only rule, no validator catches it: C1, C2) and three behavior/wording inaccuracies (W10-W12).

Method (cycle-1 re-review): recomputed FR coverage mechanically (FR-### in `functional-spec.md § 4` minus union of `(covers ...)` in `technical-spec.md § 5.1`) for F014 and F015, then read the cited code for every new or changed SC. Both sets are now empty; every new claim is true against code. Warnings W10-W12 re-confirmed still present at their cited locations (cycle-1 touched only § 5.1 SC lines).

---

## Critical Issues

### C1: F014 — five FRs verified by no SC (§ 5.1 coverage hole) — FIXED
- **Severity**: critical
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F014_AdminUserManagement/technical-spec.md:411-423`
- **Description**: Original defect: FR-101, FR-102, FR-201, FR-208, FR-210 appeared in no SC `(covers ...)` (rule: uncovered FR = critical). Fix added `SC-012` (:422, covers FR-201, FR-208, FR-210) and `SC-013` (:423, covers FR-101, FR-102). Re-check: 29 FR-### in `functional-spec.md § 4`, 29 distinct FR-### in the union of SC-001..SC-013 covers, set difference empty, no dangling ref. Spot-check of the new statements against code, all true: 12 columns in the stated order incl. the actions column (`features/admin-users/components/admin-user-table.tsx:31,56-77`); ID is first 8 chars (`server/user-admin-query.ts:81`); null Level / 6-Badge / last-login render "—" (`components/admin-user-table-row.tsx:19,49-56`); `dd/MM/yyyy HH:mm` on the `ADMIN_TIMEZONE` wall clock (`components/admin-users-screen.tsx:8-14`, `shared/admin/admin-date-time-format.ts:10-12`); header totals come from `sum(...) over ()` in the same SELECT as WHERE/ORDER/LIMIT, so they span the whole filtered set before paging (`server/user-admin-query.ts:57-72`; header "(n)" from `columnTotals`, `admin-user-table.tsx:65-66`); menu entry "User" → `ADMIN_ROUTES.users = /admin/users` (`features/app-shell/components/admin-top-bar.tsx:24`, `shared/ui/app-routes.ts:21`, `messages/vi.json` `admin.users`); URL is the state: every filter/search/sort/page change calls `router.replace(adminUsersHref(next))` (`components/admin-users-view.tsx:43-49,63-87`) and the page parses `searchParams` per request (`app/admin/users/page.tsx:46`).
- **Fix**: none remaining.

### C2: F015 — three FRs verified by no SC (§ 5.1 coverage hole) — FIXED
- **Severity**: critical
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F015_AdminOverview/technical-spec.md:386-396`
- **Description**: Original defect: FR-001, FR-101, FR-206 appeared in no SC `(covers ...)`. Fix extended `SC-001` (:386, now also covers FR-206), extended `SC-010` (:395, now covers FR-101, FR-102) and added `SC-011` (:396, covers FR-001). Re-check: 18 FR-### in `functional-spec.md § 4`, 18 distinct FR-### in SC-001..SC-011, set difference empty, no dangling ref. Spot-check against code, all true: `/admin` redirects to `/admin/overview` (`app/admin/page.tsx:5`); tab "Overview" and account-menu item "Dashboard" both link `ADMIN_ROUTES.overview` (`features/app-shell/components/admin-top-bar.tsx:22`, `account-menu.tsx:66-67`); no paging: `UnitStatsQuery` has no LIMIT/OFFSET and the table has no pager, header comment states "No paging, no sorting (D011)" (`features/admin-overview/server/unit-stats-query.ts:65-93`, `components/overview-unit-stats-table.tsx:30`); FR-001 / no history: every metric subquery keys on the live `sender|recipient|owner.departmentId` joined from `profiles` at query time (`unit-stats-query.ts:38-58`), and neither `kudos` nor `secret_boxes` carries a department column, so a changed `department_id` moves the person's figures on the next read and nothing is kept.
- **Fix**: none remaining. (Side note: SC-007 `:392` still spells "CECV2 trước CECV10", tracked as W11.)

---

## Warnings

### W1: F013 functional § 9 over-claims behavior for a Kudo edited anonymous → named — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F013_Notifications/functional-spec.md:255`
- **Description**: Row says that after a Kudo flips anonymity the list follows the Kudo's current state: "không ẩn danh thì hiện tên". Code: A9 selects `actor.full_name` through `n.actor_id` (`features/notifications/server/notification-query.ts:42,49`) and A3 writes `actor_id = NULL` for a Kudo that is anonymous at drain time (`map-event-to-notifications.ts:36`). So anonymous → named still renders the nameless copy "Một Sunner ẩn danh…" (DEC-001 row 3); only named → anonymous shows the nickname (the one direction covered by `tests/integration/notifications/notification-anonymous-privacy.test.ts:69-78`). BA/QA following the row would write a test that fails. Technical BR-006 (`technical-spec.md:605`) and § 3.6 edge table record neither the asymmetry nor the case. No leak (privacy-safe direction), purely a wrong claim.
- **Fix**: Rewrite row: "named → anonymous: chỉ biệt danh; anonymous → named: vẫn câu 'Một Sunner ẩn danh…' vì người gửi không được lưu lúc tạo thông báo". Add the same edge row to `technical-spec.md` § 3.6 (A3 · A9).

### W2: F013 FR-201 / config say the bell panel shows "tối đa 10" but the panel scrolls to load more — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F013_Notifications/functional-spec.md:74`
- **Description**: FR-201, § 10 (`:283`), § 13 (`:338`, "số thông báo mới nhất ở bảng của chuông") state a 10-row cap; § 6 (`:138`) says "cuộn trong bảng để nạp thêm". Code: `NotificationPanel` passes `onLoadMore`/`scrollRoot` to `NotificationList` (`notification-panel.tsx:92-103`), which wires the infinite-scroll sentinel (`notification-list.tsx:54-58`); 10 is the page size, not a cap. Spec contradicts itself; a QA reading FR-201 asserts a cap that does not exist. Technical A9 (`:269`) is correct but only implies it.
- **Fix**: FR-201 → "nạp 10 dòng đầu mỗi lần mở; cuộn trong bảng nạp tiếp 10 dòng cũ hơn"; § 10/§ 13 comment likewise; add one sentence to tech A9 rung FE (1).

### W3: F012 technical A1 lists `secret_boxes`, `domain_event_outbox` as Writes while the spec says F012 writes nothing — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F012_Profile/technical-spec.md:60`
- **Description**: Action Index A1 Writes cell names two tables; § 1/A0 (`:486`), Result rung (`:98`) and DEC tables say "F012 không ghi DB", the write happens inside F010's embedded `reconcileForSender`. F010 uses the opposite convention for the identical call path (A4 `:84`, A7 `:87`: `—` + parenthetical). The cell is also what triggers `FeatureSpec.state_rung_missing` at `:74`; there is no SM transition to render and the contract forbids a stub rung (`rung_empty_rendered`), so the cell is the only legitimate fix.
- **Fix**: Writes → `— *(read-only; ghi gián tiếp qua F010 reconcile, xem Result)*`; reword `:68` ("A1 là action duy nhất có Writes") to "A1 là action duy nhất gián tiếp ghi". Keep § 4.2 rows `:397-398` ("ghi gián tiếp").

### W4: F012 functional § 2 Screens cells malformed and disagree with technical A6/A7 — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F012_Profile/functional-spec.md:40-41`
- **Description**: CAP-02 cell reads "vùng KUDOS nằm trên SCR015's và SCR016's" (prose + possessive, not a ref list). CAP-03 claims `SCR006, SCR007/REG003, SCR007/REG005`: REG003 and REG005 are owned by F004 (`docs/generated/screen-list.md:398,400`), F012's feature-list entry lists only SCR015/SCR016, and technical A6/A7 (`technical-spec.md:237,256`) annotate SCR015/SCR016. Twin specs skew on the same capability. (CAP-03's list does mirror US035's canonical screens, `user-stories.md:186`.)
- **Fix**: CAP-02 → `SCR015, SCR016`. CAP-03 → `SCR015, SCR016` and describe the host screens (Kudo detail, Live board cards) in § 6 prose (already there at `:127`), or add SCR006/REG003/REG005 to tech A6/A7 and accept the cross-owner claim. Prefer the first.

### W5: F013 technical links use `../../docs/...` — unresolvable from the file's location — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F013_Notifications/technical-spec.md:826-828`
- **Description**: 12 links (`:826-828`, `:938-946`) resolve to `docs/docs/...` from `docs/features/F013_Notifications/` (no such dir) and to `artifacts/docs/...` in the plan tree. The other four specs use `../../generated/…`, `../../system/…`, `./functional-spec.md#6-screens`, which resolve post-promotion. Root cause: `templates/technical-spec-template.md` carries both conventions (`:472-474,556-564` vs `:737-739`); F013 copied the broken one.
- **Fix**: replace `../../docs/generated/` → `../../generated/`, `../../docs/system/` → `../../system/`, Screens link → `./functional-spec.md#6-screens`. Also align the § 4.6 "Client behavior" block (`:826-828`) to the F006/F008 form.

### W6: F008 omits the prelaunch gate from A0 and the edge table — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F008_SpotlightBoard/technical-spec.md:303`
- **Description**: `route-list.md:112` records ROUTE017 as `proxy(session→401 JSON, prelaunch→403 JSON)`. F010 (A0 `:684`), F012 (A0 `:486`, edge `:319`) and F013 (A0 `:595`, edge `:421`) all state the pre-`LAUNCH_AT` behavior (page → 307 `/countdown`, API → 403 `{code:"prelaunch"}` for non-admin); F008 A0 (`:409`) and edge row `:303` list only guest/401. Edge-case sufficiency gap for the one feature whose snapshot API and page sit behind that gate.
- **Fix**: add to A0 and to the last edge row: "Trước `LAUNCH_AT`, người không phải admin: `/kudos` → 307 `/countdown`; `GET /api/spotlight` → 403 `{ code: "prelaunch" }` (F006 A1)". Source `features/awards-portal/server/prelaunch-gate.ts:56-70`.

### W7: F008 technical ends with leaked template instruction text — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F008_SpotlightBoard/technical-spec.md:609-611`
- **Description**: Untranslated English scaffolding left after § 5.5: "Codes are written BARE — no braces." and "Rule: Every code listed in Codes Used MUST exist… Orphan refs = reviewer critical." (condensed from `templates/technical-spec-template.md:566`). F006 and F012 have no trailer; F010 (`:996`) and F013 (`:948`) carry a translated variant.
- **Fix**: delete `:609-611`. Optionally drop the F010/F013 trailer lines for uniformity (F013's BL014 ownership note is worth keeping as a § 5.5 footnote).

### W8: F008 A4 State rung lists 3 of 8 SM-001 edges while § 4.3 delegates edge detail to it — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F008_SpotlightBoard/technical-spec.md:169`
- **Description**: § 4.3 (`:402`) says guard and side effects of each edge live in A4's State/Rule rungs. State rung names `connecting→live`, `live→reconnecting`, `reconnecting→failed`; diagram (`:391-399`) also has `connecting→reconnecting`, `reconnecting→live`, `reconnecting→reconnecting` (errors 2-4 or `online`) and `failed→connecting` (retry). Rule bullet `:165` covers them in prose, and code agrees (`spotlight-channel-state.ts:20-33`), so impact is navigation only.
- **Fix**: list all 8 edges in the State rung, or reword `:402` to "xem Rule SM-001 của A4".

### W9: F012 § 5.5 leaves API Map "Reviewed" unchecked — OPEN
- **Severity**: warning
- **Location**: `P/artifacts/features/F012_Profile/technical-spec.md:730`
- **Description**: Only unchecked `[ ]` across the five specs; template residue. ROUTE014/ROUTE019 are cited and exist (`api-map.md:73-74`; ROUTE014 maps to BL009). BL009 appears only in § 5.5 (`:733`), nowhere in the body, while `feature-list.md` F012 shows Related Background Logic "None".
- **Fix**: tick `[x]`; either cite BL009 once in A4 (image signing for list cards, `behavior-logic.md:379-381` Trigger names the profile list) or note in § 5.5 that it is an indirect dependency.

### W10: F014 — functional spec states the wrong trigger for the in-dialog "Bạn không còn quyền Admin." — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F014_AdminUserManagement/functional-spec.md:206-208` (same claim again at `:250`; related `:154`, `:167`)
- **Description**: (batch-02 W1) § 8 scenario "Error: người thao tác đã bị hạ" says an Admin demoted while the dialog is open, on "Xác nhận", sees "Bạn không còn quyền Admin." in the dialog; § 9 row at :250 repeats it for "bị hạ trong lúc đang mở trang". Code: `setUserRoleAction` calls `requireAdmin()` first (`set-user-role-action.ts:19`), which re-reads `profiles.role` and calls `forbidden()` (`shared/auth/admin-guard.ts:30-35`); on a server-action POST the proxy step 4b already answers JSON 403 (`shared/auth/session-proxy.ts:93-110`). Test `tests/integration/admin-users/set-user-role-action.test.ts:48` ("answers 403 to ... an admin demoted after signing in, and writes nothing"). The in-band `FORBIDDEN` (dialog text) only occurs when the actor is demoted while the transaction waits on the admin-row lock (`user-role-service.ts:47`), exactly what canonical `user-stories.md:669` ("Actor bị hạ trong lúc chờ khoá") and `technical-spec.md:442` say. The twin tech spec already has it right (edge row `:191`). A QA case written from § 8/§ 9 would fail against the build. Which UI the 403 produces (403 page vs generic "Không cập nhật được role...") was not run here, so it is unproven.
- **Fix**: § 8: change the Given to "Admin bị hạ trong lúc lệnh của họ đang chờ khoá" (keep the dialog message). Add a second scenario/§ 9 row "Admin đã bị hạ trước khi bấm Xác nhận → bị chặn ở lớp kiểm tra quyền (403), không ghi gì", user-facing message taken from an e2e observation or tagged `[UNVERIFIED]`. Reword :250 to the lock-wait case.

### W11: F015 — department example "CECV2 / CECV10" is a typo of the real names "CEVC2 / CEVC10" — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F015_AdminOverview/functional-spec.md:51` (also `functional-spec.md:210`, `technical-spec.md:103`, `technical-spec.md:356`, `technical-spec.md:392`)
- **Description**: (batch-02 W2) Seeded names are `CEVC1..` (`db/seeds/departments.ts:11-14`), the code comment says "CEVC2 before CEVC10" (`features/admin-overview/server/add-all-row.ts:7`), and sibling F014 spells it correctly (now also in F014 SC-011, `technical-spec.md:421`). The ordering rule (FR-202, SC-007, ALG-002) is expressed through a department name that does not exist; a tester seeding "CECV2" or searching the table for it gets nothing.
- **Fix**: replace `CECV` with `CEVC` in all five places.

### W12: F015 — § 9 contradicts itself (and canonical US004) on what Export shows after a lost Admin role — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/features/F015_AdminOverview/functional-spec.md:201`
- **Description**: (batch-02 W3) Row :201 "Admin bị hạ role giữa chừng | thao tác kế (đổi ngày, Export) bị từ chối | 'Bạn không có quyền truy cập tài nguyên này.'" while row :198 and § 8 `US004 — Error` (:172) give "Không xuất được tệp. Vui lòng thử lại." for the same Export call, and canonical `user-stories.md:386` says "Endpoint trả 403, hiện toast lỗi". Code: Export route returns JSON `{ code: "forbidden" }` (`admin-api-guard.ts:22`) and `ReviewExportButton` maps any `!response.ok` to the `export.failed` toast (`review-export-button.tsx:46`); the 403-page copy appears only for page navigation (date change). Related: row :199 lists the 403-page sentence for a direct Export call (JSON only, no message), and row :198 lists "khoảng ngày sai" as a UI Export failure although the UI exports all-time on a bad range (DEC-003, `admin-overview-screen.tsx:57`), so it is reachable only by a hand-built URL.
- **Fix**: split :201 into "đổi ngày → trang bị từ chối (403 page)" and "Export → toast 'Không xuất được tệp...', không tệp"; in :199 say "gọi thẳng Export: JSON 403, không có số liệu"; in :198 drop "khoảng ngày sai" or note it applies to a hand-built URL only.

---

## Validator Notes

Cited only; rules not re-checked (per Validator Pre-Check Protocol, WARN → skip rule). Not counted in `warnings`.

- `FeatureSpec.state_rung_missing` @ F010 technical-spec.md:271 (A5), :309 (A6), :397 (A10): writes `user_icons`/`mystery_gift_awards`, `secret_box_prizes`, `national_kudos`; none moves SM-001/SM-002 (grant/open transitions live in A1/A2/A3). Heuristic is document-level; a stub rung is forbidden (`rung_empty_rendered`). Disposition: Defer / accept as-is (spec already states "rung State chỉ ghi khi đã xác nhận được chuyển trạng thái", `:94`).
- `FeatureSpec.state_rung_missing` @ F012 technical-spec.md:74 (A1): resolved by W3 (Writes cell), not by adding a rung.
- `FeatureSpec.state_rung_missing` @ F013 technical-spec.md:196 (A5, writes `realtime.messages`), :376 (A13, writes `cron.job_run_details`): system tables, no SM edge. Same disposition as F010. Optional consistency: F008 A3 (`:61`) uses `— *(chỉ phát broadcast …)*` for the identical `realtime.send` case; F013 A5/A13 could follow it.
- Batch-02 pre-check: `fs-validation-summary.json` F014 PASS (0/0), F015 PASS (0/0); citation, feature_screen_link, feature_api_link, reading_guide_db_impact all PASS. Per the orchestrator, `validate_feature_spec` was re-run after fix cycle 1: PASS for F014 and F015; overall WARN is only `state_rung_missing` on F010/F012/F013 (above). Not re-run by this reviewer (no script runs in this pass).

---

## Passed Checks

Batch-01 (F006, F008, F010, F012, F013):

✓ existence.folder_missing @ 5/5 [dp+m]
✓ existence.folder_incomplete @ 5/5 [dp+m] (2 files each, no `.pending`)
✓ existence.slug_format @ 5/5 [dp+m]
✓ existence.orphan_folder @ 5/5 [dp]
✓ existence.canonical_missing @ 5/5 [dp]
✓ FeatureSpec.required_sections @ 5/5 [dp]
✓ FeatureSpec.sysdesign_subsections @ 5/5 [dp]
✓ FeatureSpec.verification_subsections @ 5/5 [dp]
✓ FeatureSpec.capability_buckets_missing @ 5/5 [dp]
✓ FeatureSpec.capability_twin_skew @ 5/5 [dp]
✓ FeatureSpec.us_narrative_present @ 5/5 [dp]
✓ FeatureSpec.screen_flow_crossref @ 5/5 [dp]
✓ FeatureSpec.bw_steps @ 5/5 [dp]
✓ FeatureSpec.deprecated_headings @ 5/5 [dp]
✓ FeatureSpec.no_appendix @ 5/5 [dp]
✓ FeatureSpec.edge_cases @ 5/5 [dp]
✓ FeatureSpec.f_code_format @ 5/5 [dp]
✓ FeatureSpec.sm_mermaid @ 5/5 [dp]
✓ FeatureSpec.pseudocode_length @ 5/5 [dp]
✓ FeatureSpec.pseudocode_fence @ 5/5 [dp]
✓ FeatureSpec.linked_fr_missing @ 5/5 [dp]
✓ FeatureSpec.disc_boolean @ 5/5 [dp]
✓ FeatureSpec.br_linked_fr_present @ 5/5 [dp]
✓ FeatureSpec.polymorphic_behavior_present @ 5/5 [dp]
✓ FeatureSpec.dec_blocks_well_formed @ 5/5 [dp]
✓ FeatureSpec.dec_lazy_na @ 5/5 [dp]
✓ FeatureSpec.missing_client_behavior_anchor @ 5/5 [dp]
✓ FeatureSpec.tech_sections_pre_sot @ 5/5 [dp]
✓ FeatureSpec.retired_section_present @ 5/5 [dp]
✓ FeatureSpec.alg_file_schema_missing @ 5/5 [dp]
✓ FeatureSpec.action_index_missing @ 5/5 [dp]
✓ FeatureSpec.action_key_not_handler @ 5/5 [dp]
✓ FeatureSpec.action_unclaimed @ 5/5 [dp]
✓ FeatureSpec.rung_order @ 5/5 [dp]
✓ FeatureSpec.rung_empty_rendered @ 5/5 [dp]
✓ FeatureSpec.state_rung_missing @ F006_AwardsPortal, F008_SpotlightBoard (2/2) [dp]
✓ FeatureSpec.action_ref_unglossed @ 5/5 [dp]
✓ FeatureSpec.rule_bin_misplaced @ 5/5 [dp]
✓ FeatureSpec.crosscutting_unlabelled @ 5/5 [dp]
✓ FeatureSpec.diagram_required_missing @ 5/5 [dp]
✓ FeatureSpec.diagram_cites_file_line @ 5/5 [dp]
✓ FeatureSpec.diagram_over_cap @ 5/5 [dp]
✓ Universal.no_placeholder @ 5/5 [dp]
✓ citation.file_missing @ 5/5 [dp]
✓ citation.range_invalid @ 5/5 [dp]
✓ citation.range_inverted @ 5/5 [dp]
✓ citation.path_traversal @ 5/5 [dp]
✓ citation.unreadable @ 5/5 [dp]
✓ func.missing @ 5/5 [dp]
✓ func.missing_h2 @ 5/5 [dp]
✓ func.sections_pre_sot @ 5/5 [dp]
✓ func.dev_token @ 5/5 [dp]
✓ func.secret_shape @ 5/5 [dp]
✓ func.screens_scr_unresolved @ 5/5 [dp]
✓ func.edge_cases_few_rows @ 5/5 [dp]
✓ func.rule_density @ 5/5 [dp]
✓ func.open_decisions_shape @ 5/5 [dp]
✓ func.code_orphan @ 5/5 [dp]
✓ func.code_unsurfaced @ 5/5 [dp]
✓ func.edge_behaviour_dangling @ 5/5 [dp]
✓ func.capabilities_empty @ 5/5 [dp]
✓ func.capability_fr_dangling @ 5/5 [dp]
✓ func.risk_as_rule @ 5/5 [dp]
✓ func.user_story_shape @ 5/5 [dp]
✓ cap.code_unclaimed @ 5/5 [dp]
✓ cap.double_claimed @ 5/5 [dp]
✓ cap.claims_unfilled @ 5/5 [dp]
✓ cap.analysis_required @ 5/5 [dp]
✓ link.route_unresolved @ 5/5 [dp]
✓ link.feature_unresolved @ 5/5 [dp]
✓ link.owner_mismatch @ 5/5 [dp]
✓ link.pre_migration @ 5/5 [dp]
✓ link.unmapped @ 5/5 [dp]
✓ link.inventory_absent @ 5/5 [dp]
✓ reading_guide.pre_migration @ 5/5 [dp]
✓ reading_guide.malformed @ 5/5 [dp]
✓ reading_guide.unmapped @ 5/5 [dp]
✓ FailureTrap.1_proliferation @ F008_SpotlightBoard..F013_Notifications (3/3)
✓ FailureTrap.5_spec_orphan @ F008_SpotlightBoard, F010_SecretBoxRewards, F013_Notifications (3/3 owner annotated)
✓ FailureTrap.6_inferred_signal @ F008_SpotlightBoard, F010_SecretBoxRewards, F013_Notifications (no `[SIGNAL_INFERRED]` in screen-list.md:977)
✓ Reviewer.citation_accuracy @ 5/5 (≈200+ ranges + 17 test pointers read against code)
✓ Reviewer.fr_br_coverage @ 5/5
✓ Reviewer.behavior_claims_vs_code @ F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards, F012_Profile (4/5; F013 see W1)
✓ Reviewer.crossref_accuracy @ F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards (3/5; F012 see W4/W9, F013 see W5)
✓ Reviewer.edge_case_sufficiency @ F006_AwardsPortal, F010_SecretBoxRewards, F012_Profile (3/5; F008 see W6, F013 see W1/W2)
✓ Reviewer.twin_spec_consistency @ F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards, F013_Notifications (4/5; F012 see W4)

Batch-02 (F014, F015):

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

WaveFS6 cycle-1 re-review (F014, F015):

✓ Reviewer.fr_sc_coverage @ F014_AdminUserManagement..F015_AdminOverview (2/2) [re-review: F014 29/29 FR covered by SC-001..SC-013, F015 18/18 by SC-001..SC-011, no dangling refs]
✓ Reviewer.behavior_claims_vs_code @ F014_AdminUserManagement..F015_AdminOverview (2/2) [re-review: SC-012, SC-013, F015 SC-001/010/011 read against code]

---

## Metrics

| Metric | Value |
|--------|-------|
| Feature Specs | 7 (5 + 2) |
| User Stories | 19 (13 in batch-01: US023-025, US034-035, US041-048; 6 in batch-02: US009-US012, US003, US004) |
| Screens | 13 (11 in batch-01: SCR008-012, SCR015-017, SCR007/REG004, SCR007/REG006, SCR003/REG001; 2 in batch-02: SCR018, SCR019) |
| Background Logic Items | 19 owned (+BL014, BL009 referenced); batch-02: 0 |
| Permissions | 14 (8 in batch-01, +PERM008, PERM022 referenced; 6 referenced in batch-02: PERM003, 006, 014, 015, 017, 018) |
| Backend Route Rows | 14 (11 in batch-01: ROUTE005, 006, 011, 012, 014-017, 019, 033, 034; 3 in batch-02: ROUTE003, 004, 032) |
| Frontend Pages | 10 (8 in batch-01: /countdown, /, /awards, /rules, /community-standards, /profile, /profile/[userId], /notifications; 2 in batch-02: /admin/users, /admin/overview; /admin is a redirect) |
| Data Model Entities | 17 touched, overlap not de-duplicated (10 in batch-01: MODEL001, 003, 004, 010-016; 7 in batch-02: MODEL001, 003, 004, 008, 011, 012, 013) |

---

## Notes (non-blocking, not counted)

- N1 (F015 tech `:250,259,268`): `Source: docs/generated/entities.md § Profile|Kudo|SecretBox > Discriminator Fields` use short names; real headings are `MODEL004_Profile`, `MODEL003_Kudo`, `MODEL011_SecretBox` (F014 uses the full form). Align for anchor resolution.
- N2 (F014 tech `:479`, was `:477` before cycle-1 added two SC lines): § 5.3 item 3 is a resolved drift log vs the "previously published spec" (US001-004 renamed, etc.) filed under "Unresolved Questions". Belongs in a journal/changelog; keep § 5.3 for open items only.
- N3 (F014 functional § 9): BR-004 documents LIKE-wildcard escaping (`\`, `%`, `_`) but no QA-visible edge row exists for searching those characters, nor for a valid-uuid `unit` that matches no department (empty table + "Xoá bộ lọc").
- N4 (core artifacts, route to W7a owner): `feature-list.md` F014 lists only MODEL004 and PERM017/018, F015 lists "Related Permissions: None"; `traceability-matrix.md:29` shows F015 PERM "—". The specs' § 5.5 (MODEL001/003/004/008/012/013 + PERM006/014/015; PERM003/014/015) match code and `permissions-matrix.md:576,613`. No spec change.
- N5 (code-side, informational): comments in `features/admin-users/server/env-admin-email.ts` ("answers 409 ENV_ADMIN") and `lib/admin-user-role-menu-state.ts` ("403 SELF_DEMOTE") describe HTTP codes; the specs correctly say refusals are in-band (C-18). Not a spec defect.
- N6 (F015 tech, trivial range drift, no action): cites `admin-overview-skeleton.tsx:9-22` (actual 9-23), `use-external-reset-key.ts:13-20` (13-21), `admin-csv-filename.ts:5-9` (4-9); logic is inside each range.

## Suggestions (not counted)

- F012 `functional-spec.md:228` / BR-009: the write window is `LAUNCH_AT ≤ now < EVENT_END_AT`, but the disabled-button copy `kudosComposer.errors.WRITING_CLOSED` says "Sự kiện đã kết thúc…" (`messages/vi.json`); pre-launch admin sees the "ended" copy. Add an edge row or note.
- F010 SC-009 (`technical-spec.md:907`) cites `prize-stock-race.test.ts:52`, which only asserts winner-first ordering, not "no icon rows, ≤ 10"; SC-011 (`:909`) cites `internal-tick-guard.test.ts:60` (success run) for the 401/skip claims. Tighten pointers.
- F008 `functional-spec.md:48` references "D002–D005, D007 của bản nháp trước" — a superseded draft not in the repo; either restate the five defaults or drop.
- F012 `technical-spec.md:434-438`: DISC-005 lists five event types as "unverified (ngoài luồng F012)"; no information, collapse to one line.
- F014 SC-013 / SC-012 (new): both cite behavior only (no test pointer); add a Playwright/integration pointer if one exists (`tests/e2e` for admin users) so a tester can find the owner test. Optional.

---

## Edge Cases Turned Up (scouting pass, beyond the diff)

- Demoted actor has two distinct paths (guard 403 before the service vs in-band `FORBIDDEN` while waiting on the admin-row lock); only the second shows the dialog text. Drives W10.
- `target.role === role` returns ok before the actor-still-admin check (`user-role-service.ts:40` before `:47`): a demoted actor re-promoting an existing Admin gets success with no write. Already recorded as F014 RISK-01, correct.
- Mutual demotion with exactly two Admins: traced through READ COMMITTED lock re-check; loser sees `admins.length == 1` and gets `LAST_ADMIN` before the `FORBIDDEN` check, as the spec says.
- `/api/admin/*` is outside proxy gate 4b (`isAdminPath` matches `/admin`, `/admin/*` only): export routes rely solely on `requireAdminApi()`; both specs document this (F014 RISK-02, F015 RISK-07). `tests/prod/production-admin-403-status.ts:144-152` covers it.
- F015: unit with zero members and zero activity still renders (FULL JOIN + coalesce); a recipient with NULL `department_id` lands in "Chưa gán đơn vị" and in "All"; sum of the distinct-recipient column is valid only while a profile has one department (assumption recorded at § 5.2).
- F015: Export on a bad URL range exports all-time (DEC-003); a hand-built bad range returns 400 from the route.
- F014: LIKE wildcards in search are escaped (`user-admin-sql-fragments.ts:71`); `page` regex caps at 9 digits so `page=0`/10 digits is `invalid_params` (covered by "giá trị lạ", not itemised).
- F014 `listForExport` computes `count(*) over ()` / `sum(...) over ()` windows it does not need; perf only, RISK-03 already covers cost growth.
- F014 (cycle-1): the "—" fallback in code also applies to empty name/email (`admin-user-table-row.tsx:44-45`); SC-012 and FR-208 name only Level / 6-Badge / last-login. Harmless superset, no spec change needed.

---

## Done Well

- Citations are exact: every sampled range lands on the symbol it names (F006 env-schema `:93-104`, F008 trigger `:36-44`, F010 grant/open/finalize, F012 filter `:19-21`, F013 migrations 0018-0023); test pointers and the "run 232" evidence trace to real files (`evidence/post-14-hardening/cron-drain-local-run.txt:17,20`).
- Privacy reasoning is code-true in all three feeds: F008 column whitelist, F012 sender-filter/set-difference guard (`kudo-public-query.ts:57-58`), F013 two-layer anonymity mask; F012 RISK-02 (three different "đã gửi" numbers) is a sharp, correct catch.
- Unresolved Questions are real, not filler: F008 "30 vs 24" comment, F013 stale "Tải thêm" comments, F010 stale `SECRET_BOX_LOCK_AT` comment all verified.
- Cross-feature seams agree: F006 public-path list ↔ F010 tick / F013 drain; F008 → F012 self-profile redirect; F010 A7 ↔ F012 slot; F013 hidden-spam link ↔ F006 A8; shared 1-2-4-8 / 60 s / 300 ms constants identical in twin specs.
- Admin batch: citations precise (F014 role service, guards, SQL fragments, CSV, UI handlers; F015 query, date-range, table, screen); honest uncertainty tags (`[INFERRED]` / `[UNVERIFIED]`); F014 lock order, three guards in stated order, conditional UPDATE and in-band refusals described exactly as coded; the `/api/admin/*` proxy gap made explicit; twin-file discipline held (functional file free of class names, HTTP verbs, paths).
- Cycle-1 fix was minimal and exact: five SC edits closed all eight uncovered FRs, each new SC states only what the code does and cites real identifiers (`sum(...) over ()`, `router.replace`, `ADMIN_TIMEZONE`); no collateral change to the rest of § 5.1 or to the carried warnings.

---

## Actions In Order

1. W1 (F013 functional:255 + tech § 3.6): correct the anonymous → named claim.
2. W2 (F013 FR-201): fix "tối đa 10" vs scroll-load contradiction.
3. W10 (F014 functional § 8/§ 9): correct the demoted-actor trigger; add the pre-submit 403 case (UI text from e2e or `[UNVERIFIED]`).
4. W3 (F012 tech:60): Writes → `—`; clears the F012 validator warning legitimately.
5. W12 (F015 functional § 9): split row :201 (page 403 vs Export toast), tidy :198/:199.
6. W11 (F015): `CECV` → `CEVC` in five places.
7. W5 (F013 tech links) and W4 (F012 func screens cells): mechanical fixes.
8. W6 (F008 prelaunch edge), W7 (delete F008 trailer), W8, W9: low-risk text edits.
9. Optional: N1-N3, Suggestions. Route N4 to the core-artifact owner.
10. Re-run `validate_feature_spec.py`; expect F012 → PASS, F010/F013 unchanged (3 + 2 heuristic warnings).

---

## Still Unresolved

- `templates/technical-spec-template.md:472-474,556-564` vs `:737-739` mix two link conventions (root cause of W5); template fix is outside this batch.
- Feature-list "Related Data Models" is inconsistent with what specs read: F006 reads MODEL004 (list: None), F008 reads MODEL004 (list: MODEL003), F012 touches MODEL001/011/012/015 (list: MODEL003/004). Core pass (W7a) to decide the convention; specs are not at fault.
- Not verifiable statically: hosted Supabase `realtime.send` rollback behavior, Vault secrets per environment, real `LAUNCH_AT`/`EVENT_AT`/`EVENT_END_AT` values (specs already flag these `[UNVERIFIED]`).
- Observable UI after a pre-submit demotion (403 page vs generic failure toast) was not run; W10 fix must take it from an e2e/manual observation or mark `[UNVERIFIED]`.
- Post-fix validator PASS for F014/F015 is taken from the orchestrator's message; this reviewer did not re-run `validate_feature_spec`.
- `TaskUpdate(status=completed)` could not be called: no task id was supplied; orchestrator should close the task.
