---
failed: 1
warnings: 6
missing: 0
result: FAIL
---

# Screen Spec Review — Batch 02 (SS.2)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: SCR006_KudoDetail, SCR007_KudosLiveBoardFeed (composite, REG001-REG006), SCR008_AwardsSystem, SCR009_CommunityStandards, SCR010_CountdownPrelaunch (`artifacts/screens/{SCR}/spec.md`, 1362 lines total)

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 5 screen specs |
| Critical issues | 1 |
| Warnings | 6 |
| Missing (`.pending` markers) | 0 |
| Result | **FAIL** (one critical, mechanical fix) |

Structure, E## referential integrity, composite/REG rules and behaviour claims are clean. ~420 `file:line` citations were range-checked by script and ~60 sampled against code; every behavioural claim sampled was accurate. The one critical is a set of off-range citations in SCR010 that `validate_source_citations` did not catch (false negative, see C1).

---

## Critical Issues

### C1: SCR010 cites lines past EOF in two files (6 citations) — OPEN
- **Severity**: critical (fabricated/off-range source citation)
- **Location**: `SCR010_CountdownPrelaunch/spec.md:102`, `:136`, `:177`, `:205`, `:206`, `:217`
- **Description**: `features/awards-portal/countdown-parts.ts` has 31 lines but is cited as `:58-61` (:102) and `:58-77` (:177, :205, :217). `shared/auth/public-paths.ts` has 63 lines but is cited as `:110-117` (:136) and `:83-121` (:206). Real content: `remainingParts` is `countdown-parts.ts:12-21`, `msUntilNextMinuteChange` is `:27-31`; `COUNTDOWN_PATH` is `public-paths.ts:9` and `PUBLIC_PATHS` (includes `/countdown`) is `:33-44`. The behaviour claims themselves are correct (checked); only the ranges are wrong. The validator reported 0 issues for these files, so its range check missed table-cell citations here; worth a look by the orchestrator.
- **Fix**:
  - `:102` `countdown-parts.ts:58-61` → `countdown-parts.ts:12-21`
  - `:177` `countdown-parts.ts:58-77` → `countdown-parts.ts:12-31`
  - `:205` `countdown-parts.ts:58-77` → `countdown-parts.ts:5-31`
  - `:217` `countdown-parts.ts:58-77` → `countdown-parts.ts:12-31`
  - `:136` `public-paths.ts:110-117` → `public-paths.ts:33-44`
  - `:206` `public-paths.ts:83-121` → `public-paths.ts:9-44`

---

## Warnings

### W1: Stale `docs/generated/screen-flow.md:NN` line citations (18 cites) — OPEN
- **Severity**: warning
- **Location**: `SCR006/spec.md:175-178`; `SCR007/spec.md:218-225`, `:365`; `SCR008/spec.md:140-141`; `SCR009/spec.md:116`, `:118`; `SCR010/spec.md:144`
- **Description**: the line numbers match the draft `artifacts/screen-flow.md`, not the promoted `docs/generated/screen-flow.md` (shifted +3..+5 after the orchestrator edit). Each now lands on an unrelated row (e.g. SCR010 `:85` is the SCR001→START row). Same defect as batch-01 W2/W3 and batch-03 W1.
- **Fix** (spec cite → current docs line): SCR006 `:113→117`, `:115→120`, `:117→122`, `:100→103`; SCR007 `:93→96`, `:87→90`, `:88→91`, `:89→92`, `:110→114`, `:114→119`, `:101→104`, `:118→123`; SCR008 `:92→95`, `:86→89`; SCR009 `:95→98`, `:120→125`; SCR010 `:85→88`. Better: cite the `§ Screen Access Paths` row name, since line numbers drift again on the next regenerate.

### W2: SCR006 Entry Points claim a spam-owner path from the Live board that code and SCR007 deny — OPEN
- **Severity**: warning
- **Location**: `SCR006_KudoDetail/spec.md:173-174` (REG003, REG005 rows, Condition "Kudo công khai, hoặc spam của chính chủ")
- **Description**: `kudo-card.tsx:24-28` ("the Live board never lists spam") and `SCR007/spec.md:138` say the Live board never shows spam, so no "Xem chi tiết" click from SCR007 reaches SCR006 with a spam Kudo. The condition was copied from `screen-flow.md:106-107`, which carries the same over-claim.
- **Fix**: Condition → "Kudo công khai". Spam-owner reach is from SCR016 "Đã gửi" (spec :176, Condition `—` → "kể cả Kudo spam của chính chủ"). Optionally fix the two screen-flow rows in the promoted doc.

