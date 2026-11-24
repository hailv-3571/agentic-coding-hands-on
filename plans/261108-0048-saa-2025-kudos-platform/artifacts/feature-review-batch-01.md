---
failed: 5
warnings: 4
missing: 0
result: FAIL
---

# Review Report — Rebuild-Spec Feature Specs, batch-01 (WaveFS5)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: 5 feature specs (F001_Auth, F002_AppShell, F003_KudosAuthoring, F004_KudosFeed, F005_KudosHearts), functional-spec + technical-spec each. Core artifacts skipped.

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 0 core + 5 feature specs |
| Critical issues | 5 (one per feature, grouping 39 uncovered FR ids) |
| Warnings | 4 (validator-origin notes listed separately, not counted) |
| Missing (`.pending` markers) | 0 (`ls features/*/.pending` empty for F001..F005) |
| Result | **FAIL** |

Only defect class found at critical level: FR to SC coverage (`verification-checklist-feature-spec.md:172`, reviewer-only rule, no validator). Computed mechanically: FR ids from `functional-spec.md § 4` minus the union of `(covers ...)` on `- **SC-###**` lines of `technical-spec.md § 5.1`. No FR id is hidden elsewhere in § 5.1 either (US blocks carry no FR ids).

| Feature | FRs in § 4 | SCs | Uncovered FRs |
|---|---|---|---|
| F001 | 21 | 10 | 7 |
| F002 | 21 | 9 | 1 |
| F003 | 31 | 13 | 13 |
| F004 | 27 | 11 | 11 |
| F005 | 16 | 5 | 7 |

Code citations: ~60 sampled ranges across F001..F005 against source; all accurate (no fabricated or drifted citations). All cited `tests/**` files exist. ROUTE/US/BL cross-refs match `docs/generated/feature-list.md` (ROUTE018 = F003, F004, F007 consistent with F004 A10). No `.pending`.

---

## Critical Issues

### C1: F001 — 7 FRs have no SC back-ref — OPEN
- **Severity**: critical
- **Location**: `F001_Auth/technical-spec.md:620-629` (§ 5.1)
- **Uncovered**: FR-003, FR-202, FR-203, FR-204, FR-301, FR-404, FR-605
- **Description**: Every one is implemented and cited in § 3 (A6, A3, A2, A7, A0) but nothing in § 5.1 verifies it. FR-404 (close half-open session on failed completion) is only in the US016 scenario text, with no `(covers)`.
- **Fix** (append to existing SC or add; test names suggested, existing coverage: `auth-user-triggers.test.ts` already references the email-sync trigger):
  - SC-001: add `FR-202` to covers (hook 403 gives `domain_not_allowed` banner).
  - New SC-011 *(A6)* email change in Auth copies lower-cased email into `profiles.email`; later sign-up with the old address succeeds (covers FR-003, BR-008).
  - New SC-012 *(A2, A3)* cancel at Google or failed code exchange returns `/login?error=auth_failed` with generic banner; second click while `pending` starts no second flow (covers FR-203, FR-204).
  - SC-005: add `FR-301` or new SC *(A7)* picker lists seeded departments ordered by `sort_order`, `code`, name by locale.
  - SC-002: add `FR-404` (`completeLogin` `ok:false` or throw leads to `signOut({scope:"local"})` before redirect, `app/auth/callback/route.ts:31-38`).
  - New SC-013 *(A0)* guest or no-department caller of page, action and route handler is refused (redirect / 401 / 403 `ONBOARDING_REQUIRED`) without relying on the proxy (covers FR-605).

### C2: F002 — FR-105 has no SC back-ref — OPEN
- **Severity**: critical
- **Location**: `F002_AppShell/technical-spec.md:422-430` (§ 5.1)
- **Uncovered**: FR-105
- **Description**: Bell slot in the Sunner header and the Kudo toast host on every `(app)` page (A1) are specified in § 3.1 and § 4.5-style notes but never verified; admin frame "no bell" is in SC-007 without FR-105.
- **Fix**: new SC-010 *(A1)* Sunner frame renders `NotificationBellSlot` in `HeaderActions` and wraps content in `KudoComposerToastHost` so the "sent/saved" toast survives refresh; Admin frame passes no `bellSlot` (covers FR-105, FR-304).

