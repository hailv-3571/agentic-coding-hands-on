---
failed: 0
warnings: 8
missing: 0
result: PASS
---

# Review Report - ScreenSpec batch 04 (SCR016..SCR020)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: 5 screen specs (SCR016_OwnProfile, SCR017_AllNotifications, SCR018_AdminUser, SCR019_AdminOverview, SCR020_OnboardingDepartment) under `artifacts/screens/`; cross-ref `docs/generated/{screen-list,screen-flow,route-list,feature-list,entities}.md`; source spot-check of page, form, hook, action, guard and query files for each screen.

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 5 screen specs |
| Critical issues | 0 |
| Warnings | 8 |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

Spec vs code: no fabricated or off-range citation found; no behavioural claim disproved except the two narrow mismatches in W1 and W2. Orchestrator corrections confirmed against code: `requireSunner()` redirects to `/onboarding/department` without `next` (`shared/auth/current-user.ts:48-52`); SCR020 `unexpected` error (`features/auth/server/choose-department-action.ts:56-66`); SCR019 single-ended date range navigates (`features/admin-moderation/components/review-date-range-filter.tsx:64-69`); SCR018 12 columns incl. ID (`features/admin-users/components/admin-user-table.tsx:56-77`), own-row role button locked not hidden (`features/admin-users/lib/admin-user-role-menu-state.ts:18`), unit-options error keeps both fixed options (`features/admin-users/components/admin-user-filters.tsx:30-34`). All 40 sampled UI strings exist in `messages/vi.json`; MODEL/DISC/ROUTE cross-refs and the `docs/generated/route-list.md:64,70,100,106,124,154,160,161` row citations resolve. Security-surface claims (proxy step 4b, `/api/admin/*` outside `isAdminPath`, role-service guard order, `department_id IS NULL` write guard, owner-only spam, recipient-bound mark-read) all match code. Deterministic: `reading_guide.*` and source-citation validators 0 issues [deterministic-pass].

---

## Critical Issues

_(none)_

---

## Warnings

### W1: SCR016 Exits E21 condition contradicts code and the spec's own Unresolved Question - OPEN
- **Severity**: warning (wrong behavioural claim)
- **Location**: `SCR016_OwnProfile/spec.md:210` vs `:337`
- **Description**: Exits row says E21 opens SCR015 only when "Người trong thẻ không phải chính mình". `NamedPerson` always renders `<Link href=/profile/{id}>` (`features/kudos-feed/components/kudo-card-sender.tsx:28`); own name just bounces back via `app/(app)/profile/[userId]/page.tsx:33`. The row copies the older `docs/generated/screen-flow.md:121` wording and disagrees with UQ line 337, which already states the code behaviour.
- **Fix**: Condition `Thẻ không nằm dưới lớp phủ spam`; Destination `SCR015_OtherProfile (tên chính mình quay lại /profile)`; keep the UQ.

### W2: SCR018 §6 E06 length rule lists trigger `change` but no feedback fires on typing - OPEN
- **Severity**: warning (wrong behavioural claim)
- **Location**: `SCR018_AdminUser/spec.md:162`
- **Description**: the input only caps at 100 (`features/admin-moderation/components/review-search-input.tsx:7,53`, `maxLength`); it never shows "Từ khoá tối đa 100 ký tự". That message appears only in E07 when the URL carries `q` > 100 (`features/admin-users/schemas/user-list-params-schema.ts:69`, spec Branches line 122). QA would write a typing test that cannot fail.
- **Fix**: row becomes `E07 | Từ khoá trên URL tối đa 100 ký tự | "Từ khoá tối đa 100 ký tự" | server response`, plus a note that E06 silently stops at 100.

### W3: SCR018 E22 "Xoá bộ lọc" action condition omits "bảng rỗng" - OPEN
- **Severity**: warning
- **Location**: `SCR018_AdminUser/spec.md:104` (also `:81`, `:184`)
- **Description**: E22 renders only inside the empty-table cell (`features/admin-users/components/admin-user-table.tsx:81-92`, `onClearFilters` reaches the empty row only). Spec action condition says "Có ít nhất một bộ lọc hoặc từ khoá"; with filters set and rows present the button does not exist. §7 line 184 is ambiguous the same way.
- **Fix**: Condition `Bảng rỗng và đang có bộ lọc hoặc từ khoá`; E22 §3 Default note "chỉ nằm trong ô trạng thái rỗng".

