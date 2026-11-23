# Implementer report: edit-kudo toast destroyed by the feed remount (debugger-261123 B)

Date: 2026-11-23 · Role: implementer, RED-first · Stack: Next.js 16.4.5 dev on :3000 (reused), local Supabase, Playwright 1.65.1.

## Fix
The composer's success toast moved out of the card subtree into one host in the Sunner-area layout.
- New `features/kudos-authoring/components/kudo-composer-toast-host.tsx` (33 lines): a client context provider. It holds `{ message } | null` and renders the existing `KudoComposerToast` once, after `children`. `useShowComposerToast()` returns a stable `show(message)` and throws if no host is mounted.
- `app/(app)/layout.tsx`: wraps the page content in `<KudoComposerToastHost>`. The layout persists across `router.refresh()` and navigations, so a remount of `AllKudosFeed key={feedKey}` (or a carousel or profile list) can no longer destroy the toast.
- `kudo-composer-modal.tsx`: the local toast state is gone. `handleSaved` calls `showToast(t("toast.updated" | "toast.created"))`, then closes and calls `onSaved`, as before. A closed modal now renders `null`.
- `kudo-composer-toast.tsx`: the prop is now `notice: { message } | null` instead of `message: string | null`. Each save is a new object, so a second save within 4 s restarts the timer. Before, the timer was not restarted for an identical string. That case only appears now because there is one shared host. `role="status"`, `aria-live="polite"`, the copy (`toast.created` / `toast.updated`), the 4000 ms duration and the classes are unchanged.
- Comments corrected in `kudo-owner-edit-button.tsx` and `locked-recipient-composer.tsx`, which said the modal stays mounted "so the toast survives". Mount logic is unchanged.
- Reuse check: the shell has no toast system. The copy-link, heart-error, campaign and spotlight toasts are each feature-local. So the existing `KudoComposerToast` is reused as the single presenter, and no new presentational component was added.

## All composer success paths (one toast each, no double-show)
| Mount point | Before | After |
|---|---|---|
| `/kudos` launcher (create) | modal toast in `main` (outside keyed feed, OK) | host toast |
| Card pen, All Kudos feed / Highlight carousel / profile list (edit) | modal toast portalled from inside the card, lost on remount (**bug**) | host toast |
| Hover card "Gửi KUDO" on a feed card (create) | same subtree, lost on remount. A new public kudo always changes the first page, so this almost always flashed | host toast |
| Profile "Gửi lời cảm ơn…" pill (create) | modal toast | host toast |

Every `KudoComposerModal` is under `app/(app)/` (`/kudos`, `/profile/[userId]`); admin pages do not mount it. Each mounted modal used to add its own empty `role="status"` region. Now there is exactly one, and it is always mounted, which is better for screen-reader announcements. No spec counts unscoped `status` regions (grep checked).

## RED → GREEN
- Durable regression test added to `tests/e2e/kudos-authoring/edit-kudo.spec.ts` (83 → 104 lines): "keeps the saved confirmation when someone posted a newer Kudo before saving".
  - It opens the editor and changes the body. It then seeds a public kudo with `created_at = newest public kudo + 1 min`, so the first page is guaranteed to change, even while other workers seed.
  - It saves, waits until the card shows the new body (the refreshed feed has committed), then asserts the toast is visible.
- New fixture helper `newerThanEveryPublicKudo()` in `kudo-e2e-fixtures.ts` (143 → 155 lines).
- **RED** on the unfixed code, `-g "newer Kudo" --repeat-each=3 --workers=1`: exit 1, 3/3 failed at `edit-kudo.spec.ts:85` (`getByRole('status').filter({ hasText: 'Đã lưu thay đổi.' })`, `element(s) not found`). The failure snapshot shows the intended reason:
  - "Một Kudo mới hơn" tops ALL KUDOS above the edited card, which shows "Cảm ơn bạn, đã sửa lại";
  - every `status` region is empty.
