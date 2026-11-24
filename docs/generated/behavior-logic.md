---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
# Behavior Logic

**Project**: SAA 2025 Kudos Platform
**Generated**: 2026-11-23
**Analysis Scope**: 34 mục của `## Background Logic Source Inventory` (scout, stack Next.js 16 + Supabase/Postgres, toàn bộ `[SIGNAL_INFERRED]`): `db/seeds`, `features/*/server`, `features/*/hooks`, `app/api/internal`, `app/auth`, `shared/auth`, `shared/db`, `db/migrations`

**Code Format**: All codes MUST follow `BL###_NameSlug` format (e.g., BL001_ScheduledReport, BL002_EventListener)

**Behavior Logic Types** (canonical 10 — language-neutral):
- `scheduled-job` — Cron-like scheduled tasks
- `queue-worker` — Background job workers (async queue consumers)
- `event-listener` — Event-driven handlers
- `observer` — Model lifecycle hooks (created/updated/deleted)
- `mail` — Email sending logic
- `notification` — In-app / push notification logic
- `middleware` — Request/response processing chain (non-auth)
- `custom-command` — CLI commands
- `integration` — Third-party integrations (external API clients)
- `webhook` — Incoming/outgoing webhook handlers

**Note**: Auth/permission middleware is NOT included — see Permissions.md

**Note**: Feature and UserStory mapping is managed in FeatureList.md and UserStories.md. This document contains behavior logic items without direct feature/story references.

**Note**: Notification/event/webhook entries SHOULD include `**Payload**` (the async data shape) — this is where async contracts live, since api-contracts.md covers synchronous surfaces only.

**Note**: File-exchange BL types (`queue-worker`/`custom-command`/`integration` matching import/export vocabulary — `import, export, csv, xlsx, upload, download, bulk`) SHOULD include `**File Schema**` (the internal column/header contract of the exchanged file, sourced from `validateHeader()` / schema-array / column-mapping in source code) — the column schema of an exchanged file is settled here and nowhere else; screen-spec cross-references it rather than re-deriving.

**Note**: Kiến trúc nền của stack này: không có scheduler, queue hay mailer phía Node. Lịch chạy do `pg_cron` + `pg_net` gọi Route Handler `/api/internal/*` (secret lấy từ Supabase Vault); producer ghi `domain_event_outbox` trong giao dịch nghiệp vụ, `NotificationEventProcessor` là consumer duy nhất; trigger Postgres đẩy tín hiệu Realtime lên topic Broadcast riêng. Không có BL loại `mail` và `webhook`. Bộ hẹn giờ giao diện (toast, debounce, đồng hồ) ghi ở `## Client-Side Logic`, không phải BL. `Source File` lấy đúng từ inventory; `Source Symbol` ghi ký hiệu thực trong code (`Class::method` cho phương thức) và nhãn gốc của inventory nằm ở dòng `Inventory:` đầu Description.

---

## Behavior Logic Index

BA-first summary — one row per `BL###` item, banded by **Type**. `Payload` and `File Schema` are the
two columns BAs ask about most (the async data shape and the exchanged-file contract, respectively);
both are settled here and nowhere else. Full source citations, module/route/data-model links, and the
Cardinality Contract that governs how these items are counted live in the **Dev Appendix** below.

### Type: custom-command

| Code | Name | Trigger | Payload | File Schema |
|------|------|---------|---------|--------------|
| BL001_SeedDatabaseCli | Seed Database CLI | `npm run db:seed`, cũng là bước cuối của `npm run db:reset` | — | N/A — not a file-exchange type |

### Type: event-listener

| Code | Name | Trigger | Payload | File Schema |
|------|------|---------|---------|--------------|
| BL002_NotificationChannelListener | Notification Channel Listener | NotificationBell mount; mỗi lần join, tab hiện lại, online lại | Topic `notifications:{userId}`, event `notification`, `{notificationId, type, occurredAt}` | N/A — not a file-exchange type |
| BL003_SpotlightChannelListener | Spotlight Channel Listener | SpotlightBoard mount; mỗi lần join, sự kiện kiểm duyệt, tab hiện lại | Topic `spotlight`, event `kudo`, `{type, kudoId, recipientId, recipientName, occurredAt}` | N/A — not a file-exchange type |

### Type: integration

| Code | Name | Trigger | Payload | File Schema |
|------|------|---------|---------|--------------|
| BL004_GoogleOAuthCallback | Google OAuth Callback | Supabase chuyển hướng về `GET /auth/callback` sau Google | — | N/A — not a file-exchange type |
| BL005_GoogleSignInStart | Google Sign-In Start | Gửi form đăng nhập (server action `signInWithGoogle`) | — | N/A — not a file-exchange type |
| BL006_KudoImageBrowserUpload | Kudo Image Browser Upload | Người dùng chọn ảnh trong composer Kudo | — | Ảnh jpeg/png/webp, 1 byte đến 5 MB; ticket `{path, token, signedUrl}` |
| BL007_KudoImagePreviewSigning | Kudo Image Preview Signing | Mở composer chế độ sửa (`GET /api/kudos/:id/edit`) | — | N/A — not a file-exchange type |
| BL008_KudoImageUploadSigning | Kudo Image Upload Signing | `POST /api/kudos/images/sign` | — | Ảnh jpeg/png/webp tối đa 5 MB; đường dẫn `kudos/{uuid}.{ext}` |
| BL009_KudoImageReadSigning | Kudo Image Read Signing | Dựng trang feed, highlight, chi tiết, hồ sơ | — | N/A — not a file-exchange type |
| BL010_SupabaseBrowserClient | Supabase Browser Client | Hook kênh Realtime gọi lần đầu trong tab | — | N/A — not a file-exchange type |
| BL011_SupabaseServerClient | Supabase Server Client | Mỗi request cần phiên (page, action, route handler) | — | N/A — not a file-exchange type |
| BL012_SupabaseServiceClient | Supabase Service Client | Khi server cần ký URL Storage hoặc gọi Auth admin | — | N/A — not a file-exchange type |

### Type: middleware

| Code | Name | Trigger | Payload | File Schema |
|------|------|---------|---------|--------------|
| BL013_PrelaunchGate | Prelaunch Gate | Mọi request qua `proxy.ts`, bước 5 của `runSessionProxy` | — | N/A — not a file-exchange type |

### Type: notification

| Code | Name | Trigger | Payload | File Schema |
|------|------|---------|---------|--------------|
| BL014_HeroTierUpDetection | Hero Tier-Up Detection | Xử lý sự kiện `KudoCreated` của Kudo công khai | `{tier, senderCount}` | N/A — not a file-exchange type |
| BL015_NotificationEventContextLoad | Notification Event Context Load | Mỗi sự kiện outbox, trong giao dịch của sự kiện | `{kudo, tierUp}` | N/A — not a file-exchange type |
| BL016_EventToNotificationMapping | Event To Notification Mapping | Mỗi sự kiện outbox đã qua kiểm tra schema | Danh sách `{recipientId, type, actorId, dedupeKey, params}` | N/A — not a file-exchange type |
| BL017_NotificationWrite | Notification Write | Sau khi ánh xạ xong bản nháp của một sự kiện | Dòng `notifications`: `{recipient_id, type, event_id, actor_id, dedupe_key, params, occurred_at}` | N/A — not a file-exchange type |

### Type: observer

| Code | Name | Trigger | Payload | File Schema |
|------|------|---------|---------|--------------|
| BL018_BeforeUserCreatedHook | Before User Created Hook | Supabase Auth trước khi tạo user | Vào `event.user.email`; ra `{}` hoặc lỗi 403 `domain_not_allowed` | N/A — not a file-exchange type |
| BL019_CreateSunnerProfile | Create Sunner Profile | AFTER INSERT trên `auth.users` | — | N/A — not a file-exchange type |
| BL020_RejectForeignDomainOnEmailChange | Reject Foreign Domain On Email Change | BEFORE UPDATE trên `auth.users` khi email đổi | — | N/A — not a file-exchange type |
| BL021_RejectForeignDomainOnInsert | Reject Foreign Domain On Insert | BEFORE INSERT trên `auth.users` | — | N/A — not a file-exchange type |
| BL022_SyncProfileEmail | Sync Profile Email | AFTER UPDATE OF email trên `auth.users` khi email đổi | — | N/A — not a file-exchange type |
| BL023_SpotlightPublishKudoEvent | Spotlight Publish Kudo Event | AFTER INSERT hoặc UPDATE OF status trên `kudos` | Topic `spotlight`, event `kudo`, `{type, kudoId, recipientId, recipientName, occurredAt}` | N/A — not a file-exchange type |
| BL024_NotificationsPublishSignal | Notifications Publish Signal | AFTER INSERT hoặc UPDATE OF count trên `notifications` | Topic `notifications:{recipient_id}`, event `notification`, `{notificationId, type, occurredAt}` | N/A — not a file-exchange type |

### Type: queue-worker

| Code | Name | Trigger | Payload | File Schema |
|------|------|---------|---------|--------------|
| BL025_NotificationOutboxDrainEndpoint | Notification Outbox Drain Endpoint | `POST /api/internal/notifications/drain`, pg_cron mỗi 5 giây | Trả `{processed, malformed, retrying, failed}` | N/A — not a file-exchange type |
| BL026_NotificationOutboxDrain | Notification Outbox Drain | Mỗi lần gọi endpoint drain | Đọc `domain_event_outbox`: `{event_type, payload}` | N/A — not a file-exchange type |

### Type: scheduled-job

