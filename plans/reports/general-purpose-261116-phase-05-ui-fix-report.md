# Phase 05 UI review fixes — implementer report

Date: 2026-11-16 · Input: `reviewer-261116-phase-05-ui.md` · testPolicy: e2e-red-first · **Status: DONE_WITH_CONCERNS** · Nothing committed, staged or pushed.

## Scope Contract
- **Changed:** Live board and detail client components (`features/kudos-feed/components/**`), `app/(app)/kudos/page.tsx`, `kudosFeed` i18n (vi + en), the `pencil` entry in `composer-icon.tsx`, and the e2e specs in `tests/e2e/kudos-feed/**`.
- **Impacted:** the launcher pill on `/kudos` and the phase 04 authoring e2e that opens the composer there. Both are green.
- **Verified:** typecheck, lint, full unit suite, a production build, and e2e for `kudos-feed` + `kudos-authoring`. The e2e ran against my own `next start` server, not dev (why: Concern 3). The closed writing window was checked one-off on a second production server.
- **Skipped:** integration tests and `db:reset`, as briefed. I did not touch `features/kudos-feed/server/**`, `features/kudos-feed/markdown/**`, or any other `tests/unit/kudos-feed/*`.

## Fixes
| # | Item | Change |
|---|---|---|
| W1 | Pen after EVENT_END_AT | `page.tsx` now passes `writingOpen` to `HighlightSection` → `HighlightCarousel` → `KudoCard`, and to `AllKudosFeed` → `KudoCard`. The prop is required. `canEdit = isOwner && !isSpam && writingOpen`. The detail page still has no pen (e2e checks it for the owner). |
| W2 | Dropdown keyboard | Roving tabindex: only the active option has `tabIndex=0`, and `onFocus` keeps it in sync. ↑/↓ wrap; Home/End jump. Tab unmounts the list (`flushSync`) and continues to the next control. Shift+Tab closes the list back onto the button. Esc closes it and refocuses the button (unchanged, `useDismissable`). |
| W3 | Load-more a11y | While loading the button uses `aria-disabled` instead of `disabled`, so it keeps focus. A ref guard blocks double loads. After every append, focus moves to the first new card (or to the last card if nothing new arrived). A permanent sr-only `role=status aria-live=polite` line reads `allKudos.loaded` ("Đã tải thêm {count} Kudo" / ICU plural in en); it is cleared at each load start so the same count is announced again. |
| W4 | Stale closure | Pages append with `setOlder(prev => [...prev, ...page.items])` and are de-duplicated by id at render. The closure value is used only for the focus target and the count. An `AbortController` aborts the fetch on unmount. |
| W5 | Edit dialog FORBIDDEN | **Not dead, so not deleted.** The loader has no FORBIDDEN-only branch; one generic error branch serves FORBIDDEN, NOT_FOUND, UNAUTHENTICATED and UNEXPECTED. FORBIDDEN is reachable when a tab keeps the old account's pen after an account switch in another tab. New e2e covers it: the dialog shows only "Bạn không có quyền sửa Kudo này.", with no textbox and no Kudo text. |
| S | Carousel | Arrows and pager use `aria-disabled` (clicks already clamp to a no-op). `roundIconButton` now styles `aria-disabled:`. `setActive(0)` moved to where the new result is applied, which removes the early slide-back. |
| S | Copy Link live region | The toast host, with its empty polite region, mounts as soon as the page is hydrated (`useSyncExternalStore` flag), not on the first click. The composer toast is untouched. |
| S | Dead code | `pencil` removed from `composer-icon.tsx` (grep: no users). **`KudoComposerLauncherPlaceholder` is kept:** `live-board-skeleton.tsx` renders it twice, so it is not dead. |
| S | Heading levels | `KudoCardTitleRow` takes `heading: "h2" \| "h3"` (default h3). The detail page uses h2 under its sr-only h1. |
| S | Long text | `wrap-anywhere` on the card body, detail body, title, named person and anonymous nickname, plus `max-w-full` on the names. `break-word` alone does not wrap a centred flex item. |
| S | Session expired | The `unauthorized` region state gets a plain link "Đăng nhập lại" / "Sign in again" to `/login?next=%2Fkudos` (new key `status.signIn`). |
| S | Detail dividers | Checked against Figma 520:18779 and the extracted spec: divider, people, time, title, body, images, hashtags, divider, actions. The code already matches, so no change. |

## Tests (RED → GREEN)
- **New** `tests/e2e/kudos-feed/live-board-keyboard-and-states.spec.ts` (92 lines):
  - filter list: one tab stop, arrows, Home/End, Tab, Shift+Tab and Esc;
  - pager keeps focus at the last card;
  - a 401 in a region shows the sign-in link.
