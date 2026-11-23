# Debugger report: two recurring e2e flakes (Spotlight counter, edit-kudo toast)

Date: 2026-11-23 · Role: debugger + implementer · Stack: Next.js 16.4.5 dev on :3000 (reused), local Supabase, Playwright 1.65.1, 3 workers.

## Verdict
| Flake | Root cause | Class | Action |
|---|---|---|---|
| A. Spotlight counter `Expected 0, Received N` | The `kudoUsers` teardown **hard-deletes** public kudos. DELETE fires no Spotlight event (the product has no delete flow), so every board open in another worker stays above the DB total forever. | Test isolation | Fixed in the shared teardown (test code) |
| A′. Spotlight empty-snapshot `links: Expected 0, Received 2` (surfaced by the repeat-each run) | The test mocks `GET /api/spotlight` as empty but keeps the real channel, so `added` broadcasts for kudos that other workers insert put names on the "empty" board. | Test isolation | Fixed: this one test drops Spotlight broadcasts only |
| B. Edit toast "Đã lưu thay đổi." not visible in 5 s | **Product bug.** The edit toast lives in the card's subtree. `AllKudosFeed` is keyed by `feedKey` (first item id + nextCursor), so when the save's own `router.refresh()` returns a different first page, the whole feed remounts and the toast is destroyed about 200 ms after it appears (FR-210 wants about 4 s). | Product | **Not patched** (the fix is not tiny). Evidence and RED test below. |

## Evidence

### A: hard delete leaves the board above the DB
- Direct repro (temp spec, 1 worker). Board open and resynced, then one public kudo deleted the way teardown does it:
  - result after 6 s: `before={"shown":1,"db":1} after6s={"shown":1,"db":0} diff=1`;
  - `expectTotalMatchesDatabase`: `Expected: 0, Received: 1` (exit 1);
  - the same steps with `status → spam` before the delete: `diff=0`, passed (exit 0).
- Real-conflict repro (temp spec, 2 workers). Worker 1 seeds a kudo and ends, so the real `kudoUsers` teardown runs while worker 2's board is open:
  - fixture flip temporarily reverted: **RED**, `Expected: 0, Received: 1` (exit 1);
  - with the fix: **GREEN**, 2 passed (exit 0).
- The signature matches the logged flakes: phase 13 run 1 `Received 4`, phase 11 concern 1 (the board was +4 after the search/reconnect teardown hard-deleted 4 public kudos).
- The kudo teardown is the only delete point: `deleteKudoDataOf` in `kudo-e2e-fixtures.ts`. Both `kudos.sender_id` and `recipient_id` are `ON DELETE RESTRICT`, so nothing cascades. The Spotlight trigger (`0017`) fires only on INSERT public / public↔spam.

### A′: foreign broadcasts on the empty board
- Seen in `--repeat-each=10` run 1: 49 passed, 1 failed, at `spotlight-board-reconnect-and-search.spec.ts:85`. The locator went 1 → 2 → 1 → 2 links while other repeats were seeding.
- Probe of the wire: Spotlight events arrive as **binary** realtime-js user-broadcast frames (`kind 4`, topic `realtime:spotlight`, event `kudo`). Join replies are JSON text.
- RED/GREEN (temp spec, a foreign kudo written while the empty board is open, repeat 2):
  - unmuted: link count stays at 1 (2/2 failed);
  - muted: board stays empty (2/2 passed).

### B: the edit toast is destroyed by the feed remount (product)
- Deterministic repro (temp spec, 1 worker, repeat 3). It installs a MutationObserver on the toast and checks `isConnected` on the card's DOM node.
  - Control, no newer kudo (3/3): toast visible from about 130–220 ms and still there at 400–1000 ms; `cardRemounted:false`.
  - Newer public kudo written before "Lưu" (3/3): toast **visible 135→355 ms, then gone** (about 200 ms on screen); `cardRemounted:true`. The assertion right after the refresh fails with `element(s) not found`.
- Full run 1 (below) failed at `edit-kudo.spec.ts:52` with the same signature. In the failure snapshot:
  - the refresh had already committed (the card shows "Cảm ơn bạn, đã sửa lại");
  - another worker's kudo (`12/21/6878`) sits above ours (`01/30/5631`) at the top of page 1, so `feedKey` changed;
  - every `status` region is empty.
- Mechanism:
  - `app/(app)/kudos/page.tsx:52`: `feedKey = items[0].id:nextCursor`, then `<AllKudosFeed key={feedKey}>`;
  - `kudo-owner-edit-button.tsx` mounts `KudoComposerModal` (which owns `KudoComposerToast` state) inside `KudoCard`;
  - `use-kudo-composer-submit.ts:50`: `onSaved()` then `router.refresh()`.
- Production impact: any public kudo created, moderated or removed among the newest 10 between page load and the save triggers this. During the event that is the common case, so the edit confirmation almost always flashes for about 0.2 s.
- Why the spec only flakes: the toast is on screen for about 200 ms. A fast `toBeHidden` poll catches it, which is why targeted runs passed 20/20. Under 3-worker load, the refresh commit beats the poll.
- Lesser exposure: Highlight cards are keyed by id with no outer key. They lose the toast only if the edited card leaves the Highlight list after the refresh.
- Not patched. The fix moves toast ownership or the feed's reset strategy, which is neither tiny nor obviously correct. Options, recommended first:
  1. Lift the composer's success toast out of the keyed subtree: a page- or shell-level toast host fed by a small store, called by `KudoComposerModal`. This also covers the case where the edited kudo drops off page 1, and the Highlight case.
  2. Replace `key={feedKey}` with an in-component reset on `feedKey` change, so cards keyed by id survive. This does not cover the drop-off case.