| Code | Name | Trigger | Payload | File Schema |
|------|------|---------|---------|--------------|
| BL027_SecretBoxTickEndpoint | Secret Box Tick Endpoint | `POST /api/internal/secret-box/tick`, pg_cron mỗi phút | — | N/A — not a file-exchange type |
| BL028_SecretBoxTickCron | Secret Box Tick Cron | `cron.schedule('saa-secret-box-tick', '* * * * *')` | — | N/A — not a file-exchange type |
| BL029_NotificationsDrainCron | Notifications Drain Cron | `cron.schedule('saa-notifications-drain', '5 seconds')` | — | N/A — not a file-exchange type |
| BL030_CronHistoryPrune | Cron History Prune | `cron.schedule('saa-cron-history-prune', '15 19 * * *')`, 19:15 UTC hằng ngày | — | N/A — not a file-exchange type |
| BL031_OutboxPrune | Outbox Prune | `cron.schedule('saa-outbox-prune', '0 19 * * *')`, 19:00 UTC hằng ngày | — | N/A — not a file-exchange type |
| BL032_NationalKudosFinalize | National Kudos Finalize | Mỗi tick Secret Box, sau `NATIONAL_KUDOS_FINALIZE_AT` | — | N/A — not a file-exchange type |
| BL033_SecretBoxSweep | Secret Box Sweep | Mỗi tick Secret Box | — | N/A — not a file-exchange type |
| BL034_SecretBoxTick | Secret Box Tick | Mỗi lần gọi endpoint tick | — | N/A — not a file-exchange type |

---

## Dev Appendix

Source citations, module/route/data-model links, and the deterministic rules `validate_behavior_logic.py`
enforces. Every `BL###` heading below carries the same code as its Index row above.

### Cardinality Contract

Rules enforced by Wave 2b researcher and Wave 7a reviewer. Violations are critical.

- **Rule C1 — 1 BL per inventory entry**: Mode A stacks (folder convention): 1 file = 1 BL. Mode B stacks (annotation/decorator): 1 decorator hit = 1 BL (multiple hits in same file → multiple BL items). Aggregation is a critical violation.
- **Rule C2 — Source fields mandatory, single-valued**: Every BL item MUST include `**Source File**` (one relative path) and `**Source Symbol**` (one symbol — class name for Mode A; `ClassName::method` or `module::function` for Mode B). Multi-symbol forms forbidden in either field — split on `,`, `;`, or whitespace-bounded conjunction (` and `, ` & `, ` + `) and produce separate BL items. `/` is NOT a delimiter here (collides with composite-ref `SCR###/REG###` and path-shaped symbols); `+`/`&` require surrounding whitespace so language tokens like Swift `MyClass+Extension` and reference operators inside symbol names are not aggregated. Both fields must match the scout inventory entry 1-to-1.
- **Rule C3 — Unmatched BL warning**: A BL item whose Source File does not appear in the scout `## Background Logic Source Inventory` → warning; researcher must provide justification in Description (may be a legitimate `[SIGNAL_INFERRED]` case). Unmatched BL with no justification → critical.

Kết quả đối chiếu: inventory 34 mục (không tính hai dòng sentinel `mail` và `webhook`), tài liệu này 34 BL; mỗi mục một BL, không gộp file.

## BL001_SeedDatabaseCli

**Type**: custom-command
**Trigger**: `npm run db:seed` (`tsx db/seeds/run-seeds.ts`), cũng là bước cuối của `npm run db:reset`
**File Schema**: N/A — not a file-exchange type
**Source File**: db/seeds/run-seeds.ts
**Source Symbol**: main

### Description

Inventory: `main()` — CLI entry [SIGNAL_INFERRED] (custom-command: cổng CLI chạy ngoài vòng đời request; stack không có hàng trong bl-source-patterns). `main()` đọc `DATABASE_URL`, mở một kết nối postgres-js riêng (`max: 1`, tắt prepared statement), gọi `applyAllSeeds` rồi đóng kết nối. `applyAllSeeds` chạy trong một giao dịch duy nhất ba loader: phòng ban, hashtag, danh mục giải Secret Box; mỗi loader upsert theo khoá tự nhiên nên chạy lại nhiều lần vẫn an toàn. In số dòng mỗi bảng. Thiếu `DATABASE_URL` thì throw; lỗi đặt `process.exitCode = 1`.

### Related Modules

- `db/seeds` (departments, hashtags, secret-box-prize-loader)
- `shared/db/schema`

### Related Routes

- Không có route HTTP (chạy bằng lệnh npm)

### Related Data Models

- MODEL001_Department
- MODEL002_Hashtag
- MODEL010_SecretBoxPrize

---

## BL002_NotificationChannelListener

**Type**: event-listener
**Trigger**: NotificationBell mount (mỗi tab đúng một kênh); đồng bộ lại ở mỗi lần `SUBSCRIBED`, khi tab hiện lại và khi mạng online trở lại
**Payload**: topic Broadcast riêng `notifications:{userId}`, event `notification`; dữ liệu `{notificationId, type, occurredAt}` (chỉ id và loại, không có `params`, actor hay nội dung)
**File Schema**: N/A — not a file-exchange type
**Source File**: features/notifications/hooks/use-notification-channel.ts
**Source Symbol**: useNotificationChannel

### Description

Inventory: `useNotificationChannel` [SIGNAL_INFERRED] (event-listener: bên nhận sự kiện do server đẩy). Hook lấy access token hiện tại, gọi `supabase.realtime.setAuth(token)` rồi mới `supabase.channel(topic, { config: { private: true } }).on("broadcast", { event: "notification" })`; chạy lại `setAuth` mỗi lần `TOKEN_REFRESHED`. Payload phải qua `isNotificationSignal` mới tới `onSignal`. Vì Broadcast không phát lại sự kiện bỏ lỡ, mỗi `SUBSCRIBED` (kể cả lần đầu), tab hiện lại (`visibilitychange`) và online trở lại đều gọi `onResync` để chuông đọc lại số chưa đọc; offline đóng kênh, online mở kênh mới; unmount gỡ kênh. Tín hiệu do trigger BL024 phát; chính sách topic chỉ cho người dùng đọc topic của mình.

### Related Modules

- `features/notifications` (NotificationBell, `notification-config.ts`)
- `shared/auth/supabase-browser-client.ts` (BL010)

### Related Routes

- (GET) /api/notifications/unread-count (ROUTE012) — đọc lại số chưa đọc khi đồng bộ

### Related Data Models

- MODEL016_Notification

---

## BL003_SpotlightChannelListener

**Type**: event-listener
**Trigger**: SpotlightBoard mount; đồng bộ lại sau mỗi lần join (có jitter), 2–3 giây sau sự kiện kiểm duyệt và khi tab hiện lại
**Payload**: topic Broadcast riêng `spotlight`, event `kudo`; dữ liệu `{type: added | removed | restored, kudoId, recipientId, recipientName, occurredAt}` (không có sender, ẩn danh hay nội dung)
**File Schema**: N/A — not a file-exchange type
**Source File**: features/spotlight-board/hooks/use-spotlight-channel.ts
**Source Symbol**: useSpotlightChannel

### Description

Inventory: `useSpotlightChannel` [SIGNAL_INFERRED] (event-listener: bên nhận sự kiện do server đẩy). Cùng công thức join với BL002 (`setAuth` bằng token trước khi join, làm mới khi `TOKEN_REFRESHED`). Sự kiện qua `parseSpotlightEvent` được đưa vào reducer của bảng; `createSpotlightResync` gom yêu cầu tải lại snapshot theo kiểu trailing debounce: sau mỗi lần `SUBSCRIBED` (jitter tới 2 giây), 2 giây cộng jitter tới 1 giây sau sự kiện `removed` hoặc `restored`, và ngay khi tab hiện lại. Máy trạng thái kênh đếm thất bại; lần thứ 5 liên tiếp gỡ kênh sang trạng thái `failed` cho tới khi người dùng bấm thử lại; offline tạm dừng, online mở kênh mới.

### Related Modules

- `features/spotlight-board` (SpotlightBoard, `spotlight-resync-scheduler.ts`, `spotlight-channel-state.ts`)
- `shared/auth/supabase-browser-client.ts` (BL010)

### Related Routes

- (GET) /api/spotlight (ROUTE017) — tải lại snapshot khi đồng bộ

### Related Data Models

- MODEL003_Kudo
- MODEL004_Profile

---

## BL004_GoogleOAuthCallback

**Type**: integration
**Trigger**: Supabase chuyển hướng trình duyệt về `GET /auth/callback` với `code` (PKCE) hoặc `error`/`error_description`
**File Schema**: N/A — not a file-exchange type
**Source File**: app/auth/callback/route.ts
**Source Symbol**: GET

### Description

Inventory: `GET (OAuth code exchange)` [SIGNAL_INFERRED] (integration: nhà cung cấp danh tính bên thứ ba, Google qua Supabase Auth). Không có `code` thì suy mã lỗi từ `error_description` (`domain_not_allowed` hoặc `auth_failed`) rồi về `/login?error=`. Có `code` thì `supabase.auth.exchangeCodeForSession(code)` (dòng 25), sau đó `completeLogin`: kiểm lại tên miền email, một lệnh UPDATE đặt `last_login_at` và đặt `role = 'admin'` cho email trong `ADMIN_EMAILS` (lần đăng nhập nào cũng chạy), rồi chọn đích là trang chọn phòng ban (lần đầu) hoặc `next` đã qua `safeNextPath`. Thất bại ở bất kỳ bước nào thì `signOut({ scope: "local" })` để không giữ phiên chưa qua kiểm tra, rồi về `/login?error=`.

### Related Modules

- `features/auth` (`complete-login.ts`, `login-error-codes.ts`)
- `shared/auth` (`supabase-server-client.ts`, `safe-next-path.ts`, `public-paths.ts`)

### Related Routes

- (GET) /auth/callback (ROUTE020)

### Related Data Models

- MODEL004_Profile

---

## BL005_GoogleSignInStart

**Type**: integration
**Trigger**: gửi form đăng nhập ở `/login` (server action `signInWithGoogle`)
**File Schema**: N/A — not a file-exchange type
**Source File**: features/auth/server/sign-in-with-google-action.ts
**Source Symbol**: signInWithGoogle

### Description

