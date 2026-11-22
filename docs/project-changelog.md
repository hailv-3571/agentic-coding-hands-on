---
lang: vi
---

# Changelog

Mới nhất ở trên. Mỗi phase hoàn thành thêm một mục.

## 2026-11-23 — Phase 13 (F013 Notifications) — hoàn thành, đã ký duyệt

Added
- Bảng `notifications` (enum 7 loại, RLS bật, không policy, không quyền cho client; chỉ mục duy nhất chống trùng theo sự kiện, tim chưa đọc và `hero_tier_up`) và bộ xử lý `NotificationEventProcessor.drain`: mỗi sự kiện outbox một giao dịch riêng, `FOR UPDATE SKIP LOCKED`, ghi thông báo và `consumed_at` cùng giao dịch. Tim cho cùng một Kudo gộp vào một dòng chưa đọc; lên cấp Hero báo một lần cho mỗi cấp. Kudo ẩn danh không lưu người gửi vào `actor_id`; Kudos Quốc Dân không lộ `senderId`. Migration `0018`.
- Trigger `notifications_publish_signal` phát tin Broadcast riêng tư `notifications:{userId}` chỉ chứa id (`{notificationId, type, occurredAt}`), policy `notifications_recipient_read` trên `realtime.messages`, lỗi phát không huỷ giao dịch ghi. Migration `0019`.
- `POST /api/internal/notifications/drain` (header `x-drain-secret`, env tuỳ chọn `OUTBOX_DRAIN_SECRET` tối thiểu 32 ký tự): 503 chưa đặt, 401 sai, 200 `{processed, malformed, retrying, failed}`. Mục riêng trong `PUBLIC_PATHS`. Job pg_cron `saa-notifications-drain` mỗi 5 giây qua pg_net, secret đọc từ Vault; thiếu pg_cron, pg_net hay Vault thì migration chỉ NOTICE. Migration `0020`.
- `GET /api/notifications?limit&cursor` (mặc định 20, tối đa 50), `GET /api/notifications/unread-count` (cả hai 401 khi chưa đăng nhập, `private, no-store`); Server Action `markNotificationRead(id)` và `markAllNotificationsRead()`.
- UI: chuông ở layout Sunner (chấm đỏ cập nhật qua kênh realtime), panel 10 dòng, trang `/notifications` (20 dòng mỗi lần, cuộn tải thêm), khoá `notifications.*` (vi, en).
- Backoff thử lại: sau lần lỗi n chờ 60 s × 2^(n-1) (hằng `OUTBOX_RETRY_BASE_DELAY_SECONDS`), tối đa 5 lần rồi `failed_at`; cột `domain_event_outbox.next_attempt_at`. Migration `0021`. SQL đặt lại thủ công nằm ở `docs/features/F013_Notifications/technical-spec.md` (INT-001).

Changed
- `notifications.event_id` nullable, FK `ON DELETE SET NULL` (trước là CASCADE): dọn outbox không xoá lịch sử thông báo. Migration `0021`.
- Client Supabase trình duyệt dùng chung chuyển về `shared/auth/supabase-browser-client.ts`; `features/spotlight-board/lib/spotlight-browser-supabase.ts` đã xoá.
- `docs/system/architecture.md`: thêm mục "Cài đặt drain outbox theo môi trường (F013)", `next_attempt_at`, đường dẫn client dùng chung.

Decisions
- Hai nhận xét review mức trung bình (M1: thử lại sát nhau, 5 lần trong khoảng 25 s rồi bị đánh dấu thất bại; M2: CASCADE gắn lịch sử thông báo với việc dọn outbox) đã sửa bằng migration `0021`.
- "Cấp trước" của lên cấp Hero là cấp cao nhất đã báo (lệch với ALG-002 đếm theo vị trí); không thêm export mới ở F009.

Chưa làm
- Chưa ký duyệt (authz, riêng tư, migration).
- `cron.job_run_details` tăng khoảng 17 nghìn dòng mỗi ngày: cần việc dọn; outbox chưa có việc dọn dòng đã tiêu thụ.
- `last_error` có thể chứa tham số SQL (id), chỉ phía máy chủ.
- Bản tiếng Anh và copy Kudos Quốc Dân chờ BTC; chưa có chuông cho Admin.
- Đường pg_cron → pg_net → drain chưa kiểm thật (không có secret Vault ở local); làm một lần trên staging.
- Kết quả kiểm: unit 878, integration 521, e2e 132 đạt (5 bỏ qua theo thiết kế), prelaunch 5 đạt, build, `test:prod` đạt. Lượt chạy của tester (integration 520) áp dụng migration 0018-0020; lượt chạy sau sửa review (có 0021) do implementer chạy đủ bộ cổng, chưa có lượt tester riêng trên 0021.

## 2026-11-23 — Phase 12 (F012 Profile)

Added
- Trang `/profile` (của mình: header, icon, bảng thống kê, mục KUDOS mặc định "Đã gửi" / "Đã nhận") và `/profile/{userId}` (người khác: không có bảng thống kê, nút gửi Kudo mở hộp viết khoá người nhận, mục "Đã nhận"). Id của chính mình chuyển về `/profile`; id lạ hoặc sai dạng hiện "Không tìm thấy Sunner này." (404 mềm trên production như `/kudos/[id]`). Khoá `profile.*` (vi và en).
- `GET /api/profile/{userId}/kudos?direction&cursor`: `{items, nextCursor?, counts:{received, sent?}}`, 10 Kudo mỗi trang. `sent` chỉ cho chính chủ (người khác → 403 trước mọi lần đọc); `senderId` luôn lấy từ session. Thứ tự lỗi: 401/403 → 400 → 404 id sai dạng → 403 → 404 không tồn tại. `private, no-store`, thân lỗi chỉ có `{code}`.
- `GET /api/sunners/{userId}/card`: `{id, fullName, departmentName, heroTier, kudosReceived, kudosSent, canSendKudo}`, không email/role/avatar.
- `KudoPublicQuery.count(filters)` (kèm type `KudoListFilters`) dùng chung `listConditions` với `list`: số đếm luôn khớp danh sách (BR-006), guard che ẩn danh áp cho mọi lần đếm.
- `AvatarHoverCard`: thẻ nhanh theo Figma 2268:35101 (không avatar), mở sau 300 ms khi chuột vào avatar hoặc `:focus-visible` ở link tên; một thẻ mỗi trang; cảm ứng không mở; không bọc người gửi ẩn danh. Cầu Tab vào/ra thẻ trong portal, `aria-expanded`/`aria-controls` trên link tên. Bộ nhớ đệm theo trang, TTL 60 giây, xoá đệm của người nhận sau khi gửi Kudo từ thẻ hoặc nút trên profile.

