---
failed: 0
warnings: 7
missing: 0
result: PASS
---

# Screen Spec Review — Batch 01 (SS.2)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: SCR001_Login, SCR002_AdminLayout, SCR003_AppLayout, SCR004_Error403, SCR005_Error404 (`artifacts/screens/{SCR}/spec.md`, 1300 lines total)
**Method**: full read of the 5 specs; cross-ref with docs/generated screen-list, screen-flow, route-list, feature-list, entities; about 40 source citations spot-checked against code (callback route, login page/form/action/button, admin-guard, current-user, route-access-policy, session-proxy, access-denied-response, not-found, forbidden, shell-session, app-routes, app-header, admin-top-bar, account-menu, app-footer, error-panel, layouts).
**Deterministic**: `reading_guide.*` and source-citation rules marked [deterministic-pass] (0 critical / 0 issues from the orchestrator).

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 5 screen specs |
| Critical issues | 0 |
| Warnings | 7 |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

## Critical Issues

_(none)_

## Warnings

### W1: SCR002 still says the 3 account-menu exits are "not in screen-flow" — OPEN
- **Severity**: warning (stale cross-ref, `screen.nav_flow_skew` family)
- **Location**: `SCR002_AdminLayout/spec.md:163-165` (Exits rows), `:286` (Unresolved Questions)
- **Description**: the spec flags Profile / Dashboard / Logout as absent from screen-flow. The orchestrator-corrected `docs/generated/screen-flow.md:131-133` now lists all three (SCR002 to SCR016 / SCR019 / SCR001). The claim is now false, and the `[NEEDS_DOMAIN_CONFIRMATION]` rests on it. The code citations are correct (`account-menu.tsx:61-76`, verified).
- **Fix**: drop "(không có trong screen-flow, xem Unresolved Questions)" from the three Exits cells. Delete Unresolved bullet 1, or cut it to the one still-open question: Dashboard duplicates Overview (bullet 2).

### W2: SCR003 screen-flow citations off by 3 lines; Unresolved bullet 1 partly stale — OPEN
- **Severity**: warning (off-range citation)
- **Location**: `SCR003_AppLayout/spec.md:187-189` (Source `docs/generated/screen-flow.md:100|101|102`), `:325`
- **Description**: the three bell-row exits cite screen-flow lines 100/101/102. In the current file those lines are Dashboard / Logout / "Xem tất cả". The bell-row destinations are at `screen-flow.md:103/104/105` (verified). Bullet 1 says screen-flow lists only 2 footer links; `screen-flow.md:94-96` now say "(header hoặc footer)" for Home / Award / Kudos.
- **Fix**: cite `screen-flow.md:103`, `:104`, `:105`, or better the `§ Screen Access Paths` row names, since doc line numbers drift. Rewrite bullet 1 to only the code-comment mismatch ("four links", `app-footer.tsx:14`, verified).

### W3: SCR001 Entry Points citation points at the wrong line — OPEN
- **Severity**: warning
- **Location**: `SCR001_Login/spec.md:141`
- **Description**: the SCR010 row cites `shared/auth/public-paths.ts:35`. Line 35 is `AUTH_CALLBACK_PATH`; `LOGIN_PATH` is line 34. The sibling row at :140 (`:33-40`) is fine. Also, `screen-flow.md:88` says the countdown screen has no link to `/login`: the trigger is typing the URL. The spec's "Mở `/login`" is compatible but could say so.
- **Fix**: cite `public-paths.ts:34` (or `:33-40`). Trigger text: "Tự gõ `/login` (màn đếm ngược không có link)".

### W4: SCR001 Entry Points miss two screen-flow paths (`screen.nav_flow_skew`, advisory) — OPEN
- **Severity**: warning `[WARN_ADVISORY]`
- **Location**: `SCR001_Login/spec.md:133-141`
- **Description**: `screen-flow.md:133` (SCR002 Logout to SCR001) and `:136` (SCR005 Login CTA to SCR001) touch SCR001 but have no Entry Points row. Only SCR003 and SCR010 are listed. Code backs both: `shared/auth/sign-out-action.ts:23`, `app/not-found.tsx:12`.
- **Fix**: add rows `SCR002_AdminLayout | Menu tài khoản › Logout | Đăng xuất thành công | shared/auth/sign-out-action.ts:23` and `SCR005_Error404 | Nút Đăng nhập | Không có hồ sơ | app/not-found.tsx:12`. (SCR005 caveat: see W6.)

