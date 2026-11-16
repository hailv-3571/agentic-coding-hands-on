# Tester report: phase 04 final verification (F003 Kudos authoring)

Date: 2026-11-16 · Branch: main · Scope: FULL suite (migrations, data mutations, authorization are safety-critical)
Logs: C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\tester-p04-*.log

## Runs (real exit codes)

| # | Command | Exit | Result |
|---|---------|------|--------|
| 1 | `npm run db:reset` | 0 | supabase reset, drizzle migrate applied, seeds: departments=6, hashtags=8 |
| 2 | `npm run typecheck` | 0 | route types generated, no errors |
| 3 | `npm run lint` | 0 | eslint clean, no output |
| 4 | `npm run test:unit` | 0 | 23 files, 285/285 passed, 1.84s |
| 5 | `npm run test:integration` | 0 | 21 files, 168/168 passed, 34.4s |
| 6 | `npm run test:e2e` | 0 | 40/40 passed (chromium), 28.7s |
| 6b | `npm run test:e2e` (rerun, flake check) | 0 | 40/40 passed, 26.9s |
| 7 | `npm run build` | 0 | Compiled, TypeScript pass, 13 static pages, no warnings shown |
| 8 | `npm run test:prod` | 0 | 13/13 production status checks PASS (next start on free port) |

Totals: unit 285 + integration 168 + e2e 40 (x2) + prod 13 checks. Failed: 0. Skipped: 0.
Flakiness: e2e ran twice, identical 40/40. Unit and integration ran once each; not re-run for flake.
Coverage: not produced. No `test:coverage` script and no coverage provider (`@vitest/coverage-*`) in devDependencies, so line/branch/function numbers are unavailable without adding tooling. Not installed (out of scope for this run).
Slow tests: integration is the long pole (34s, 57% test time, 28% setup). No per-test timing reporter configured, so no individual ranking.

## Leftovers after the run (docker exec supabase_db_saa-2025-kudos psql)

| Table | Count |
|-------|-------|
| auth.users | 0 |
| public.kudos | 0 |
| kudo_image_uploads | 0 |
| domain_event_outbox | 0 |
| storage.objects where bucket_id='kudo-images' | 0 |

Re-checked after the e2e rerun: all still 0. Cleanup holds.

## Environment
- Ports 3000 and 3100 were free at start and free after the runs.
- Two node.exe processes were running before the start (PIDs 24616, 24040). Both are Playwright MCP servers (`@playwright/mcp`), not from this repo. Left untouched.
- No repo-scoped node/next process left running.
- The local env file was not opened at any point.

## Screenshots (evidence/screenshots/phase-04/)

24 files present: desktop + mobile for 01 launcher-home, 02 composer-empty (+full), 03 dec-001-error (+full), 04 recipient-dropdown, 05 hashtag-dropdown, 06 composer-filled (+full), 07 add-link-popover, 08 edit-mode (+full). All 8 pairs complete.

Comparisons (qualitative; no pixel-diff metric was run, so none is "exact"):

1. **06-composer-filled-full (desktop) vs figma kudo-composer-828-13433.png: MATCH with fixture-data differences.** Section order, label/asterisk placement, toolbar, textarea, counter, hashtag row, image row, anonymous checkbox, nickname, Hủy/Gửi buttons and dialog width (~752px) all line up. Differences: our fixture has 2 images vs 5 in Figma, different hashtags, body text as typed markdown (`**là quý bạn**`). Danh hiệu has no red `*` (documented deviation 1).

2. **03-dec-001-error-full (desktop) vs figma kudo-composer-1949-13746.png: PARTIAL, not a like-for-like frame.** Frame 1949 is the edit-mode state ("Chỉnh sửa bài viết"), with filled fields and no Danh hiệu row. The DEC-001 banner copy, red colour and position above the buttons do match. A closer create-mode reference is figma kudo-composer-662-13035.png, which carries the same banner in the same place. It also differs in state (filled, 5 images, no Danh hiệu row, no Tiêu chuẩn cộng đồng cell); that is documented as deviations 1 and 3.

3. **05-hashtag-dropdown (desktop) vs figma kudo-hashtag-dropdown-1002-13013.png: MATCH with data differences.** Same 8 options in the same order, same row styling, check-icon on selected rows, dropdown anchored below the chip row. Differences: selection state (ours has High-performing + BE OPTIMISTIC selected; Figma has three selected) and the label "High-performing" vs Figma's "High-perorming" typo (documented deviation 6).

4. **02-composer-empty (mobile):** no Figma frame exists for mobile, so this is judged on its own. Stacked labels above controls, full-width fields, Gửi above Hủy, all consistent with documented deviation 10. No horizontal overflow visible. Minor: the Danh hiệu placeholder is clipped at 375px ("Dành tặng một danh hiệu cho đồn"). Cosmetic, not blocking.

## Discrepancies and stale report content

- **Composer-UI report, deviation 2 is stale.** The report says the DEC-001 banner reads "…Lời nhắn và Hashtag…" and differs from Figma's "Lời nhắn gửi". The current source `messages/vi.json` line 182 reads "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!", which matches Figma. The report needs correcting, or the deviation is no longer true.
- **Screenshot mapping:** the requested 03 vs 1949 pair compares different states (create/error vs edit). Use 662-13035 as the reference for future comparisons of 03.

## Status

**Status: DONE_WITH_CONCERNS**

All eight required commands exit 0. The e2e rerun is also green. The DB leftovers are all 0. Screenshots are complete for 01–08 desktop and mobile.

Concerns (none failing a gate):
1. No coverage numbers: the project has no coverage tooling, so line/branch/function coverage cannot be reported without adding a dependency.
2. The composer-UI report's deviation 2 is stale against `messages/vi.json`.
3. The 03 vs 1949 screenshot mapping compares different states; 662-13035 is the better create-mode reference.
4. Flakiness was checked only for e2e (two runs). Unit and integration ran once.
5. Reviewer findings were not re-audited in this run; the scope was the test and build evidence only.
