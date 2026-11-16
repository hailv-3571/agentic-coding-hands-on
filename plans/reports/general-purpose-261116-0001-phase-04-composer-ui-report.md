# Phase 04 (F003) composer UI — implementer report

**Status:** DONE_WITH_CONCERNS (all concerns are observational; see the end)
**Scope:** UI half of phase 04 — Write/Edit Kudo composer, shared Sunner combobox, launcher on the placeholder home.
Backend consumed as written; no backend, schema, route or migration file touched. Not committed.

## Inputs read
- `research/phase-04-backend-contracts.md` (contract), `research/figma-kudo-composer-spec.md`, all 8 composer PNGs,
  `phase-04-kudos-authoring.md` steps 9–11, decision-log 2026-11-15 sessions, screen spec SCR-write-kudo-modal,
  Next 16 docs (`07-mutating-data.md`, `server-actions.md` § sequential dispatch, `use-router.md` § refresh,
  `image.md` § SVG, `route-segment-config/instant.md`).
- Extra Figma reads (claude.ai Figma MCP, read-only): save icon from "Lưu" `1949:13795`, selected-check from
  `1002:13013`, launcher `mms_A.1_Button ghi nhận` `2940:13449` (pencil, pill, h72). Pixel-sampled: overlay
  ≈ #00101A @ 80 % on `520:11602`; selected list row = #FFEA9E @ 20 % over #00070C (`1002:13013`, `828:10943`);
  toolbar pressed ≈ #998C5F @ 30 %; launcher fill = `secondary` (#FFEA9E @ 10 %); remove badge 20 px at left 67 / top −9.

## Items with evidence
| Item | Evidence |
|---|---|
| C-07 `KudoComposerModal` props exactly as specified (create: `recipient?`, `lockRecipient?`; edit: `kudoId`) | `kudo-composer-modal.tsx` (`KudoComposerModalProps`) |
| Launcher, disabled + notice when writing closed; flag from `isKudoWritingOpen()` in a server component | `kudo-composer-launcher.tsx`, `app/(app)/page.tsx` (streamed behind `<Suspense>`) |
| Focus trap, focus returns to opener, Esc/Hủy confirm when dirty, `role=alert` errors, labelled controls | `use-focus-trap.ts`, `kudo-composer-dialog.tsx`, `discard-changes-confirm.tsx`; e2e "Esc on a dirty form…" asserts launcher refocus |
| Recipient: shared combobox (debounce 250 ms, ↑/↓/Enter/Esc, `excludeSelf=true`); locked read-only render for edit/`lockRecipient` | `sunner-search-combobox.tsx`, `use-sunner-search.ts`, `recipient-picker.tsx`; e2e edit asserts read-only textbox, no combobox |
| Danh hiệu input + 2-line helper, optional, no `*`, ≤ 50 | `kudo-title-field.tsx` |
| Toolbar ×6 (`**`, `_`, `~~`, `1.`, link, `> `), Add link (http/https only), counter `N/1.000` via `kudoTextLength`, hard stop 1000, "@" mention (`excludeSelf=false`) | `kudo-message-editor.tsx`, `kudo-message-toolbar.tsx`, `kudo-markdown-format.ts`, `add-link-popover.tsx`, `kudo-mention-popover.tsx`; unit 21/21; interaction script (below) |
| Hashtag dropdown per 1002:13013, max 5, removable chips, labels from `/api/hashtags` | `hashtag-picker.tsx`, `use-hashtag-options.ts` |
| Images: validate mime/size → `POST /api/kudos/images/sign` → `uploadToSignedUrl` (supabase-js, anon key, no session); per-file uploading/error/retry/remove; max 5 | `kudo-image-upload-client.ts`, `use-kudo-image-uploads.ts`, `kudo-image-thumbnail.tsx`, `kudo-image-picker.tsx`; e2e asserts DB row `kudos/{uuid}.png` position 0 |
| Anonymous checkbox reveals "Nickname ẩn danh*" | `anonymous-sender-field.tsx`; e2e nickname error |
| Edit: `GET /api/kudos/{id}/edit`, title "Chỉnh sửa bài viết của bạn", "Lưu" + save icon, spam → read-only notice, 403/404 → message only | `use-kudo-edit-prefill.ts`, `kudo-composer-edit-loader.tsx`; e2e edit + non-owner |
| Submit: client Zod pre-check (same schema), ref guard + disabled button, codes/fieldErrors → messages, DEC-001 verbatim from `kudosComposer.errors`, success → toast + `onSaved` + `router.refresh()` | `use-kudo-composer-submit.ts`, `kudo-composer-form.tsx`, `kudo-composer-toast.tsx`; e2e double click = 1 row |
| Responsive: 752 px panel desktop; full-width scrolling sheet at 375 | screenshots below |
| i18n vi/en: `kudosComposer.*` (errors untouched) + `sunnerSearch.*` | `messages/vi.json`, `messages/en.json` (+136 lines each, 0 deletions) |

