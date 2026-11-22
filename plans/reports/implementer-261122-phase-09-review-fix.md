# Implementer — phase 09 review fix (L1 + L2)

Source: `plans/reports/reviewer-261122-phase-09.md` findings L1, L2.

## Scope Contract
- **Changed:** `features/hero-badges/components/hero-badge-tooltip.tsx` (press-elsewhere + blur + Esc handling), `features/hero-badges/components/hero-badge-tooltip-panel.tsx` (panel ref now owned by the trigger, passed as React 19 `ref` prop), `tests/e2e/hero-badges/hero-badge-tooltip.spec.ts` (2 new assertions).
- **Impacted:** the only host, `features/kudos-feed/components/kudo-card-hero-badge-slot.tsx` (Live board / Highlight cards, Rules page uses the panel copy only).
- **Will verify:** tooltip e2e spec RED then GREEN; then all 7 gates on the final code, each alone.
- **Deliberately skipped:** nothing — full gates requested.

## Fix
- **L1** — the document `pointerdown` handler records whether the press landed inside the panel (`panelRef.current.contains(target)`) and closes only when it is outside both panel and trigger. Second half of the same bug: the panel is not focusable, so pressing it blurs a focused badge (tap-opened or click-opened) and `onBlur` closed it. `onBlur` now skips the close once when the last press was inside the panel (`pressedInPanel` ref, reset on focus). The tooltip still closes on press elsewhere, Esc, second tap, mouse leave.
- **L2** — Esc handler returns early unless the key is Escape **and** this tooltip is the active one; only then `stopPropagation()` + close. Listener moved to the capture phase: in bubble phase on `document` a `stopPropagation` is a no-op against every existing host pattern (React-root `onKeyDown` dialogs fire earlier, sibling `document` listeners are not stopped), so capture is what makes the stop real. Net effect: one Esc closes the tooltip only, not a hosting dialog/drawer. No current host is a dialog, so this is not exercised by e2e (same as the reviewer's "unproven").

## RED (before fix)
`npx playwright test tests/e2e/hero-badges/hero-badge-tooltip.spec.ts --timeout 90000` → exit 1, 2 failed / 1 passed:
- `the tooltip opens on hover …` — line 55 `await expect(tooltip).toBeVisible()` after `tooltip.click()`: element not found (closed by the press).
- `a tap opens the tooltip inside the screen …` — line 106 `await expect(tooltip).toBeVisible()` after `tooltip.tap()`: element not found.

## GREEN (after fix)
Same command → exit 0, 3 passed.

Mutation check: with only the `onBlur` guard disabled, the 375 px tap test fails again at line 106 (exit 1) — so the tap assertion covers the blur path, the mouse assertion covers the press-elsewhere path. File restored afterwards.

## Gates (final code, run sequentially, each alone)
| # | Command | Exit | Result |
|---|---------|------|--------|
| 1 | `npx tsc --noEmit -p .` | 0 | no errors |
| 2 | `npm run lint` | 0 | eslint clean |
| 3 | `npm run test:unit` | 0 | 49 files, 663 passed |
| 4 | `npm run test:integration` | 0 | 47 files, 341 passed |
| 5 | `npx playwright test --timeout 90000` | 0 | 100 passed, 5 skipped |
| 6 | `npm run build` | 0 | compiled successfully |
| 7 | `npm run test:prod` | 0 | 16 PASS, 0 FAIL |

Dev server on :3000 left running (307 after all runs).

## raw runs
```json
[
  {"command": "npx playwright test tests/e2e/hero-badges/hero-badge-tooltip.spec.ts --timeout 90000", "exitCode": 1, "summary": "RED before fix: 2 failed (new assertions at lines 55, 106: tooltip not found after press inside it), 1 passed"},
  {"command": "npx playwright test tests/e2e/hero-badges/hero-badge-tooltip.spec.ts --timeout 90000", "exitCode": 0, "summary": "GREEN after fix: 3 passed"},
  {"command": "npx playwright test tests/e2e/hero-badges/hero-badge-tooltip.spec.ts -g \"375 px\" --timeout 90000", "exitCode": 1, "summary": "mutation check (onBlur guard disabled): tap test fails at line 106; file restored"},
  {"command": "npx tsc --noEmit -p .", "exitCode": 0, "summary": "no type errors"},
  {"command": "npm run lint", "exitCode": 0, "summary": "eslint clean"},
  {"command": "npm run test:unit", "exitCode": 0, "summary": "49 files, 663 tests passed"},
  {"command": "npm run test:integration", "exitCode": 0, "summary": "47 files, 341 tests passed"},
  {"command": "npx playwright test --timeout 90000", "exitCode": 0, "summary": "100 passed, 5 skipped (1.6m)"},
  {"command": "npm run build", "exitCode": 0, "summary": "compiled successfully"},
  {"command": "npm run test:prod", "exitCode": 0, "summary": "16 production status checks passed, 0 failed"}
]
```

## Concerns
- L2 capture-phase Esc is not covered by a test (no dialog host exists yet). Side effect worth knowing: while a tooltip is open, the first Esc goes to the tooltip only (e.g. a hovered badge while a combobox is focused) — intended per WCAG 1.4.13.
- After a press inside the panel the badge has lost focus but the tooltip stays open; it then closes on press elsewhere, Esc, mouse leave or re-tap.
