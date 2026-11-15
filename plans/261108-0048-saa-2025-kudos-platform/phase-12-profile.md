---
phase: 12
feature: F012
priority: P2
status: pending
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
- Priority: P2 · Status: pending
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
- [ ] Read Next 16 docs (async params, redirect/notFound, route handlers)
- [ ] Verify upstream contracts (05, 08, 04, 09, 10) — BLOCKED if missing
- [ ] ProfileQuery, SunnerCardQuery
- [ ] ALG-001 merge + unit tests
- [ ] Counts query
- [ ] Profile kudos route (401/403/404/400)
- [ ] Own + other pages
- [ ] Kudos section client component
- [ ] AvatarHoverCard + wrap in KudoCard
- [ ] Send-kudo button with locked composer
- [ ] i18n, integration + e2e tests

## Success Criteria
- SC: self via `/profile/{ownId}` → redirect `/profile`; unknown id → 404 page.
- `direction=sent` for another user → 403, no body data; no request parameter can set `senderId`.
- Anonymous kudo on recipient's "Đã nhận" and sender's own "Đã gửi": response JSON contains no sender id/name/avatar.
- Own spam appears only in owner's "Đã gửi" with "Spam" tag; absent from the recipient's "Đã nhận".
- Dropdown counts equal total items reachable by paginating to the end (both directions).
- Paginating "Đã gửi" with spam interleaved yields every item exactly once in `(created_at,id)` desc order.
- Other profile renders no stats panel; send button opens composer with recipient locked.
- Hover card: one fetch per user per page; not attached to anonymous sender avatars.

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
