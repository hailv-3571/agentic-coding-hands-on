---
failed: 0
warnings: 0
missing: 0
result: PASS
---

# Review Report — Feature Specs pass 2, re-review after fix cycle 1 (WaveFS6)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: F001, F002, F003, F004, F005, F007, F009, F011 (16 files). Only the issues C1-C8 and W1-W7 from the previous report were re-verified, plus every new or extended SC line against code and `tests/`. Core artifacts and other features skipped.

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 0 core + 8 feature specs |
| Critical issues (still OPEN + new) | 0 |
| Warnings (carried + new) | 2 (W4 carried, W8 new) |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

The mechanical FR to SC set difference is empty for all 8 [deterministic-pass, orchestrator]. Every new or extended SC line was read against code; behavioural claims hold and every cited test file exists (F004 cites bare file names; all resolve under `tests/`). No new false claim found. Where a behaviour has no automated test, F001 (SC-005, SC-012, SC-013), F002 (SC-010) and F011 (SC-006) say so explicitly and give a manual check, which is the right pattern.

---

## Critical Issues

### C1: F001 — 7 FRs without SC back-ref — FIXED
- SC-001 now covers FR-202; new SC-011 (FR-003, BR-008), SC-012 (FR-203, FR-204), SC-013 (FR-605); SC-002 covers FR-404; SC-005 covers FR-301.
- Verified: test `follows an auth email change into the profile and frees the old address` exists (`tests/integration/auth/auth-user-triggers.test.ts:168`) and asserts exactly the SC-011 claim. `google-sign-in-button.tsx:22-43` has `disabled={pending}`, `aria-busy`, spinner. `department-options-query.ts:10-16` orders by `sortOrder`, `code`; locale picks `nameEn`/`nameVi`. `require-api-sunner.ts:12-18` gives 401 `UNAUTHENTICATED` and 403 `ONBOARDING_REQUIRED`. `app/auth/callback/route.ts:31-36` signs out locally on `ok:false` and on throw. `complete-login.ts:40,49` returns `ok:false` for out-of-domain email and missing profile. `login-error-codes.test.ts` and `guest-redirect-and-logout.spec.ts:33-35` cover the generic `auth_failed` banner.

### C2: F002 — FR-105 — FIXED
- New SC-010 covers FR-105. Verified `app/(app)/layout.tsx:22-24` passes `bellSlot={<NotificationBellSlot/>}` and wraps children in `KudoComposerToastHost`; `app/admin/layout.tsx` renders `AdminTopBar` with no `bellSlot` (prop optional, `admin-top-bar.tsx:15,45`). Cited e2e (`notifications.spec.ts:36-44`, `compose-kudo.spec.ts:52`) exist and match; the Admin "no bell" gap is declared as untested.

### C3: F003 — 13 FRs — FIXED
- SC-002 extended (FR-202/203/205/208/401), SC-009 (FR-103), SC-012 (FR-204), new SC-014..SC-017.
- Verified: launcher `disabled={!writingOpen}` with `WRITING_CLOSED` text (`kudo-composer-launcher.tsx:32-42`); recipient `readOnly` (`recipient-picker.tsx:33`, `edit-kudo.spec.ts:37`); hashtag rows `aria-disabled` (`hashtag-picker.tsx:116`); messages "Bỏ nội dung đang soạn?", "Tiếp tục soạn", "Đã gửi Kudo thành công!", "Đã lưu thay đổi." in `messages/vi.json:170-180`; toolbar link `target="_blank"` (`kudo-message-toolbar.tsx:54`); `router.refresh()` in `use-kudo-composer-submit.ts:51`; all cited e2e/unit files exist. See W8 for test attribution.

### C4: F004 — 11 FRs — FIXED
- SC-001 (FR-313), SC-002 (FR-304), SC-005 (FR-102), new SC-012..SC-015.
- Verified: `isSpam` branches in `kudo-card.tsx:47-75` and `kudo-detail-view.tsx:28-47`; spam e2e `kudo-card-and-detail.spec.ts:166-182`; `AbortController` in `all-kudos-feed.tsx` / `use-highlight-kudos.ts`; cursor 400 resets to first page (`all-kudos-feed.tsx:66-70`); messages `empty` / `loadFailed` in `vi.json:262-264`; `useSunnerSearch` `debounceMs = 250`, `excludeSelf={false}` (`sunner-profile-search.tsx:40`), route default `limit` 10 (`app/api/sunners/search/route.ts:8`); `format-kudo-card-time.ts` gives `HH:mm - MM/DD/YYYY`; `app/(app)/kudos/page.tsx:47-60,95` has `Promise.all`, `SunnerProfileSearch` inside the same `LiveBoardContent`, `LiveBoardSkeleton` as Suspense fallback.

