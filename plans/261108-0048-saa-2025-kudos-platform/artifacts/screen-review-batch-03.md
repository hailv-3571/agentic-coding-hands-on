---
failed: 0
warnings: 4
missing: 0
result: PASS
---

# Review Report - ScreenSpec batch 03 (SCR011..SCR015)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: 5 screen specs (SCR011_Homepage, SCR012_Rules, SCR013_AdminReviewContent, SCR014_AdminCampaignSettings, SCR015_OtherProfile) under `artifacts/screens/`; cross-ref `docs/generated/{screen-list,screen-flow,route-list,feature-list}.md`; source spot-check (home page + countdown files, rules panel/close button, campaign-phase, admin settings page, review-table-row, moderation service/actions, export route + CSV header, profile page/page-data/filter/not-found, `messages/vi.json` receivedTotal).

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 5 screen specs |
| Critical issues | 0 |
| Warnings | 4 |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

Spec vs code: no behavioural claim disproved. Orchestrator corrections confirmed against code: SCR013 real name + "An danh" chip (`features/admin-moderation/components/review-table-row.tsx:49-56`), SCR014 no status column / phase `active` (`features/admin-campaigns/server/campaign-phase.ts:8-12`), SCR015 "Da nhan: {count} Kudos" (`messages/vi.json:699`), Rules Dong uses Navigation API first (`features/awards-portal/components/rules-close-button.tsx:15-23`), SCR015 own-id redirect (`app/(app)/profile/[userId]/page.tsx:33`).

---

## Critical Issues

_(none)_

---

## Warnings

### W1: Stale `docs/generated/screen-flow.md:NN` line citations in Entry Points - OPEN
- **Severity**: warning
- **Location**: `SCR011_Homepage/spec.md:155-157,163`; `SCR012_Rules/spec.md:133`; `SCR013_AdminReviewContent/spec.md:194`; `SCR014_AdminCampaignSettings/spec.md:201`; `SCR015_OtherProfile/spec.md:202-206`
- **Description**: cited rows are shifted vs the current doc (docs edited after authoring). SCR011 cites :81/:83/:84/:77, actual rows 84/86/87/80 (:77 is the table separator, :81 is START to SCR004). SCR012 :94 -> 97; SCR013 :122 -> 127; SCR014 :124 -> 129; SCR015 :105/:107/:108/:111/:116 -> 108/110/111/115/121. Offset +3..+5. Reader lands on a wrong row. Validator does not catch it (docs line, not source).
- **Fix**: re-point to current rows, or cite the named path (e.g. `screen-flow.md Screen Access Paths: SCR001_Login -> SCR011_Homepage`) so it survives doc edits.

### W2: `screen.nav_flow_skew` - SCR015 Entry Points miss the Highlight-card path [WARN_ADVISORY] - OPEN
- **Severity**: warning
- **Location**: `SCR015_OtherProfile/spec.md:200-207`
- **Description**: `docs/generated/screen-flow.md:112` has SCR007_KudosLiveBoardFeed -> SCR015 via name/avatar on a Highlight card (REG003_HighlightKudos). Spec lists only search, Spotlight, All-Kudos card.
- **Fix**: add Entry row `SCR007_KudosLiveBoardFeed | Bam ten hoac avatar nguoi co ten tren the Highlight | Nguoi gui khong an danh | screen-flow.md Screen Access Paths`.

### W3: Implementation Mapping Kind `feature-flag` mislabels a plain prop expression - OPEN
- **Severity**: warning
- **Location**: `SCR011_Homepage/spec.md:211`
- **Description**: E02 row is `pendingLabel && !parts.done` (`features/awards-portal/components/countdown-timer.tsx:46`); no flag API involved, and the section 7 row (line 136) already types it `configuration` ("not a boolean flag"). Internal inconsistency.
- **Fix**: Kind `js` (or `helper`).

### W4: Element Type `button` for elements implemented as `<Link>` - OPEN
- **Severity**: warning
- **Location**: `SCR011_Homepage/spec.md:70,71,78` (E09, E10, E17); `SCR012_Rules/spec.md:70` (E12)
- **Description**: `homepage-hero.tsx:45,49`, `kudos-banner.tsx:38`, `rules-panel.tsx:43` are anchors, while E15 (award card) is correctly `link`. Affects Designer/QA expectations (role, new-tab) and the a11y statement. SCR012 E11 Dong is a true `<button>`.
- **Fix**: Type `link` for E09, E10, E17 (SCR011) and E12 (SCR012).

