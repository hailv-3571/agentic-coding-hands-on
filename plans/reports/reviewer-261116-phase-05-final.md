# Final re-check: Phase 05 (F004 Kudos feed, Live board, detail, read APIs)

Decision: SEALED (score 9/10), 0 critical, 0 warning, 5 suggestions. Risk gate requires human sign-off (humanSignedOff=false).
Verdict: `plans/261108-0048-saa-2025-kudos-platform/evidence/phase-05/inspection-verdict.json`

Run by me: `npm run typecheck` exit 0, `vitest tests/unit/kudos-feed` 6 files / 91 passed, plus parser probes through tsx. NOT run (per brief): integration, e2e, db:reset. Their results are the tester's (exit 0). Caveat: `npm run typecheck` regenerates `.next` route types while the dev server on :3000 runs; the UI fix report suspected that as a trigger for the dev worker crash. Check the dev server still serves `/kudos/[id]` before the next e2e run.

## 1. Earlier warnings: dispositions

| Earlier | Status | Evidence |
|---|---|---|
| UI W1 pen after EVENT_END_AT | Fixed | `kudo-card-can-edit.ts:6`, required `writingOpen` threaded page -> HighlightSection -> Carousel and page -> AllKudosFeed -> KudoCard; unit truth table (9) |
| UI W2 dropdown Tab | Fixed | roving `tabIndex` (`highlight-filter-dropdown.tsx:111`), Tab handler with `flushSync` + trigger focus (:63-72); e2e keyboard spec |
| UI W3 load-more a11y | Fixed | `aria-disabled` not `disabled`, focus to first new card after every append, sr-only `role=status`; e2e |
| UI W4 stale closure | Fixed | functional `setOlder`, `uniqueById` at render, abort on unmount (`all-kudos-feed.tsx`) |
| UI W5 FORBIDDEN branch | Justified, kept | one generic error branch is reachable after an account switch in another tab; e2e 'a pen left in a tab after switching accounts' asserts refusal text, no textbox, no Kudo text |
| BE W1 cursor year 0000 | Fixed | `kudo-feed-cursor.ts:36-45` `isPostgresYear` refine; unit rows 'year 0000' rejected, 0001 round-trips; route schema calls the decoder so 400 |
| BE W2 image syntax | Fixed | returns the `[..](..)` span as ONE text node (plain text, not null), so no hidden link and no autolink of the inner URL; I probed it |
| BE W3 userinfo | Fixed | `safeHttpHref` rejects username/password (`kudo-body-links.ts:21-30`), covers links and autolinks |
| BE `\)` edge | No code change needed | the reviewer's probe used a non-raw JS string; `String.raw` test pins `http://a.b/x)y` |
| BE S3 length guard | Done | `PARSE_MAX_LENGTH = 5000` (UTF-16), write cap 1,000 code points <= 2,000 units, so stored bodies never cut |
| UI suggestions | Done or justified | carousel aria-disabled + reset on apply, toast host mounted, `pencil` icon removed, h2 on detail, wrap-anywhere, sign-in link; launcher placeholder kept (used by `live-board-skeleton`) |

## 2. Regressions looked for: none found

- **Dropdown**: Tab unmounts the list synchronously then focuses the trigger, so native Tab continues to the next control; Shift+Tab is prevented and stays on the button; Esc refocus unchanged; `onFocus` keeps `activeIndex` in sync with mouse and arrow focus; the open effect focuses the `tabindex=0` option.
- **Load-more**: `inFlight` ref blocks double load (needed because `aria-disabled` does not block clicks); focus target falls back to the last card when everything was a duplicate; 400 restarts after the first page. `finally` runs `setPending` after an unmount abort: harmless on React 19.
- **Carousel**: `setActive(0)` now runs with the applied result; `active` is clamped; `go()` clamps, so `aria-disabled` arrows are safe no-ops; a newer request aborts the older one and `pending` is guarded by identity.
- **`writingOpen`**: required prop (typecheck exit 0); both `<KudoCard>` call sites pass it; detail view has no pen.
- **`linkAt` / `!` handling**: `followsUnescapedBang` runs only after a link tail parsed, and the backslash run before a `!` cannot be shared between two links, so the total work is linear. Probes at the 5,000 cap: `![a](` x1000 31.6 ms, `[a]("` x1000 27.9 ms, 2,500 backslashes + 100 links 0.5 ms, `**a ` x1250 1.4 ms, `![` x2500 0.2 ms. No ReDoS, no quadratic path. Outputs: `![a](https://a.b/c.png)` literal; `\![a](..)` = `!` + link with visible label (CommonMark-consistent); `\\![a](..)` literal; `![x](http://u:p@h.com)` literal; nested `![a [b](..) c](..)` literal.
- **5,000 cap**: truncation, not refusal; a surrogate cut only affects out-of-contract input.
- **Cursor refine**: lexicographic compare is valid for the regex-fixed width; the encoder round-trip still enforces one spelling.
- **Phase 04 e2e**: edit and non-owner tests now go through the pen; non-owner case asserts no pen plus API 403 `{code:"FORBIDDEN"}` with no body leak: stronger, not weaker.

