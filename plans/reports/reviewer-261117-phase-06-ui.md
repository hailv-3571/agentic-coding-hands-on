# Review: Phase 06 UI half (F005 heart button, F011 Admin Settings)

Scope: features/kudos-hearts/components/*, kudo-card-heart-slot/kudo-card/kudo-detail-view, app/(app)/kudos/[id]/page.tsx, features/admin-campaigns/components/*, app/admin/settings/page.tsx, messages (kudosHearts, adminCampaigns), tests/e2e/kudos-hearts + admin-campaigns, phase-06 screenshots (spot check: settings-table-mobile). Not run: e2e/integration/db. ESLint on all touched UI + e2e dirs: 0 findings. All files <200 lines (max 188). vi/en key parity for kudosHearts.* and adminCampaigns.*: complete, no hard-coded user strings found.

## Critical
None. No who-hearted or anonymous-sender data reaches the client: the button receives only count, heartedByMe, isOwner (isOwner is computed by the server on already-masked cards, and the sender is hidden by masking). Non-admin: app/admin/layout.tsx guards before any markup, list() and every action call requireAdmin(), and the e2e asserts 403 with no table or button.

## Warning

1. Dialog Escape dies after focus is lost. campaign-dialog-frame.tsx:313-317 and use-campaign-form.ts / campaign-delete-dialog.tsx:414-419. Escape is handled by React `onKeyDown` on the panel only. While saving or deleting, the focused submit or Cancel button becomes `disabled`, so focus falls to `<body>`; after a failed save or delete (form error / "Không xoá được") focus is still on body, so Escape does nothing until the user Tabs (the trap then pulls focus back). Fix: register Escape in a `document` keydown listener inside the frame (as use-focus-trap does) and skip when `busy`; or use `aria-disabled` and ignore clicks while pending so focus is never lost. Also re-focus `[data-autofocus]` after a failed attempt.

2. E2E isolation: active-campaign test (settings-crud.spec.ts:117-144) seeds a real *active* window (now-1h .. now+2h). Campaigns are global with an EXCLUDE no-overlap constraint: any pre-existing active/overlapping row in the dev DB, or a parallel worker/spec that also seeds an active campaign (phase 06 backend e2e, multiplier tests), makes `campaigns.seed` throw 23P01, a flake unrelated to the code. Fix: use the serial mode for the specs that need an active window (`test.describe.configure({ mode: "serial" })` plus one shared lock), or in the fixture delete overlapping E2E rows first and run this file with `workers: 1`; at minimum document that the DB must hold no active campaign.

3. E2E isolation: Highlight ranking test (heart-toggle.spec.ts:136-172) filters by hashtag `think-outside-the-box`, which is shared by every parallel feed spec. The Highlight shows only the top N by hearts; another worker's hearted Kudo with that hashtag pushes `older`/`newer` out, and `rankOf` then returns [] (poll timeout). Fix: seed a hashtag unique to the test (if the fixtures allow creating one), or seed enough hearts on both Kudos to outrank others — still racy; prefer unique hashtag or `test.describe.serial` for the file.

4. Cross-copy sync (the "shared last server answer") has no test. use-shared-heart-summary.ts is exercised only by single-copy flows; nothing asserts that hearting in the Highlight updates the same Kudo in All Kudos, nor that fresh server props beat a stale entry. This is the riskiest logic in the phase. Fix: add one e2e (heart a Kudo that appears in both lists; assert both buttons flip) plus a small unit test of `useSharedHeartSummary` (entry applies only while `base` equals the server props; new props win).

5. Disabled heart gives no feedback on touch. kudo-heart-button.tsx:98,131-139. The reason lives only in a hover/focus-within tooltip; iOS Safari does not focus a tapped button and phones have no hover, so a tap on a sender's own heart or after the event end does nothing visible. Fix: in `toggle()`, when `blockedBy`, `setFailure(blockedBy)` (shows the existing toast, no server call, count test `posts()===0` still holds). That also gives screen readers a live announcement of the reason.

## Suggestion

6. Tooltip is not dismissible with Escape (WCAG 1.4.13) and relies on `invisible`+`group-focus-within`. kudo-heart-button.tsx:131-139. Acceptable given reason is also `aria-describedby`; add an Esc handler or drop to toast per #5.

7. Heart error toast announces only on mount: `role="alert"` node is inserted already containing text via a portal (kudo-heart-error-toast.tsx:173-180). Most SRs announce, some miss it. campaign-settings-toast.tsx keeps a persistent region, which is the sturdier pattern; reuse that shape (persistent `role="status"`/`alert` wrapper, content toggled).

8. Row menu Tab handling (campaign-row-menu.tsx:48): `close()` unmounts the focused item while the browser does the Tab default, so focus restarts from a removed node. It works in Chromium (e2e passes) but depends on the browser's focus-navigation starting point. Fix: `triggerRef.current?.focus(); close();` before returning, so Tab moves on from the trigger.

9. Module-level store is never pruned or reset (use-shared-heart-summary.ts:14). Growth is bounded by Kudos hearted in a session (negligible), but entries survive a sign-out/sign-in in the same SPA session; a wrong value shows only if the new user's server props equal the old `base` (very unlikely). Cheap hardening: also compare `value` source via a `userId` in the key, or clear on sign-out.

10. Stale-phase menu (campaign-table.tsx:185): phase is from page-load time; a row that ended after load still shows the menu. Safe, since the server re-checks and returns ENDED, which maps to a toast plus refresh (use-campaign-form.ts:192, campaign-delete-dialog.tsx:389). DEC-001 matches server rules (ended: no menu; upcoming/active: Edit+Delete; active start read-only + omitted from update, DEC-002).

11. Minor dead weight: `KudoCardHeartSlot` is a pure pass-through (kudo-card-heart-slot.tsx:20); `campaign-settings-styles.ts:9` re-exports `focusRing` for one import. Both could be inlined; the first is the documented phase-05 seam, so leave unless you want fewer files.

12. `[&::-webkit-calendar-picker-indicator]` styling covers Chromium/Safari; Firefox shows its own icon plus the Figma icon (double icon). Accepted by the native-datetime-local decision; note in the report as known.

13. Heart tooltip/toast copy `kudosHearts.label` = "{count} hearts" is read together with the visible count span (aria-hidden), so the name is correct: "1 lượt thả tim". Fine. `Math.max(0, …)` on the optimistic count is a harmless guard.

## Edge cases checked
- Rapid clicks: `locked` ref blocks re-entry synchronously (before `pending` renders); double click yields one toggle (also asserted in e2e). The lock is released inside the nested `startTransition` together with publish, so a failure reverts via useOptimistic and shows the toast. A redirect (`unstable_rethrow`) leaves `locked` true, which is fine since the page is navigating away.
- Fresh server data wins: the entry applies only while `base` equals the card's server props, so reload / refetch / soft nav override it. Residual ABA case (server returns to exactly `base`) negligible.
- Two copies with different server props (stale Highlight vs fresh feed): only the copy whose props match `base` follows the shared entry; the other keeps its server numbers until refresh. Conservative, never wrong in the stale direction, but visibly inconsistent. Mention in docs.
- Revert: failure never publishes, so the optimistic overlay drops back to `confirmed`; server answers (`SELF_HEART`, `KUDO_UNAVAILABLE`, `EVENT_ENDED`) revert plus toast. Page left open past EVENT_END_AT stays enabled until the server refuses, which is handled.
- `list()` errors: page.tsx:19-27 rethrows via `unstable_rethrow` (403/redirect pass), other errors give the E14 state with a reload link. The form and delete helpers do the same for actions. Good.
- Mobile 375: screenshot of settings table shows no overflow; e2e asserts scrollWidth == clientWidth. Name column ellipsises as designed.

## Done well
- Server-first guards; DTO is client-safe with preformatted dates; no phase trust on the client.
- Reuse of useFocusTrap, useDismissable, DocumentBodyPortal; focus returns to the opener, with a fallback to "Add Campaign" when the row is gone.
- Menu keyboard pattern complete (Enter/Space/Down, Up/Down/Home/End, Esc returns focus); `aria-pressed`, `aria-busy`, `aria-describedby` for the reason, field errors via `aria-invalid`+`aria-describedby` with focus to the first bad field.
- Error mapping is total (VALIDATION fieldErrors, OVERLAP with conflict name, NOT_FOUND/ENDED close with toast, UNEXPECTED keeps the input).
- E2E asserts would fail on real bugs: DB row counts, zero server-action posts for the disabled heart, accessible names/descriptions, DB-level assertion that the active start stays unchanged.

## Actions in order
1. #1 Escape/focus after disabled buttons (document-level Escape).
2. #4 add the cross-copy sync test (e2e plus unit).
3. #2, #3 de-flake the two e2e tests (serial or unique data).
4. #5 toast on a blocked tap.
5. #7, #8, #6, #9 small a11y/robustness fixes; #11 optional cleanup.

## Numbers
- ESLint findings: 0 (UI + e2e dirs). Type check and unit tests not run (dev server may be running; not requested).
- Largest file: 188 lines (settings-crud.spec.ts); components <= 116.
- i18n parity: 0 missing keys in both locales.

## Unresolved
- Whether Highlight carousel renders cloned cards (infinite loop) with duplicate `data-kudo-id`; not verified, the shared store handles it either way.
- Figma pixel values checked only via the mobile table screenshot and the style constants' comments; the desktop screenshots were not compared pixel by pixel.

**Status:** DONE_WITH_CONCERNS
**Summary:** UI half is sound: server guards, DEC-001/DEC-002 match the server, the optimistic/shared-state logic is correct, no data leaks, i18n parity, lint clean. No critical findings; five warnings, mainly dialog Escape after focus loss, missing cross-copy sync test, two flaky-isolation e2e tests, and no feedback for a blocked tap on touch.
**Concerns/Blockers:** none blocking; fix warnings 1-5 before sign-off.
