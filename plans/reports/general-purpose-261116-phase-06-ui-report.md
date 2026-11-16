---
phase: 06
feature: F005, F011
role: UI implementer
date: 2026-11-16
status: DONE_WITH_CONCERNS
---

# Phase 06 UI: heart button and Admin › Settings

Nothing was committed, staged or pushed. No server code, schema or migration was touched. The backend contract (`research/phase-06-backend-contracts.md`) was used as written; no mismatch was found.

## What was built

| Area | Files |
|---|---|
| Heart button (F005) | `features/kudos-hearts/components/kudo-heart-button.tsx` (useOptimistic + useTransition, ref and pending lock, revert and toast, `aria-pressed`, `aria-disabled` with a tooltip and description), `kudo-heart-icon.tsx` (inline Figma path: filled, or a 2 px `#D4271D` outline), `kudo-heart-error-toast.tsx` (body portal, `role=alert`), `use-shared-heart-summary.ts` (see D3) |
| Card seam | `features/kudos-feed/components/kudo-card-heart-slot.tsx` rewritten to render the button. `kudo-card.tsx` and `kudo-detail-view.tsx` now pass `isOwner` and `writingOpen`. `app/(app)/kudos/[id]/page.tsx` computes `isKudoWritingOpen()` (see C1) |
| Admin › Settings (F011) | `app/admin/settings/page.tsx` (RSC, Suspense skeleton, `list()` errors → E14, `unstable_rethrow` keeps 403 and redirect). In `features/admin-campaigns/components/`: `campaign-settings-panel.tsx`, `campaign-table.tsx`, `campaign-row-menu.tsx`, `campaign-form-modal.tsx`, `use-campaign-form.ts`, `campaign-form-field.tsx`, `campaign-delete-dialog.tsx`, `campaign-dialog-frame.tsx`, `campaign-settings-toast.tsx`, `campaign-settings-skeleton.tsx`, `campaign-settings-styles.ts`, `admin-campaign-icon.tsx` |
| Assets | `public/images/admin-campaigns/ic-{more,edit,delete-x,calendar}.svg`, copied verbatim |
| i18n | `messages/{vi,en}.json`: `kudosHearts.label` and the `adminCampaigns.{metaTitle,title,addButton,table,menu,form,delete,toast}` keys. The backend's `errors.*` keys are unchanged |
| E2E | `tests/e2e/kudos-hearts/heart-toggle.spec.ts`, `kudo-heart-e2e-fixtures.ts`; `tests/e2e/admin-campaigns/settings-crud.spec.ts`, `campaign-e2e-fixtures.ts` |

- The admin nav already linked to `/admin/settings` (`ADMIN_ROUTES.settings`), so the nav was not changed.
- Every file is under 200 lines; the largest is `settings-crud.spec.ts` at 188.

## Behaviour notes and decisions

- **D1. Both heart states are drawn inline.** The hearted state uses the same path and fill as `ic-heart.svg`, so it looks the same as the file. One box for both states means no layout shift.
- **D2. Disabled heart.** The button uses `aria-disabled` rather than `disabled`, so it stays focusable. The reason is a `role=tooltip` linked with `aria-describedby`; it shows on hover or focus-within, which also covers a tap on mobile. The owner sees `SELF_HEART`; after the event ends the reason is `EVENT_ENDED`.
- **D3. Copies of one Kudo stay in sync.** A Kudo can appear in the Highlight and in All Kudos at the same time, and the actions do not revalidate, so the two copies would drift apart. A tiny `useSyncExternalStore` store shares the confirmed server answer between them. An entry only applies while a card still shows the server numbers it was based on, so fresher props from a reload, a refetch or navigation always win.
- **D4. Redirects pass through.** The client catch blocks around actions call `unstable_rethrow` first. In this version a Server Action redirect rejects the client promise (verified in the Next source). Every other throw maps to `UNEXPECTED`.
- **D5. Start date locked while active (DEC-002).** The start input is `readOnly` and described by the `fields.startLocked` sentence. The update omits `startsAt`.
- **D6. Gone or ended rows.** A `NOT_FOUND` or `ENDED` answer from edit or delete closes the dialog and shows a page alert toast, as the screen spec's branches describe. `VALIDATION`, `OVERLAP` and `UNEXPECTED` keep the dialog open.
  - Overlap errors appear under End Date via `overlapWith`.
  - Focus moves to the first field in error.
