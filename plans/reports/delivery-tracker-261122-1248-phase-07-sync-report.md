# Delivery sync: phase 07 Awards portal & prelaunch (F006)

Date: 2026-11-22 · Plan: `plans/261108-0048-saa-2025-kudos-platform/` · Scope: plan and phase docs only, no code touched

## Updated
- `phase-07-awards-portal.md`: status pending → completed; 11 todo items checked with evidence; success criteria checked; Delivery Notes added (drift D1–D13, open items O1–O14)
- `plan.md`: phase 07 row pending → completed (78 lines, under 80)

## Done-criteria check
| Item | Result | Evidence |
|------|--------|----------|
| Typecheck | 0 | `tsc --noEmit` on final code |
| Lint | 0 | `npm run lint` |
| Unit | 600/600 | includes gate table (134), countdown-parts, awards-data, event-window |
| Integration | 94/94 subset only | kudos-authoring + hearts after write-window change; full 269/269 ran before that change (see O9) |
| E2E full | 84 passed / 5 skipped, exit 0 | fresh dev server, 3 workers |
| E2E prelaunch | 5 passed / 1 skipped, exit 0 | `npm run test:e2e:prelaunch` on :3100 |
| Code review | 0 critical, 2 warnings | W1 accepted (decision 2026-11-22), W2 fixed (globalSetup) |

## Blocker and risk
- **O9 (verification gap, highest priority).** The write window changed kudo writes, image signing and heart service, which are data mutations and so safety-critical. The full integration suite did not run after that change. Owner: tester. Done when `npm run test:integration` exits 0 on final code. If it fails, phase 07 reopens.
- **Stale dev server.** The earlier full e2e run was red on a degraded `:3000` server (10 kudos tests). Final run is green on a restarted server. Root cause in the product was never proven. Done = already met; keep the restart as the first step on any future red run.
- **Server Actions before launch.** Write actions are guarded by the write window. `choose-department` and locale still run (O5, accepted by decision).
- **BTC content has been open since 2026-11-08** (O1, O7). It is a stall past one session. Owner: user, who chases BTC. Path: BTC sends copy, it lands as JSON edits only.

## Drift (summary; full table in phase file)
Rules as 553px right panel (D1); floating widget deferred (D2); DSEG7 font (D3); JSON 403 for non-page prelaunch requests (D4); prelaunch e2e by build + start on :3100 (D5); write window `LAUNCH_AT ≤ now < EVENT_END_AT` covering Admin (D6); `/access-denied` allowlisted (D7); `countdown-parts` moved to `features/awards-portal/`, `request-time.ts` added (D8); position-based anchor menu (D9); menu label keys (D10); phone sizes not in Figma (D11); launched-server globalSetup (D12); choose-department accepted pre-launch (D13).

## Open items carried forward
| ID | Item | Owner | Done when |
|----|------|-------|-----------|
| O9 | Full integration suite after write-window change | tester | exit 0 on final code |
| O1 | BTC copy for Thể lệ, Tiêu chuẩn cộng đồng, English | BTC via user | JSON edits merged |
| O2 | Floating widget button (Figma 5022:15169) | user + BTC | build or drop decided and logged |
| O3 | `WRITING_CLOSED` wording pre-launch | phase 04 owner + BTC | pre-launch key + integration test |
| O4 | Heart button shows `EVENT_ENDED` to Admin pre-launch | phase 06 owner | neutral reason + test |
| O5 | choose-department runs pre-launch | user (product) | recorded accepted, or guard + test |
| O6 | "Hoặc" contrast ~1.5:1 fails WCAG AA | design + BTC | colour confirmed or changed in Figma |
| O7 | Slack handle in Tiêu chuẩn cộng đồng (FR-603) | BTC via user | kept or removed, logged |
| O8 | Real-browser minute-tick latency at boundary not measured | tester | measured, numbers in evidence/phase-07 |
| O10 | FR-203 mutation check not run | tester | throwaway branch shows test fails |
| O11 | Distinct log tag for role-lookup failures (S2) | phase 07 implementer | tag + test |
| O12 | Clock-lag note in `use-server-clock-now.ts` (S3) | phase 07 implementer | comment present |
| O13 | Docs drift: F006 technical-spec still shows `/awards` pre-launch and a countdown link; roadmap row 07 says "Chưa làm"; no changelog entry; code-standards lacks prelaunch row | doc-writer + delivery-tracker | grep shows no conflict; roadmap and changelog updated |
| O14 | Next.js feedback candidate drafted, not sent | user | sent or dropped |

## Next moves
1. Run `npm run test:integration` on final code (O9). Owner: tester. Done when exit 0 is recorded.
2. Refresh roadmap, changelog, F006 technical-spec and code-standards (O13). Owner: doc-writer. Done when grep is clean and dates match.
3. Ask BTC for copy and the O2/O5/O6/O7 decisions. Owner: user. Done when each answer is in the decision log.
4. Pre-launch copy fixes O3 and O4. Owner: phase 04 and phase 06 owners. Done when tests assert the new keys.
5. Small hygiene O8, O10, O11, O12. Owner: tester and phase 07 implementer. Done when each check is recorded.

Unresolved: none of the items above block code completion once O9 passes. O1, O2, O6, O7 need BTC, not code.

**Status:** DONE_WITH_CONCERNS
**Summary:** Phase 07 is completed on evidence: typecheck, lint, unit 600/600, full e2e 84/5, prelaunch e2e 5/1 and review with no critical findings. The one gap is that the full integration suite was not rerun after the write-window change (O9). It must pass before the completed status is fully trusted.
