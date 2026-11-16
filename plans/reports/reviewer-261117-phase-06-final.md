# Final re-check: phase 06 (F005 hearts + F011 x2 campaigns)

## Scope
Files read: `features/kudos-hearts/{server,components}`, `features/admin-campaigns/{server,components,schemas}`, `shared/admin/timezone.ts` (diff), `app/admin/settings/page.tsx`, `playwright.config.ts` (diff), `tests/e2e/admin-campaigns/campaign-e2e-fixtures.ts`, test names across the phase 06 unit/integration/e2e dirs, both earlier reviews and both fix reports.
My runs: `npx tsc --noEmit -p .` exit 0; `npm run test:unit` 36 files / 438 passed. Integration, e2e, db:reset NOT run (per instruction); their results come from the tester run (269/269, 13/13) and the UI fix round (71/71 twice, build).

## Assessment
Every earlier warning is fixed or has a justified disposition. No regression found. Zero critical, zero warning. Only deferrable suggestions remain.

## 1. Earlier findings

Backend (`reviewer-261116-phase-06-backend.md`)
| # | Result |
|---|---|
| W1 full-table heart aggregate | Fixed. `heartCountsSubquery(kudoIds, asOf?)` takes a required id set; WHERE is `kudo_id IN (...) [AND created_at <= asOf]`. heart-ranking-query.ts:25-33. |
| W2 years 0-99 mapped to 1900s | Fixed at the root: `utcMs()` (timezone.ts:62) with `setUTCFullYear`, era handling in `toAdminZone`; schema floor year 2000. |
| W3 no `zonedDateTimeToUtc` test | Fixed. 25 cases (DST gap/overlap, UTC-day crossing, malformed shapes, 0000/0050/0099). Single owner file. |
| D003 test | Fixed. "puts two x1 hearts above one x2 heart: the raw count ranks, not the multiplier sum (D003)". Would fail if ranking used multiplier sum (tie, newer x2 first). Passed in tester run. |
| S1, S2 | Applied as docs. |
| S3 | Partly: reader comment corrected; migration 0012 comment left (do not edit an applied migration). Deferred, see suggestions. |
| S4 | Applied (`::uuid` cast). Integration passed. |
| S5, S6 | Accepted as-is by the earlier review. |

UI (`reviewer-261117-phase-06-ui.md`)
| # | Result |
|---|---|
| 1 Escape after focus loss | Fixed. Document listener (campaign-dialog-frame.tsx:46-53), buttons lock with `aria-disabled` plus guards. Fixer showed RED on old code. |
| 2 active-campaign e2e flake | Fixed. `seedActive` uses the EXCLUDE constraint as the lock; see regression check below. |
| 3 Highlight e2e crowding | Fixed. Reserved hashtags, own spec file. |
| 4 cross-copy sync untested | Fixed. e2e "a heart given in the Highlight shows on the same Kudo in All Kudos..." plus 4 store unit tests (resolve/publish/subscribe), mutation-checked by the fixer. |
| 5 blocked tap silent on touch | Fixed. `toggle()` calls `setFailure(blockedBy)`, nothing sent. |
| Suggestions 6, 7, 8 | Applied (tooltip Esc, persistent alert region, trigger focus before menu close). |
| 9 store reset on sign-out | Skipped, justified (outside fixer ownership; needs two matching props to be visible). |
| 10, 12, 13 | Accepted by the earlier review. |
| 11 thin wrappers | `focusRing` re-export removed; `KudoCardHeartSlot` kept as the documented seam. |

## 2. Regression checks
- Scoped `heartCountsSubquery`: only caller is `rankKudoIds` (line 40), which passes `db.select({id}).from(candidates)`. Highlight and enrich go through `rankKudoIds` with unchanged signature. Empty list renders `where false` (checked by the fixer). No other caller exists in the repo.
- `timezone.ts`: `utcMs` builds from 2000-01-01 then `setUTCFullYear(y, m-1, d)` so month/day are set atomically (no Feb-29 rollover). `era: "short"` yields AD/BC in en-US; `1 - year` maps 1 BC to ISO 0. `startOfDayInZone` and `parseCalendarDate` use the same helper, so phase 01 range filter output is unchanged for normal years (date-range-filter unit tests green in my run). Behaviour change only for years 0-99 and BC, previously wrong.
- `aria-disabled` guards: submit guarded at use-campaign-form.ts:104, delete confirm at campaign-delete-dialog.tsx:36, Cancel `!pending && onClose()`, frame ignores Esc while busy. Native Enter on a form still submits an aria-disabled submit, which hits the same guard.
- Document Escape listener: added/removed in one effect, cleaned on unmount; `defaultPrevented` skip prevents a double close; only one campaign dialog is ever mounted. Heart tooltip listener mounts only while the heart is blocked, sets local state only.
- `heart-summary-store`: entry applies only while card props equal `base`; fresh props win. Known and accepted: copies with different server props do not sync until refresh.
- `seedActive`: deletes only `E2E-` rows older than 10 min, throws naming any other overlapping row; teardown deletes only its own token prefix; `serviceClient` refuses a non-local Supabase URL (local-sunner-accounts.ts:12). Real data safe.
- Playwright: `workers: process.env.CI ? undefined : 3`, matches the orchestrator decision.