- **Extended** `live-board.spec.ts`:
  - load-more is `aria-disabled` and focused while busy;
  - focus lands on the first new card after every append;
  - the status line is announced;
  - carousel `aria-disabled`.
- **Extended** `kudo-card-and-detail.spec.ts`:
  - detail title is h2;
  - owner sees no pen on the detail page;
  - stale-tab FORBIDDEN;
  - long unbroken body and name wrap.
- **Fixture:** `setFullName` added to `live-board-fixtures.ts`.
- **RED** (old code, dev server), 7 failed for the intended reasons:
  - no `tabindex` on options;
  - no `aria-disabled` (×3);
  - no sign-in link;
  - no h2;
  - card body overflows.
  - The stale-tab FORBIDDEN test passed already, as expected: it covers an existing branch.
- **Writing closed → no pen:** not e2e-testable. `EVENT_END_AT` is frozen server env, and `next dev` holds a dist-dir lock, so a second dev server cannot start. Instead I verified it one-off: the same build ran on :3100 (window open) and :3101 (`EVENT_END_AT=2026-11-15T00:00+07:00`). **16/16 checks pass:**
  - pen present when open and absent when closed, on both the feed card and the Highlight card;
  - launcher disabled when closed;
  - no pen on the detail page in either window.
  - Script: `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\verify-writing-closed-hides-pen.mts`. Evidence: `{desktop,mobile}-08-writing-closed-owner-card-no-pen.png`.

## Commands (final)
| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test:unit` | exit 0: 28 files, 367 passed |
| `npm run build` | exit 0: `/kudos` is ƒ, `/kudos/[id]` is ◐. This settles the reviewer's open "build once" item. |
| `PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test tests/e2e/kudos-feed tests/e2e/kudos-authoring` | **27 passed, 2 failed**: both are the detail 404 status on the production server (Concern 2), not caused by this change |
| one-off writing-window check (:3100 open + :3101 closed) | 16/16 PASS |

Logs are in the scratchpad as `p05uifix-*.log`. Afterwards: 0 rows in auth.users, profiles, kudos, kudo_images, kudo_image_uploads, domain_event_outbox and storage `kudo-images`. Ports 3100 and 3101 are free (my servers are stopped). Port 3000 (not mine) was left running.

## Screenshots
Recaptured on the production build, desktop 1440x900 and mobile 375x812, in `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-05/`:
- every earlier file (`01`–`07`), including the board, the open filter list and the detail page;
- new: `08-writing-closed-owner-card-no-pen`.

Capture script: `...\scratchpad\capture-phase-05-ui-fix-screens.mts` (the earlier script, with the base URL from `CAPTURE_BASE_URL`).

## Concerns
1. **There is no automated regression test for "writing closed → no pen".** Options, both outside my ownership:
   - (a) A unit render test of `KudoCard` (`writingOpen=false`) under `tests/unit/kudos-feed/`, with `vi.mock` of the composer modal and `NextIntlClientProvider`. Not prototyped.
   - (b) A Playwright project with a second `next start` server whose `EVENT_END_AT` is in the past (config/CI change).
2. **The detail page answers 200, not 404, in production** for an unknown id, a malformed id, or someone else's spam. The body is the uniform not-found copy, and Next adds `noindex`, so there is still no existence oracle. The route is ◐, and per the Next docs `instant = false` only opts the segment out of validation; it does not stop streaming. The earlier "real 404" claim held only in dev.
   - Fix needs a decision. Either check in the proxy (malformed uuid → 404; unknown or others' spam would need a light lookup), or accept the soft 404 and relax the two e2e status assertions to production behaviour.
   - Files: `proxy.ts`, `shared/auth/session-proxy.ts`. Not mine to change.
3. **The dev server on :3000 is broken for dynamic routes.** `/kudos/[id]` and `/api/kudos/[id]/edit` return 500 with "Jest worker encountered 2 child process exceptions". The static-paths child crashes on every request; static routes still work. I was not allowed to stop that server (not mine). **The tester must restart `next dev` before the full run.**
   - Possible trigger, not proven: `npm run typecheck` deletes `.next/dev/types` and runs `next typegen` while dev is running; the first crash came right after it.
4. Copy Link now holds one empty polite live region per card, including cards appended by load-more. This was the minimal fix the brief asked for; a single page-level toast host would be cleaner.
5. `public/images/kudos-composer/ic-pencil.svg` is now an orphan asset. `public/` is outside my ownership.
6. Decision-log follow-ups for the orchestrator:
   - FORBIDDEN in the edit loader is kept, because a stale tab after an account switch can reach it;
   - the launcher placeholder is kept;
   - choose a direction for the production 404 (Concern 2).

Docs impact: none in `docs/`. Next.js feedback: one draft (the dev worker crash). The review form did not open automatically (not retried, per the protocol). Its URL is in `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\feedback-p05uifix\url.txt`. Nothing is sent until the user submits it.
