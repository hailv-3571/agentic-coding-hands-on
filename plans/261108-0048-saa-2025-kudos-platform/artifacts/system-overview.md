**Project**: SAA 2025 — Kudos Platform (Sun* Annual Awards 2025, chủ đề "ROOT FURTHER")
**Generated**: 2026-11-23
**Architecture Type**: Modular monolith — một ứng dụng Next.js 16 (App Router) chia theo feature slice, chạy trên Supabase (Auth, Realtime, Storage) và Postgres; không có dịch vụ nền tách rời

## Executive Summary

Web nội bộ cho sự kiện Sun* Annual Awards 2025 (`README.md`, `app/layout.tsx`). Chỉ nhân viên có email `@sun-asterisk.com` vào được, đăng nhập bằng Google (`features/auth/server/sign-in-with-google-action.ts`, `db/migrations/0005_auth_user_triggers.sql`). Hệ thống có bốn mảng:

- **Cổng giải thưởng**: trang chủ đếm ngược tới `EVENT_AT`, 6 giải (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP — `features/awards-portal/data/awards-data.ts`), trang Thể lệ và Tiêu chuẩn cộng đồng. Trước `LAUNCH_AT`, người không phải admin chỉ thấy `/countdown` (`features/awards-portal/server/prelaunch-gate.ts`).
- **Sun\* Kudos**: Sunner viết Kudo tặng đồng nghiệp — nội dung Markdown rút gọn ≤ 1.000 ký tự, 1–5 hashtag, ≤ 5 ảnh (≤ 5 MB mỗi ảnh), có thể gửi ẩn danh kèm nickname (`features/kudos-authoring/kudo-authoring-limits.ts`). Live board `/kudos` gồm Highlight (5 Kudo nhiều tim nhất), feed "All Kudos" phân trang bằng cursor, Spotlight board realtime và cột phần thưởng (`app/(app)/kudos/page.tsx`). Còn có hồ sơ Sunner, chuông thông báo realtime (7 loại — `shared/db/schema/notifications.ts`) và hai ngôn ngữ vi/en (`messages/`).
- **Gamification**: tim (mỗi Sunner một tim cho mỗi Kudo, không thả cho Kudo của chính mình; nhân `HEART_CAMPAIGN_MULTIPLIER` = 2 trong campaign — `features/kudos-hearts/server/kudo-heart-service.ts`). Huy hiệu Hero 4 bậc theo số người gửi khác nhau: New ≥ 1, Rising ≥ 5, Super ≥ 10, Legend ≥ 21 (`features/hero-badges/server/hero-tier-constants.ts`). Secret Box: cứ `SECRET_BOX_HEARTS_PER_BOX` (mặc định 5) tim có trọng số mà Kudo mình gửi nhận được thì có 1 hộp; mở hộp bốc icon hoặc quà theo trọng số và tồn kho; đủ 6 icon thì nhận quà bí ẩn; Kudos Quốc Dân là top 5 Kudo nhiều tim thô nhất, chốt tại `NATIONAL_KUDOS_FINALIZE_AT` (`features/secret-box-rewards/server/`).
- **Admin** (`shared/ui/app-routes.ts` → `ADMIN_ROUTES`): Overview (thống kê theo đơn vị, xuất CSV), Review (đánh dấu/bỏ spam Kudo, xuất CSV), Users (đổi role, xuất CSV), Settings (campaign nhân đôi tim).

Quy mô code: 16 feature slice (`features/`), 16 bảng Drizzle (`shared/db/schema/`), 24 migration lên `0000`–`0023` (14 file `.down.sql` viết tay cho `0010`–`0023`), 18 page, 20 route handler, 11 module Server Action. Ngăn xếp: Next.js 16.4.5, React 19.3, TypeScript, Tailwind 4, next-intl 4, Supabase (`@supabase/ssr`, `supabase-js`), Drizzle 0.45 trên `postgres-js`, Zod 4 (`package.json`). Hosting: No data (repo không có cấu hình triển khai; `README.md` chỉ mô tả chạy local bằng Supabase Docker).

For architecture diagrams and tech stack details, see [architecture.md](architecture.md).

## Key Design Decisions

