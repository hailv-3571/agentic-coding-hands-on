# Permissions Matrix

**Project**: SAA 2025 Kudos Platform
**Generated**: 2026-11-23
**Analysis Scope**: `proxy.ts`, `shared/auth/*`, guard từng feature (`features/*/server`), Route Handler `app/api/**` và `app/auth/callback`, Server Action, RLS/trigger/hook trong `db/migrations` (`0002`–`0023`); đối chiếu `route-list.md`, `screen-list.md`, `behavior-logic.md`, `data-model.md`

> **Raw PERM### matrix.** Machine-generated inventory of every permission item with full
> per-permission detail. The plain-language curated view lives at
> [permissions.md](../system/permissions.md). Write THIS file FIRST, then derive the curated
> view from it.

**Code Format**: All codes MUST follow `PERM###_NameSlug` format (ba chữ số, theo thứ tự xuất hiện đầu tiên trong Permissions Index)

**Permission Types**:
- `route-guard` - Route-level authorization middleware
- `screen-permission` - UI element visibility/enabled rules
- `action-permission` - Button/action execution rules
- `data-permission` - Field-level access control
- `role-based` - Role-based access control rules
- `resource-ownership` - Owner/resource relationship checks
- `field-permission` - Column/field visibility rules
- `api-scope` - API scope/token permission
- `feature-flag` - Runtime-evaluated flag from a feature flag service or config
- `experiment` - A/B test variant assignment gate
- `env-gate` - Hardcoded check against an environment variable (fixed at deploy time)
- `locale-gate` - UI branch conditioned on the active locale or language setting

**source field** (required for `feature-flag`, `experiment`, `env-gate`, `locale-gate` types only):
- **`source:`** — file:line where the gate is referenced (traceability anchor)

**Note**: Feature mapping is managed in FeatureList.md. This document contains permission items without direct feature references; cột Related Modules chỉ ghi mã feature ổn định (F001–F015) để dễ truy ngược.

**Roles** (cột `Role` trong các bảng Permission Rules dùng đúng bốn giá trị này):
- `guest` — chưa có phiên Supabase Auth hợp lệ.
- `sunner` — đã đăng nhập, `profiles.role = user` (DISC-001); đã chọn phòng ban, trừ khi mục đó nói khác.
- `admin` — đã đăng nhập, `profiles.role = admin` (DISC-001); đọc từ DB ở mỗi request, không lấy từ cookie hay JWT.
- `scheduler` — pg_cron/host cron gọi endpoint nội bộ bằng header bí mật, không có phiên người dùng.

## Permissions Index

| Code | Name | Type | Enforced At |
|------|------|------|-------------|
| PERM001_PublicPathAllowlist | Public path allowlist | route-guard | proxy.ts, session-proxy bước 3 (`decideRouteAccess`) |
| PERM002_SessionRequiredOnProtectedPaths | Session required on protected paths | route-guard | proxy.ts, session-proxy bước 2 và 4 |
| PERM003_AdminAreaProxyGate | Admin area proxy gate | route-guard | proxy.ts, session-proxy bước 4b (chỉ page `/admin`, `/admin/*`) |
| PERM004_PrelaunchGate | Prelaunch gate | route-guard | proxy.ts, session-proxy bước 5 (`prelaunchGateStep`) |
| PERM005_CompanyEmailDomainAdmission | Company email domain admission | route-guard | Postgres (auth hook + trigger trên `auth.users`), `/auth/callback` (`completeLogin`) |
| PERM006_EnvAdminPromotion | Env admin promotion | env-gate | `completeLogin` (mỗi lần đăng nhập) |
| PERM007_SafeNextRedirect | Safe next redirect | route-guard | `safeNextPath` (callback, login action, onboarding) |
| PERM008_SunnerAreaGate | Sunner area gate | route-guard | `requireSunner()` trong layout `(app)`, page và Server Action |
| PERM009_OnboardingDepartmentChoice | Onboarding department choice | action-permission | Page `/onboarding/department`, action `chooseDepartment` |
| PERM010_ApiSunnerGate | API Sunner gate | route-guard | Route Handler (`requireApiSunner`) |
| PERM011_SessionOnlyApiGate | Session-only API gate | route-guard | Route Handler (`requireNotificationUser`, `requireSecretBoxUser`, `getSessionUser`) |
| PERM012_PreferenceAndSignOutActions | Preference and sign-out actions | action-permission | Không có guard trong action; chỉ proxy |
| PERM013_LocaleCookieSecureFlag | Locale cookie secure flag | env-gate | `setLocaleAction` |
| PERM014_AdminPageAndActionGuard | Admin page and action guard | role-based | `requireAdmin()` / `requireShellAdmin()` trong layout, page, query, Server Action |
| PERM015_AdminApiGate | Admin API gate | role-based | Route Handler `/api/admin/*` (`requireAdminApi`), chỉ trong handler |
| PERM016_AdminMenuVisibility | Admin menu visibility | screen-permission | UI `AccountMenu` |
| PERM017_AdminUserRoleChange | Admin user role change | action-permission | `setUserRoleAction`, `UserRoleService.setRole` |
| PERM018_AdminRoleMenuState | Admin role menu state | screen-permission | UI `roleMenuState` |
| PERM019_AdminKudoModeration | Admin kudo moderation | action-permission | Server Action `markKudoSpam`, `unSpamKudo` |
| PERM020_AdminCampaignManagement | Admin campaign management | action-permission | Server Action campaign (tạo, sửa, xóa) |
| PERM021_AdminRealSenderView | Admin real sender view | field-permission | DTO admin-only (`KudoAdminQuery`), CSV export |
| PERM022_EventWritingWindow | Event writing window | env-gate | `isEventWritingOpen` (action, handler, UI) |
| PERM023_KudoCreate | Kudo create | action-permission | Server Action `createKudo` |
| PERM024_KudoImageUploadSigning | Kudo image upload signing | action-permission | Route Handler `POST /api/kudos/images/sign` |
| PERM025_KudoOwnerEdit | Kudo owner edit | resource-ownership | `updateKudo`, `GET /api/kudos/[id]/edit` |
| PERM026_KudoEditButtonVisibility | Kudo edit button visibility | screen-permission | UI `kudoCardCanEdit` |
| PERM027_KudoHeartToggle | Kudo heart toggle | action-permission | Server Action `addHeartAction`, `removeHeartAction` |
| PERM028_AnonymousSenderMask | Anonymous sender mask | field-permission | Mapper server `maskKudoRow`, `KudoPublicQuery` |
| PERM029_SpamKudoVisibility | Spam kudo visibility | data-permission | `KudoPublicQuery` (`list`, `findForViewer`) |
| PERM030_ProfileSentListOwnerOnly | Profile sent list owner only | resource-ownership | Route Handler `GET /api/profile/:userId/kudos`, page `/profile/:userId` |
| PERM031_SunnerCardFieldWhitelist | Sunner card field whitelist | field-permission | Route Handler `GET /api/sunners/:userId/card` |
| PERM032_NotificationRecipientOnly | Notification recipient only | resource-ownership | Route Handler, Server Action, query theo `recipient_id` |
| PERM033_SecretBoxOwnerOnly | Secret box owner only | resource-ownership | Route Handler `/api/secret-boxes/*`, `SecretBoxOpenService` |
| PERM034_InternalJobSecretGuards | Internal job secret guards | api-scope | Route Handler `/api/internal/*` |
| PERM035_DatabaseRlsBaseline | Database RLS baseline | data-permission | Postgres RLS + REVOKE (`0002`, `0004`) |
| PERM036_KudoImageStorageAccess | Kudo image storage access | data-permission | Supabase Storage bucket + signed URL phía server |
| PERM037_SpotlightRealtimeChannelRead | Spotlight realtime channel read | data-permission | Policy RLS trên `realtime.messages` (`0017`) |
| PERM038_NotificationsRealtimeChannelRead | Notifications realtime channel read | data-permission | Policy RLS trên `realtime.messages` (`0019`) |

---

## PERM001_PublicPathAllowlist: Public path allowlist

**Type**: route-guard
**Enforced At**: proxy.ts, session-proxy bước 3 (`decideRouteAccess`)

### Description

Sáu path khớp chính xác được vào không cần phiên: `/login`, `/auth/callback`, `/countdown`, `/access-denied` và hai endpoint cron `/api/internal/*` (`shared/auth/public-paths.ts:33-40`). So khớp bằng `includes` nên `/login-help` vẫn bị bảo vệ (`public-paths.ts:42-44`). Người đã đăng nhập mở `/login` bị chuyển về `/` (`shared/auth/route-access-policy.ts:30-33`). `/access-denied` công khai vì proxy tự fetch trang này không kèm cookie để dựng trang 403 (`public-paths.ts:12-17`, `shared/auth/access-denied-response.ts:40-60`). Matcher loại `_next/static`, `_next/image`, `images/`, `fonts/`, favicon, robots, sitemap, không bao giờ loại theo đuôi file (`proxy.ts:9-17`).

### Related Routes

- (GET) /login
- (POST) /login (ROUTE021)
- (GET) /auth/callback (ROUTE020)
- (GET) /countdown
- (GET) /access-denied
- (POST) /api/internal/notifications/drain (ROUTE005)
- (POST) /api/internal/secret-box/tick (ROUTE006)

### Related Screens

- SCR001_Login - Login
- SCR010_CountdownPrelaunch - CountdownPrelaunch
- SCR004_Error403 - Error403

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✓ | Vào được sáu path trên không cần phiên |
| sunner | ✓ | Vào được; riêng `/login` bị chuyển về `/` |
| admin | ✓ | Như `sunner` |

### Related Modules

- `shared/auth/public-paths.ts`, `shared/auth/route-access-policy.ts` (F001_Auth)
- `proxy.ts`, `shared/auth/session-proxy.ts`

