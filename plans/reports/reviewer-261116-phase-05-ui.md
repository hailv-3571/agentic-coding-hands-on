# Review: Phase 05 UI (F004 Kudos feed & detail)

Score: 8.5/10. Status: DONE_WITH_CONCERNS (no critical; warnings below should be fixed or consciously deferred before ship).

Run by me: typecheck exit 0, lint exit 0, unit 28 files / 364 passed. NOT run: e2e, integration, `next build` (unproven: Cache Components prerender of `/kudos`; recommend one `npm run build` before ship). Implementer claims verified: line counts (all <200), no `dangerouslySetInnerHTML` (only in comments), no refs to the deleted deep link/`editKudo` outside the phase 04 journal, vi/en `kudosFeed` keys identical (46/46).

## Critical
None.

## Security (all hold)
- Anonymous: `maskKudoRow` whitelists; anon sender = `{anonymous:true, nickname}` (kudo-row-mask.ts:25-39). `AnonymousSender` renders only nickname, `alt=""` avatar, no link/data attr/aria with sender data (kudo-card-sender.tsx:41-54). Props to client comps (`AllKudosFeed`, `HighlightSection`, pen) carry only `KudoCardView`. e2e checks raw HTML of `/kudos` and `/kudos/{id}` (live-board.spec.ts:108-135). Load-more/highlight come from the masked API.
- Markdown: React elements only, http(s) re-check, `target=_blank rel="noopener noreferrer nofollow"` (kudo-body-markdown.tsx:34-40).
- Copy Link: `origin + /kudos/{uuid}` only (kudo-copy-link-button.tsx:26).
- Pen: `canEdit = isOwner && !isSpam` (kudo-card.tsx:27); detail has no pen. Own-spam hides hearts/copy link.
- `notFound()` outside try/catch (`[id]/page.tsx:47`; `findKudo` wraps only the read); `instant=false` matches precedent in 5 other files.

## Warning
1. **Pen after EVENT_END_AT** (kudo-card.tsx:27). Opens a modal that only fails on save. Fix: pass `writingOpen` (already read in `kudos/page.tsx:48`) via `HighlightSection`/`AllKudosFeed` to `KudoCard`; `canEdit = isOwner && !isSpam && writingOpen`. Server stays the authority (WRITING_CLOSED).
2. **Dropdown keyboard** (highlight-filter-dropdown.tsx:99-108). Every `role=option` button is a tab stop; Tab leaves the list open and walks all options. Fix: roving `tabIndex={isSelected||focused ? 0 : -1}`, and on `Tab` close the list (or return focus to trigger). Esc/arrows/Home/End/focus return are fine.
3. **Load-more a11y** (all-kudos-feed.tsx:60, 79-90). Focus moves to the new cards only on the last page; otherwise the button is `disabled` while focused (focus can drop to body) and nothing is announced. Fix: always `setFocusId(fresh[0].id)` after a successful append, plus an `sr-only aria-live="polite"` line ("Đã tải thêm N Kudo", new i18n key).
4. **Stale closure state** (all-kudos-feed.tsx:57-59). `setOlder([...older, ...fresh])` and `known` from `shown` use render-time values; if `router.refresh()` lands during a fetch, appended items can be dropped. Fix: `setOlder(prev => [...prev, ...fresh.filter(i => !new Set([...first, ...prev].map(x => x.id)).has(i.id))])`; add an `AbortController` aborted on unmount.
5. **Phase 04 e2e coverage shift** (edit-kudo.spec.ts non-owner test). Not weakened on the security side (pen absent + API 403 `{code:"FORBIDDEN"}` with no body leak is stronger), and the owner test gained a post-save card assertion. But the edit dialog's FORBIDDEN branch is now unreachable from the UI and untested. Either delete it or cover it with a unit test of the edit loader.