### C5: F005 — 7 FRs — FIXED
- SC-001 (FR-403), SC-002 (FR-101), new SC-006..SC-008.
- Verified: `kudo-heart-actions.test.ts:87-93` (spam, unknown, malformed id all `KUDO_UNAVAILABLE`, no rows), `:158-159` (remove with bad id), `:129` (guest to `/login`), `:72-75` (raw count and `heartedByMe` only); `kudo-heart-button.tsx:32,55-61` (locked ref, `UNEXPECTED`); `heart-toggle.spec.ts:113` (revert with reason); `heart-summary-store.test.ts` exists.

### C6: F007 — FR-101, FR-202 — FIXED
- New SC-013, SC-014. Verified `review-table-row.tsx:62-63` (`uppercase` title only when present, `message || "—"`, `line-clamp-4`), `admin-kudo-row-select.ts:97` (`shortId = id.slice(0, 8)`), `loading.tsx` uses `ReviewContentSkeleton`, `admin-top-bar.tsx:23` Review link, `kudo-message-plain-text.test.ts` has the 5 cases cited.

### C7: F009 — 10 FRs — FIXED
- SC-006 extended; new SC-007..SC-010. Verified: `distinctSenderCountSubquery` / `tierCountRange` used by `admin-users/server/user-admin-sql-fragments.ts:4,48,82-83`; `hero-tier-query.ts:1` `import "server-only"`; `hero-badge.tsx:29` `if (!tier) return null`; sizes `card`/`tooltip`/`rules`/`hoverCard` used at the four call sites; tooltip opens on `onPointerEnter`, `onFocus`, `onClick` (`hero-badge-tooltip.tsx:92-106`); panel clamps 16 px from edges (`place-hero-tooltip.ts:2,15`); panel "Nothing in it is focusable" (`hero-badge-tooltip-panel.tsx:24`).

### C8: F011 — 21 FRs — FIXED
- SC-004/SC-005 extended; new SC-006..SC-009. Verified: `campaign-admin-query.ts:21` `desc(startsAt), desc(id)`; `campaign-table.tsx` (four columns, `truncate` + `title`, empty row, "⋯" only `phase !== "ended"`); `CAMPAIGN_MIN_YEAR = 2000`; `startLocked` (`campaign-form-modal.tsx:55-62`, `campaign-admin-actions.test.ts:109`); `ENDED` / `NOT_FOUND` tests `:114-124`; `failed: "Không xoá được, vui lòng thử lại"`, `submitEdit: "Save Campaign"` in `vi.json`; toast `durationMs = 5000`; RLS on + `REVOKE ALL` (`db/migrations/0011`, `0012`) asserted by `hearts-and-campaigns-migrations.test.ts:32-41`; `findActive` boundary test in `campaign-admin-query.test.ts`. SC-006 declares empty/error/skeleton as untested.

---

## Warnings

### W1: F003 broken `../../docs/` links — FIXED
- `grep '../../docs/'` over the 8 technical specs is empty; § 5.5 Screens row now `./functional-spec.md#6-screens` (`F003 technical-spec.md:879`).

### W2: F004 English template trailer — FIXED
- BARE line and the English "Orphan refs" line are gone. Note: no Vietnamese `**Rule:**` line replaced it (file ends at the User Stories row); optional, not a defect.

### W3: F005 truncated changelog item § 5.3 — FIXED
- § 5.3 now holds two closed unresolved questions (`F005 technical-spec.md:496-497`).

### W4: Region-token format inconsistent — OPEN (carried, not blocking)
- **Location**: `F003 technical-spec.md` (8 hits) and `functional-spec.md` (3 hits), `F004 functional-spec.md` (7 hits) write `SCR007/REG00N_Name`; `F004 technical-spec.md`, `F005` and `docs/generated/feature-list.md:157,207-210` write `SCR007_KudosLiveBoardFeed/REG00N_Name`. Validator accepts both.
- **Fix**: normalise F003 and F004 functional-spec to the `feature-list.md` form.

### W5: F007 content search matches raw Markdown — FIXED
- Documented in `F007 technical-spec.md:306` and `functional-spec.md:255`; matches `admin-kudo-where-builder.ts:19-22`. The optional RISK-08 row was not added; edge row suffices.