Changed
- `kudo-card-sender.tsx` bọc khối người có tên bằng thẻ nhanh (tắt dưới lớp phủ spam của chủ bài); `kudo-feed-status-message.tsx` nhận `returnTo` tuỳ chọn cho link đăng nhập 401 (mặc định `/kudos`); `HeroBadge` thêm cỡ `hoverCard` (~164 px).
- `ProfileQuery.getById` bọc `cache()` của React (một lần đọc mỗi lượt render).

Decisions
- ALG-001 làm trong SQL: phase 05 đã phục vụ "Đã gửi" (public + spam của mình) bằng một cursor `(created_at, id)`, nên không có hàm gộp riêng (sẽ chỉ là seam cho test). Kiểm ở integration: 16 Kudo, 4 spam xen kẽ, hai Kudo cùng thời điểm nằm hai bên ranh giới trang, trang 10 + 6, đúng thứ tự DB, không trùng không thiếu.
- `kudosSent` của người khác chỉ đếm Kudo public không ẩn danh; spam không bao giờ được đếm; thẻ của chính mình đếm cả Kudo ẩn danh public của mình.
- Người nhận khoá truyền cho hộp viết có `email: ""` (hộp chỉ dùng tên và id; DTO profile không có email).
- Hộp "Gửi KUDO" trên thẻ cũng khoá người nhận (D008 áp cho cả thẻ).

Chưa làm
- Độ trễ 300 ms chưa có test trực tiếp (nên thêm assertion Resource Timing).
- Lẫn chuột và bàn phím: focus trong thẻ A trong khi chuột mở thẻ B thì A đóng và focus rơi về `body`.
- Gửi Kudo từ launcher ở Live board và số "đã gửi" của người xem chỉ làm mới bằng TTL (≤ 60 giây).
- `tests/integration/profile/profile-pages.test.ts` trong kế hoạch được thay bằng e2e.
- `docs/features/F012_Profile/` và `docs/screens/SCR021..SCR023` còn là bản nháp greenfield (tên handler dự kiến, `OwnSpamKudoQuery`, nội dung thẻ "avatar + mã phòng ban"); đồng bộ bằng `rebuild-spec --features F012`.
- Dev-only: `next dev` (Turbopack) từng phục vụ route handler bằng bản cũ của `kudo-public-query.ts`, phải sửa một ký tự comment để biên dịch lại (comment đó còn trong file).

## 2026-11-23 — Phase 11 (F008 Spotlight Board)

Added
- Trigger `spotlight_publish_kudo_event` trên `kudos` (AFTER INSERT OR UPDATE OF `status`; SECURITY DEFINER, `search_path = ''`, EXECUTE bị thu hồi khỏi PUBLIC/anon/authenticated). INSERT public → `added`; `public→spam` → `removed`; `spam→public` → `restored`; còn lại không phát gì (Kudo spam mới cũng không). Payload dựng từng trường: `{type, kudoId, recipientId, recipientName, occurredAt}`, không có `sender_id`, `is_anonymous`, `body`. Gọi `realtime.send(payload, 'kudo', 'spotlight', true)`; lỗi bị bắt (`RAISE LOG`) nên không bao giờ huỷ việc ghi Kudo. Migration `0017_spotlight_realtime` (có `.down.sql`).
- Policy `spotlight_authenticated_read` trên `realtime.messages`: chỉ SELECT cho `authenticated`, điều kiện `realtime.topic() = 'spotlight' AND topic = 'spotlight' AND extension = 'broadcast'`. Không có policy INSERT/UPDATE/DELETE nên client không giả được sự kiện.
- `GET /api/spotlight`: 401 `{code:"unauthorized"}` trước mọi truy vấn, 500 `{code:"unexpected"}`, `Cache-Control: private, no-store`. Trả `{total, names[], recent[]}` bằng 2 câu SQL chạy song song (top tên kèm tổng bằng `sum(count(*)) over ()`; 5 dòng mới nhất). `recent` xếp **cũ nhất trước**. Không chọn cột người gửi.
- Module `features/spotlight-board/` (bảng Spotlight trong slot R4 của Live board): bộ đếm "{n} KUDOS", đám mây tên 4 bậc cỡ (mỗi tên là link `/profile/{id}`), ticker 5 dòng mờ dần theo giờ ngôn ngữ, ô tìm không phân biệt dấu (debounce 200 ms, tối đa 50 ký tự), phóng to toàn màn hình, nhãn kết nối (SM-001) kèm nút thử lại, trạng thái trống, lỗi và skeleton. Khoá `spotlight.*` (17 khoá, vi và en).
- Client: reducer DEC-001 (chống trùng theo `kudoId`, không âm, tên về 0 thì bỏ, `restored` không thêm dòng ticker); vị trí tên cố định theo băm `recipientId`; điện thoại tối đa 24 tên, tên không còn chỗ thì bỏ; lớp network kéo 106 %.
- Lấy lại snapshot (REPLACE): sau `removed`/`restored` đợi 2000 + 0–999 ms kể từ sự kiện cuối của loạt; sau mỗi lần vào kênh đợi ngẫu nhiên 0–1999 ms; tab hiện lại thì lấy ngay. Reducer giữ `restoredIds` qua REPLACE để dòng ticker của Kudo vừa Un Spam không quay lại.
- Checklist triển khai Realtime ở `docs/system/architecture.md` → Deployment View (tắt "Allow public access", không mở schema `realtime` qua Data API, kiểm kênh riêng tư trên staging).

Changed
- `live-board-spotlight-slot.tsx` (seam phase 05): dựng `SpotlightBoardRegion` với snapshot từ `loadSpotlightSnapshot()` (sau `requireSunner()`), fallback Suspense là `SpotlightBoardSkeleton`.