### Decision 1: Modular monolith, background work lives in Postgres

**Context**: Cần job định kỳ (cấp Secret Box, chốt Kudos Quốc Dân, xử lý outbox) và đẩy realtime, nhưng repo không có scheduler, queue hay mailer phía Node (`plans/261108-0048-saa-2025-kudos-platform/artifacts/scout-report.md` § Notes).

**Decision**: Toàn bộ logic miền nằm trong tiến trình Next.js (server component, Server Action, route handler). Lịch chạy do `pg_cron` + `pg_net` đảm nhiệm: mỗi phút POST `/api/internal/secret-box/tick` (`db/migrations/0016_secret_box_tick_cron.sql`), mỗi 5 giây POST `/api/internal/notifications/drain` (`0020_notifications_drain_cron.sql`), hằng ngày dọn outbox và lịch sử cron (`0023_housekeeping_outbox_and_cron_history_prune.sql`). URL và secret lấy từ Supabase Vault; thiếu extension thì migration chỉ in NOTICE và bỏ qua, dùng cron máy chủ thay thế.

**Rationale**: Không phải nuôi thêm worker hay queue. Mọi job idempotent (khoá advisory, `FOR UPDATE SKIP LOCKED`) nên tick lỡ hoặc chạy chồng chỉ làm thông báo trễ chứ không sai dữ liệu (`features/secret-box-rewards/server/secret-box-tick-job.ts`, `features/notifications/server/notification-event-processor.ts`). Đổi lại, hệ thống phụ thuộc extension của Supabase và phải cấu hình Vault theo từng môi trường.

### Decision 2: Server-role data access, RLS as backstop only

**Context**: Cần một chỗ duy nhất quyết định ai được đọc/ghi gì, kể cả khi Supabase Data API và Realtime mở cho trình duyệt.

**Decision**: Drizzle kết nối bằng vai trò server nên bỏ qua RLS (`shared/db/client.ts`). Mọi bảng bật RLS và không có policy cho `anon`/`authenticated`; migration còn `REVOKE ALL` quyền của hai role này, kể cả bảng tạo về sau (`db/migrations/0002_rls_baseline.sql`). Ngoại lệ duy nhất là policy đọc trên `realtime.messages` cho hai topic broadcast (Decision 6). Quyền kiểm tra bằng code server; dữ liệu ra khỏi server qua whitelist, ví dụ Kudo ẩn danh chỉ trả `{ anonymous: true, nickname }` (`features/kudos-feed/server/kudo-row-mask.ts`).

**Rationale**: Một tầng kiểm quyền dễ rà soát hơn hai tầng lệch nhau; RLS chỉ là lớp phòng thủ chiều sâu nếu ai đó lỡ mở bảng ra Data API. Rủi ro nằm ở chỗ quên kiểm quyền trong code server — nên quy ước bắt buộc gọi guard ở từng page và action (`docs/code-standards.md` § Auth và phân quyền).

### Decision 3: Optimistic proxy plus per-call guards

**Context**: Next.js 16 đổi `middleware` thành `proxy.ts`; Cache Components gửi shell với status 200 trước khi `forbidden()` trong layout kịp chạy, nên layout không đổi được status thành 403 (`shared/auth/session-proxy.ts`, `shared/auth/access-denied-response.ts`).

**Decision**: `proxy.ts` chạy theo thứ tự cố định: làm mới session bằng `getUser()`; cho qua danh sách public; khách vào trang bảo vệ bị đưa về `/login?next=` (API trả JSON 401); non-admin vào `/admin/*` bị proxy tự trả HTTP 403 (fetch trang `/access-denied` rồi trả với status 403); cuối cùng là cổng prelaunch. Dù vậy mọi page, layout và action vẫn tự gọi `requireSunner()` hoặc `requireAdmin()` (`shared/auth/current-user.ts`, `shared/auth/admin-guard.ts`). Nguồn gốc fetch nội bộ là `INTERNAL_APP_ORIGIN` hoặc `http://127.0.0.1:$PORT`, không bao giờ lấy từ header `Host`.

