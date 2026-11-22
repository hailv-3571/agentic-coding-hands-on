# Doc-writer: phase 07 docs (F006 Awards portal & prelaunch gate)

Date: 2026-11-22. Verdict: **updated 11 files**. All under the size limit (largest: `docs/system/architecture.md`, 363 lines; ceiling 800 fallback, none set in `.tkm.json`). No `doc_lock: user` found in any touched file.

## Files updated

| File | Change |
|---|---|
| `docs/development-roadmap.md` | Phase 07 -> Hoàn thành (2026-11-22); progress 7/14 |
| `docs/project-changelog.md` | New 2026-11-22 entry (Added/Changed/Decisions/Security/Tests/Deferred/Docs) |
| `docs/code-standards.md` | Test table row `test:e2e:prelaunch`; paragraph on the `globalSetup` launched-server check |
| `docs/system/architecture.md` | Proxy step 5 row and DB-read sentence; write window `LAUNCH_AT <= now < EVENT_END_AT`; F006 module row; contract row; C-09 marked resolved; new section "Cổng prelaunch và cổng thông tin" |
| `docs/features/F006_AwardsPortal/technical-spec.md` | Row-level only: § 2 handler names -> real files; DEC-001 rows (allowlist now login, /auth/callback, /countdown, /access-denied; no `/awards`; admin bypass; 403 for actions); § 4.1 component rows -> real paths; § 4.6 config (removed `EVENT_TIMEZONE`, `COUNTDOWN_TICK_SECONDS`, which do not exist in code; added `ADMIN_TIMEZONE`) |
| `docs/features/F006_AwardsPortal/functional-spec.md` | § 1 Actors only (human-editable): Admin and guest rows |
| `docs/screens/SCR011_CountdownPrelaunch/spec.md` | Route; no award link (R3/E05/action/conditional/exit removed); title text; no flip animation; entry/exit; a11y |
| `docs/screens/SCR009_AwardsSystem/spec.md` | Route; entry/actors (no prelaunch access); Countdown entry row removed; layout note |
| `docs/screens/SCR010_CommunityStandards/spec.md` | Route; layout note |
| `docs/screens/SCR012_Homepage/spec.md` | Route; entry; D005 resolved; floating pen out of scope |
| `docs/screens/SCR013_Rules/spec.md` | Route; rewritten as 553px right panel (Đóng / Viết KUDOS actions, exits, regions) |

Verified against code before writing: `prelaunch-gate.ts`, `prelaunch-gate-step.ts`, `session-proxy.ts` (step 5), `event-window.ts`, `app-routes.ts`, `public-paths.ts`, `request-time.ts`, `countdown-parts.ts`, `use-server-clock-now.ts`, `countdown-timer.tsx`, `awards-data.ts`, the 5 page files, `rules-panel.tsx`, `rules-close-button.tsx`, `playwright.prelaunch.config.ts`, `global-setup-require-launched-server.ts`, `package.json`, `messages/vi.json` (`awardsPortal` keys), `.env.example`. Test counts come from `tester-261122-phase-07-full-run.md` and the decision log; I ran no tests (docs-only).

## Deliberate deviations from the guardrails (flagged)

- Phase 07 changed far more than 3 source files, so the escalation rule says skip surgical edits to the F006 specs and advise rebuild. I made only the row-level fixes above, because the allowlist contradiction is security-relevant and you asked for it. Everything else in F006 specs is left for rebuild.
- `functional-spec.md` § 3 Open Decisions (machine-owned) is **untouched**. It still says D002 = Login + Countdown + `/awards`. Resolutions per decision log: D001 Countdown public; D002 Login + Countdown (+ `/auth/callback`, `/access-denied`), no `/awards`; D003 admin bypass (writes still closed until `LAUNCH_AT`); D005 `EVENT_AT`, timer stops at 00; D006 "Sắp diễn ra" label; D008 text only; D009 chip bar on mobile (not re-verified in code). D004, D007 still need BTC.
- Remaining stale prose in `technical-spec.md` (§ 3 A2 "Có liên kết tới `/awards`", "(planned)" markers, § 5.2/5.3 unresolved questions, § 5.4 "Chưa có mã nguồn") and `functional-spec.md` FR-201 ("liên kết tới thông tin giải"), CAP-01 text. Not edited (prose, machine-owned).
- Screen specs remain `status: draft` as for phases 05/06.

## Findings worth acting on

- No link to `/rules` anywhere in the app (footer: Về SAA, Thông tin giải, Kudos, Tiêu chuẩn cộng đồng; header has no rules link). Recorded in SCR013 and the changelog as deferred.
- Decision-log F006 D007 copy: rules text came from Figma, so BTC final copy is still the open item.

## Recommended next step
`/tkm:rebuild-spec --artifact F006` (or `--features F006`) to regenerate `functional-spec.md` and `technical-spec.md` prose and the Open Decisions table.

## Unresolved
- Whether you want me to patch the machine-owned sections above despite the guardrails (needs your say).
- `docs/features/F006_AwardsPortal/*` frontmatter still `status: implemented` on technical-spec while body says "planned"; reconcile at rebuild.

**Status:** DONE_WITH_CONCERNS
**Summary:** Updated 11 doc files for phase 07 (roadmap 7/14, changelog, code-standards test table, architecture, F006 specs row-level, SCR009-SCR013).
**Concerns/Blockers:** F006 functional-spec § 3 and technical-spec prose left stale by guardrail (rebuild-spec advised); `/rules` has no inbound link.
