---
phase: 06
feature: F005, F011
status: implemented (backend half)
created: 2026-11-16
---

# Phase 06 backend contracts (for the heart button and Admin › Settings UI)

Everything below is implemented and covered by `tests/unit/{kudos-hearts,admin-campaigns}/**` and
`tests/integration/{kudos-hearts,admin-campaigns}/**`. Never import a `server/*` file from a client
component, except the two `"use server"` action modules (Next turns them into action references).

## 1. Modules

| Import | Where | Exports |
|---|---|---|
| `@/features/kudos-hearts/server/kudo-heart-actions` | `"use server"` | `addHeartAction`, `removeHeartAction` |
| `@/features/kudos-hearts/schemas/kudo-heart-result` | client-safe (types + const) | `HEART_ERROR_STATUS`, `HeartErrorCode`, `HeartActionResult`, `KudoHeartSummary` |
| `@/features/kudos-feed/schemas/kudo-card-view` (phase 05) | client-safe | `KudoCardView` — already carries `heartCount`, `heartedByMe`, `isOwner`, `isSpam` |
| `@/features/kudos-authoring/server/kudo-write-window` (phase 04) | server-only | `isKudoWritingOpen()` — the same EVENT_END_AT window hearts use |
| `@/features/admin-campaigns/server/campaign-admin-query` | server-only (RSC) | `CampaignAdminQuery.list()` |
| `@/features/admin-campaigns/server/campaign-admin-actions` | `"use server"` | `createCampaign`, `updateCampaign`, `removeCampaign` |
| `@/features/admin-campaigns/schemas/campaign-admin-result` | client-safe | `CampaignListItem`, `CampaignPhase`, `CampaignActionResult`, `CampaignConflict`, `CAMPAIGN_ERROR_STATUS` |
| `@/features/admin-campaigns/schemas/campaign-input-schema` | client-safe | `CampaignCreateInput`, `CampaignUpdateInput`, `CampaignCreateSchema`, `CampaignUpdateSchema`, `campaignFieldErrors`, `CAMPAIGN_NAME_MAX_LENGTH` (100), `CAMPAIGN_FIELD_ERROR_KEYS` |

## 2. Heart button (F005)

```ts
addHeartAction(kudoId: string): Promise<HeartActionResult>     // idempotent
removeHeartAction(kudoId: string): Promise<HeartActionResult>  // idempotent
type HeartActionResult =
  | { ok: true; heartCount: number; heartedByMe: boolean }      // fresh RAW count after the write
  | { ok: false; error: "SELF_HEART" | "KUDO_UNAVAILABLE" | "EVENT_ENDED" | "UNEXPECTED" };
```

| `error` | Meaning | `kudosHearts.errors.<code>` (vi) |
|---|---|---|
| `SELF_HEART` (403) | viewer sent the Kudo (anonymous too) | "Bạn không thể thả tim cho Kudo của mình" |
| `KUDO_UNAVAILABLE` (404) | missing / malformed id / now spam | "Kudo này không còn khả dụng" |
| `EVENT_ENDED` (409) | from `EVENT_END_AT` | "Sự kiện đã kết thúc, không thể thả tim nữa" |
| `UNEXPECTED` (500) | server failure — also use it for a network error / thrown action | "Không thể cập nhật, vui lòng thử lại" |

- The user comes from the session only. A guest (expired session) is redirected to `/login` by the
  action itself (the thrown redirect navigates the router) — nothing to map.
- Optimistic flow: flip `heartedByMe` and ±1 at once, lock while pending, then apply the server's
  `{ heartCount, heartedByMe }` on `ok: true`; on `ok: false` (or a throw) revert and toast the message.
- No `revalidatePath`: the action's answer is the truth for that card; other viewers see it on reload (D008).
- Disabled (keep the count visible, reduced opacity): `isOwner` (tooltip = the SELF_HEART sentence,
  DEC-001) or writing closed — compute `await isKudoWritingOpen()` once in the RSC page and pass it down.
  Spam cards (`isSpam`) hide the heart (phase 05 rule).
- `heartCount` is the raw number of Sunners (x2 never shows on the card, D003); format "1.000" in vi.
- Responses never reveal who hearted (D009).

## 3. `KudoCardView` heart fields (phase 05 seam now real)

