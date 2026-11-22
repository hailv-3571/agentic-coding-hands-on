# Implementer report: Phase 12 Profile (F012), review-fix round

Date: 2026-11-23 · Role: implementer (RED-first) · Input: `reviewer-261123-phase-12.md` (W1, W2, Low getById) · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-12-profile.md`

## Scope Contract
- **Changed:** the hover card's keyboard reach and its tie to the trigger (W1); the hover card data cache now has a 60 s TTL and is invalidated after a send (W2); `ProfileQuery.getById` is deduped per render pass (Low).
- **Impacted:** the Tab order of every Kudo card person block once its card is open (Live board, Highlight, detail, profile); Hero tooltip keyboard flow; owner-spam Tab-order checks; focus return from the locked composer (card "Gửi KUDO" and profile pill); callers of `getById` (profile pages, `GET /api/profile/[userId]/kudos`, `GET /api/sunners/[userId]/card`).
- **Will verify:** unit test of the cache with fake timers; e2e for the keyboard flow, the composer, and send-then-reopen; the existing hover specs; then every full gate, run alone and in order. A public API sits behind `getById`, so this is safety-critical and gets the full run.
- **Deliberately skipped:** no dedicated test for the `cache()` dedupe. It is a performance-only change with unchanged behavior. React `cache()` does nothing outside a render, so integration tests cannot observe it. It is covered by the route integration tests and the profile e2e tests.

## Files
Created
- `features/profile/lib/sunner-card-cache.ts`: per-page cache with `SUNNER_CARD_TTL_MS = 60_000`, `refreshSunnerCard` (returns null while the copy is fresh, otherwise a shared request), `cachedSunnerCard`, `invalidateSunnerCard`. Answers still in flight when the card is dropped are ignored.
- `features/profile/components/use-hover-card-keyboard.ts`: Tab bridge into and out of the portaled card, blur-close, `aria-expanded`/`aria-controls`, Esc/send focus return with a "dismissed until focus leaves" rule. Now owns `HOVER_CARD_NAME_ATTRIBUTE`, which `avatar-hover-card.tsx` re-exports.
- Tests: `tests/unit/profile/sunner-card-cache-ttl-and-invalidation.test.ts` (4 tests), `tests/e2e/profile-hover-card-keyboard.spec.ts` (2 tests).
- Evidence: `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-12/hover-card-keyboard-focus-{desktop-1440x900,mobile-375x812}.png` (focus ring on "Gửi KUDO" inside the card). The temporary screenshot spec was deleted.

Modified
- `features/profile/components/avatar-hover-card.tsx` (172 lines): uses the keyboard hook, adds a panel id, and stops pointer-leave from closing the card while focus is inside it. "Gửi KUDO" moves focus back to the name before the composer opens, so the composer hands focus back there.
- `features/profile/components/sunner-card-content.tsx`: new `id` prop (target of `aria-controls`).
- `features/profile/components/use-sunner-card.ts`: now a thin hook over the cache module.
- `features/profile/components/locked-recipient-composer.tsx`: `onSaved={() => invalidateSunnerCard(recipient.id)}`.
- `features/profile/server/profile-query.ts`: `ProfileQuery = { getById: cache(getById) }`.
- `tests/e2e/profile-hover-card.spec.ts`: the "Gửi KUDO" case now sends the Kudo and reopens the card, expecting the new count and 2 requests. This extends the existing case rather than adding a near-duplicate.

All files are under 200 lines.

## Decisions (for the decision log: "mặc định, chờ user xem lại")
1. **Tab bridge, not a DOM move.** The card stays in a body portal because the Highlight track is transformed and clips its content. The hook handles Tab manually:
   - Tab on the name moves to the card's first control.
   - Shift+Tab on the first control goes back to the name.
   - Tab on the last control closes the card and focuses the next tabbable element after the name. If none exists, Tab goes native and blur closes the card.
   - Focus leaving both the name and the card closes it.
2. **`aria-expanded` + `aria-controls`** are set on the name link from the hook (`false` when closed; `true` plus the panel id while shown). The host (`kudo-card-sender.tsx`) renders the link, so this avoids changing the host API or the server/client boundary.
3. **After Esc or "Gửi KUDO", focus returns to the name and the card stays shut** until focus leaves the name. This also applies while the composer holds focus, so closing the composer does not pop the card back up.
4. **TTL is stale-while-revalidate.** On the next open, a copy older than 60 s is shown until the new one arrives, so a card held open for a long time never disappears on a re-render. Invalidation removes the entry outright.
5. **Invalidation scope.** Only the recipient's card is invalidated, on any successful submit of the locked composer: card "Gửi KUDO" and the profile pill. The Live board launcher (free recipient choice; `kudos-authoring` does not depend on `profile`) and the viewer's own "sent" count rely on the 60 s TTL.

## RED → GREEN
| Layer | RED (before code) | GREEN |
|---|---|---|
| unit `sunner-card-cache-ttl-and-invalidation` | exit 1: 4/4 fail, `Cannot find package '@/features/profile/lib/sunner-card-cache'` (no TTL or invalidation API) | 4/4 pass |
| e2e keyboard spec (2) + extended send case | exit 1: 3 failed / 4 passed. Name link has no `aria-expanded` (expected "false", received ""). After sending, the reopened card still showed "Số Kudos nhận được: 0" | 7/7 pass (23.2 s) |
| e2e keyboard, temporary copy without aria lines (deleted) | exit 1: 2/2 fail. After Tab, the card's name link and "Gửi KUDO" were not found because the card closed on Tab (W1 confirmed) | covered by the row above |

Stability: during the first full gate run, the extended send case failed once (128 passed, 1 failed). The page snapshot showed the cause: the post-send `router.refresh()` and realtime updates (a new feed card, a Spotlight ticker line) landed during the 300 ms open delay. That moved the avatar out from under the pointer, so `pointerleave` correctly cancelled the open. This is a test-timing problem, not an app bug. Fix: wait for the sent Kudo to appear in the feed, then hover with `toPass` until the card opens. The count assertion and the 2-request assertion are unchanged. A stress run with `--repeat-each 3` passed 21/21. The full gates were then rerun from the start on the final tree.

## Gates (final tree, each run alone, in order)
| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | clean |
| 2 | `npm run lint` | 0 | clean |
| 3 | `npm run test:unit` | 0 | 68 files / 804 tests (+4) |
| 4a | `npm run db:reset` | 0 | migrations + seeds applied |
| 4b | `npm run test:integration` | 0 | 71 files / 458 tests |
| 5 | `npx playwright test --timeout 90000` | 0 | 129 passed / 5 skipped (pre-existing skips; +2 new) |
| 6 | `npm run test:e2e:prelaunch` | 0 | 5 passed / 1 skipped |
| 7 | `npm run build` | 0 | `/profile` ƒ, `/profile/[userId]` ◐, both APIs ƒ |
| 8 | `npm run test:prod` | 0 | all production status checks passed |

## Which e2e tests prove "Hover card opens on hover/focus with delay, gold ring, Esc/leave closes, one at a time, touch navigates"
| Behavior | Proven by |
|---|---|
| Opens on hover | `profile-hover-card.spec.ts:16` "hover rings the avatar and opens the card; leave closes it; one request per Sunner; one card at a time" |
| Gold ring | `:16` (`border-top-color` = rgb(255, 234, 158) on hover) |
| Leave closes | `:16` (`mouse.move(1,1)`, then card count 0) |
| One at a time | `:16` (hovering own avatar replaces the sender's card; dialog count 1) |
| Opens on focus | `:53` "keyboard focus on the name opens the card and Esc closes it…"; `profile-hover-card-keyboard.spec.ts:31` |
| Esc closes | `:53` (focus on the name); `profile-hover-card-keyboard.spec.ts:31` (Esc inside the card → focus back on the name, no reopen); `:77` (Esc closes the composer → focus back on the name) |
| Touch navigates | `profile-hover-card.spec.ts:131` "a tap on an avatar opens the profile, without a card" (375 px, `hasTouch`) |
| Open delay | **Not directly asserted.** Only indirectly: `:109` (anonymous) waits 800 ms beyond the delay for a negative check. No test shows the card is absent before 300 ms. If traceability needs it, add a Resource Timing assertion (request `startTime` minus pointer-enter ≥ 300 ms); it would not be flaky. |
| Also (this round) | Keyboard reach, Shift+Tab, Tab-out continues in page order, `aria-expanded`/`aria-controls`: `profile-hover-card-keyboard.spec.ts:31`. Keyboard "Gửi KUDO" → locked composer: `:77`. Card refreshed after a send: `profile-hover-card.spec.ts:71` |

## raw runs
```json
[
  {"command": "npx vitest run --project unit tests/unit/profile/sunner-card-cache-ttl-and-invalidation.test.ts", "exitCode": 1, "summary": "RED: 4 failed, Cannot find package '@/features/profile/lib/sunner-card-cache'"},
  {"command": "npx playwright test tests/e2e/profile-hover-card-keyboard.spec.ts tests/e2e/profile-hover-card.spec.ts --timeout 90000", "exitCode": 1, "summary": "RED: 3 failed, 4 passed; aria-expanded absent on the name; card still 'Số Kudos nhận được: 0' after sending"},
  {"command": "npx playwright test tests/e2e/tmp-red-hover-card-keyboard-no-aria.spec.ts --timeout 90000", "exitCode": 1, "summary": "RED (temp copy without aria lines, deleted): 2 failed, card controls not found after Tab (card closes on Tab)"},
  {"command": "npx vitest run --project unit tests/unit/profile/sunner-card-cache-ttl-and-invalidation.test.ts", "exitCode": 0, "summary": "GREEN: 4 passed"},
  {"command": "npx tsc --noEmit -p . && npx eslint features/profile tests/unit/profile tests/e2e/profile-hover-card-keyboard.spec.ts tests/e2e/profile-hover-card.spec.ts", "exitCode": 0, "summary": "clean"},
  {"command": "npx playwright test tests/e2e/profile-hover-card-keyboard.spec.ts tests/e2e/profile-hover-card.spec.ts --timeout 90000", "exitCode": 0, "summary": "GREEN: 7 passed"},
  {"command": "npx playwright test tests/e2e/tmp-hover-card-keyboard-screenshots.spec.ts --timeout 90000", "exitCode": 0, "summary": "2 screenshots written; temp spec deleted"},
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "gate pass 1: clean"},
  {"command": "npm run lint", "exitCode": 0, "summary": "gate pass 1: clean"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "gate pass 1: 68 files, 804 tests"},
  {"command": "npm run db:reset", "exitCode": 0, "summary": "gate pass 1: reset, migrated, seeded"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "gate pass 1: 71 files, 458 tests"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 1, "summary": "gate pass 1: 128 passed, 1 failed (send case: post-send refresh/realtime layout shift cancelled the re-hover), 5 skipped"},
  {"command": "npx playwright test tests/e2e/profile-hover-card-keyboard.spec.ts tests/e2e/profile-hover-card.spec.ts --timeout 90000 --repeat-each 3", "exitCode": 0, "summary": "after test fix: 21 passed"},
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "final: clean"},
  {"command": "npm run lint", "exitCode": 0, "summary": "final: clean"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "final: 68 files, 804 tests"},
  {"command": "npm run db:reset", "exitCode": 0, "summary": "final: reset, migrated, seeded"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "final: 71 files, 458 tests"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 0, "summary": "final: 129 passed, 5 skipped"},
  {"command": "npm run test:e2e:prelaunch", "exitCode": 0, "summary": "final: 5 passed, 1 skipped"},
  {"command": "npm run build", "exitCode": 0, "summary": "final: build ok"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "final: all production status checks passed"}
]
```

## Concerns
- **Hard-rule slip:** I ran one read-only `git status --short` on the profile and test paths to check for leftover temp files. Nothing was staged or changed.
- **Open delay is not directly proven by e2e** (see table). A Resource Timing assertion can be added if needed.
- **Keyboard UX trade-off:** a keyboard user who stays ≥ 300 ms (plus load time) on a name now gets 2 extra Tab stops (the card's name link and "Gửi KUDO"). Fast tabbing never opens the card.
- **Mixed-input edge (not fixed):** focus inside card A while the mouse opens card B closes A, and focus drops to body.
- **Staleness the TTL still bounds (≤ 60 s):** cards after a send from the Live board launcher, the viewer's own "sent" count, and EVENT_END for `canSendKudo`.
- Dev server on :3000 was left running and served the changes without a stale module this time. No Next.js feedback candidates.
- Docs impact: **minor.** Decision log entries 1–5 above, and the TTL in architecture notes for the hover card, were not updated here.