### C3: F003 — 13 FRs have no SC back-ref — OPEN
- **Severity**: critical
- **Location**: `F003_KudosAuthoring/technical-spec.md:749-761` (§ 5.1)
- **Uncovered**: FR-101, FR-102, FR-103, FR-202, FR-203, FR-204, FR-205, FR-206, FR-208, FR-209, FR-401, FR-403, FR-404
- **Description**: SC-001..SC-013 verify server rules (BR-*) well but the form/launcher half of CAP-01 and CAP-03 entry has no verification line. FR-202/203/205/208 are covered in substance by SC-002 (BR-006/005/009) but the FR ids are not back-referenced.
- **Fix**:
  - SC-002: add `FR-202, FR-203, FR-205, FR-208` to covers (title ≤50, body 1..1000, http(s) only, nickname rule).
  - SC-002 / SC-008: add `FR-401` (missing Người nhận / Lời nhắn / Hashtag blocked client-side and re-checked server-side; DEC-005 order).
  - SC-009: add `FR-103` (pen opens edit mode with prefill).
  - SC-012: add `FR-204` (ALG-004 `@` query recognition, `insertMention` token, 1,000 cap).
  - New SC-014 *(A3)* launcher opens modal from Live board, locks with end-of-event text when window closed, and opens with recipient locked and read-only when launched from a profile or card (covers FR-101, FR-102, DEC-001, DEC-003).
  - New SC-015 *(A3)* hashtag picker locks unselected options at 5 and releases on chip removal (covers FR-206, DEC-002).
  - New SC-016 *(A3, A7)* Cancel/Esc on a dirty form asks confirmation with "Tiếp tục soạn" default, backdrop click and in-flight close do nothing (covers FR-403, DEC-006).
  - New SC-017 *(A3, A7)* success closes the dialog, shows "Đã gửi Kudo thành công!" / "Đã lưu thay đổi." and refreshes the feed (covers FR-404); toolbar "Tiêu chuẩn cộng đồng" link opens in a new tab and keeps the draft (covers FR-209).

### C4: F004 — 11 FRs have no SC back-ref — OPEN
- **Severity**: critical
- **Location**: `F004_KudosFeed/technical-spec.md:528-538` (§ 5.1)
- **Uncovered**: FR-002, FR-101, FR-102, FR-303, FR-304, FR-311, FR-313, FR-321, FR-401, FR-402, FR-405
- **Description**: SC set covers access, masking, ranking, paging, caching and carousel. Feature has 5 capabilities but no SC for the search box (CAP-05), spam read-only detail (FR-313), card/detail field content, filter refetch/abort (FR-401), empty/error regions (FR-402, FR-405), read-only guarantee (FR-002) or page assembly (FR-101).
- **Fix**:
  - SC-002: add `FR-304` (anonymous card variant: default avatar + nickname, no profile link/department/badge).
  - SC-001: add `FR-313` or new SC *(A7)* spam-own detail renders Spam tag + overlay, no heart / Copy Link, image not clickable, only "Đóng" (covers FR-313, DEC-004, DEC-005).
  - SC-005: add `FR-102` (Xem chi tiết and copied link reach `/kudos/{id}`; Đóng returns to Live board).
  - New SC-012 *(A5, A7)* card shows sender, recipient (avatar, name, dept code, Hero tier), VN-time stamp, truncated body in feed vs full body on detail (covers FR-303, FR-311).
  - New SC-013 *(A3)* both filters AND, each change aborts the previous request and resets to card 1; empty result shows "Chưa có Kudo nào phù hợp." with filters usable; region error shows retry only for that region, 401 shows re-login, 400 cursor resets list (covers FR-401, FR-402, FR-405, DEC-002, DEC-003).
  - New SC-014 *(A10)* debounce 250 ms, ≤50 chars, ≤10 results, self not excluded, selection opens profile (covers FR-321, DEC-007).
  - SC-006 or new SC *(A0, A1)* feature has no write path and the Live board renders search + Highlight + ALL KUDOS on first paint (covers FR-002, FR-101).

### C5: F005 — 7 FRs have no SC back-ref — OPEN
- **Severity**: critical
- **Location**: `F005_KudosHearts/technical-spec.md:458-462` (§ 5.1)
- **Uncovered**: FR-101, FR-202, FR-401, FR-403, FR-404, FR-601, FR-602
- **Description**: SC-001..SC-005 verify the write path and numbers. Client behaviour (optimistic revert, double-click lock, shared summary across card copies), id rejection, auth gate and the no-leak response are specified in § 3/§ 4.4 but not verified.
- **Fix**:
  - SC-001: add `FR-403` (button locked until server replies, 20 clicks give one row).
  - SC-002: add `FR-101` (button present on every card in Highlight, All Kudos, detail, profile; absent on own spam card, DEC-003).
  - New SC-006 *(A1, A2)* bad uuid, unknown id or non-public Kudo returns `KUDO_UNAVAILABLE` without touching hearts (covers FR-404).
  - New SC-007 *(A3)* optimistic +1 reverts with reason toast on `ok:false` or thrown action; same Kudo's other card copy shows the confirmed summary (covers FR-401, FR-202).
  - New SC-008 *(A0)* guest is redirected to `/login`; response body carries only `heartCount` and `heartedByMe`, never who hearted or the real sender of an anonymous Kudo (covers FR-601, FR-602).