Inventory: `signInWithGoogle` [SIGNAL_INFERRED] (integration: khởi động OAuth Google). Server action `"use server"` làm sạch `next` bằng `safeNextPath`, dựng `redirectTo` là `/auth/callback` (kèm `next` nếu khác `/`) từ origin của request (header `Origin`, dự phòng `x-forwarded-host`), rồi gọi `supabase.auth.signInWithOAuth({ provider: "google" })` (dòng 39) với `queryParams.hd = ALLOWED_EMAIL_DOMAIN`. Mã xác minh PKCE lưu trong cookie, trình duyệt được chuyển tới Google. `hd` chỉ thu hẹp bộ chọn tài khoản; chốt tên miền thật nằm ở trigger cơ sở dữ liệu (BL018, BL020, BL021). Supabase Auth kiểm `redirectTo` theo danh sách cho phép nên Host giả không lái được mã. Lỗi hoặc thiếu URL thì trả `{ error: "auth_failed" }`.

### Related Modules

- `features/auth` (`GoogleSignInForm`)
- `shared/auth` (`supabase-server-client.ts`, `safe-next-path.ts`)
- `shared/config/env.ts`

### Related Routes

- (POST) /login (ROUTE021)

### Related Data Models

- MODEL004_Profile

---

## BL006_KudoImageBrowserUpload

**Type**: integration
**Trigger**: người dùng chọn ảnh trong composer Kudo (mỗi tệp gọi một lần)
**File Schema**:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| file.type | string | Yes | `image/jpeg`, `image/png` hoặc `image/webp` (`KUDO_IMAGE_CONTENT_TYPES`) |
| file.size | integer (byte) | Yes | từ 1 byte đến 5 MB (`KUDO_LIMITS.IMAGE_MAX_BYTES`) |
| ticket.path | string | Yes | `kudos/{uuid}.{jpg, png hoặc webp}`, không chứa id người gửi |
| ticket.token | string | Yes | token ký cho phép đúng một lần ghi vào `path` |
| ticket.signedUrl | string | Yes | URL Storage đã ký, dựng từ URL Supabase cấu hình |

**Source File**: features/kudos-authoring/components/kudo-image-upload-client.ts
**Source Symbol**: uploadKudoImage

### Description

Inventory: `browser Storage upload` [SIGNAL_INFERRED] (integration: client lưu trữ đối tượng bên ngoài, Supabase Storage). `uploadKudoImage(file)` gọi `POST /api/kudos/images/sign` với `{contentType, size}` để lấy vé (BL008), rồi `storage().uploadToSignedUrl(ticket.path, ticket.token, file, { contentType })` (dòng 53) bằng client `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` (dòng 19) không giữ phiên (`persistSession: false`), nên không chạm cookie phiên của ứng dụng. Kiểm phía client cùng luật với endpoint và bucket (`isAcceptedKudoImage`). Không bao giờ throw: trả `{ ok: true, path }` hoặc `{ ok: false, code }` với `IMAGE_INVALID`, `UNAUTHENTICATED`, `WRITING_CLOSED`, `UPLOAD_LIMIT`, `UNEXPECTED`. Không có phần trăm tiến độ; trạng thái từng ảnh là `uploading`, `done` hoặc `error` (`use-kudo-image-uploads.ts`).

### Related Modules

- `features/kudos-authoring` (KudoImagePicker, `use-kudo-image-uploads.ts`, `kudo-authoring-limits.ts`)
- `shared/config/public-env.ts`

### Related Routes

- (POST) /api/kudos/images/sign (ROUTE010)

### Related Data Models

- MODEL007_KudoImageUpload
- MODEL006_KudoImage

---

## BL007_KudoImagePreviewSigning

**Type**: integration
**Trigger**: mở composer ở chế độ sửa: `GET /api/kudos/:id/edit` gọi `getKudoForEdit`
**File Schema**: N/A — not a file-exchange type
**Source File**: features/kudos-authoring/server/kudo-edit-query.ts
**Source Symbol**: previewUrlsByPath

### Description

Inventory: `signed preview URLs` [SIGNAL_INFERRED] (integration: client lưu trữ đối tượng bên ngoài). `previewUrlsByPath(paths)` gọi client service-role `.storage.from("kudo-images").createSignedUrls(paths, 600)` (dòng 24 đến 25) để ký URL xem trước, sống 10 phút, cho các ảnh đã gắn vào Kudo vì bucket là private. Lỗi hoặc thiếu dữ liệu chỉ ghi log và trả map rỗng: form vẫn mở, ảnh hiện placeholder. Hàm bao ngoài `getKudoForEdit` chỉ cho chủ Kudo (người khác nhận `forbidden`), Kudo spam vẫn tải cho chủ nhưng đánh dấu `locked`.

### Related Modules

- `features/kudos-authoring` (`hashtag-list-query.ts`, `use-kudo-edit-prefill.ts`)
- `features/sunner-search` (`findSunnerOptionsByIds`)
- `shared/db/supabase-service-client.ts` (BL012)

### Related Routes

- (GET) /api/kudos/:id/edit (ROUTE009)

### Related Data Models

- MODEL003_Kudo
- MODEL006_KudoImage

---

## BL008_KudoImageUploadSigning

**Type**: integration
**Trigger**: `POST /api/kudos/images/sign` (route handler gọi `signKudoImageUpload`)
**File Schema**:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| contentType | string | Yes | `image/jpeg`, `image/png` hoặc `image/webp`; phần mở rộng lưu tương ứng `jpg`, `png`, `webp` |
| size | integer (byte) | Yes | tối đa 5 MB (`KUDO_LIMITS.IMAGE_MAX_BYTES`); thân yêu cầu tối đa 4 KB |
| path | string | Yes (phản hồi) | `kudos/{uuid}.{ext}`, khớp `KUDO_IMAGE_PATH_PATTERN`, không chứa id người gửi |
| token, signedUrl | string | Yes (phản hồi) | vé ký của Supabase Storage cho đúng `path` |

**Source File**: features/kudos-authoring/server/kudo-image-upload-service.ts
**Source Symbol**: signKudoImageUpload

### Description

Inventory: `signed upload URL` [SIGNAL_INFERRED] (integration: client lưu trữ đối tượng bên ngoài). `signKudoImageUpload(uploaderId, contentType)` sinh đường dẫn `kudos/{uuid}.{ext}`, ghi dòng `kudo_image_uploads` để biết ai xin vé (trong một giao dịch có advisory lock theo người tải, từ chối khi người đó đã giữ 20 vé chưa gắn trong 24 giờ: `UPLOAD_LIMIT`), rồi gọi `getSupabaseServiceClient().storage.from("kudo-images").createSignedUploadUrl(path)` (dòng 26); nếu ký lỗi thì xoá dòng vừa ghi. URL ký dựng từ URL Supabase cấu hình, không bao giờ từ Host của request. Khi lưu Kudo, `claimKudoImageUploads` (trong giao dịch ghi) chỉ nhận đường dẫn nếu dòng xin vé đúng người gửi và đối tượng có thật trong `storage.objects`, khoá `FOR UPDATE` theo thứ tự `storage_path` để hai lần ghi tranh cùng đường dẫn không deadlock.

### Related Modules

- `features/kudos-authoring` (`kudo-write-error.ts`, `kudo-authoring-limits.ts`)
- `shared/db/supabase-service-client.ts` (BL012)

### Related Routes

- (POST) /api/kudos/images/sign (ROUTE010)
- (POST) /kudos (ROUTE023, `claimKudoImageUploads` chạy trong `createKudo`)

### Related Data Models

- MODEL007_KudoImageUpload
- MODEL006_KudoImage

---

## BL009_KudoImageReadSigning

**Type**: integration
**Trigger**: dựng trang feed, highlight, chi tiết Kudo và danh sách Kudo của hồ sơ
**File Schema**: N/A — not a file-exchange type
**Source File**: features/kudos-feed/server/kudo-image-read-urls.ts
**Source Symbol**: signKudoImageReadUrls

### Description

Inventory: `signed read URLs` [SIGNAL_INFERRED] (integration: client lưu trữ đối tượng bên ngoài). `signKudoImageReadUrls(paths)` gọi `createSignedUrls(paths, 1800)` (dòng 19) đúng một lần cho mỗi trang, không gọi theo từng thẻ, và trả map đường dẫn sang URL đọc có hạn 30 phút: đủ cho tab Live board lazy-load ảnh khi cuộn, đủ ngắn để vẫn là quyền truy cập có thời hạn chứ không phải link công khai. Lỗi hoặc thiếu dữ liệu chỉ ghi log và trả map rỗng, feed vẫn hiển thị với ảnh placeholder. Hằng số `KUDO_IMAGE_READ_URL_SECONDS` dùng chung.

### Related Modules

- `features/kudos-feed` (`kudo-public-query.ts`)
- `features/kudos-authoring/kudo-authoring-limits.ts` (tên bucket)
- `shared/db/supabase-service-client.ts` (BL012)

### Related Routes

- (GET) /api/kudos (ROUTE007)
- (GET) /api/kudos/highlight (ROUTE008)
- (GET) /api/profile/:userId/kudos (ROUTE014)

### Related Data Models

- MODEL006_KudoImage

---

## BL010_SupabaseBrowserClient

**Type**: integration
**Trigger**: hook kênh Realtime gọi `browserSupabase()` lần đầu trong tab (BL002, BL003)
**File Schema**: N/A — not a file-exchange type
**Source File**: shared/auth/supabase-browser-client.ts
**Source Symbol**: browserSupabase

### Description

Inventory: `browserSupabase` [SIGNAL_INFERRED] (integration: SDK client bên ngoài, socket Realtime của Supabase). Singleton theo từng tab, tạo bằng `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` của `@supabase/ssr`, đọc cùng cookie phiên mà proxy ghi (không httpOnly) và giữ access token luôn mới. Mọi kênh trong tab dùng chung một socket. Trang đọc dữ liệu qua Route Handler; client này chỉ join kênh, không đọc bảng. `detectSessionInUrl: false` vì việc đổi mã PKCE thuộc về `/auth/callback` phía server.

### Related Modules

- `shared/auth`
- `shared/config/public-env.ts`
- `features/notifications` và `features/spotlight-board` (hai nơi dùng)

### Related Routes

- Không có route HTTP (chỉ mở kênh Realtime)

### Related Data Models

- MODEL016_Notification

---

## BL011_SupabaseServerClient