### W4: Happy Path narrates cross-screen navigation (SCR017, SCR020) - OPEN
- **Severity**: warning
- **Location**: `SCR017_AllNotifications/spec.md:92`; `SCR020_OnboardingDepartment/spec.md:78`
- **Description**: SCR017 step 4 ends "trình duyệt chuyển tới đối tượng liên quan"; SCR020 step 4 "chuyển người dùng tới trang đích; màn kết thúc ở bước chuyển hướng". The §4 scope note and the v27 rule keep destinations in `## 8. § Exits`.
- **Fix**: SCR017 step 4: "dòng chuyển thành đã đọc ngay (điểm đến xem § 8)". SCR020 step 4: "Server ghi đơn vị vào hồ sơ; màn kết thúc (xem § 8)".

### W5: `screen.appendix_leak` - implementation identifiers inside §§1-10 - OPEN
- **Severity**: warning
- **Location**: `SCR016_OwnProfile/spec.md:149`; `SCR018_AdminUser/spec.md:150,152,153,182`; `SCR019_AdminOverview/spec.md:119,121,142`; `SCR020_OnboardingDepartment/spec.md:122`
- **Description**: tokens that also appear verbatim as Implementation values in `## Implementation Mapping` sit in reader-body cells: `PersonalRewardStatsQuery`, `UserAdminQuery.listPage`, `UserFilterOptionsQuery`, `parseUserListParams`, `UnitStatsQuery.forRange`, `parseOverviewParams`, `requireSunner()`.
- **Fix**: reword the Trigger / Visible-when cell as user-visible behaviour (`Đọc thống kê lỗi`, `Đọc bảng lỗi`, `Đọc danh sách Unit lỗi`, `URL có tham số sai`, `Mọi trang Sunner khác đưa người chưa có đơn vị về đây`); keep the identifier only in the Implementation Mapping (already there).

### W6: SCR017 process-voice and uncited claim about anonymous-to-named edits - OPEN
- **Severity**: warning
- **Location**: `SCR017_AllNotifications/spec.md:294` (claim repeated in `:151` Notes)
- **Description**: UQ says the behaviour "đã được người điều phối xác nhận" with no `file:line`. A spec must not cite its own pipeline as authority, and the claim (stored params keep the anonymous variant) is checkable: `features/notifications/lib/notification-message.ts:14-18` builds text from stored `params`; `features/notifications/server/map-event-to-notifications.ts:35` fixes the nickname at creation.
- **Fix**: replace the parenthetical with those two citations; drop "người điều phối".

### W7: `screen.nav_flow_skew` - SCR016 Entry Points miss the SCR002_AdminLayout account-menu path [WARN_ADVISORY] - OPEN
- **Severity**: warning
- **Location**: `SCR016_OwnProfile/spec.md:197-203`
- **Description**: `docs/generated/screen-flow.md:131` lists SCR002_AdminLayout -> SCR016 via account menu; confirmed in code, `AdminTopBar` renders `HeaderActions` -> `AccountMenu` (`features/app-shell/components/admin-top-bar.tsx:45`, `features/app-shell/components/account-menu.tsx:61`). Same shape for SCR019: `screen-flow.md:132` lists the SCR002 Dashboard menu, spec lists only the Overview item and the SCR003 Dashboard row (`SCR019_AdminOverview/spec.md:163-164`).
- **Fix**: add Entry row `SCR002_AdminLayout | Menu tài khoản › Profile | — | features/app-shell/components/account-menu.tsx:61`; for SCR019 append "hoặc menu tài khoản › Dashboard" to the SCR002 row.

### W8: `screen.element_id_unreferenced_conditional` - SCR016 E14, E15 - OPEN
- **Severity**: warning
- **Location**: `SCR016_OwnProfile/spec.md:175` (§3 rows `:75-76`)
- **Description**: E14/E15 are `Conditional` but appear in no `## 7.` Element(s) cell; the stats row names E07,E08,E09,E11,E12,E13 and mentions E14,E15 only in the Hidden-when prose, so the error branch has no row of its own.
- **Fix**: add row `Khối lỗi thống kê chỉ hiện khi đọc thống kê lỗi | configuration | E14, E15 | Đọc thống kê lỗi | Đọc thành công | Deep link vẫn mở cửa sổ`.

---

## Suggestions (not counted)