---

## PERM002_SessionRequiredOnProtectedPaths: Session required on protected paths

**Type**: route-guard
**Enforced At**: proxy.ts, session-proxy bước 2 và 4

### Description

Mọi path ngoài allowlist cần phiên được Supabase Auth xác thực: `getUser()` hỏi thẳng Auth server nên phiên bị thu hồi dừng ngay, không đợi JWT hết hạn (`shared/auth/session-proxy.ts:47-52`). Auth không với tới thì fail closed, coi như khách (`session-proxy.ts:53-57`). Khách vào trang bị chuyển `/login?next=<path+query>` (`route-access-policy.ts:38-39`); vào `/api/*` nhận JSON 401 `{ code: "unauthorized" }` (`route-access-policy.ts:36-37`, `session-proxy.ts:71-75`). Proxy chỉ là lớp lạc quan: mọi page, layout, action vẫn tự gọi guard riêng (`session-proxy.ts:25`, `route-access-policy.ts:3-8`).

### Related Routes

- Mọi route ngoài allowlist của mục trước, ví dụ (GET) /kudos, (GET) /api/kudos (ROUTE007), (POST) /api/secret-boxes/open (ROUTE016), (GET) /api/admin/kudos (ROUTE001)

### Related Screens

- SCR003_AppLayout - AppLayout
- SCR002_AdminLayout - AdminLayout

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Trang: chuyển `/login?next=`; API: 401 `unauthorized` |
| sunner | ✓ | Phiên còn hiệu lực theo Supabase Auth |
| admin | ✓ | Như `sunner` |

### Related Modules

- `shared/auth/session-proxy.ts`, `shared/auth/route-access-policy.ts`, `shared/auth/current-user.ts` (F001_Auth)

---

## PERM003_AdminAreaProxyGate: Admin area proxy gate

**Type**: route-guard
**Enforced At**: proxy.ts, session-proxy bước 4b (chỉ page `/admin`, `/admin/*`)

### Description

Chỉ khớp page `/admin` và `/admin/*` (`isAdminPath`, `shared/auth/route-access-policy.ts:25-27`). `/api/admin/*` không đi qua cổng này, xem PERM015_AdminApiGate. Người đã đăng nhập mà `profiles.role` khác `admin` bị chặn; không có profile hoặc đọc profile lỗi cũng tính là không phải admin (`shared/auth/session-proxy.ts:81-90, 106-110`). Tải trang (GET/HEAD, không có header `next-action`) nhận trang access-denied kèm HTTP 403; Server Action và method khác nhận JSON 403 `{ code: "forbidden" }` (`session-proxy.ts:92-96`). Trang 403 dựng bằng cách fetch `/access-denied` từ origin cấu hình phía server (`INTERNAL_APP_ORIGIN` hoặc `127.0.0.1:PORT`), không lấy từ Host header để chống SSRF, và chỉ chuyển cookie ngôn ngữ, không chuyển cookie phiên (`shared/auth/access-denied-response.ts:18-38`).

### Related Routes

- (GET) /admin, /admin/overview, /admin/review, /admin/settings, /admin/users
- (POST server action) /admin/review (ROUTE027, ROUTE028)
- (POST server action) /admin/settings (ROUTE029, ROUTE030, ROUTE031)
- (POST server action) /admin/users (ROUTE032)

### Related Screens

- SCR002_AdminLayout - AdminLayout
- SCR013_AdminReviewContent - AdminReviewContent
- SCR014_AdminCampaignSettings - AdminCampaignSettings
- SCR018_AdminUser - AdminUser
- SCR019_AdminOverview - AdminOverview
- SCR004_Error403 - Error403

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Bước 4 đã chuyển về `/login` trước khi tới bước này |
| sunner | ✗ | 403 (trang access-denied hoặc JSON `forbidden`) |
| admin | ✓ | Role đọc từ DB mỗi request |

### Related Modules

- `shared/auth/session-proxy.ts`, `shared/auth/access-denied-response.ts`, `shared/auth/route-access-policy.ts` (F002_AppShell, F014_AdminUserManagement)

---

## PERM004_PrelaunchGate: Prelaunch gate

**Type**: route-guard
**Enforced At**: proxy.ts, session-proxy bước 5 (`prelaunchGateStep`)

### Description

Trước `LAUNCH_AT` (so với đồng hồ server ở mỗi request, không lưu trạng thái: `features/awards-portal/server/prelaunch-gate.ts:34-37`), người không phải admin chỉ vào được allowlist. Ngoài allowlist: tải trang bị chuyển `/countdown`; Server Action, API hay request không phải GET nhận JSON 403 `{ code: "prelaunch" }` (`prelaunch-gate.ts:44-46, 56-70`, `features/awards-portal/server/prelaunch-gate-step.ts:27-30`). Admin luôn qua; role đọc từ DB, lỗi thì tính không phải admin (`prelaunch-gate.ts:48-54, 68`). Sau `LAUNCH_AT` chỉ còn một luật: tải trang `/countdown` bị chuyển về `/`, kể cả khách (`prelaunch-gate.ts:59-63`). Cổng chạy cho mọi request đã qua bước 4, kể cả path công khai (`shared/auth/session-proxy.ts:112-120`). Cổng chỉ chặn theo path nên Server Action gửi tới path allowlist (ví dụ `/countdown`) vẫn tới server; cửa sổ ghi PERM022_EventWritingWindow chặn tiếp ở lớp sau (`shared/config/event-window.ts:4-9`).

### Related Routes

- Mọi route ngoài allowlist của PERM001_PublicPathAllowlist (trước `LAUNCH_AT`)
- (GET) /countdown

### Related Screens

- SCR010_CountdownPrelaunch - CountdownPrelaunch

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chỉ allowlist; mọi path khác bị bước 4 chuyển về `/login` |
| sunner | ✗ | Trước `LAUNCH_AT`: chuyển `/countdown` hoặc JSON 403 `prelaunch`; từ `LAUNCH_AT` cổng không chặn nữa |
| admin | ✓ | Luôn qua, trước và sau `LAUNCH_AT` |

### Related Modules

- `features/awards-portal/server/prelaunch-gate.ts`, `features/awards-portal/server/prelaunch-gate-step.ts` (F006_AwardsPortal)
- BL013_PrelaunchGate

---

## PERM005_CompanyEmailDomainAdmission: Company email domain admission

**Type**: route-guard
**Enforced At**: Postgres (auth hook + trigger trên `auth.users`), `/auth/callback` (`completeLogin`)

### Description

Chỉ email có đúng một `@` và domain công ty (khớp chính xác, không chấp nhận sub-domain) mới tạo được tài khoản hoặc đăng nhập. Trong DB có hai lớp dùng chung vị từ `is_sunner_email`: auth hook `before_user_created_hook` trả 403 `domain_not_allowed` (`db/migrations/0005_auth_user_triggers.sql:20-33`), và hai trigger BEFORE INSERT, BEFORE UPDATE khi email đổi trên `auth.users` làm chốt chặn cứng cho mọi đường ghi (`0005_auth_user_triggers.sql:37-45, 80-88`). Hook phải bật cả ở bản hosted (dashboard); cấu hình local ở `supabase/config.toml:297-301`. Thiếu hook thì trigger vẫn fail closed, người dùng chỉ thấy lỗi chung `auth_failed` (`0005_auth_user_triggers.sql:7-9`). Lớp app kiểm lại với `ALLOWED_EMAIL_DOMAIN` (`features/auth/server/complete-login.ts:23-26, 39-41`); sai thì `signOut` local và chuyển `/login?error=` (`app/auth/callback/route.ts:31-33`). Tham số `hd` gửi cho Google chỉ thu hẹp màn chọn tài khoản (UX), không phải cổng chặn (`features/auth/server/sign-in-with-google-action.ts:24-26, 43`).

### Related Routes

- (GET) /auth/callback (ROUTE020)
- (POST server action) /login (ROUTE021)

### Related Screens

- SCR001_Login - Login

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✓ | Chỉ khi email thuộc domain công ty; domain khác bị `domain_not_allowed` |
| sunner | ✓ | Kiểm lại ở mỗi lần đăng nhập (`completeLogin`) |
| admin | ✓ | Như `sunner` |

### Related Modules

- `db/migrations/0005_auth_user_triggers.sql`, `features/auth/server/complete-login.ts`, `app/auth/callback/route.ts` (F001_Auth)
- BL018_BeforeUserCreatedHook, BL020_RejectForeignDomainOnEmailChange, BL021_RejectForeignDomainOnInsert, BL004_GoogleOAuthCallback, BL005_GoogleSignInStart

---

## PERM006_EnvAdminPromotion: Env admin promotion

**Type**: env-gate
**Enforced At**: `completeLogin` (mỗi lần đăng nhập)

### Description

Email nằm trong `ADMIN_EMAILS` được nâng `profiles.role = 'admin'` ở mọi lần đăng nhập, nên hạ quyền qua UI sẽ bị đảo ngược ở lần đăng nhập sau. Vì thế bảng user hiện "Admin · env" và `UserRoleService` từ chối hạ với `ENV_ADMIN` (`features/admin-users/server/env-admin-email.ts:4-11`, `features/admin-users/server/user-role-service.ts:44`). Email chuẩn hóa bằng trim và lower-case trước khi so.

**source:** `features/auth/server/complete-login.ts:43` (`env.ADMIN_EMAILS.includes(normalizedEmail)`), `features/auth/server/complete-login.ts:46` (`role: "admin"`)
**trigger:** `/auth/callback` thành công, ngay sau bước kiểm domain
**effect:** email trong `ADMIN_EMAILS` → `UPDATE profiles SET role = 'admin'` cùng `last_login_at = now()`; email khác giữ nguyên role hiện có

