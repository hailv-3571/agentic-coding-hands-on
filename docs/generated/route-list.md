# Route List

**Project**: SAA 2025 Kudos Platform
**Generated**: 2026-11-23

## Backend Routes

> **Completeness Contract:** emit exactly ONE row per leaf route (HTTP method + concrete path). Expand framework resource macros (Rails `resources :x` → 7 RESTful rows). FORBIDDEN: resource-summary tables (`| Resource | Actions |`), approximation markers (`~N`, `(+nhiều)`, `see routes.rb`, `etc.`), wildcard paths (`/x/*`). Scout counts are estimates, not authority.

> **Code Column Contract:** `Code` is mandatory going forward — `ROUTE###`, contiguous and global across this one file (same shape as `SCR###`/`F###`). `Owner F###` carries the bare feature code that claims the route, or `—` when the route cannot be attributed to a single feature (shared/infra routes). Rare shared routes may list comma-separated multi-owners, e.g. `F001, F003`.

### File: app/api/admin/kudos/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/admin/kudos | ROUTE001 | F007 | GET (route.ts) → KudoAdminQuery.list | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireAdminApi (401 unauthorized, 403 forbidden); parseAdminKudoFilter (400) |

### File: app/api/admin/kudos/export/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/admin/kudos/export | ROUTE002 | F007 | GET (route.ts) → KudoAdminQuery.listForExport + serializeAdminKudoCsv | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireAdminApi (401 unauthorized, 403 forbidden); parseAdminKudoFilter (400); assertWithinExportLimit (422 export_too_large) |

### File: app/api/admin/overview/export/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/admin/overview/export | ROUTE003 | F015 | GET (route.ts) → UnitStatsQuery.forRange + serializeOverviewCsv | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireAdminApi (401 unauthorized, 403 forbidden); parseOverviewParams (400) |

### File: app/api/admin/users/export/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/admin/users/export | ROUTE004 | F014 | GET (route.ts) → UserAdminQuery.listForExport + serializeAdminUserCsv | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireAdminApi (401 unauthorized, 403 forbidden); parseUserListParams (400); assertWithinExportLimit (422 export_too_large) |

### File: app/api/internal/notifications/drain/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST | /api/internal/notifications/drain | ROUTE005 | F013 | POST (route.ts) → NotificationEventProcessor.drain | proxy.ts (NOTIFICATIONS_DRAIN_PATH nằm trong PUBLIC_PATHS: không cần session, qua cổng prelaunch); outbox-drain-guard checkOutboxDrainSecret (header x-drain-secret, so sánh SHA-256 + timingSafeEqual: 503 not_configured, 401 unauthorized) |

### File: app/api/internal/secret-box/tick/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST | /api/internal/secret-box/tick | ROUTE006 | F010 | POST (route.ts) → SecretBoxTickJob.run | proxy.ts (SECRET_BOX_TICK_PATH nằm trong PUBLIC_PATHS: không cần session, qua cổng prelaunch); internal-job-guard checkInternalJobSecret (header x-job-secret, so sánh SHA-256 + timingSafeEqual: 503 not_configured, 401 unauthorized) |

### File: app/api/kudos/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/kudos | ROUTE007 | F004 | GET (route.ts) → KudoPublicQuery.list | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireApiSunner (401 UNAUTHENTICATED, 403 ONBOARDING_REQUIRED); parseKudoFeedParams (400 VALIDATION) |

### File: app/api/kudos/highlight/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/kudos/highlight | ROUTE008 | F004 | GET (route.ts) → listHighlightKudos | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireApiSunner (401 UNAUTHENTICATED, 403 ONBOARDING_REQUIRED); parseKudoFeedParams (400 VALIDATION) |

### File: app/api/kudos/[id]/edit/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/kudos/[id]/edit | ROUTE009 | F003 | GET (route.ts) → getKudoForEdit | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireApiSunner (401 UNAUTHENTICATED, 403 ONBOARDING_REQUIRED); kiểm tra id là uuid (404 NOT_FOUND); chủ sở hữu (403 FORBIDDEN) |

### File: app/api/kudos/images/sign/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST | /api/kudos/images/sign | ROUTE010 | F003 | POST (route.ts) → signKudoImageUpload | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireApiSunner (401 UNAUTHENTICATED, 403 ONBOARDING_REQUIRED); isEventWritingOpen (403 WRITING_CLOSED); readCappedJsonBody (413 PAYLOAD_TOO_LARGE, body trên 4 KB); KudoImageSignSchema (400 VALIDATION); giới hạn upload (429 UPLOAD_LIMIT) |

### File: app/api/notifications/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/notifications | ROUTE011 | F013 | GET (route.ts) → NotificationQuery.list | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireNotificationUser (401 unauthorized); parseNotificationListParams (400 invalid_request) |

