# Delivery sync: phase 05 (F004 Kudos feed & detail)

Date: 2026-11-16 · Plan: `plans/261108-0048-saa-2025-kudos-platform/` · Edits: plan and docs only, no code.

## Edits made
| File | Change |
|---|---|
| `phase-05-kudos-feed-and-detail.md` | Status `completed` (frontmatter and Overview). Context Links "hashtags 1–3" → "1–5". 11/11 todos ticked, each with evidence. "Delivery notes" section added (deviations, deferrals, test results). |
| `plan.md` | Phase 05 row → `completed`. |
| `docs/development-roadmap.md` | Phase 05 row → Hoàn thành (2026-11-16). Progress → 5/14. |
| `docs/project-changelog.md` | Phase 05 entry added above phase 04 (Added, Changed, Decisions, Security, Fixed in review, Deferred, Docs). |
| `spec/decision-log.md` | 2026-11-08 hashtag line now ends "(superseded: 1–5, see 2026-11-15)". Text not rewritten. |

## Todo check against code
- All 11 todos are delivered. Evidence is in each line of the phase file.
- Two items rest on the backend report, not on the reviewer. EXPLAIN ANALYZE on 10k Kudos covers five queries (feed, deep page, recipient, sender, highlight) at 0.04–0.32 ms, all index-backed. The reviewer's "reasoned, not measured" predates this measurement. The Next.js docs read is logged there too.
- The two seams (`enrich-heart-summary.ts`, `enrich-hero-tier.ts`) ship defaults only. They count as delivered as seams, not as features.
- Brief deviations checked in code: `locale` on `list`/`findForViewer`; sender union in `kudo-card-view.ts`; highlight `total` = returned count (`kudo-highlight-query.ts:29`); present-but-empty param → 400 (`kudo-feed-params-schema.ts`); soft 404 (`[id]/page.tsx:47`); launcher mounted on `/kudos` (`app/(app)/kudos/page.tsx:59`), deep-link file deleted.
- Reviewer suggestion 1 (doc comments promising a real 404) is already fixed in `[id]/page.tsx`.
- `publicKudoIdsSubquery` takes only hashtag and department, so the phase 10/12 gap is real.

## Scope drift log
| # | Drift from plan | Reason | Cost |
|---|---|---|---|
| 1 | Hashtags 1–5, not 1–3 | Figma "Tối đa 5", decision 2026-11-15 | None in code; stale text fixed |
| 2 | Anonymous sender = `{anonymous, nickname}` | Decision 2026-11-15 | None; typed union |
| 3 | Not-found is a soft 404 (status 200 on production) | User decision 2026-11-16; shell streams before `notFound()` | No test asserts status (see R9) |
| 4 | Edit pen hidden after `EVENT_END_AT`; detail page has no pen | Decision 2026-11-16, Figma 520:18779 | `writingOpen` prop threaded through 4 components; wiring not automated (R7) |
| 5 | Search debounce 250 ms, not 300 ms | Reuses phase 04 combobox, no edit to `features/sunner-search` | None |
| 6 | Launcher moved `/` → `/kudos`; `/?editKudo` removed | Phase 04 handoff requirement | Phase 04 e2e moved to pen-based edit |
| 7 | Extra server files (4) and card-edit helper; parser split into 4 files | Single-purpose files, <200 lines | More files; no functional cost |
| 8 | `kudo-card-actions.tsx` not created | Covered by `kudo-owner-edit-button.tsx` and `kudo-card-parts.tsx` | None |
| 9 | `\![x](url)` renders `!` + link | CommonMark consistency | Plan wording "image syntax literal" holds only for unescaped form |

## Risk register (live)
Closed:
- R1 Anonymous sender leak. Closed by tests (SC-002, senderId guard, raw HTML scan). Watch R6.
- R2 Cursor duplicate/skip on equal timestamps. Closed: microsecond cursor, 10/10/5 pagination test.
- R3 Highlight slowness. Partly closed: 0.32 ms at 10k on the recency seam. Heart-ranking cost is phase 06's risk (R5).