**Rationale**: Proxy rẻ (profile chỉ đọc khi cần, tối đa một lần mỗi request) nhưng chỉ là lớp lạc quan; guard từng điểm vào mới là lớp quyết định vì layout không che được Server Action. Dùng `getUser()` ở cả hai nơi để proxy và page không bất đồng (tránh vòng lặp chuyển trang), chấp nhận thêm một lần gọi Supabase Auth mỗi request. Rủi ro đã ghi nhận: `forbidden()` cần cờ thử nghiệm `experimental.authInterrupts` trong `next.config.ts`, phải kiểm lại khi nâng Next (`plans/261108-0048-saa-2025-kudos-platform/spec/decision-log.md`, dòng 70).

### Decision 4: Domain gate in the database, role read from the database

**Context**: Chỉ nhân viên Sun* được vào; admin phải thu hồi được ngay và không bao giờ để hệ thống không còn admin.

**Decision**: Chặn domain ba lớp cùng một vị ngữ: auth hook `before_user_created_hook` (trả `domain_not_allowed` về `/auth/callback`), trigger `BEFORE INSERT`/`BEFORE UPDATE` trên `auth.users` làm chốt cuối (`db/migrations/0005_auth_user_triggers.sql`), và kiểm lại trong `completeLogin` (`features/auth/server/complete-login.ts`). Role (`user`/`admin`) luôn đọc từ `profiles.role` ở mỗi lần gọi, không lấy từ cookie hay claim. Mỗi lần đăng nhập, email nằm trong `ADMIN_EMAILS` được đặt lại thành admin; `UserRoleService` là nơi duy nhất ghi role từ giao diện, khoá các dòng admin theo thứ tự `id`, cấm tự hạ quyền, hạ tài khoản env-admin và hạ admin cuối cùng (`features/admin-users/server/user-role-service.ts`).

**Rationale**: Hook cho thông báo lỗi rõ ràng, trigger bảo đảm không đường ghi nào lọt khi cấu hình hook thiếu. Đọc role từ DB giúp hạ quyền có hiệu lực ở request kế tiếp. Điểm cần nhớ: domain được ghi cứng trong hàm SQL `is_sunner_email()` còn `ALLOWED_EMAIL_DOMAIN` nằm trong env; hai nơi phải khớp nhau (chú thích trong `0005_auth_user_triggers.sql` nói test kiểm điều này).

### Decision 5: Transactional outbox with an idempotent single consumer

**Context**: Kudo, tim, đánh dấu spam, cấp hộp và chốt Kudos Quốc Dân đều phải sinh thông báo mà không được mất hoặc nhân đôi sự kiện, kể cả khi giao dịch gốc rollback.

**Decision**: Producer gọi `DomainEventOutbox.add(tx, type, payload)` ngay trong giao dịch nghiệp vụ; payload qua `domainEventSchema` (Zod, chỉ chứa id, từ chối khoá lạ) và rollback nếu sai (`shared/events/domain-event-outbox.ts`, `shared/events/domain-event-types.ts`). Có 6 loại: `KudoCreated`, `HeartAdded`, `KudoMarkedSpam`, `BoxGranted`, `SetCompleted`, `NationalKudosFinalized`. `NotificationEventProcessor` là nơi duy nhất tiêu thụ outbox: mỗi event một giao dịch với `FOR UPDATE SKIP LOCKED`, ghi thông báo và `consumed_at` cùng lúc, thất bại thì tăng `attempts` và lùi giờ thử lại 1/2/4/8 phút, đủ 5 lần thì đỗ lại với `failed_at` (`features/notifications/notification-config.ts`).

**Rationale**: Sự kiện chỉ tồn tại khi dữ liệu gốc đã commit; ràng buộc `UNIQUE(event_id, recipient_id, type)` là chốt cuối chống trùng thông báo (`shared/db/schema/notifications.ts`). Không dùng message broker nên vận hành đơn giản; đổi lại thông báo đến chậm theo nhịp drain 5 giây thay vì tức thời.

### Decision 6: Realtime by database trigger on private topics

**Context**: Spotlight board và chuông thông báo cần cập nhật tức thì, nhưng không được lộ người gửi Kudo ẩn danh hay nội dung thông báo cho client khác.

