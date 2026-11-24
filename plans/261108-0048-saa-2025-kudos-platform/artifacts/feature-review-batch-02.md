---
failed: 3
warnings: 3
missing: 0
result: FAIL
---

# Review Report — Rebuild-Spec Feature Specs (WaveFS5 batch-02: F007, F009, F011)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: 3 feature specs (F007_AdminModeration, F009_HeroBadges, F011_AdminCampaigns), 6 files. Core artifacts skipped. Cross-ref: `docs/generated/feature-list.md`, `route-list.md`, `permissions-matrix.md`. Source spot-checks: about 60 DEC/BR/ALG/SM/FR claims against code.
**Validator notes**: overall WARN. F007 PASS, F011 PASS, F009 PASS plus `feature_screen_link` `link.pre_migration` on F009 functional-spec (background feature, no SCR; accepted). Rules marked `[deterministic-pass]` were not re-checked. `.pending` markers: none present for the 3 fcodes (verified with `ls -a`); `missing = 0`.
**Critical counting**: one critical per feature, listing every uncovered FR (33 FRs total: F007 2, F009 10, F011 21).

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 0 core + 3 feature specs |
| Critical issues | 3 |
| Warnings | 3 |
| Missing (`.pending` markers) | 0 |
| Result | **FAIL** |

Semantics are strong: every DEC/BR/ALG/SM/INT claim spot-checked matches code, user-facing strings match `messages/vi.json`, ROUTE/PERM/MODEL cross-refs match `docs/generated/*`. The only blocking defect class is FR to SC coverage (reviewer-only rule, no validator checks it). Fix is mechanical: add or extend `(covers ...)` SC lines in `technical-spec.md § 5.1`.

---

## Critical Issues

### C1: F007 — 2 FRs in functional-spec § 4 covered by no SC — OPEN
- **Severity**: critical
- **Location**: `F007_AdminModeration/technical-spec.md:575-586` (SC-001..SC-012); FRs declared at `F007_AdminModeration/functional-spec.md:58` (FR-101), `:63` (FR-202)
- **Description**: Uncovered: FR-101, FR-202 (26/28 covered; computed as § 4 FR ids minus union of `(covers ...)` in § 5.1).
- **Fix**: add after SC-012 (line 586):
  - `- **SC-013** *(A1)* Dòng bảng hiện 8 ký tự đầu của ID, tiêu đề đậm trên lời nhắn text thuần cắt 4 dòng không hiện ký hiệu Markdown, hashtag mỗi thẻ một dòng, số tim thô không nhân x2, ô trống hiện "—" (covers FR-202)`
  - `- **SC-014** *(A1)* Mục "Review content" của menu Admin mở /admin/review; trong lúc tải hiện ReviewContentSkeleton từ loading.tsx (covers FR-101)`

### C2: F009 — 10 FRs in functional-spec § 4 covered by no SC — OPEN
- **Severity**: critical
- **Location**: `F009_HeroBadges/technical-spec.md:410-416` (SC-001..SC-006; line numbers per ART file, § 5.1 block); FRs at `F009_HeroBadges/functional-spec.md:57` (FR-004), `:61` (FR-401), `:63` (FR-403), `:64` (FR-404), `:66` (FR-406), `:70-72` (FR-201..203), `:76-77` (FR-601, FR-602)
- **Description**: Uncovered: FR-004, FR-201, FR-202, FR-203, FR-401, FR-403, FR-404, FR-406, FR-601, FR-602 (6/16 covered). Only 6 SC lines exist for 4 actions; A2 (badge render) has no SC at all.
- **Fix** (extend/add in § 5.1):
  - SC-006: change to `(covers FR-405, FR-406, BR-006)` and append "vượt nhiều ngưỡng chỉ báo bậc đạt được; bậc tụt vì Spam không báo lại bậc cũ".
  - `- **SC-007** *(A1)* Cột Level và bộ lọc Level của Admin dùng `distinctSenderCountSubquery` + `tierCountRange` cùng luật đếm với huy hiệu; kết quả bậc chỉ khoá theo id đã yêu cầu, không mang id người gửi (covers FR-004, FR-602)`
  - `- **SC-008** *(A0, A1)* `HeroTierQuery` có `import "server-only"`, không có route/server action nào lộ truy vấn; client chỉ nhận tên bậc trong view (covers FR-601)`
  - `- **SC-009** *(A2)* `tier` null thì HeroBadge và slot không vẽ gì (không viên nhãn rỗng, không dấu chấm); bốn cỡ card/tooltip/rules/hoverCard cùng một hình theo bậc; trang Thể lệ liệt kê đủ bốn bậc từ cùng khoá `hero.*` (covers FR-201, FR-202, FR-203)`
  - `- **SC-010** *(A3)* Tooltip mở khi rê chuột, focus bàn phím hoặc chạm; hiện tiêu đề và mô tả của đúng bậc; ở màn 375 px panel kẹp cách mép 16 px và không nhận focus (covers FR-401, FR-403, FR-404)`

