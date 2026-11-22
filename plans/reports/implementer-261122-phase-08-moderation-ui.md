# Phase 08 Admin moderation (F007) — UI implementer report

Date: 2026-11-22. Role: implementer (UI). Nothing staged or committed.

## Scope Contract
- **Changed:** `features/admin-moderation/components/**` (new), `app/admin/review/loading.tsx`, owner spam view in `features/kudos-feed/components/kudo-card.tsx` + `kudo-detail-view.tsx`, `messages/{vi,en}.json` (`adminModeration`), `public/images/admin-moderation/**`, one assertion in `tests/e2e/kudos-feed/kudo-card-and-detail.spec.ts`.
- **Impacted:** the Live board card and the detail panel (every Kudo goes through them; non-spam rendering unchanged), the admin review page that renders `ReviewContentScreen`.
- **Will verify:** unit tests for the pure helpers; eslint + `tsc`; e2e `review-content.spec.ts` + `owner-spam-view.spec.ts` + the edited phase 05 spam test; desktop/mobile screenshots compared with Figma.
- **Deliberately skipped:** integration suite and the full e2e suite (per brief; backend ran full integration 317/317); 422 export path in e2e (needs more than `EXPORT_MAX_ROWS` rows).

## Files
Created (`features/admin-moderation/components/`):
- `review-content-screen.tsx`: entry, exports `ReviewContentScreen(props: ReviewContentScreenProps)`. URL-driven view: `useOptimistic(filter)` + `router.replace` in a transition. Rows patched from action results. Toast, `filterError`, `loadError` with retry (`router.refresh`).
- `review-filters.tsx`, `review-person-filter.tsx` (shared `SunnerSearchCombobox`), `review-status-filter.tsx` (Tất cả / Public / Spam chips), `review-search-input.tsx` (300 ms debounce or Enter, max 100), `review-date-range-filter.tsx` (two native date inputs, refuses a reversed range inline), `use-external-reset-key.ts` (remounts self-texted fields only on outside changes such as clearing filters or browser back).
- `review-table.tsx` (sortable Heart header with `aria-sort`, empty state + "Xoá bộ lọc"), `review-table-row.tsx` (shortId, real sender + "Ẩn danh" chip, bold title + plain clamped message, hashtags one per line, `useFormatter` number, badge), `review-moderation-button.tsx` (one-item confirm popover; `useTransition`; post-await update wrapped again, per the Next docs), `review-pagination.tsx`, `review-export-button.tsx` (fetch + blob; 422 → spec message), `review-content-skeleton.tsx`.
- Owner spam: `kudo-spam-tag.tsx`, `spam-alert-overlay.tsx` (`role="note"`, backdrop blur 5 px + rgba(87,87,87,.7) veil, triangle at 48 % width, sr-only "tạm ẩn" sentence; card text stays in the DOM).
- Pure helpers: `review-url-params.ts` (href/export href, FR-402 page reset, heart sort cycle, aria-sort), `review-page-window.ts`, `kudo-message-plain-text.ts` (reuses `parseKudoBody`, so no second Markdown parser), `review-export-filename.ts`.
- `review-content-styles.ts`, `admin-moderation-icon.tsx`. Reuses the phase 06 table/menu/button/toast tokens and `CampaignSettingsToast`.
- `app/admin/review/loading.tsx`.
- `public/images/admin-moderation/`: 3 icons from `figma-assets` + 7 downloaded from the raw file's asset URLs (`ic-caret-select`, `ic-search`, `ic-calendar`, `ic-swap-right`, `ic-sort-up/down`, `ic-pager-next`). Checked: plain SVG, no script/href.
- Tests: `tests/unit/admin-moderation-ui/{review-url-params,review-page-window,kudo-message-plain-text,review-export-filename}.test.ts`. The backend owns `tests/unit/admin-moderation/`, so mine live in a separate folder. `tests/e2e/admin-moderation/{review-content,owner-spam-view}.spec.ts`.