---

## Warnings

### W1: F003 — broken post-promotion links (`../../docs/...`) — OPEN
- **Severity**: warning
- **Location**: `F003_KudosAuthoring/technical-spec.md:741-743, 870-876`
- **Description**: "Client behavior" block and § 5.5 table use `../../docs/generated/...`, `../../docs/system/...`, `../../docs/features/F003_KudosAuthoring/functional-spec.md#6-screens`. Spec is promoted to `docs/features/<slug>/`, so only `../../generated/...`, `../../system/...` and `./functional-spec.md` resolve (F001, F002, F004, F005 use the correct form; template conflict noted in project memory).
- **Fix**: replace `../../docs/generated/` with `../../generated/`, `../../docs/system/` with `../../system/`, and the Screens row target with `./functional-spec.md#6-screens`.

### W2: F004 — English template residue in § 5.5 — OPEN
- **Severity**: warning
- **Location**: `F004_KudosFeed/technical-spec.md:662, 664`
- **Description**: line 662 `**Codes are written BARE — no braces.**` and line 664 `**Rule:** Every code listed in Codes Used MUST exist ... Orphan refs = reviewer critical.` are unlocalized template trailers; the other four specs carry the Vietnamese `**Rule:**` form and no BARE line. Mixed-language, and "Orphan refs = reviewer critical" is reviewer instruction leaking into a deliverable.
- **Fix**: delete line 662; replace line 664 with `**Rule:** Mọi mã trong Codes Used phải tồn tại trong artifact nguồn. ROUTE### ở hàng API Map là cầu tới cột Code của route-list.md; ROUTE018 là route dùng chung của F003, F004, F007.`

### W3: F005 — § 5.3 item 3 is changelog prose, truncated mid-list — OPEN
- **Severity**: warning
- **Location**: `F005_KudosHearts/technical-spec.md:498`
- **Description**: Not an unresolved question: it narrates drift from a "previously published spec" (a)-(d) and ends with a dangling `;` after (d), so further items were cut. Also names the old-style region token `SCR007/REG003` in prose (see W4). Reader of the promoted doc has no "previous spec".
- **Fix**: delete item 3 (history lives in git and the orchestrator log) or rewrite as a closed sentence; if kept, finish (d) with a period.

### W4: Region-token format differs across the batch and from the canonical list — OPEN
- **Severity**: warning
- **Location**: `F003_KudosAuthoring/technical-spec.md:64` (and § 2/§ 3 headers), `F003_KudosAuthoring/functional-spec.md:16,40`, `F004_KudosFeed/technical-spec.md:60-93`, `F004_KudosFeed/functional-spec.md` § 2/§ 6; vs `F005_KudosHearts/technical-spec.md:61`
- **Description**: F003/F004 write `SCR007/REG001_KudoComposer`, `SCR007/REG003_HighlightKudos`; F005 and `docs/generated/feature-list.md:157,207-210` write `SCR007_KudosLiveBoardFeed/REG003_HighlightKudos`. The validator (`feature_screen_link`) accepts both, but grep/join across features misses one spelling.
- **Fix**: pick the `feature-list.md` form (`SCR007_KudosLiveBoardFeed/REG00N_Name`) and normalize F003/F004; or record the composite short form as canonical in `code-formats.md` and normalize F005 and the feature list. Not blocking.

### Validator notes (not counted in `warnings`)
- `FeatureSpec.state_rung_missing` @ `F001_Auth/technical-spec.md:234` (A6) and `:366` (A11): heuristic, document-level (feature has SM-001/SM-002 and the action Writes non-`—`). A6 only mirrors email into `profiles.email`, A11 only upserts reference tables; neither moves an SM-001/SM-002 edge (`db/migrations/0005_auth_user_triggers.sql:72-78`, `db/seeds/apply-all-seeds.ts:20-26`). A stub State rung would trip `rung_empty_rendered` (critical). Accept; Writes cells are correct.
- `FeatureSpec.alg_file_schema_missing` @ `F003_KudosAuthoring/technical-spec.md:637` (ALG-002) and `:657` (ALG-003): path-token false positive ("upload" in `kudo-image-upload-service.ts`). Both are ticket-ledger/claim logic over `kudo_image_uploads` rows; file bytes move browser to Storage via INT-001 (`kudo-image-upload-service.ts:19-32`). Author's "no file exchange" is right. Accept.

---

## Edge cases and behaviour checked against code (no defect)

