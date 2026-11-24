# API Map

**Project**: SAA 2025 Kudos Platform
**Generated**: 2026-11-23
**Nguồn**: `route-list.md` (36 hàng backend: 20 route handler ROUTE001–ROUTE020 và 16 server action ROUTE021–ROUTE036) và `behavior-logic.md` (34 BL, BL001–BL034)

## Endpoints by Domain

Mỗi hàng backend của `route-list.md` xuất hiện đúng một lần, nhóm theo miền (theo `Owner F###` của route-list). Cách đọc các cột:

- **Method**: `POST (server action)` là server action của Next.js, không phải endpoint HTTP công khai. Cột Path khi đó ghi các trang gọi action và tên action.
- **Path**: giữ nguyên ký pháp của route-list (`[id]` hoặc `:userId`), kèm mã ROUTE###.
- **Handler BL###**: BL nằm trong chuỗi gọi của handler (Source Symbol khớp hàm ở cột Handler của route-list, hoặc BL ghi route đó ở `Related Routes`). `(related: …)` là BL không xử lý request nhưng gắn với route: bên gọi phía client, trigger DB hoặc nơi ghi outbox. `[UNMAPPED]` là chưa có BL xử lý. BL chỉ phủ logic nền (34 mục), nên route đọc/ghi thuần không có BL; luồng nghiệp vụ của chúng nằm ở feature spec.
- **Auth**: guard thật trong code. Mã PERM### chưa cấp (Wave 3), nên chưa dùng.

Áp dụng cho mọi hàng trừ khi ghi `public` hoặc `cron-secret`: request đi qua `proxy.ts`. Khách nhận 401 JSON ở `/api/*`, bị chuyển `/login` ở trang và server action. Trước `LAUNCH_AT`, người không phải admin nhận 403 JSON `{code: "prelaunch"}` (BL013_PrelaunchGate, áp cho mọi route nên không lặp ở từng hàng). Người không phải admin vào `/admin/*` nhận 403 JSON.

| Guard | Ý nghĩa |
|-------|---------|
| `public` | nằm trong danh sách công khai của proxy, không cần phiên |
| `cron-secret` | header bí mật, so SHA-256 bằng `timingSafeEqual` (503 `not_configured`, 401 `unauthorized`); không cần phiên |
| `getSessionUser` | có phiên Supabase hợp lệ |
| `requireSecretBoxUser`, `requireNotificationUser` | có phiên, 401 `unauthorized` trước mọi truy vấn DB; không kiểm phòng ban |
| `requireApiSunner` | route handler: có phiên và hồ sơ (401 `UNAUTHENTICATED`), đã chọn phòng ban (403 `ONBOARDING_REQUIRED`) |
| `requireSunner` | server action: có phiên và hồ sơ (chuyển `/login`), đã chọn phòng ban (chuyển `/onboarding/department`) |
| `requireAdminApi` | route handler: admin (401 `unauthorized`, 403 `forbidden`) |
| `requireAdmin` | server action: admin (chuyển `/login`, hoặc `forbidden()` 403); gọi đầu tiên trong action |