**Type**: integration
**Trigger**: mỗi request cần phiên (Server Component, Server Action, Route Handler)
**File Schema**: N/A — not a file-exchange type
**Source File**: shared/auth/supabase-server-client.ts
**Source Symbol**: createSupabaseServerClient

### Description

Inventory: `createSupabaseServerClient` [SIGNAL_INFERRED] (integration: SDK client bên ngoài, Supabase Auth gắn cookie và chịu RLS). Mỗi request tạo một client mới (không dùng chung) bằng `createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies })` (`cookies()` của Next). Dùng khoá anon công khai nên chỉ làm được những gì người dùng đang đăng nhập được phép (RLS). Server Component không ghi được cookie nên `setAll` bọc trong try/catch: proxy đã làm mới phiên cho request này và sẽ ghi token mới ở request sau. Proxy dùng bộ chuyển cookie request/response riêng trong `session-proxy.ts`.

### Related Modules

- `shared/auth` (`current-user.ts`, `sign-out-action.ts`)
- `features/auth`

### Related Routes

- (GET) /auth/callback (ROUTE020)
- (POST) /login (ROUTE021)
- (POST) /, /awards, /community-standards, /kudos, /kudos/:id, /notifications, /profile, /profile/:userId, /rules, /admin/overview, /admin/review, /admin/settings, /admin/users (ROUTE035, `signOut`)

### Related Data Models

- MODEL004_Profile

---

## BL012_SupabaseServiceClient

**Type**: integration
**Trigger**: khi server cần ký URL Storage hoặc gọi Auth admin (BL007, BL008, BL009)
**File Schema**: N/A — not a file-exchange type
**Source File**: shared/db/supabase-service-client.ts
**Source Symbol**: getSupabaseServiceClient

### Description

Inventory: `getSupabaseServiceClient` [SIGNAL_INFERRED] (integration: SDK client bên ngoài, vai trò service role). Singleton `createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` không giữ phiên (`persistSession: false`, `autoRefreshToken: false`). Client này bỏ qua RLS nên chỉ dùng cho việc tin cậy phía server (URL ký của Storage, lệnh Auth admin); khoá và kết quả thô không bao giờ ra trình duyệt. Client gắn phiên người dùng nằm ở BL011.

### Related Modules

- `shared/db`
- `shared/config/env.ts`
- `features/kudos-authoring` và `features/kudos-feed` (nơi gọi)

### Related Routes

- (POST) /api/kudos/images/sign (ROUTE010)
- (GET) /api/kudos/:id/edit (ROUTE009)
- (GET) /api/kudos (ROUTE007)

### Related Data Models

- MODEL006_KudoImage

---

## BL013_PrelaunchGate

**Type**: middleware
**Trigger**: mọi request đi qua `proxy.ts`; là bước 5 của `runSessionProxy` (sau làm mới phiên, danh sách công khai, chuyển khách về `/login` và chặn admin)
**File Schema**: N/A — not a file-exchange type
**Source File**: features/awards-portal/server/prelaunch-gate-step.ts
**Source Symbol**: prelaunchGateStep

### Description

Inventory: `prelaunchGateStep` [SIGNAL_INFERRED] (middleware: bước trong chuỗi request không thuộc xác thực; `proxy.ts` của Next 16 thay middleware). So giờ máy chủ `Date.now()` với `LAUNCH_AT` ở mọi request (BR-002, không lưu trạng thái) qua `decidePrelaunchRoute`: sau `LAUNCH_AT` chỉ còn luật `/countdown` → `/` cho tải trang; trước `LAUNCH_AT`, đường dẫn công khai đi qua, admin đi qua (vai trò đọc từ DB, lỗi đọc coi như không phải admin), còn lại tải trang bị chuyển `/countdown`, Server Action hoặc `/api/*` nhận JSON 403 `{ code: "prelaunch" }` (chuyển hướng 307 sẽ làm fetch gửi lại POST tới `/countdown`). Các bước 2 đến 4b của proxy (làm mới phiên, chuyển khách, chặn admin) thuộc xác thực nên ghi ở Permissions và ScreenFlow (GUARD-001 đến GUARD-003), không phải BL.

### Related Modules

- `features/awards-portal/server` (`prelaunch-gate.ts`)
- `shared/auth` (`session-proxy.ts`, `public-paths.ts`)
- `shared/config/env.ts`

### Related Routes

- Áp dụng cho mọi route qua proxy, gồm cả nhóm `/api/*` (trả JSON 403) và trang (chuyển `/countdown`)

### Related Data Models

- MODEL004_Profile

---

## BL014_HeroTierUpDetection

**Type**: notification
**Trigger**: `NotificationEventContext::load` gọi khi xử lý sự kiện `KudoCreated` của Kudo công khai
**Payload**: kết quả `{tier, senderCount}` hoặc `null`; trở thành `params` của thông báo `hero_tier_up`
**File Schema**: N/A — not a file-exchange type
**Source File**: features/notifications/server/detect-hero-tier-up.ts
**Source Symbol**: detectHeroTierUp

### Description

Inventory: `detectHeroTierUp` [SIGNAL_INFERRED] (notification: quyết định thông báo trong app `hero_tier_up`, ALG-002). Hàm thuần: `after = tierFromCount(senderCount)` với `senderCount` là số người gửi công khai khác nhau của người nhận, đọc trong giao dịch của sự kiện (đã tính cả Kudo mới); `before` là bậc cao nhất người nhận đã được báo (khoá khử trùng của thông báo `hero_tier_up`), không phải số đếm "ngay trước Kudo", nên đúng cả khi sự kiện được xử lý trễ, dồn hay đảo thứ tự. Chỉ nợ thông báo khi `after` cao hơn `before`; vượt nhiều ngưỡng thì báo bậc đạt được. Bậc bị tụt do spam không kích hoạt lại bậc cũ. Chỉ số duy nhất một phần `(recipient_id, dedupe_key)` chặn hai consumer chạy song song.

### Related Modules

- `features/notifications/server`
- `features/hero-badges` (`HERO_TIERS`, `tierFromCount`)

### Related Routes

- Không có route HTTP (chạy trong consumer BL026)

### Related Data Models

- MODEL016_Notification
- MODEL003_Kudo

---

## BL015_NotificationEventContextLoad

**Type**: notification
**Trigger**: mỗi sự kiện outbox, gọi bởi `NotificationEventProcessor::drain` bên trong giao dịch của sự kiện
**Payload**: `{kudo: {id, senderId, recipientId, isAnonymous, isPublic} | null, tierUp: {tier, senderCount} | null}`
**File Schema**: N/A — not a file-exchange type
**Source File**: features/notifications/server/load-notification-event-context.ts
**Source Symbol**: NotificationEventContext::load

### Description

Inventory: `NotificationEventContext.load` [SIGNAL_INFERRED] (notification: nạp dữ kiện làm đầu vào cho việc phát thông báo). Với `KudoCreated` và `HeartAdded`, đọc lại trong cùng giao dịch người gửi, người nhận, cờ ẩn danh và trạng thái hiện tại của Kudo (kiểm lại FR-408, vì Kudo có thể đã bị đánh dấu spam từ lúc phát sự kiện). Với `KudoCreated` của Kudo công khai không tự gửi cho mình, gọi tiếp `HeroTierQuery.getDistinctSenderCounts` cùng các bậc người nhận đã được báo rồi chuyển cho BL014. Các loại sự kiện khác không cần ngữ cảnh vì payload đã mang người nhận.

### Related Modules

- `features/notifications/server`
- `features/hero-badges` (`HeroTierQuery`)
- `shared/events/domain-event-types.ts`

### Related Routes

- Không có route HTTP (chạy trong consumer BL026)

### Related Data Models

- MODEL003_Kudo
- MODEL016_Notification
- MODEL015_DomainEventOutbox

---

## BL016_EventToNotificationMapping

**Type**: notification
**Trigger**: mỗi sự kiện outbox đã qua `domainEventSchema`, gọi từ `NotificationEventProcessor::drain`
**Payload**: danh sách bản nháp `{recipientId, type, actorId, dedupeKey, params}`; `params` chỉ chứa id và giá trị, không bao giờ có id hay tên người gửi (BR-006)
**File Schema**: N/A — not a file-exchange type
**Source File**: features/notifications/server/map-event-to-notifications.ts
**Source Symbol**: mapEventToNotifications

### Description

Inventory: `mapEventToNotifications` [SIGNAL_INFERRED] (notification: ánh xạ mỗi sự kiện miền thành thông báo trong app, ALG-001). Hàm thuần, kết quả chỉ phụ thuộc sự kiện và ngữ cảnh đọc cùng giao dịch. Ánh xạ: `KudoCreated` → `kudo_received` cho người nhận (người gửi ẩn danh không làm actor), thêm `hero_tier_up` nếu có bậc mới; `HeartAdded` → `heart_received` cho chủ Kudo, không actor, gộp theo Kudo trong lúc chưa đọc; `KudoMarkedSpam` → `kudo_hidden_spam` cho chủ Kudo (luôn nợ, kể cả khi đã Un Spam; Un Spam không gửi gì); `BoxGranted` → `secret_box_granted`; `SetCompleted` → `icon_set_completed`; `NationalKudosFinalized` → `national_kudos` cho từng người gửi, `params` giữ `{kudoId, rank}`. Kudo không công khai hoặc tự gửi cho mình thì không phát thông báo.

### Related Modules

- `features/notifications/server`
- `shared/events/domain-event-types.ts`

### Related Routes

- Không có route HTTP (chạy trong consumer BL026)

### Related Data Models

- MODEL016_Notification
- MODEL015_DomainEventOutbox

---

## BL017_NotificationWrite

**Type**: notification
**Trigger**: sau khi ánh xạ xong bản nháp của một sự kiện, trong cùng giao dịch của consumer
**Payload**: dòng ghi vào `notifications`: `{recipient_id, type, event_id, actor_id, dedupe_key, params, occurred_at}`
**File Schema**: N/A — not a file-exchange type
**Source File**: features/notifications/server/notification-writer.ts
**Source Symbol**: NotificationWriter::write