- SCR016 `:178` E17 "Hidden when: trang đầu đọc lỗi" holds only for the server first read; after a direction switch fails, counts persist and E17 stays (`features/profile/components/use-profile-kudos-list.ts:30,76-82`, `features/profile/components/profile-kudos-section.tsx:56`). Say "trang đầu do server dựng lỗi".
- SCR016 `:271` and SCR017 `:233` UNVERIFIED rows are resolvable now: owner-only spam is enforced at `features/kudos-feed/server/kudo-public-query.ts:33,55` (`includeOwnSpam` only when `senderId === viewerId`, via `features/profile/lib/profile-kudos-filter.ts:25-27`); mark-read binds `recipient_id = userId` (`features/notifications/server/notification-read-state.ts:11-18`). Upgrade to cited fact.
- SCR019 `:96` "`from`/`to` ngược hoặc `to` trước `from`" is tautological; say "`to` trước `from`".
- SCR018 `:178` "403 từ proxy cho trang và JSON 403 cho action và API": the API 403 comes from `requireAdminApi`, not proxy (per its own Security Surface, `:271`).

---

## Passed Checks

✓ ScreenSpec.required_sections @ SCR016_OwnProfile
✓ ScreenSpec.header_scr_in_screenlist @ SCR016_OwnProfile
✓ ScreenSpec.overview_purpose_present @ SCR016_OwnProfile
✓ ScreenSpec.overview_purpose_non_technical @ SCR016_OwnProfile
✓ screen.layout_sketch_missing @ SCR016_OwnProfile
✓ screen.layout_regions_missing @ SCR016_OwnProfile
✓ ScreenSpec.layout_regions_min2 @ SCR016_OwnProfile
✓ screen.ui_elements_missing @ SCR016_OwnProfile
✓ ScreenSpec.ui_elements_ids @ SCR016_OwnProfile
✓ ScreenSpec.ui_elements_crossref @ SCR016_OwnProfile
✓ ScreenSpec.ui_elements_action_has_available_action @ SCR016_OwnProfile
✓ screen.element_id_dangling @ SCR016_OwnProfile
✓ ScreenSpec.actions_section_present @ SCR016_OwnProfile
✓ ScreenSpec.branches_present @ SCR016_OwnProfile
✓ ScreenSpec.happy_path_not_mermaid @ SCR016_OwnProfile
✓ ScreenSpec.interaction_notes_user_first @ SCR016_OwnProfile
✓ ScreenSpec.ui_states_error_row @ SCR016_OwnProfile
✓ ScreenSpec.ui_states_empty_row @ SCR016_OwnProfile
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR016_OwnProfile
✓ screen.impl_mapping_missing_action @ SCR016_OwnProfile
✓ ScreenSpec.validation_client_side_documented @ SCR016_OwnProfile
✓ ScreenSpec.conditional_auth_notes @ SCR016_OwnProfile
✓ ScreenSpec.conditional_condition_user_visible @ SCR016_OwnProfile
✓ screen.nav_invented_destination @ SCR016_OwnProfile
✓ ScreenSpec.accessibility_5_rows @ SCR016_OwnProfile
✓ screen.responsive_unevidenced @ SCR016_OwnProfile
✓ screen.expected_without_basis @ SCR016_OwnProfile
✓ ScreenSpec.unverified_described @ SCR016_OwnProfile
✓ ScreenSpec.component_variants @ SCR016_OwnProfile
✓ ScreenSpec.security_surface_present @ SCR016_OwnProfile
✓ ScreenSpec.source_references_present @ SCR016_OwnProfile
✓ ScreenSpec.source_references_resolve @ SCR016_OwnProfile
✓ screen.sot_pre_sot_not_fired @ SCR016_OwnProfile
✓ Universal.cross_refs_resolve @ SCR016_OwnProfile
✓ Composite.h2_h3_h4_h5_gates.not_applicable @ SCR016_OwnProfile
✓ reading_guide.source_walkthrough @ SCR016_OwnProfile [deterministic-pass]
✓ validate_source_citations @ SCR016_OwnProfile [deterministic-pass]
✓ validate_reading_guide_db_impact @ SCR016_OwnProfile [deterministic-pass]
✓ ScreenSpec.required_sections @ SCR017_AllNotifications
✓ ScreenSpec.header_scr_in_screenlist @ SCR017_AllNotifications
✓ ScreenSpec.overview_purpose_present @ SCR017_AllNotifications
✓ ScreenSpec.overview_purpose_non_technical @ SCR017_AllNotifications
✓ screen.layout_sketch_missing @ SCR017_AllNotifications
✓ screen.layout_regions_missing @ SCR017_AllNotifications
✓ ScreenSpec.layout_regions_min2 @ SCR017_AllNotifications
✓ screen.ui_elements_missing @ SCR017_AllNotifications
✓ ScreenSpec.ui_elements_ids @ SCR017_AllNotifications
✓ ScreenSpec.ui_elements_crossref @ SCR017_AllNotifications
✓ ScreenSpec.ui_elements_action_has_available_action @ SCR017_AllNotifications
✓ screen.element_id_dangling @ SCR017_AllNotifications
✓ ScreenSpec.actions_section_present @ SCR017_AllNotifications
✓ ScreenSpec.branches_present @ SCR017_AllNotifications
✓ ScreenSpec.happy_path_not_mermaid @ SCR017_AllNotifications
✓ ScreenSpec.interaction_notes_user_first @ SCR017_AllNotifications
✓ ScreenSpec.ui_states_error_row @ SCR017_AllNotifications
✓ ScreenSpec.ui_states_empty_row @ SCR017_AllNotifications
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR017_AllNotifications
✓ screen.impl_mapping_missing_action @ SCR017_AllNotifications
✓ ScreenSpec.validation_client_side_documented @ SCR017_AllNotifications
✓ ScreenSpec.conditional_auth_notes @ SCR017_AllNotifications
✓ ScreenSpec.conditional_condition_user_visible @ SCR017_AllNotifications
✓ screen.nav_invented_destination @ SCR017_AllNotifications
✓ ScreenSpec.accessibility_5_rows @ SCR017_AllNotifications
✓ screen.responsive_unevidenced @ SCR017_AllNotifications
✓ screen.expected_without_basis @ SCR017_AllNotifications
✓ ScreenSpec.unverified_described @ SCR017_AllNotifications
✓ ScreenSpec.component_variants @ SCR017_AllNotifications
✓ ScreenSpec.security_surface_present @ SCR017_AllNotifications
✓ ScreenSpec.source_references_present @ SCR017_AllNotifications
✓ ScreenSpec.source_references_resolve @ SCR017_AllNotifications
✓ screen.sot_pre_sot_not_fired @ SCR017_AllNotifications
✓ Universal.cross_refs_resolve @ SCR017_AllNotifications
✓ Composite.h2_h3_h4_h5_gates.not_applicable @ SCR017_AllNotifications
✓ reading_guide.source_walkthrough @ SCR017_AllNotifications [deterministic-pass]
✓ validate_source_citations @ SCR017_AllNotifications [deterministic-pass]
✓ validate_reading_guide_db_impact @ SCR017_AllNotifications [deterministic-pass]
✓ ScreenSpec.required_sections @ SCR018_AdminUser
✓ ScreenSpec.header_scr_in_screenlist @ SCR018_AdminUser
✓ ScreenSpec.overview_purpose_present @ SCR018_AdminUser
✓ ScreenSpec.overview_purpose_non_technical @ SCR018_AdminUser
✓ screen.layout_sketch_missing @ SCR018_AdminUser
✓ screen.layout_regions_missing @ SCR018_AdminUser
✓ ScreenSpec.layout_regions_min2 @ SCR018_AdminUser
✓ screen.ui_elements_missing @ SCR018_AdminUser
✓ ScreenSpec.ui_elements_ids @ SCR018_AdminUser
✓ ScreenSpec.ui_elements_crossref @ SCR018_AdminUser
✓ ScreenSpec.ui_elements_action_has_available_action @ SCR018_AdminUser
✓ screen.element_id_dangling @ SCR018_AdminUser
✓ ScreenSpec.actions_section_present @ SCR018_AdminUser
✓ ScreenSpec.branches_present @ SCR018_AdminUser
✓ ScreenSpec.happy_path_not_mermaid @ SCR018_AdminUser
✓ ScreenSpec.interaction_notes_user_first @ SCR018_AdminUser
✓ ScreenSpec.ui_states_error_row @ SCR018_AdminUser
✓ ScreenSpec.ui_states_empty_row @ SCR018_AdminUser
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR018_AdminUser
✓ screen.impl_mapping_missing_action @ SCR018_AdminUser
✓ ScreenSpec.validation_client_side_documented @ SCR018_AdminUser
✓ ScreenSpec.conditional_auth_notes @ SCR018_AdminUser
✓ ScreenSpec.conditional_condition_user_visible @ SCR018_AdminUser
✓ screen.nav_invented_destination @ SCR018_AdminUser
✓ ScreenSpec.accessibility_5_rows @ SCR018_AdminUser
✓ screen.responsive_unevidenced @ SCR018_AdminUser
✓ screen.expected_without_basis @ SCR018_AdminUser
✓ ScreenSpec.unverified_described @ SCR018_AdminUser
✓ ScreenSpec.component_variants @ SCR018_AdminUser
✓ ScreenSpec.security_surface_present @ SCR018_AdminUser
✓ ScreenSpec.source_references_present @ SCR018_AdminUser
✓ ScreenSpec.source_references_resolve @ SCR018_AdminUser
✓ screen.sot_pre_sot_not_fired @ SCR018_AdminUser
✓ Universal.cross_refs_resolve @ SCR018_AdminUser
✓ Composite.h2_h3_h4_h5_gates.not_applicable @ SCR018_AdminUser
✓ reading_guide.source_walkthrough @ SCR018_AdminUser [deterministic-pass]
✓ validate_source_citations @ SCR018_AdminUser [deterministic-pass]
✓ validate_reading_guide_db_impact @ SCR018_AdminUser [deterministic-pass]
✓ ScreenSpec.required_sections @ SCR019_AdminOverview
✓ ScreenSpec.header_scr_in_screenlist @ SCR019_AdminOverview
✓ ScreenSpec.overview_purpose_present @ SCR019_AdminOverview
✓ ScreenSpec.overview_purpose_non_technical @ SCR019_AdminOverview
✓ screen.layout_sketch_missing @ SCR019_AdminOverview
✓ screen.layout_regions_missing @ SCR019_AdminOverview
✓ ScreenSpec.layout_regions_min2 @ SCR019_AdminOverview
✓ screen.ui_elements_missing @ SCR019_AdminOverview
✓ ScreenSpec.ui_elements_ids @ SCR019_AdminOverview
✓ ScreenSpec.ui_elements_crossref @ SCR019_AdminOverview
✓ ScreenSpec.ui_elements_action_has_available_action @ SCR019_AdminOverview
✓ screen.element_id_dangling @ SCR019_AdminOverview
✓ ScreenSpec.actions_section_present @ SCR019_AdminOverview
✓ ScreenSpec.branches_present @ SCR019_AdminOverview
✓ ScreenSpec.happy_path_not_mermaid @ SCR019_AdminOverview
✓ ScreenSpec.interaction_notes_user_first @ SCR019_AdminOverview
✓ ScreenSpec.ui_states_error_row @ SCR019_AdminOverview
✓ ScreenSpec.ui_states_empty_row @ SCR019_AdminOverview
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR019_AdminOverview
✓ screen.impl_mapping_missing_action @ SCR019_AdminOverview
✓ ScreenSpec.validation_client_side_documented @ SCR019_AdminOverview
✓ ScreenSpec.conditional_auth_notes @ SCR019_AdminOverview
✓ ScreenSpec.conditional_condition_user_visible @ SCR019_AdminOverview
✓ screen.nav_invented_destination @ SCR019_AdminOverview
✓ ScreenSpec.accessibility_5_rows @ SCR019_AdminOverview
✓ screen.responsive_unevidenced @ SCR019_AdminOverview
✓ screen.expected_without_basis @ SCR019_AdminOverview
✓ ScreenSpec.unverified_described @ SCR019_AdminOverview
✓ ScreenSpec.component_variants @ SCR019_AdminOverview
✓ ScreenSpec.security_surface_present @ SCR019_AdminOverview
✓ ScreenSpec.source_references_present @ SCR019_AdminOverview
✓ ScreenSpec.source_references_resolve @ SCR019_AdminOverview
✓ screen.sot_pre_sot_not_fired @ SCR019_AdminOverview
✓ Universal.cross_refs_resolve @ SCR019_AdminOverview
✓ Composite.h2_h3_h4_h5_gates.not_applicable @ SCR019_AdminOverview
✓ reading_guide.source_walkthrough @ SCR019_AdminOverview [deterministic-pass]
✓ validate_source_citations @ SCR019_AdminOverview [deterministic-pass]
✓ validate_reading_guide_db_impact @ SCR019_AdminOverview [deterministic-pass]
✓ ScreenSpec.required_sections @ SCR020_OnboardingDepartment
✓ ScreenSpec.header_scr_in_screenlist @ SCR020_OnboardingDepartment
✓ ScreenSpec.overview_purpose_present @ SCR020_OnboardingDepartment
✓ ScreenSpec.overview_purpose_non_technical @ SCR020_OnboardingDepartment
✓ screen.layout_sketch_missing @ SCR020_OnboardingDepartment
✓ screen.layout_regions_missing @ SCR020_OnboardingDepartment
✓ ScreenSpec.layout_regions_min2 @ SCR020_OnboardingDepartment
✓ screen.ui_elements_missing @ SCR020_OnboardingDepartment
✓ ScreenSpec.ui_elements_ids @ SCR020_OnboardingDepartment
✓ ScreenSpec.ui_elements_crossref @ SCR020_OnboardingDepartment
✓ ScreenSpec.ui_elements_action_has_available_action @ SCR020_OnboardingDepartment
✓ screen.element_id_dangling @ SCR020_OnboardingDepartment
✓ ScreenSpec.actions_section_present @ SCR020_OnboardingDepartment
✓ ScreenSpec.branches_present @ SCR020_OnboardingDepartment
✓ ScreenSpec.happy_path_not_mermaid @ SCR020_OnboardingDepartment
✓ ScreenSpec.interaction_notes_user_first @ SCR020_OnboardingDepartment
✓ ScreenSpec.ui_states_error_row @ SCR020_OnboardingDepartment
✓ ScreenSpec.ui_states_empty_row @ SCR020_OnboardingDepartment
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR020_OnboardingDepartment
✓ screen.impl_mapping_missing_action @ SCR020_OnboardingDepartment
✓ ScreenSpec.validation_client_side_documented @ SCR020_OnboardingDepartment
✓ ScreenSpec.conditional_auth_notes @ SCR020_OnboardingDepartment
✓ ScreenSpec.conditional_condition_user_visible @ SCR020_OnboardingDepartment
✓ screen.nav_invented_destination @ SCR020_OnboardingDepartment
✓ ScreenSpec.accessibility_5_rows @ SCR020_OnboardingDepartment
✓ screen.responsive_unevidenced @ SCR020_OnboardingDepartment
✓ screen.expected_without_basis @ SCR020_OnboardingDepartment
✓ ScreenSpec.unverified_described @ SCR020_OnboardingDepartment
✓ ScreenSpec.component_variants @ SCR020_OnboardingDepartment
✓ ScreenSpec.security_surface_present @ SCR020_OnboardingDepartment
✓ ScreenSpec.source_references_present @ SCR020_OnboardingDepartment
✓ ScreenSpec.source_references_resolve @ SCR020_OnboardingDepartment
✓ screen.sot_pre_sot_not_fired @ SCR020_OnboardingDepartment
✓ Universal.cross_refs_resolve @ SCR020_OnboardingDepartment
✓ Composite.h2_h3_h4_h5_gates.not_applicable @ SCR020_OnboardingDepartment
✓ reading_guide.source_walkthrough @ SCR020_OnboardingDepartment [deterministic-pass]
✓ validate_source_citations @ SCR020_OnboardingDepartment [deterministic-pass]
✓ validate_reading_guide_db_impact @ SCR020_OnboardingDepartment [deterministic-pass]
✓ screen.element_id_unreferenced_conditional @ SCR017_AllNotifications
✓ screen.nav_flow_skew @ SCR017_AllNotifications
✓ screen.element_id_unreferenced_conditional @ SCR018_AdminUser
✓ screen.nav_flow_skew @ SCR018_AdminUser
✓ screen.element_id_unreferenced_conditional @ SCR019_AdminOverview
✓ screen.nav_flow_skew @ SCR019_AdminOverview
✓ screen.element_id_unreferenced_conditional @ SCR020_OnboardingDepartment
✓ screen.nav_flow_skew @ SCR020_OnboardingDepartment
✓ ScreenSpec.happy_path_within_screen_only @ SCR016_OwnProfile
✓ ScreenSpec.happy_path_within_screen_only @ SCR018_AdminUser
✓ ScreenSpec.happy_path_within_screen_only @ SCR019_AdminOverview
✓ screen.appendix_leak @ SCR017_AllNotifications
✓ Universal.claims_match_source @ SCR019_AdminOverview
✓ Universal.claims_match_source @ SCR020_OnboardingDepartment

---

## Metrics

| Metric | Value |
|--------|-------|
| Screens reviewed | 5 (SCR016..SCR020) |
| Source files spot-checked | ~40 |
| Quoted UI strings verified in messages/vi.json | 40/40 |
| Critical | 0 |
| Warnings | 8 |