### Related Routes

- (GET) /auth/callback (ROUTE020)

### Related Screens

- SCR001_Login - Login
- SCR018_AdminUser - AdminUser

### Related Modules

- `features/auth/server/complete-login.ts` (F001_Auth)
- `features/admin-users/server/env-admin-email.ts` (F014_AdminUserManagement)

---

## PERM007_SafeNextRedirect: Safe next redirect

**Type**: route-guard
**Enforced At**: `safeNextPath` (callback, login action, onboarding)

### Description

Tham số `next` chỉ được là path cùng origin: bắt đầu bằng đúng một `/`, không có `//`, backslash hay ký tự điều khiển, dài tối đa 2048 ký tự, và được kiểm lại sau khi chuẩn hóa URL vì dot segment có thể biến thành `//host`. Không hợp lệ thì rơi về `/` (`shared/auth/safe-next-path.ts:9-27`). Dùng ở `app/auth/callback/route.ts:16`, `features/auth/server/sign-in-with-google-action.ts:34`, `features/auth/server/complete-login.ts:51`, `features/auth/server/choose-department-action.ts:69` và `app/onboarding/department/page.tsx:27`. Mục đích là chặn open redirect sau OAuth và sau khi chọn phòng ban.

### Related Routes

- (GET) /auth/callback (ROUTE020)
- (POST server action) /login (ROUTE021)
- (POST server action) /onboarding/department (ROUTE022)

### Related Screens

- SCR001_Login - Login
- SCR020_OnboardingDepartment - OnboardingDepartment

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✓ | Chỉ được quay lại path cùng origin; khác thì về `/` |
| sunner | ✓ | Như `guest` |
| admin | ✓ | Như `guest` |

### Related Modules

- `shared/auth/safe-next-path.ts` (F001_Auth)

---

## PERM008_SunnerAreaGate: Sunner area gate

**Type**: route-guard
**Enforced At**: `requireSunner()` trong layout `(app)`, page và Server Action

### Description

Mọi page nhóm `(app)` và các Server Action của Sunner tự gọi `requireSunner()`: không có phiên thì chuyển `/login`; có phiên nhưng không có dòng profile thì `unauthorized()` (401, tránh vòng lặp với luật `/login → /` của proxy); chưa chọn phòng ban thì chuyển `/onboarding/department` (`shared/auth/current-user.ts:33-53`). Role không đổi kết quả: admin cũng cần phòng ban mới vào được khu `(app)`. Profile đọc từ DB ở mỗi request; `cache()` chỉ gộp trong một lần render (`shared/auth/session-profile-query.ts:17-25`). Guard ở layout không che được Server Action nên từng action tự gọi lại. Vị trí gọi: `app/(app)/layout.tsx:18`, `page.tsx:27`, `awards/page.tsx:28`, `community-standards/page.tsx:22`, `kudos/page.tsx:43`, `kudos/[id]/page.tsx:44`, `notifications/page.tsx:22`, `profile/page.tsx:24`, `profile/[userId]/page.tsx:31`, `rules/page.tsx:20`.

### Related Routes

- (GET) /, /awards, /community-standards, /kudos, /kudos/:id, /notifications, /profile, /profile/:userId, /rules
- (POST server action) createKudo (ROUTE023), updateKudo (ROUTE024), addHeartAction (ROUTE025), removeHeartAction (ROUTE026)
- (POST server action) markNotificationRead (ROUTE033), markAllNotificationsRead (ROUTE034)

### Related Screens

- SCR003_AppLayout - AppLayout
- SCR011_Homepage - Homepage
- SCR008_AwardsSystem - AwardsSystem
- SCR009_CommunityStandards - CommunityStandards
- SCR007_KudosLiveBoardFeed - KudosLiveBoardFeed
- SCR006_KudoDetail - KudoDetail
- SCR017_AllNotifications - AllNotifications
- SCR016_OwnProfile - OwnProfile
- SCR015_OtherProfile - OtherProfile
- SCR012_Rules - Rules

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` |
| sunner | ✓ | Sau khi chọn phòng ban; trước đó bị chuyển `/onboarding/department` |
| admin | ✓ | Cùng điều kiện phòng ban như `sunner` |

### Related Modules

- `shared/auth/current-user.ts`, `shared/auth/session-profile-query.ts`, `app/(app)/layout.tsx` (F001_Auth, F002_AppShell)

---

## PERM009_OnboardingDepartmentChoice: Onboarding department choice

**Type**: action-permission
**Enforced At**: Page `/onboarding/department`, action `chooseDepartment`

### Description

Cần phiên: khách chuyển `/login?next=`, có phiên nhưng không có profile thì 401 (`app/onboarding/department/page.tsx:28-31`, `features/auth/server/choose-department-action.ts:47-48`). Trang này không dùng `requireSunner()` vì chính `requireSunner()` chuyển người dùng tới đây (`page.tsx:22-25`). Chỉ chọn được khi `department_id` còn trống: `UPDATE ... WHERE department_id IS NULL` (`choose-department-action.ts:26-30`). Đã có phòng ban thì trang chuyển thẳng về `next` (`page.tsx:32`) và submit lặp coi như xong; đổi phòng ban về sau nằm ngoài phạm vi.

### Related Routes

- (GET) /onboarding/department
- (POST server action) /onboarding/department (ROUTE022)

### Related Screens

- SCR020_OnboardingDepartment - OnboardingDepartment

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` |
| sunner | ✓ | Chỉ khi `department_id` còn trống; sau đó chuyển về `next` |
| admin | ✓ | Như `sunner` |

### Related Modules

- `features/auth/server/choose-department-action.ts`, `app/onboarding/department/page.tsx` (F001_Auth)

---

## PERM010_ApiSunnerGate: API Sunner gate

**Type**: route-guard
**Enforced At**: Route Handler (`requireApiSunner`)

### Description

Các Route Handler dữ liệu của Kudos, Feed, Profile tự gọi `requireApiSunner()` đầu tiên: không phiên hoặc không profile thì 401 `UNAUTHENTICATED`; chưa chọn phòng ban thì 403 `ONBOARDING_REQUIRED` (`features/kudos-authoring/server/require-api-sunner.ts:12-18`, bảng status `features/kudos-authoring/schemas/kudo-write-result.ts:15-17`). Lỗi chỉ trả `{ code }`, không kèm nội dung Kudo. Lớp 401 của proxy chỉ là lớp lạc quan (`require-api-sunner.ts:6-11`). Vị trí gọi: `app/api/kudos/route.ts:20`, `kudos/highlight/route.ts:21`, `kudos/[id]/edit/route.ts:23`, `kudos/images/sign/route.ts:19`, `hashtags/route.ts:12`, `profile/[userId]/kudos/route.ts:26`, `sunners/search/route.ts:13`, `sunners/[userId]/card/route.ts:22`.

### Related Routes

- (GET) /api/kudos (ROUTE007)
- (GET) /api/kudos/highlight (ROUTE008)
- (GET) /api/kudos/[id]/edit (ROUTE009)
- (POST) /api/kudos/images/sign (ROUTE010)
- (GET) /api/hashtags (ROUTE013)
- (GET) /api/profile/:userId/kudos (ROUTE014)
- (GET) /api/sunners/search (ROUTE018)
- (GET) /api/sunners/:userId/card (ROUTE019)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG001_KudoComposer - Kudo composer
- SCR007_KudosLiveBoardFeed/REG002_SunnerProfileSearch - Sunner profile search
- SCR007_KudosLiveBoardFeed/REG003_HighlightKudos - Highlight kudos
- SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed - All kudos feed
- SCR015_OtherProfile - OtherProfile
- SCR016_OwnProfile - OwnProfile

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | 401 `UNAUTHENTICATED` |
| sunner | ✓ | Đã chọn phòng ban; chưa chọn thì 403 `ONBOARDING_REQUIRED` |
| admin | ✓ | Cùng điều kiện như `sunner` |

### Related Modules

- `features/kudos-authoring/server/require-api-sunner.ts` (F003_KudosAuthoring, F004_KudosFeed, F012_Profile)

---

## PERM011_SessionOnlyApiGate: Session-only API gate

**Type**: route-guard
**Enforced At**: Route Handler (`requireNotificationUser`, `requireSecretBoxUser`, `getSessionUser`)

### Description

Ba nhóm endpoint chỉ đòi phiên đã xác thực, không kiểm phòng ban (khác PERM010_ApiSunnerGate): thông báo (`features/notifications/server/notification-api-session.ts:22-25`), Secret Box (`features/secret-box-rewards/server/secret-box-api-session.ts:22-25`) và Spotlight (`app/api/spotlight/route.ts:15-16`). User id chỉ lấy từ phiên, không lấy từ query, header hay body; 401 trả trước khi đọc DB; mọi phản hồi mang `Cache-Control: private, no-store`; lỗi chỉ `{ code }`. Vị trí gọi: `app/api/notifications/route.ts:14`, `notifications/unread-count/route.ts:10`, `secret-boxes/me/route.ts:10`, `secret-boxes/open/route.ts:14`. Các trang gọi những endpoint này đều nằm sau PERM008_SunnerAreaGate nên người chưa chọn phòng ban không tới được từ giao diện.

### Related Routes

- (GET) /api/notifications (ROUTE011)
- (GET) /api/notifications/unread-count (ROUTE012)
- (GET) /api/secret-boxes/me (ROUTE015)
- (POST) /api/secret-boxes/open (ROUTE016)
- (GET) /api/spotlight (ROUTE017)

### Related Screens

- SCR003_AppLayout/REG001_NotificationBell - Notification bell
- SCR017_AllNotifications - AllNotifications
- SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard - Spotlight board
- SCR007_KudosLiveBoardFeed/REG006_RewardsColumn - Rewards column

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | 401 `unauthorized` |
| sunner | ✓ | Chỉ cần phiên hợp lệ, không xét phòng ban |
| admin | ✓ | Như `sunner` |

