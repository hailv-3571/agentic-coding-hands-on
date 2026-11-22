# Delivery sync: Phase 08 Admin moderation (F007)

Date: 2026-11-22. Role: delivery-tracker. No product code changed. Files updated: `plans/261108-0048-saa-2025-kudos-platform/phase-08-admin-moderation.md`, `plans/261108-0048-saa-2025-kudos-platform/plan.md` (row 08 only).
Naming note: the injected Naming block pattern is `delivery-tracker-{yymmdd}-{hhmm}-{slug}-report.md`. This file uses the path the user specified. Rename if the pattern is required.

## Status
Phase 08 is delivered with evidence. Status is `completed`. **Risk sign-off is PENDING.** The user has not given an explicit answer, so no sign-off is claimed.

## Evidence vs plan (by the numbers)
| Gate | Result (final code) | Source |
|---|---|---|
| tsc | exit 0 | reviewer-fixes report |
| lint | exit 0 | reviewer-fixes report |
| unit | 649/649 (46 files) | reviewer-fixes report |
| integration | 322/322 (43 files) | reviewer-fixes report |
| e2e | 97 passed, 5 skipped (prelaunch, by design), 0 failed | reviewer-fixes report |
| build | exit 0 | reviewer-fixes report |
| test:prod | 16/16 incl. `/admin/review` (guest 307, member 403, admin 200) | reviewer-fixes report |
| review | 0 critical; W1, W2, S1 fixed; S2, S3 done; S4 accepted | reviewer-261122-phase-08.md |
| coverage | NOT measured | tester report |

Stale figure on disk: `tester-261122-phase-08-full-run.md` records the pre-fix run (integration 317, e2e 93, prod 13). Superseded by the final gates above.

## Plan rows updated
- `phase-08-admin-moderation.md`: frontmatter and overview status → completed. Todo: 10 of 11 checked; "Next 16 docs" left open (no report records reading the Next docs). Success criteria: 6 done, 2 partial, 1 mapped. Unresolved 1–3 resolved; item 2 marked resolved-by-05. Delivery Notes added (drift D1–D18, open items).
- `plan.md`: row 08 → `completed`. File stays at 78 lines.

## Blockers
| Blocker | Stalled since | Owner | Path to clear |
|---|---|---|---|
| Risk sign-off for phase 08 | 2026-11-22 | User | Reply to the orchestrator with an explicit yes or no on phase 08 risks. Nothing else clears it. |
| Coverage not measured (80% bar unverified) | 2026-11-22 | User (approval), then main agent | User approves `@vitest/coverage-v8`; main agent runs it and records line, branch, function numbers in the phase file. |

## Open items carried forward
1. **Coverage not measured.** The 80% bar cannot be confirmed. Done when the numbers are recorded in the phase file.
2. **Phase 12 Tab-order e2e for the spam card.** No page renders a spam `KudoCard` yet. Owner: phase 12 implementer. Done when a Profile "Đã gửi" e2e asserts the Tab stops (only "Đóng" reachable) on a spam card.
3. **Contrast.** Public badge `#3174C6` on `#00070C` is about 4.3:1, under AA 4.5:1 for 14 px text. The label "Hoặc" is NOT a phase 08 string. It appears only as `awardsPage.or` in `messages/vi.json` (phase 07). Owner: UI implementer for the badge; user to decide keep vs adjust. Done when the decision is recorded.
4. **Search cap mismatch.** UI caps at 100 chars; server accepts 200; spec E08 says 100. Owner: main agent. Done when one value is chosen and both sides match, with a test.
5. **`changed:false` handling.** The UI shows "Kudo đã được cập nhật bởi Admin khác."; the spec says silent handling. Owner: user (product intent). Done when the decision is logged in `decision-log.md`.
6. **ESLint import guard not added.** Plan risk mitigation: `no-restricted-imports` for `features/admin-moderation/server` from `features/kudos-feed`. `eslint.config.mjs` was outside phase 08 ownership, so it was not added. Owner: main agent, with ownership of `eslint.config.mjs` granted. Done when the rule exists and a lint run fails on a deliberate bad import. Until then masking relies on `spam-visibility.test.ts` only.
7. **Plan text drift in phase 12.** `spec/profile/technical-spec.md` and the phase 12 file still reference `OwnSpamKudoQuery#listBySender` and ALG-001. Phase 05 replaced it with `KudoPublicQuery.list({includeOwnSpam})`. Owner: phase 12 implementer. Done when phase 12 uses `includeOwnSpam`.
8. **Spec drift on owner detail.** Spec D003 (owner detail 404) conflicts with phase 05 (owner sees read-only spam detail). Phase 05 and the brief win; the spec is not yet amended. Owner: user or spec owner. Done when `decision-log.md` records the winner.
9. **Spec drift on Live board.** Spec and plan said the author sees own spam on the Live board. Decision 2026-11-22 says no. Spec not amended yet. Owner: spec owner. Done when the spec matches the decision.
10. **Figma node coverage.** 5 of 9 node ids (832:13197, 1002:15428, 1002:15464, 1002:15559, 3127:24099) are not cited in reports. Owner: UI implementer. Done when the mapping is written down, or the user waives it.
11. **Flake evidence.** `review-content.spec.ts` is stable at `--repeat-each=2` (12/12) per the UI report. The `owner-spam-view` and new English/phone specs have one pass each. Owner: tester. Done when `npx playwright test tests/e2e/admin-moderation --repeat-each=2` passes.
12. **Next 16 docs todo.** Not evidenced. Owner: implementer. Done when the implementer records the doc sections read, or the user waives it.

