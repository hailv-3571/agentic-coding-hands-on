---
phase: 05
feature: F004
status: implemented (backend / data half)
created: 2026-11-16
---

# Phase 05 backend contracts (for the Live board / detail UI)

Everything below is implemented and covered by `tests/unit/kudos-feed/**` and
`tests/integration/kudos-feed/**`. Decisions applied: decision-log 2026-11-15/16 (title optional,
restricted Markdown body, `anonymous_nickname`, hashtags 1–5, Phase 05 Figma session).

## 1. Modules

| Import | Where | Exports |
|---|---|---|
| `@/features/kudos-feed/schemas/kudo-card-view` | client-safe (types only) | `KudoCardView`, `KudoCardCore`, `KudoHeartSummary`, `KudoSenderView`, `KudoAnonymousSenderView`, `KudoPersonView`, `KudoDepartmentView`, `KudoCardHashtag`, `KudoCardImage`, `KudoHeroTier` |
| `@/features/kudos-feed/markdown/parse-kudo-body` | client-safe (pure, no React) | `parseKudoBody(raw: string): KudoBodyNode[]` |
| `@/features/kudos-feed/markdown/kudo-body-ast` | client-safe (types only) | `KudoBodyNode`, `KudoInlineNode`, `KudoListItem`, one type per node |
| `@/features/kudos-feed/server/kudo-public-query` | server-only | `KudoPublicQuery { list, findForViewer, publicKudoIdsSubquery }`, `KudoListOptions`, `KudoListPage`, `FEED_PAGE_SIZE` (10), `FEED_PAGE_SIZE_MAX` (50) |
| `@/features/kudos-feed/server/kudo-highlight-query` | server-only | `listHighlightKudos(options)`, `HIGHLIGHT_COUNT` (5), `HighlightOptions`, `HighlightResult` |
| `@/features/kudos-feed/server/kudo-feed-cursor` | server (uses `Buffer`) | `InvalidKudoFeedCursorError` (+ encode/decode, internal) |
| `@/features/kudos-authoring/server/hashtag-list-query` (phase 04) | server-only | `listActiveHashtags(locale)` → `{ id, label }[]` for the Hashtag filter (also `GET /api/hashtags`) |
| `@/features/auth/server/department-options-query` (phase 02) | server-only | `listDepartmentOptions(locale)` → `{ id, name }[]` for the Phòng ban filter (seed `name` = the code, e.g. `CEVC1`) |

Never import `kudo-public-select.ts`, `kudo-row-mask.ts` or any `server/*` file from a client
component. Never pass anything but a `KudoCardView` to a client component (FR-602: the RSC payload is
a response too).

## 2. `KudoCardView` (exact)

```ts
type KudoHeroTier = "new" | "rising" | "super" | "legend";          // phase 05 always null
type KudoDepartmentView = { id: string; code: string };              // card shows `code`
type KudoPersonView = {
  id: string; name: string; avatarUrl: string | null;
  department: KudoDepartmentView | null; tier: KudoHeroTier | null;
};
type KudoAnonymousSenderView = { anonymous: true; nickname: string };
type KudoSenderView = ({ anonymous: false } & KudoPersonView) | KudoAnonymousSenderView;
type KudoCardHashtag = { id: string; label: string };                // label already has "#": "#BE A TEAM"
type KudoCardImage = { position: number; url: string | null };       // signed read URL, 30 min; null = signing failed
type KudoCardCore = {
  id: string;
  sender: KudoSenderView;
  recipient: KudoPersonView;
  title: string | null;          // Danh hiệu, optional
  body: string;                  // raw restricted Markdown → parseKudoBody(body)
  hashtags: KudoCardHashtag[];   // seed order; every attached hashtag
  images: KudoCardImage[];       // position order 0..4
  createdAt: string;             // ISO 8601 UTC (ms)
  isOwner: boolean;              // viewer sent it (also for their own anonymous Kudo)
  isSpam: boolean;               // true only on the viewer's own spam Kudo
};
type KudoHeartSummary = { heartCount: number; heartedByMe: boolean };   // phase 05: 0 / false
type KudoCardView = KudoCardCore & KudoHeartSummary;
```

