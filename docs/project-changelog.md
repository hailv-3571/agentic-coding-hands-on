---
lang: vi
---

# Changelog

Mới nhất ở trên. Mỗi phase hoàn thành thêm một mục.

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