### Related Modules

- `features/notifications/server/notification-api-session.ts` (F013_Notifications)
- `features/secret-box-rewards/server/secret-box-api-session.ts` (F010_SecretBoxRewards)
- `app/api/spotlight/route.ts` (F008_SpotlightBoard)

---

## PERM012_PreferenceAndSignOutActions: Preference and sign-out actions

**Type**: action-permission
**Enforced At**: Không có guard trong action; chỉ proxy

### Description

`signOut` (`shared/auth/sign-out-action.ts:16-24`) và `setLocaleAction` (`shared/i18n/set-locale-action.ts:18-34`) không tự kiểm phiên. `setLocaleAction` chỉ nhận giá trị thuộc danh sách locale (Zod) rồi ghi cookie `NEXT_LOCALE` httpOnly, sameSite lax (`set-locale-action.ts:19-27`). Vì proxy chuyển khách khỏi mọi path ngoài allowlist, khách chỉ đổi được ngôn ngữ ở `/login` và `/countdown`; `signOut` chỉ phát sinh từ menu tài khoản của người đã đăng nhập. Hai action không chạm dữ liệu của người khác: `signOut` dùng `scope: local` nên chỉ kết thúc phiên của thiết bị này (`sign-out-action.ts:18`).

### Related Routes

- (POST server action) signOut (ROUTE035)
- (POST server action) setLocaleAction (ROUTE036)

### Related Screens

- SCR001_Login - Login
- SCR010_CountdownPrelaunch - CountdownPrelaunch
- SCR003_AppLayout - AppLayout
- SCR002_AdminLayout - AdminLayout

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✓ | Chỉ đổi ngôn ngữ ở `/login`, `/countdown`; không có nút đăng xuất |
| sunner | ✓ | Đổi ngôn ngữ và đăng xuất thiết bị hiện tại |
| admin | ✓ | Như `sunner` |

### Related Modules

- `shared/auth/sign-out-action.ts` (F001_Auth)
- `shared/i18n/set-locale-action.ts` (F002_AppShell)

---

## PERM013_LocaleCookieSecureFlag: Locale cookie secure flag

**Type**: env-gate
**Enforced At**: `setLocaleAction`

### Description

Cookie ngôn ngữ chỉ gắn cờ `secure` khi chạy production, để môi trường dev/test chạy HTTP thường vẫn nhận được cookie. Đây không phải cổng phân quyền người dùng, nhưng khớp chữ ký env-gate nên được ghi lại để không sót.

**source:** `shared/i18n/set-locale-action.ts:27` (`secure: process.env.NODE_ENV === "production"`)
**trigger:** mỗi lần `setLocaleAction` ghi cookie `NEXT_LOCALE`
**effect:** `production` → cookie có cờ `secure`; môi trường khác → không có cờ `secure`

### Related Routes

- (POST server action) setLocaleAction (ROUTE036)

### Related Modules

- `shared/i18n/set-locale-action.ts` (F002_AppShell)

---

## PERM014_AdminPageAndActionGuard: Admin page and action guard

**Type**: role-based
**Enforced At**: `requireAdmin()` / `requireShellAdmin()` trong layout, page, query, Server Action

### Description

`requireAdmin()` được gọi đầu tiên ở `app/admin/layout.tsx:11` (qua `requireShellAdmin`, `features/app-shell/server/shell-session.ts:41-44`), `/admin/overview` (`page.tsx:40`), `/admin/review` (`page.tsx:41`), `/admin/users` (`page.tsx:45`), query danh sách campaign (`features/admin-campaigns/server/campaign-admin-query.ts:17`) và mọi action admin (`features/admin-moderation/server/kudo-moderation-actions.ts:20`, `features/admin-campaigns/server/campaign-admin-actions.ts:40, 59, 90`, `features/admin-users/server/set-user-role-action.ts:19`). `resolveAdminAccess` đọc `profiles.role` từ DB ở mỗi lần gọi, không dựa cookie hay JWT, nên hạ quyền có hiệu lực ở request kế tiếp (`shared/auth/admin-guard.ts:17-23`). Khách bị chuyển `/login`; người không phải admin gọi `forbidden()` ra trang 403 (`admin-guard.ts:30-35`, `app/forbidden.tsx`). Layout không che được Server Action nên action tự gọi lại (`admin-guard.ts:25-27`). Query admin không có guard nội bộ: người gọi phải gọi guard trước, vì Drizzle bỏ qua RLS (`features/admin-moderation/server/kudo-admin-query.ts:13-14`, `features/admin-users/server/user-admin-query.ts:22`).

### Related Routes

- (GET) /admin/overview, /admin/review, /admin/settings, /admin/users
- (POST server action) markKudoSpam (ROUTE027), unSpamKudo (ROUTE028)
- (POST server action) createCampaign (ROUTE029), updateCampaign (ROUTE030), removeCampaign (ROUTE031)
- (POST server action) setUserRoleAction (ROUTE032)

### Related Screens

- SCR002_AdminLayout - AdminLayout
- SCR013_AdminReviewContent - AdminReviewContent
- SCR014_AdminCampaignSettings - AdminCampaignSettings
- SCR018_AdminUser - AdminUser
- SCR019_AdminOverview - AdminOverview
- SCR004_Error403 - Error403

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` |
| sunner | ✗ | `forbidden()`, trang 403 |
| admin | ✓ | `profiles.role = admin` đọc từ DB ở mỗi lần gọi |

### Related Modules

- `shared/auth/admin-guard.ts`, `features/app-shell/server/shell-session.ts` (F002_AppShell)
- `features/admin-moderation` (F007_AdminModeration), `features/admin-campaigns` (F011_AdminCampaigns), `features/admin-users` (F014_AdminUserManagement), `features/admin-overview` (F015_AdminOverview)

---

## PERM015_AdminApiGate: Admin API gate

**Type**: role-based
**Enforced At**: Route Handler `/api/admin/*` (`requireAdminApi`), chỉ trong handler

### Description

Bốn endpoint admin gọi `requireAdminApi()` trước khi đọc bất kỳ tham số nào: `app/api/admin/kudos/route.ts:20`, `kudos/export/route.ts:24`, `overview/export/route.ts:22`, `users/export/route.ts:25`. Khách nhận 401 `unauthorized`, người không phải admin nhận 403 `forbidden`, role đọc từ DB ở mỗi lần gọi (`features/admin-moderation/server/admin-api-guard.ts:19-24`). Cổng 4b của proxy chỉ khớp `/admin` và `/admin/*` (`shared/auth/route-access-policy.ts:25-27`), nên `/api/admin/*` không có cổng admin ở proxy. Proxy chỉ chặn khách (bước 4, 401) và người không phải admin trước `LAUNCH_AT` (bước 5, 403 `prelaunch`). Sau `LAUNCH_AT`, một Sunner thường chỉ bị chặn bởi handler. Lỗi chỉ trả `{ code }`; phản hồi có `Cache-Control: private, no-store`.

### Related Routes

- (GET) /api/admin/kudos (ROUTE001)
- (GET) /api/admin/kudos/export (ROUTE002)
- (GET) /api/admin/overview/export (ROUTE003)
- (GET) /api/admin/users/export (ROUTE004)

### Related Screens

- SCR013_AdminReviewContent - AdminReviewContent
- SCR019_AdminOverview - AdminOverview
- SCR018_AdminUser - AdminUser

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | 401 `unauthorized` (proxy bước 4 và handler) |
| sunner | ✗ | 403 `forbidden`, chỉ từ handler |
| admin | ✓ | Role đọc từ DB ở mỗi lần gọi |

### Related Modules

- `features/admin-moderation/server/admin-api-guard.ts` (F007_AdminModeration)
- `app/api/admin/*/route.ts` (F007_AdminModeration, F014_AdminUserManagement, F015_AdminOverview)

---

## PERM016_AdminMenuVisibility: Admin menu visibility

**Type**: screen-permission
**Enforced At**: UI `AccountMenu`

### Description

Mục "Dashboard" trong menu tài khoản chỉ hiện khi `user.isAdmin` (`features/app-shell/components/account-menu.tsx:65`), với `isAdmin = profile.role === "admin"` (`features/app-shell/server/shell-session.ts:23`). Đây chỉ là ẩn UI; chặn thật nằm ở PERM003_AdminAreaProxyGate và PERM014_AdminPageAndActionGuard.

### Related Screens

- SCR003_AppLayout - AppLayout
- SCR002_AdminLayout - AdminLayout

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Không có menu tài khoản |
| sunner | ✗ | Mục Dashboard bị ẩn |
| admin | ✓ | Thấy mục Dashboard dẫn tới `/admin/overview` |

### Related Modules

- `features/app-shell/components/account-menu.tsx`, `features/app-shell/server/shell-session.ts` (F002_AppShell)

---

## PERM017_AdminUserRoleChange: Admin user role change

**Type**: action-permission
**Enforced At**: `setUserRoleAction`, `UserRoleService.setRole`

### Description

Chỉ admin đổi được role của người khác; actor lấy từ phiên, không nhận từ client (`features/admin-users/server/set-user-role-action.ts:19-24`). `UserRoleService` là nơi duy nhất ghi `profiles.role` từ UI, kèm `role_updated_by` và `role_updated_at`, trong một transaction khóa các hàng admin theo `id` (`features/admin-users/server/user-role-service.ts:30-37, 49-52`). Hạ xuống `user` bị từ chối khi: tự hạ chính mình `SELF_DEMOTE` (`user-role-service.ts:43`), tài khoản thuộc `ADMIN_EMAILS` `ENV_ADMIN` (`:44`), admin cuối cùng `LAST_ADMIN` (`:45`). Actor đã bị hạ trong lúc chờ khóa thì `FORBIDDEN` (`:47`); không thấy người dùng thì `NOT_FOUND` (`:39`). Nâng lên admin chỉ cần actor còn là admin. UPDATE có điều kiện `role <> target` để không ghi đè khi có xen kẽ bất ngờ (`:52`).

### Related Routes

- (POST server action) setUserRoleAction (ROUTE032)

### Related Screens

- SCR018_AdminUser - AdminUser

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` |
| sunner | ✗ | 403 từ `requireAdmin()` |
| admin | ✓ | Không tự hạ chính mình, không hạ tài khoản `ADMIN_EMAILS`, không hạ admin cuối cùng; actor phải còn là admin trong transaction |

