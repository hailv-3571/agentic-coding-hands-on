# Phase 11 — Spotlight Board UI (F008) · implementer report

Date: 2026-11-23 · Role: implementer (UI + client logic, RED-first for pure libs) · Plan: `plans/261108-0048-saa-2025-kudos-platform/phase-11-spotlight-board-realtime.md` (steps 8–11) · Backend counterpart: `implementer-261123-phase-11-spotlight-backend.md`

## Files (all new unless noted)

Components `features/spotlight-board/components/`
- `spotlight-board-region.tsx` — `SpotlightBoardRegion({ snapshot })` (client). Renders the shared Live board section header (`LiveBoardSectionHeader`: "Sun* Annual Awards 2025" / "SPOTLIGHT BOARD") and the board. `null` snapshot → error state. The backend's slot renders only this component, so the header is not duplicated.
- `spotlight-board.tsx` — the live board: DEC-001 reducer seeded from the snapshot, channel hook, resync (abortable `GET /api/spotlight` → `replace`), search state, 4 s highlight timer, fullscreen toggle, toast.
- `spotlight-board-frame.tsx` — frame + backdrop layers (texture, 70 % black, network screen-blend 30 %). Fullscreen target.
- `spotlight-name-cloud.tsx` — positioned `next/link`s to `/profile/{id}` (`prefetch={false}`). Each has the label "{name}, {n} Kudos". Non-matches dim to 25 %, the spotlit name shows in `#F17676`, and a polite live message covers the empty / no-match states.
- `spotlight-ticker.tsx` — 5 lines in a `role="log"`, opacity 100/100/70/50/30 from the bottom, locale time (vi `20:30`, en `08:30 PM`) rendered after hydration (browser time zone).
- `spotlight-search-input.tsx` — Figma pill. Debounced 200 ms, `maxLength` 50.
- `spotlight-fullscreen-button.tsx`, `spotlight-connection-banner.tsx` (SM-001 label + retry), `spotlight-board-toast.tsx` (inside the frame, so it also shows in fullscreen), `spotlight-load-error.tsx` (error + retry).

Hooks `features/spotlight-board/hooks/`
- `use-spotlight-channel.ts` — `realtime.setAuth(access_token)` → private channel `spotlight`, event `kudo`, payload parsed with the backend's `SpotlightEventSchema`.
  - On every `SUBSCRIBED`: status `live`, then resync (REPLACE).
  - Each `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED` counts as a failure; the 5th in a row removes the channel and sets `failed`. `retry()` starts a fresh channel.
  - Supabase does the rejoin/backoff itself.
  - `offline` → close the channel + `reconnecting`; `online` → fresh channel → resync.
  - `visibilitychange` to visible → resync. `TOKEN_REFRESHED` → `setAuth`.
  - Stale channels and the cleanup's own `CLOSED` are ignored.