- F001: `safeNextPath` (dot-segment re-check after normalize), `completeLogin` (single UPDATE, env-admin re-promotion every login), callback signOut on both `ok:false` and throw, `is_sunner_email` COLLATE "C", BEFORE INSERT/UPDATE triggers + hook, `ON CONFLICT DO NOTHING`, `assignFirstDepartment` conditional UPDATE, proxy fail-closed (`getUser`, profile lookup error = non-admin), step 4b before prelaunch step 5.
- F002: demoted admin gets proxy 403 at step 4b before layout (spec states ordering and the two-read race); footer label "Tiêu chuẩn chung" matches `messages/vi.json` footer key (toolbar/page title elsewhere says "Tiêu chuẩn cộng đồng", spec RISK-02 flags the mismatch); Admin frame `AppFooter variant="minimal"`; `getShellUser` null for missing profile.
- F003: `claimKudoImageUploads` FOR UPDATE ordered by path, advisory lock per uploader, conditional owner+public UPDATE, hashtag active check after UPDATE (rolls back), anonymous-to-named edit reveals sender on Kudo card while old `kudo_received` notification stays anonymous (BR-019, SC-011, RISK-02; direction without test is declared at § 5.3 item 2).
- F004: `settle()` on four of five page reads, `isKudoWritingOpen` unwrapped (declared § 5.3 item 3); cursor strict decode (`kudo-feed-cursor.ts:44-62`); ranking via `HeartRankingQuery` raw count then newest; `maskKudoRow` whitelist, `isOwner` kept for anonymous owner.
- F005: single INSERT...SELECT guard (public, not own, before end) + outbox only when a row inserted; `classifyNoInsert` ordering matches DEC-002; remove allowed on spam; `HeartMultiplierResolver` never throws, falls back to 1.
- Known facts honoured: anonymous to named edit (F003 BR-019), proxy 403 step 4b (F001 A10, F002 A5), footer "Tiêu chuẩn chung" (F002), button "LOGIN With Google" present in `messages/vi.json:12` (F001 FR-201 states "nút đăng nhập bằng Google", user-story AC says "Đăng nhập bằng Google"; label text itself is not asserted as a literal in the spec, so no mismatch).

---

## Passed Checks

✓ validate_source_citations [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ feature_api_link [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ feature_screen_link [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ reading_guide_db_impact [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ FeatureSpec.required_sections [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ FeatureSpec.action_index_missing [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ FeatureSpec.action_unclaimed [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ FeatureSpec.rung_order [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ FeatureSpec.rung_empty_rendered [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ FeatureSpec.diagram_cites_file_line [deterministic-pass] @ F001_Auth..F005_KudosHearts (5/5)
✓ FeatureSpec.state_rung_missing [deterministic-pass] @ F002_AppShell
✓ FeatureSpec.state_rung_missing [deterministic-pass] @ F003_KudosAuthoring..F005_KudosHearts (3/3)
✓ FeatureSpec.alg_file_schema_missing [deterministic-pass] @ F001_Auth
✓ FeatureSpec.alg_file_schema_missing [deterministic-pass] @ F002_AppShell
✓ FeatureSpec.alg_file_schema_missing [deterministic-pass] @ F004_KudosFeed..F005_KudosHearts (2/2)
✓ citation_accuracy (sampled ~60 ranges vs source) @ F001_Auth..F005_KudosHearts (5/5)
✓ test_file_existence (all cited tests/** exist) @ F001_Auth..F005_KudosHearts (5/5)
✓ cross_ref_feature_list (ROUTE, US, BL codes match feature-list.md) @ F001_Auth..F005_KudosHearts (5/5)
✓ pending_marker_absent @ F001_Auth..F005_KudosHearts (5/5)
✓ BR_depth_vs_code (BR/DEC/ALG/SM claims spot-checked) @ F001_Auth
✓ BR_depth_vs_code (BR/DEC/ALG/SM claims spot-checked) @ F002_AppShell
✓ BR_depth_vs_code (BR/DEC/ALG/SM claims spot-checked) @ F003_KudosAuthoring
✓ BR_depth_vs_code (BR/DEC/ALG/SM claims spot-checked) @ F004_KudosFeed
✓ BR_depth_vs_code (BR/DEC/ALG/SM claims spot-checked) @ F005_KudosHearts
✓ links_resolve_post_promotion @ F001_Auth
✓ links_resolve_post_promotion @ F002_AppShell
✓ links_resolve_post_promotion @ F004_KudosFeed..F005_KudosHearts (2/2)
✓ template_residue_clean @ F001_Auth..F003_KudosAuthoring (3/3)
✓ template_residue_clean @ F005_KudosHearts

---

## Metrics

| Metric | Value |
|--------|-------|
| Feature Specs | 5 |
| FRs (§ 4) | 116 |
| FRs covered by SC | 77 |
| FRs uncovered | 39 |
| SC lines (§ 5.1) | 48 |
| User Stories | 3 + 6 + 4 + 6 + 2 = 21 |
| Backend routes cited | ROUTE007-010, 013, 018, 020-026, 035, 036 |