### C3: F011 — 21 FRs in functional-spec § 4 covered by no SC — OPEN
- **Severity**: critical
- **Location**: `F011_AdminCampaigns/technical-spec.md:336-340` (SC-001..SC-005); FRs at `F011_AdminCampaigns/functional-spec.md:50-89`
- **Description**: Uncovered: FR-001, FR-002, FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-301, FR-302, FR-303, FR-304, FR-305, FR-306, FR-308, FR-309, FR-310, FR-402, FR-404, FR-602 (5/25 covered: FR-003, FR-307, FR-401, FR-601 plus none other). Only 5 SC lines for 5 actions; A1 (list) and A4 (delete UI) have no behavior SC.
- **Fix** (add after SC-005, line 340; also extend SC-004 `(covers FR-401, FR-402, BR-001)` and SC-005 `(covers FR-601, FR-602)` with "bảng `campaigns` bật RLS không policy, REVOKE ALL cho anon/authenticated"):
  - `- **SC-006** *(A1)* Bảng bốn cột ID/Name/Time/Actions sắp `starts_at DESC, id DESC` không phân trang, giờ theo ADMIN_TIMEZONE giống nhau cho mọi Admin, tên dài cắt một dòng có `title`; dòng đã kết thúc không có "⋯"; rỗng hiện dòng gợi ý; đọc lỗi hiện khối lỗi + "Thử lại"; skeleton lúc tải (covers FR-002, FR-101, FR-201, FR-202, FR-204, FR-205, FR-206, FR-404)`
  - `- **SC-007** *(A2)* Hộp Add có 3 ô bắt buộc, focus vào ô tên; tên 1-100 ký tự, mốc thật từ 2000, end sau start và sau hiện tại; lỗi dưới từng ô, focus ô lỗi đầu; OVERLAP nêu tên và khoảng giờ dưới End Date; thành công đóng hộp + toast 5 giây; Cancel/Esc đóng, bấm nền không đóng; đang lưu ô readOnly, hai nút khoá, Esc không đóng; lỗi bất ngờ giữ hộp và dữ liệu (covers FR-001, FR-203, FR-301, FR-303, FR-304, FR-305, FR-309, FR-310)`
  - `- **SC-008** *(A3)* Hộp Edit điền sẵn, nút "Save Campaign"; campaign đang chạy khoá Start kèm lý do, vẫn sửa tên và End; `startsAt` khác phút đã lưu bị `startLocked` (covers FR-302, FR-306)`
  - `- **SC-009** *(A4)* Hộp xác nhận xoá nêu tên campaign, Cancel có focus; Cancel/Esc không xoá; đang xoá hai nút khoá; lỗi khác giữ hộp với "Không xoá được" (covers FR-308, FR-309, FR-310)`

---

## Warnings

### W1: F007 — content search matches raw Markdown source of the message, undocumented — OPEN
- **Severity**: warning
- **Location**: `F007_AdminModeration/functional-spec.md:66` (FR-205), `:102` (BR-004); `F007_AdminModeration/technical-spec.md:95, 500, 531`
- **Description**: `buildAdminKudoWhere` runs `f_unaccent(coalesce(title,'') || ' ' || body) ILIKE` on the stored `body` (`features/admin-moderation/server/admin-kudo-where-builder.ts:20`, `shared/db/schema/kudos.ts:42` is `text` Markdown), while the table shows stripped plain text (`kudo-message-plain-text.ts:20-23`). Searching `**`, `](` or a link URL matches rows whose visible text lacks it; QA has no expected behavior. Spec says only "trên tiêu đề cộng lời nhắn".
- **Fix**: add to tech § 3.5 Edge cases: `| A1 · A2 · A7 | Từ khoá trùng ký hiệu Markdown hoặc URL của liên kết | Khớp vì tìm chạy trên nguồn Markdown của lời nhắn, không phải chữ hiển thị; dòng có thể hiện mà không thấy từ khoá (BR-004) |`; add a § 9 row in functional-spec with message "None — silent handling" and a RISK-08 (known-issue, [INFERRED]) in § 11.

### W2: F007 — row rendering details diverge between functional and technical spec — OPEN
- **Severity**: warning
- **Location**: `F007_AdminModeration/functional-spec.md:63` (FR-202), `:259` (edge row); `F007_AdminModeration/technical-spec.md:81`; code `features/admin-moderation/components/review-table-row.tsx:62-63`
- **Description**: (a) Tech A1 says the title is "đậm viết hoa" (CSS `uppercase`, line 62); FR-202 and US005 AC say only "đậm", so BA/QA will not expect uppercase. (b) Functional edge row 259 says "Kudo không có tiêu đề ... ô hiện dấu gạch"; code renders `{row.title && <p>…}` and a dash only for an empty message (line 63) and empty hashtags, so a title-less Kudo shows no dash for the title.
- **Fix**: FR-202: "tiêu đề đậm, viết hoa (chỉ kiểu hiển thị)". Row 259: "Kudo không có tiêu đề thì không hiện dòng tiêu đề; không có hashtag hoặc lời nhắn chỉ có định dạng thì ô hiện dấu gạch".