- `use-cloud-layout.ts` (keeps the previous layout through state, React's "adjust state on prop change" pattern), `use-element-size.ts` (ResizeObserver), `use-fullscreen-toggle.ts` (synced on `fullscreenchange`), `use-hydrated.ts`.

Lib `features/spotlight-board/lib/`
- `spotlight-state-reducer.ts` — DEC-001, pure.
  - `applied[kudoId]` dedupe; `removed` for an unseen id still decrements.
  - Counts clamp at ≥ 0; a name at 0 is dropped.
  - `restored` adds no ticker line. `replace` resets dedupe to the snapshot's ticker ids.
  - `spotlit` is cleared by `unspotlight` or by removal of that kudo.
- `spotlight-cloud-layout.ts` — ALG-001 / BR-002.
  - Tiers come from the distinct-count rank (see concern 2).
  - Top N by count desc, then id asc.
  - Positions come from a mulberry32 sequence seeded with an FNV-1a hash of the recipient id; first fit avoiding names and obstacles; names with no free spot are left out.
  - The previous layout is reused when board size and fonts are unchanged; a name keeps its spot while its tier and text stay the same.
- `spotlight-cloud-input.ts` — board size → cap (60, or 24 below 640 px), tier fonts (Figma 6.7/7.9/10.2/11.3 at 1157 px, scaled with the board, ×1.2 minimum on phones), obstacles (search, counter, banner, ticker, button).
- `normalize-search-text.ts` — lowercase + NFD mark strip + `đ→d` + whitespace collapse; `nameMatcher(query)` (null when blank).
- `fetch-spotlight-snapshot.ts` — `parseSpotlightEvent` and `fetchSpotlightSnapshot`, both using the backend's Zod schemas.
- `spotlight-browser-supabase.ts` — `createBrowserClient` from `@supabase/ssr` with `detectSessionInUrl: false`. `shared/` has no browser session client yet, so this one is feature-local (promote it when phase 13 needs one).
- `spotlight-ui-config.ts` — UI-only constants. Shared values (`NAME_CLOUD_MAX`, topic, event) are imported from the backend's `spotlight-config.ts`; my temporary duplicates were removed once it landed.

i18n: `messages/vi.json`, `messages/en.json` — appended the `spotlight` namespace only (17 keys, both locales). The JSON round-trip was checked to be byte-identical before the append.

Tests
- Unit `tests/unit/spotlight-board-ui/`: `spotlight-state-reducer.test.ts` (13), `spotlight-cloud-layout.test.ts` (10), `normalize-search-text.test.ts` (7).
- E2E: `tests/e2e/spotlight-board.spec.ts`, `tests/e2e/spotlight-board-reconnect-and-search.spec.ts`, helper `tests/e2e/spotlight-board-e2e-helpers.ts`. The helper falls outside the `*.spec.ts` ownership glob, but it is new and spotlight-only.
- The temporary screenshot spec was deleted after use.

Not touched: slot, route, schemas, server, migration, `.claude/**`, `.env.local`, git.

## RED → GREEN
- Pure libs: the 3 unit files were written first. RED = 3 files failed (modules absent). GREEN after implementation: 29/29.
- Behavioral RED in the visual pass: the first mobile capture showed names stacked on each other and on the counter. Cause: the layout fell back to an overlapping spot when the board was full.
  - Added the test "leaves out a name that has no free spot…" → RED (`expected 30 to be less than 30`).
  - Fix: no fallback, narrow cap 24, phone board 460 px tall → GREEN 30/30.

## Scope Contract
- **Changed:** `features/spotlight-board/{components,hooks,lib}/**`, the `spotlight` i18n namespace, spotlight tests.
- **Impacted:** the Live board `/kudos` (new region in its DOM and tab order, between Highlight and All Kudos); the shared message files.
- **Will verify:**
  - unit (reducer, layout, normalizer);
  - e2e on the real local stack (Realtime, trigger, route, admin UI);
  - every e2e suite that renders `/kudos`;
  - full unit suite, `tsc`, eslint on the touched files.
- **Deliberately skipped:** integration (backend-owned, run by the backend: 141 + full); pixel-exact cloud placement; Fullscreen on non-Chromium (manual Chromium check below).

## Gates
| Gate | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | pass |
| Lint | `npx eslint features/spotlight-board tests/unit/spotlight-board-ui tests/e2e/spotlight-board*.ts` | pass (no output) |
| Unit (UI) | `npx vitest run --project unit tests/unit/spotlight-board-ui` | 3 files / 30 pass |
| Unit (full) | `npx vitest run --project unit` | 755 pass |
| E2E spotlight | 2 spec files, `--workers=2 --repeat-each=3` | 15/15 pass |
| E2E spotlight + Live board | spotlight + `kudos-feed/**` + `secret-box-rewards/rewards-column` + smoke, 2 workers | 31/31 pass |
| E2E other `/kudos` suites | `admin-moderation/owner-spam-view`, `kudos-hearts/**`, `hero-badges/**`, `secret-box-rewards/**` | 25/25 pass |

E2E cases:
1. The snapshot renders: the counter equals the DB public count, and the recipient appears in the cloud ("…, 1 Kudos") and in the ticker.
2. A new kudo reaches **two independent browsers within 5 s** with no reload (same-document marker). Its name is in `#F17676`, then turns white after a few seconds.
3. An admin in a second browser runs **Mark Spam** through the real Review screen: the name and its ticker line leave and the counter matches the DB. **Un Spam** brings the name back with 1 Kudos and the counter back, with **no ticker line**.
4. **Offline**: the "Đang kết nối lại…" label shows and old data stays. A kudo is written while offline. **Online**: rejoin → resync → the recipient shows 2 Kudos (not 3), 2 ticker lines, and the counter matches the DB.
5. Search: `DONG DOI <token>` (no diacritics, capitals) keeps the match at opacity 1 and dims the other to 0.25; `zzzz…` → "Không tìm thấy tên nào"; clearing restores everything; `maxlength=50`.
6. Empty state: the region's own refetch is answered with an empty snapshot (page and channel stay real) → "0 KUDOS" + "Chưa có Kudos nào để vinh danh.", no lines, no names.

A failure found and fixed along the way: with 2 workers, case 3 once ended with the counter at DB + 2.
- Cause: another test's teardown hard-deleted 2 public kudos. DELETE emits no event; the product has no delete flow (spec §5.3 Q4).
- Fix in the tests: before each step, `resyncNow()` runs the board's own tab-visible refetch and waits until the counter matches the DB. The step's change can then only arrive through the Realtime event. Spotlight kudos also use a created-at window just above `feedWindow("top")` so they land in the 5-line preload.

## Screenshots and Figma comparison
`plans/261108-0048-saa-2025-kudos-platform/evidence/screenshots/phase-11/`:
- `spotlight-board-desktop-1440x900.png` (+ `-viewport`)
- `spotlight-board-mobile-375x812.png` (+ `-viewport`, DPR 2)
- `spotlight-board-desktop-live-highlight-1440x900.png`
- `spotlight-board-desktop-search-dim-1440x900.png`
- `spotlight-board-desktop-english-1440x900.png`
- `spotlight-board-desktop-fullscreen.png`
- `spotlight-board-desktop-fullscreen-rejected-toast.png`

Matches Figma 2940:14170:
- header block; board 1152×545, radius 47, gold border;
- texture + network layers;
- "{n} KUDOS" Bold 36 centred;
- pill 219×39 at 24/25;
- names white Bold, 4 tiers;
- ticker bottom-left with grey time, 16 px name and fade;
- pan-zoom icon at 39/48 from the bottom-right;
- header→board gap 64 px (measured on the Figma frame).

The layout is identical in vi and en for the same data, which shows the seeding is deterministic.

Fullscreen (manual check, Chromium):
- The board fills the screen, names scale ×1.24 and are re-laid out.
- The label switches between "Phóng to bảng" and "Thu nhỏ bảng"; the exit button restores the frame.
- A refused `requestFullscreen` shows "Không thể phóng to bảng." inside the board.
- Esc in a real browser exits via `fullscreenchange`; this cannot be automated headless.

## Concerns
1. **No event for hard deletes** (test teardown only). An open board keeps deleted kudos until its next resync (subscribe or tab visible). Harmless in the product; noted for whoever adds a delete flow.
2. **BR-002 interpretation.** Tiers are ranked over the *distinct* counts of the names shown: `tier = 4 − floor(rank·4/k)`. With plain positional ranks and "ties share a tier", the usual long tail of 1-Kudo names would jump to the largest tier. Top count → tier 4, equal counts → one tier, lowest → tier 1 (unit-tested). Please log in the decision-log / technical-spec.
3. **Phone board, deviating from plan text:**
   - cap 24 names (plan said 30): 30 did not fit without overlap;
   - names with no free spot are left out;
   - board 460 px tall (spec "min ~320").
4. **Network layer** stretched to 106 % width: the Figma 1100 px width leaves a visible seam at about 95 % of the board.
5. **Refetch race:** an event arriving while a refetch is in flight can be overwritten by the REPLACE if the snapshot predates it. The window is milliseconds; the next resync heals it (plan RISK-04 accepted this).
6. **Names outside the top 60:** such a recipient joins with count 1 on a live event, since the true count is unknown until the next resync. This is inherent to a top-N snapshot.
7. **No loading skeleton.** The slot (backend-owned) uses `Suspense fallback={null}`, so spec § 5's loading skeleton is not shown; the header appears with the data. If wanted, I can add a `SpotlightBoardSkeleton` for the slot to use.
8. **Browser client token refresh.** The browser client auto-refreshes the token next to the session proxy. This is the standard @supabase/ssr pattern and relies on Supabase's refresh-token reuse interval.
9. **`/profile/{id}`** returns 404 until phase 12 (D004, accepted).
10. **Next.js feedback pass:** no qualifying Next.js friction in this task, so the feedback command was not run.

Docs impact: minor (doc-writer): F008 technical-spec ALG-001/BR-002 tier rank, phone cap 24 + drop-if-no-room, client files list; changelog.

## Open questions
- Confirm concern 2 (distinct-count tiers) and concern 3 (phone cap 24, 460 px board).
- Do we want a loading skeleton in the slot fallback (concern 7)?

**Status:** DONE_WITH_CONCERNS
**Summary:** Spotlight Board UI built and wired through the backend's slot. Pure libs RED→GREEN (30 unit tests). 6 e2e cases pass on real Realtime: two browsers ≤ 5 s, admin Mark Spam / Un Spam, offline/online without double count, search, empty state; stable at repeat-each 3 and in parallel with all `/kudos` suites. Desktop and mobile screenshots compared with Figma.
**Concerns/Blockers:** plan deviations awaiting confirmation (tier rank over distinct counts, phone cap 24 + drop-if-no-room, network layer width); no slot skeleton; hard deletes emit no event (test-only effect).