---

## Passed Checks

✓ ScreenSpec.header_scr_code @ SCR011_Homepage
✓ ScreenSpec.required_sections @ SCR011_Homepage
✓ ScreenSpec.overview_purpose @ SCR011_Homepage
✓ ScreenSpec.overview_purpose_non_technical @ SCR011_Homepage
✓ ScreenSpec.layout_sketch @ SCR011_Homepage
✓ ScreenSpec.layout_regions @ SCR011_Homepage
✓ ScreenSpec.layout_regions_min2 @ SCR011_Homepage
✓ ScreenSpec.ui_elements @ SCR011_Homepage
✓ ScreenSpec.element_id_sequence @ SCR011_Homepage
✓ ScreenSpec.element_action_has_available_action @ SCR011_Homepage
✓ ScreenSpec.element_id_dangling @ SCR011_Homepage
✓ ScreenSpec.element_id_unreferenced_conditional @ SCR011_Homepage
✓ ScreenSpec.user_actions @ SCR011_Homepage
✓ ScreenSpec.happy_path @ SCR011_Homepage
✓ ScreenSpec.happy_path_no_cross_screen_nav @ SCR011_Homepage
✓ ScreenSpec.happy_path_not_mermaid @ SCR011_Homepage
✓ ScreenSpec.interaction_notes_user_first @ SCR011_Homepage
✓ ScreenSpec.ui_states_error_row @ SCR011_Homepage
✓ ScreenSpec.ui_states_empty_row @ SCR011_Homepage
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR011_Homepage
✓ ScreenSpec.impl_mapping_missing_action @ SCR011_Homepage
✓ ScreenSpec.validation_not_server_only @ SCR011_Homepage
✓ ScreenSpec.conditional_auth_notes @ SCR011_Homepage
✓ ScreenSpec.conditional_literals_tagged @ SCR011_Homepage
✓ ScreenSpec.conditional_condition_user_visible @ SCR011_Homepage
✓ ScreenSpec.nav_invented_destination @ SCR011_Homepage
✓ ScreenSpec.accessibility_5_rows @ SCR011_Homepage
✓ ScreenSpec.responsive_evidenced @ SCR011_Homepage
✓ ScreenSpec.unverified_described @ SCR011_Homepage
✓ ScreenSpec.expected_without_basis @ SCR011_Homepage
✓ ScreenSpec.appendix_leak @ SCR011_Homepage
✓ ScreenSpec.security_surface @ SCR011_Homepage
✓ ScreenSpec.source_references @ SCR011_Homepage
✓ ScreenSpec.no_lazy_na @ SCR011_Homepage
✓ ScreenSpec.scope_no_business_codes @ SCR011_Homepage
✓ ScreenSpec.sot_shape @ SCR011_Homepage
✓ reading_guide.malformed @ SCR011_Homepage [deterministic-pass]
✓ reading_guide.unmapped @ SCR011_Homepage [deterministic-pass]
✓ reading_guide.db_impact @ SCR011_Homepage [deterministic-pass]
✓ composite.gates @ SCR011_Homepage
✓ composite.failure_traps @ SCR011_Homepage
✓ ScreenSpec.header_scr_code @ SCR012_Rules
✓ ScreenSpec.required_sections @ SCR012_Rules
✓ ScreenSpec.overview_purpose @ SCR012_Rules
✓ ScreenSpec.overview_purpose_non_technical @ SCR012_Rules
✓ ScreenSpec.layout_sketch @ SCR012_Rules
✓ ScreenSpec.layout_regions @ SCR012_Rules
✓ ScreenSpec.layout_regions_min2 @ SCR012_Rules
✓ ScreenSpec.ui_elements @ SCR012_Rules
✓ ScreenSpec.element_id_sequence @ SCR012_Rules
✓ ScreenSpec.element_action_has_available_action @ SCR012_Rules
✓ ScreenSpec.element_id_dangling @ SCR012_Rules
✓ ScreenSpec.element_id_unreferenced_conditional @ SCR012_Rules
✓ ScreenSpec.user_actions @ SCR012_Rules
✓ ScreenSpec.happy_path @ SCR012_Rules
✓ ScreenSpec.happy_path_no_cross_screen_nav @ SCR012_Rules
✓ ScreenSpec.happy_path_not_mermaid @ SCR012_Rules
✓ ScreenSpec.interaction_notes_user_first @ SCR012_Rules
✓ ScreenSpec.ui_states_error_row @ SCR012_Rules
✓ ScreenSpec.ui_states_empty_row @ SCR012_Rules
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR012_Rules
✓ ScreenSpec.impl_mapping_missing_action @ SCR012_Rules
✓ ScreenSpec.validation_not_server_only @ SCR012_Rules
✓ ScreenSpec.conditional_auth_notes @ SCR012_Rules
✓ ScreenSpec.conditional_literals_tagged @ SCR012_Rules
✓ ScreenSpec.conditional_condition_user_visible @ SCR012_Rules
✓ ScreenSpec.nav_invented_destination @ SCR012_Rules
✓ ScreenSpec.accessibility_5_rows @ SCR012_Rules
✓ ScreenSpec.responsive_evidenced @ SCR012_Rules
✓ ScreenSpec.unverified_described @ SCR012_Rules
✓ ScreenSpec.expected_without_basis @ SCR012_Rules
✓ ScreenSpec.appendix_leak @ SCR012_Rules
✓ ScreenSpec.security_surface @ SCR012_Rules
✓ ScreenSpec.source_references @ SCR012_Rules
✓ ScreenSpec.no_lazy_na @ SCR012_Rules
✓ ScreenSpec.scope_no_business_codes @ SCR012_Rules
✓ ScreenSpec.sot_shape @ SCR012_Rules
✓ reading_guide.malformed @ SCR012_Rules [deterministic-pass]
✓ reading_guide.unmapped @ SCR012_Rules [deterministic-pass]
✓ reading_guide.db_impact @ SCR012_Rules [deterministic-pass]
✓ composite.gates @ SCR012_Rules
✓ composite.failure_traps @ SCR012_Rules
✓ ScreenSpec.header_scr_code @ SCR013_AdminReviewContent
✓ ScreenSpec.required_sections @ SCR013_AdminReviewContent
✓ ScreenSpec.overview_purpose @ SCR013_AdminReviewContent
✓ ScreenSpec.overview_purpose_non_technical @ SCR013_AdminReviewContent
✓ ScreenSpec.layout_sketch @ SCR013_AdminReviewContent
✓ ScreenSpec.layout_regions @ SCR013_AdminReviewContent
✓ ScreenSpec.layout_regions_min2 @ SCR013_AdminReviewContent
✓ ScreenSpec.ui_elements @ SCR013_AdminReviewContent
✓ ScreenSpec.element_id_sequence @ SCR013_AdminReviewContent
✓ ScreenSpec.element_action_has_available_action @ SCR013_AdminReviewContent
✓ ScreenSpec.element_id_dangling @ SCR013_AdminReviewContent
✓ ScreenSpec.element_id_unreferenced_conditional @ SCR013_AdminReviewContent
✓ ScreenSpec.user_actions @ SCR013_AdminReviewContent
✓ ScreenSpec.happy_path @ SCR013_AdminReviewContent
✓ ScreenSpec.happy_path_no_cross_screen_nav @ SCR013_AdminReviewContent
✓ ScreenSpec.happy_path_not_mermaid @ SCR013_AdminReviewContent
✓ ScreenSpec.interaction_notes_user_first @ SCR013_AdminReviewContent
✓ ScreenSpec.ui_states_error_row @ SCR013_AdminReviewContent
✓ ScreenSpec.ui_states_empty_row @ SCR013_AdminReviewContent
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR013_AdminReviewContent
✓ ScreenSpec.impl_mapping_missing_action @ SCR013_AdminReviewContent
✓ ScreenSpec.validation_not_server_only @ SCR013_AdminReviewContent
✓ ScreenSpec.conditional_auth_notes @ SCR013_AdminReviewContent
✓ ScreenSpec.conditional_literals_tagged @ SCR013_AdminReviewContent
✓ ScreenSpec.conditional_condition_user_visible @ SCR013_AdminReviewContent
✓ ScreenSpec.nav_invented_destination @ SCR013_AdminReviewContent
✓ ScreenSpec.accessibility_5_rows @ SCR013_AdminReviewContent
✓ ScreenSpec.responsive_evidenced @ SCR013_AdminReviewContent
✓ ScreenSpec.unverified_described @ SCR013_AdminReviewContent
✓ ScreenSpec.expected_without_basis @ SCR013_AdminReviewContent
✓ ScreenSpec.appendix_leak @ SCR013_AdminReviewContent
✓ ScreenSpec.security_surface @ SCR013_AdminReviewContent
✓ ScreenSpec.source_references @ SCR013_AdminReviewContent
✓ ScreenSpec.no_lazy_na @ SCR013_AdminReviewContent
✓ ScreenSpec.scope_no_business_codes @ SCR013_AdminReviewContent
✓ ScreenSpec.sot_shape @ SCR013_AdminReviewContent
✓ reading_guide.malformed @ SCR013_AdminReviewContent [deterministic-pass]
✓ reading_guide.unmapped @ SCR013_AdminReviewContent [deterministic-pass]
✓ reading_guide.db_impact @ SCR013_AdminReviewContent [deterministic-pass]
✓ composite.gates @ SCR013_AdminReviewContent
✓ composite.failure_traps @ SCR013_AdminReviewContent
✓ ScreenSpec.header_scr_code @ SCR014_AdminCampaignSettings
✓ ScreenSpec.required_sections @ SCR014_AdminCampaignSettings
✓ ScreenSpec.overview_purpose @ SCR014_AdminCampaignSettings
✓ ScreenSpec.overview_purpose_non_technical @ SCR014_AdminCampaignSettings
✓ ScreenSpec.layout_sketch @ SCR014_AdminCampaignSettings
✓ ScreenSpec.layout_regions @ SCR014_AdminCampaignSettings
✓ ScreenSpec.layout_regions_min2 @ SCR014_AdminCampaignSettings
✓ ScreenSpec.ui_elements @ SCR014_AdminCampaignSettings
✓ ScreenSpec.element_id_sequence @ SCR014_AdminCampaignSettings
✓ ScreenSpec.element_action_has_available_action @ SCR014_AdminCampaignSettings
✓ ScreenSpec.element_id_dangling @ SCR014_AdminCampaignSettings
✓ ScreenSpec.element_id_unreferenced_conditional @ SCR014_AdminCampaignSettings
✓ ScreenSpec.user_actions @ SCR014_AdminCampaignSettings
✓ ScreenSpec.happy_path @ SCR014_AdminCampaignSettings
✓ ScreenSpec.happy_path_no_cross_screen_nav @ SCR014_AdminCampaignSettings
✓ ScreenSpec.happy_path_not_mermaid @ SCR014_AdminCampaignSettings
✓ ScreenSpec.interaction_notes_user_first @ SCR014_AdminCampaignSettings
✓ ScreenSpec.ui_states_error_row @ SCR014_AdminCampaignSettings
✓ ScreenSpec.ui_states_empty_row @ SCR014_AdminCampaignSettings
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR014_AdminCampaignSettings
✓ ScreenSpec.impl_mapping_missing_action @ SCR014_AdminCampaignSettings
✓ ScreenSpec.validation_not_server_only @ SCR014_AdminCampaignSettings
✓ ScreenSpec.conditional_auth_notes @ SCR014_AdminCampaignSettings
✓ ScreenSpec.conditional_literals_tagged @ SCR014_AdminCampaignSettings
✓ ScreenSpec.conditional_condition_user_visible @ SCR014_AdminCampaignSettings
✓ ScreenSpec.nav_invented_destination @ SCR014_AdminCampaignSettings
✓ ScreenSpec.accessibility_5_rows @ SCR014_AdminCampaignSettings
✓ ScreenSpec.responsive_evidenced @ SCR014_AdminCampaignSettings
✓ ScreenSpec.unverified_described @ SCR014_AdminCampaignSettings
✓ ScreenSpec.expected_without_basis @ SCR014_AdminCampaignSettings
✓ ScreenSpec.appendix_leak @ SCR014_AdminCampaignSettings
✓ ScreenSpec.security_surface @ SCR014_AdminCampaignSettings
✓ ScreenSpec.source_references @ SCR014_AdminCampaignSettings
✓ ScreenSpec.no_lazy_na @ SCR014_AdminCampaignSettings
✓ ScreenSpec.scope_no_business_codes @ SCR014_AdminCampaignSettings
✓ ScreenSpec.sot_shape @ SCR014_AdminCampaignSettings
✓ reading_guide.malformed @ SCR014_AdminCampaignSettings [deterministic-pass]
✓ reading_guide.unmapped @ SCR014_AdminCampaignSettings [deterministic-pass]
✓ reading_guide.db_impact @ SCR014_AdminCampaignSettings [deterministic-pass]
✓ composite.gates @ SCR014_AdminCampaignSettings
✓ composite.failure_traps @ SCR014_AdminCampaignSettings
✓ ScreenSpec.header_scr_code @ SCR015_OtherProfile
✓ ScreenSpec.required_sections @ SCR015_OtherProfile
✓ ScreenSpec.overview_purpose @ SCR015_OtherProfile
✓ ScreenSpec.overview_purpose_non_technical @ SCR015_OtherProfile
✓ ScreenSpec.layout_sketch @ SCR015_OtherProfile
✓ ScreenSpec.layout_regions @ SCR015_OtherProfile
✓ ScreenSpec.layout_regions_min2 @ SCR015_OtherProfile
✓ ScreenSpec.ui_elements @ SCR015_OtherProfile
✓ ScreenSpec.element_id_sequence @ SCR015_OtherProfile
✓ ScreenSpec.element_action_has_available_action @ SCR015_OtherProfile
✓ ScreenSpec.element_id_dangling @ SCR015_OtherProfile
✓ ScreenSpec.element_id_unreferenced_conditional @ SCR015_OtherProfile
✓ ScreenSpec.user_actions @ SCR015_OtherProfile
✓ ScreenSpec.happy_path @ SCR015_OtherProfile
✓ ScreenSpec.happy_path_no_cross_screen_nav @ SCR015_OtherProfile
✓ ScreenSpec.happy_path_not_mermaid @ SCR015_OtherProfile
✓ ScreenSpec.interaction_notes_user_first @ SCR015_OtherProfile
✓ ScreenSpec.ui_states_error_row @ SCR015_OtherProfile
✓ ScreenSpec.ui_states_empty_row @ SCR015_OtherProfile
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR015_OtherProfile
✓ ScreenSpec.impl_mapping_missing_action @ SCR015_OtherProfile
✓ ScreenSpec.validation_not_server_only @ SCR015_OtherProfile
✓ ScreenSpec.conditional_auth_notes @ SCR015_OtherProfile
✓ ScreenSpec.conditional_literals_tagged @ SCR015_OtherProfile
✓ ScreenSpec.conditional_condition_user_visible @ SCR015_OtherProfile
✓ ScreenSpec.nav_invented_destination @ SCR015_OtherProfile
✓ ScreenSpec.accessibility_5_rows @ SCR015_OtherProfile
✓ ScreenSpec.responsive_evidenced @ SCR015_OtherProfile
✓ ScreenSpec.unverified_described @ SCR015_OtherProfile
✓ ScreenSpec.expected_without_basis @ SCR015_OtherProfile
✓ ScreenSpec.appendix_leak @ SCR015_OtherProfile
✓ ScreenSpec.security_surface @ SCR015_OtherProfile
✓ ScreenSpec.source_references @ SCR015_OtherProfile
✓ ScreenSpec.no_lazy_na @ SCR015_OtherProfile
✓ ScreenSpec.scope_no_business_codes @ SCR015_OtherProfile
✓ ScreenSpec.sot_shape @ SCR015_OtherProfile
✓ reading_guide.malformed @ SCR015_OtherProfile [deterministic-pass]
✓ reading_guide.unmapped @ SCR015_OtherProfile [deterministic-pass]
✓ reading_guide.db_impact @ SCR015_OtherProfile [deterministic-pass]
✓ composite.gates @ SCR015_OtherProfile
✓ composite.failure_traps @ SCR015_OtherProfile
✓ ScreenSpec.nav_flow_skew @ SCR011_Homepage
✓ ScreenSpec.nav_flow_skew @ SCR012_Rules
✓ ScreenSpec.nav_flow_skew @ SCR013_AdminReviewContent
✓ ScreenSpec.nav_flow_skew @ SCR014_AdminCampaignSettings
✓ ScreenSpec.component_variants_justified @ SCR015_OtherProfile
✓ ScreenSpec.child_routes_h6 @ SCR011_Homepage..SCR015_OtherProfile (N/A 5/5, no H6 shell)
✓ ValidateSourceCitations @ SCR011_Homepage..SCR015_OtherProfile (5/5) [deterministic-pass]
✓ SpecVsCode.behaviour_claims_spot_check @ SCR011_Homepage..SCR015_OtherProfile (5/5)

---

## Metrics

| Metric | Value |
|--------|-------|
| Screens reviewed | 5 |
| Source files spot-checked | 22 |
| Behavioural claims disproved | 0 |