## 3. FR-602 anonymous masking: holds

`maskKudoRow` is an explicit whitelist (`kudo-row-mask.ts:25-39`); anonymous sender = `{anonymous:true, nickname}`; typed union makes a leak a compile error. `senderId` filter guard `(is_anonymous=false OR sender=viewer)` at `kudo-public-query.ts:47`; `includeOwnSpam` only for `senderId === viewerId`. The fix round touched `server/` only in the cursor file. Tests: route JSON substring test, e2e raw HTML of `/kudos` and `/kudos/{id}`, mask unit tests.

## 4. Files and secrets

All phase 05 source and test files under 200 lines (largest `parse-kudo-inline.ts` 150, `kudos/page.tsx` 100). No secret-like literals in phase 05 sources, tests or the migration. Migration 0009: three plain `CREATE INDEX`, rollback in SQL comment, journal idx 9 monotonic.

## Critical
None.

## Warning
None.

## Suggestion
1. `app/(app)/kudos/[id]/page.tsx:20` and `:40`: comments still promise "a real 404 status". The user decision is a soft 404 (status 200 on production). Reword to "uniform not-found page; Next adds noindex; status 200 on production, see decision-log 2026-11-16".
2. `tests/integration/kudos-feed/kudos-feed-routes.test.ts:72`: add a `year 0000` cursor row to the 400 table (covered now only by the decoder unit test plus composition).
3. `features/kudos-feed/components/kudo-card.tsx:27`: "writing closed -> no pen" has no automated wiring test (unit truth table plus the one-off two-server script, 16/16). A `KudoCard` render test with `writingOpen=false` would close it.
4. `parse-kudo-inline.ts:137`: `\![x](https://..)` renders `!` + a link. Not hidden (label visible), matches CommonMark; note it if the contract wording "image syntax literal" must be absolute.
5. `all-kudos-feed.tsx:79`: announcement count uses the render-time `shown`; a refresh during a fetch can skew the count slightly. Harmless.

## Acceptance (study-context.json, 11 criteria)
All 11 echoed verbatim in `acceptanceCovered`, each with test names or "code reading only" noted. Honest limits: soft 404 status 200 was observed by the UI fix round, no test asserts the status (by decision); pen-hidden wiring verified by one-off script, not automated; a11y checked by DOM/ARIA e2e assertions, no screen reader run; <3 Highlight cards layout is by code reading plus overflow e2e, no test seeds exactly 1 or 2 cards.

## Gate output
Command as given (`--evidence-dir ...\evidence`): `evidence-gate: SEALED (hard) — evidence verified`, exit 0. **Note: that path points at the parent folder, so the gate validated the older root-level `evidence/inspection-verdict.json`, not phase 05.** Pointing at the phase dir:
- `...\evidence\phase-05` -> `BLOCKED (hard) — 1 issue(s): riskGate.signoffRequired is true but humanSignedOff is not true`, exit 2. That is the only block, as expected.
- `...\evidence\phase-04` -> SEALED, exit 0 (control).
After the user signs off, the orchestrator sets `riskGate.humanSignedOff` to true in the phase-05 verdict and reruns the gate on `evidence\phase-05`.

## Numbers
Typecheck 0 errors; unit kudos-feed 91/91 (full unit 376/376 per tester); integration 203/203, e2e 59/59 x2, build and test:prod 13/13 per tester. Lint 0 per tester. Coverage not measured (no script).

## Unresolved
- Human sign-off (migration + anonymous-data exposure).
- Dev server health after my typecheck (see caveat).
- Refreshed screenshots `*-08-writing-closed-owner-card-no-pen` and `*-04-owner-card-with-pen` are from the UI fix round, not the tester refresh (cosmetic).

**Status:** DONE_WITH_CONCERNS (only the pending human sign-off blocks the hard gate)
**Summary:** Every earlier warning is fixed or has a justified disposition; I found no regression in the dropdown, load-more, carousel, `writingOpen`, `kudoCardCanEdit`, `linkAt` (linear, no ReDoS), the 5,000 cap or the cursor refine; FR-602 holds. Verdict written as SEALED with 0 critical.
**Concerns/Blockers:** `riskGate.humanSignedOff=false` blocks the hard gate until the orchestrator records the user's sign-off. The gate command in the brief targets the parent evidence folder and validates the root verdict, so run it on `evidence\phase-05`. Re-check dev on :3000 after my typecheck.