**Decision**: Trigger trên `kudos` (`spotlight_publish_kudo_event`) và `notifications` (`notifications_publish_signal`) gọi `realtime.send` tới topic riêng `spotlight` và `notifications:{userId}`; payload dựng từng trường, không chứa `sender_id`, nội dung hay tham số thông báo. Một policy `SELECT` trên `realtime.messages` cho mỗi topic, không có policy ghi nên client không giả mạo được tín hiệu (`db/migrations/0017_spotlight_realtime.sql`, `0019_notifications_realtime.sql`). Trigger bắt mọi lỗi và chỉ `RAISE LOG`, nên không bao giờ làm hỏng giao dịch ghi Kudo; client tự đồng bộ lại bằng `GET /api/spotlight` và `GET /api/notifications/unread-count` khi kết nối lại.

**Rationale**: Tín hiệu nằm trong cùng giao dịch nên rollback thì không phát. Realtime chỉ là đường tăng tốc, nguồn sự thật vẫn là truy vấn. Điều kiện triển khai: phải tắt "Allow public access" của Realtime (chỉ dùng kênh riêng) trên từng project Supabase (chú thích trong `0017_spotlight_realtime.sql`).

### Decision 7: Event timeline from env and the server clock

**Context**: Sự kiện có các mốc cố định (mở cổng, diễn ra, kết thúc, chốt Quốc Dân) mà BTC cần chỉnh không cần sửa code.

**Decision**: Bốn mốc `LAUNCH_AT`, `EVENT_AT`, `EVENT_END_AT`, `NATIONAL_KUDOS_FINALIZE_AT` là biến môi trường ISO-8601 có offset, ràng buộc `LAUNCH_AT < EVENT_END_AT ≤ NATIONAL_KUDOS_FINALIZE_AT` (`shared/config/env-schema.ts`). `next.config.ts` gọi `parseServerEnv` khi `dev`/`build`/`start` nên thiếu hoặc sai biến thì app không khởi động và in danh sách lỗi; `SKIP_ENV_VALIDATION=1` chỉ dành cho bước typecheck. Trạng thái prelaunch suy ra từ giờ máy chủ ở mỗi request, không lưu. Cửa sổ ghi (Kudo, tim) là `[LAUNCH_AT, EVENT_END_AT)` do một hàm duy nhất quyết định, `isEventWritingOpen`, và các action kiểm lại dù proxy đã chặn (`shared/config/event-window.ts`).

**Rationale**: Proxy chỉ chặn được tải trang; Server Action gửi tới đường được phép như `/countdown` vẫn lọt xuống tầng action, nên cần kiểm hai lần. Mở hộp Secret Box vẫn được sau `EVENT_END_AT` (`features/secret-box-rewards/server/secret-box-open-service.ts`).

### Decision 8: Derive on read, snapshot only where history matters

**Context**: Spam bật/tắt, campaign đổi giờ, bậc Hero thăng giáng — nếu lưu bộ đếm thì phải sửa ngược nhiều nơi.

**Decision**: Bậc Hero tính khi đọc bằng `COUNT(DISTINCT sender_id)` trên Kudo public, không có cột lưu bậc (`features/hero-badges/server/hero-tier-query.ts`). Trạng thái campaign (sắp tới/đang chạy/đã xong) cũng tính, không lưu, và không cho hai campaign chồng giờ nhờ ràng buộc `EXCLUDE USING gist` (`db/migrations/0012_campaigns_no_overlap_exclude.sql`). Spam bị loại ở lúc truy vấn nên không xoá dòng tim. Ngược lại, hệ số tim được chụp lại vào `kudo_hearts.multiplier` ở thời điểm thả và không sửa nữa (`shared/db/schema/kudo-hearts.ts`). Hộp Secret Box được đối soát (`floor(tổng tim có trọng số / SECRET_BOX_HEARTS_PER_BOX)`, chỉ thêm `seq` còn thiếu, không bao giờ xoá) thay vì đếm lại (`features/secret-box-rewards/server/secret-box-grant-service.ts`).