Decisions
- `realtime.send` đã kiểm trên local (Realtime v2.154.0): chữ ký đúng như kế hoạch, thêm khoá `id` vào payload (client nhận 6 khoá, Zod bỏ `id`); ghi Kudo bị rollback thì không phát.
- Policy phải kèm điều kiện topic của chính dòng: chỉ `realtime.topic()` thì `authenticated` đọc được mọi topic khác (policy cộng bằng OR), lộ `notifications:*` của phase 13.
- Bậc cỡ tên tính theo hạng trên các số Kudo khác nhau: `tier = 4 − floor(rank·4/k)`. Hạng theo vị trí sẽ đẩy cả đuôi dài tên 1 Kudo lên bậc lớn nhất.
- `recent` cũ nhất trước theo hợp đồng `spotlight-views.ts` (spec cũ ghi mới nhất trước).
- Chưa có cache cho snapshot; xem xét TTL 1–2 s khi Kudo lên cỡ 100k+.

Chưa làm
- Kiểm kênh riêng tư trên Supabase hosted (staging) chưa chạy; local vẫn để `private_only = false`.
- e2e Spotlight có thể chập chờn khi 2 worker chạy song song (dọn dữ liệu bằng xoá cứng không phát event). Chưa có test cho nút "Thử lại" ở trạng thái lỗi (unit không có DOM).

## 2026-11-22 — Phase 10 (F010 Secret Box)

Added
- Cấp hộp: `SecretBoxGrantService.reconcileForSender`. `entitled = floor(weightedTotal / SECRET_BOX_HEARTS_PER_BOX)` với tổng tim đọc tại `min(now, EVENT_END_AT)` (x2 tính gấp đôi, Kudo ẩn danh tính, Kudo spam không). Chèn `seq = max+1 .. entitled` dưới khoá advisory theo người dùng; `BoxGranted{userId,count}` ghi cùng transaction và chỉ khi có dòng mới. Không bao giờ xoá hộp. Tim đọc trước khi lấy khoá (pool 10 kết nối).
- Mở hộp: `SecretBoxOpenService.openNext`. Cùng khoá, tra lại kết quả theo `UNIQUE (user_id, open_request_id)`, mở hộp `seq` nhỏ nhất, bốc quà có trọng số bằng `crypto.randomInt`, trừ kho bằng `UPDATE ... WHERE stock_remaining > 0` (bốc lại tối đa `MAX_REDRAW = 3` lần rồi rơi về icon). Đủ 6 icon thì ghi `mystery_gift_awards` một lần và phát `SetCompleted{userId,giftName}`.
- 5 bảng (RLS bật, không có policy): `secret_box_prizes`, `secret_boxes`, `user_icons`, `mystery_gift_awards`, `national_kudos`. Migration `0015_secret_box_rewards` và `0016_secret_box_tick_cron` (đều có `.down.sql`; gỡ 0016 trước).
- Nạp kho quà `db/seeds/secret-box-prize-loader.ts` (hook trong `apply-all-seeds.ts`, báo cáo `secretBoxPrizes`): chạy lại seed giữ nguyên số đã phát.
- API: `GET /api/secret-boxes/me`, `POST /api/secret-boxes/open` (header `Idempotency-Key` uuid v4; 401, 400 `invalid_idempotency_key`, 409 `no_box_left`), `POST /api/internal/secret-box/tick` (header `x-job-secret`; 503 `not_configured`, 401, 200, 500). Kết quả mở có cờ `duplicate` (icon đã có) và `replayed`.
- Tick mỗi phút: quét người gửi có tim trong 10 phút (tối đa `SWEEP_MAX_SENDERS_PER_TICK = 500` mỗi lần, phần dư báo `sweep.deferred`), rồi chốt Kudos Quốc Dân. Cả tick chạy trong một transaction giữ `pg_try_advisory_xact_lock`; tick khác đang chạy thì trả `{skipped:true}`. Lên lịch bằng pg_cron + pg_net, secret và URL trong Vault; dự phòng cron máy chủ (xem `docs/system/architecture.md`).
- Kudos Quốc Dân: 5 Kudo public nhiều tim thô nhất tại `NATIONAL_KUDOS_FINALIZE_AT` (hoà thì Kudo cũ hơn xếp trước), chốt đúng một lần, một sự kiện `NationalKudosFinalized`.
- UI: cột phần thưởng của Live board (5 số liệu, huy hiệu x2 khi có Campaign, nút Mở Secret Box mờ khi hết hộp, 10 Sunner nhận quà mới nhất), modal mở hộp (SM-002, mở được bằng `/kudos?secretBox=open`), `IconCollection` (6 ô, cho phase 12). Khoá `secretBox.*` (vi, en).
- Env `INTERNAL_JOB_SECRET` (tuỳ chọn, tối thiểu 32 ký tự).

Changed
- `PUBLIC_PATHS` thêm `SECRET_BOX_TICK_PATH` (đúng một đường; đường giống tên vẫn bị chặn).
- `rankKudoIds(candidates, limit, { asOf?, tieBreak? })`: tham số thứ 3 từ `asOf` rời thành object; `tieBreak` mặc định `'newest'` nên thứ tự Highlight không đổi.
- `live-board-rewards-column-slot.tsx` (seam phase 05) chỉ còn dựng giao diện; dữ liệu do `rewards-column-data-loader.ts` lấy sau `requireSunner()`.

Decisions
- Hộp vẫn mở được sau `EVENT_END_AT`; không có `SECRET_BOX_LOCK_AT`, khoá là `EVENT_END_AT`. Không có cổng `LAUNCH_AT` (trước giờ mở không có hộp nào).
- Gift không dùng ảnh sản phẩm có thương hiệu bên thứ ba; hiện hộp mở phát sáng và tên quà.
- Tick dùng khoá theo transaction, không dùng khoá session (không an toàn sau transaction pooler).
- `NationalKudosFinalized` mang `senderId` thật của cả Kudo ẩn danh; phase 13 không được hiển thị nó (decision log).

