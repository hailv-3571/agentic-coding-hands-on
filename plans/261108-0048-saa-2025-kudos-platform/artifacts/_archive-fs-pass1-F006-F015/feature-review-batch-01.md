---
failed: 0
warnings: 9
missing: 0
result: PASS
---
<!--
`failed`: count of critical issues (0 = all pass).
`warnings`: reviewer-found warnings only (validator warnings are cited under "Validator Notes" and NOT double-counted here; see fs-validation-summary.json).
`missing`: fcodes flagged MISSING due to `.pending` marker (none: each of the 5 folders holds exactly technical-spec.md + functional-spec.md, no `.pending`).
`result`: PASS iff `failed === 0 && missing === 0`.
-->

# Review Report — Rebuild-Spec Feature Specs (WaveFS5 batch-01)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: 5 feature specs (10 files): F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards, F012_Profile, F013_Notifications. Semantic pass only; core artifacts skipped (W7a). Static read, no app/test/db runs.

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 0 core + 5 feature specs (10 files) |
| Critical issues | 0 |
| Warnings | 9 |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

Method: read both specs per fcode in full; cross-ref F### entry in `docs/generated/feature-list.md`, `route-list`, `api-map`, `screen-list`, `user-stories`, `traceability-matrix`; read the cited code for every DEC/BR/ALG/SM claim (≈200+ `Source` ranges checked incl. migrations, route handlers, services, hooks, 17 test pointers, i18n strings). Result: 0 fabricated or off-range citations; every numeric threshold matched code (60/24 names, 4 s highlight, 5 attempts, 1-2-4-8 min backoff, 300/150 ms, 60 s TTL, 500/tick, 15 s timeout, 900 ms opening). All 9 findings are doc-accuracy / consistency, none blocks promotion.

---

## Critical Issues

_(none)_

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

---

## Validator Notes

Cited only; rules not re-checked (per Validator Pre-Check Protocol, WARN → skip rule). Not counted in `warnings`.

- `FeatureSpec.state_rung_missing` @ F010 technical-spec.md:271 (A5), :309 (A6), :397 (A10): writes `user_icons`/`mystery_gift_awards`, `secret_box_prizes`, `national_kudos`; none moves SM-001/SM-002 (grant/open transitions live in A1/A2/A3). Heuristic is document-level; a stub rung is forbidden (`rung_empty_rendered`). Disposition: Defer / accept as-is (spec already states "rung State chỉ ghi khi đã xác nhận được chuyển trạng thái", `:94`).
- `FeatureSpec.state_rung_missing` @ F012 technical-spec.md:74 (A1): resolved by W3 (Writes cell), not by adding a rung.
- `FeatureSpec.state_rung_missing` @ F013 technical-spec.md:196 (A5, writes `realtime.messages`), :376 (A13, writes `cron.job_run_details`): system tables, no SM edge. Same disposition as F010. Optional consistency: F008 A3 (`:61`) uses `— *(chỉ phát broadcast …)*` for the identical `realtime.send` case; F013 A5/A13 could follow it.

---

## Passed Checks

Tags: `[dp]` = deterministic-pass (validator reported PASS; not re-checked). `[dp+m]` = validator PASS, also confirmed manually. Fcode list for `(5/5)`: F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards, F012_Profile, F013_Notifications.

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
✓ FailureTrap.1_proliferation @ F008_SpotlightBoard (SCR007/REG004; screen-list.md:399)
✓ FailureTrap.1_proliferation @ F010_SecretBoxRewards (SCR007/REG006; screen-list.md:401)
✓ FailureTrap.1_proliferation @ F013_Notifications (SCR003/REG001; screen-list.md:206)
✓ FailureTrap.5_spec_orphan @ F008_SpotlightBoard, F010_SecretBoxRewards, F013_Notifications (3/3 owner annotated)
✓ FailureTrap.6_inferred_signal @ F008_SpotlightBoard, F010_SecretBoxRewards, F013_Notifications (no `[SIGNAL_INFERRED]` in screen-list.md:977)
✓ Reviewer.citation_accuracy @ 5/5 (≈200+ ranges + 17 test pointers read against code)
✓ Reviewer.fr_br_coverage @ 5/5
✓ Reviewer.behavior_claims_vs_code @ F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards, F012_Profile (4/5; F013 see W1)
✓ Reviewer.crossref_accuracy @ F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards (3/5; F012 see W4/W9, F013 see W5)
✓ Reviewer.edge_case_sufficiency @ F006_AwardsPortal, F010_SecretBoxRewards, F012_Profile (3/5; F008 see W6, F013 see W1/W2)
✓ Reviewer.twin_spec_consistency @ F006_AwardsPortal, F008_SpotlightBoard, F010_SecretBoxRewards, F013_Notifications (4/5; F012 see W4)