### Related Modules

- `features/admin-users/server/set-user-role-action.ts`, `features/admin-users/server/user-role-service.ts` (F014_AdminUserManagement)

---

## PERM018_AdminRoleMenuState: Admin role menu state

**Type**: screen-permission
**Enforced At**: UI `roleMenuState`

### Description

Menu "⋯" ở bảng người dùng quyết định tuỳ chọn theo hàng: hàng của chính actor không có tuỳ chọn; hàng `user` hiện "Set as Admin"; hàng admin khác hiện "Set as User"; hàng admin thuộc `ADMIN_EMAILS` hiện "Set as User" ở trạng thái khoá kèm tooltip (`features/admin-users/lib/admin-user-role-menu-state.ts:17-22`). Chỉ là UI; server vẫn từ chối các trường hợp tương ứng (PERM017_AdminUserRoleChange).

### Related Screens

- SCR018_AdminUser - AdminUser

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Không vào được màn |
| sunner | ✗ | Không vào được màn |
| admin | ✓ | Hàng của mình không có tuỳ chọn; hàng admin thuộc `ADMIN_EMAILS` bị khoá |

### Related Modules

- `features/admin-users/lib/admin-user-role-menu-state.ts`, `features/admin-users/components/admin-user-role-menu.tsx` (F014_AdminUserManagement)

---

## PERM019_AdminKudoModeration: Admin kudo moderation

**Type**: action-permission
**Enforced At**: Server Action `markKudoSpam`, `unSpamKudo`

### Description

Chỉ admin chuyển trạng thái Kudo `public → spam` và `spam → public`; `requireAdmin()` chạy đầu tiên, `adminId` lấy từ phiên, id phải là uuid (`features/admin-moderation/server/kudo-moderation-actions.ts:19-22, 36-42`). Không có bước lý do; thao tác click trong popover là xác nhận. Kết quả được xử lý theo từng mã (đã ở trạng thái đích, không còn tồn tại) và `/admin/review` được làm mới sau mỗi lần đọc DB (`kudo-moderation-actions.ts:24-32`).

### Related Routes

- (POST server action) markKudoSpam (ROUTE027)
- (POST server action) unSpamKudo (ROUTE028)

### Related Screens

- SCR013_AdminReviewContent - AdminReviewContent

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` |
| sunner | ✗ | 403 từ `requireAdmin()` |
| admin | ✓ | Id Kudo hợp lệ; actor là admin tại thời điểm gọi |

### Related Modules

- `features/admin-moderation/server/kudo-moderation-actions.ts`, `features/admin-moderation/server/kudo-moderation-service.ts` (F007_AdminModeration)

---

## PERM020_AdminCampaignManagement: Admin campaign management

**Type**: action-permission
**Enforced At**: Server Action campaign (tạo, sửa, xóa)

### Description

Chỉ admin tạo, sửa, xóa campaign nhân đôi tim: `requireAdmin()` ở ba action (`features/admin-campaigns/server/campaign-admin-actions.ts:40, 59, 90`) và ở query danh sách (`features/admin-campaigns/server/campaign-admin-query.ts:17`). Ngoài quyền admin còn có luật nghiệp vụ, không phải luật phân quyền: khoảng thời gian không được chồng campaign khác (`OVERLAP`, `campaign-admin-actions.ts:35`) và campaign đã kết thúc không sửa hay xóa được (`ENDED`, `campaign-admin-actions.ts:73-74, 96`).

### Related Routes

- (POST server action) createCampaign (ROUTE029)
- (POST server action) updateCampaign (ROUTE030)
- (POST server action) removeCampaign (ROUTE031)

### Related Screens

- SCR014_AdminCampaignSettings - AdminCampaignSettings

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` |
| sunner | ✗ | 403 từ `requireAdmin()` |
| admin | ✓ | Campaign chưa kết thúc; khoảng thời gian không chồng campaign khác |

### Related Modules

- `features/admin-campaigns/server/campaign-admin-actions.ts`, `features/admin-campaigns/server/campaign-admin-query.ts` (F011_AdminCampaigns)

---

## PERM021_AdminRealSenderView: Admin real sender view

**Type**: field-permission
**Enforced At**: DTO admin-only (`KudoAdminQuery`), CSV export

### Description

Chỉ admin thấy người gửi thật của Kudo ẩn danh, ở bảng Review và CSV export. Hàng `AdminKudoRow` luôn mang người gửi thật, kể cả Kudo ẩn danh (`features/admin-moderation/schemas/admin-kudo-row.ts:2-5, 18`). DTO chỉ được dựng sau `requireAdmin()` hoặc `requireAdminApi()` và không được tái sử dụng cho bề mặt công khai, vì Drizzle bỏ qua RLS (`features/admin-moderation/server/kudo-admin-query.ts:13-14`). Mọi bề mặt còn lại chỉ thấy nickname, xem PERM028_AnonymousSenderMask.

### Related Routes

- (GET) /api/admin/kudos (ROUTE001)
- (GET) /api/admin/kudos/export (ROUTE002)

### Related Screens

- SCR013_AdminReviewContent - AdminReviewContent

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Không có đường vào |
| sunner | ✗ | Chỉ thấy nickname của Kudo ẩn danh |
| admin | ✓ | Chỉ qua truy vấn admin sau `requireAdmin()` hoặc `requireAdminApi()` |

### Related Modules

- `features/admin-moderation/schemas/admin-kudo-row.ts`, `features/admin-moderation/server/kudo-admin-query.ts`, `features/admin-moderation/server/admin-kudo-export.ts` (F007_AdminModeration)

---

## PERM022_EventWritingWindow: Event writing window

**Type**: env-gate
**Enforced At**: `isEventWritingOpen` (action, handler, UI)

### Description

Một hàm duy nhất quyết định "còn được ghi Kudo, tim, upload ảnh hay không": mở từ `LAUNCH_AT` (gồm cả mốc) đến `EVENT_END_AT` (không gồm). Cận `LAUNCH_AT` bổ sung cho cổng prelaunch vì cổng đó chỉ chặn tải trang; admin cũng bị áp dụng (`shared/config/event-window.ts:4-14`). Hai mốc được kiểm tra `LAUNCH_AT < EVENT_END_AT` lúc khởi động (`shared/config/env-schema.ts:95-99`). Nơi áp dụng phía server: `features/kudos-authoring/server/create-kudo-action.ts:21`, `update-kudo-action.ts:20`, `app/api/kudos/images/sign/route.ts:21`, `features/kudos-hearts/server/kudo-heart-service.ts:62, 72`, `features/profile/server/sunner-card-query.ts:31`. Phía UI khoá nút theo cùng giá trị: `features/kudos-authoring/components/kudo-composer-launcher.tsx:32`, `features/kudos-feed/components/kudo-card-can-edit.ts:7`, `features/kudos-hearts/components/kudo-heart-button.tsx:61`, `features/profile/components/profile-send-kudo-button.tsx:32`.

**source:** `shared/config/event-window.ts:13` (`nowMs >= env.LAUNCH_AT && nowMs < env.EVENT_END_AT`)
**trigger:** mỗi lần gọi `createKudo`, `updateKudo`, `POST /api/kudos/images/sign`, thả hoặc bỏ tim, và khi dựng các nút ghi trên giao diện
**effect:** ngoài khoảng `[LAUNCH_AT, EVENT_END_AT)` → Kudo và upload trả `WRITING_CLOSED` (403), tim trả `EVENT_ENDED`; nút ghi bị khoá; áp dụng cho cả admin

### Related Routes

- (POST) /api/kudos/images/sign (ROUTE010)
- (POST server action) createKudo (ROUTE023), updateKudo (ROUTE024)
- (POST server action) addHeartAction (ROUTE025), removeHeartAction (ROUTE026)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG001_KudoComposer - Kudo composer
- SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed - All kudos feed
- SCR006_KudoDetail - KudoDetail
- SCR015_OtherProfile - OtherProfile
- SCR016_OwnProfile - OwnProfile

### Related Modules

- `shared/config/event-window.ts`, `features/kudos-authoring/server/kudo-write-window.ts` (F003_KudosAuthoring, F005_KudosHearts)

---

## PERM023_KudoCreate: Kudo create

**Type**: action-permission
**Enforced At**: Server Action `createKudo`

### Description

Thứ tự kiểm tra: `requireSunner()` (người gửi luôn lấy từ phiên, `status` không bao giờ do client ghi), cửa sổ ghi, schema Zod, người nhận khác chính mình (`SELF_SEND`, 422) (`features/kudos-authoring/server/create-kudo-action.ts:19-27`). Kudo, hashtag, ảnh và dòng outbox `KudoCreated` được ghi trong một transaction (`create-kudo-action.ts:30-34`). Ảnh đính kèm chỉ được nhận khi `kudo_image_uploads` ghi đúng người gửi và object thật sự tồn tại (`features/kudos-authoring/server/kudo-image-upload-service.ts:12-17`).

### Related Routes