## Risk register (live)
| Risk | Status | Note |
|---|---|---|
| Non-admin reads or writes admin data | Closed | Guards first in page, handlers, actions. Integration and prod probes confirm. |
| Anonymous sender leaks in admin-refusal bodies | Closed | `admin-refusal-hides-anonymous-sender.test.ts`. |
| Anonymous sender leaks through public paths | Partly open | Feed and detail covered. Profile responses wait for phase 12. |
| Lost update or double outbox on concurrent Mark Spam | Closed | 10-way concurrency test; rollback test. |
| `unaccent` not IMMUTABLE or slow | Closed | Reuses `f_unaccent`; 94 ms at 10k. |
| Export memory or time at 10k rows | Closed | One bounded read; 422 above limit. |
| Heart seam left at 0 | Closed | No seam exists; `heartCountsSubquery` used. |
| Phase 04 edit path ignores spam lock | Closed | `spam-visibility.test.ts:96`. |
| No static import guard for admin server module | OPEN | Item 6. |
| Coverage unknown | OPEN | Item 1. |
| Search cap mismatch | OPEN | Item 4. |
| Stale phase 12 contract | OPEN | Item 7. |
| Risk sign-off not given | OPEN | Blocker table. |

## Next moves
| Move | Owner | Done when |
|---|---|---|
| Give risk sign-off yes or no | User | Explicit answer recorded in `decision-log.md`. |
| Approve coverage provider install | User | Approval given. Then coverage numbers recorded in the phase file. |
| Add ESLint import guard | Main agent | Rule exists; a deliberate bad import fails lint. |
| Align search cap to one value | Main agent | UI and server use the same cap; test covers the boundary. |
| Phase 12 spam-card Tab-order e2e and `includeOwnSpam` | Phase 12 implementer | Profile e2e green; no `OwnSpamKudoQuery` reference left. |
| Decide badge contrast | User, then UI implementer | Decision logged; if changed, contrast ≥ 4.5:1 measured. |
| Confirm `changed:false` notice vs silent | User | Decision logged; spec updated to match. |
| Amend spec for Live-board and owner-detail decisions | Spec owner | Spec text matches decision-log 2026-11-22. |
| Repeat-run admin-moderation e2e | Tester | `--repeat-each=2` green. |

## Unresolved
- Risk sign-off for phase 08 (user).
- Whether the "Next 16 docs" todo is waived.

**Status:** DONE_WITH_CONCERNS
**Summary:** Phase 08 is delivered: final gates green (tsc, lint, unit 649, integration 322, e2e 97/5 skipped, build, test:prod 16/16), review 0 critical. Phase file and plan row set to completed, with drift D1–D18 logged. Risk sign-off is pending the user and is not claimed. Coverage is unmeasured.
**Concerns/Blockers:** Risk sign-off (user). Coverage install needs user approval. ESLint import guard missing (main agent, needs config ownership). Phase 12 still references `OwnSpamKudoQuery`.