### W5: SCR001 §10 overstates mobile centring; `mt-auto` not in the cited range — OPEN
- **Severity**: warning (wrong behavioural claim, minor)
- **Location**: `SCR001_Login/spec.md:168` (and "canh giữa" wording in the layout sketch at :25)
- **Description**: the row says that below `md` "nội dung canh giữa", citing `page.tsx:40-46`. In `page.tsx:46` the section has no `items-center` or `text-center`; the wordmark and intro stay left-aligned. Only the form is `items-center` (`google-sign-in-form.tsx:29`). `mt-auto` is at `page.tsx:63`, outside the cited 40-46.
- **Fix**: "Nút Google canh giữa và sát đáy phần thân (`mt-auto`); wordmark và dòng giới thiệu canh trái". Source `page.tsx:46,63` + `google-sign-in-form.tsx:29`.

### W6: SCR005 lists guests as actors; its own Unresolved Questions say they normally cannot reach it — OPEN
- **Severity**: warning (internal contradiction)
- **Location**: `SCR005_Error404/spec.md:17-19` (Actors, Purpose/Exit), `:76-79`, `:102-103` vs `:213`
- **Description**: `route-access-policy.ts:35-39` redirects every non-public URL for a guest to `/login?next=`, so an unmatched URL never reaches `not-found.tsx` as a guest. The Login branch is reachable only for a session with no profile row (`shell-session.ts:28-33`), and that user is then bounced `/login` to `/` to 401 (`current-user.ts:39`). The spec states this only in Unresolved Questions, while §1, §4, §7 and the Security Surface state "khách" as fact. screen-flow and screen-list repeat the same "khách" wording, so the spec agrees with the doc but not with the code.
- **Fix**: in §1 Actors and §7 conditions, say "người có phiên nhưng không có hồ sơ (khách thông thường bị proxy chuyển `/login` trước)" and keep the `[UNVERIFIED]`. Raise the screen-flow / screen-list wording to the orchestrator for the same correction.

### W7: `screen.appendix_leak` — identifier-shaped tokens in §§1-10 — OPEN
- **Severity**: warning
- **Location**: `SCR002_AdminLayout/spec.md:131-132` (§7: `requireAdmin`, `signOutAction`); `SCR003_AppLayout/spec.md:151` (§7: `requireAdmin`); `SCR005_Error404/spec.md:78-79,89,91,102-103` (§4/§5/§7: `getShellUser()`)
- **Description**: `requireAdmin` and `getShellUser` appear verbatim as helper/guard values in each spec's Implementation Mapping, so they match the rule's shape test. They sit in reader-facing `Condition`, `Trigger` and `Notes` cells.
- **Fix**: restate as behaviour ("quyền thật do proxy và guard phía server kiểm", "khi đọc được hồ sơ người dùng", "Layout truyền hàm đăng xuất") and keep the identifier only in Implementation Mapping.

## Passed Checks