- Ready RED test for the fixer: the `B:` test in `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\flakes\zz-tmp-flake-repro.spec.ts`. It seeds a public kudo dated 7999-12-31 after opening the editor, saves, waits for the new body, then asserts the toast is still visible.
- `edit-kudo.spec.ts` is unchanged on purpose. It is a true detector of this bug and should go stable once the product is fixed.

## Changes (tests only, no product code)
- `tests/e2e/kudos-authoring/kudo-e2e-fixtures.ts` (+4): before deleting, `deleteKudoDataOf` sets the users' **public** kudos to `spam`. That fires the product's own `removed` event, so open boards stay in step with the DB. The counter assertions are unchanged: still counter == DB, under concurrency.
- `tests/e2e/spotlight-board-e2e-helpers.ts` (88 → 115 lines):
  - new `muteSpotlightBroadcasts(page)`: `page.routeWebSocket` forwards every frame except broadcasts on `realtime:spotlight` (binary topic decoded, JSON `broadcast` checked);
  - the `resyncNow` comment is updated.
- `tests/e2e/spotlight-board-reconnect-and-search.spec.ts` (91 lines): the empty-snapshot test calls `muteSpotlightBroadcasts` before opening the page. Its four assertions are unchanged, and the socket and join stay real. The live-path tests stay unmuted.
- `playwright.config.ts`: not changed. No timeouts were raised.
- Temp specs were created and deleted (0 `zz-*` files left). Copies are in scratchpad `flakes\`.

## Scope Contract
- **Changed:** the shared kudo teardown (public → spam → delete), one new Spotlight test helper, the empty-snapshot test.
- **Impacted:** every e2e spec that uses `kudoUsers` (teardown); every Spotlight board open in parallel workers, which now receive `removed` events plus a 2–3 s refetch; any spec that counts spam globally (none: Review Content is filtered by sender, and the overview compares within one response).
- **Will verify:** RED/GREEN repros per cause; targeted Spotlight and edit-kudo specs at `--repeat-each=10 --workers=3`; the full e2e suite at `--workers=3 --timeout 90000`, run repeatedly.
- **Deliberately skipped:** unit and integration suites (no product code changed, and the DB was shared with another agent's integration runs); prelaunch config (untouched).

## Gate table (each run only after `busy.ps1` showed no vitest / db reset / seed process)
| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npx eslint` (3 changed files) | 0 | clean |
| 2 | `npx tsc --noEmit -p .` | 0 | clean |
| 3 | spotlight ×2 specs `--repeat-each=10 --workers=3` (after the A fix, before the A′ fix) | 1 | 49 passed, 1 failed (A′) |
| 4 | spotlight ×2 specs `--repeat-each=10 --workers=3` (final) | **0** | **50 passed** (117 s) |
| 5 | `edit-kudo.spec.ts --repeat-each=10 --workers=3` | **0** | **20 passed** (31 s) |
| 6 | full `npx playwright test --timeout 90000 --workers=3`, run 1 | 1 | 140 passed, 5 skipped, **1 failed (B, product bug)**, 0 flaky |
| 7 | full, run 2 | **0** | 141 passed, 5 skipped, 0 failed, 0 flaky (141 s) |
| 8 | full, run 3 | **0** | 141 passed, 5 skipped, 0 failed, 0 flaky (143 s) |
| 9 | full, run 4 | **0** | 141 passed, 5 skipped, 0 failed, 0 flaky (139 s) |

The Spotlight specs passed in all 4 full runs. Runs 2–4 are 3 consecutive green runs. Run 1 failed only on B, which these test changes cannot and should not hide. The 5 skips are pre-existing and unchanged. Logs and JSON reports are in scratchpad `flakes\` (`full-run-{1..4}.{log,json}`, `spotlight-repeat10*.log`, `edit-kudo-repeat10.log`, `repro-*.log`, `run1-edit-failure\error-context.md`).

## Concerns
1. **B is an open product bug** (FR-210 confirmation lost after almost every edit while others are posting). Until it is fixed, `edit-kudo.spec.ts:14` stays an intermittent red under 3 workers (1 in 4 full runs here). Owner: a product implementer, RED-first with the test above.
2. Teardown now emits a `removed` broadcast per public kudo, and every open board does one debounced refetch per burst. Wall time was 139–143 s for 146 tests, with no failures from it.
3. Observational, pre-existing: in the Mark Spam / Un Spam test, `settled = nextResync(page)` can be met by a refetch not caused by `restored`. Unrelated `removed` events are now more frequent. The final assertions still hold, and the M1 ordering is also unit-tested in `spotlight-resync-scheduler.test.ts`.
4. Integration tests (vitest) also hard-delete kudos. Running them during Playwright brings A back, so keep them serialized as in this session.
5. Next.js feedback pass: no qualifying Next.js friction; the command was not run.

**Status:** DONE_WITH_CONCERNS
**Summary:** A (and A′) were test-isolation faults, each proven RED→GREEN and fixed in the e2e teardown/helpers without weakening the assertions. The Spotlight specs then passed 50/50 at repeat-each 10 and in 4/4 full runs. B is a real product bug (the edit toast is destroyed when the save's refresh remounts the keyed All Kudos feed), proven deterministically and left unpatched.
**Concerns/Blockers:** B needs a product fix, owner to decide (lift the composer toast out of the `feedKey` subtree; RED test ready). Until then edit-kudo can still fail intermittently: full runs 2–4 were green, run 1 failed on B.