**Rationale**: Mark Spam và Un Spam tự đúng ở mọi nơi mà không phải sửa dữ liệu; chụp hệ số tim giữ nguyên giá trị đã trao dù campaign bị sửa sau. Chi phí là mỗi lần tải trang phải tính lại, giảm nhẹ bằng index một phần (`kudos_public_recipient_sender_idx`) và truy vấn theo lô.

### Decision 9: Cookie-based locale, request-bound root layout

**Context**: UI song ngữ vi/en nhưng URL không mang tiền tố ngôn ngữ; `<html lang>` phải theo người dùng.

**Decision**: Locale lấy theo thứ tự cookie `NEXT_LOCALE`, rồi `Accept-Language` (chỉ vi/en), rồi mặc định `vi` (`shared/i18n/resolve-locale.ts`, `shared/i18n/request.ts`). Vì root layout đọc cookie nên `app/layout.tsx` đặt `instant = false`, tắt kiểm tra static shell của Cache Components cho cả app; segment con vẫn có thể bật lại.

**Rationale**: Đa số trang cần đăng nhập và cá nhân hoá nên mất ít từ static shell; bù lại không phải đụng routing theo locale. Hệ quả: các trang Sunner đều là route chặn theo request, không prerender được (`app/(app)/layout.tsx`).

## Security Overview

- **Authentication**: Google OAuth qua Supabase Auth, luồng PKCE; `hd` chỉ gợi ý bộ chọn tài khoản, chốt thật nằm ở DB (`features/auth/server/sign-in-with-google-action.ts`). `/auth/callback` đổi `code` lấy session rồi chạy `completeLogin`; lỗi nào cũng đăng xuất session dở dang và về `/login?error=` (`app/auth/callback/route.ts`). Session nằm trong cookie do `@supabase/ssr` quản lý; proxy và page đều xác thực bằng `getUser()` (hỏi Supabase Auth, không tin JWT thô), lỗi Auth được coi như chưa đăng nhập (đóng khi lỗi). Không có mật khẩu hay MFA trong luồng này. Đường dẫn `next` luôn qua `safeNextPath()` chống open redirect (`shared/auth/safe-next-path.ts`).
- **Authorization**: Hai role `user`/`admin` trong `profiles.role` (`shared/db/schema/profiles.ts`). Sunner phải có phòng ban, chưa có thì bị đưa tới `/onboarding/department` (`requireSunner`). Khu `/admin/*`: proxy trả 403, layout gọi `requireShellAdmin()`, mỗi action gọi `requireAdmin()`, route JSON gọi `requireAdminApi()` (401/403 dạng `{ code }`). Chủ Kudo mới được sửa; người nhận không đổi được sau khi tạo. Endpoint nội bộ `/api/internal/*` nằm trong `PUBLIC_PATHS` nhưng tự kiểm header `x-job-secret` hoặc `x-drain-secret` bằng SHA-256 + `timingSafeEqual`; chưa đặt secret thì trả 503 `not_configured` (`features/secret-box-rewards/server/internal-job-guard.ts`, `features/notifications/server/outbox-drain-guard.ts`). Chi tiết ma trận quyền: xem `docs/system/permissions.md`.
- **Data Encryption**: Mã hoá ở tầng ứng dụng: No data (code không mã hoá cột nào). Phần thấy được trong repo: secret của cron (URL, `INTERNAL_JOB_SECRET`, `OUTBOX_DRAIN_SECRET`) lưu trong Supabase Vault chứ không nằm trong file migration; bucket ảnh `kudo-images` ở chế độ private, chỉ đọc qua signed URL (đọc 30 phút, xem trước khi sửa 10 phút) và đường dẫn ảnh không chứa id người gửi để Kudo ẩn danh không lộ tác giả (`db/migrations/0003_storage_kudo_images_bucket.sql`, `features/kudos-feed/server/kudo-image-read-urls.ts`). Mã hoá khi lưu và TLS của Postgres/Supabase trên môi trường thật: No data (do hosting quyết định; `[api.tls]` trong `supabase/config.toml` đang tắt vì chỉ là cấu hình local).
- **API Security**: Matcher của proxy phủ mọi đường trừ asset tĩnh, không miễn theo đuôi file nên route như `/api/admin/export.xml` vẫn qua cổng session (`proxy.ts`). Khách gọi API nhận 401 JSON thay vì bị redirect. Mỗi route handler tự gọi guard riêng (proxy chỉ là lớp lạc quan); input qua Zod; body JSON nhỏ đọc có trần byte, vượt trần trả 413 trước khi parse (`features/kudos-authoring/server/read-capped-json-body.ts`); endpoint dữ liệu riêng tư đặt `Cache-Control: private, no-store`. Nội dung Kudo là Markdown rút gọn parse ra AST chỉ có văn bản, in đậm/nghiêng/gạch, link http(s) — không có node HTML hay ảnh nhúng (`features/kudos-feed/markdown/kudo-body-ast.ts`). Xuất CSV bị chặn ở `EXPORT_MAX_ROWS` (mặc định 10.000, `shared/admin/export-limit.ts`). Mở hộp dùng Idempotency-Key. Chưa có trong code: giới hạn tần suất (rate limit) ở tầng ứng dụng, và header bảo mật như CSP (`next.config.ts` không khai báo `headers`) — No data về việc hosting hay CDN có bù hai thứ này. Ngoại lệ đã ghi nhận: `redirectTo` của OAuth và redirect trong `/auth/callback` còn lấy origin từ request; Supabase Auth kiểm `redirectTo` theo danh sách cho phép (`additional_redirect_urls` trong `supabase/config.toml`, `docs/code-standards.md`).