Known gaps
- Tên quà bí ẩn, trọng số và tồn kho là giá trị tạm chờ BTC. Chưa có chỉ mục `kudo_hearts(created_at)` cho đợt quét. Đường pg_cron đến endpoint chưa chạy thử đầu-cuối.

## 2026-11-22 — Phase 09 (F009 Huy hiệu Hero)

Added
- `HeroTierQuery` (`getDistinctSenderCounts`, `getTiersByRecipientIds`, `distinctSenderCountSubquery`): cấp Hero tính khi đọc từ số người gửi khác nhau của Kudo public, một câu lệnh cho cả trang, không lưu cấp. Kudo ẩn danh được đếm; Kudo spam và Kudo tự gửi không.
- `tierFromCount` và `tierCountRange` (ngưỡng 1 / 5 / 10 / 21, định nghĩa một lần), kiểu `HeroTier` ở `features/hero-badges/schemas/`.
- `HeroBadge` và `HeroBadgeTooltip` (hover, focus, chạm; Esc đóng; mỗi lúc một tooltip) hiện trên mọi thẻ Kudo: Live board, Highlight, chi tiết, `/api/kudos`. Người gửi ẩn danh không có huy hiệu và không bị tra cấp.
- Migration `0014_kudos_hero_tier_index` (kèm `.down.sql`): chỉ mục từng phần `(recipient_id, sender_id) WHERE status = 'public'`. 50 người nhận: index-only scan, 0.11-0.17 ms.
- i18n `hero.<tier>.{label,tooltipTitle,tooltipBody}` (vi, en).

Changed
- `enrich-hero-tier.ts` và `kudo-card-hero-badge-slot.tsx` (seam phase 05) viết lại bằng dữ liệu thật; `kudo-card-sender.tsx` nhận `tabbable`, hiện huy hiệu cả khi không có phòng ban. Trang feed thêm một câu lệnh mỗi trang (4 thành 5).
- Trang Thể lệ đọc `hero.*` và vẽ bằng `HeroBadge`; bỏ `awardsPortal.rules.tiers`. Khoảng số đổi "1-4", "5-9" thành "1–4", "5–9".

Decisions
- Ảnh huy hiệu dùng lại từ phase 07, không dựng lại bằng CSS. Tooltip giữ nguyên văn Figma, xưng "bạn" kể cả trên huy hiệu người khác (mặc định của orchestrator, chờ user xem lại).
- `getDistinctSenderCounts` nhận executor tùy chọn để phase 13 đọc trước/sau trong transaction ghi Kudo (C-04). Phase 14 dùng `distinctSenderCountSubquery` và `tierCountRange` cho cột/bộ lọc Level (C-12).
- Chỉ mục từng phần phụ thuộc pool `prepare: false`.

## 2026-11-22 — Phase 08 (F007 Kiểm duyệt của Admin & Kudo spam của chủ bài)

Added
- Trang `/admin/review` (Review content): bảng mọi Kudo, cả Public lẫn Spam, 10 dòng mỗi trang, mới nhất trước hoặc theo tim. Lọc theo khoảng ngày (cắt theo `ADMIN_TIMEZONE`), người gửi, người nhận, trạng thái; tìm theo nội dung không phân biệt hoa thường và dấu (`public.f_unaccent`). Bộ lọc nằm trên URL; `?page` quá cuối được kẹp về trang cuối.
- `KudoAdminQuery` (`list`, `listForExport`) và một bộ dựng `WHERE` dùng chung cho bảng, đếm và Export. Admin thấy người gửi thật của Kudo ẩn danh kèm nhãn "Ẩn danh" (C-13, phía admin). Module tách hẳn khỏi `KudoPublicQuery`, không dùng chung mapper.
- Mark Spam và Un Spam (`markKudoSpam`, `unSpamKudo`): một `UPDATE kudos ... WHERE id AND status = :from RETURNING` trong một transaction, nên lệnh trùng hoặc đua nhau chỉ đổi đúng một lần (bên còn lại nhận `changed: false`). Chỉ lần public → spam thật sự ghi `KudoMarkedSpam{kudoId, ownerId, moderatedAt}` vào outbox cùng transaction (producer của C-01); Un Spam không phát sự kiện. Bấm mục trong popover là xác nhận, không nhập lý do.
- `GET /api/admin/kudos` (JSON, cùng tham số với trang) và `GET /api/admin/kudos/export` (CSV `kudos-{yyyyMMdd-HHmm}.csv`, UTF-8 BOM, chặn công thức qua serializer phase 01). Mã lỗi: 401 `unauthorized`, 403 `forbidden` (trước khi đọc tham số), 400 `invalid_params` / `invalid_date_range`, 422 `export_too_large`, 500 `unexpected`. Mọi phản hồi `Cache-Control: private, no-store`.
- `requireAdminApi()` (`features/admin-moderation/server/admin-api-guard.ts`): cổng admin cho route handler, trả JSON thay vì redirect.
- Migration `0013_kudos_moderation_columns` (kèm `.down.sql`): `kudos.moderated_by` (FK `profiles`, `ON DELETE SET NULL`) và `kudos.moderated_at`; CHECK một chiều `moderated_by IS NULL OR moderated_at IS NOT NULL`. Chỉ lưu lần kiểm duyệt gần nhất, không có bảng lịch sử.
- Chủ bài thấy Kudo spam của mình (trang chi tiết `/kudos/{id}`, và thẻ ở Profile "Đã gửi" khi phase 12 làm): nội dung làm mờ, lớp cảnh báo "Cảnh báo vi phạm tiêu chuẩn cộng đồng" không đóng được, nhãn "Spam" cam. Chữ vẫn nằm trong DOM cho trình đọc màn hình; mọi phần tử dưới lớp phủ bỏ khỏi thứ tự Tab (`tabIndex=-1`, ảnh chi tiết không còn là link), chỉ "Đóng" nhận focus.
- i18n `adminModeration.*` (vi, en). `/admin/review` thêm vào `npm run test:prod`.