### W3: SCR007 §4 leaves the screen toward login but §8 Exits has no row; E02 attributed for a link that lives inside the composer — OPEN
- **Severity**: warning (`screen.nav_flow_skew`, `[WARN_ADVISORY]`)
- **Location**: `SCR007_KudosLiveBoardFeed/spec.md:115` vs `:229-237`; `:237`
- **Description**: (a) Available Actions row E21 "đăng nhập lại" navigates to `/login?next=/kudos` (`kudo-feed-status-message.tsx:35-38`) but there is no Exits row to SCR001_Login (screen-flow has none either). (b) Exits row `:237` (composer toolbar link to SCR009) names Element E02, but E02 is the launcher button; the link is `kudo-message-toolbar.tsx:52-60` inside the modal (REG001 internals, not a §3 element).
- **Fix**: add Exits row `Đăng nhập lại | E21 | Phiên hết hạn (401) | SCR001_Login | redirect | features/kudos-feed/components/kudo-feed-status-message.tsx:35-38`; in `:237` set Element to `—` (composer modal, REG001) or add a note.

### W4: SCR007 Unresolved Question 3 is now false — OPEN
- **Severity**: warning
- **Location**: `SCR007_KudosLiveBoardFeed/spec.md:365`
- **Description**: says `screen-flow.md` has no dedicated REG003 row for Highlight card → profile. The promoted doc now has it at `docs/generated/screen-flow.md:112` (added by the orchestrator), and the spec Exits already cover the path (`:236`). An open question that is already answered misleads the reader.
- **Fix**: delete Q3 (renumber Q4).

### W5: Entry Points list only "header" for footer-reachable links — OPEN
- **Severity**: warning (`screen.nav_flow_skew`, advisory; code-verified)
- **Location**: `SCR007/spec.md:218` ("mục Sun* Kudos ở header"); `SCR008/spec.md:140` ("mục Thông tin giải ở header")
- **Description**: `app-footer.tsx:27-31` links home, awards, kudos, rules and standards, and `docs/generated/screen-flow.md:95-96` says "(header hoặc footer)". The footer path is missing from both rows.
- **Fix**: Trigger → "Bấm mục Sun* Kudos ở header hoặc footer" / "Bấm mục Award Information ở header hoặc footer".

### W6: `screen.appendix_leak` — `notFound()` in §4 Branches — OPEN
- **Severity**: warning
- **Location**: `SCR006_KudoDetail/spec.md:107`
- **Description**: "không gọi `notFound()`" is a framework call that also appears as a helper value in Implementation Mapping (`:223`). Scan of the other four specs found no hits (the pervasive `LAUNCH_AT` is a business config name, not flagged).
- **Fix**: "không chuyển sang trang 404".

---

## Validator Notes (not counted)

- **D3 blockquote** ("D3 — the DRY statement that MUST appear verbatim in the template and the contract") is emitted verbatim in § 8 of all five specs (and SCR001-SCR020). It is kit template text (`screen-spec-template.md:174`), a meta-instruction for authors visible to BA/PO readers. Kit-level, not a per-spec defect; same treatment as earlier batches.
- **Unfilled-claims honesty**: SCR006 §6 "server chặn lại các điều kiện trên" and `KUDO_UNAVAILABLE` are declared unverified in Unresolved Q2; acceptable.
- **PII**: SCR009 Unresolved Q1 flags the personal Slack handle without reproducing it; good.
- `validate_source_citations` marked [deterministic-pass] but missed C1 (see C1).

## Edge Cases Turned Up
- Composite SCR007: all 6 REGs carry independence signals and owner F-codes in screen-list (REG001 F003, REG002/003/005 F004, REG004 F008, REG006 F010); H1∧H2 gate stated; no tab/stepper content; no `[SIGNAL_INFERRED]`; spec region text matches (R2-R6 ↔ REG001-006). Trap 1-6 clear.
- Atomic screens SCR008/009/010 correctly atomic (single feature slice, no independent endpoints).
- §3 Conditional rows all have §7 coverage (SCR006 E01/02/10/11/13-16, SCR007 E03/08-11/17/20-21/23); no dangling E##.

## Done Well
- Behaviour claims precise and code-true (soft-404 caveat, spam overlay `tabbable` handling, optimistic heart lock, cursor-400 reset, server-clock offset, prelaunch gate decision table).
- Honest Unresolved Questions (copy-paste duplicate award `short` text verified: `messages/vi.json:470,476,482`).
- Responsive and a11y rows carry per-row source citations; no `[EXPECTED]` misuse.

---

## Passed Checks