- **GREEN** after the fix, same command: exit 0, 3/3 passed.
- Mechanism check on the fixed code: the debugger's instrumented repro was copied in temporarily, run, then deleted (0 `zz-*` files in `tests/e2e`).
  - Newer kudo: `cardRemounted:true`, toast visible from 181 ms and still visible at 425 ms (before the fix: gone at about 355 ms).
  - Control: `cardRemounted:false`, toast visible.
  - So the feed still remounts, and the toast now survives it.
- No unit test: no pure logic came out of this (a context plus a state setter).

## Gates (serial; `busy.ps1` printed FREE before each Playwright run)
| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | 0 | clean |
| 2 | `npm run lint` | 0 | clean |
| 3 | `npm run test:unit` | 0 | 86 files, 943 tests passed |
| 4 | `edit-kudo.spec.ts --repeat-each=10 --workers=3` | 0 | **30 passed** (48 s). The new test took 3.4–4.3 s per run in total, so save → refresh commit fits well inside the 4 s toast |
| 5 | full `npx playwright test --timeout 90000 --workers=3`, run 1 | 0 | 142 passed, 5 skipped, 0 failed, 0 flaky (2.4 m) |
| 6 | full, run 2 | 0 | 142 passed, 5 skipped, 0 failed, 0 flaky (2.4 m) |
| 7 | full, run 3 | 0 | 142 passed, 5 skipped, 0 failed, 0 flaky (2.4 m) |

142 = the debugger's 141 + the new test. The 5 skips are pre-existing. Integration was not run, per the brief. Logs are in the scratchpad: `toast-fix-red.log`, `toast-fix-green.log`, `toast-fix-edit-repeat10.log`, `toast-fix-full-run-{1..3}.log`, `toast-fix-red\error-context.md`.

## Scope Contract
- **Changed:** who owns the composer's create/edit success toast (modal → layout host); the toast's prop shape; one e2e regression test plus one fixture helper.
- **Impacted:** every composer success path (launcher, card pen, hover card, profile pill) on `/kudos` and `/profile/[userId]`; the `(app)` layout render.
- **Verified:** e2e, the lowest layer that reproduces a client remount race. That covers the new RED/GREEN test, the edit spec ×10, and 3 full suites, which include `compose-kudo*`, `profile.spec` (profile pill toast), `profile-hover-card*` and the live-board specs. Plus tsc, lint and unit.
- **Deliberately skipped:** integration/backend (no server, action or DB change).

## Behaviour notes (deliberate, small)
1. The toast now outlives a client navigation inside the Sunner area for the rest of its 4 s. Before, it went away with the page subtree.
2. Rendering `KudoComposerModal` outside `app/(app)/` now throws a clear error. Today no route does that. A future mount point outside `(app)` must add the host.
3. Docs impact: minor. Nothing in `docs/` describes who owns the composer toast (grep checked). The changelog entry for this bug fix is for the doc-writer / delivery-tracker.

## Concerns
- `profile-hover-card.spec.ts` ("Gửi KUDO" from a feed card) does not assert the "sent" toast. That path had the same latent bug and is now fixed by the same structural change. It is not covered by a separate assertion: per the one-owner-test-per-contract rule, the edit regression owns "the toast survives a feed remount". A one-line assertion can be added there if the owner wants per-path coverage.
- Next.js feedback pass: no qualifying Next.js friction, so the command was not run.

**Status:** DONE
**Summary:** The composer success toast moved from the modal (inside keyed cards) to a `KudoComposerToastHost` context in `app/(app)/layout.tsx`, so the `feedKey` remount after a save no longer destroys it. The new e2e regression failed 3/3 before the fix for the intended reason and passed 3/3 after it. The edit spec passed 30/30 at repeat-each 10, and 3 consecutive full suites each passed 142 with 0 failed and 0 flaky.
**Concerns/Blockers:** None blocking. Notes: the toast now persists across in-area navigation; the composer requires the host (all current mounts have it); the hover-card send path is fixed but not separately asserted.