### Auth & Onboarding

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/auth/callback` (ROUTE020) | BL004, BL011 (related: BL018, BL019, BL021) | `public` (allowlist của proxy); đổi `code` PKCE lấy phiên, `completeLogin` kiểm lại tên miền |
| POST (server action) | `/login` (ROUTE021, `signInWithGoogle`) | BL005, BL011 | `public` (cửa vào của khách; đã đăng nhập thì proxy chuyển `/`) |
| POST (server action) | `/onboarding/department` (ROUTE022, `chooseDepartment`) | [UNMAPPED] | `getSessionUser` (khách → `/login`); phòng ban chỉ đặt được khi còn trống |
| POST (server action) | `/`, `/awards`, `/community-standards`, `/kudos`, `/kudos/:id`, `/notifications`, `/profile`, `/profile/:userId`, `/rules`, `/admin/overview`, `/admin/review`, `/admin/settings`, `/admin/users` (ROUTE035, `signOut`) | BL011 | proxy (phiên); không có guard trong action |

### Locale

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| POST (server action) | `/login`, `/countdown`, `/`, `/awards`, `/community-standards`, `/kudos`, `/kudos/:id`, `/notifications`, `/profile`, `/profile/:userId`, `/rules`, `/admin/overview`, `/admin/review`, `/admin/settings`, `/admin/users` (ROUTE036, `setLocaleAction`) | [UNMAPPED] | `public` ở `/login` và `/countdown`, các trang còn lại qua phiên; không có guard trong action |

### Kudos Authoring

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/kudos/[id]/edit` (ROUTE009) | BL007, BL012 | `requireApiSunner`; chỉ chủ Kudo (403 `FORBIDDEN`) |
| POST | `/api/kudos/images/sign` (ROUTE010) | BL008, BL012 (related: BL006) | `requireApiSunner` |
| GET | `/api/hashtags` (ROUTE013) | [UNMAPPED] | `requireApiSunner` |
| GET | `/api/sunners/search` (ROUTE018) | [UNMAPPED] | `requireApiSunner` |
| POST (server action) | `/kudos`, `/kudos/:id`, `/profile`, `/profile/:userId` (ROUTE023, `createKudo`) | BL008 (related: BL023, BL026) | `requireSunner` |
| POST (server action) | `/kudos`, `/profile`, `/profile/:userId` (ROUTE024, `updateKudo`) | [UNMAPPED] | `requireSunner`; chỉ chủ Kudo, Kudo phải `public` (`FORBIDDEN`, `SPAM_LOCKED`) |

### Kudos Feed

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/kudos` (ROUTE007) | BL009, BL012 | `requireApiSunner` |
| GET | `/api/kudos/highlight` (ROUTE008) | BL009 | `requireApiSunner` |

### Hearts

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| POST (server action) | `/kudos`, `/kudos/:id`, `/profile`, `/profile/:userId` (ROUTE025, `addHeartAction`) | [UNMAPPED] (related: BL026) | `requireSunner` |
| POST (server action) | `/kudos`, `/kudos/:id`, `/profile`, `/profile/:userId` (ROUTE026, `removeHeartAction`) | [UNMAPPED] | `requireSunner` |

### Profile & Sunner Card

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/profile/:userId/kudos` (ROUTE014) | BL009 | `requireApiSunner`; `direction=sent` chỉ trên hồ sơ của chính mình (403 `FORBIDDEN`) |
| GET | `/api/sunners/:userId/card` (ROUTE019) | [UNMAPPED] | `requireApiSunner` |

### Spotlight

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/spotlight` (ROUTE017) | [UNMAPPED] (related: BL003, BL023) | `getSessionUser` (401 `unauthorized` trước mọi truy vấn DB) |

### Secret Box

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/secret-boxes/me` (ROUTE015) | [UNMAPPED] (related: BL026) | `requireSecretBoxUser` |
| POST | `/api/secret-boxes/open` (ROUTE016) | [UNMAPPED] (related: BL026) | `requireSecretBoxUser`; header `Idempotency-Key` uuid v4 |

### Notifications

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/notifications` (ROUTE011) | [UNMAPPED] | `requireNotificationUser` |
| GET | `/api/notifications/unread-count` (ROUTE012) | [UNMAPPED] (related: BL002, BL024) | `requireNotificationUser` |
| POST (server action) | `/`, `/awards`, `/community-standards`, `/kudos`, `/kudos/:id`, `/notifications`, `/profile`, `/profile/:userId`, `/rules` (ROUTE033, `markNotificationRead`) | [UNMAPPED] | `requireSunner`; người nhận luôn là người dùng của phiên |
| POST (server action) | `/`, `/awards`, `/community-standards`, `/kudos`, `/kudos/:id`, `/notifications`, `/profile`, `/profile/:userId`, `/rules` (ROUTE034, `markAllNotificationsRead`) | [UNMAPPED] | `requireSunner`; người nhận luôn là người dùng của phiên |

### Admin Kudo Moderation

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/admin/kudos` (ROUTE001) | [UNMAPPED] | `requireAdminApi` |
| GET | `/api/admin/kudos/export` (ROUTE002) | [UNMAPPED] | `requireAdminApi` |
| POST (server action) | `/admin/review` (ROUTE027, `markKudoSpam`) | [UNMAPPED] (related: BL023, BL026) | `requireAdmin` |
| POST (server action) | `/admin/review` (ROUTE028, `unSpamKudo`) | [UNMAPPED] (related: BL023) | `requireAdmin` |