### W3: F009 — English template trailer left in § 5.5 — OPEN
- **Severity**: warning
- **Location**: `F009_HeroBadges/technical-spec.md:420`
- **Description**: `**Codes are written BARE — no braces.**` is template residue in English; F007 and F011 replaced it with the vi `**Rule:**` line. Violates the vi prose directive; no validator catches it.
- **Fix**: replace with `**Rule:** Mọi mã trong Codes Used phải tồn tại trong artifact nguồn; F009 không sở hữu ROUTE hay SCR nên các hàng API Map, Screens để "—".`

---

## Passed Checks

✓ Universal.artifact_exists_non_empty @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Universal.no_pending_marker @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Universal.two_file_pair @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Universal.no_placeholder_text @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Universal.required_sections_in_template_order @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Universal.orphan_code_none @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Universal.cross_ref_tokenizer_scr_reg @ F007_AdminModeration
✓ Universal.cross_ref_tokenizer_scr_reg @ F011_AdminCampaigns
✓ Universal.content_completeness_source_traceable @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.required_sections [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.sysdesign_subsections [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.verification_subsections [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.action_index_missing [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.action_unclaimed [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.rung_order [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.rung_empty_rendered [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.capability_twin_skew [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ FeatureSpec.state_rung_missing [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ func.missing_h2 [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ func.open_decisions_shape [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ func.code_orphan [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ func.code_unsurfaced [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ func.edge_behaviour_dangling [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ func.capability_fr_dangling [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ cap.code_unclaimed [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ cap.double_claimed [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ func.edge_cases_few_rows [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ validate_source_citations [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ validate_feature_api_link [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ validate_reading_guide_db_impact [deterministic-pass] @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ validate_feature_screen_link [deterministic-pass] @ F007_AdminModeration
✓ validate_feature_screen_link [deterministic-pass, warn link.pre_migration accepted] @ F009_HeroBadges
✓ validate_feature_screen_link [deterministic-pass] @ F011_AdminCampaigns
✓ FailureTrap.trap1_to_6_regions_n_a @ F009_HeroBadges
✓ FailureTrap.trap1_to_6_regions_n_a @ F011_AdminCampaigns
✓ FailureTrap.trap1_to_6_no_REG_declared @ F007_AdminModeration
✓ Semantic.fr_in_sc_coverage_computed @ F007_AdminModeration..F011_AdminCampaigns (3/3, see C1-C3)
✓ Semantic.business_rule_traceable_to_tech @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Semantic.br_dec_sm_alg_source_claims_match_code @ F007_AdminModeration
✓ Semantic.br_dec_sm_alg_source_claims_match_code @ F009_HeroBadges
✓ Semantic.br_dec_sm_alg_source_claims_match_code @ F011_AdminCampaigns
✓ Semantic.user_facing_strings_match_messages_vi @ F007_AdminModeration
✓ Semantic.user_facing_strings_match_messages_vi @ F011_AdminCampaigns
✓ Semantic.route_perm_model_xref_matches_docs_generated @ F007_AdminModeration
✓ Semantic.route_perm_model_xref_matches_docs_generated @ F009_HeroBadges
✓ Semantic.route_perm_model_xref_matches_docs_generated @ F011_AdminCampaigns
✓ Semantic.ROUTE018_shared_F003_F004_F007_documented @ F007_AdminModeration
✓ Semantic.admin_gate_layers_4b_vs_api_admin_accurate @ F007_AdminModeration
✓ Semantic.admin_gate_layers_4b_vs_api_admin_accurate @ F011_AdminCampaigns
✓ Semantic.demoted_admin_unexpected_copy_documented @ F007_AdminModeration
✓ Semantic.demoted_admin_unexpected_copy_documented @ F011_AdminCampaigns
✓ Semantic.unverified_claims_tagged_as_assumptions @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Semantic.no_double_link_template_conflict_grep @ F007_AdminModeration..F011_AdminCampaigns (3/3)
✓ Semantic.language_directive_vi_prose @ F007_AdminModeration
✓ Semantic.language_directive_vi_prose @ F011_AdminCampaigns

---

## Metrics

| Metric | Value |
|--------|-------|
| Feature Specs | 3 (of 15) |
| User Stories | 8 (US005, US006, US007, US008, US040, US013, US014, US015) |
| Screens | 2 (SCR013, SCR014; F009 owns none) |
| Background Logic Items | 1 (BL014) |
| Permissions | 6 cited (PERM003, PERM014, PERM015, PERM019, PERM020, PERM021) |
| Backend Route Rows | 8 (ROUTE001, 002, 018, 027, 028, 029, 030, 031) |
| Frontend Pages | 2 (/admin/review, /admin/settings) |
| Data Model Entities | 9 distinct (MODEL002, 003, 004, 005, 008, 009, 015, 016 plus F007 DISC set) |
| FR to SC coverage | F007 26/28, F009 6/16, F011 5/25 |