✓ reading_guide.db_impact @ SCR001..SCR005 (5/5) [deterministic-pass]
✓ reading_guide.source_walkthrough @ SCR001..SCR005 (5/5) [deterministic-pass]
✓ validate_source_citations @ SCR001..SCR005 (5/5) [deterministic-pass]
✓ ScreenSpec.header_code_in_screenlist @ SCR001_Login
✓ ScreenSpec.header_code_in_screenlist @ SCR002_AdminLayout
✓ ScreenSpec.header_code_in_screenlist @ SCR003_AppLayout
✓ ScreenSpec.header_code_in_screenlist @ SCR004_Error403
✓ ScreenSpec.header_code_in_screenlist @ SCR005_Error404
✓ ScreenSpec.required_sections @ SCR001..SCR005 (5/5)
✓ ScreenSpec.sot_pre_sot_absent @ SCR001..SCR005 (5/5)
✓ ScreenSpec.no_placeholder_text @ SCR001..SCR005 (5/5)
✓ ScreenSpec.no_business_logic_codes @ SCR001..SCR005 (5/5)
✓ screen.purpose_present_non_technical @ SCR001..SCR005 (5/5)
✓ screen.layout_sketch_missing @ SCR001..SCR005 (5/5)
✓ screen.layout_regions_missing @ SCR001..SCR005 (5/5)
✓ ScreenSpec.layout_regions_min_2_rows @ SCR001..SCR005 (5/5)
✓ screen.ui_elements_missing @ SCR001..SCR005 (5/5)
✓ ScreenSpec.ui_elements_id_sequential @ SCR001..SCR005 (5/5)
✓ ScreenSpec.ui_elements_crossref_model @ SCR002
✓ ScreenSpec.ui_elements_crossref_model @ SCR003
✓ ScreenSpec.ui_elements_action_has_available_action @ SCR001..SCR005 (5/5)
✓ screen.element_id_dangling @ SCR001..SCR005 (5/5)
✓ screen.element_id_unreferenced_conditional @ SCR001..SCR005 (5/5)
✓ ScreenSpec.user_actions_present @ SCR001..SCR005 (5/5)
✓ ScreenSpec.happy_path_within_screen @ SCR001..SCR005 (5/5)
✓ ScreenSpec.happy_path_not_mermaid @ SCR001..SCR005 (5/5)
✓ ScreenSpec.branches_na_valid @ SCR004
✓ ScreenSpec.interaction_notes_user_first @ SCR001..SCR003 (3/3)
✓ ScreenSpec.ui_states_error_row @ SCR001..SCR005 (5/5)
✓ ScreenSpec.ui_states_empty_row @ SCR001..SCR003 (3/3)
✓ ScreenSpec.no_legacy_form_validation_rules @ SCR001..SCR005 (5/5)
✓ screen.impl_mapping_missing_action @ SCR001..SCR005 (5/5)
✓ ScreenSpec.conditional_ui_auth_notes @ SCR001..SCR003 (3/3)
✓ ScreenSpec.conditional_ui_auth_notes @ SCR005
✓ ScreenSpec.conditional_ui_literals_tagged @ SCR001..SCR005 (5/5)
✓ screen.nav_invented_destination @ SCR001..SCR005 (5/5)
✓ screen.nav_flow_skew @ SCR002
✓ screen.nav_flow_skew @ SCR003
✓ screen.nav_flow_skew @ SCR004
✓ screen.nav_flow_skew @ SCR005
✓ ScreenSpec.accessibility_5_rows @ SCR001..SCR005 (5/5)
✓ screen.responsive_unevidenced @ SCR001..SCR005 (5/5)
✓ screen.expected_without_basis @ SCR001..SCR005 (5/5)
✓ screen.appendix_leak @ SCR001
✓ screen.appendix_leak @ SCR004
✓ ScreenSpec.unverified_has_description @ SCR001..SCR005 (5/5)
✓ ScreenSpec.component_variants_ok @ SCR001..SCR005 (5/5)
✓ ScreenSpec.security_surface_present_with_auth_row @ SCR001..SCR005 (5/5)
✓ ScreenSpec.security_surface_consistent_with_conditional_ui @ SCR001..SCR005 (5/5)
✓ ScreenSpec.source_references_present @ SCR001..SCR005 (5/5)
✓ ScreenSpec.source_citations_spot_check @ SCR001..SCR005 (5/5)
✓ H6.child_routes_present @ SCR002
✓ H6.child_routes_present @ SCR003
✓ H6.child_routes_scr_exist @ SCR002
✓ H6.child_routes_scr_exist @ SCR003
✓ H6.ui_states_shell_level_only @ SCR002
✓ H6.ui_states_shell_level_only @ SCR003
✓ Composite.2of3_gate_cited @ SCR003
✓ Composite.reg_independence_signal_trap1 @ SCR003/REG001_NotificationBell
✓ Composite.reg_owner_annotation_trap5 @ SCR003/REG001_NotificationBell
✓ Composite.no_signal_inferred @ SCR003
✓ Composite.h4_h5_not_applicable @ SCR001..SCR005 (5/5)
✓ Universal.artifact_exists_nonempty @ SCR001..SCR005 (5/5)
✓ Universal.reg_cross_ref_format @ SCR003
✓ Universal.content_traceable_to_source @ SCR001..SCR005 (5/5)

## Metrics

| Metric | Value |
|--------|-------|
| Screens reviewed | 5 (1 composite, 4 atomic; SCR002/SCR003 are H6 shells) |
| Source citations spot-checked | about 40 (0 fabricated, 1 wrong line: W3; 3 doc-line off-ranges: W2) |
| Behavioural claims checked against code | about 25 (1 overstated: W5; 1 actor claim contradicting own note: W6) |
| Specs with every checked `file:line` in range | 4 of 5 (SCR001 has W3) |

### Verified correct (notable)
- Domain/auth flow in SCR001: error codes, `?error` parse, callback to `/login?error=`, `hd` as UX hint only, double-submit lock, `safeNextPath`.
- SCR002/SCR004 two-layer 403: proxy 4b (`session-proxy.ts:108-110`), `requireAdmin` to `forbidden()` (`admin-guard.ts:33`), 5s fetch timeout, plain-text fallback, SSRF-safe origin (`access-denied-response.ts:26-29,40-59`).
- SCR003 401 for session-without-profile (`current-user.ts:39`) and the "four links" code-comment mismatch (`app-footer.tsx:14`) are real and well found.
- Responsive pixel values (h-22 = 88, w-107 = 428, w-166 = 664) are exact.