### W6: F007 uppercase / missing-title dash — FIXED
- FR-202 (`functional-spec.md:63`) says "viết hoa (chỉ kiểu hiển thị)"; edge row `:260` says no title means no title line, dash only for empty hashtags or message; both match `review-table-row.tsx:62-63`.

### W7: F009 English template trailer — FIXED
- `F009 technical-spec.md:424` is now the Vietnamese `**Rule:**` line.

### W8: Test attribution overstates coverage in four new SC lines — OPEN (new, warning)
- **Location**: `F004 technical-spec.md:540` (SC-013), `F003 technical-spec.md:762` (SC-014), `:765` (SC-017).
- **Description**: The behaviours are true in code, but the cited e2e files do not exercise all of them and, unlike F001/F002/F011, the lines do not say so. SC-013: no test under `tests/` contains "Chưa có Kudo nào phù hợp" or "Không tải được Kudos"; per-region error, abort and cursor-400 reset have no test (`live-board-keyboard-and-states.spec.ts` covers only the 401 sign-in link). SC-014: nothing asserts the launcher is disabled from `EVENT_END_AT`. SC-017: nothing asserts the toolbar link opens in a new tab.
- **Fix**: append the same sentence pattern used elsewhere, e.g. "trạng thái rỗng, lỗi theo vùng, huỷ request và cursor 400 chưa có test tự động, cần kiểm thủ công"; same for the closed launcher and the new-tab link.

---

## Passed Checks

✓ FR_to_SC_coverage [deterministic-pass] @ F001_Auth..F011_AdminCampaigns (8/8)
✓ validate_source_citations [deterministic-pass] @ F001_Auth..F011_AdminCampaigns (8/8)
✓ feature_api_link [deterministic-pass] @ F001_Auth..F011_AdminCampaigns (8/8)
✓ feature_screen_link [deterministic-pass] @ F001_Auth..F011_AdminCampaigns (8/8)
✓ reading_guide_db_impact [deterministic-pass] @ F001_Auth..F011_AdminCampaigns (8/8)
✓ new_sc_behaviour_matches_code @ F001_Auth..F011_AdminCampaigns (8/8)
✓ new_sc_cited_test_files_exist @ F001_Auth..F011_AdminCampaigns (8/8)
✓ new_sc_cited_test_case_names_exist (F001 SC-011, F005 SC-006/008, F011 SC-008) @ F001_Auth
✓ new_sc_cited_test_case_names_exist (F001 SC-011, F005 SC-006/008, F011 SC-008) @ F005_KudosHearts
✓ new_sc_cited_test_case_names_exist (F001 SC-011, F005 SC-006/008, F011 SC-008) @ F011_AdminCampaigns
✓ untested_behaviour_declared_in_sc @ F001_Auth
✓ untested_behaviour_declared_in_sc @ F002_AppShell
✓ untested_behaviour_declared_in_sc @ F011_AdminCampaigns
✓ links_resolve_post_promotion @ F001_Auth..F011_AdminCampaigns (8/8)
✓ template_residue_clean @ F001_Auth..F011_AdminCampaigns (8/8)
✓ pending_marker_absent @ F001_Auth..F011_AdminCampaigns (8/8)
✓ language_directive_vi_prose @ F001_Auth..F011_AdminCampaigns (8/8)

---

## Metrics

| Metric | Value |
|--------|-------|
| Feature Specs re-verified | 8 |
| Prior criticals C1-C8 | 8 FIXED, 0 OPEN |
| Prior warnings W1-W7 | 6 FIXED, 1 OPEN (W4) |
| New SC lines spot-checked against code | 29 (F001 3, F002 1, F003 4, F004 4, F005 3, F007 2, F009 4, F011 4, plus extended lines) |
| New criticals | 0 |
| New warnings | 1 (W8) |

## Validator Notes (not counted)
F001 `state_rung_missing` A6/A11 and F003 `alg_file_schema_missing` ALG-002/003: heuristic false positives, accepted (unchanged).

## Orchestrator follow-up (post cycle-1)
- W4 FIXED: all `SCR007/REG###` tokens in F003 (both files) and F004 functional-spec normalized to `SCR007_KudosLiveBoardFeed/REG###_Name`.
- W8 FIXED: F004 SC-013, F003 SC-014, F003 SC-017 now state which part has no automated test ("chưa có test tự động, cần kiểm thủ công").