N/A (core-pass scope, SKIP rule): FailureTrap.2_tab_stepper, FailureTrap.3_shared_data (advisory, not reviewer-enforceable), FailureTrap.4_loc_over_split.

---

## Metrics

| Metric | Value |
|--------|-------|
| Feature Specs | 5 |
| User Stories | 13 (US023-025, US034-035, US041-048) |
| Screens | 11 (SCR008-012, SCR015-017, SCR007/REG004, SCR007/REG006, SCR003/REG001) |
| Background Logic Items | 19 owned (+BL014, BL009 referenced) |
| Permissions | 8 (+PERM008, PERM022 referenced) |
| Backend Route Rows | 11 (ROUTE005, 006, 011, 012, 014-017, 019, 033, 034) |
| Frontend Pages | 8 (/countdown, /, /awards, /rules, /community-standards, /profile, /profile/[userId], /notifications) |
| Data Model Entities | 10 touched (MODEL001, 003, 004, 010-016) |

---

## Suggestions (not counted)

- F012 `functional-spec.md:228` / BR-009: the write window is `LAUNCH_AT ≤ now < EVENT_END_AT`, but the disabled-button copy `kudosComposer.errors.WRITING_CLOSED` says "Sự kiện đã kết thúc…" (`messages/vi.json`); pre-launch admin sees the "ended" copy. Add an edge row or note.
- F010 SC-009 (`technical-spec.md:907`) cites `prize-stock-race.test.ts:52`, which only asserts winner-first ordering, not "no icon rows, ≤ 10"; SC-011 (`:909`) cites `internal-tick-guard.test.ts:60` (success run) for the 401/skip claims. Tighten pointers.
- F008 `functional-spec.md:48` references "D002–D005, D007 của bản nháp trước" — a superseded draft not in the repo; either restate the five defaults or drop.
- F012 `technical-spec.md:434-438`: DISC-005 lists five event types as "unverified (ngoài luồng F012)"; no information, collapse to one line.

## Done Well

- Citations are exact: every sampled range lands on the symbol it names (F006 env-schema `:93-104`, F008 trigger `:36-44`, F010 grant/open/finalize, F012 filter `:19-21`, F013 migrations 0018-0023); test pointers and the "run 232" evidence trace to real files (`evidence/post-14-hardening/cron-drain-local-run.txt:17,20`).
- Privacy reasoning is code-true in all three feeds: F008 column whitelist, F012 sender-filter/set-difference guard (`kudo-public-query.ts:57-58`), F013 two-layer anonymity mask; F012 RISK-02 (three different "đã gửi" numbers) is a sharp, correct catch.
- Unresolved Questions are real, not filler: F008 "30 vs 24" comment, F013 stale "Tải thêm" comments, F010 stale `SECRET_BOX_LOCK_AT` comment all verified.
- Cross-feature seams agree: F006 public-path list ↔ F010 tick / F013 drain; F008 → F012 self-profile redirect; F010 A7 ↔ F012 slot; F013 hidden-spam link ↔ F006 A8; shared 1-2-4-8 / 60 s / 300 ms constants identical in twin specs.

## Actions In Order

1. W1 (F013 functional:255 + tech § 3.6): correct the anonymous → named claim.
2. W2 (F013 FR-201): fix "tối đa 10" vs scroll-load contradiction.
3. W3 (F012 tech:60): Writes → `—`; clears the validator warning legitimately.
4. W5 (F013 tech links) and W4 (F012 func screens cells): mechanical fixes.
5. W6 (F008 prelaunch edge), W7 (delete F008 trailer), W8, W9: low-risk text edits.
6. Re-run `validate_feature_spec.py`; expect F012 → PASS, F010/F013 unchanged (3 + 2 heuristic warnings).

## Still Unresolved

- `templates/technical-spec-template.md:472-474,556-564` vs `:737-739` mix two link conventions (root cause of W5); template fix is outside this batch.
- Feature-list "Related Data Models" is inconsistent with what specs read: F006 reads MODEL004 (list: None), F008 reads MODEL004 (list: MODEL003), F012 touches MODEL001/011/012/015 (list: MODEL003/004). Core pass (W7a) to decide the convention; specs are not at fault.
- Not verifiable statically: hosted Supabase `realtime.send` rollback behavior, Vault secrets per environment, real `LAUNCH_AT`/`EVENT_AT`/`EVENT_END_AT` values (specs already flag these `[UNVERIFIED]`).