## 3. Permissions and leaks
`requireAdmin()` first statement in `createCampaign`, `updateCampaign`, `removeCampaign` and `CampaignAdminQuery.list`; layout guard on top. Heart actions take the user only from `requireSunner()`; kudoId is uuid-validated; outputs are `heartCount`/`heartedByMe` or an error code. No who-hearted list exists. `heartUserId` only in the internal outbox payload. Ranking candidates have no sender column; anonymous kudos masked before enrichment.

## 4. Size and secrets
No touched phase 06 file over 190 lines. No secret-like strings. Verdict file has no key patterns.

## Critical
None.

## Warning
None.

## Suggestion (all Defer)
1. db/migrations/0012_campaigns_no_overlap_exclude.sql:7: comment claims the GiST index serves `CampaignActiveReader`. Wrong; fix at next migration touch.
2. shared/admin/timezone.ts:77 (phase 01 `adminDateRangeSchema`): still accepts years 0000-1999. Conversion now correct; floor is the phase 01 owner's call.
3. features/kudos-hearts/components/heart-summary-store.ts:17: no reset on sign-out.
4. features/kudos-hearts/components/kudo-heart-button.tsx:62: closed-window disabled state has no e2e (code reading plus server EVENT_ENDED test only).
5. features/kudos-hearts/components/kudo-heart-error-toast.tsx:1: duplicate private `useHydrated`.
6. Decision-log and changelog lines from the UI fix report are not yet written by their owner (blocked-heart toast, Esc tooltip, aria-disabled dialogs, reserved hashtags, worker cap).

## Done well
- Bounded heart aggregate with a required parameter, so no caller can scan the table by accident.
- Root-cause fix of the date year bug in one helper that also repairs phase 01, with RED shown first.
- Esc fix by design (aria-disabled keeps focus) rather than patching one symptom.
- `seedActive` uses the DB constraint as the lock and refuses to touch non-E2E rows.
- Mutation checks on each new UI assertion.

## Acceptance
All 10 criteria in study-context are echoed verbatim in the verdict, each citing a named test and marked as test or code reading only. Honest gaps: closed-window UI state and Figma pixel match are not asserted by tests; integration and e2e were not re-run by me.

## Numbers
- Type check: exit 0 (my run). Unit: 438/438 (my run). Lint: 0 problems (fix round, not re-run). Integration 269/269, test:prod 13/13, e2e 71/71 x2, build ok (taken from tester / fix reports). Coverage not measured.

## Evidence gate
`node .claude/skills/_shared/lib/evidence-gate.cjs --evidence-dir ...phase-06 --stage hard` -> BLOCKED with exactly one reason: riskGate.signoffRequired is true and humanSignedOff is false. No other violation. Verdict written to `plans/261108-0048-saa-2025-kudos-platform/evidence/phase-06/inspection-verdict.json` (decision SEALED, criticalCount 0, riskGate.humanSignedOff false). The orchestrator flips it after the user's real sign-off.

## Still unresolved
- Human sign-off (migrations, data mutations, admin permissions).
- Decision-log and changelog entries.

**Status:** DONE_WITH_CONCERNS
**Summary:** All earlier backend and UI warnings are fixed or justified, no regression in the scoped subquery, timezone/era handling, aria-disabled guards, Escape listener, heart store, seedActive or worker cap; permissions and leak checks pass. Verdict written as SEALED with 0 critical; the hard gate blocks only on the human sign-off.
**Concerns/Blockers:** Human sign-off required before finalizing (risk gate, humanSignedOff=false). Six deferred suggestions, none blocking. I did not re-run integration/e2e; I relied on the tester and fix-round runs.
