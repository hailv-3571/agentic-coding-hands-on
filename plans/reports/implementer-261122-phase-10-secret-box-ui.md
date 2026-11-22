# Phase 10 — Secret Box rewards UI (F010) — implementer report

Date: 2026-11-22 · Role: implementer (UI + client state machine, RED-first for logic) · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-10-secret-box-rewards.md` step 11 / SM-002 / UI success criteria

## Scope Contract
- **Changed:** new `features/secret-box-rewards/components/**` (rewards column, stats panel, winners list, button + tooltip, launcher + deep link, modal + states, SM-002 opener, icon collection); `messages/{vi,en}.json` → new `secretBox` namespace only; new unit and e2e tests in my folders.
- **Impacted:** the Live board layout (the backend seam renders `RewardsColumn` next to the 680 feed); the phase 12 profile (`PersonalStatsPanel`, `IconCollection`); phase 13 deep link `/kudos?secretBox=open`.
- **Will verify:** the opener state machine and formatters (unit); every UI flow against the real route handlers (e2e); Live board + Hero badge e2e for layout impact; desktop and mobile screenshots compared with Figma.
- **Deliberately skipped:** integration tests (backend-owned, already green per its report); animation timing (Figma marks it prototype-only).

## Files
All new, each under 200 lines, in kebab-case.

`features/secret-box-rewards/components/`
| File | What |
|---|---|
| `rewards-column.tsx` | `RewardsColumn({ data })`: an `<aside>` ("Phần thưởng Secret Box"), 422 px (`lg:w-105.5`) next to the feed, full width under it below `lg`, gap 24 |
| `personal-stats-panel.tsx` | `PersonalStatsPanel({ stats })` (`dl`):<br>• 5 rows; the x2 flame only when `campaignActive`; divider before "đã mở"<br>• numbers via `useFormatter`<br>• `null` → error + retry; the launcher still mounts so the deep link works |
| `latest-gift-winners-list.tsx` | h3 title on 2 lines, plus a focusable `ol` list:<br>• about 5 rows visible; 2 px #999 WebKit thumb<br>• `UserAvatar` (initial fallback); name truncated with `title`<br>• empty state "Chưa có Sunner nào nhận quà."; `null` → error + retry |
| `open-secret-box-button.tsx` | Gold button:<br>• at 0 boxes: `aria-disabled` (stays focusable), plus a tooltip "Bạn chưa có Secret Box nào"<br>• tooltip shows on mouse hover / keyboard focus / tap toggle, closes on Esc, and is the button's accessible description |
| `secret-box-launcher.tsx` | Opens from the button or `?secretBox=open` (`useSearchParams`). On close:<br>• `router.refresh()`<br>• strips the param via `history.replaceState`, keeping other params<br>• returns focus to the button, also after a deep-link open |
| `secret-box-modal.tsx` | Dialog in a body portal (the Live board `main` isolates stacking under the sticky header):<br>• mask `bg-background/80`; reuses `useFocusTrap`; body scroll lock; `aria-busy` while opening<br>• X / Esc / mask click close, all locked while opening<br>• error toast inside the dialog |
| `secret-box-modal-states.tsx` | Hint line, 557² stage (3 frames stacked, `unoptimized` so frame switches never wait), prize layer, prize name, "Secretbox chưa mở 05" counter, sr-only `role=status` announcement |
| `secret-box-opener.ts` | Framework-free SM-002 controller plus the Idempotency-Key policy (15 s request timeout) |
| `use-secret-box-opener.ts` | React binding (`useSyncExternalStore`), one opener per modal mount, 900 ms min opening frame (0 under reduced motion) |
| `use-secret-box-stage-motion.ts` | WAAPI wobble (opening) and reveal (result); nothing under `prefers-reduced-motion` |
| `icon-collection.tsx` | `IconCollection({ slots, label? })` (phase 12):<br>• always 6 circles in `SECRET_BOX_ICON_CODES` order<br>• grey empty circle when not owned; gold `×N` badge when quantity > 1<br>• accessible name per circle ("REVIVAL, chưa có", "STAY GOLD, số lượng 3") |
| `secret-box-icon-image.tsx` | Phase 07 badge cropped to its circle (the 128 px circle at the top centre of a 160 px tile → image at 125 % width, −12.5 %) |
| `secret-box-format.ts` | `formatBoxCount`, `secretBoxIconSlug` / `secretBoxIconImage`, `orderIconSlots`, `newIdempotencyKey` (uuid v4 from `getRandomValues`; works outside secure contexts) |
| `secret-box-styles.ts`, `secret-box-error-toast.tsx`, `rewards-status-message.tsx` | Tokens-only class strings; error toast (`role=alert`); panel empty/error + "Thử lại" (`router.refresh()` in a transition) |

**i18n:** `secretBox.{column,stats,openButton,noBoxTooltip,retry,winners,modal,iconCollection}` in vi (Figma/spec verbatim) and en. Other keys are byte-identical (checked by a JSON round-trip). Icon names reuse `awardsPortal.rules.badges.*`, the same source as the Thể lệ page.

**Tests:**
- `tests/unit/secret-box-rewards-ui/secret-box-opener.test.ts` (15), `secret-box-format.test.ts` (4).
- `tests/e2e/secret-box-rewards/secret-box-e2e-fixtures.ts`, `rewards-column.spec.ts` (4), `secret-box-open-flow.spec.ts` (4).

**Evidence:** `plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-10/`, with each view at desktop 1440×900 and mobile 375×812:
- `phase-10-live-board-rewards-column-*`
- `phase-10-secret-box-modal-idle-*`
- `phase-10-secret-box-modal-result-*`

## Idempotency-Key policy (SM-002)
- Every click gets a new key.
- **Same key on retry:** when the outcome is unknown, the key is kept and the next click (= the retry) re-sends it, so the server replays. Unknown outcomes are: network error, the 15 s timeout, 5xx, 401, or an unreadable 200.
- **Key dropped:** only on a definite answer (200, 409 → empty, 400 rejected key).
- **Box lock:** the box is locked while loading and opening. A result is shown in the "result" phase, from which the next click opens the next box (Figma 1466:7614 keeps the hint and counter under the icon).

## RED → GREEN
| Slice | RED | GREEN |
|---|---|---|
| Opener state machine + formatters (unit) | both modules missing (import failure) | 19/19 |

## Gates (final code)
| Gate | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Unit | `npm run test:unit` | 54 files / 703 tests passed |
| E2E (mine) | `npx playwright test tests/e2e/secret-box-rewards --repeat-each=2 --timeout=90000` | 16/16 passed (8 tests × 2) |
| E2E impact | `npx playwright test tests/e2e/kudos-feed tests/e2e/hero-badges --timeout=90000` | 22/22 passed |
| Integration | not run (forbidden for this role; backend report: 58 files / 393 passed) | — |

E2E coverage, against the real handlers:
- Column with and without boxes: zeros, dimmed button, tooltip on hover/focus/Esc, a click opens nothing.
- Grant from hearts on the user's SENT kudos; the recipient gets none.
- Winners list with the real name + "Nhận được {gift}".
- Phone stacking.
- Full modal flow: focus on the box → Enter → `aria-busy`, Esc ignored → result → next click → 00 → Esc → column refreshed (2 opened / 0 unopened), button disabled and focused.
- Network failure after the server opened the box: toast, still waiting, DB shows 1 opened; the retry sends the **same uuid v4 key**, the answer has `replayed: true`, and nothing extra is opened.
- 409 (box taken out of band): empty state, 00, box locked.
- Deep link: opens; mask click closes; param removed; focus on the button; reopening from the button works.

## Visual comparison with Figma
- **Matches:** column 2940:13488 (panels, rows, x2 flame, button, winners rows); modal idle 1466:7676; opening 1466:7024; icon result 1466:7614; gift result 2995:15754 (title broken over 2 lines with `text-balance`, hint hidden, name under the box).
- **Mobile:** smaller labels/values and winner rows (16/24, 24/32, 48 px avatar), so text fits 343 px; the modal scales down and its title wraps.

## Deviations (orchestrator defaults; flag for user review)
1. **Footer counter on gift / completed-set results:** kept, although Figma 2995:15754 has none. Screen spec E04 says "Always", and the user needs the count to keep opening. The hint is hidden there as in Figma, which keeps the panel within 900 px.
2. **Hint vs. spec E02 (Figma wins):** the hint stays visible while opening (Figma 1466:7024) and on an icon result (1466:7614). With 0 boxes left after an icon result, the line shows E11 "Bạn chưa có Secret Box nào để mở".
3. **Completed set (setCompleted):**
   - Title "Chúc mừng…"; the won icon on the open box.
   - A small line "Bạn đã sưu tập trọn bộ 6 icon" (E09 copy is INFERRED in the spec; BTC to confirm), then `giftName` in large gold text.
   - The 2995:15708 "gift intro with an unopened box" two-step reveal is not built (no server state for it).
4. **Gifts:** no product photo (decision log); a soft gold radial glow over the open box, plus the prize name.
5. **Close while opening:** blocked (X / Esc / mask) so the prize is never missed. The 15 s request timeout bounds the lock.
6. **Disabled button:** uses `aria-disabled` (keeps focus and the tooltip reachable) instead of `disabled`.
7. **Modal loading and unavailable states** (not drawn): "--" pulsing counter; "Không tải được số Secret Box. Vui lòng thử lại." + "Thử lại" (my copy).
8. **IconCollection circle size:** 64 px chosen without the profile frame 362:5097 at hand; phase 12 may adjust.

## Concerns
1. **DEC-002 E08 "Bạn đã có icon này rồi" is not shown:** `OpenSecretBoxResult` has no duplicate flag (the backend flags the same gap). An optional `duplicate` field would enable it.
2. **Icon sharpness on the result:** the phase 07 badges are 160 px wide, so the 185 px circle upscales about 1.45× (slightly soft). A ≥ 2× export of the 6 circles would sharpen it.
3. **Local gift stock consumed by e2e:** real draws took 1 unit of `gift-ao-phong-saa` (49/50 remaining). Box rows are removed with the test users; the stock-safe loader keeps the issued count, so `npm run db:reset` restores it if needed.
4. **The retry key lives only as long as one modal mount:** if the modal is closed after a network failure, the pending key is dropped. The box is never lost (the server keeps the opened result), but the user would not see that prize until the winners list or the stats show it.
5. **Hosts must use `<Suspense>`:** with `cacheComponents`, any host of `PersonalStatsPanel` must render it under a `<Suspense>`, because the launcher reads `useSearchParams`. Documented in the component; the Live board seam has its own boundary.
6. **No docs updated:** `docs/` belongs to the doc-writer. Reviewer and code-simplifier were not run (orchestrator chain).
7. **Temporary files deleted:** the preview route `app/(app)/zz-secret-box-ui-preview/` and the temp specs, after use.

Next.js feedback pass (AGENTS.md): no qualifying Next.js friction retained.
