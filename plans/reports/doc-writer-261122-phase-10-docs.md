# Phase 10 (F010 Secret Box) docs + plan sync

Date: 2026-11-22 · Role: doc-writer · Sources: the 3 implementer reports, tester full run, reviewer report, decision log § Phase 10; code spot-checked (`INTERNAL_JOB_SECRET` in `env-schema.ts` and `.env.example`, `SECRET_BOX_TICK_PATH` in `public-paths.ts`, tick route, `secret-box-config.ts`, guard header, 0016 Vault names, `rankKudoIds` options call, `HeartStatsQuery` call, outbox event types).

## Edited
| File | Change |
|---|---|
| `plans/261108-0048-saa-2025-kudos-platform/phase-10-secret-box-rewards.md` | status completed; 12 todos checked; success criteria checked, each with test evidence; gates; Delivery Notes (all drift items); Open items |
| `plans/.../plan.md` | row 10 completed (77 lines) |
| `docs/project-changelog.md` | Phase 10 entry (Added / Changed / Decisions / Known gaps) |
| `docs/development-roadmap.md` | row 10 done, 10/14 |
| `docs/system/architecture.md` | new "Secret Box" section (grant/open/draw, routes, tick + cron + public path, Quốc Dân, events, column + modal); Deployment View vault/host-cron setup; concurrency rows; seam line; C-01/02/03/15/16/19/20 status; 464 lines |
| `docs/code-standards.md` | internal job endpoint pattern, Idempotency-Key convention, optional-secret env rule, features list refreshed; 139 lines |
| `docs/screens/SCR018_SecretBoxOpen/spec.md` | Route line only (modal, `/kudos?secretBox=open`) |

No `doc_lock: user` file was touched or found. No ops/deployment doc existed, so the setup note lives in architecture § Deployment View. No code changed. No page is near the 800-line fallback ceiling.

## Facts worth knowing
- Test numbers in the plan: final-code gates (unit 709, integration 406, e2e 113 + 5 skipped) come from the review-fix implementer report. The tester's own run (703 / 393 / 108) predates the fixes and was not repeated by the tester. Both are stated that way.
- Risk sign-off written as "per the user's conditional pre-approval 2026-11-22, recorded at commit time", nothing more.
- The plan listed a third custom migration (CHECKs/RLS); the code has only 0015 and 0016. Noted as drift.
- Phase 13 plan already carries the anonymous `senderId` constraint (line 164); I did not edit it.

## Needs rebuild-spec (not edited, machine-owned / drafts)
- `docs/features/F010_SecretBoxRewards/functional-spec.md` (status: draft): § 3 D005, § 13 Configuration still say `SECRET_BOX_LOCK_AT`, `MYSTERY_GIFT_NAME = TBD`; no `INTERNAL_JOB_SECRET`, `SECRET_BOX_HEARTS_PER_BOX`, `EVENT_END_AT`.
- `docs/features/F010_SecretBoxRewards/technical-spec.md`: A1 (`HeartAdded` consumption), BR-006, ALG-001 (`return 0` after lock), A2 `SKIP LOCKED`, open response shape (lacks `unopenedLeft`, `replayed`, `duplicate`), no tick or Vault.
- `docs/screens/SCR017_LiveBoardRewardsColumn`, `SCR018` bodies: states and copy (E08 caption, E09 inferred, no-gift-photo, close-locked-while-opening).
- `docs/generated/*` and `docs/system/permissions.md`: not touched (feature-list already says implemented; permissions text says `SECRET_BOX_LOCK_AT`, and the tick public path is not listed).
- Run: `/tkm:rebuild-spec --features F010`.

## Unresolved
- Live cron path (pg_cron -> pg_net -> endpoint) never run; the setup note says so and asks for one live POST with a right and a wrong header.
- `docs/system/permissions.md` should gain the tick public path and secret guard on the next rebuild.

**Status:** DONE_WITH_CONCERNS
**Summary:** Phase 10 plan synced (completed, evidence, delivery notes, open items) and the changelog, roadmap, architecture, code standards and the SCR018 route row updated against the code and reports.
**Concerns/Blockers:** F010 functional/technical specs and permissions.md are stale and need `rebuild-spec --features F010`; final-code test counts come from the implementer, not a repeat tester run; the live cron path is unverified.