### Description

Inventory: `NotificationWriter.write` [SIGNAL_INFERRED] (notification: lưu thông báo trong app, và việc ghi này kích hoạt tín hiệu realtime). Mỗi bản nháp là một `INSERT … SELECT … FROM profiles` với `occurred_at` của sự kiện (BR-009: thời điểm của sự kiện, không phải lúc drain); người nhận đã bị xoá khỏi `profiles` thì bị bỏ qua nên một tài khoản đã xoá không biến sự kiện thành vòng lặp thử lại. `heart_received` upsert dòng chưa đọc của người nhận cho Kudo đó qua chỉ số duy nhất một phần: `count + 1`, `occurred_at` chỉ tiến lên; các loại khác dùng `ON CONFLICT DO NOTHING` trên mọi khoá duy nhất, `(event_id, recipient_id, type)` chống giao lại một sự kiện và `(recipient_id, dedupe_key)` chống báo lại một bậc. Cả INSERT lẫn UPDATE OF count đều kích hoạt trigger BL024.

### Related Modules

- `features/notifications/server`
- `shared/db/client.ts`

### Related Routes

- Không có route HTTP (chạy trong consumer BL026)

### Related Data Models

- MODEL016_Notification
- MODEL004_Profile
- MODEL015_DomainEventOutbox

---

## BL018_BeforeUserCreatedHook

**Type**: observer
**Trigger**: hook `before_user_created` của Supabase Auth, chạy trước khi tạo bản ghi user (nối trong `supabase/config.toml` bằng `pg-functions://postgres/public/before_user_created_hook`)
**Payload**: vào `event.user.email`; ra `{}` khi hợp lệ hoặc `{error: {http_code: 403, message: "domain_not_allowed"}}`
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0005_auth_user_triggers.sql
**Source Symbol**: before_user_created_hook

### Description

Inventory: `before_user_created_hook` [SIGNAL_INFERRED] (observer: hook vòng đời trước khi tạo user). `CREATE FUNCTION public.before_user_created_hook(event jsonb) RETURNS jsonb` (dòng 25) gọi `is_sunner_email()` (khớp `^[^@\s]+@sun-asterisk\.com$` với `COLLATE "C"` để ký tự giống chữ như dấu Kelvin không bị gấp thành `k`). Sai tên miền thì trả lỗi 403 với thông báo `domain_not_allowed`, thông báo này tới `/auth/callback` qua `error_description` để hiện đúng banner. Môi trường hosted phải bật cùng hook trong dashboard; nếu thiếu thì lớp trigger BL020 và BL021 vẫn chặn nhưng chỉ hiện lỗi chung `auth_failed`. Tên miền được ghi cứng trong `is_sunner_email()` và phải khớp `ALLOWED_EMAIL_DOMAIN`. Đây cũng là quy tắc phân quyền (xem Permissions). EXECUTE bị thu hồi khỏi vai trò client, chỉ `supabase_auth_admin` được gọi.

### Related Modules

- `db/migrations` (`0005_auth_user_triggers.sql`)
- `supabase/config.toml` (đoạn `[auth.hook.before_user_created]`)
- `features/auth/login-error-codes.ts`

### Related Routes

- (GET) /auth/callback (ROUTE020) — nhận `error_description`

### Related Data Models

- MODEL004_Profile

---

## BL019_CreateSunnerProfile

**Type**: observer
**Trigger**: `AFTER INSERT ON auth.users FOR EACH ROW` (trigger `create_sunner_profile`)
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0005_auth_user_triggers.sql
**Source Symbol**: create_sunner_profile

### Description

Inventory: `create_sunner_profile` [SIGNAL_INFERRED] (observer: hook vòng đời khi bản ghi được tạo). `CREATE TRIGGER create_sunner_profile AFTER INSERT ON auth.users … EXECUTE FUNCTION public.create_sunner_profile()` (dòng 90). Hàm `SECURITY DEFINER` chỉ chạy ở lần đăng nhập đầu: tạo dòng `profiles` với `id` của user, email viết thường, `full_name` lấy lần lượt từ metadata `full_name`, `name` rồi phần trước `@` của email, `avatar_url` từ `avatar_url` hoặc `picture`. `ON CONFLICT (id) DO NOTHING` giữ việc chèn idempotent; metadata Google đổi về sau không cập nhật profile.

### Related Modules

- `db/migrations` (`0005_auth_user_triggers.sql`)
- `shared/db/schema/profiles.ts`

### Related Routes

- (GET) /auth/callback (ROUTE020) — lần đăng nhập đầu kích hoạt trigger này

### Related Data Models

- MODEL004_Profile

---

## BL020_RejectForeignDomainOnEmailChange

**Type**: observer
**Trigger**: `BEFORE UPDATE ON auth.users FOR EACH ROW WHEN (NEW.email IS DISTINCT FROM OLD.email)` (trigger `reject_foreign_domain_on_email_change`)
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0005_auth_user_triggers.sql
**Source Symbol**: reject_foreign_domain_on_email_change

### Description

Inventory: `reject_foreign_domain_on_email_change` [SIGNAL_INFERRED] (observer: hook vòng đời trước khi cập nhật). `CREATE TRIGGER reject_foreign_domain_on_email_change BEFORE UPDATE ON auth.users … EXECUTE FUNCTION public.reject_foreign_domain()` (dòng 85) với điều kiện `WHEN` chỉ cho email thực sự đổi (không dùng `OF email`, nên email đổi bằng đường nào cũng bị kiểm). Hàm `reject_foreign_domain()` ném `domain_not_allowed` (ERRCODE `P0001`) khi `is_sunner_email(NEW.email)` sai. UPDATE giữ nguyên email (GoTrue ghi lại mọi cột lúc đăng nhập) không bị kiểm lại, nhờ đó tài khoản có trước cổng này (tạo từ dashboard, user điện thoại không email) không bị khoá. Là quy tắc phân quyền cùng BL018 (xem Permissions).

### Related Modules

- `db/migrations` (`0005_auth_user_triggers.sql`)

### Related Routes

- Không có route HTTP (chạy trong Supabase Auth khi email đổi)

### Related Data Models

- MODEL004_Profile

---

## BL021_RejectForeignDomainOnInsert

**Type**: observer
**Trigger**: `BEFORE INSERT ON auth.users FOR EACH ROW` (trigger `reject_foreign_domain_on_insert`)
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0005_auth_user_triggers.sql
**Source Symbol**: reject_foreign_domain_on_insert

### Description

Inventory: `reject_foreign_domain_on_insert` [SIGNAL_INFERRED] (observer: hook vòng đời trước khi tạo). `CREATE TRIGGER reject_foreign_domain_on_insert BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.reject_foreign_domain()` (dòng 80). Là chốt chặn cuối cho mọi đường ghi vào `auth.users`: nếu hook BL018 chưa được cấu hình thì việc chèn vẫn thất bại đóng, người dùng chỉ thấy lỗi chung `auth_failed` thay vì thông báo riêng. Là quy tắc phân quyền cùng BL018 (xem Permissions).

### Related Modules

- `db/migrations` (`0005_auth_user_triggers.sql`)

### Related Routes

- (GET) /auth/callback (ROUTE020) — lỗi chèn user hiện thành `auth_failed`

### Related Data Models

- MODEL004_Profile

---

## BL022_SyncProfileEmail

**Type**: observer
**Trigger**: `AFTER UPDATE OF email ON auth.users FOR EACH ROW WHEN (NEW.email IS DISTINCT FROM OLD.email)` (trigger `sync_profile_email`)
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0005_auth_user_triggers.sql
**Source Symbol**: sync_profile_email

### Description

Inventory: `sync_profile_email` [SIGNAL_INFERRED] (observer: hook vòng đời sau khi cập nhật). `CREATE TRIGGER sync_profile_email AFTER UPDATE OF email ON auth.users … EXECUTE FUNCTION public.sync_profile_email()` (dòng 94). Hàm `SECURITY DEFINER` chép email mới (viết thường) sang `profiles.email` của cùng `id`, để bản sao không cũ đi: bản sao cũ sẽ làm lần đăng ký sau bằng địa chỉ cũ vướng ràng buộc `profiles_email_unique` ("Database error saving new user").

### Related Modules

- `db/migrations` (`0005_auth_user_triggers.sql`)

### Related Routes

- Không có route HTTP (chạy trong Supabase Auth khi email đổi)

### Related Data Models

- MODEL004_Profile

---

## BL023_SpotlightPublishKudoEvent

**Type**: observer
**Trigger**: `AFTER INSERT OR UPDATE OF status ON public.kudos FOR EACH ROW` (trigger `spotlight_publish_kudo_event`)
**Payload**: topic Broadcast riêng `spotlight`, event `kudo`; `{type: added | removed | restored, kudoId, recipientId, recipientName, occurredAt}` dựng từng trường, không có `sender_id`, `is_anonymous`, `anonymous_nickname` hay nội dung
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0017_spotlight_realtime.sql
**Source Symbol**: spotlight_publish_kudo_event

### Description

Inventory: `spotlight_publish_kudo_event` [SIGNAL_INFERRED] (observer: hook vòng đời phát sự kiện realtime). `CREATE TRIGGER spotlight_publish_kudo_event AFTER INSERT OR UPDATE OF status ON public.kudos` (dòng 69). Chọn loại: INSERT với `status = 'public'` → `added` (Kudo chèn thẳng là spam thì không gửi gì); UPDATE public → spam → `removed`; spam → public → `restored` (chỉ đổi bộ đếm, client không thêm dòng ticker); còn lại không làm gì. Hàm `SECURITY DEFINER` gọi `realtime.send(…, 'kudo', 'spotlight', true)` (không dùng `realtime.broadcast_changes` vì nó chở cả dòng); tín hiệu là một dòng `realtime.messages` trong giao dịch ghi Kudo nên rollback thì không phát. Mọi lỗi (thiếu profile, vấn đề quyền Realtime) chỉ `RAISE LOG` và giao dịch ghi Kudo vẫn commit; bảng tự đồng bộ lại bằng `GET /api/spotlight` ở lần tải hoặc kết nối lại sau. Một chính sách `SELECT` trên `realtime.messages` cho vai trò `authenticated` và không có chính sách ghi nên client không giả mạo được sự kiện.