Changed
- Lớp phủ trên thay ghi chú "khoá sửa" của phase 05. Bỏ khoá `kudosFeed.card.spamTag` và `kudosFeed.card.spamLocked`.
- `KudoBodyMarkdown` và `KudoCardPeople` nhận `tabbable` để giữ link khỏi thứ tự Tab.
- Docblock `shared/admin/export-limit.ts`: đọc tối đa `EXPORT_MAX_ROWS + 1` dòng rồi gọi `assertWithinExportLimit`.

Decisions
- Figma thắng plan: huy hiệu Public viền và chữ xanh `#3174C6`, Spam vàng; nhãn "Spam" của chủ bài cam `#FF8104`.
- Live board không liệt kê Kudo spam của chính người viết (giữ phase 05; `includeOwnSpam` chưa có nơi gọi). Thẻ làm mờ hiện ở trang chi tiết bây giờ và ở Profile "Đã gửi" ở phase 12.
- Số tim trong bảng admin là số thô (D010), dùng `heartCountsSubquery` của phase 06; không tạo seam riêng. Không tạo wrapper `unaccent` mới (đã có từ migration 0007). Không thêm index: đo ở 10k Kudo, trang danh sách dưới 15 ms, tìm có dấu khoảng 95 ms.
- Export đọc một lần tối đa `EXPORT_MAX_ROWS + 1` dòng; có dòng thừa thì 422, không tạo tệp, nên Kudo chèn thêm giữa chừng không đẩy tệp quá trần.

