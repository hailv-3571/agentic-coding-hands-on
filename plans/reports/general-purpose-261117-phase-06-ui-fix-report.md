---
phase: 06
feature: F005 heart button, F011 Admin › Settings
role: implementer (UI review fix round)
date: 2026-11-17
status: DONE
---

# Phase 06 UI fix round

Fixes for `reviewer-261117-phase-06-ui.md` (warnings 1–5 and the cheap suggestions), plus the e2e stability decision. Nothing staged, committed or pushed. No server code, schema, migration or message file was changed.

## Scope Contract
- **Changed:** heart UI (`features/kudos-hearts/components/**`), admin dialogs and row menu (`features/admin-campaigns/components/**`), e2e specs and fixtures (`tests/e2e/kudos-hearts/**`, `tests/e2e/admin-campaigns/**`), one unit test, `playwright.config.ts`.
- **Impacted:** every e2e spec (worker cap in the config), the Live board and detail page (heart button on every card), Admin › Settings.
- **Will verify:** typecheck, lint, unit (full), the FULL Playwright suite twice, build; dev server health after typecheck and build.
- **Deliberately skipped:** integration tests. No server code changed; they were 269/269 in the tester run.

## Fixes

| # | Finding | Fix | Files |
|---|---|---|---|
| 1 | Esc dead after a disabled button dropped focus to `<body>` | The frame now listens for Esc on `document` (still ignored while busy; skips events already `defaultPrevented`). Dialog buttons lock with `aria-disabled` plus click guards instead of `disabled`, so focus stays on them. The button styles moved from `disabled:` to `aria-disabled:` variants. Focus trap and return-to-opener unchanged. | `campaign-dialog-frame.tsx`, `campaign-form-modal.tsx`, `campaign-delete-dialog.tsx`, `campaign-settings-styles.ts` |
| 2 | Active-campaign e2e flakes on 23P01 | New fixture `campaigns.seedActive(label, {fromNowMs, toNowMs})` uses the EXCLUDE constraint as the lock. It retries the insert for up to 10 s. A stale `E2E-…` leftover (created more than 10 min ago, from a killed run) is deleted. A live window from another test is waited out. Any other overlapping row (real data, an integration run) fails the seed and names it. The test assertions are unchanged. | `campaign-e2e-fixtures.ts`, `settings-crud.spec.ts` |
| 3 | Highlight e2e can be crowded out of the top 5 | Checked usage: other specs seed or filter by `high-performing`, `be-professional`, `be-a-team` and `wasshoi` only. Added `HIGHLIGHT_ONLY_HASHTAGS` (reserved, documented): the ranking test keeps `think-outside-the-box`, the new sync test uses `get-risky`. Added the helper `filterHighlightByHashtag`, which waits for the filtered response. Both Highlight tests moved to their own spec. | `kudo-heart-e2e-fixtures.ts`, `heart-highlight-ranking-and-sync.spec.ts`, `heart-toggle.spec.ts` |
| 4 | Cross-copy sync untested | **E2E:** heart a Kudo in the filtered Highlight, then check that the same Kudo in All Kudos flips to hearted with 1. Take it back in All Kudos, then check the Highlight copy returns to 0. **Unit:** the pure logic was extracted to `heart-summary-store.ts` (store, `publishHeartSummary`, `resolveHeartSummary`). `use-shared-heart-summary.ts` is now the hook only. The tests cover: no entry gives the props; the same base gives the published answer, per Kudo; fresh props beat a stale entry (count change, and `heartedByMe` change); subscribers are notified until they unsubscribe. | `heart-summary-store.ts` (new), `use-shared-heart-summary.ts`, `kudo-heart-button.tsx`, `tests/unit/kudos-hearts/heart-summary-store.test.ts` (new) |
| 5 | Blocked heart silent on touch | `toggle()` calls `setFailure(blockedBy)` when blocked and sends nothing. The existing toast shows the reason. The hover and focus tooltip is kept. | `kudo-heart-button.tsx` |