`heartCount: number` (raw, one per Sunner), `heartedByMe: boolean` (the viewer's own heart).
Loaded with ONE grouped query per page (`enrich-heart-summary.ts`). The Highlight is ranked by raw hearts
DESC, then newest, then id (`HeartRankingQuery`), the API shape is unchanged.

## 4. Admin › Settings (F011)

```ts
// app/admin/settings/page.tsx (RSC): list() calls requireAdmin() itself (non-admin → 403 page).
const campaigns: CampaignListItem[] = await CampaignAdminQuery.list();   // starts_at DESC, id DESC, no paging
type CampaignListItem = {
  id: number;                 // identity, shown in the ID column ("1", "2")
  name: string;
  startsAt: string; endsAt: string;          // ISO 8601 UTC
  phase: "upcoming" | "active" | "ended";    // server clock at render time
  startsAtLocal: string; endsAtLocal: string;      // "yyyy-MM-ddTHH:mm" in ADMIN_TIMEZONE → datetime-local value
  startsAtDisplay: string; endsAtDisplay: string;  // "dd/MM/yyyy - HH:mm" in ADMIN_TIMEZONE → Time column
};
```

- Time column: split a display string on `" - "` into the date and time parts (Figma gap 8 / 40).
- Row menu (DEC-001): Edit + Delete when `phase !== "ended"`; ended → no menu icon.
- Edit modal (DEC-002): `phase === "active"` → Start Date read-only. Send `startsAt` unchanged (its
  `startsAtLocal`) or omit it; a different minute is rejected with `startsAt: ["startLocked"]`.

### Actions (all call `requireAdmin()` first: non-admin → 403 `forbidden()`, guest → /login)

```ts
createCampaign(input: { name: string; startsAt: string; endsAt: string }): Promise<CampaignActionResult>
updateCampaign(input: { id: number; name: string; startsAt?: string; endsAt: string }): Promise<CampaignActionResult>
removeCampaign(id: number): Promise<CampaignActionResult>
type CampaignActionResult =
  | { ok: true; id: number }
  | { ok: false; code: "VALIDATION"; fieldErrors: Partial<Record<"name" | "startsAt" | "endsAt", FieldKey[]>> }
  | { ok: false; code: "OVERLAP"; conflict?: { name: string; startsAt: string; endsAt: string } }
  | { ok: false; code: "NOT_FOUND" | "ENDED" | "UNEXPECTED" };
```

- Input field names: `name`, `startsAt`, `endsAt`; the two instants are the raw
  `<input type="datetime-local">` values (`yyyy-MM-ddTHH:mm`), read on the server as ADMIN_TIMEZONE
  wall clock. Never convert in the browser. Pass a plain object (the actions do not read FormData).
- Field error keys → `adminCampaigns.errors.fields.<key>`: `nameRequired` (blank or > 100),
  `startRequired`, `endRequired`, `invalidDateTime` (bad shape, impossible date, or a year before
  2000), `endBeforeStart`, `endInPast`, `startLocked`.
  Show them under the matching input (overlap goes under End Date).
- Codes → `adminCampaigns.errors.<CODE>`: `VALIDATION`, `NOT_FOUND` ("Chiến dịch không còn tồn tại"),
  `OVERLAP` (generic), `ENDED` ("Chiến dịch đã kết thúc, không thể sửa hoặc xoá"), `UNEXPECTED`
  ("Không lưu được, vui lòng thử lại"). With `conflict`, use `adminCampaigns.errors.overlapWith`
  ("Khoảng thời gian trùng với chiến dịch {name} ({startsAt} - {endsAt})") — values are pre-formatted.
- The actions call `revalidatePath("/admin/settings")` on success and on NOT_FOUND / ENDED / OVERLAP, so
  the table re-renders in the same round trip (close the modal on `ok: true`; keep it open otherwise).
- Optional client pre-check: `CampaignCreateSchema.safeParse(form)` + `campaignFieldErrors(issues)`
  (name and format only; time-order and "now" checks are server-side).
- Empty state / error state copy: spec E13/E14 (UI-owned keys).

## 5. For later phases (server-only, not UI)

`HeartStatsQuery.receivedByUsers(userIds, asOf?)` → `Map<userId, { weightedTotal, rawTotal, campaignActive }>`
(phase 10/12/14), `HeartStatsQuery.receivedByUser`, `HeartRankingQuery.rankKudoIds(candidates, limit, asOf?)`,
`campaignActiveReader.findActive(at)` → `{ id, name, startsAt, endsAt } | null` (phase 10 x2 tooltip),
outbox `HeartAdded { kudoId, heartUserId }` (phase 13), written only when a heart row is inserted.
`heartUserId` is internal: a consumer never forwards it to a client (D009).

### `heartCountsSubquery(kudoIds, asOf?)` — the one heart count fragment

```ts
type KudoIdSet = SQLWrapper | readonly string[];  // one-column select of kudo ids, or a list of ids
heartCountsSubquery(kudoIds: KudoIdSet, asOf?: Date)
// → subquery "heart_counts" { kudoId, rawCount }: raw hearts (multipliers ignored) per hearted kudo in
//   kudoIds, hearts created <= asOf when given. Kudos without hearts have no row: LEFT JOIN + coalesce(…, 0).
```

- `kudoIds` is required: the aggregate reads only `kudo_id IN (kudoIds)` (unique `(kudo_id, user_id)`
  index), never the whole `kudo_hearts` table. Pass the same set the outer query reads.
- `rankKudoIds` passes `db.select({ id: candidates.id }).from(candidates)`.
- Phase 08 admin table (heart sort over the filtered set, then `LIMIT/OFFSET`):
  `heartCountsSubquery(db.select({ id: kudos.id }).from(kudos).where(adminWhere))`, LEFT JOIN on
  `kudos.id`, `ORDER BY coalesce(raw_count, 0) {ASC|DESC}, id DESC`. Counts for a page already in hand:
  pass the ids (`heartCountsSubquery(pageIds)`); an empty list counts nothing (`WHERE false`).
- Phase 14 (hearts per sender): pass the public kudos, `db.select({ id: kudos.id }).from(kudos).where(eq(kudos.status, "public"))`,
  then join `kudos` and `GROUP BY sender_id`.
- Spam is not filtered here: the id set decides (`rankKudoIds` candidates are public only).