### File: app/api/notifications/unread-count/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/notifications/unread-count | ROUTE012 | F013 | GET (route.ts) → getUnreadCount | proxy.ts (session: khách → 401; prelaunch: non-admin → 403 trước LAUNCH_AT); requireNotificationUser (401 unauthorized) |

### File: app/api/hashtags/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/hashtags | ROUTE013 | F003 | GET | proxy(session→401 JSON, prelaunch→403 JSON); requireApiSunner (401 UNAUTHENTICATED, 403 ONBOARDING_REQUIRED) |

### File: app/api/profile/[userId]/kudos/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/profile/:userId/kudos | ROUTE014 | F012 | GET | proxy(session→401 JSON, prelaunch→403 JSON); requireApiSunner; parseProfileKudosParams (400 VALIDATION); uuid check on userId (404); direction=sent only for own profile (403 FORBIDDEN); Cache-Control private,no-store |

### File: app/api/secret-boxes/me/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/secret-boxes/me | ROUTE015 | F010 | GET | proxy(session→401 JSON, prelaunch→403 JSON); requireSecretBoxUser (401 before any DB read); Cache-Control private,no-store |

### File: app/api/secret-boxes/open/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST | /api/secret-boxes/open | ROUTE016 | F010 | POST | proxy(session→401 JSON, prelaunch→403 JSON); requireSecretBoxUser (401 before any DB read); Idempotency-Key header uuid v4 (400 invalid_idempotency_key); Cache-Control private,no-store |

### File: app/api/spotlight/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/spotlight | ROUTE017 | F008 | GET | proxy(session→401 JSON, prelaunch→403 JSON); getSessionUser (401 unauthorized before any DB read); Cache-Control private,no-store |

### File: app/api/sunners/search/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/sunners/search | ROUTE018 | F003 | GET | proxy(session→401 JSON, prelaunch→403 JSON); requireApiSunner; parseSunnerSearchParams (400 VALIDATION) |

### File: app/api/sunners/[userId]/card/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /api/sunners/:userId/card | ROUTE019 | F012 | GET | proxy(session→401 JSON, prelaunch→403 JSON); requireApiSunner; Cache-Control private,no-store |

### File: app/auth/callback/route.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| GET | /auth/callback | ROUTE020 | F001 | GET | proxy(public allowlist: session refresh only, prelaunch gate passes); safeNextPath(next); supabase exchangeCodeForSession(code); completeLogin (domain re-check, profile upsert, department-picker redirect); failure → signOut(local) + /login?error |

### File: features/auth/server/sign-in-with-google-action.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /login | ROUTE021 | F001 | signInWithGoogle | proxy(public allowlist; signed-in → redirect /); safeNextPath(next); redirectTo checked against Supabase Auth allow-list; no session guard (guest entry) |

### File: features/auth/server/choose-department-action.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /onboarding/department | ROUTE022 | F001 | chooseDepartment | proxy(guest→/login, prelaunch→403 JSON); getSessionUser (guest → /login); chooseDepartmentSchema (invalid_department); department set only while empty |

### File: features/kudos-authoring/server/create-kudo-action.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /kudos, /kudos/:id, /profile, /profile/:userId | ROUTE023 | F003 | createKudo | proxy(guest→/login, prelaunch→403 JSON); requireSunner; isEventWritingOpen (WRITING_CLOSED); KudoInputSchema; SELF_SEND check; single DB transaction with KudoCreated outbox row |

### File: features/kudos-authoring/server/update-kudo-action.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /kudos, /profile, /profile/:userId | ROUTE024 | F003 | updateKudo | proxy(guest→/login, prelaunch→403 JSON); requireSunner; isEventWritingOpen (WRITING_CLOSED); uuid check; KudoUpdateSchema; owner-only + status=public only (FORBIDDEN, SPAM_LOCKED, NOT_FOUND) |

### File: features/kudos-hearts/server/kudo-heart-actions.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /kudos, /kudos/:id, /profile, /profile/:userId | ROUTE025 | F005 | addHeartAction | proxy(guest→/login, prelaunch→403 JSON); requireSunner; uuid check (KUDO_UNAVAILABLE); KudoHeartService.add (write window EVENT_ENDED, SELF_HEART, public kudo only) |
| POST (server action) | /kudos, /kudos/:id, /profile, /profile/:userId | ROUTE026 | F005 | removeHeartAction | proxy(guest→/login, prelaunch→403 JSON); requireSunner; uuid check (KUDO_UNAVAILABLE); KudoHeartService.remove (write window EVENT_ENDED) |

### File: features/admin-moderation/server/kudo-moderation-actions.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /admin/review | ROUTE027 | F007 | markKudoSpam | proxy(guest→/login, non-admin→403 JSON); requireAdmin (first call); uuid check (invalid); KudoModerationService.transition public→spam |
| POST (server action) | /admin/review | ROUTE028 | F007 | unSpamKudo | proxy(guest→/login, non-admin→403 JSON); requireAdmin (first call); uuid check (invalid); KudoModerationService.transition spam→public |