**Cheap suggestions**
- **Heart toast:** a persistent `role="alert"` region, empty until a failure, mounted after hydration. This is the same `useHydrated` pattern as the Copy Link toast host.
- **Row menu Tab:** focus goes to the trigger first, then the menu closes.
- **Tooltip:** Esc dismisses it (WCAG 1.4.13) through a document listener on blocked buttons only. Pointer-enter or focus shows it again.
- **Thin wrappers:**
  - Dropped the `focusRing` re-export from `campaign-settings-styles.ts`; the row menu imports it from `shell-styles`.
  - `KudoCardHeartSlot` and its file are kept (the documented seam), so no `kudo-card*` file was touched.
- **Store reset on sign-out:** skipped. It is not a one-liner, and the sign-out code is outside my ownership.

**E2E stability (decided):** `playwright.config.ts` now has `workers: process.env.CI ? undefined : 3`, with a one-line comment on why. Timeouts are unchanged. Before the runs I stopped the long-running dev tree on :3000 (PID 42312 down to the `start-server.js` child at 1.7 GB working set) and started a fresh `npm run dev` in the background. It served `/login` 200 before any test ran.

## Test evidence

**RED before the fix (finding 1).** I wrote `settings-dialog-escape.spec.ts` first and ran it on the old code: 2 failed.
- `body` was focused after the failed save or delete.
- In a temporary copy without the focus assertion, Esc left the dialog open (`toHaveCount(0)`: received 1). The copy was deleted.

After the fix, it passes.

**Mutation checks.** Each new assertion was run against a temporarily broken build, then the code was restored.

| Mutation | Result |
|---|---|
| No Esc listener on the tooltip | own-Kudo test fails at the Esc step |
| No `setFailure(blockedBy)` | own-Kudo test fails at the toast assertion |
| Shared store ignored (`useSharedHeartSummary` returns the props) | sync e2e fails: the heart does not stick after the server answer |
| `resolveHeartSummary` ignores `base` | unit test "fresh server props beat a stale entry" fails |

**`seedActive` against real blockers** (planted with a scratch script):
- A stale `E2E-` row covering now was deleted, and the test passed.
- A live blocker released after 6 s was waited out: the test passed in 5.1 s instead of 1.3 s.
- No rows were left after either check.

**One test-side timing fix.** The tooltip Esc check presses Esc inside `expect(...).toPass({ timeout: 10_000 })`. The server HTML already shows the CSS hover tooltip, but the Esc listener is a document listener, and React does not replay a key press made before hydration (it does replay clicks). Without the retry the test pressed too early, 3 of 3 times. The assertion is not weaker: if Esc never hides the tooltip, the test still fails.

| Command | Exit | Result |
|---|---|---|
| `npm run typecheck` | 0 | Dev afterwards: `/login` 200, `/kudos` 307 |
| `npm run lint` | 0 | No problems |
| `npm run test:unit` | 0 | 36 files, 438 passed (was 434; +4 store tests) |
| `npx playwright test` (run 1) | 0 | **71/71** passed, 44.8 s |
| `npx playwright test` (run 2) | 0 | **71/71** passed, 46.5 s; slowest test 4.4 s |
| `npm run build` | 0 | Compiled, 18 static pages, no warnings; `/admin/settings` is ƒ |
| Dev after build | – | `/login` 200, `/kudos` 307, `/admin/settings` 307 (signed-out redirect). No 500 |

- E2E count went from 68 to 71: 2 Esc tests and 1 sync test were added, and the ranking test was moved.
- The suite now takes about 45 s, against 2 minutes at 6 workers before.

**Leftover rows after the last run:** 0 in each of `kudos`, `kudo_hearts`, `kudo_hashtags`, `kudo_images`, `kudo_image_uploads`, `campaigns`, `domain_event_outbox`, `profiles`, `auth.users` and `storage.objects` (`kudo-images`).

## Screenshots (`plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-06/`)

