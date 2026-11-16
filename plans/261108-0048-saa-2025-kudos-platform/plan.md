---
title: SAA 2025 Kudos Platform
status: in-progress
created: 2026-11-08
spec:
  - docs/features/F001_Auth/
  - docs/features/F002_AppShell/
  - docs/features/F003_KudosAuthoring/
  - docs/features/F004_KudosFeed/
  - docs/features/F005_KudosHearts/
  - docs/features/F006_AwardsPortal/
  - docs/features/F007_AdminModeration/
  - docs/features/F008_SpotlightBoard/
  - docs/features/F009_HeroBadges/
  - docs/features/F010_SecretBoxRewards/
  - docs/features/F011_AdminCampaigns/
  - docs/features/F012_Profile/
  - docs/features/F013_Notifications/
  - docs/features/F014_AdminUserManagement/
  - docs/features/F015_AdminOverview/
system_doc_drafts:
  - plans/261108-0048-saa-2025-kudos-platform/spec/system/architecture.md
  - plans/261108-0048-saa-2025-kudos-platform/spec/system/permissions.md
decision_log: plans/261108-0048-saa-2025-kudos-platform/spec/decision-log.md
---

# SAA 2025 Kudos Platform — Implementation Plan

Web nội bộ Sun* Annual Awards 2025 ("ROOT FURTHER"): cổng thông tin giải thưởng + Sun* Kudos (ghi nhận, tim, Hero, Secret Box) + Admin. Web only (desktop + responsive).
Stack: Next.js 16 App Router · TypeScript · Tailwind 4 · Supabase (Postgres, Auth Google @sun-asterisk.com, Realtime, Storage) · Drizzle · next-intl · Zod · Vitest · Playwright.
Design: Figma `9ypp4enmFmdK3YAFJLIu6C` (đọc qua claude.ai Figma MCP). Quyết định nghiệp vụ: `spec/decision-log.md` (ưu tiên cao nhất).

## Code layout (mọi phase tuân theo)

```
app/                      # routes (App Router): (public)/, (app)/, admin/, api/
features/<slug>/          # components/, server/ (queries, actions, services), schemas/
shared/                   # config/, db/ (drizzle schema, client), auth/, i18n/, ui/, events/ (outbox), admin/ (csv, date-range, tz)
db/migrations/            # drizzle + hand-written SQL (triggers, EXCLUDE, realtime.send, RLS)
db/seeds/                 # departments, hashtags, secret-box prizes/icons
messages/                 # vi.json, en.json
tests/                    # unit/, integration/ (local Supabase), e2e/ (Playwright)
```
Tên file kebab-case, mỗi file code < 200 dòng.

## Phases

| # | Phase | Features | Priority | Depends on | Status |
|---|-------|----------|----------|-----------|--------|
| 01 | [Foundation & infrastructure](phase-01-foundation-infrastructure.md) | all (enables) | P0 | — | completed |
| 02 | [Auth & onboarding](phase-02-auth-and-onboarding.md) | F001 | P0 | 01 | completed |
| 03 | [App shell & i18n](phase-03-app-shell-and-i18n.md) | F002 | P0 | 01 | completed |
| 04 | [Kudos authoring](phase-04-kudos-authoring.md) | F003 | P0 | 02, 03 | completed |
| 05 | [Kudos feed & detail](phase-05-kudos-feed-and-detail.md) | F004 | P1 | 04 | pending |
| 06 | [Hearts & x2 campaigns](phase-06-kudos-hearts-and-campaigns.md) | F005, F011 | P1 | 05 | pending |
| 07 | [Awards portal & prelaunch](phase-07-awards-portal.md) | F006 | P1 | 02, 03 | pending |
| 08 | [Admin moderation](phase-08-admin-moderation.md) | F007 | P1 | 04 | pending |
| 09 | [Hero badges](phase-09-hero-badges.md) | F009 | P2 | 05 | pending |
| 10 | [Secret Box rewards](phase-10-secret-box-rewards.md) | F010 | P2 | 06 | pending |
| 11 | [Spotlight board (realtime)](phase-11-spotlight-board-realtime.md) | F008 | P2 | 05, 08 | pending |
| 12 | [Profile](phase-12-profile.md) | F012 | P2 | 09, 10 | pending |
| 13 | [Notifications](phase-13-notifications.md) | F013 | P2 | 06, 08, 09, 10 | pending |
| 14 | [Admin users & overview](phase-14-admin-users-and-overview.md) | F014, F015 | P2/P3 | 08, 09, 10 | pending |

Song song được: 02 ∥ 03 · 07 ∥ 04 · 08 ∥ 05 (sau 04) · 09 ∥ 06. (10 và 11 cùng sửa file chung của phase 01 nên chạy tuần tự.)

## Key dependencies & cross-cutting

- Phase 01 sở hữu: outbox `domain_event_outbox` + `DomainEventOutbox#add` (C-16), seeds (C-15), RLS-on/no-client-policy (C-20), admin utils (C-14), env config mốc thời gian + `ADMIN_EMAILS`.
- Một nguồn cho mỗi phép đếm: tim → `HeartStatsQuery` (06), tier → `HeroTierQuery` (09), feed → `KudoPublicQuery` (05) có che người gửi ẩn danh.
- Đường an toàn bắt buộc test đầy đủ: auth/role guard, migrations, tim unique, Secret Box idempotent + tồn kho, campaign EXCLUDE, last-admin guard, outbox idempotent, không lộ người gửi ẩn danh (kể cả payload Realtime).
- Trước khi code API Next.js: đọc `node_modules/next/dist/docs/` (AGENTS.md).
- Xung đột C-01…C-21: xem `spec/system/architecture.md` § Consistency Check; mỗi phase ghi rõ C-id nó giải.

## Open items

Copy cuối (Thể lệ, Tiêu chuẩn cộng đồng, thông báo Kudos Quốc Dân, tiếng Anh) do BTC cung cấp; tạm dùng nguyên văn Figma.
