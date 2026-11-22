---
phase: 12
feature: F012
priority: P2
status: completed
depends_on: [09, 10]
file_ownership:
  - features/profile/**
  - app/(app)/profile/**
  - app/api/profile/**
  - app/api/sunners/[userId]/card/**
  - tests/unit/profile/**
  - tests/integration/profile/**
  - tests/e2e/profile*.spec.ts
---

# Phase 12 — Profile

## Context Links
- Spec: `spec/profile/functional-spec.md`, `spec/profile/technical-spec.md`, screens `spec/profile/screens/{SCR-own-profile,SCR-other-profile,SCR-avatar-hover-card}/spec.md`
- Decisions: `spec/decision-log.md` — profile read-only (Google data), department picked at onboarding (F001); anonymous kudos shown masked to everyone incl. recipient; "Số tim bạn nhận được" = hearts on kudos you SENT; spam = excluded from counts, own spam still visible to owner
- Architecture: `spec/system/architecture.md` § Cross-Feature Contracts (`KudoPublicQuery`, `KudoComposerModal`, `HeroTierQuery`, `PersonalStatsPanel`, `IconCollection`, `AvatarHoverCard`), § Consistency Check C-05, C-07, C-17, C-20
- Figma `9ypp4enmFmdK3YAFJLIu6C`: own profile `362:5037`, other profile `362:5097`, hover card `721:5827` (instance `2268:35101`). Study: `plans/reports/261108-0035-saa-2025-figma-screen-analysis.md` §3.5
- Upstream: 02 (`profiles`, `departments`, session helper), 04 (`KudoComposerModal`), 05 (`KudoPublicQuery`, `KudoCard`), 08 (`SpamKudoCard`, spam tag UI), 09 (`HeroTierQuery`, `HeroBadge`), 10 (`PersonalStatsPanel`, `IconCollection`)

## Overview
- Priority: P2 · Status: completed
- Two read-only pages (`/profile` own, `/profile/[userId]` other) + avatar hover card. Composes blocks owned by other phases; owns only page composition, the profile kudos list endpoint, the hover-card endpoint and `AvatarHoverCard`.

## Key Insights
- **Privacy core:** the sender filter is always bound from the session, never from the request. Allowing `senderId` of another user would reveal who sent anonymous kudos by set difference (BR-002). `direction=sent` with `userId != session` → 403.
- Masking stays in one place (`KudoPublicQuery`, phase 05). Own spam comes from `KudoPublicQuery.list({senderId: session.userId, includeOwnSpam: true})` (phase 05) and passes through the same card DTO mapper so an own anonymous spam kudo still shows "Ẩn danh" (BR-003).
- Merge public-sent page with own spam by `(created_at, id)` bounds (ALG-001) so the cursor never skips/duplicates; spam set per user is small (no pagination).
- Counts must equal what the list shows (BR-006): `received` = public received; `sent` = public sent + own spam. Personal stats panel (phase 10) keeps its own definitions (public only) — different labels, documented.
- Hover card returns only `{id, fullName, avatarUrl, department, heroTier?}`; never wraps anonymous sender avatars (DEC-003, BR-007).
- C-17: owner sees own spam card with "Spam" tag in "Đã gửi"; card click opens nothing new (detail 404s for spam per phase 05); edit locked (decision-log).

## Requirements
- Functional: FR-001, FR-002, FR-101..FR-104, FR-201..FR-205, FR-301..FR-305, FR-401..FR-405, FR-601..FR-604; BR-001..BR-007; DEC-001..DEC-003; ALG-001; US001..US006.
- Defaults adopted: D001 read-only; D002 anonymous received shown masked; D003 own anonymous sent shown masked; D004 card = avatar, name, department code, Hero badge, "Xem profile" (verify frame `721:5827`); D005 card on non-anonymous avatars on kudo cards; D006 sent count includes own spam; D007 touch → navigate, no card; D008 composer recipient prefilled + locked; D009 routes `/profile`, `/profile/[userId]`.
- `PROFILE_KUDOS_PAGE_SIZE` = feed page size from phase 05; `HOVER_CARD_OPEN_DELAY_MS` = 300 (YAGNI pick).
- Non-functional: own page data queries run in parallel; hover card cached per page session (RISK-01); list request de-dupes rapid dropdown toggles (last wins, AbortController).

## Architecture
```
/profile (Server Component)                      /profile/[userId] (Server Component)
  session.userId ─┐                                 userId == session → redirect('/profile')   (DEC-001)
                  ├ ProfileQuery#getById             no profile → notFound()
                  ├ HeroTierQuery([id])  (09)        else: ProfileQuery, HeroTierQuery, IconCollection(named)
                  ├ IconCollection data  (10)        no stats panel (BR-004)
                  ├ PersonalStatsPanel   (10)        SendKudoButton → KudoComposerModal{mode:create, recipient, lockRecipient:true} (04, C-07)
                  └ ProfileKudosSection(direction=sent default)   ProfileKudosSection(direction=received, label only)

GET /api/profile/[userId]/kudos?direction=sent|received&cursor=
  Zod → session required (401)
  received → KudoPublicQuery.list({recipientId:userId, cursor, limit})           (05, C-05)
  sent     → userId must == session.userId else 403
             KudoPublicQuery.list({senderId: session.userId, cursor, limit})
             with includeOwnSpam:true (05) — single cursor, no merge needed
  counts   → ProfileKudoCountsQuery (same predicates) → {received, sent?}
  → {items: KudoCardDto[] (spam items flagged isSpam), nextCursor, counts}

GET /api/sunners/[userId]/card → ProfileQuery + HeroTierQuery → {id, fullName, avatarUrl, department, heroTier?}
AvatarHoverCard (client) wraps avatar → delay → fetch once (module Map cache) → card; Esc/leave closes
```
- C-18: pages = Server Components; client-paginated reads = Route Handlers; no mutations in this phase.
- `KudoPublicQuery` filter/cursor contract (phase 05, C-05) is consumed, not re-implemented. If phase 05 shipped without `recipientId`/`senderId`, the extension lands in phase 05's file as a precondition PR owned by phase 05's module (flag BLOCKED rather than writing a second query).

## Related Code Files
Create:
- `app/(app)/profile/page.tsx` — own profile
- `app/(app)/profile/[userId]/page.tsx` — other profile (redirect / notFound)
- `app/api/profile/[userId]/kudos/route.ts`
- `app/api/sunners/[userId]/card/route.ts`
- `features/profile/server/profile-query.ts` — `getById` (profiles ⨝ departments; no email in DTO)
- `features/profile/server/profile-kudos-list-service.ts` — DEC-002 + ALG-001 orchestration
- `features/profile/server/profile-kudo-counts-query.ts` — counts with the same predicates as the list
- `features/profile/server/sunner-card-query.ts`
- `features/profile/lib/merge-own-spam-into-sent-page.ts` — ALG-001 pure function
- `features/profile/schemas/profile-kudos-request-schema.ts` — `direction`, `cursor`, `userId` uuid
- `features/profile/components/profile-header.tsx` — avatar, name, department, `HeroBadge`
- `features/profile/components/profile-kudos-section.tsx` (client: dropdown/label, list, "Tải thêm", empty/error)
- `features/profile/components/profile-send-kudo-button.tsx` (client; opens composer locked)
- `features/profile/components/avatar-hover-card.tsx` (client; exported for kudo cards)
- `features/profile/components/sunner-card-content.tsx`
- Tests: `tests/unit/profile/merge-own-spam-into-sent-page.test.ts`, `tests/integration/profile/{profile-kudos-route,sunner-card-route,profile-pages}.test.ts`, `tests/e2e/profile.spec.ts`

Modify:
- Phase 05 `KudoCard` avatar render — wrap non-anonymous sender/recipient avatars with `AvatarHoverCard` and link to profile (small edit; phase 05 is already merged)
- `messages/vi.json`, `messages/en.json` — `profile.*` keys only

Delete: none.

## Implementation Steps
1. Read `node_modules/next/dist/docs/` for dynamic route params (async `params` in 16), `redirect`/`notFound`, Route Handlers, Server→Client props.
2. Confirm upstream contracts exist with expected shapes: `KudoPublicQuery.list({recipientId?, senderId?, cursor, limit})` + opaque `(created_at,id)` cursor; `includeOwnSpam` option; card DTO mapper; `KudoComposerModal` props `{mode, recipient?, lockRecipient?}`; `HeroTierQuery.getTiersByRecipientIds`; `PersonalStatsPanel`, `IconCollection` (named variant for other profile). Missing → report BLOCKED to controller (do not fork queries).
3. `profile-query.ts` + `sunner-card-query.ts` (select explicit columns; no email/role).
4. `merge-own-spam-into-sent-page.ts` per ALG-001 (upper = cursor key or +∞; lower = last key when page full else −∞; strict `lower < key <= upper`; sort desc; `nextCursor` from public page only). Unit-test boundaries first.
5. `profile-kudo-counts-query.ts`: `received = COUNT public WHERE recipient_id`; `sent = COUNT public WHERE sender_id=session + COUNT spam WHERE sender_id=session`. Reuse phase 05 predicate builder if exported.
6. `profile-kudos-list-service.ts` + route: Zod (400 on bad direction/cursor), 401 no session, 403 sent-for-other, 404 unknown user; `Cache-Control: no-store`; errors 500 without detail.
7. Pages: own (parallel `Promise.all`), other (redirect self, notFound unknown); hide department/badge when absent; 6 icon slots via `IconCollection`.
8. `profile-kudos-section.tsx`: default `sent` on own, label "Đã nhận: n Kudos" on other; switching direction resets list; AbortController last-wins; spam items render `KudoCard` with "Spam" tag (phase 08 component/prop).
9. `avatar-hover-card.tsx`: hover/focus → delay → fetch `/api/sunners/{id}/card` once (Map cache); yellow ring; Esc/leave closes; click → profile; disabled on `(hover: none)`; render nothing on fetch error.
10. Wrap avatars in phase 05 `KudoCard` (skip anonymous sender); send button opens composer with locked recipient.
11. i18n keys; tests per Scope Contract.

## Todo List
- [x] Read Next 16 docs (async params, redirect/notFound, route handlers)
- [x] Verify upstream contracts (05, 08, 04, 09, 10): no BLOCKED. `KudoPublicQuery` already had `recipientId`/`senderId`/`includeOwnSpam`; only `count` was missing (added, see Delivery Notes)
- [x] ProfileQuery, SunnerCardQuery
- [x] ALG-001: done in SQL by phase 05's single `(created_at, id)` keyset; the planned in-process merge function was deliberately not written (test-only seam). Proven at integration
- [x] Counts query (`profile-kudo-counts-query.ts`, plus `KudoPublicQuery.count`)
- [x] Profile kudos route (401/403/404/400)
- [x] Own + other pages
- [x] Kudos section client component
- [x] AvatarHoverCard + wrap in KudoCard (`kudo-card-sender.tsx`)
- [x] Send-kudo button with locked composer
- [x] i18n (`profile.*`, vi/en parity), unit + integration + e2e tests. `profile-pages.test.ts` (integration) replaced by e2e, see Open items
- [x] Review-fix round: hover card keyboard bridge (W1), 60 s cache TTL + invalidation (W2), `getById` deduped with React `cache()`

## Success Criteria
Evidence: implementer reports `plans/reports/implementer-261123-phase-12-profile.md` and `-review-fixes.md`; reviewer `plans/reports/reviewer-261123-phase-12.md` (0 critical / 0 high; W1, W2 fixed on re-review); `evidence/phase-12/{inspection-verdict,temper-results}.json` (SEALED, score 8); screenshots `evidence/screenshots/phase-12/` (own, other, hover card, keyboard focus; desktop 1440x900 + mobile 375x812).
- [x] **Redirect / 404:** `/profile/{ownId}` redirects to `/profile`; unknown or malformed id shows "Không tìm thấy Sunner này.". Evidence: e2e `profile.spec.ts` ("your own id redirects...").
- [x] **403 on sent-for-other, no request parameter sets `senderId`:** 403 before any existence read; unknown keys ignored by the schema. Evidence: integration `profile-kudos-route-guards`; unit `profile-kudos-filter`, `profile-kudos-request-schema`.
- [x] **Anonymous masked for everyone:** no sender id/name/avatar in "Đã nhận" or the sender's own "Đã gửi". Evidence: integration `profile-kudos-route-lists`.
- [x] **Own spam only in owner's "Đã gửi", tagged; absent from recipient's "Đã nhận":** Evidence: integration `profile-kudos-route-lists`; e2e `profile.spec.ts` (blurred overlay, Tab order).
- [x] **Counts equal paginated totals (both directions):** `count` shares `listConditions` with `list`. Evidence: integration `profile-kudos-route-lists`.
- [x] **Keyset across public + own spam, every item once, `(created_at, id)` desc:** 16 sent, 4 spam interleaved, tie straddling the 10-row boundary, pages 10 + 6, exact DB order. Evidence: integration `profile-kudos-route-lists`.
- [x] **Other profile has no stats panel; send button opens composer locked:** the composer sends a real Kudo. Evidence: e2e `profile.spec.ts` ("other profile...").
- [x] **Hover card: one fetch per user per page, not on anonymous avatars:** Evidence: e2e `profile-hover-card.spec.ts:16` (one request, one card at a time), `:109` (anonymous, no request).
- [x] **Hover card opens on hover/focus, gold ring, Esc/leave closes, touch navigates; keyboard reach:** e2e `profile-hover-card.spec.ts:16,53,131`, `profile-hover-card-keyboard.spec.ts:31,77`. The 300 ms delay itself is not directly asserted (Open items).
- [x] **Card payload whitelist:** `{id, fullName, departmentName, heroTier, kudosReceived, kudosSent, canSendKudo}`, no email/role. Evidence: integration `sunner-card-route`.
- [x] **Cache:** 60 s TTL + invalidation after a locked-composer send. Evidence: unit `sunner-card-cache-ttl-and-invalidation` (4 tests); e2e `profile-hover-card.spec.ts:71`.
- [x] **RED before code:** unit exit 1 (modules not found), integration exit 1, e2e 9/9 fail; review-fix round RED: unit 4/4, e2e 3 failed.
- [x] **Gates on final code, each run alone:** `tsc` 0, lint 0, unit 804 (68 files), `db:reset` + integration 458 (71 files), e2e 129 passed / 5 skipped (pre-existing) / 0 failed, prelaunch e2e 5 passed / 1 skipped, `build` ok, `test:prod` all pass.
- [x] **Reviewer:** 0 critical / 0 high; W1 and W2 fixed and re-reviewed; the reviewer asked for human sign-off (authz, privacy).
- Risk sign-off: per the user's conditional pre-approval 2026-11-22, recorded at commit time.

## Delivery Notes
Drift from the plan text (decisions are in `spec/decision-log.md` § Session 2026-11-23, "mặc định, chờ user xem lại"):
- **ALG-001 in SQL, one cursor.** Phase 05 serves own sent as `status IN (public, spam)` with a single `(created_at, id)` keyset, only when sender == viewer AND `includeOwnSpam`. `merge-own-spam-into-sent-page.ts` and its unit test were not created. The plan's references to `OwnSpamKudoQuery` and `SpamKudoCard` are stale.
- **`KudoPublicQuery.count(filters)`** added in `features/kudos-feed/server/kudo-public-query.ts` (+ exported type `KudoListFilters`). Reuses the private `listConditions`, so counts equal lists by construction (BR-006) and the C-05 anonymity guard applies to every count. Throws `RangeError` on invalid filters.
- **Counts:** profile `received` = public received; own `sent` = public sent + own spam (D006). Hover card `kudosSent` = public sent via `count({viewerId, senderId})`: another user's anonymous kudos are excluded (decision 2026-11-23), spam never counted; the own card counts own public anonymous (as the phase 10 panel).
- **Hover card per Figma 2268:35101:** no avatar (Figma draws none); payload above; `canSendKudo` = not own card and writing open. Opens 300 ms after pointer enter or keyboard `:focus-visible` on the name link; closes on leaving block + card (150 ms grace), Esc, press elsewhere; one open per page; touch never opens. Non-modal `role="dialog"` in a body portal (the Highlight track is transformed and would clip it).
- **Keyboard bridge + aria (review W1).** `use-hover-card-keyboard.ts` moves focus by hand: Tab from the name goes into the card (name link, "Gửi KUDO"), Shift+Tab/Esc back to the name, Tab off the last control closes the card and continues in page order. `aria-expanded`/`aria-controls` sit on the name link. After Esc or send the card stays shut until focus leaves the name.
- **60 s cache + invalidation (review W2).** `sunner-card-cache.ts`: `SUNNER_CARD_TTL_MS = 60_000`, stale-while-revalidate, failures not cached; `invalidateSunnerCard(recipientId)` on `onSaved` of the locked composer (card button and profile pill). Live-board launcher sends and the viewer's own "sent" count rely on the TTL.
- **Locked recipient `email: ""`.** The composer shows only the name and sends the id; profile DTOs never carry emails.
- **Route order:** 401 -> 400 VALIDATION -> 404 malformed id -> 403 sent-for-other (before any existence read: no oracle) -> 404 unknown -> 200; `Cache-Control: private, no-store` on all answers, error bodies `{code}` only.
- **Soft 404 / redirect.** Pages are blocking routes (`instant = false`) like `/kudos/[id]`; once the shell has streamed in production, the own-id redirect and unknown-id 404 are soft (decision 2026-11-16). `ProfileQuery.getById` is wrapped in React `cache()`.
- **Edits outside `file_ownership`** (minimal, forced by the contracts): `features/kudos-feed/server/kudo-public-query.ts` (`count`), `features/kudos-feed/components/kudo-card-sender.tsx` (named person block wrapped in `AvatarHoverCard`, off under the owner's spam overlay; name link carries `data-hover-card-name`), `features/kudos-feed/components/kudo-feed-status-message.tsx` (optional `returnTo` for the 401 sign-in link, default `/kudos`), `features/hero-badges/components/hero-badge.tsx` (size `hoverCard`, about 164 px), `messages/{vi,en}.json` (`profile.*` only).
- **Dev-server stale-module workaround.** Under `next dev` (Turbopack) route handlers served an old copy of `kudo-public-query.ts` (`KudoPublicQuery.count is not a function`) while pages had the new one; a one-character comment edit forced recompilation and remains in the file. Dev-only; production build is unaffected.
- **Other profile caption** "Bộ sưu tập icon"; `IconCollection` unchanged. The stats panel's Suspense fallback is `null` (small layout shift, same as the Live board).

## Open items
- **300 ms open delay has no direct test.** Only the anonymous case waits past it. A Resource Timing assertion (request `startTime` minus pointer-enter >= 300 ms) would not be flaky.
- **Mixed-input focus edge (not fixed):** focus inside card A while the mouse opens card B closes A and focus drops to body.
- **Planned `tests/integration/profile/profile-pages.test.ts` was not written:** redirect, not-found and no-stats are covered by e2e (stronger layer).
- **Stale references in specs:** `OwnSpamKudoQuery`, `SpamKudoCard`, `merge-own-spam-into-sent-page`, planned `ProfileKudosHandler`/`SunnerCardHandler` names, hover-card content "avatar + department code" in `spec/profile/` and `docs/features/F012_Profile/` (still the greenfield draft) and `docs/screens/SCR021..SCR023`: sync via `rebuild-spec --features F012`.
- **Staleness the TTL still bounds (<= 60 s):** cards after a Live-board launcher send, the viewer's own "sent" count, `canSendKudo` at EVENT_END.
- **Keyboard trade-off:** a keyboard user staying on a name >= 300 ms (plus load) gets 2 extra Tab stops; fast tabbing never opens the card.
- **Low, unchanged:** `LockedRecipientComposer` mounts inside each card's block, so a feed remount mid-compose drops the modal; `listProfileKudos` recomputes 2 counts per "Tải thêm" page (indexed, cheap).
- **Server-side validation of a locked recipient with empty email** was assumed unchanged from phase 04 and not re-read by the reviewer (e2e sends a real Kudo through it).

## Scope Contract — **full test set required** (authorization on data endpoints, anonymous-sender privacy, new public API contracts)
- **Changed:** profile pages, `GET /api/profile/[userId]/kudos`, `GET /api/sunners/[userId]/card`, `features/profile/**`, `KudoCard` avatar wrap, i18n keys.
- **Impacted:** Live board / feed rendering (KudoCard edit), phase 05 `KudoPublicQuery` callers (consumed only, unchanged), composer opened in locked mode (phase 04).
- **Will verify:** unit — ALG-001 boundaries (empty spam, all spam older/newer, ties on created_at, partial last page); integration (local Supabase, real DB) — route matrix: no session 401, sent-other 403, bad cursor 400, unknown 404, received masks anonymous, own sent includes masked anonymous + spam tagged, counts == paginated totals, card endpoint field whitelist; e2e — own profile render, dropdown switch, other profile no stats, send-kudo locked recipient submit, hover card open/close, Esc.
- **Deliberately skipped:** internals of `PersonalStatsPanel`/`IconCollection`/`HeroBadge` (owned + tested in phases 09/10; only presence asserted); feed query behaviour beyond the new filters (phase 05 suite) — but re-run phase 05 KudoCard component tests because the avatar wrap touches it.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|-----------|
| Sender inferred via sent filter | L | High | senderId from session only; 403 test; no generic query param |
| Own anonymous spam bypasses masking (own-spam rows via includeOwnSpam) | M | High | Map spam rows through phase 05 card mapper; integration test asserts no sender fields |
| Upstream query lacks filters (C-05 not done in 05) | M | M | Step 2 contract check → BLOCKED, fix in phase 05 module, not a parallel query |
| Count/list drift (BR-006) | M | L | Shared predicates; test counts == paginated totals |
| Hover card request storm on Live board (RISK-01) | M | L | Open delay + per-page Map cache + no touch wrap |
| KudoCard edit collides with another phase | L | L | Phases 13/14 do not touch KudoCard; single small diff |

Rollback: routes and pages are additive; revert KudoCard wrap restores previous avatars.

## Security Considerations
- Session required on pages (redirect via proxy) and APIs (401); RLS on business tables has no client policy (C-20) — all reads server-side via Drizzle.
- Stats and "Đã gửi" served only to owner (FR-603), enforced server-side.
- Card/profile DTOs exclude email, role, last login.
- `userId` validated as uuid before DB access; cursor opaque + validated.

## Next Steps
- Phase 11 name-click target `/profile/{id}` satisfied here.
- Phase 13 notification links to kudos/profile reuse these routes.
- C-ids resolved (consumer side): **C-05** (consumes recipient/sender filters + shared cursor; sender bound from session), **C-07** (composer prefilled + locked), **C-17** (owner sees own spam tagged, read-only), C-20 (server-only reads).
