## Review Summary: Phase 12 (F012 Profile)

### Scope
- Files: features/profile/** (23 src files, all <=150 lines), app/(app)/profile/**, app/api/profile/[userId]/kudos, app/api/sunners/[userId]/card, edits to kudo-public-query.ts, kudo-card-sender.tsx, kudo-feed-status-message.tsx, hero-badge.tsx, messages en/vi; tests read-listed only (not run).
- Depth: recent (git diff + untracked), read-only, no suites run.

### Assessment
Privacy core is sound. Sender filter is derived from the session in one place (`profileKudosFilter`), "sent" for another user returns 403 before any read, C-05 guard applies to every count and list through the shared `listConditions`. No Critical. Two Warnings (keyboard reach of the hover card, stale card cache), rest Low.

### Critical
None.

### High
None.

### Medium / Warning
1. a11y: hover card unreachable by keyboard beyond the name link. `avatar-hover-card.tsx:78-110,140-147` portals the card to `document.body` (end of DOM). Tab from the name goes to the next page control, `blurName` closes the card when `relatedTarget` is outside the panel, so "Gui KUDO" and the in-card profile link cannot be tabbed to. Also the card is not announced (no `aria-describedby`/live). Fix: on Tab from the name link while open, move focus into the panel (`panelRef.current.querySelector('a,button').focus()`), or render the panel adjacent in DOM; link name via `aria-describedby={id}`. Acceptable alternative: keep as is, since the name link already goes to the profile, but record that Send-from-card is pointer-only.
2. Stale hover-card cache. `use-sunner-card.ts:11-30` caches per pathname for the page life. On the Live board (long-lived, realtime), counts and `canSendKudo` (EVENT_END) never refresh, and a kudo sent from the card does not update the count. Fix: TTL (e.g. 60 s timestamp in the Map) or clear `loaded` after the composer reports success.

### Low
- `profile-page-data.ts:46` + `profile-kudos-list-service.ts:33`: `ProfileQuery.getById` runs twice on other-profile first render (page + list service). Pass a flag or skip the check when the caller already resolved the profile.
- `listProfileKudos` recomputes 2 `count(*)` per "Tai them" page (3 queries/page). Indexes exist (`kudos_sender_id_created_at_id_idx`, `kudos_recipient_id_created_at_id_idx`) so cheap; only return counts on the first page if it ever matters.
- `LockedRecipientComposer` is mounted inside each card's block div: a feed remount/realtime key change mid-compose drops the modal. Rare; note only.
- `profile/[userId]` 404 is a soft 404 after streaming (accepted in decision-log 2026-11-16).
- `instant = false` plus `redirect()` after shell stream: client-side redirect, content identical (documented).
- `tabbable=false` branch (spam overlay) correctly disables card and keeps avatar link aria-hidden.

### Edge Cases Turned Up (checked, all OK)
- Cursor merge: public + own spam served by one `(created_at,id)` keyset in SQL (`inArray(status,[public,spam])` only when sender==viewer AND includeOwnSpam); no merge-in-JS skip/dup. Cursor is not bound to direction but is a plain position and the client resets on switch.
- Count parity: `count` uses the same `listConditions(filters,null)`; list joins are inner on NOT NULL FKs and left on departments, so no row drop; `ListOptionsSchema` strips `includeOwnSpam` harmlessly.
- Set-difference: other user's sender count (hover card) excludes anonymous via C-05; own card counts own public anonymous (matches phase 10 panel); spam never counted on cards. Unknown query keys (e.g. `senderId`) are ignored by the schema.
- Anonymous sender: `AnonymousSender` has no link/card; `NamedPerson` wraps only named people; card DTO is whitelisted (no email/role/avatar/kudo data); `SunnerCardView` carries no sender data; RSC props carry only `KudoCardView` (masked) and profile DTO.
- Ordering: 401/403(onboarding) from `requireApiSunner` first; then 400 params; malformed id 404 (no probe); sent-for-other 403 before reads (exists/not-exists indistinguishable). `Cache-Control: private, no-store` set on every response incl. errors via wrapper.
- Fetch storm: fetch only after 300 ms open, in-flight dedupe, cached; failures not cached so repeated hover retries (bounded by user action).
- IDOR on `[userId]`: all Sunner profiles are visible by design; only name/department/avatar/tier/public counts.
- Composer prefill: email `""` and no avatar, id sent; server recipient validation assumed unchanged (not re-read).
- i18n: en/vi key parity verified (0 diffs). Files all <200 lines. Edits outside ownership: only the planned shared touchpoints.

### Done Well
- Single choke point for the sender filter, plus `count` reusing `listConditions` (parity by construction).
- Error bodies `{code}` only; 500 path logs server-side and never leaks.
- Hover card: delay, Esc, press-outside, one-at-a-time, touch excluded, WCAG 1.4.13 grace delay, `:focus-visible` gating.
- `settle()` degrades regions instead of failing the page.

### Actions In Order
1. Decide on Warning 1 (focus into card or document the pointer-only Send).
2. Add TTL / post-send invalidation to hover-card cache.
3. Drop the duplicate `getById`; optional counts-on-first-page.
4. Human sign-off (sensitive area: authz, privacy).

### Numbers
- Type coverage / test coverage: not measured (read-only; implementer reports tsc/lint 0, unit 800, integration 458, e2e 127/5 skipped).
- Lint findings: not run.

### Still Unresolved
- Server-side composer validation of a locked recipient with empty email not re-verified here (phase 04 contract assumed).
- Realtime/stale behavior of the cached card on a long Live board session not browser-verified.

**Status:** DONE_WITH_CONCERNS
**Summary:** No critical or high findings; privacy and authz contracts hold. Two Warnings plus Low items.
**Concerns:** keyboard reach of hover card actions; stale card cache; human sign-off still required.

## Re-review after fix round (implementer-261123-phase-12-review-fixes.md)
- W1 (keyboard reach): FIXED. `use-hover-card-keyboard.ts` bridges Tab into/out of the portaled card, closes on focus leaving both, sets aria-expanded/aria-controls on the name; Esc/send return focus with a dismissed rule. e2e `profile-hover-card-keyboard.spec.ts:31,77`.
- W2 (stale cache): FIXED. `sunner-card-cache.ts` 60 s TTL (stale-while-revalidate), `invalidateSunnerCard` on composer `onSaved`, in-flight answers dropped on invalidation. Residual: Live-board launcher sends and own "sent" count rely on TTL (documented decision 5).
- Low getById duplicate: FIXED via React `cache()`.
- Residual: the 300 ms open delay has no direct test; Low item (composer inside card block) unchanged. Human sign-off still required.