Display rules: narrow on `sender.anonymous`. Anonymous → `avatar-anonymous.png`, the nickname
(Bold 22/28), subtitle "Người gửi ẩn danh", no profile link, no badge (Figma 2099:9148). Named →
avatar, name, department `code`, link `/profile/{id}`. Edit pen only if `isOwner && !isSpam`
(opens the phase 04 composer in edit mode for `id`; see `phase-04-backend-contracts.md` and the
composer's own props). `isSpam` → spam tag + "edit locked" note, hide
heart, Copy Link and edit (F007 FR-303/D006). Time `HH:mm - MM/DD/YYYY` in `Asia/Ho_Chi_Minh` for
both locales. Hashtags: join `label`s with spaces. Images: the precedent in
`kudo-image-thumbnail.tsx` is a plain `<img>` with `// eslint-disable-next-line @next/next/no-img-element`
(signed Supabase URLs are not in `images.remotePatterns`); render a placeholder when `url` is null.

## 3. Body AST (`parseKudoBody`)

```ts
type KudoInlineNode =
  | { type: "text"; value: string }                     // literal: render as a React text child
  | { type: "break" }                                   // <br />
  | { type: "strong"; children: KudoInlineNode[] }      // <strong>
  | { type: "emphasis"; children: KudoInlineNode[] }    // <em>
  | { type: "strike"; children: KudoInlineNode[] }      // <s> (or <del>)
  | { type: "link"; href: string; children: KudoInlineNode[] };
type KudoListItem = { children: KudoInlineNode[] };     // <li>
type KudoBodyNode =
  | { type: "paragraph"; children: KudoInlineNode[] }                      // <p>
  | { type: "list"; ordered: false; items: KudoListItem[] }                // <ul>
  | { type: "list"; ordered: true; start: number; items: KudoListItem[] }  // <ol start={start}>
  | { type: "quote"; children: (paragraph | list node)[] };                // <blockquote>, never nested
```

- `link.href` is already an absolute http(s) URL validated with `new URL()` and normalized. Render
  `<a href={href} target="_blank" rel="noopener noreferrer nofollow">`. Links never nest.
- No HTML node, no image node exists. Render with React elements only — never
  `dangerouslySetInnerHTML`. `@Full Name` mentions are plain text. Unknown node type: render nothing.
- Card: clamp the rendered body with CSS line-clamp (decision-log 2026-11-16); detail: full body.
  No `plainTextExcerpt` helper is exported (the card does not need one).

## 4. Calling from an RSC page (Next 16: async `params`, `notFound()` throws)

```tsx
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireSunner } from "@/shared/auth/current-user";
import { defaultLocale, isLocale } from "@/shared/i18n/locales";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { listHighlightKudos } from "@/features/kudos-feed/server/kudo-highlight-query";

// app/(app)/kudos/page.tsx
const { userId } = await requireSunner();              // redirects guests; also calls connection()
const raw = await getLocale();
const locale = isLocale(raw) ? raw : defaultLocale;
const [feed, highlight] = await Promise.all([
  KudoPublicQuery.list({ viewerId: userId, locale }),   // { items, nextCursor? }
  listHighlightKudos({ viewerId: userId, locale }),     // { items, total } — no filters = "Tất cả"
]);

// app/(app)/kudos/[id]/page.tsx  — props: { params: Promise<{ id: string }> }
const { id } = await params;
const kudo = await KudoPublicQuery.findForViewer(id, userId, locale);
if (!kudo) notFound();   // bad uuid / missing / someone else's spam → same 404. Do NOT wrap in try/catch.
```

`list` options: `{ viewerId, locale, recipientId?, senderId?, hashtagId?, departmentId?, cursor?,
limit? (1..50, default 10), includeOwnSpam? }`. `includeOwnSpam` is honoured only when
`senderId === viewerId`; whenever `senderId` is set, other people's anonymous Kudos are excluded.
Throws `InvalidKudoFeedCursorError` (bad cursor) or `RangeError` (malformed ids / limit). Pass the
first page's `nextCursor` to the client "Tải thêm" button, which calls `GET /api/kudos?cursor=`.

## 5. Route handlers

All answer JSON with `Cache-Control: private, no-store`. Error bodies are `{ code }` (+ `fieldErrors`)
and never carry Kudo content. Treat ANY 401 as "session expired" (the proxy may answer
`401 { code: "unauthorized" }` first).

| Endpoint | 200 | Errors |
|---|---|---|
| `GET /api/kudos?cursor=<opaque>` — absent = first page | `{ items: KudoCardView[], nextCursor?: string }` — 10 per page, newest first; `nextCursor` absent on the last page | 401 `UNAUTHENTICATED`, 403 `ONBOARDING_REQUIRED`, 400 `VALIDATION { fieldErrors: { cursor: ["invalid"] } }` (bad, empty or > 200 chars — show the inline error and retry from the first page), 500 `UNEXPECTED` |
| `GET /api/kudos/highlight?hashtag=<uuid>&department=<uuid>` — absent = "Tất cả"; department = the recipient's | `{ items: KudoCardView[], total: number }` — ≤ 5, hashtag AND department, phase 05 ranks newest first (phase 06: most hearts); `total` = `items.length` (the "n/N" pager); empty = `{ items: [], total: 0 }` | 401, 403 `ONBOARDING_REQUIRED`, 400 `VALIDATION { fieldErrors: { hashtag \| department: ["invalid"] } }` (present but empty is invalid — omit the param for "Tất cả"), 500 |

There is no `GET /api/kudos/{id}`: the detail page reads `findForViewer` directly.

## 6. Seams (each phase rewrites only its own file)

```ts
// server/enrich-heart-summary.ts — owned by phase 06 from now on
type EnrichHeartSummary = (cards: KudoCardCore[], viewerId: string) => Promise<KudoCardView[]>;
type RankKudoIdsForHighlight = (candidates: PublicKudoIdsSubquery, limit: number) => Promise<string[]>;
// defaults: heartCount 0, heartedByMe false; ranking = created_at DESC, id DESC

// server/enrich-hero-tier.ts — owned by phase 09 from now on
type EnrichHeroTier = (cards: KudoCardView[]) => Promise<KudoCardView[]>;   // default: identity (tiers stay null)

// server/kudo-public-filters.ts (via KudoPublicQuery.publicKudoIdsSubquery)
publicKudoIdsSubquery(filters?: { hashtagId?: string; departmentId?: string })
// → Drizzle subquery "public_kudo_ids" with fields { id, createdAt }, status = 'public', AND filters
```

`kudo-card-enrichment.ts` (phase 05) runs hearts then tiers after masking, so a seam never sees an
anonymous sender's id. UI seams (`kudo-card-heart-slot.tsx`, `kudo-card-hero-badge-slot.tsx`) are the
UI agent's files; feed them `heartCount`/`heartedByMe` and `tier`.

## 7. i18n

The backend adds no message keys. Error codes above map to `kudosFeed.*` keys the UI owns.