## RED → GREEN
- RED (before any component): `npx playwright test tests/e2e/kudos-authoring` → exit 1, 7/7 failed for the intended
  reason (launcher button / edit dialog not found). Log `p04u-e2e-red.log`.
- GREEN 1: 7/7, but the dev server logged "uncached data … `connection()` outside `<Suspense>`" for `/` (Cache
  Components validates every page by default). Fixed by streaming the launcher behind `<Suspense>` with a same-size
  placeholder. GREEN 2: 7/7, clean log (`p04u-e2e-green2.log`).
- Unit helpers (`kudo-markdown-format.ts`) were written alongside their test, not strictly RED-first.
- Visual fixes after the first production screenshots (`shots-v1`): dialog inherited `text-center` from the placeholder
  `<main>`; counter right-aligned when wrapping; red invalid borders removed (not in Figma); mobile hashtag list
  overflowed 375 px → anchored to the picker width below `sm`.

## Checks (final run, in order; logs in the scratchpad `p04u-*.log`)
| Check | Exit | Result | Log |
|---|---|---|---|
| `npm run db:reset` | 0 | migrations applied, seeds departments=6 hashtags=8 | `p04u-db-reset.log` |
| `npm run typecheck` | 0 | clean | `p04u-typecheck.log` |
| `npm run lint` | 0 | clean | `p04u-lint.log` |
| `npm run test:unit` | 0 | 21 files, 239 tests passed | `p04u-test-unit.log` |
| `npm run test:integration` | 0 | 20 files, 161 tests passed | `p04u-test-integration.log` |
| `npm run test:e2e` (full) | 0 | 37 passed; 0 "uncached" warnings | `p04u-test-e2e.log` |
| `npm run build` | 0 | compiled, all routes dynamic as before | `p04u-build.log` |
| Interaction check on `next start` | 0 | combobox keys, mention insert, list/quote, Add link (javascript: rejected), 1,005 emoji → 1.000/1.000, hashtag cap, invalid gif tile, discard → launcher focus | `p04u-verify-interactions.log` |
| Leftovers after every run | — | kudos 0, uploads 0, outbox 0, auth.users 0, kudo-images objects 0 | `scripts/leftover-counts.cjs` |
| Port 3000 before/after | — | free (prod screenshots used 3100, stopped after) | — |