✓ ScreenSpec.required_sections @ SCR006..SCR010 (5/5)
✓ reading_guide.db_impact @ SCR006..SCR010 (5/5) [deterministic-pass]
✓ screen.header_code_in_screenlist @ SCR006..SCR010 (5/5)
✓ screen.feature_backlink_matches_featurelist @ SCR006..SCR010 (5/5)
✓ screen.source_citations @ SCR006
✓ screen.source_citations @ SCR007
✓ screen.source_citations @ SCR008
✓ screen.source_citations @ SCR009
✓ screen.purpose_present_non_technical @ SCR006..SCR010 (5/5)
✓ screen.layout_sketch_missing @ SCR006..SCR010 (5/5)
✓ screen.layout_regions_missing @ SCR006..SCR010 (5/5)
✓ screen.layout_regions_min_rows @ SCR006..SCR010 (5/5)
✓ screen.ui_elements_missing @ SCR006..SCR010 (5/5)
✓ screen.ui_elements_id_sequence @ SCR006..SCR010 (5/5)
✓ screen.ui_elements_crossref_model_exists @ SCR006..SCR010 (5/5)
✓ screen.ui_elements_action_has_available_action @ SCR006..SCR010 (5/5)
✓ screen.element_id_dangling @ SCR006..SCR010 (5/5)
✓ screen.element_id_unreferenced_conditional @ SCR006..SCR010 (5/5)
✓ screen.user_actions_present @ SCR006..SCR010 (5/5)
✓ screen.happy_path_within_screen @ SCR006..SCR010 (5/5)
✓ screen.interaction_notes_user_first @ SCR006..SCR010 (5/5)
✓ screen.ui_states_error_row @ SCR006..SCR010 (5/5)
✓ screen.ui_states_empty_row @ SCR006..SCR010 (5/5)
✓ screen.legacy_form_validation_heading_absent @ SCR006..SCR010 (5/5)
✓ screen.impl_mapping_missing_action @ SCR006..SCR010 (5/5)
✓ screen.validation_client_side @ SCR006..SCR010 (5/5)
✓ screen.conditional_ui_auth_notes @ SCR006..SCR010 (5/5)
✓ screen.conditional_ui_literals_tagged @ SCR006..SCR010 (5/5)
✓ screen.conditional_ui_condition_user_visible @ SCR006..SCR010 (5/5)
✓ screen.nav_invented_destination @ SCR006..SCR010 (5/5)
✓ screen.nav_flow_skew @ SCR006
✓ screen.nav_flow_skew @ SCR009
✓ screen.nav_flow_skew @ SCR010
✓ screen.accessibility_5_rows @ SCR006..SCR010 (5/5)
✓ screen.responsive_unevidenced @ SCR006..SCR010 (5/5)
✓ screen.expected_without_basis @ SCR006..SCR010 (5/5)
✓ screen.appendix_leak @ SCR007..SCR010 (4/4)
✓ screen.unverified_has_description @ SCR006..SCR010 (5/5)
✓ screen.component_variants_not_unnecessary @ SCR006..SCR010 (5/5)
✓ screen.security_surface_present @ SCR006..SCR010 (5/5)
✓ screen.source_references_present @ SCR006..SCR010 (5/5)
✓ screen.not_read_has_unresolved_question @ SCR006..SCR010 (5/5)
✓ screen.no_business_logic_codes @ SCR006..SCR010 (5/5)
✓ screen.h6_shell_n/a @ SCR006..SCR010 (5/5)
✓ screen.twin_create_edit_n/a @ SCR006..SCR010 (5/5)
✓ screen.sot_pre_sot_absent @ SCR006..SCR010 (5/5)
✓ composite.h4_tab_shortcircuit_n/a @ SCR007
✓ composite.h5_wizard_n/a @ SCR007
✓ composite.h3_excludes_h4_h5 @ SCR007
✓ composite.h2_module_count @ SCR007
✓ composite.two_of_three_gate @ SCR007
✓ composite.featurelist_composite_ref_tokenizer @ SCR007
✓ composite.partial_screen_ownership @ SCR007
✓ composite.signal_inferred_absent @ SCR007
✓ trap1.reg_independence_signal @ SCR007 (6/6)
✓ trap2.tab_stepper_misclassification @ SCR007
✓ trap5.reg_owner_annotation @ SCR007 (6/6)

---

## Metrics

| Metric | Value |
|--------|-------|
| Screen specs | 5 (1 composite, 4 atomic) |
| Screen spec lines | 1362 |
| Citations range-checked | ~420 (1 file group failing: SCR010, 6 cites) |
| Citations content-sampled | ~60 (0 wrong behaviour) |
| Composite regions | 6 (all with independence signal + owner) |