### File: features/admin-campaigns/server/campaign-admin-actions.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /admin/settings | ROUTE029 | F011 | createCampaign | proxy(guest→/login, non-admin→403 JSON); requireAdmin (first call); CampaignCreateSchema; campaignWindowErrors; CampaignOverlapCheck inside write transaction (OVERLAP) |
| POST (server action) | /admin/settings | ROUTE030 | F011 | updateCampaign | proxy(guest→/login, non-admin→403 JSON); requireAdmin (first call); CampaignUpdateSchema; row lock + server-clock campaignPhase (ENDED, startLocked); CampaignOverlapCheck (OVERLAP) |
| POST (server action) | /admin/settings | ROUTE031 | F011 | removeCampaign | proxy(guest→/login, non-admin→403 JSON); requireAdmin (first call); positive-int id check (NOT_FOUND); row lock + server-clock campaignPhase (ENDED) |

### File: features/admin-users/server/set-user-role-action.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /admin/users | ROUTE032 | F014 | setUserRoleAction | proxy(guest→/login, non-admin→403 JSON); requireAdmin (first call); setUserRoleInputSchema (INVALID); UserRoleService guards (SELF_DEMOTE, LAST_ADMIN, ENV_ADMIN, NOT_FOUND, FORBIDDEN) |

### File: features/notifications/server/notification-actions.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /, /awards, /community-standards, /kudos, /kudos/:id, /notifications, /profile, /profile/:userId, /rules | ROUTE033 | F013 | markNotificationRead | proxy(guest→/login, prelaunch→403 JSON); requireSunner; uuid check (not_found); recipient = session user only |
| POST (server action) | /, /awards, /community-standards, /kudos, /kudos/:id, /notifications, /profile, /profile/:userId, /rules | ROUTE034 | F013 | markAllNotificationsRead | proxy(guest→/login, prelaunch→403 JSON); requireSunner; recipient = session user only |

### File: shared/auth/sign-out-action.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /, /awards, /community-standards, /kudos, /kudos/:id, /notifications, /profile, /profile/:userId, /rules, /admin/overview, /admin/review, /admin/settings, /admin/users | ROUTE035 | F001 | signOut | proxy(guest→/login, prelaunch→403 JSON; non-admin on admin pages→403 JSON); no in-action guard; Supabase signOut scope local, success → redirect /login |

### File: shared/i18n/set-locale-action.ts

| Method | Path | Code | Owner F### | Handler | Middleware |
|--------|------|------|------------|---------|------------|
| POST (server action) | /login, /countdown, /, /awards, /community-standards, /kudos, /kudos/:id, /notifications, /profile, /profile/:userId, /rules, /admin/overview, /admin/review, /admin/settings, /admin/users | ROUTE036 | F002 | setLocaleAction | proxy(public allowlist for /login and /countdown; guest→/login, prelaunch→403 JSON elsewhere; non-admin on admin pages→403 JSON); no in-action guard; z.enum(locales) input check; httpOnly NEXT_LOCALE cookie |

## Frontend Routes/Pages

### File: app/(app)/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| / | HomePage | home |

### File: app/(app)/awards/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /awards | AwardsPage | awards |

### File: app/(app)/community-standards/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /community-standards | CommunityStandardsPage | communityStandards |

### File: app/(app)/kudos/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /kudos | KudosLiveBoardPage | kudos |

### File: app/(app)/kudos/[id]/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /kudos/:id | KudoDetailPage | kudo-detail |

### File: app/(app)/notifications/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /notifications | NotificationsPage | notifications |

### File: app/(app)/profile/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /profile | OwnProfilePage | profile |

### File: app/(app)/profile/[userId]/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /profile/:userId | OtherProfilePage | other-profile |

### File: app/(app)/rules/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /rules | RulesPage | rules |

### File: app/(public)/countdown/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /countdown | CountdownPage | countdown |

### File: app/(public)/login/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /login | LoginPage | login |

### File: app/access-denied/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /access-denied | AccessDeniedPage | access-denied |

### File: app/admin/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /admin | AdminIndexPage | admin-root |

### File: app/admin/overview/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /admin/overview | AdminOverviewPage | admin-overview |

### File: app/admin/review/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /admin/review | AdminReviewPage | admin-review |

### File: app/admin/settings/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /admin/settings | AdminSettingsPage | admin-settings |

### File: app/admin/users/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /admin/users | AdminUsersPage | admin-users |

### File: app/onboarding/department/page.tsx

| Path | Component | Route Name |
|------|-----------|------------|
| /onboarding/department | OnboardingDepartmentPage | onboarding-department |

## Summary

| Category | Count |
|----------|-------|
| Backend Routes | 36 |
| Frontend Pages | 18 |
| Total | 54 |