## Files (line counts)
`features/kudos-authoring/components/`: kudo-message-editor.tsx 167 · hashtag-picker.tsx 138 · kudo-composer-form.tsx 136 ·
kudo-markdown-format.ts 117 · add-link-popover.tsx 109 · use-kudo-image-uploads.ts 89 · use-kudo-composer-form-state.ts 87 ·
kudo-composer-dialog.tsx 77 · kudo-image-picker.tsx 74 · use-focus-trap.ts 70 · kudo-composer-modal.tsx 66 ·
use-kudo-composer-submit.ts 65 · composer-field-row.tsx 63 · discard-changes-confirm.tsx 62 · kudo-message-toolbar.tsx 62 ·
anonymous-sender-field.tsx 60 · kudo-composer-edit-loader.tsx 60 · kudo-image-thumbnail.tsx 59 · recipient-picker.tsx 59 ·
kudo-image-upload-client.ts 57 · kudo-composer-launcher.tsx 51 · kudo-title-field.tsx 44 · kudo-mention-popover.tsx 42 ·
use-kudo-edit-prefill.ts 42 · composer-icon.tsx 39 · composer-styles.ts 39 · use-hashtag-options.ts 39 ·
kudo-composer-toast.tsx 33 · kudo-edit-deep-link.tsx 23.
`features/sunner-search/components/`: sunner-search-combobox.tsx 137 · use-sunner-search.ts 54 · sunner-option-row.tsx 20 · dark-list-styles.ts 16.
`app/(app)/page.tsx` 40. `public/images/kudos-composer/` 14 SVGs (11 copied verbatim, 3 downloaded verbatim: ic-save, ic-check-circle, ic-pencil).
Tests: `tests/e2e/kudos-authoring/` compose-kudo.spec.ts 157 · edit-kudo.spec.ts 63 · kudo-e2e-fixtures.ts 119;
`tests/unit/kudos-authoring/kudo-markdown-format.test.ts` 100. `messages/vi.json`, `messages/en.json` (+136 each).

## Screenshots (production build, `next start`) — `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-04/`
`{desktop 1440×900, mobile 375×812}-` 01-launcher-home · 02-composer-empty (+ `-full`) · 03-dec-001-error (+ `-full`) ·
04-recipient-dropdown · 05-hashtag-dropdown · 06-composer-filled (image ×2, 3 hashtags, anonymous; + `-full`) ·
07-add-link-popover · 08-edit-mode (+ `-full`). 24 files. `-full` = viewport stretched to the dialog height for Figma comparison.

## Deviations from Figma (with reasons)
1. Danh hiệu has no red `*` — optional per decision-log 2026-11-15.
2. ~~DEC-001 wording~~ resolved in the backend fix round: `kudosComposer.errors.MISSING_REQUIRED` now reads "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!" (Figma), pinned by its unit test.
3. Edit mode keeps the Danh hiệu row and the "Tiêu chuẩn cộng đồng" cell (frame 1949:13746 omits both) — title stays editable per decision log; one toolbar for both modes.
4. Locked recipient is a read-only field without caret/shadow — a caret on a non-interactive control would mislead.
5. No red borders on invalid fields (matches Figma); `aria-invalid` only.
6. Chips all Bold 16/24 (Figma uses 14/20 on one chip with no rule); seed label "#High-performing" (Figma typo).
7. Sunner rows: name left-aligned and wrapping, avatar falls back to the initial.
8. Textarea placeholder from 1612:5056 (two lines with "VD: …"); 520:11602 shows a shorter variant.
9. #CF1322 (asterisk), #E46060 (link) and the 11/16 caption are Tailwind arbitrary values: no tokens exist and `app/globals.css` is outside my ownership.
10. Mobile (no frame): labels stack above controls below `sm`, full-width sheet, Gửi above Hủy.
11. Not in Figma, added for behaviour: success toast (no shell toast system exists), discard confirmation dialog, "Đang gửi…/Đang lưu…" labels, upload spinner/error/retry overlay, `https://` URL placeholder.
12. Overlay/selected-row/toolbar-pressed alphas and the launcher gap (20 px) are pixel-measured, not MCP variables.

## Concerns / follow-ups (observational)
- "Tiêu chuẩn cộng đồng" uses `APP_ROUTES.communityStandards` (`/community-standards`, new tab, so the draft survives). That page does not exist yet, so the link is a 404 until its phase ships. No `href="#"` was used.
- Edit entry until phase 05: `/?editKudo={uuid}` on the placeholder home (`KudoEditDeepLink`, owner-checked by the edit route). Phase 05 should remove it when it adds the card edit button.
- The launcher's closed state is not e2e-covered: it needs an `EVENT_END_AT` override on the running server. Server-side `WRITING_CLOSED` is covered by the backend integration tests.
- `lockRecipient` create mode (phase 12) is implemented but not e2e-tested here.
- Reviewer agent not run (no subagents per instructions); the orchestrator should route the diff to `reviewer`.
- Next.js feedback pass: no qualifying candidates (the instant-validation diagnostic matched the docs).