- (POST server action) createKudo (ROUTE023)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG001_KudoComposer - Kudo composer
- SCR015_OtherProfile - OtherProfile

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` |
| sunner | ✓ | Đã chọn phòng ban; cửa sổ ghi đang mở; người nhận khác chính mình |
| admin | ✓ | Cùng điều kiện như `sunner`, không có đặc quyền riêng |

### Related Modules

- `features/kudos-authoring/server/create-kudo-action.ts`, `features/kudos-authoring/server/kudo-write-repository.ts` (F003_KudosAuthoring)

---

## PERM024_KudoImageUploadSigning: Kudo image upload signing

**Type**: action-permission
**Enforced At**: Route Handler `POST /api/kudos/images/sign`

### Description

Qua `requireApiSunner()` (401, 403 onboarding), rồi cửa sổ ghi (403 `WRITING_CLOSED`), body JSON tối đa 4 KB (413, không parse) với Content-Type JSON để chặn form post chéo trang, ảnh jpeg/png/webp trong 1..5 MB (400) và tối đa 20 upload đang chờ trong 24 giờ cho mỗi người (429 `UPLOAD_LIMIT`) (`app/api/kudos/images/sign/route.ts:10-37`, `features/kudos-authoring/kudo-authoring-limits.ts:19-22`, `features/kudos-authoring/server/kudo-image-upload-service.ts:34-51`). Path ký có dạng `kudos/{uuid}.{ext}`, không chứa sender id, và việc ai xin path được ghi vào `kudo_image_uploads` để đối chiếu khi gắn ảnh vào Kudo (`kudo-image-upload-service.ts:12-14`). Đếm và ghi chạy trong transaction có advisory lock theo người upload nên một loạt request song song không vượt trần.

### Related Routes

- (POST) /api/kudos/images/sign (ROUTE010)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG001_KudoComposer - Kudo composer

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | 401 `UNAUTHENTICATED` |
| sunner | ✓ | Đã chọn phòng ban; cửa sổ ghi mở; dưới 20 upload đang chờ trong 24 giờ |
| admin | ✓ | Cùng điều kiện như `sunner` |

### Related Modules

- `app/api/kudos/images/sign/route.ts`, `features/kudos-authoring/server/kudo-image-upload-service.ts` (F003_KudosAuthoring)
- BL008_KudoImageUploadSigning

---

## PERM025_KudoOwnerEdit: Kudo owner edit

**Type**: resource-ownership
**Enforced At**: `updateKudo`, `GET /api/kudos/[id]/edit`

### Description

Chỉ chủ Kudo (`sender_id` trùng người dùng của phiên) mới sửa được, chỉ khi Kudo còn `public`, cửa sổ ghi mở, và không đổi được người nhận (`features/kudos-authoring/server/update-kudo-action.ts:13-21`). `updateOwnPublicKudo` là một UPDATE có điều kiện (chủ và `public`); thất bại thì đọc lại để phân loại `NOT_FOUND`, `FORBIDDEN` hoặc `SPAM_LOCKED` (423), không lộ nội dung (`features/kudos-authoring/server/kudo-write-repository.ts:69-83`). `GET /api/kudos/{id}/edit` chỉ trả dữ liệu điền sẵn cho chủ: người khác nhận 403 `FORBIDDEN`, id sai hoặc không có nhận 404; Kudo spam vẫn mở được cho chủ nhưng đánh dấu `locked` (`features/kudos-authoring/server/kudo-edit-query.ts:14, 48-49, 73`, `app/api/kudos/[id]/edit/route.ts:27-32`). Cửa sổ ghi chỉ được kiểm khi lưu (`updateKudo`) và ở nút bút trên thẻ; `GET /api/kudos/{id}/edit` không kiểm nên vẫn trả dữ liệu điền sẵn cho chủ sau `EVENT_END_AT` (`app/api/kudos/[id]/edit/route.ts:22-37`). Admin không có quyền sửa hộ.

### Related Routes

- (GET) /api/kudos/[id]/edit (ROUTE009)
- (POST server action) updateKudo (ROUTE024)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG003_HighlightKudos - Highlight kudos
- SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed - All kudos feed
- SCR006_KudoDetail - KudoDetail
- SCR016_OwnProfile - OwnProfile

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` hoặc 401 |
| sunner | ✓ | Chỉ chủ Kudo; Kudo `public`; cửa sổ ghi mở |
| admin | ✓ | Chỉ khi chính là chủ Kudo; không có quyền sửa hộ |

### Related Modules

- `features/kudos-authoring/server/update-kudo-action.ts`, `features/kudos-authoring/server/kudo-write-repository.ts`, `features/kudos-authoring/server/kudo-edit-query.ts` (F003_KudosAuthoring)

---

## PERM026_KudoEditButtonVisibility: Kudo edit button visibility

**Type**: screen-permission
**Enforced At**: UI `kudoCardCanEdit`

### Description

Bút sửa trên thẻ Kudo chỉ hiện khi `isOwner && !isSpam && writingOpen` (`features/kudos-feed/components/kudo-card-can-edit.ts:6-8`). `isOwner` do server tính nên chủ của Kudo ẩn danh vẫn thấy bút (`features/kudos-feed/server/kudo-row-mask.ts:11-18, 56`). Thẻ spam của chính chủ ẩn luôn tim, Copy Link và bút (`features/kudos-feed/components/kudo-card.tsx:24-30`). Chỉ là UI; server vẫn trả `WRITING_CLOSED` hoặc `SPAM_LOCKED` khi lưu (PERM025_KudoOwnerEdit).

### Related Screens

- SCR007_KudosLiveBoardFeed/REG003_HighlightKudos - Highlight kudos
- SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed - All kudos feed
- SCR006_KudoDetail - KudoDetail
- SCR016_OwnProfile - OwnProfile
- SCR015_OtherProfile - OtherProfile

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Không có đường vào |
| sunner | ✓ | Chủ Kudo; Kudo không phải spam; cửa sổ ghi mở |
| admin | ✓ | Chỉ trên Kudo do chính mình gửi, cùng điều kiện như `sunner` |

### Related Modules

- `features/kudos-feed/components/kudo-card-can-edit.ts`, `features/kudos-feed/components/kudo-card.tsx` (F004_KudosFeed)

---

## PERM027_KudoHeartToggle: Kudo heart toggle

**Type**: action-permission
**Enforced At**: Server Action `addHeartAction`, `removeHeartAction`

### Description

`requireSunner()` rồi id phải là uuid (`features/kudos-hearts/server/kudo-heart-actions.ts:18-21`). Thả tim chạy trong một câu `INSERT ... SELECT` chứa mọi điều kiện: Kudo phải `public`, người thả không phải người gửi (kể cả Kudo ẩn danh) và còn trong cửa sổ ghi (`features/kudos-hearts/server/kudo-heart-service.ts:10-14, 37-38`); lỗi trả `KUDO_UNAVAILABLE`, `SELF_HEART`, `EVENT_ENDED` (`kudo-heart-service.ts:51-57`). Bỏ tim là DELETE idempotent, được phép cả trên Kudo spam, nhưng bị chặn ngoài cửa sổ ghi (`kudo-heart-service.ts:71-73`). Nút tim ở UI khoá sẵn cho chủ Kudo (`SELF_HEART`) và khi hết cửa sổ (`EVENT_ENDED`) (`features/kudos-hearts/components/kudo-heart-button.tsx:61`).

### Related Routes

- (POST server action) addHeartAction (ROUTE025)
- (POST server action) removeHeartAction (ROUTE026)

### Related Screens

- SCR006_KudoDetail - KudoDetail
- SCR007_KudosLiveBoardFeed/REG003_HighlightKudos - Highlight kudos
- SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed - All kudos feed
- SCR015_OtherProfile - OtherProfile
- SCR016_OwnProfile - OwnProfile

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Chuyển `/login` |
| sunner | ✓ | Kudo đang `public`; không phải Kudo của mình; cửa sổ ghi mở |
| admin | ✓ | Cùng điều kiện như `sunner` |

### Related Modules

- `features/kudos-hearts/server/kudo-heart-actions.ts`, `features/kudos-hearts/server/kudo-heart-service.ts` (F005_KudosHearts)

---

## PERM028_AnonymousSenderMask: Anonymous sender mask

**Type**: field-permission
**Enforced At**: Mapper server `maskKudoRow`, `KudoPublicQuery`

### Description

Với Kudo ẩn danh, người gửi chỉ lộ `{ anonymous: true, nickname }`: không id, tên, avatar, phòng ban hay hạng; thẻ được dựng từ whitelist tường minh, không spread cả hàng (`features/kudos-feed/server/kudo-row-mask.ts:11-18, 26-28`). Drizzle chạy bằng server role và bỏ qua RLS, nên mapper này, không phải UI cũng không phải RLS, là ranh giới bảo mật (`kudo-row-mask.ts:12-14`). `isOwner` là tín hiệu sở hữu duy nhất (`kudo-row-mask.ts:56`). Lọc theo người gửi loại Kudo ẩn danh của người khác để không suy ra danh tính bằng phép trừ tập (`features/kudos-feed/server/kudo-public-query.ts:57-58`). Admin không có ngoại lệ trên các bề mặt công khai; chỉ truy vấn riêng của admin mới thấy người gửi thật (PERM021_AdminRealSenderView).

### Related Routes

- (GET) /api/kudos (ROUTE007)
- (GET) /api/kudos/highlight (ROUTE008)
- (GET) /api/profile/:userId/kudos (ROUTE014)

### Related Screens

- SCR006_KudoDetail - KudoDetail
- SCR007_KudosLiveBoardFeed/REG003_HighlightKudos - Highlight kudos
- SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed - All kudos feed
- SCR015_OtherProfile - OtherProfile
- SCR016_OwnProfile - OwnProfile

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Không có đường vào |
| sunner | ✓ | Chỉ thấy nickname của Kudo ẩn danh; chủ Kudo nhận cờ `isOwner` |
| admin | ✓ | Trên bề mặt công khai cũng chỉ thấy nickname |

