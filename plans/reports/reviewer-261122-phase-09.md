# Review: phase 09 (F009 Hero badges), uncommitted

## Scope
- Reviewed: features/hero-badges/** (9 files, 374 lines), enrich-hero-tier.ts, kudo-card-hero-badge-slot.tsx, kudo-card-sender.tsx, rules-kudos-rewards.tsx, shared/db/schema/kudos.ts, migration 0014 (+down, journal), messages en/vi, two phase 05 integration tests. Test files read by name/size only. No suites run (shared DB).
- Depth: recent (git diff) plus full read of the new modules.

## Assessment
Ready to commit. No critical or high findings. Anonymity holds by construction, the query is one batched statement, thresholds live once, the migration is sound. Only low/medium polish.

## Critical / High
None.

## Medium
- M1 Ownership: edits outside phase file_ownership: kudo-card-sender.tsx, rules-kudos-rewards.tsx, shared/db/schema/kudos.ts, messages/*.json, db/migrations/meta/*, and two phase 05 tests (statement count 4->5; recipient tier null->"new"). All are required consequences (index in schema, shared hero.* copy, dotless wrap, seam now live); test edits are the expected seam delta, asserts not weakened. Record them in the phase file / decision log. Defer.

## Low
- L1 hero-badge-tooltip.tsx:44-46 `closeOnPressElsewhere` exempts only the trigger, so a press/tap inside the tooltip panel (portal) closes it; text can't be pressed/selected. Fix: also ignore targets inside `document.getElementById(tooltipId)`.
- L2 hero-badge-tooltip.tsx:41 Esc handler has no stopPropagation: a card inside a dialog/drawer would close both on Esc. Unproven (no such host in the diff); check when the detail view is a dialog.
- L3 hero-badge-tooltip-panel.tsx:44 effect deps `[anchor]` only: not re-placed if the panel resizes while open (locale switch, late font). Negligible.
- L4 0014: plain CREATE INDEX takes a SHARE lock on kudos during build. Fine pre-launch (documented in file); CONCURRENTLY outside drizzle's tx on a busy DB. Down script leaves the drizzle.__drizzle_migrations row (documented in header).
- L5 Rules page uses `hero.*.tooltipTitle` as the "N people sent you Kudos" line; key name couples the hosts but is intentional (decision 2026-11-22).

## Hunt results
- Anonymous leak: enrich-hero-tier.ts collects recipient ids + NAMED sender ids only; the anonymous sender object is returned untouched (no tier, no id). The query selects recipient_id + count, never sender ids; result keyed by requested ids. Nothing extra reaches the RSC payload of anonymous cards. Anonymous kudos still count toward the recipient's tier (decision-log), which reveals no identity.
- N+1: one statement per page (<=500 ids per chunk, <=40 ids per page); empty batch no query; Set dedup. Statement-count test updated 4->5 consistently.
- Thresholds: 1/5/10/21 inclusive, defined once; tierCountRange 1-4, 5-9, 10-20, 21+ matches copy; NaN/Infinity/negative -> null.
- Counting: status='public' AND sender<>recipient; countDistinct maps to number.
- Index: partial predicate matches the query. postgres-js runs prepare:false (unnamed statements planned with bound params) so the partial index is provable; plan test asserts Index Only Scan on the exact statement.
- Migration: journal `when` 1795351878129 > 0013's; snapshot present; down is IF EXISTS drop; migration test covers rollback (by name, not run).
- Tooltip: hover/focus/tap logic coherent (pressedWith avoids open-then-close on tap), Esc, blur, second tap, one-open store with unmount cleanup, aria-describedby only while open, portal fixed + scroll(capture)/resize re-place, 16px clamp at 375px, flip above only when it fits, tabbable=false under spam overlay (matches phase 08 W1). SSR snapshot false, useId stable.
- Client/server: "use client" only on tooltip + panel; store and place helper are plain modules; HeroBadge neutral, used from the async server rules page; hero-tier.ts schema client-safe; query server-only.
- Seam failure: try/catch around the single query, logs, returns cards with the mask's tier null.
- i18n: hero.* key sets identical en/vi (script); old awardsPortal.rules.tiers removed with no remaining references; en-dash is the only rules-page difference.
- Size: new source files <=111 lines; edited files <=81; largest test 137.

## Done well
Single threshold source; pure tierFromCount enables phase 13 diff; executor param for phase 13 transactions; distinctSenderCountSubquery for phase 14 without SQL threshold duplication; exact-statement EXPLAIN test; seam files kept as seams.

## Actions in order
1. L1 exempt the panel from press-elsewhere close.
2. M1 log the out-of-ownership edits in the phase file.
3. Check L2 when a host is a dialog.
4. Commit.

## Numbers
- Type/test coverage: not measured. Lint: not run by me. Implementer reports tsc 0, lint 0, unit 663, integration 341, e2e 100 (5 skipped), build 0.

## Unresolved
Screenshots under evidence/screenshots/phase-09 not opened; tooltip behavior judged from code and test names only.

**Status:** DONE
**Summary:** Phase 09 is sound; no critical/high. Anonymous sender identity cannot reach the tier lookup or payload.
**Concerns:** L1 (press inside tooltip dismisses it), M1 (out-of-ownership edits unrecorded), L2 unproven.