New states, each at `-desktop-1440x900.png` and `-mobile-375x812.png`, captured with a temporary spec (deleted afterwards) and checked by eye:
- `heart-own-kudo-blocked-toast`: the sender pressed their own heart with no hover and no focus (the touch case). The toast "Bạn không thể thả tim cho Kudo của mình" shows, and the tooltip is hidden.
- `settings-add-modal-save-failed`: a save failed after a keyboard submit. "Không lưu được, vui lòng thử lại" shows, and focus (with its gold ring) stays on "Add Campaign" inside the dialog.

The existing 18 files were not recaptured. None of the states they show changed visually:
- The `aria-disabled` styles appear only while saving.
- The toast region is empty and has no size until a message is shown.
- The tooltip's look is unchanged.

## Files
- **Modified:**
  - `features/kudos-hearts/components/kudo-heart-button.tsx`, `kudo-heart-error-toast.tsx`, `use-shared-heart-summary.ts`
  - `features/admin-campaigns/components/campaign-dialog-frame.tsx`, `campaign-form-modal.tsx`, `campaign-delete-dialog.tsx`, `campaign-row-menu.tsx`, `campaign-settings-styles.ts`
  - `tests/e2e/kudos-hearts/heart-toggle.spec.ts`, `kudo-heart-e2e-fixtures.ts`
  - `tests/e2e/admin-campaigns/campaign-e2e-fixtures.ts`, `settings-crud.spec.ts`
  - `playwright.config.ts`
- **Created:**
  - `features/kudos-hearts/components/heart-summary-store.ts`
  - `tests/unit/kudos-hearts/heart-summary-store.test.ts`
  - `tests/e2e/kudos-hearts/heart-highlight-ranking-and-sync.spec.ts`
  - `tests/e2e/admin-campaigns/settings-dialog-escape.spec.ts`
  - 4 screenshots
- **Largest touched file:** `settings-crud.spec.ts`, 187 lines. All touched files are under 200 lines.
- **Scratch only:** `plant-active-campaign-blocker.mjs`, `count-leftover-test-rows.mjs`, the e2e and build logs, and `dev-server.log`, all in the session scratchpad.

## Notes and deviations
- **No serial mode.** `test.describe.configure({ mode: "serial" })` only orders tests inside one worker. It does not stop other files, workers, repeats or an integration run from holding "now". Waiting on the constraint covers all of them.
- **Duplicated `useHydrated`.** The heart toast has its own 7-line `useHydrated`. The Copy Link button keeps a private copy in `features/kudos-feed`, which I may not edit. It could be shared later.
- **Known, unchanged:** Firefox shows a double calendar icon on `datetime-local` (review note 12).
- **Untested error path:** the `seedActive` failure for a non-E2E active campaign (it throws after 10 s, naming the campaign) was not exercised.
- **Next.js feedback:** no candidates in this round.
- **Docs impact: minor.** I don't own these files, so they are not changed.
  - Suggested decision-log lines:
    - A blocked heart press shows the reason in the toast.
    - Esc dismisses the tooltip.
    - Admin dialog buttons lock with `aria-disabled`.
    - `get-risky` and `think-outside-the-box` are reserved for the Highlight e2e tests.
    - The local worker cap of 3 is applied.
  - A changelog entry.

**Status:** DONE
**Summary:** The 5 review warnings and the cheap suggestions are fixed. Dialog Esc works after a failed write: the Esc listener is on the document and focus stays on the `aria-disabled` buttons. The active-campaign seed waits on the constraint and cleans up stale leftovers. The Highlight tests filter by reserved hashtags. There is a new cross-copy sync e2e and a unit test of the extracted store. A blocked heart press shows its reason in the toast. The heart toast is a persistent live region. Typecheck, lint, unit (438), build and two full e2e runs (71/71 each, about 45 s at 3 workers on a freshly restarted dev server) are green, with no rows left behind.
**Concerns/Blockers:** None blocking. Integration tests were not re-run, by contract. The decision log and changelog need the lines above from their owner.