Security
- Vai trò admin đọc từ DB mỗi request; trang, hai route và hai action đều gọi guard trước khi đọc tham số hay ghi. Lỗi admin API chỉ có `{ code }`, không kèm dữ liệu Kudo. Người gửi thật chỉ có trong `AdminKudoRow`, sau guard.
- `q` tối đa 200 ký tự, ký tự `%`, `_`, `\` được escape; giá trị luôn đi qua tham số SQL.

Tests
- Tester: unit 649/649, integration 317/317, e2e đầy đủ 93 qua, 5 bỏ qua, 0 lỗi; `test:e2e:prelaunch` 5 qua, 1 bỏ qua; `test:prod` 13/13. Chưa đo coverage (chưa cài `@vitest/coverage-v8`).
- User ký duyệt rủi ro phase 08 (2026-11-22).
- Review phase 08: 0 critical. Hai warning (thứ tự Tab dưới lớp phủ, phân trang không kẹp) và S1 (Export đọc có giới hạn) đã sửa theo decision-log.

Deferred
- Chưa có e2e cho en-locale và mobile của màn Review content; e2e thứ tự Tab cho thẻ spam ở Profile "Đã gửi" thuộc phase 12.
- `KudoMarkedSpam` đã vào outbox nhưng chưa có bộ tiêu thụ (F013, phase 13).
- Không có lý do kiểm duyệt và không có lịch sử (D004, D008).

Docs
- Quyết định ở `spec/decision-log.md` (phiên 2026-11-22, Phase 08). `docs/system/architecture.md` có mục "Kiểm duyệt của Admin (F007)". F007 `technical-spec.md` sửa theo hàng; SCR014, SCR015 cập nhật. `functional-spec.md` và phần nháp còn lại của `technical-spec.md` chờ `rebuild-spec`.

## 2026-11-22 — Phase 07 (F006 Cổng giải thưởng & cổng prelaunch)

Added
- Cổng prelaunch là bước 5 của session proxy (`features/awards-portal/server/prelaunch-gate.ts`, `prelaunch-gate-step.ts`). Trước `LAUNCH_AT`, người đã đăng nhập không phải Admin vào trang ngoài danh sách cho phép bị chuyển `/countdown`; Server Action, `/api/*` và method khác GET/HEAD nhận JSON 403 `{ code: "prelaunch" }`. Từ `LAUNCH_AT`, `/countdown` chuyển `/`. Admin được vào mọi trang. Tra role fail closed, chỉ chạy khi đang prelaunch trên đường bị chặn.
- Năm trang: `/countdown` (công khai, DAYS/HOURS/MINUTES tới `LAUNCH_AT`), Homepage `/` (hero + đếm ngược tới `EVENT_AT`, bài chủ đề, 6 thẻ giải, banner Sun* Kudos), `/awards` (menu neo + 6 khối giải), `/rules` (khung phải 553px), `/community-standards`.
- `AWARDS` (`features/awards-portal/data/awards-data.ts`): một nguồn cho 6 giải, Homepage và `/awards` cùng đọc. `CountdownTimer` tính theo giờ máy chủ (`request-time.ts`, `countdown-parts.ts`), font số DSEG7 Classic (SIL OFL 1.1) tự chứa.
- i18n key `awardsPortal.*` (vi, en); `APP_ROUTES.countdown`.
- `npm run test:e2e:prelaunch` (`playwright.prelaunch.config.ts`) và `globalSetup` cho `npm run test:e2e` (`tests/e2e/global-setup-require-launched-server.ts`).

Changed
- `isEventWritingOpen` (`shared/config/event-window.ts`) nay là `LAUNCH_AT ≤ now < EVENT_END_AT`: tạo/sửa Kudo, ký ảnh và thả tim cùng bị chặn trước giờ mở, kể cả Admin (Admin xem được trang, không ghi được). Proxy chỉ chặn tải trang nên đây là lớp đỡ cho Server Action gửi tới đường được phép.

Decisions
- Allowlist trước giờ mở chỉ gồm Login, Countdown, `/auth/callback`, `/access-denied`; `/awards` không còn trong đó (đè lên F006 D002). Countdown không có liên kết sang thông tin giải (khớp Figma). Admin vượt cổng (D003).
- `/rules` có URL riêng, vẽ thành khung phải 553px; "Đóng" về trang trước (không có lịch sử cùng origin thì về `/`), "Viết KUDOS" tới `/kudos`.
- Nút bút nổi trên Homepage chưa làm (giữ F003 D014 và F002 D003).
- E2E trước giờ mở chạy trên `next build` + `next start -p 3100` với `LAUNCH_AT` = now + 30 ngày, vì một thư mục chỉ có một `next dev`.
- Chấp nhận: trước giờ mở, `choose-department-action` và đổi ngôn ngữ vẫn chạy khi gửi tới đường được phép (chỉ ghi hồ sơ của chính người dùng; đăng xuất và đổi ngôn ngữ phải luôn mở).

Security
- Cổng quyết định trên giờ máy chủ và role đọc từ DB, không từ cookie hay input; lỗi tra role coi như không phải Admin.
- Request không phải tải trang không bao giờ bị redirect (307 làm `fetch` gửi lại POST), mà nhận 403.

Tests
- Review phase 07: SEALED, 0 critical. Unit 598 qua, integration 269 qua; `test:e2e:prelaunch` 5 qua, 1 bỏ qua; e2e đầy đủ trên server khởi động lại 84 qua, 5 bỏ qua (lần chạy đầu đỏ 10 test của kudos do dev server chạy từ 11/17 bị chậm, không thuộc phase 07).

Deferred
- Footer thêm mục "Thể lệ" (en "Rules") trỏ tới `/rules`, cạnh "Tiêu chuẩn chung" — lối vào duy nhất tới trang này khi nút nổi Figma còn hoãn (user chọn 2026-11-22).
- Nút tim báo `EVENT_ENDED` cho Admin trước giờ mở (cận mới `LAUNCH_AT`); chưa có tag log riêng khi tra role lỗi; chưa có câu báo lỗi riêng cho "chưa mở" thay `WRITING_CLOSED`.
- Nội dung Thể lệ và Tiêu chuẩn cộng đồng chờ bản chữ cuối từ BTC (F006 D007).

Docs
- Quyết định ở `spec/decision-log.md` (phiên 2026-11-17 và 2026-11-22). `docs/system/architecture.md` có mục "Cổng prelaunch và cổng thông tin". F006 `technical-spec.md` và 5 spec màn hình SCR009–SCR013 cập nhật; `functional-spec.md` § 3 Open Decisions còn ghi allowlist cũ (do `rebuild-spec` giữ).

## 2026-11-17 — Phase 06 (F005 Thả tim & F011 Campaign x2)

Added
- Thả tim và bỏ tim Kudo công khai (F005): idempotent, cấm tự tim Kudo của mình, Kudo spam không nhận tim mới. Hệ số x2 lấy từ campaign đang chạy tại thời điểm tim và được lưu cùng dòng tim.
- `KudoHeartService`: câu lệnh `INSERT … SELECT … ON CONFLICT DO NOTHING` vừa kiểm tra vừa ghi, nên 20 lần tim đồng thời chỉ tạo 1 dòng và 1 sự kiện `HeartAdded` trong outbox, cùng transaction.
- Truy vấn tim: tóm tắt tim theo lô cho thẻ (`KudoHeartQuery`); `HeartStatsQuery.receivedByUsers(ids, asOf)` cộng hệ số và đếm thô trên Kudo người đó đã gửi, bỏ Kudo spam và tim sau `asOf`; `HeartRankingQuery.rankKudoIds` xếp Highlight theo số tim thô, rồi tới thời điểm mới nhất, rồi id.
- Admin › Settings (`/admin/settings`): danh sách, thêm, sửa, xóa campaign x2. Campaign không được chồng lấp, ràng buộc EXCLUDE trong DB chặn cả khi hai admin tạo cùng lúc. Giờ nhập theo `ADMIN_TIMEZONE`.
- Migration `0010_kudo_hearts`, `0011_campaigns`, `0012_campaigns_no_overlap_exclude`, mỗi file có `.down.sql`. RLS bật, không policy cho client.
- Thay hai seam của phase 05: `enrich-heart-summary.ts` và `kudo-card-heart-slot.tsx`. Thẻ hiện số tim thật; Highlight xếp theo tim thật.
- `zonedDateTimeToUtc` trong `shared/admin/timezone.ts`.
- i18n `kudosHearts.*` và `adminCampaigns.*` (vi, en).

Changed
- `heartCountsSubquery(kudoIds, asOf?)` nhận tập kudo id bắt buộc, không quét toàn bảng tim.
- Trang chi tiết `/kudos/{id}` truyền trạng thái mở ghi vào nút tim, giống feed.
- Playwright giới hạn 3 worker khi chạy local (CI giữ mặc định); timeout không đổi.

Decisions
- Thẻ Kudo hiện số tim thô, không nhân x2; x2 chỉ nhân tiến độ Secret Box (phase 10).
- Sau `EVENT_END_AT`: khóa thả tim và bỏ tim; campaign đã kết thúc không sửa, không xóa.
- Phase 08 không có seam `admin-kudo-heart-counts.ts`; dùng thẳng `heartCountsSubquery`.
- Chưa thả tim hiện viền đỏ; ô ngày giờ dùng `datetime-local` của trình duyệt, style theo Figma.
- `campaigns.id` là bigint identity; payload `HeartAdded` không có hệ số.

Security
- `userId` lấy từ session, không từ input. Kết quả tim chỉ trả số đếm và trạng thái của người xem; không lộ ai đã tim.
- Mọi action và truy vấn của Admin › Settings gọi `requireAdmin()` trước; test xác nhận người không phải admin nhận 403 và không có dữ liệu bị ghi.
- Payload outbox chỉ có id, không có nội dung lời nhắn.

Fixed (trong vòng review, chưa ship; đều là Warning)
- Năm 0–99 bị đổi thành 1900s khi đổi múi giờ; sửa ở hàm dùng chung, nên bộ lọc khoảng ngày của phase 01 cũng đúng.
- Esc không đóng hộp thoại sau khi lưu lỗi (focus rơi xuống body); nay Esc hoạt động, focus giữ trên nút.
- Bấm tim bị khóa trên màn cảm ứng không có phản hồi; nay hiện toast lý do.
- Test Highlight bị chen khỏi top 5 và test seed campaign dễ flake; nay dành hashtag riêng và seed dựa trên ràng buộc EXCLUDE.

Deferred
- Lỗi truy vấn tim làm lỗi cả trang (chưa có soft-error như US003).
- Chưa đo `heartCountsSubquery` với khoảng 50.000 tim; chưa có script coverage.
- Chưa reset store tim khi đăng xuất; `useHydrated` còn trùng; comment migration `0012` nhắc sai index GiST (sửa ở lần chạm migration sau).
- Chưa có e2e cho trạng thái khóa sau khi sự kiện kết thúc.
- Năm tối thiểu cho `adminDateRangeSchema` của phase 01 (đang nhận năm 0000–1999) do chủ phase 01 quyết.

Docs
- Quyết định ghi trong `spec/decision-log.md` (phiên 2026-11-16 và 2026-11-17).
- `docs/system/architecture.md` có mục "Thả tim và Campaign x2". `docs/features/F005_KudosHearts/*` và `F011_AdminCampaigns/*` chưa cập nhật tay.

## 2026-11-16 — Phase 05 (F004 Kudos feed & detail)

Added
- Trang Live board `/kudos` (RSC): Highlight carousel (tối đa 5 thẻ, lọc theo Hashtag và Phòng ban), All Kudos feed với "Tải thêm" theo cursor (10 thẻ/trang, mới nhất trước), thẻ Kudo (có biến thể ẩn danh), Copy Link, tìm Sunner.
- Trang chi tiết `/kudos/{id}` (Figma 520:18779) có Copy Link và trang "không tìm thấy" dùng chung.
- `features/kudos-feed/`: `KudoPublicQuery` (`list`, `findForViewer`, `publicKudoIdsSubquery`) là đường đọc công khai duy nhất; `maskKudoRow` che người gửi ẩn danh; cursor `(created_at, id)`; parser Markdown rút gọn có whitelist (không HTML, không ảnh Markdown, chỉ link http(s) không kèm thông tin đăng nhập).
- Route handler `GET /api/kudos` (cursor) và `GET /api/kudos/highlight` (hashtag, department).
- Migration `0009_kudos_feed_indexes.sql`: ba index `(status | recipient_id | sender_id, created_at DESC, id DESC)`. EXPLAIN trên 10.000 Kudo: mọi truy vấn đều dùng index, dưới 0,35 ms.
- Seam `enrich-heart-summary.ts` (phase 06 sẽ thay) và `enrich-hero-tier.ts` (phase 09 sẽ thay); hiện trả giá trị mặc định (0 tim, không có tier, xếp hạng theo thời gian).
- i18n `kudosFeed.*` (vi, en).

Changed
- Nút mở composer chuyển từ `/` sang `/kudos`; xóa deep link `/?editKudo` và `ic-pencil.svg`.

Decisions
- Hashtag 1–5 (decision-log 2026-11-15).
- Người gửi ẩn danh chỉ có `{ anonymous: true, nickname }`.
- `/kudos/{id}`: id sai, không tồn tại, hoặc spam của người khác đều ra cùng một trang "không tìm thấy". Đây là soft 404 (status 200 trên production), theo quyết định người dùng 2026-11-16.
- Bút sửa ẩn sau `EVENT_END_AT` và trên Kudo spam; trang chi tiết không có bút sửa.
- Ô tìm Sunner debounce 250 ms (combobox dùng chung với phase 04).

Security
- Người gửi ẩn danh không tới trình duyệt: JSON và RSC payload không có id, tên, email hay avatar (test quét HTML thô của `/kudos` và `/kudos/{id}`).
- Bộ lọc `senderId` không lộ Kudo ẩn danh của người khác; `includeOwnSpam` chỉ có hiệu lực khi `senderId` là chính người xem.
- Route dữ liệu trả 401 JSON khi không có session; response không cache.

Fixed (trong vòng review, chưa ship; các mục đều là Warning)
- Bút sửa còn hiện sau `EVENT_END_AT`; dropdown lọc và "Tải thêm" chưa đạt yêu cầu bàn phím và trình đọc màn hình; cursor năm 0000 chưa bị từ chối (nay 400); link Markdown có username/password và ảnh Markdown chưa được xử lý đúng.

Deferred
- Test "đóng cửa ghi → không có bút" chưa có wiring tự động; test layout với 1–2 thẻ Highlight; row 400 cho cursor năm 0000 trong route test; coverage chưa đo (chưa có script).
- Bộ lọc `senderId` và `recipientId` trên `publicKudoIdsSubquery` cho phase 10/12 (phải kèm guard người xem).

Docs
- `docs/system/architecture.md` chưa có mục đọc Kudo (F004); `docs/features/F004_KudosFeed/*` chưa cập nhật tay.

## 2026-11-16 — Phase 04 (F003 Kudos authoring)

Added
- Schema `shared/db/schema/kudos.ts` và migration `0006_kudos.sql`, `0007_kudos_constraints.sql`, `0008_kudos_review_fixes.sql`: bảng `kudos`, `kudo_hashtags`, `kudo_images`, `kudo_image_uploads`, enum `kudo_status`; CHECK không tự gửi, lời nhắn 1–1000 ký tự và không rỗng, danh hiệu không rỗng, nickname ẩn danh 1–30; hàm `public.f_unaccent`; RLS bật, không có policy cho client.
- `features/kudos-authoring/`: Server Action `createKudo` (ghi `kudos` + bảng con + outbox `KudoCreated` trong một transaction) và `updateKudo`; modal soạn Kudo (tạo / sửa) và `KudoComposerLauncher` trên trang chủ.
- `features/sunner-search/`: tìm Sunner không phân biệt dấu tiếng Việt, tham số `excludeSelf`.
- Route handler: `GET /api/sunners/search`, `GET /api/hashtags`, `POST /api/kudos/images/sign`, `GET /api/kudos/{id}/edit`.
- Quy ước route handler dữ liệu và Server Action ghi trong `docs/code-standards.md`; mục "Ghi Kudo" trong `docs/system/architecture.md`.

Decisions
- Cửa ghi đóng từ `EVENT_END_AT` (403 `WRITING_CLOSED` ở action và route ký ảnh).
- Sửa Kudo: chỉ chủ bài (403 `FORBIDDEN`), Kudo spam không sửa được (423 `SPAM_LOCKED`), không đổi người nhận, không có thao tác xóa.
- Ảnh: đường dẫn `kudos/{uuid}.{ext}` không chứa id người gửi; chỉ nhận đường dẫn chính người đó đã ký. Thay quy tắc cũ "ảnh nằm trong thư mục của người gửi".
- Lời nhắn là Markdown rút gọn lưu nguyên văn; cấm ảnh Markdown và link tham chiếu. Phase 05 phải render bằng whitelist (`research/phase-04-backend-contracts.md` § 1.1). Hashtag 1–5, danh hiệu tùy chọn ≤ 50.

Security
- Trần 20 lượt ký upload ảnh chưa dùng / người / 24 giờ (429 `UPLOAD_LIMIT`) và body route ký tối đa 4 KB (413, không parse).
- Route nạp dữ liệu sửa trả `Cache-Control: private, no-store`; mã lỗi không kèm nội dung Kudo.

Deferred
- Job dọn ảnh mồ côi, kiểm magic byte ảnh, chỉ mục trigram cho tìm Sunner, vô hiệu hóa profile mềm.

Docs
- `docs/features/F003_KudosAuthoring/*` chưa cập nhật tay (vượt ngưỡng sửa cục bộ): chạy `/tkm:rebuild-spec --features F003`.

## 2026-11-15 — Phase 02 (F001 Auth) + Phase 03 (F002 App shell)

Added
- Đăng nhập Google (PKCE) giới hạn `@sun-asterisk.com`: màn Login, `/auth/callback`, đăng xuất, chọn phòng ban lần đầu (`/onboarding/department`).
- `proxy.ts` + `shared/auth/session-proxy.ts`: làm mới session bằng `getUser()`, chuyển khách tới `/login?next=…`, `/api/` trả JSON 401, `/admin/*` của người không phải Admin trả 403 thật (HTML `/access-denied`; non-GET hoặc server action: JSON 403). Chi tiết ở `docs/system/architecture.md`.
- Guard `requireSunner()` / `requireAdmin()` (`shared/auth/`); `authInterrupts: true` trong `next.config.ts` cho `forbidden()` / `unauthorized()`.
- Migration `0004_profiles.sql` (bảng `profiles`, `department_id` uuid nullable) và `0005_auth_user_triggers.sql`: auth hook `before_user_created`, trigger chặn domain khi insert và khi đổi email, `create_sunner_profile`, `sync_profile_email`.
- App shell: layout Sunner và Admin, `LanguageSwitcher` (cookie `NEXT_LOCALE`), `AccountMenu`, trang 404 và 403, chọn locale ở `shared/i18n/resolve-locale.ts`.
- Biến `INTERNAL_APP_ORIGIN` (tùy chọn) trong `shared/config/env-schema.ts` và `.env.example`.
- Script `npm run test:prod` (build trước): kiểm status HTTP thật trên `next start`.
- Quy tắc auth và test mới trong `docs/code-standards.md`.

Security
- Open redirect: mọi đích `next` đi qua `safeNextPath()` (chặn `//host`, `\`, ký tự điều khiển, dot-segment sau chuẩn hóa).
- SSRF ở bước proxy tự fetch `/access-denied` cho 403: origin lấy từ `INTERNAL_APP_ORIGIN` hoặc `http://127.0.0.1:$PORT`, không từ `Host` / `x-forwarded-*`; chỉ chuyển cookie locale và `Accept-Language`, `redirect: "manual"`, timeout 5 giây.
- Matcher của proxy thu hẹp: chỉ loại `_next/static/`, `_next/image`, `images/`, `fonts/`, `favicon.ico`, `robots.txt`, `sitemap.xml`; không loại theo đuôi file, nên Route Handler như `/api/admin/export.xml` vẫn qua cổng session.
- Trigger domain tách thành `_on_insert` và `_on_email_change` (chỉ khi email đổi): tài khoản có sẵn ngoài domain không bị khóa khi GoTrue ghi lại cột khác; đổi email sang NULL hoặc domain lạ vẫn bị chặn.

Decisions
- Trang 404 là trang trần theo Figma; CTA "Về trang chủ" khi đã đăng nhập, "Đăng nhập" cho khách (thay D005 của F002). Trang 403 giữ nút "Về trang chủ".
- Khách vào `/` chuyển tới `/login` không kèm `?next=%2F`.
- `redirectTo` của OAuth Google hoãn tới khi chọn hosting (checklist go-live trong decision-log).
- Hosting phải cho server tự gọi được origin nội bộ (`INTERNAL_APP_ORIGIN`); phase 07 phải cho khách vào `/access-denied`.

## 2026-11-15 — Phase 01: Foundation & infrastructure

Added
- Supabase local qua CLI + Docker (`supabase/config.toml`, `project_id = saa-2025-kudos`).
- Cấu hình env bằng Zod ở `shared/config/**`, kiểm tra fail-fast trong `next.config.ts`; `SKIP_ENV_VALIDATION=1` chỉ dùng trong `scripts/typecheck.mjs`. Mốc thời gian sự kiện, `ADMIN_EMAILS`, tham số game và admin nằm trong `.env.example`.
- Drizzle client một pool (`shared/db/client.ts`) và schema barrel `shared/db/schema/index.ts`.
- Migration `db/migrations/0000`–`0003`: dữ liệu tham chiếu (`departments`, `hashtags`), `domain_event_outbox`, RLS baseline + REVOKE quyền `anon`/`authenticated`, bucket Storage `kudo-images` (riêng tư, JPG/PNG/WEBP, 5 MB).
- Domain event outbox `shared/events/**` (`add(tx, …)` trong transaction nghiệp vụ).
- Seed `db/seeds/**`: 6 phòng ban, 8 hashtag, danh mục Secret Box tạm.
- `shared/admin/**`: CSV serializer (BOM, chặn formula), lọc khoảng ngày, múi giờ `Asia/Ho_Chi_Minh`, giới hạn export.
- next-intl nền (cookie `NEXT_LOCALE`, không tiền tố URL, `messages/vi.json`, `en.json`).
- Token Tailwind 4 `@theme` từ Figma, font Montserrat.
- Vitest (unit, integration) và Playwright; script npm `typecheck`, `lint`, `test:unit`, `test:integration`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`, `db:reset`.
- Tài liệu: README, `docs/code-standards.md`, `docs/development-roadmap.md`, file này.

Decisions
- Root layout `instant = false` (xem `plans/261108-0048-saa-2025-kudos-platform/spec/decision-log.md`).
- C-18: server action cho form/mutation nội bộ; route handler cho đọc và endpoint cần header đặc thù.