### Related Modules

- `features/kudos-feed/server/kudo-row-mask.ts`, `features/kudos-feed/server/kudo-public-query.ts` (F004_KudosFeed)

---

## PERM029_SpamKudoVisibility: Spam kudo visibility

**Type**: data-permission
**Enforced At**: `KudoPublicQuery` (`list`, `findForViewer`)

### Description

Feed và danh sách chỉ trả Kudo `public` (`features/kudos-feed/server/kudo-public-query.ts:55`). Kudo `spam` chỉ người gửi thấy: ở trang chi tiết (`isSpam: true`, chỉ đọc) và trong danh sách "Đã gửi" của chính mình, vì `includeOwnSpam` chỉ có tác dụng khi `senderId === viewerId` (`kudo-public-query.ts:53-55, 84-93`). Id sai, id không tồn tại và spam của người khác cùng trả null rồi `notFound()`, nên không thành "oracle" để dò sự tồn tại của Kudo (`kudo-public-query.ts:84-88`). Thẻ spam của chủ mờ đi và ẩn tim, Copy Link, bút (`features/kudos-feed/components/kudo-card.tsx:24-30`). Admin xem Kudo spam qua truy vấn riêng ở màn Review (PERM021_AdminRealSenderView).

### Related Routes

- (GET) /api/kudos (ROUTE007)
- (GET) /api/kudos/highlight (ROUTE008)
- (GET) /api/profile/:userId/kudos (ROUTE014)
- (GET) /kudos/:id

### Related Screens

- SCR006_KudoDetail - KudoDetail
- SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed - All kudos feed
- SCR016_OwnProfile - OwnProfile

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Không có đường vào |
| sunner | ✓ | Kudo `public` của mọi người; Kudo `spam` chỉ của chính mình |
| admin | ✓ | Như `sunner` trên bề mặt công khai |

### Related Modules

- `features/kudos-feed/server/kudo-public-query.ts`, `features/kudos-feed/components/kudo-card.tsx` (F004_KudosFeed)

---

## PERM030_ProfileSentListOwnerOnly: Profile sent list owner only

**Type**: resource-ownership
**Enforced At**: Route Handler `GET /api/profile/:userId/kudos`, page `/profile/:userId`

### Description

Danh sách "Đã gửi" chỉ có ở profile của chính mình: `direction=sent` luôn lọc theo người xem, với profile người khác trả 403 `FORBIDDEN` (`features/profile/lib/profile-kudos-filter.ts:18-21`, `app/api/profile/[userId]/kudos/route.ts:42`). Lý do là lọc theo người gửi trên profile người khác sẽ lộ người gửi ẩn danh bằng phép trừ tập (`profile-kudos-filter.ts:6-7`). Mở `/profile/{id của chính mình}` bị chuyển về `/profile` (`app/(app)/profile/[userId]/page.tsx:33`). Profile người khác chỉ có "Đã nhận" và không có số "Đã gửi" (`profile-kudos-filter.ts:31-37`). Id không phải uuid trả 404.

### Related Routes

- (GET) /api/profile/:userId/kudos (ROUTE014)
- (GET) /profile/:userId

### Related Screens

- SCR015_OtherProfile - OtherProfile
- SCR016_OwnProfile - OwnProfile

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | 401 `UNAUTHENTICATED` |
| sunner | ✓ | "Đã gửi" chỉ của chính mình; "Đã nhận" của bất kỳ Sunner nào |
| admin | ✓ | Như `sunner`, không có ngoại lệ |

### Related Modules

- `features/profile/lib/profile-kudos-filter.ts`, `features/profile/server/profile-kudos-list-service.ts` (F012_Profile)

---

## PERM031_SunnerCardFieldWhitelist: Sunner card field whitelist

**Type**: field-permission
**Enforced At**: Route Handler `GET /api/sunners/:userId/card`

### Description

Thẻ hover của avatar chỉ trả `{ id, fullName, departmentName, heroTier, kudosReceived, kudosSent, canSendKudo }`, không có email, role, avatar, Kudo hay dữ liệu người gửi (`app/api/sunners/[userId]/card/route.ts:9-11`). `canSendKudo = writingOpen && userId !== viewerId` (`features/profile/server/sunner-card-query.ts:31`). Tìm Sunner `GET /api/sunners/search` cũng đi qua `requireApiSunner()` (`app/api/sunners/search/route.ts:13`). Mọi phản hồi `private, no-store` để không lớp cache nào giữ số đếm.

### Related Routes

- (GET) /api/sunners/:userId/card (ROUTE019)
- (GET) /api/sunners/search (ROUTE018)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG002_SunnerProfileSearch - Sunner profile search

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | 401 `UNAUTHENTICATED` |
| sunner | ✓ | Chỉ nhận các trường trong whitelist |
| admin | ✓ | Như `sunner`, không có trường bổ sung |

### Related Modules

- `app/api/sunners/[userId]/card/route.ts`, `features/profile/server/sunner-card-query.ts` (F012_Profile)
- `features/sunner-search/server/sunner-search-query.ts` (F003_KudosAuthoring)

---

## PERM032_NotificationRecipientOnly: Notification recipient only

**Type**: resource-ownership
**Enforced At**: Route Handler, Server Action, query theo `recipient_id`

### Description

Thông báo luôn thuộc người dùng của phiên. Danh sách và số chưa đọc lọc `recipient_id = người dùng phiên` (`features/notifications/server/notification-query.ts:11, 51`, `features/notifications/server/notification-unread-query.ts:15`). Đánh dấu đã đọc chỉ chạm hàng của người nhận (`features/notifications/server/notification-read-state.ts:11, 30`). Các action nhận `userId` từ `requireSunner()` và chỉ nhận id thông báo; id không thuộc mình trả `not_found` (`features/notifications/server/notification-actions.ts:15-20, 28-31`). Kênh Realtime riêng xem PERM038_NotificationsRealtimeChannelRead.

### Related Routes

- (GET) /api/notifications (ROUTE011)
- (GET) /api/notifications/unread-count (ROUTE012)
- (POST server action) markNotificationRead (ROUTE033)
- (POST server action) markAllNotificationsRead (ROUTE034)

### Related Screens

- SCR003_AppLayout/REG001_NotificationBell - Notification bell
- SCR017_AllNotifications - AllNotifications

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | 401 hoặc chuyển `/login` |
| sunner | ✓ | Chỉ thông báo của chính mình |
| admin | ✓ | Chỉ thông báo của chính mình, không đọc hộ người khác |

### Related Modules

- `features/notifications/server/notification-query.ts`, `features/notifications/server/notification-read-state.ts`, `features/notifications/server/notification-actions.ts` (F013_Notifications)

---

## PERM033_SecretBoxOwnerOnly: Secret box owner only

**Type**: resource-ownership
**Enforced At**: Route Handler `/api/secret-boxes/*`, `SecretBoxOpenService`

### Description

`GET /api/secret-boxes/me` và `POST /api/secret-boxes/open` lấy user id chỉ từ phiên, không lấy từ body, query hay header (`features/secret-box-rewards/server/secret-box-api-session.ts:5-9`). Mở hộp luôn chọn hộp chưa mở thấp nhất của chính `userId` (`features/secret-box-rewards/server/secret-box-open-service.ts:55-60`) và tra kết quả cũ theo cặp người dùng cùng `Idempotency-Key` (`secret-box-open-service.ts:35-48`); header này phải là uuid v4, sai thì 400 `invalid_idempotency_key` (`app/api/secret-boxes/open/route.ts:16`). Cột phần thưởng của Live board chỉ tải sau `requireSunner()`, nên khách không bao giờ bị đọc tên người trúng quà hay thống kê; danh sách 10 người nhận quà gần nhất hiển thị cho mọi Sunner (`features/secret-box-rewards/server/rewards-column-data-loader.ts:8-14, 25`).

### Related Routes

- (GET) /api/secret-boxes/me (ROUTE015)
- (POST) /api/secret-boxes/open (ROUTE016)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG006_RewardsColumn - Rewards column

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | 401 `unauthorized` |
| sunner | ✓ | Chỉ hộp của chính mình; `Idempotency-Key` là uuid v4 khi mở hộp |
| admin | ✓ | Chỉ hộp của chính mình |

### Related Modules

- `features/secret-box-rewards/server/secret-box-api-session.ts`, `features/secret-box-rewards/server/secret-box-open-service.ts`, `features/secret-box-rewards/server/rewards-column-data-loader.ts` (F010_SecretBoxRewards)

---

## PERM034_InternalJobSecretGuards: Internal job secret guards

**Type**: api-scope
**Enforced At**: Route Handler `/api/internal/*`

### Description

Hai endpoint cron không có phiên: path nằm trong allowlist (`shared/auth/public-paths.ts:24, 30, 33-40`) và cổng prelaunch cho qua vì là path công khai (`features/awards-portal/server/prelaunch-gate.ts:67`). Handler tự bảo vệ bằng header bí mật: `x-job-secret` với `INTERNAL_JOB_SECRET` (`features/secret-box-rewards/server/internal-job-guard.ts:11-22`) và `x-drain-secret` với `OUTBOX_DRAIN_SECRET` (`features/notifications/server/outbox-drain-guard.ts:11-22`). Cả hai giá trị được băm SHA-256 rồi so bằng `timingSafeEqual`, nên thời gian so không phụ thuộc độ dài hay byte sai đầu tiên. Secret chưa cấu hình thì 503 `not_configured`; thiếu hoặc sai thì 401 `unauthorized` (`app/api/internal/secret-box/tick/route.ts:17-19`, `app/api/internal/notifications/drain/route.ts:16-18`). Secret tối thiểu 32 ký tự và là tuỳ chọn (`shared/config/env-schema.ts:81-84`). Người gọi là pg_cron qua pg_net (secret đọc từ Vault) hoặc cron của host; không có đường nào từ trình duyệt.