Open:
- R4 Next 16 API drift. Watch on any Next upgrade.
- R5 Seam defaults ship for good. Open until phases 06 and 09 land.
- R6 (new, M/H) Phase 10 uses `publicKudoIdsSubquery` with a sender filter and no viewer guard, leaking anonymous authors.
- R7 (new, L/M) "Writing closed → no pen" wiring has no automated test.
- R8 (new, M/M) Phase 05 is uncommitted. Migration, feature code, tests and docs sit in the working tree next to phase 04 deletions.
- R9 (new, L/M) Soft 404 status is unasserted. A regression to another status would pass.
- R10 (new, L/L) Docs drift: `docs/system/architecture.md` has no read-path section for F004; `docs/features/F004_KudosFeed/*` is pre-implementation.
- R11 (new, L/L) Four screenshots are from an earlier run, against the memory rule to capture desktop and mobile on every phase test.

## Blockers
- None blocks phase 05 closure. Human sign-off is recorded in the verdict.
- No shell in this run, so I did not re-run the hard gate on `evidence/phase-05`. The brief's exit 0 is taken as given.

## Next moves
| # | Move | Owner | Done when | Stakes |
|---|---|---|---|---|
| 1 | Commit phase 05 in scoped conventional commits (feature, migration, tests, docs) | Main agent | Phase 05 files show no untracked or modified entries in `git status`; each commit touches only its scope; tests green before push | R8: without it, phase 05 is one stray `git checkout` from lost, and phase 04 history is tangled |
| 2 | Re-run the hard gate on `evidence/phase-05` with `humanSignedOff: true` and record the output | Main agent | Gate output is in the evidence folder and reads exit 0 | Confirms the sign-off is actually on record |
| 3 | Add a viewer-guarded recipient/sender filter to `publicKudoIdsSubquery` before phase 10 starts | Main agent (at phase 10 planning) | Two-user integration test shows another viewer never sees anonymous kudos through the filter | Blocks phase 10 and phase 12; R6 if skipped |
| 4 | Add three tests: writing-closed KudoCard render, 1–2 Highlight card layout e2e, year-0000 route row | Tester | Tests green; the writing-closed test fails when the `writingOpen` check is removed | Closes R7 and the layout criterion (SC "<3 cards") |
| 5 | Re-capture owner-pen and writing-closed screenshots (desktop and mobile) under a controlled `EVENT_END_AT` | Tester | Four files in `evidence/screenshots/phase-05/` are dated from the new run | Closes R11 |
| 6 | Add `test:coverage` (Vitest v8) | Main agent | `npm run test:coverage` exits 0 and reports `features/kudos-feed` | Coverage bar cannot be measured without it |
| 7 | Add a "Đọc Kudo (F004)" section to `docs/system/architecture.md`; refresh F004 feature specs with `/tkm:rebuild-spec --features F004` | Main agent | Section exists; F004 specs no longer say pre-implementation | Closes R10 |
| 8 | Phase 06: rewrite the heart seam and heart slot; highlight ranks by hearts | Phase 06 implementer, assigned by main agent | e2e asserts real counts and hearts-first ranking; seam defaults gone | Phases 06 and 11 wait on it; R5 |
| 9 | Phase 09: rewrite the hero seam and badge slot | Phase 09 implementer, assigned by main agent | `enrichHeroTier` returns real tiers, tests green | Phase 12 profile depends on it |

## Naming note
The injected Naming block gives `delivery-tracker-261116-2037-{slug}-report.md`. I used the filename you specified, `delivery-tracker-261116-phase-05-sync.md`.

**Status:** DONE_WITH_CONCERNS

**Summary:** Phase 05 is reconciled. The plan, phase file, roadmap, changelog and decision log now match the code and the evidence: 11/11 todos ticked, 5/14 phases complete, and the 2026-11-08 hashtag line carries its supersession note. Nine deviations are logged, with reasons and costs.

**Concerns/Blockers:**
- R8: phase 05 is still uncommitted. Next move 1 must land before anything else touches the working tree.
- R6: phase 10 needs a viewer-guarded sender filter on `publicKudoIdsSubquery` before it starts. Otherwise it can leak anonymous authors.
- R7, R9, R11 and the layout criterion stay open. They are test and evidence gaps, not delivery blockers.
- R10: the architecture doc and F004 specs still lack the read path.
- I could not re-run the hard gate here (no shell). The brief's exit 0 is taken as given.
- Unresolved: whether the owner wants a status-code check on the soft 404 (R9). Decide before phase 12 adds more not-found paths.
