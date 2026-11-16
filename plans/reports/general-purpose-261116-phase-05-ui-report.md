# Phase 05 UI half — implementer report

Date: 2026-11-16 · Phase: 05 (F004 Kudos feed & detail), UI half · **Status: DONE_WITH_CONCERNS** (concerns are minor, listed at the end)

## Scope Contract
- **Changed:** `features/kudos-feed/components/**` (new), `/kudos` + `/kudos/[id]` pages and not-found, `kudosFeed.*` i18n, launcher restyle + move, home page cleanup, `kudo-edit-deep-link.tsx` deleted, `public/images/kudos-feed/**`, e2e (`tests/e2e/kudos-feed/**`, `tests/e2e/kudos-authoring/**`), one unit test.
- **Impacted:** the phase 04 composer (launcher location, edit entry now the owner's pen), shell nav (active link), phases 06/09/10/11 (seam/slot files).
- **Verified:** typecheck, lint, full unit, **full** e2e (incl. kudos-authoring), screenshots desktop and mobile.
- **Deliberately skipped:** backend queries/routes (covered by the backend half's unit + integration tests), hearts, Hero, Spotlight. I did not run `test:integration`.
- **Safety-critical:** anonymous sender. e2e checks the raw HTML of `/kudos` **and** `/kudos/{id}` (RSC payload included): it contains no sender name, id or email.

## Progress log
- [x] Read the phase file, backend contracts, Figma spec, screenshots and decision log (Phase 05 session)
- [x] Read the Next 16 docs: async `params`, `notFound()` (throws; never inside try/catch), streaming status codes (404 only before streaming starts), `instant`, `not-found.js`
- [x] RED: e2e written first. 14 failed / 1 passed (the guest redirect is already served by the phase 02 proxy), all for the intended reason. The unit test was RED (module missing) before the renderer existed.
- [x] Built components, pages and i18n; made the phase 04 hand-off edits
- [x] GREEN: every gate exits 0 (counts below)
- [x] Screenshots plus a Figma comparison. The comparison found 3 layout bugs, all fixed (see "Findings fixed").

## Commands (final run, all exit 0)
| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test:unit` | 28 files, **364 passed** (5 new: `kudo-body-markdown.test.ts`) |
| `npm run test:e2e` | **54 passed** (14 new kudos-feed, 2 kudos-authoring edit tests rewritten, the rest unchanged and green) |

Leftovers: after the e2e runs and the screenshot script, `kudos`, `kudo_images`, `kudo_image_uploads`, `auth.users`, `profiles`, `domain_event_outbox` and Storage `kudo-images` all have 0 rows.

## Files (line counts)
Pages: `app/(app)/kudos/page.tsx` 99 · `app/(app)/kudos/[id]/page.tsx` 65 · `app/(app)/kudos/[id]/not-found.tsx` 25 · `app/(app)/page.tsx` 15 (launcher and deep-link mount removed)

`features/kudos-feed/components/`:
| File | Lines | Role |
|---|---|---|
| kudo-card.tsx | 65 | post / highlight card variants |
| kudo-card-sender.tsx | 69 | info row (`KudoCardPeople`): named person / anonymous sender |
| kudo-card-parts.tsx | 38 | time, title row (+ pen slot), hashtags |
| kudo-card-images.tsx | 49 | 88px thumbnails; detail thumbnails open in a new tab |
| kudo-card-heart-slot.tsx | 27 | **SEAM (phase 06)**: read-only count |
| kudo-card-hero-badge-slot.tsx | 11 | **SEAM (phase 09)**: renders null (dot + badge) |
| kudo-body-markdown.tsx | 76 | AST → React, no `dangerouslySetInnerHTML` |
| kudo-copy-link-button.tsx / kudo-copy-link-toast.tsx | 50 / 58 | Clipboard API + success/error toast with the link for manual copy |
| kudo-owner-edit-button.tsx | 41 | pen → `KudoComposerModal` edit (portalled) |
| document-body-portal.tsx | 14 | overlays out of transformed/inert ancestors |
| kudo-detail-view.tsx | 57 | View Kudo panel, own-spam view |
| all-kudos-feed.tsx | 93 | "Tải thêm" pagination |
| highlight-section.tsx / use-highlight-kudos.ts | 61 / 67 | filters → `/api/kudos/highlight`, reset to card 1 |
| highlight-carousel.tsx | 109 | centre card, fades, arrows, pager, keyboard |
| highlight-filter-dropdown.tsx | 115 | listbox dropdown with "Tất cả" |
| sunner-profile-search.tsx | 46 | reuses `SunnerSearchCombobox` (excludeSelf=false) → `/profile/{id}` |
| live-board-keyvisual.tsx / live-board-section-header.tsx / live-board-skeleton.tsx | 30 / 32 / 27 | KV, section header, Suspense fallback |
| live-board-spotlight-slot.tsx / live-board-rewards-column-slot.tsx | 8 / 8 | **SLOTS (phases 11 / 10)**: render null |
| kudo-feed-status-message.tsx / kudo-feed-styles.ts / kudo-feed-icon.tsx / format-kudo-card-time.ts | 37 / 38 / 35 / 18 | shared pieces |

Phase 04 hand-off: `kudo-composer-launcher.tsx` 53 (Figma pill, ic-pen-light 24, gap 16, rounded 68; `writingOpen` disabled state and closed notice kept) · `kudo-edit-deep-link.tsx` **deleted** (no references left).
i18n: `messages/vi.json`, `messages/en.json`, plus the `kudosFeed.*` namespace only (+68 lines each).
Assets: `public/images/kudos-feed/` holds 12 SVG icons (root sizes kept), `avatar-anonymous.png`, `kudos-logo.png` and `live-board-keyvisual.png`. `ic-dot` is not copied because the badge is hidden.
Tests: `tests/e2e/kudos-feed/live-board.spec.ts` 168 (6 tests) · `kudo-card-and-detail.spec.ts` 135 (8 tests) · `live-board-fixtures.ts` 67 · `tests/unit/kudos-feed/kudo-body-markdown.test.ts` 47 · authoring: `edit-kudo.spec.ts` 83, `kudo-e2e-fixtures.ts` 139 (+`feedWindow`, `createdAt`), `kudo-composer-e2e-steps.ts` 57 (`/kudos`), `compose-kudo.spec.ts` (comment only).

## Behaviour notes / decisions taken
- **Data:** the RSC reads the session viewer (`requireSunner`), the request locale and `Promise.all` of the writing window, `KudoPublicQuery.list`, `listHighlightKudos`, `listActiveHashtags` and `listDepartmentOptions` (all existing; no backend change). Each read is wrapped, so a failure becomes that region's inline error with a retry (spec § 5) instead of a broken page. Only `KudoCardView`s reach client components.
- **`/kudos`** streams the request-time part behind a skeleton. **`/kudos/[id]`** is blocking (`export const instant = false`, the same pattern as the login and onboarding pages). The Kudo is therefore read before streaming starts, `notFound()` returns a real **404**, and Next's dev validation for the uncached read outside `<Suspense>` goes quiet. `notFound()` is called outside try/catch.
- **Feed refresh:** `AllKudosFeed` is keyed by first-page id + `nextCursor`. A new Kudo (created from the launcher) restarts the list at page 1, with no gap or duplicate. An edit re-renders the first-page cards in place. A rejected cursor (400) restarts after page 1. When the last page arrives, focus moves to its first card.
- **Highlight:** a filter change fetches `/api/kudos/highlight` (absent param = "Tất cả", AND of both filters) and resets to card 1. A newer request aborts an older one. Neighbour slides are `inert` + `aria-hidden`, so only the centre card is focusable. ←/→ work while focus is inside the carousel. With fewer than 3 cards the active card stays centred.
- **Anonymous card:** incognito avatar, nickname 22/28, "Người gửi ẩn danh", no link. Names and avatars link to `/profile/{id}`; the avatar link is `tabIndex=-1` + `aria-hidden`, so each person is one tab stop.
- **Time** is `HH:mm - MM/DD/YYYY` in `Asia/Ho_Chi_Minh` via `Intl` with an explicit timeZone, so server and client output are identical (checked by e2e: 2025-10-30T03:00Z → "10:00 - 10/30/2025").
- **Owner pen** shows only for `isOwner && !isSpam` and also appears on highlight cards. It is not hidden after the event ends; the update action answers WRITING_CLOSED.
- **Markdown:** a whitelist renderer. Links get `target=_blank rel="noopener noreferrer nofollow"`, a defensive http(s) re-check, and unknown nodes render nothing. Cards clamp the body (4 lines post / 2 lines highlight, fixed 160/120 box); the detail page shows it in full at 24/32.
- **Unit test:** `vitest.config.mts` (not mine) only includes `tests/unit/**/*.test.ts` in a node environment. The test is therefore `kudo-body-markdown.test.ts` and renders with `react-dom/server` `renderToStaticMarkup` + `createElement`, so React rendering works without a DOM. The brief named it `.tsx`; a `.tsx` file would never be collected.
- **e2e determinism under 6 parallel workers:** seeds use random far-future `created_at` windows (`feedWindow("top"|"low")`). "Page 1" tests sit above the 12-item load-more seed. The filter test uses the only hashtag no other test seeds (#WASSHOI) and asserts exactly "1/2".
- **kudos-authoring e2e:** the launcher is now opened on `/kudos`. Edit opens from the owner's pen and now also asserts that the card shows the saved body after the refresh. The non-owner test was the dialog's FORBIDDEN alert, which the UI can no longer reach. It is now: no pen on the card, **and** `GET /api/kudos/{id}/edit` answers 403 `{code:"FORBIDDEN"}` with no Kudo content. Same server guarantee, plus the UI guarantee.

## Findings fixed during the work
1. **The edit modal was clipped.** It rendered inside the title row's `-translate-y-1/2` wrapper; in the carousel it rendered inside the translated track. A transformed ancestor becomes the containing block for `position:fixed`. Caught by the authoring e2e (chips "hidden"). Fix: the modal and the Copy Link toast are portalled to `<body>`. The carousel ignores arrow keys that bubble through the React portal. Regression check: the owner-pen e2e asserts a chip is visible.
2. **The Hashtag list opened off-screen on phones** (it was right-anchored, x = −127). Fix: left-anchored below `md`. The responsive e2e now asserts the open list stays within 375/1440. I proved it RED on the old anchoring and GREEN on the fix.
3. **Layout alignment:** the content column started at x=160 instead of the Figma 144 (now `max-w-296 px-4`, matching the header). The info-row gap wrapped names on highlight cards (removed). Mobile action buttons wrapped apart (they now move to their own line as a group).
- Test-side: after a client navigation, Next 16 keeps the previous route mounted but hidden (React Activity). Detail locators therefore filter `visible: true`.

## Screenshots
Folder: `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-05/` (20 files; desktop 1440x900 and mobile 375x812 each; seeded with 5 named Sunners and 6 Kudos, including an anonymous one, Markdown, a link and 0–5 images; cleaned up afterwards):
`{desktop,mobile}-01-live-board-top.png`, `-01-live-board-full.png`, `-02-all-kudos-feed.png`, `-03-anonymous-card.png`, `-04-owner-card-with-pen.png`, `-05-hashtag-filter-open.png`, `-05b-department-filter-open.png`, `-06-kudo-detail.png`, `-06-kudo-detail-full.png`, `-07-not-found.png`.
The capture script was one-off and kept out of the repo: `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\capture-phase-05-screens.mts`.

## Figma deviations (vs 2940:13431, 3127:21871, 2099:9148, 2940:13465, 520:18779, 721:5580/5684)
1. Hearts show `0` and there is no Hero badge or dot. Both are seams; Figma shows "1.000" and badges.
2. Avatars: the seeded users have no `avatar_url`, so the screenshots show the initial-letter fallback circle. Real Google photos render through a plain `<img>`, as the shell does.
3. The right carousel arrow sits 80px from the right edge, symmetric with the left. Figma has x=1220, i.e. 140px from the right.
4. Below `md` (768px) the 80px side arrows and fades are hidden. One card fills the width and the pager's 48px arrows drive the carousel. There is no mobile frame for this.
5. Highlight cards show no images, matching the Figma highlight frame; the spec text says "same anatomy". The owner pen also appears on highlight cards.
6. Feed cards also show "Xem chi tiết" (decision-log; the Figma feed frame shows only Copy Link).
7. Anonymous card body is 20/32 (spec), not 24/32 as drawn on 2099:9148.
8. Phones: section titles are 32/40 (57/64 on desktop) and the KV title is 32/40 (36/44 on desktop). Card padding is px16 pt24 and the body box px16.
9. Detail: the panel starts 16px below the header (Figma: directly under it). Own-spam view uses a red "Spam" pill plus a note; there is no Figma frame, and phase 08 owns the real overlay.
10. Not-found, skeleton and Copy Link toasts have no Figma frames. They reuse shell and composer styling: dimmed keyvisual plus a gold CTA; the toast matches the composer toast, and the error toast adds a read-only link field and "Đóng".
11. The keyvisual gets a 128px bottom gradient so it blends into #00101A. The logo asset is 593×106 (spec says 593×104).
12. Filter list is left-anchored on phones; Figma only shows the desktop drop.

## Concerns (why DONE_WITH_CONCERNS)
- **Search debounce is 250 ms, not 300 ms.** `SunnerSearchCombobox` has no debounce prop and uses `useSunnerSearch`'s default of 250. `features/sunner-search/**` is outside my ownership. Exposing a `debounceMs` prop there is a one-line follow-up if 300 ms is required.
- **Edits to a card on an appended feed page** show the old content until reload. The refresh after saving re-renders only the server's first page, and there is no `GET /api/kudos/{id}`. The same applies to a filtered Highlight, which keeps its fetched result until the next filter change. This is acceptable under D005 (no realtime), but noted.
- The unit test file is `.test.ts` rather than `.test.tsx`, because of the Vitest glob (see above).
- Next.js feedback pass: one candidate evaluated (the dev validation message on the detail route). It does not qualify, because existing docs and project precedent resolved it right away. No report draft was created.

## Unresolved questions
- Should the owner pen hide after `EVENT_END_AT` (today it opens and the save answers WRITING_CLOSED)?
- Should the detail page also show the owner pen (spec E11 "TBD")? Not implemented.