### Related Routes

- (POST) /api/internal/secret-box/tick (ROUTE006)
- (POST) /api/internal/notifications/drain (ROUTE005)

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Không có header bí mật thì 401 `unauthorized` |
| sunner | ✗ | Không có đường từ UI; vẫn cần header bí mật |
| admin | ✗ | Không có đặc quyền; vẫn cần header bí mật |
| scheduler | ✓ | Gửi đúng header bí mật; secret đã được cấu hình |

### Related Modules

- `features/secret-box-rewards/server/internal-job-guard.ts` (F010_SecretBoxRewards)
- `features/notifications/server/outbox-drain-guard.ts` (F013_Notifications)
- BL025_NotificationOutboxDrainEndpoint, BL027_SecretBoxTickEndpoint, BL028_SecretBoxTickCron, BL029_NotificationsDrainCron

---

## PERM035_DatabaseRlsBaseline: Database RLS baseline

**Type**: data-permission
**Enforced At**: Postgres RLS + REVOKE (`0002`, `0004`)

### Description

Mọi bảng trong schema `public` bật RLS và không có policy nào cho `anon` hay `authenticated`; `REVOKE ALL` trên các bảng hiện có và trên default privileges của bảng tương lai (`db/migrations/0002_rls_baseline.sql:1-12`). Mỗi bảng mới tự `REVOKE` lại ngay trong migration của nó (`db/migrations/0004_profiles.sql:14-19`, `0007_kudos_constraints.sql:27`, `0012_campaigns_no_overlap_exclude.sql:12`). Hệ quả: client dùng anon key hoặc phiên người dùng không đọc hay ghi được bảng nào qua PostgREST. Mọi truy cập đi qua server code: Drizzle kết nối bằng server role và bỏ qua RLS (`shared/db/client.ts:8`), còn Supabase service-role client chỉ dành cho ký URL Storage và gọi Auth admin (`shared/db/supabase-service-client.ts:5-9`). Vì vậy phân quyền thật nằm trong guard và service ở tầng server (các mục trên), không nằm trong DB. Trigger function mới đều bị `REVOKE EXECUTE` khỏi client role (`0005_auth_user_triggers.sql:99-102`).

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Role `anon` không có quyền trên bảng nào |
| sunner | ✗ | Role `authenticated` không có quyền trực tiếp; dữ liệu đi qua server code |
| admin | ✗ | Admin ứng dụng cũng đi qua server code, không truy cập DB trực tiếp |

### Related Modules

- `db/migrations/0002_rls_baseline.sql`, `db/migrations/0004_profiles.sql`, `shared/db/client.ts`, `shared/db/supabase-service-client.ts`
- BL012_SupabaseServiceClient

---

## PERM036_KudoImageStorageAccess: Kudo image storage access

**Type**: data-permission
**Enforced At**: Supabase Storage bucket + signed URL phía server

### Description

Bucket `kudo-images` là private, tối đa 5 MiB mỗi tệp, chỉ nhận jpeg/png/webp; migration dùng `DO UPDATE` nên bucket tạo tay trước đó bị sửa về đúng bất biến (`db/migrations/0003_storage_kudo_images_bucket.sql:4-17`). Client không có policy trên bucket; đọc ảnh chỉ qua signed URL do server ký bằng service-role, hiệu lực 30 phút (`features/kudos-feed/server/kudo-image-read-urls.ts:6-11, 17-20`); tải lên chỉ qua signed upload URL (PERM024_KudoImageUploadSigning). Path object không chứa sender id nên ảnh của Kudo ẩn danh không lộ người gửi (`0003_storage_kudo_images_bucket.sql:1-3`).

### Related Routes

- (POST) /api/kudos/images/sign (ROUTE010)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG001_KudoComposer - Kudo composer

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Không có policy và không có signed URL |
| sunner | ✓ | Chỉ qua signed URL do server cấp (đọc 30 phút; upload qua token ký) |
| admin | ✓ | Như `sunner` |

### Related Modules

- `db/migrations/0003_storage_kudo_images_bucket.sql`, `features/kudos-feed/server/kudo-image-read-urls.ts` (F003_KudosAuthoring, F004_KudosFeed)
- BL008_KudoImageUploadSigning, BL009_KudoImageReadSigning

---

## PERM037_SpotlightRealtimeChannelRead: Spotlight realtime channel read

**Type**: data-permission
**Enforced At**: Policy RLS trên `realtime.messages` (`0017`)

### Description

Policy `spotlight_authenticated_read`: role `authenticated` đọc được broadcast của topic `spotlight` và chỉ topic đó. Policy kiểm cả `realtime.topic()` lẫn cột `topic` của hàng, vì policy permissive được OR với nhau nên thiếu một vế thì có thể đọc topic khác (`db/migrations/0017_spotlight_realtime.sql:76-81`). Hook ở client mở channel private và `setAuth` bằng token phiên (`features/spotlight-board/hooks/use-spotlight-channel.ts:61-66`). Khách (`anon`) không đọc được. Dữ liệu phát chỉ gồm Kudo public, không có dữ liệu người gửi (`app/api/spotlight/route.ts:4-6`).

### Related Routes

- (GET) /api/spotlight (ROUTE017)

### Related Screens

- SCR007_KudosLiveBoardFeed/REG004_SpotlightBoard - Spotlight board

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Role `anon` không có policy đọc |
| sunner | ✓ | Mọi người dùng đã xác thực đọc được topic `spotlight` |
| admin | ✓ | Như `sunner` |

### Related Modules

- `db/migrations/0017_spotlight_realtime.sql`, `features/spotlight-board/hooks/use-spotlight-channel.ts` (F008_SpotlightBoard)
- BL003_SpotlightChannelListener, BL023_SpotlightPublishKudoEvent

---

## PERM038_NotificationsRealtimeChannelRead: Notifications realtime channel read

**Type**: data-permission
**Enforced At**: Policy RLS trên `realtime.messages` (`0019`)

### Description

Policy `notifications_recipient_read`: role `authenticated` chỉ đọc được topic `notifications:{auth.uid()}` của chính mình, cũng kiểm cả `realtime.topic()` lẫn cột `topic` (`db/migrations/0019_notifications_realtime.sql:53-59`). Hook client mở channel private bằng token phiên, topic dựng từ user id của phiên (`features/notifications/hooks/use-notification-channel.ts:45-50`). Kênh chỉ phát tín hiệu "có thay đổi", dữ liệu thật vẫn lấy qua `GET /api/notifications` (PERM032_NotificationRecipientOnly).

### Related Routes

- (GET) /api/notifications/unread-count (ROUTE012)

### Related Screens

- SCR003_AppLayout/REG001_NotificationBell - Notification bell

### Permission Rules

| Role | Allow | Conditions |
|------|-------|------------|
| guest | ✗ | Role `anon` không có policy đọc |
| sunner | ✓ | Chỉ topic `notifications:{user id của mình}` |
| admin | ✓ | Chỉ topic của chính mình, không nghe hộ người khác |

### Related Modules

- `db/migrations/0019_notifications_realtime.sql`, `features/notifications/hooks/use-notification-channel.ts` (F013_Notifications)
- BL002_NotificationChannelListener, BL024_NotificationsPublishSignal

---

## Summary

- **Total Permission Items**: 38
- **By Type**: route-guard: 9, screen-permission: 3, action-permission: 8, data-permission: 5, role-based: 2, resource-ownership: 4, field-permission: 3, api-scope: 1, feature-flag: 0, experiment: 0, env-gate: 3, locale-gate: 0

---

## Cross-Reference Validation

- [x] All PERM### codes are unique
- [ ] All PERM### codes are referenced in FeatureList.md (verified in Step 8)
- [x] All related route references are valid (ROUTE### in route-list.md)
- [x] All related screen references are valid (SCR### or SCR###/REG### in screen-list.md; PERM### may target a region (SCR###/REG###) for region-scoped auth gating, UI hiding only; server enforcement required)
- [x] All related module references are valid
- [x] No orphaned permission references

---

## Client-Side Gate Types

Bốn loại dưới đây (`feature-flag`, `experiment`, `env-gate`, `locale-gate`) điều khiển render hoặc hành vi mà không qua kiểm role/permission phía server. Kết quả quét mã nguồn (`app`, `features`, `shared`, `proxy.ts`):

### feature-flag

N/A — no feature-flag gates detected.

### experiment

N/A — no experiment gates detected.

### env-gate

Ba gate, đều ghi `source:` trong mục riêng:
- PERM006_EnvAdminPromotion — `ADMIN_EMAILS` nâng role admin ở mỗi lần đăng nhập (`features/auth/server/complete-login.ts:43`).
- PERM013_LocaleCookieSecureFlag — cờ `secure` của cookie ngôn ngữ chỉ bật ở production (`shared/i18n/set-locale-action.ts:27`).
- PERM022_EventWritingWindow — cửa sổ ghi theo `LAUNCH_AT` và `EVENT_END_AT` (`shared/config/event-window.ts:13`).

Mốc `LAUNCH_AT` còn điều khiển cổng prelaunch ở proxy (PERM004_PrelaunchGate, loại `route-guard` vì có nhánh bypass theo role).

### locale-gate

N/A — no locale-gate gates detected. Các nhánh `locale === "en"` trong `features/*/server/*-query.ts` và `getLocale()` trong page chỉ chọn nhãn tiếng Việt hay tiếng Anh, không bật hay tắt quyền truy cập hay hành vi.