### Related Modules

- `db/migrations` (`0017_spotlight_realtime.sql`)
- `features/spotlight-board` (`spotlight-config.ts`: `SPOTLIGHT_TOPIC`, `SPOTLIGHT_EVENT`)

### Related Routes

- (GET) /api/spotlight (ROUTE017)
- (POST) /kudos (ROUTE023, ghi Kudo kích hoạt trigger)
- (POST) /admin/review (ROUTE027, ROUTE028, đổi trạng thái spam kích hoạt trigger)

### Related Data Models

- MODEL003_Kudo
- MODEL004_Profile

---

## BL024_NotificationsPublishSignal

**Type**: observer
**Trigger**: `AFTER INSERT OR UPDATE OF count ON public.notifications FOR EACH ROW` (trigger `notifications_publish_signal`)
**Payload**: topic Broadcast riêng `notifications:{recipient_id}`, event `notification`; `{notificationId, type, occurredAt}`, không có `params`, actor hay nội dung
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0019_notifications_realtime.sql
**Source Symbol**: notifications_publish_signal

### Description

Inventory: `notifications_publish_signal` [SIGNAL_INFERRED] (observer: hook vòng đời phát tín hiệu realtime). `CREATE TRIGGER notifications_publish_signal AFTER INSERT OR UPDATE OF count ON public.notifications` (dòng 46). Một dòng mới, hoặc dòng tim chưa đọc vừa được consumer tăng `count` (BR-004), gửi đúng một tín hiệu không mang nội dung tới topic riêng của người nhận qua `realtime.send(…, 'notification', 'notifications:' || recipient_id, true)`. Đánh dấu đã đọc (`UPDATE OF read_at`) không kích hoạt. Tín hiệu nằm trong giao dịch của consumer nên sự kiện rollback thì không phát; lỗi chỉ `RAISE LOG` và việc ghi thông báo vẫn commit, chuông đồng bộ lại bằng `GET /api/notifications/unread-count` khi kết nối lại hoặc tab hiện lại. Chính sách `SELECT` trên `realtime.messages` yêu cầu cả topic của lần join lẫn topic của dòng bằng `'notifications:' || auth.uid()`, không có chính sách ghi.

### Related Modules

- `db/migrations` (`0019_notifications_realtime.sql`)
- `features/notifications` (`notification-config.ts`: `NOTIFICATION_TOPIC_PREFIX`, `NOTIFICATION_SIGNAL_EVENT`)

### Related Routes

- (GET) /api/notifications/unread-count (ROUTE012)
- (POST) /api/internal/notifications/drain (ROUTE005, consumer ghi thông báo kích hoạt trigger)

### Related Data Models

- MODEL016_Notification

---

## BL025_NotificationOutboxDrainEndpoint

**Type**: queue-worker
**Trigger**: `POST /api/internal/notifications/drain`, do pg_cron job `saa-notifications-drain` gọi mỗi 5 giây qua pg_net, hoặc cron máy chủ
**Payload**: phản hồi 200 `{processed, malformed, retrying, failed}`; lỗi `{code: "not_configured"}` (503), `{code: "unauthorized"}` (401), `{code: "unexpected"}` (500); luôn `Cache-Control: no-store`
**File Schema**: N/A — not a file-exchange type
**Source File**: app/api/internal/notifications/drain/route.ts
**Source Symbol**: POST

### Description

Inventory: `POST` [SIGNAL_INFERRED] (queue-worker: điểm kích hoạt của consumer outbox bất đồng bộ). Không có phiên: đường dẫn nằm trong danh sách công khai chính xác của proxy, tự bảo vệ bằng header `x-drain-secret` (`checkOutboxDrainSecret`, so SHA-256 bằng `timingSafeEqual`): chưa đặt `OUTBOX_DRAIN_SECRET` thì 503 `not_configured`, sai secret thì 401. Đúng thì `return json(await NotificationEventProcessor.drain())` (dòng 21). Drain idempotent và an toàn khi chạy chồng, nên gọi lại hay gọi song song đều vô hại; không khởi chạy được thì 500 `unexpected`. Trước `LAUNCH_AT` việc drain vẫn vô hại nên cổng prelaunch cho qua.

### Related Modules

- `features/notifications/server` (`outbox-drain-guard.ts`, `notification-event-processor.ts`)
- `shared/auth/public-paths.ts`

### Related Routes

- (POST) /api/internal/notifications/drain (ROUTE005)

### Related Data Models

- MODEL015_DomainEventOutbox

---

## BL026_NotificationOutboxDrain

**Type**: queue-worker
**Trigger**: mỗi lần BL025 gọi `drain()` (lô tối đa `OUTBOX_BATCH_SIZE` = 50 sự kiện, sự kiện cũ nhất trước)
**Payload**: đọc `domain_event_outbox` `{event_type, payload}` (sáu loại: `KudoCreated`, `HeartAdded`, `KudoMarkedSpam`, `BoxGranted`, `SetCompleted`, `NationalKudosFinalized`); kết quả `{processed, malformed, retrying, failed}`
**File Schema**: N/A — not a file-exchange type
**Source File**: features/notifications/server/notification-event-processor.ts
**Source Symbol**: NotificationEventProcessor::drain

### Description

Inventory: `NotificationEventProcessor.drain` [SIGNAL_INFERRED] (queue-worker: consumer của hàng đợi outbox giao dịch). Là nơi duy nhất ghi `domain_event_outbox.consumed_at`. Idempotent nhiều lớp: (1) lấy id các sự kiện còn chờ và đã đến hạn (`consumed_at is null and failed_at is null and (next_attempt_at is null or next_attempt_at <= now())`), không khoá; (2) mỗi sự kiện chạy trong giao dịch riêng đọc lại dòng bằng `FOR UPDATE SKIP LOCKED`, consumer khác đang giữ thì bỏ qua; (3) thông báo và `consumed_at` được ghi trong cùng giao dịch (hoặc cả hai hoặc không); (4) `UNIQUE(event_id, recipient_id, type)` là chốt cuối. Payload sai schema hay loại lạ bị đánh dấu đã xử lý kèm dòng log `malformed`. Sự kiện lỗi rollback riêng, tăng `attempts` và lùi `next_attempt_at` theo luỹ thừa (60 giây × 2^(lần-1): 1, 2, 4, 8 phút); đủ `OUTBOX_MAX_ATTEMPTS` = 5 thì treo bằng `failed_at`, không thử lại và có log để cảnh báo. Có câu SQL phát lại thủ công cho sự kiện đã treo (ghi trong chú thích đầu file). Luồng chính: `consume` → BL015 → BL016 → BL017. Producer ghi sự kiện bằng `DomainEventOutbox.add(tx, type, payload)` trong giao dịch nghiệp vụ (`create-kudo-action.ts`, `kudo-heart-service.ts`, `kudo-moderation-service.ts`, `secret-box-grant-service.ts`, `icon-collection-service.ts`, `national-kudos-finalize-job.ts`); hàm producer đó không có loại BL riêng nên được ghi ở đây.

### Related Modules

- `features/notifications/server`
- `shared/events` (`domain-event-outbox.ts`, `domain-event-types.ts`)
- `shared/db/client.ts`

### Related Routes

- (POST) /api/internal/notifications/drain (ROUTE005)

### Related Data Models

- MODEL015_DomainEventOutbox
- MODEL016_Notification

---

## BL027_SecretBoxTickEndpoint

**Type**: scheduled-job
**Trigger**: `POST /api/internal/secret-box/tick`, do pg_cron job `saa-secret-box-tick` gọi mỗi phút qua pg_net, hoặc cron máy chủ
**File Schema**: N/A — not a file-exchange type
**Source File**: app/api/internal/secret-box/tick/route.ts
**Source Symbol**: POST

### Description

Inventory: `POST` [SIGNAL_INFERRED] (scheduled-job: điểm vào HTTP của job chạy theo cron). Không có phiên; bảo vệ bằng header `x-job-secret` (`checkInternalJobSecret`, SHA-256 + `timingSafeEqual`): chưa đặt `INTERNAL_JOB_SECRET` thì 503 `not_configured`, sai secret thì 401. Đúng thì gọi `SecretBoxTickJob.run(new Date())`: tick khác đang chạy trả 200 `{ skipped: true }`; thành công trả 200 `{ sweep: {senders, granted, failed, deferred}, nationalKudos: {status, count} }`; một job lỗi (job còn lại vẫn đã chạy) hoặc tick không khởi chạy được trả 500 `unexpected`. Cả hai job đều idempotent nên tick gọi lại vô hại; luôn `Cache-Control: no-store`.

### Related Modules

- `features/secret-box-rewards/server` (`internal-job-guard.ts`, `secret-box-tick-job.ts`)
- `shared/auth/public-paths.ts`

### Related Routes

- (POST) /api/internal/secret-box/tick (ROUTE006)

### Related Data Models

- MODEL011_SecretBox
- MODEL014_NationalKudo

---

## BL028_SecretBoxTickCron

**Type**: scheduled-job
**Trigger**: `cron.schedule('saa-secret-box-tick', '* * * * *', …)`, mỗi phút
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0016_secret_box_tick_cron.sql
**Source Symbol**: saa-secret-box-tick

### Description

Inventory: `saa-secret-box-tick` [SIGNAL_INFERRED] (scheduled-job: đăng ký cron). Migration chạy trong khối `DO` và `PERFORM cron.schedule('saa-secret-box-tick', '* * * * *', …)` với thân là `net.http_post` tới URL lấy từ Supabase Vault (`saa_secret_box_tick_url`) kèm header `x-job-secret` lấy từ Vault (`saa_internal_job_secret`), `timeout_milliseconds` 30000, chỉ gửi khi cả hai secret có trong Vault. Thiếu `pg_cron`, `pg_net` (có và được preload) hoặc Vault thì migration chỉ in `NOTICE` và không đổi gì, để các migration sau vẫn áp dụng được; môi trường đó phải dùng cron máy chủ POST cùng endpoint mỗi phút. `cron.schedule` theo tên là upsert nên chạy lại an toàn. Tick lỡ chỉ làm thông báo trễ vì mọi đường đọc tự đối soát hộp. Có file `.down.sql` để rollback.