Modified: `kudo-card.tsx` and `kudo-detail-view.tsx` (overlay + tag when `isSpam`; the detail's old spam tag + "khoá sửa" note removed per decision 2026-11-22; detail "Đóng" lifted above the overlay); `messages/vi.json`, `messages/en.json` (only `adminModeration` added; existing keys kept, including the now-unused `kudosFeed.card.spamTag/spamLocked`); `tests/e2e/kudos-feed/kudo-card-and-detail.spec.ts` (one line: it asserted the removed "khoá sửa" note, now asserts the overlay note).

## Evidence
- Unit RED: 4 files failed with `Cannot find package …/components/review-url-params` (etc.). GREEN: 23/23. One test input was out of contract (`*dẫn*`; the whitelist only has `_…_`) and was corrected. `tests/unit/admin-moderation-ui` + `tests/unit/kudos-feed`: 114/114.
- `npx tsc --noEmit -p .`: exit 0. `npx eslint` on all my files and specs: exit 0. Every file is under 200 lines (largest 112).
- E2E (dev server, run only after the backend report existed):
  - `review-content.spec.ts`: 6/6, and stable on `--repeat-each=2` (12/12). Covers: non-admin 403; Sender via Sunner search → page 2 → Status filter back to page 1 → Heart sort back to page 1 + `aria-sort` → debounced search; Mark Spam popover (Esc returns focus, confirm, row patched, same document, DB status) and Un Spam; `changed:false` notice; reversed date range refused; Export download holding only the filtered rows.
  - `owner-spam-view.spec.ts`: **2/3**. Detail page overlay/tag/no buttons/Đóng passes. The other-user not-found + absent from the Live board check passes. **The author-on-Live-board test fails deterministically:** the card is not in the feed (see concern 1).
  - Edited phase 05 test "read-only spam view": passes.
  - A first-run failure came from filling the date field before hydration on `next dev`. Fixed with an `openReview` helper that waits for the React fiber on the filter bar (the same approach as `portal-pages.spec.ts`).
- Screenshots in `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-08/`, each at desktop 1440×900 and mobile 375×812: `review-content-*`, `review-mark-spam-popover-*`, `review-status-filter-open-*`, `owner-spam-detail-*`. **No `owner-spam-live-board-*`**: the card never reaches the Live board (concern 1). The temporary capture spec has been deleted.

## Deviations from Figma (and why)
1. **Labels:** vi uses Vietnamese column and filter labels (Người gửi / Người nhận / Nội dung / Tim / Trạng thái / Thao tác, "Chọn người gửi", "Tìm theo nội dung", "Ngày bắt đầu"), to honour D013 ("Người nhận" in vi) without a mixed header row. en uses the Figma English. The title "Review content", "Export", the Public/Spam badges and Mark Spam / Un Spam stay verbatim. Flipping this is messages-only.
2. **Width:** the content area is 1152 px (the phase 06 admin frame), not Figma's 1280, so the Content column is about 352 px at 1440. ID is 96 px (Figma 60) so the 8-character id fits (D011). Actions is 112 px (Figma 80).
3. **Row button text:** 12/16. Figma's instance is scaled 0.49× (7.8 px text, unreadable).
4. **Alignment:** headers and values are left-aligned. The shared phase 06 `headerCell` has `text-left`, which an added `text-center` cannot override. Figma's Status/Heart values sit near the header's left edge anyway.
5. **Title row:** uppercase bold title without Figma's leading "#", since the title is not a hashtag.
6. **Current page square:** gold border added. Figma's dark square sits on a grey canvas and would disappear on the dark admin frame.
7. **Search:** flexible width (256–360 px) so the filter bar fits one row in 1152 px.
8. **Confirm popover:** opens to the left of the row button, vertically centred, so the horizontally scrolling table never clips it.
9. **Sender/Receiver list:** the shared `SunnerOptionRow` (department name; Figma shows the code) is as wide as the select (259 px; Figma 378).
10. **Date range:** 296 px (Figma 256) so the Vietnamese placeholders fit. Two native date inputs; a click opens the picker.
11. **Owner spam:** the Spam tag stays above the blur, per spec (the Figma overlay frame shows it blurred). On the detail page "Đóng" is lifted above the overlay so the page does not trap the reader. No separate `SpamKudoCard` wrapper: `KudoCard` handles `isSpam` itself, and phase 12 can reuse `KudoCard`.

## Open concerns
1. **Server gap, outside my ownership (blocks the decision's "Live board" half):** `KudoPublicQuery.list` (`features/kudos-feed/server/kudo-public-query.ts`, `listConditions`) adds the viewer's spam only when `senderId === viewerId && includeOwnSpam`. The Live board page and `/api/kudos` call it without either, so the author's spam Kudo never reaches `/kudos`. The UI is ready (`KudoCard` renders tag + overlay for `isSpam`). The fix: for the main feed, include `status='spam' AND sender_id = viewerId`. This is a public read path, so it is safety-critical: update `tests/integration/kudos-feed/kudo-public-query.test.ts` and re-check the masking and Highlight exclusion. Until then `owner-spam-view.spec.ts` › "the author sees it on the Live board…" stays red. Orchestrator to assign the change, or drop the Live board half of the decision.
2. I edited one assertion in the phase 05 spec (outside my listed ownership), because the 2026-11-22 decision replaced the note it checked.
3. Keyboard focus can still reach the links under the overlay (profile links, "Xem chi tiết"); only the pointer is blocked. Using `inert` would also hide the text from screen readers, which the decision forbids.
4. The Public badge colour #3174C6 on #00070C is about 4.3:1, under AA 4.5:1 for 14 px text. I kept the Figma value.
5. `changed:false` shows "Kudo đã được cập nhật bởi Admin khác." (brief), whereas the functional spec lists silent handling.
6. The UI caps search at 100 (spec E08); the server accepts 200 (backend concern 3).
7. Side note: phase 06 `campaign-table.tsx` has the same `headerCell` + `text-center` conflict on its ID header.

**Status:** DONE_WITH_CONCERNS
**Summary:** The Review content UI, the owner spam tag + overlay and the loading state are built. Unit (23/23), tsc and eslint are clean. review-content e2e passes 6/6 and is stable on repeat; the screenshots are saved.
**Concerns/Blockers:** The author's spam Kudo never reaches the Live board because of a server-side feed query outside my ownership, so 1 of 3 owner-spam e2e tests is red until `KudoPublicQuery.list` includes the viewer's own spam (concern 1).