### Admin Campaigns

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| POST (server action) | `/admin/settings` (ROUTE029, `createCampaign`) | [UNMAPPED] | `requireAdmin` |
| POST (server action) | `/admin/settings` (ROUTE030, `updateCampaign`) | [UNMAPPED] | `requireAdmin` |
| POST (server action) | `/admin/settings` (ROUTE031, `removeCampaign`) | [UNMAPPED] | `requireAdmin` |

### Admin Users

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/admin/users/export` (ROUTE004) | [UNMAPPED] | `requireAdminApi` |
| POST (server action) | `/admin/users` (ROUTE032, `setUserRoleAction`) | [UNMAPPED] | `requireAdmin`; `UserRoleService` chặn `SELF_DEMOTE`, `LAST_ADMIN`, `ENV_ADMIN` |

### Admin Overview

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| GET | `/api/admin/overview/export` (ROUTE003) | [UNMAPPED] | `requireAdminApi` |

### Internal Jobs

Hai route do `pg_cron` gọi qua `pg_net`, không có phiên người dùng. Lịch chạy ở mục Background Jobs.

| Method | Path | Handler BL### | Auth |
|--------|------|---------------|------|
| POST | `/api/internal/notifications/drain` (ROUTE005) | BL025, BL026, BL015, BL016, BL017, BL014 (related: BL029, BL024) | `cron-secret` (header `x-drain-secret`, biến `OUTBOX_DRAIN_SECRET`) |
| POST | `/api/internal/secret-box/tick` (ROUTE006) | BL027, BL034, BL033, BL032 (related: BL028) | `cron-secret` (header `x-job-secret`, biến `INTERNAL_JOB_SECRET`) |

## Background Jobs

Stack không có scheduler, queue hay mailer phía Node. `pg_cron` + `pg_net` gọi Route Handler `/api/internal/*` (secret lấy từ Supabase Vault); producer ghi `domain_event_outbox` trong giao dịch nghiệp vụ và `NotificationEventProcessor` là consumer duy nhất; trigger Postgres đẩy tín hiệu lên Realtime. Bảng dưới liệt kê BL chạy ngoài vòng đời request. Không có BL loại `mail` hay `webhook`.

| Code | Name | Type | Trigger | Schedule |
|------|------|------|---------|----------|
| BL001_SeedDatabaseCli | Seed Database CLI | custom-command | `npm run db:seed`, bước cuối của `npm run db:reset` | on-demand |
| BL025_NotificationOutboxDrainEndpoint | Notification Outbox Drain Endpoint | queue-worker | `POST /api/internal/notifications/drain` (ROUTE005) do BL029 gọi | mỗi 5 giây (qua BL029) |
| BL026_NotificationOutboxDrain | Notification Outbox Drain | queue-worker | mỗi lần BL025 gọi `drain()`, lô tối đa 50 sự kiện | on-demand (theo BL025) |
| BL014_HeroTierUpDetection | Hero Tier-Up Detection | notification | xử lý `KudoCreated` của Kudo công khai, trong BL026 | on-demand (theo sự kiện outbox) |
| BL015_NotificationEventContextLoad | Notification Event Context Load | notification | mỗi sự kiện outbox, trong giao dịch của sự kiện | on-demand (theo sự kiện outbox) |
| BL016_EventToNotificationMapping | Event To Notification Mapping | notification | mỗi sự kiện đã qua `domainEventSchema` | on-demand (theo sự kiện outbox) |
| BL017_NotificationWrite | Notification Write | notification | sau khi ánh xạ xong bản nháp của một sự kiện | on-demand (theo sự kiện outbox) |
| BL029_NotificationsDrainCron | Notifications Drain Cron | scheduled-job | `cron.schedule('saa-notifications-drain', '5 seconds')` | `5 seconds` |
| BL027_SecretBoxTickEndpoint | Secret Box Tick Endpoint | scheduled-job | `POST /api/internal/secret-box/tick` (ROUTE006) do BL028 gọi | mỗi phút (qua BL028) |
| BL028_SecretBoxTickCron | Secret Box Tick Cron | scheduled-job | `cron.schedule('saa-secret-box-tick', '* * * * *')` | `* * * * *` |
| BL034_SecretBoxTick | Secret Box Tick | scheduled-job | mỗi lần BL027 gọi `SecretBoxTickJob.run(now)`; advisory lock chống chạy chồng | mỗi phút (theo BL027) |
| BL033_SecretBoxSweep | Secret Box Sweep | scheduled-job | mỗi tick Secret Box, tối đa 500 người gửi mỗi tick | mỗi phút (theo BL034) |
| BL032_NationalKudosFinalize | National Kudos Finalize | scheduled-job | mỗi tick Secret Box, chỉ ghi một lần sau `NATIONAL_KUDOS_FINALIZE_AT` | mỗi phút (theo BL034), hiệu lực một lần |
| BL031_OutboxPrune | Outbox Prune | scheduled-job | `cron.schedule('saa-outbox-prune', '0 19 * * *')`, xoá sự kiện đã xử lý quá 30 ngày | `0 19 * * *` (02:00 ICT) |
| BL030_CronHistoryPrune | Cron History Prune | scheduled-job | `cron.schedule('saa-cron-history-prune', '15 19 * * *')`, xoá `cron.job_run_details` quá 7 ngày | `15 19 * * *` (02:15 ICT) |
| BL018_BeforeUserCreatedHook | Before User Created Hook | observer | hook `before_user_created` của Supabase Auth, trước khi tạo user | on-demand |
| BL021_RejectForeignDomainOnInsert | Reject Foreign Domain On Insert | observer | `BEFORE INSERT ON auth.users` | on-demand |
| BL020_RejectForeignDomainOnEmailChange | Reject Foreign Domain On Email Change | observer | `BEFORE UPDATE ON auth.users` khi email đổi | on-demand |
| BL019_CreateSunnerProfile | Create Sunner Profile | observer | `AFTER INSERT ON auth.users` | on-demand |
| BL022_SyncProfileEmail | Sync Profile Email | observer | `AFTER UPDATE OF email ON auth.users` khi email đổi | on-demand |
| BL023_SpotlightPublishKudoEvent | Spotlight Publish Kudo Event | observer | `AFTER INSERT OR UPDATE OF status ON public.kudos`, phát Realtime topic `spotlight` | on-demand |
| BL024_NotificationsPublishSignal | Notifications Publish Signal | observer | `AFTER INSERT OR UPDATE OF count ON public.notifications`, phát Realtime topic `notifications:{recipient_id}` | on-demand |

Hai chuỗi chạy nền chính:

```
pg_cron 'saa-notifications-drain' (5s) -> net.http_post (secret từ Vault)
  -> POST /api/internal/notifications/drain [ROUTE005, cron-secret]
  -> BL025 -> BL026 (FOR UPDATE SKIP LOCKED) -> BL015 -> BL014 -> BL016 -> BL017
  -> INSERT/UPDATE notifications -> trigger BL024 -> realtime.send
  -> BL002 (chuông) -> GET /api/notifications/unread-count [ROUTE012]

pg_cron 'saa-secret-box-tick' (mỗi phút) -> net.http_post (secret từ Vault)
  -> POST /api/internal/secret-box/tick [ROUTE006, cron-secret]
  -> BL027 -> BL034 (advisory lock) -> BL033 sweep -> BL032 finalize (một lần)
  -> ghi outbox BoxGranted / NationalKudosFinalized -> BL026
```

Nơi ghi `domain_event_outbox` (hàm producer `DomainEventOutbox.add`, không có BL riêng, BL026 ghi nhận):

| Event | Producer | Route kích hoạt | Consumer |
|-------|----------|-----------------|----------|
| `KudoCreated` | `create-kudo-action.ts` | ROUTE023 | BL026 |
| `HeartAdded` | `kudo-heart-service.ts` | ROUTE025 (gỡ tim ROUTE026 không ghi sự kiện) | BL026 |
| `KudoMarkedSpam` | `kudo-moderation-service.ts`, chỉ khi chuyển sang `spam` | ROUTE027 (Un Spam ROUTE028 không ghi sự kiện) | BL026 |
| `BoxGranted` | `secret-box-grant-service.ts` | ROUTE006 (BL033 sweep); đối soát trước khi đọc hoặc mở hộp: ROUTE016, ROUTE015 [INFERRED: route.ts gọi `SecretBoxQuery`, chưa xác nhận hàm nào] | BL026 |
| `SetCompleted` | `icon-collection-service.ts` | ROUTE016 (mở hộp ra icon) | BL026 |
| `NationalKudosFinalized` | `national-kudos-finalize-job.ts` | ROUTE006 (BL032) | BL026 |

## Webhooks / External Calls

Không có webhook theo nghĩa thông thường (`behavior-logic.md` không có BL loại `webhook`). Các điểm tích hợp là Supabase (Auth, Storage, Realtime) và Google OAuth qua Supabase Auth. Hướng tính từ phía hệ thống.

| Direction | Target / Source | Event / Endpoint | Description |
|-----------|----------------|------------------|-------------|
| outgoing | Google (qua Supabase Auth) | `supabase.auth.signInWithOAuth({provider: "google"})`, `queryParams.hd` = tên miền cho phép | BL005: khởi động OAuth, trình duyệt chuyển tới Google; `hd` chỉ thu hẹp bộ chọn tài khoản |
| incoming | Supabase Auth (Google OAuth) | `GET /auth/callback` (ROUTE020) | BL004: Supabase chuyển trình duyệt về kèm `code` hoặc `error`; đổi `code` lấy phiên rồi `completeLogin` |
| outgoing | Supabase Auth | `exchangeCodeForSession(code)` (BL004), `signOut({scope: "local"})` (ROUTE035), qua server client | BL011: client mỗi request, dùng khoá anon nên chịu RLS |
| incoming | Supabase Auth hook | `before_user_created` -> `public.before_user_created_hook` | BL018: từ chối email ngoài tên miền bằng 403 `domain_not_allowed`, thông báo tới `/auth/callback` qua `error_description` |
| outgoing | Supabase Storage | `createSignedUploadUrl(path)`, bucket `kudo-images` | BL008: ký vé tải lên cho `POST /api/kudos/images/sign` (ROUTE010), dùng service role BL012 |
| outgoing | Supabase Storage | `uploadToSignedUrl(path, token, file)` từ trình duyệt | BL006: trình duyệt tải ảnh thẳng lên Storage bằng vé của BL008 |
| outgoing | Supabase Storage | `createSignedUrls(paths, 600)` | BL007: URL xem trước 10 phút cho `GET /api/kudos/[id]/edit` (ROUTE009) |
| outgoing | Supabase Storage | `createSignedUrls(paths, 1800)` | BL009: URL đọc 30 phút, một lần mỗi trang, cho ROUTE007, ROUTE008, ROUTE014 |
| outgoing | Supabase Realtime (Broadcast) | `realtime.send`, topic `spotlight`, event `kudo` | BL023: trigger phát khi Kudo được thêm, ẩn hoặc khôi phục |
| outgoing | Supabase Realtime (Broadcast) | `realtime.send`, topic `notifications:{recipient_id}`, event `notification` | BL024: trigger phát tín hiệu không mang nội dung khi có thông báo mới hoặc tim tăng |
| incoming | Supabase Realtime (trình duyệt) | join `notifications:{userId}` | BL002 qua socket BL010; mỗi lần đồng bộ lại gọi ROUTE012 |
| incoming | Supabase Realtime (trình duyệt) | join `spotlight` | BL003 qua socket BL010; tải lại snapshot qua ROUTE017 |
| incoming | `pg_cron` + `pg_net` (Postgres của Supabase) | `POST /api/internal/notifications/drain`, `POST /api/internal/secret-box/tick` | BL029, BL028 gọi hai route nội bộ; chi tiết ở Background Jobs |

## Coverage Check

| Hạng mục | Số lượng | Ghi chú |
|----------|----------|---------|
| Hàng backend trong route-list | 36 | 20 route handler + 16 server action; ROUTE001–ROUTE036, mỗi hàng đúng một lần |
| Hàng có BL xử lý | 11 | ROUTE005, 006, 007, 008, 009, 010, 014, 020, 021, 023, 035 |
| Hàng `[UNMAPPED]` | 25 | 7 hàng trong đó có BL `related`: ROUTE012, 015, 016, 017, 025, 027, 028 |
| BL xuất hiện trong tài liệu | 34/34 | BL013 ở phần quy ước chung; BL010 ở Webhooks / External Calls; BL001, BL020, BL022, BL030, BL031 ở Background Jobs |