## Suggestion
- Carousel arrows/pager use `disabled` at the ends (highlight-carousel.tsx:53, 96, 103): a focused button that disables drops focus. Use `aria-disabled` and ignore clicks, or move focus to the other arrow.
- `useHighlightKudos.load` calls `setActive(0)` before data arrives (use-highlight-kudos.ts:32): visible slide-back over stale cards at 60% opacity. Reset `active` when the response is applied.
- Copy Link status region mounts on the first click and gets its text within ms (kudo-copy-link-button.tsx:24-26, 43): SRs may miss the first announcement. Keep the toast host mounted once per page (or delay `setNotice`).
- `kudo-copy-link-toast.tsx` duplicates the layout/live region of `kudos-authoring/components/kudo-composer-toast.tsx`; extract a shared `ToastShell`. (Focus trap is not duplicated.)
- Dead code from the hand-off: `KudoComposerLauncherPlaceholder` (launcher.tsx:50) and the `pencil` entry in `composer-icon.tsx:18` have no users. Remove (YAGNI).
- Detail page heading: sr-only `h1` then card title `h3` (kudo-card-parts.tsx:23) skips h2. Accept a heading-level prop (`h2` on detail).
- Feed card body lacks `break-words` (kudo-card.tsx:43): a long URL is clipped without an ellipsis. Add `[overflow-wrap:anywhere]`.
- `unauthorized` state has no sign-in link (kudo-feed-status-message.tsx:31). Add a link to login.
- Markdown `[text](url)` lets the label differ from the href (phishing-style). Acceptable for an internal Sun* tool; the new-tab + rel is right. Optional: show the host on hover/title.
- e2e fixtures use random far-future years 5000-7899 (kudo-e2e-fixtures.ts:88). OK under parallelism, but a collision is possible in principle; note it if flakes appear.

## Edge cases checked
- Filter change: abort of the previous request, `pending` guarded by `controller.current === request`, reset to card 1: correct. Two dropdown changes in quick succession use the latest `filters` (re-render between clicks): fine.
- Double-click on load-more: guarded by `disabled` (React flushes discrete events); 400 cursor restart path OK.
- Time: `Asia/Ho_Chi_Minh`, `hourCycle:h23`, `HH:mm - MM/DD/YYYY` verified in screenshots ("10:14 - 11/16/2026").
- Portals: modal/toast go to `document.body` via `DocumentBodyPortal`; arrow keys from portals are filtered (carousel:42); Esc/focus return handled by `useDismissable` and the phase 04 modal.
- Launcher still gets `writingOpen` and keeps the closed notice (launcher.tsx:32-34); edit opens from the pen (e2e).
- Mobile: screenshots show no overflow; e2e asserts scrollWidth overflow 0 at 375/1440 (live-board.spec.ts:150).

## Figma fidelity
Desktop top and detail screenshots match the frames (KV, pills, filters, cream card, body box, hashtag red, 88px thumbs). Hearts show 0 and there are no Hero badges (seams, expected). The 12 deviations: all acceptable; #3 (right arrow inset asymmetric to Figma) is cosmetic; #9 (own-spam red pill) is acceptable until phase 08. Detail has a hairline divider above the people row; verify against 520:18779 (minor).

## Implementer's open questions
1. Hide pen after EVENT_END_AT: **yes** (Warning 1), consistent with the disabled launcher.
2. Pen on the detail page: **no** (YAGNI; Figma 520:18779 has none; edit from the feed card). Close E11 "TBD" in the decision log.
3. Debounce 250 ms vs 300 ms: **accept**; plan text said 300. Update the plan/decision-log rather than touch `features/sunner-search`.

## Done well
Whitelist renderer and masking boundary; real 404 via blocking route; per-region inline errors with retry; seam/slot files; every file <200 lines; RED-first e2e; portal fix for transformed ancestors found and regression-tested; inert + aria-hidden neighbours.

## Actions in order
1. Hide the pen when writing is closed (W1).
2. Fix the dropdown tab behaviour (W2) and load-more focus/announcement + functional state updates (W3, W4).
3. Run `npm run build` once (unproven item).
4. Decide the edit-loader FORBIDDEN branch (W5); remove dead code; the rest of the suggestions at leisure.

## Numbers
Lint findings 0; typecheck 0 errors; unit 364/364; e2e/integration not run by me.

Status: DONE_WITH_CONCERNS