## Scalability

- **Current Capacity**: Số liệu đo thực tế hoặc kết quả load test: No data. Các trần khai báo trong code: pool Postgres tối đa 10 kết nối mỗi tiến trình, tắt prepared statement để đi qua transaction pooler (`shared/db/client.ts`); mỗi lần drain xử lý ≤ 50 event (`OUTBOX_BATCH_SIZE`); mỗi tick Secret Box đối soát ≤ 500 người gửi (`SWEEP_MAX_SENDERS_PER_TICK`); Spotlight hiện tối đa 60 tên (`NAME_CLOUD_MAX`); truy vấn Hero chia lô 500 id; trang thông báo 20 dòng, tối đa 50 (`features/notifications/notification-config.ts`). Quy mô người dùng mục tiêu: No data trong code.
- **Scaling Strategy**: Ứng dụng không giữ trạng thái nghiệp vụ trong bộ nhớ (không có hàng đợi hay scheduler Node; pool và client Supabase chỉ là singleton) nên có thể chạy nhiều instance. Tính đúng đắn khi nhiều instance/tick chạy chồng dựa vào DB: khoá advisory theo người dùng và theo tick, `FOR UPDATE SKIP LOCKED`, ràng buộc UNIQUE, `INSERT … ON CONFLICT DO NOTHING`. Đọc nặng dùng keyset pagination `(created_at DESC, id DESC)` với cursor mã hoá base64url (`features/kudos-feed/server/kudo-feed-cursor.ts`), index một phần, và tổng hợp theo lô; cập nhật tức thời đi bằng Realtime thay vì polling. Bảng tăng mãi được dọn hằng ngày: outbox đã xử lý quá 30 ngày, `cron.job_run_details` quá 7 ngày (`0023_housekeeping_outbox_and_cron_history_prune.sql`). Giới hạn đã biết: không dùng `use cache` hay lớp cache nào (mọi trang tính lại theo request), chưa có replica đọc, dọn outbox không có index trên `consumed_at` (chú thích trong migration nói nên xem lại khi outbox quá ~1 triệu dòng).
- **Performance Targets**: Không có SLO hay ngân sách độ trễ dạng số trong code: No data. Mục tiêu hành vi có ghi trong code: thông báo tới "trong vài giây" nhờ drain mỗi 5 giây (`db/migrations/0020_notifications_drain_cron.sql`); tick Secret Box mỗi phút, tick lỡ chỉ làm trễ thông báo vì mọi đường đọc tự đối soát (`0016_secret_box_tick_cron.sql`); thử lại event lỗi trong ~15 phút (`features/notifications/notification-config.ts`); xuất CSV từ chối khi vượt `EXPORT_MAX_ROWS` thay vì chạy quá lâu.