### Related Modules

- `db/migrations` (`0016_secret_box_tick_cron.sql`, `0016_secret_box_tick_cron.down.sql`)
- `features/secret-box-rewards/server`

### Related Routes

- (POST) /api/internal/secret-box/tick (ROUTE006)

### Related Data Models

- MODEL011_SecretBox

---

## BL029_NotificationsDrainCron

**Type**: scheduled-job
**Trigger**: `cron.schedule('saa-notifications-drain', '5 seconds', …)`, mỗi 5 giây
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0020_notifications_drain_cron.sql
**Source Symbol**: saa-notifications-drain

### Description

Inventory: `saa-notifications-drain` [SIGNAL_INFERRED] (scheduled-job: đăng ký cron). `PERFORM cron.schedule('saa-notifications-drain', '5 seconds', …)` với `net.http_post` tới URL trong Vault (`saa_notifications_drain_url`) và header `x-drain-secret` từ Vault (`saa_outbox_drain_secret`); một cơ chế vừa kích hoạt vừa quét để thông báo tới "trong vài giây" (FR-402). Khả năng chạy chồng an toàn nhờ khoá từng dòng cùng `SKIP LOCKED` trong BL026. Thiếu `pg_cron`, `pg_net` hoặc Vault thì chỉ in `NOTICE` và dùng cron máy chủ (ví dụ mỗi phút). Mỗi lần chạy thêm một dòng vào `cron.job_run_details` (khoảng 17 nghìn dòng mỗi ngày), được BL030 dọn. Upsert theo tên; có `.down.sql`.

### Related Modules

- `db/migrations` (`0020_notifications_drain_cron.sql`, `0020_notifications_drain_cron.down.sql`)
- `features/notifications/server`

### Related Routes

- (POST) /api/internal/notifications/drain (ROUTE005)

### Related Data Models

- MODEL015_DomainEventOutbox

---

## BL030_CronHistoryPrune

**Type**: scheduled-job
**Trigger**: `cron.schedule('saa-cron-history-prune', '15 19 * * *', …)`, 19:15 UTC (02:15 ICT) hằng ngày
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0023_housekeeping_outbox_and_cron_history_prune.sql
**Source Symbol**: saa-cron-history-prune

### Description

Inventory: `saa-cron-history-prune` [SIGNAL_INFERRED] (scheduled-job: job dọn dẹp định kỳ). `DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'` (dòng 36) giữ bảng lịch sử cron có giới hạn (riêng job drain 5 giây đã thêm khoảng 17 nghìn dòng mỗi ngày). pg_cron chạy mỗi job bằng vai trò đã lên lịch (vai trò migration) và RLS của `cron.job_run_details` giới hạn theo `username = current_user`, nên chỉ dọn được lịch sử của các job `saa-*`; job của vai trò khác giữ nguyên. Thiếu `pg_cron` thì migration chỉ in `NOTICE` (dùng cron máy chủ chạy cùng câu DELETE). Upsert theo tên; có `.down.sql`.

### Related Modules

- `db/migrations` (`0023_housekeeping_outbox_and_cron_history_prune.sql`)

### Related Routes

- Không có route HTTP (chạy hoàn toàn trong Postgres)

### Related Data Models

- Không có bảng nghiệp vụ (xoá lịch sử của schema `cron`, không phải bảng của ứng dụng)

---

## BL031_OutboxPrune

**Type**: scheduled-job
**Trigger**: `cron.schedule('saa-outbox-prune', '0 19 * * *', …)`, 19:00 UTC (02:00 ICT) hằng ngày
**File Schema**: N/A — not a file-exchange type
**Source File**: db/migrations/0023_housekeeping_outbox_and_cron_history_prune.sql
**Source Symbol**: saa-outbox-prune

### Description

Inventory: `saa-outbox-prune` [SIGNAL_INFERRED] (scheduled-job: job dọn dẹp định kỳ). `DELETE FROM public.domain_event_outbox WHERE consumed_at IS NOT NULL AND consumed_at < now() - interval '30 days'` (dòng 32). Điều kiện `consumed_at IS NOT NULL` bảo đảm sự kiện đang chờ và sự kiện bị treo (`failed_at` có giá trị, chờ phát lại thủ công) không bao giờ bị xoá dù cũ đến đâu. Người đọc outbox duy nhất là BL026 và nó chỉ đọc dòng đang chờ, producer chỉ chèn; Kudos Quốc Dân "chạy một lần" được bảo vệ bằng bảng riêng, Spotlight dùng trigger chứ không dùng outbox. `notifications.event_id` là `ON DELETE SET NULL` nên lịch sử thông báo còn nguyên với `event_id` null và không phát tín hiệu realtime (trigger chỉ theo `UPDATE OF count`). Giữ 30 ngày để xem lại sự cố, kể cả sự kiện malformed (cột `last_error`). Không có chỉ mục trên `consumed_at` và không chia lô; nên xem lại khi outbox vượt khoảng 1 triệu dòng.

### Related Modules

- `db/migrations` (`0023_housekeeping_outbox_and_cron_history_prune.sql`)
- `shared/events` (producer của outbox)

### Related Routes

- Không có route HTTP (chạy hoàn toàn trong Postgres)

### Related Data Models

- MODEL015_DomainEventOutbox
- MODEL016_Notification

---

## BL032_NationalKudosFinalize

**Type**: scheduled-job
**Trigger**: mỗi tick Secret Box (BL034), sau `NATIONAL_KUDOS_FINALIZE_AT`
**File Schema**: N/A — not a file-exchange type
**Source File**: features/secret-box-rewards/server/national-kudos-finalize-job.ts
**Source Symbol**: NationalKudosFinalizeJob::run

### Description

Inventory: `NationalKudosFinalizeJob.run` [SIGNAL_INFERRED] (scheduled-job: job một lần chạy theo thời gian trong tick). Trước `NATIONAL_KUDOS_FINALIZE_AT`: không làm gì (`not_due`). Sau đó: chỉ một lần. Xếp hạng `NATIONAL_KUDOS_COUNT` = 5 Kudo công khai có nhiều tim thô nhất tính tới `FINALIZE_AT` qua truy vấn xếp hạng duy nhất `HeartRankingQuery.rankKudoIds` (đồng hạng thì Kudo cũ hơn đứng trước, cần ít nhất 1 tim); trạng thái spam đọc ở thời điểm chốt, Kudo ẩn danh xếp hạng như thường và `senderId` thật chỉ đi trong sự kiện (BL016 không được lộ). Xếp hạng đọc trước giao dịch (không đọc trên pool khi đang giữ khoá). Trong giao dịch: advisory lock, kiểm lại "đã chốt chưa", ghi các dòng `national_kudos` (ràng buộc UNIQUE(rank) và UNIQUE(kudo_id)) và đúng một sự kiện outbox `NationalKudosFinalized` nên chạy đồng thời vẫn chỉ ghi 5 dòng. Chưa có Kudo nào có tim thì không ghi gì, tick kế kiểm lại. Kết quả: `not_due`, `already_finalized`, `nothing_to_finalize` hoặc `finalized`.

### Related Modules

- `features/secret-box-rewards/server` (`secret-box-advisory-lock.ts`, `secret-box-config.ts`)
- `features/kudos-hearts` (`HeartRankingQuery`)
- `features/kudos-feed` (`KudoPublicQuery.publicKudoIdsSubquery`)
- `shared/events/domain-event-outbox.ts`

### Related Routes

- (POST) /api/internal/secret-box/tick (ROUTE006)

### Related Data Models

- MODEL014_NationalKudo
- MODEL003_Kudo
- MODEL008_KudoHeart
- MODEL015_DomainEventOutbox

---

## BL033_SecretBoxSweep

**Type**: scheduled-job
**Trigger**: mỗi tick Secret Box (BL034)
**File Schema**: N/A — not a file-exchange type
**Source File**: features/secret-box-rewards/server/secret-box-sweep-job.ts
**Source Symbol**: SecretBoxSweepJob::run

### Description

Inventory: `SecretBoxSweepJob.run` [SIGNAL_INFERRED] (scheduled-job: quét định kỳ trong tick). Mỗi tick lấy các người gửi khác nhau có Kudo công khai vừa nhận tim trong `SWEEP_WINDOW_MIN` = 10 phút gần nhất, rồi `SecretBoxGrantService.reconcileForSenders` cấp những hộp họ còn nợ, tối đa `SWEEP_MAX_SENDERS_PER_TICK` = 500 người đến hạn mỗi tick (phần còn lại vẫn đến hạn ở tick sau, cửa sổ các tick chồng lên nhau). Nhờ vậy `BoxGranted` tới BL016 mà không phải chờ lần ghé thăm kế tiếp của người dùng. Đối soát idempotent; tick lỡ hoặc bị bỏ qua chỉ làm thông báo trễ. Job chỉ đọc ai cần đối soát, không đọc bao nhiêu hộp: tổng vẫn lấy từ `HeartStatsQuery` của phase 06. Bỏ tim và Un Spam không tạo tim nên đi đường đọc. Mỗi người lỗi chỉ ghi log và vẫn đến hạn ở tick sau.

### Related Modules

- `features/secret-box-rewards/server` (`secret-box-grant-service.ts`, `secret-box-config.ts`)
- `features/kudos-hearts` (`HeartStatsQuery`)

### Related Routes

- (POST) /api/internal/secret-box/tick (ROUTE006)

### Related Data Models

- MODEL008_KudoHeart
- MODEL003_Kudo
- MODEL011_SecretBox

---

## BL034_SecretBoxTick

**Type**: scheduled-job
**Trigger**: mỗi lần BL027 gọi `SecretBoxTickJob.run(now)`
**File Schema**: N/A — not a file-exchange type
**Source File**: features/secret-box-rewards/server/secret-box-tick-job.ts
**Source Symbol**: SecretBoxTickJob::run