- **D7. Client pre-check.** Before calling the server, the form runs the shared Zod schema and checks that end is after start. That check is a plain string comparison of the local values: same zone, fixed width.
- **D8. Focus.** After a dialog closes, focus returns to the "⋯" opener. If the opener is gone (a deleted row, or a row that just ended), focus goes to "Add Campaign" instead of `<body>`.
- **D9. Mobile table.** On phones the Time column stacks start over end, and the "Actions" header text is `sr-only` there.

## Test evidence (testPolicy e2e-red-first)

**RED**, before any production code: `npx playwright test tests/e2e/kudos-hearts tests/e2e/admin-campaigns` gave exit 1, with 8 failed and 1 passed.
- The heart tests failed because the `button /lượt thả tim$/` element was not found.
- The settings tests failed because the heading "Setting", the "Add Campaign" button and the row actions were not found (the route did not exist).
- The test that passed was the non-admin 403, already enforced by the admin layout guard.

**GREEN:**

| Check | Result |
|---|---|
| Same two specs | 9/9 passed; with `--repeat-each=2`, 18/18 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test:unit` | exit 0 (35 files, 434 tests) |
| `npx playwright test` (full suite) | exit 0 (68/68), run twice; the second run was on the final code |
| `npm run build` | exit 0 (`/admin/settings` is ƒ) |

- After each run, the DB has 0 campaigns and 0 hearts. All rows are cleaned up by token or by kudo cascade.
- Two follow-up assertions were each checked RED then GREEN by temporarily reverting the fix:
  - focus lands on "Add Campaign" after a delete;
  - the delete flow as a whole.
- **Not a regression test:** the "no horizontal scroll at 375 px" assertion also passed on the old table. The old overflow stayed inside the page gutter. It is kept only as a layout guard.
- The dev server on :3000 kept serving signed-in dynamic routes after typecheck and build: both new specs passed against it at the end. No restart was needed.

## Screenshots

`plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-06/`. Each name below exists as `-desktop-1440x900.png` and `-mobile-375x812.png`:
- `heart-card-hearted`
- `heart-card-unhearted`
- `heart-own-kudo-disabled` (tooltip shown)
- `settings-table`
- `settings-row-menu-open`
- `settings-add-modal-empty`
- `settings-add-modal-errors`
- `settings-edit-modal-active`
- `settings-delete-dialog`

They were compared by eye with Figma frames 820:10492, 820:11429, 820:11445, 832:12299 and 1760:8926. The one-off capture spec was deleted after the run.

## Concerns

- **C1. Edit outside the listed ownership.** Disabling the detail-page heart after `EVENT_END_AT` needs `writingOpen`, so `app/(app)/kudos/[id]/page.tsx` got a three-line change: one import, `Promise.all` with `isKudoWritingOpen()`, and one prop. Please confirm this is acceptable.
- **C2. Native date input format.** The native `datetime-local` shows dates in the browser UI language. Headless Chrome is en-US, so the screenshots show `mm/dd/yyyy hh:mm AM`; a Vietnamese Chrome shows `dd/mm/yyyy`. This follows from the native-input decision.
- **C3. Global campaign test.** "Active campaign start locked" seeds a campaign that is live now. Campaigns may not overlap and only one can be active at a time, so this test cannot run concurrently with itself (for example with `--repeat-each` under heavy parallelism). Normal runs and CI retries are sequential for that test.
- **C4. Highlight test isolation.** The "Highlight order" test isolates its data with the `#THINK OUTSIDE THE BOX` filter. Local leftover kudos with 2 or more hearts on that hashtag could push its rows out of the top 5.
- **C5. Next.js feedback.** One feedback draft was opened per AGENTS.md (a documentation gap about client-side catch around Server Action redirects). The review URL is saved in the scratchpad at `next-feedback-url.txt`. Nothing was sent.
- **Docs impact: minor.** Not done here because I don't own these files:
  - tick the phase-06 Todo boxes for "KudoHeartButton + seam rewrites", "Admin Settings page…" and "e2e heart toggle + settings CRUD";
  - add a changelog entry.

## Open questions

- Should a dirty form ask before Esc or Cancel? The current code closes without asking, as the spec's [EXPECTED] note says.
- Should the heart toast persist until dismissed, like the Copy Link error toast? It currently auto-clears after 5 s.