### Description

Inventory: `SecretBoxTickJob.run` [SIGNAL_INFERRED] (scheduled-job: bộ điều phối tick cron). Chạy lần lượt `SecretBoxSweepJob` (BL033) rồi `NationalKudosFinalizeJob` (BL032); mỗi job lỗi riêng thì ghi log và trả `null`, job còn lại vẫn chạy. Chống chạy chồng: cả tick nằm trong một giao dịch giữ advisory lock của tick (`tryLockSecretBoxTick`), tick bắt đầu khi tick chậm còn chạy (hoặc cuộc gọi cron thử lại) bị bỏ qua ngay với `{ skipped: true }`. Các job dùng kết nối và giao dịch của chúng trên pool; kết nối đang giữ chỉ mang khoá (1 trong 10 của pool) và job không đọc qua nó.

### Related Modules

- `features/secret-box-rewards/server` (`secret-box-advisory-lock.ts`, `secret-box-sweep-job.ts`, `national-kudos-finalize-job.ts`)
- `shared/db/client.ts`

### Related Routes

- (POST) /api/internal/secret-box/tick (ROUTE006)

### Related Data Models

- MODEL011_SecretBox
- MODEL014_NationalKudo

---

## Summary

- **Total Behavior Logic Items**: 34
- **By Type**: custom-command: 1, event-listener: 2, integration: 9, mail: 0, middleware: 1, notification: 4, observer: 7, queue-worker: 2, scheduled-job: 8, webhook: 0

---

## Cross-Reference Validation

- [x] All BL### codes are unique
- [ ] All BL### codes are referenced in UserStories.md (type=system) (Wave 3 điền) — chưa đạt: 11 BL (BL001, BL012, BL020, BL022, BL025, BL027-BL032) chưa có US dẫn; backlog system US cho scheduler ở lần chạy đầy đủ sau
- [x] All BL### codes are referenced in FeatureList.md (Wave 5 điền)
- [x] All related route references are valid (ROUTE### in RouteList — validate_feature_api_link.py enforces this)
- [x] All related data model references are valid (MODEL### in DataModel)
- [x] No orphaned behavior logic references
- [x] All BL items have Source File + Source Symbol fields (Rule C2)
- [x] All Source File paths match scout Background Logic Source Inventory entries (Rule C2/C3)

---

## Client-Side Logic

Các mẫu phía client tìm thấy trong code. Mỗi mục ghi loại mẫu, vị trí kích hoạt (file:line) và việc nó làm. Đây là hành vi giao diện, không phải BL.

### Debounce / Throttle

**Extraction signature:** timer wrapper around a handler — `setTimeout`, `clearTimeout`, `debounce(fn, ms)`, `throttle(fn, ms)`, `useDebounce`, `useDebouncedCallback`

```
BL-C01 — Sunner search debounce
pattern: debounce
source: features/sunner-search/components/use-sunner-search.ts:30
trigger: người dùng gõ vào combobox tìm Sunner (ô tìm profile, bộ lọc người gửi/nhận, người nhận của composer)
delay: 250ms (tham số `debounceMs`)
description: Chờ người dùng ngừng gõ rồi mới gọi GET /api/sunners/search; câu trả lời cũ không bao giờ hiện cho truy vấn mới.
```

```
BL-C02 — Admin review search debounce
pattern: debounce
source: features/admin-moderation/components/review-search-input.tsx:57
trigger: người dùng gõ vào ô "Tìm theo nội dung" của trang Review content
delay: 300ms (`SEARCH_DEBOUNCE_MS`)
description: Chỉ sau khi ngừng gõ mới `router.replace` URL với `q`, tránh mỗi phím tạo một lần đọc.
```

```
BL-C03 — Spotlight search debounce
pattern: debounce
source: features/spotlight-board/components/spotlight-search-input.tsx:24
trigger: người dùng gõ vào ô tìm trong Spotlight Board
delay: 200ms (`SEARCH_DEBOUNCE_MS` trong `lib/spotlight-ui-config.ts:30`)
description: Chuyển văn bản sau một nhịp ngừng gõ cho bảng để lọc đám mây tên.
```

```
BL-C04 — Spotlight snapshot resync debounce
pattern: debounce
source: features/spotlight-board/lib/spotlight-resync-scheduler.ts:25
trigger: sau mỗi lần join kênh, sau sự kiện removed hoặc restored, khi tab hiện lại
delay: 2000ms cộng jitter tới 1000ms sau sự kiện kiểm duyệt; jitter tới 2000ms sau khi join (`MODERATION_RESYNC_*`, `SUBSCRIBE_RESYNC_JITTER_MS`)
description: Yêu cầu mới thay thế yêu cầu đang chờ (trailing debounce), nên một loạt sự kiện chỉ tạo một lần GET /api/spotlight.
```

```
BL-C05 — Avatar hover card open delay
pattern: debounce
source: features/profile/components/avatar-hover-card.tsx:92
trigger: chuột đặt lên avatar, hoặc focus bàn phím lên tên
delay: 300ms mở (`HOVER_CARD_OPEN_DELAY_MS`), 150ms ân hạn khi rời để chuột kịp di vào thẻ
description: Chỉ mở thẻ sau độ trễ; dữ liệu `GET /api/sunners/:userId/card` được nhớ theo trang (`SUNNER_CARD_TTL_MS` = 60 giây); cảm ứng không bao giờ mở thẻ.
```

### Optimistic UI

**Extraction signature:** mutation applied immediately before API response, with rollback on error — `setState` before `await`, undo on catch, `optimisticUpdate`, `useOptimistic`

```
BL-C06 — Heart toggle optimistic update
pattern: optimistic-ui
source: features/kudos-hearts/components/kudo-heart-button.tsx:54
trigger: người dùng bấm tim trên thẻ Kudo
optimistic-action: đổi trạng thái tim và số đếm ngay bằng `useOptimistic`, khoá nút tới khi server trả lời
rollback: khi action trả lỗi thì quay về giá trị đã xác nhận và hiện KudoHeartErrorToast
```

```
BL-C07 — Notification mark-as-read optimistic update
pattern: optimistic-ui
source: features/notifications/hooks/use-notification-list.ts:128
trigger: bấm dòng thông báo chưa đọc, hoặc "Đánh dấu đọc tất cả"
optimistic-action: đánh dấu đã đọc ngay trong danh sách (`locallyRead`); action chạy nền
rollback: `revert(ids)` trả các dòng về chưa đọc khi action lỗi; id đã đọc cục bộ vẫn thắng mọi phản hồi tải về từ trước
```

```
BL-C08 — Admin filter view optimistic navigation
pattern: optimistic-ui
source: features/admin-moderation/components/review-content-screen.tsx:32
trigger: đổi bộ lọc, tìm kiếm, sắp xếp hoặc trang ở Review content, User và Overview (`admin-users-view.tsx:36`, `admin-overview-screen.tsx:30`)
optimistic-action: bộ điều khiển hiện ngay chế độ xem mới bằng `useOptimistic` trong transition, các dòng mờ đi tới khi server trả lời
rollback: URL là nguồn sự thật; lỗi đọc hiện `AdminLoadErrorPanel`, không có hoàn tác riêng
```

### Polling

**Extraction signature:** recurring API call — `setInterval`, recursive `setTimeout` calling an API, `usePolling`, `refetchInterval`

N/A — no polling patterns detected.

Ghi chú: có hai bộ hẹn giờ lặp nhưng không gọi API nên không tính là polling: `features/notifications/hooks/use-minute-clock.ts:9` (`setInterval` 60 giây làm mới thời gian tương đối) và `features/awards-portal/components/use-server-clock-now.ts:22` (hẹn giờ theo từng phút của đồng hồ đếm ngược, dừng khi tới mốc). Cập nhật tức thời đi qua Realtime (BL002, BL003).

### Upload Progress

**Extraction signature:** file upload with progress tracking — `XHR.upload.onprogress`, `FormData` with `onUploadProgress`, `fetch` streaming, `useUpload`, `onProgress`

N/A — no upload progress patterns detected.

Ghi chú: ảnh Kudo tải lên qua `uploadToSignedUrl` (BL006) không có phần trăm; mỗi ảnh chỉ có trạng thái `uploading`, `done` hoặc `error` (`features/kudos-authoring/components/use-kudo-image-uploads.ts:18`).

### Realtime (WebSocket / SSE / EventSource)

**Extraction signature:** persistent connection to server — `new WebSocket(...)`, `new EventSource(...)`, `useWebSocket`, `subscribe(channel)`, SSE `listen` handler, reconnect logic

```
BL-C09 — Notification bell channel
pattern: realtime
source: features/notifications/hooks/use-notification-channel.ts:50
trigger: NotificationBell mount
channel: private Broadcast `notifications:{userId}`, event `notification`
reconnect: Supabase tự nối lại; mỗi SUBSCRIBED, tab hiện lại và online lại đều yêu cầu đồng bộ (không có phát lại sự kiện); offline đóng kênh, online mở kênh mới
teardown: gỡ kênh, bỏ lắng nghe `onAuthStateChange`, `visibilitychange`, `online`, `offline` khi unmount
```

```
BL-C10 — Spotlight board channel
pattern: realtime
source: features/spotlight-board/hooks/use-spotlight-channel.ts:66
trigger: SpotlightBoard mount
channel: private Broadcast `spotlight`, event `kudo`
reconnect: Supabase tự nối lại; máy trạng thái đếm thất bại, lần thứ 5 liên tiếp gỡ kênh sang `failed` tới khi `retry()`; snapshot tải lại sau mỗi lần join (có jitter)
teardown: huỷ bộ hẹn giờ resync, gỡ kênh và các listener khi unmount
```

Ghi chú: các kênh dùng chung một socket theo tab (BL010). Chuông, panel dropdown và trang `/notifications` đồng bộ với nhau trong tab bằng `CustomEvent` của `window` (`features/notifications/lib/notification-sync-events.ts`), là keo giao diện chứ không phải kết nối mạng.
