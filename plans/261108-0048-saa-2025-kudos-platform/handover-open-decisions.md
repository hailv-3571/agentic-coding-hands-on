---
status: draft
authored_by: doc-writer
created: 2026-11-23
lang: vi
---

# Bàn giao SAA 2025 Kudos Platform — các việc còn chờ chủ sản phẩm và BTC

14 phase đã giao. Tài liệu này gom mọi quyết định còn mở để chủ sản phẩm (PO) và BTC xem một lần. Mỗi dòng có link về dòng nguồn trong [spec/decision-log.md](spec/decision-log.md) hoặc file phase. Quyết định user đã tự chọn (hashtag tối đa 5, `/rules` 553px, DSEG7, soft 404, chữ ký rủi ro...) **không** liệt kê lại.

Mục lục: [A. Mặc định chờ PO](#a-quyết-định-mặc-định-chờ-chủ-sản-phẩm-xem-lại) · [B. Câu chữ chờ BTC](#b-câu-chữ-chờ-btc-xác-nhận) · [C. Cố ý để lại](#c-đã-cố-ý-để-lại-không-làm) · [D. Việc trước go-live](#d-việc-kỹ-thuật-trước-go-live-không-phải-quyết-định) · [E. Còn lại sau hardening](#e-còn-lại-sau-vòng-hardening-2026-11-24)

Cách trả lời: ghi "giữ" hoặc "đổi thành ...". Mục "Đổi thì sửa ở" cho biết chỗ sửa; nếu đổi thì ghi lại vào decision log.

## A. Quyết định mặc định chờ chủ sản phẩm xem lại

Do orchestrator chọn theo phiên 2026-11-22/23 (đề xuất bám Figma, giữ quyết định cũ, ít rủi ro). Mặc định là hiện đang chạy trong code.

### Phase 07 — Cổng Awards Portal

| ID | Đã chọn | Phương án khác | Đổi thì sửa ở | Nguồn |
|----|---------|----------------|---------------|-------|
| A07-1 | Trước giờ mở, action chọn phòng ban và đổi ngôn ngữ vẫn chạy nếu gọi thẳng (action giải theo id). Chấp nhận vì chỉ ghi hồ sơ của chính mình | Chặn trong `choose-department-action` | `features/auth/server/choose-department-action.ts` + test | [L134](spec/decision-log.md#L134), [O5](phase-07-awards-portal.md#L167) |

### Phase 09 — Huy hiệu Hero

| ID | Đã chọn | Phương án khác | Đổi thì sửa ở | Nguồn |
|----|---------|----------------|---------------|-------|
| A09-1 | Badge dùng lại ảnh Figma xuất ở phase 07 (`public/images/awards-portal/hero-tag-*.webp`) cho mọi cỡ | Dựng lại bằng CSS | `features/hero-badges/components/hero-badge.tsx` | [L157](spec/decision-log.md#L157) |
| A09-2 | Tooltip giữ nguyên văn Figma, xưng "bạn" cả trên huy hiệu người khác; một nguồn message với trang Thể lệ; khoảng số dùng gạch "–" | Câu riêng cho huy hiệu người khác | `hero.*.tooltipTitle/tooltipBody` trong `messages/*.json` | [L158](spec/decision-log.md#L158), [phase 09 L122](phase-09-hero-badges.md#L122) |

### Phase 10 — Secret Box

| ID | Đã chọn | Phương án khác | Đổi thì sửa ở | Nguồn |
|----|---------|----------------|---------------|-------|
| A10-1 | Không dùng ảnh quà trong Figma (áo phông có logo bên thứ ba); quà hiện bằng hộp mở phát sáng + tên quà | Ảnh riêng từng quà qua catalog | `features/secret-box-rewards/components/` + `db/seeds/secret-box-prize-catalog.ts` | [L161](spec/decision-log.md#L161) |
| A10-2 | Nền modal dùng lớp phủ chung `rgba(0,16,26,0.8)`; icon Secret Box dùng ảnh huy hiệu phase 07; khối "10 Sunner thăng hạng mới nhất" (ẩn trong Figma) ngoài phạm vi | Ảnh nền tối 20% của Figma; làm thêm khối thăng hạng | `features/secret-box-rewards/components/` | [L162](spec/decision-log.md#L162) |
| A10-3 | Route tick `/api/internal/secret-box/tick` nằm trong `PUBLIC_PATHS` của proxy (đúng một đường); tự kiểm `x-job-secret`, thiếu cấu hình → 503. Có chạm bảo mật nhưng không đổi quyết định đã chốt | Cron máy chủ gọi curl mỗi phút (dự phòng đã ghi) | `shared/auth/public-paths.ts` | [L168](spec/decision-log.md#L168) |
| A10-4 | Mở box vẫn được sau `EVENT_END_AT`; không có cổng `LAUNCH_AT` cho việc mở | Khoá mở sau sự kiện | `features/secret-box-rewards/server/` | [L169](spec/decision-log.md#L169) |

### Phase 11 — Spotlight

| ID | Đã chọn | Phương án khác | Đổi thì sửa ở | Nguồn |
|----|---------|----------------|---------------|-------|
| A11-1 | Tìm: tên khớp giữ nguyên, không khớp mờ còn 25%. Tên sự kiện mới nhất tô `#F17676` vài giây. Ticker 5 dòng (D006; Figma vẽ 6), độ mờ 100/100/70/50/30. Vị trí tên cố định theo user id | Ticker 6 dòng như Figma | `features/spotlight-board/components/spotlight-ticker.tsx`, `TICKER_HISTORY_ON_LOAD` | [L167](spec/decision-log.md#L167) |
| A11-2 | Bậc cỡ tên `tier = 4 − floor(rank·4/k)` trên số Kudo khác nhau; điện thoại tối đa 24 tên, bảng cao 460px; policy `realtime.messages` siết thêm điều kiện topic | — | `features/spotlight-board/` | [L177](spec/decision-log.md#L177) |
| A11-3 | Sau `removed`/`restored` bảng tự lấy lại snapshot sau 2–3 s; snapshot không cache (cân nhắc TTL 1–2 s nếu Kudo ≥ 100k); sự kiện `removed` lộ kudoId + người nhận của Kudo bị ẩn cho client đã đăng nhập (Kudo từng công khai nên chấp nhận) | Thêm TTL cache | `features/spotlight-board/server/` | [L178](spec/decision-log.md#L178), [phase 11 L146-152](phase-11-spotlight-board-realtime.md#L146) |

### Phase 12 — Profile

| ID | Đã chọn | Phương án khác | Đổi thì sửa ở | Nguồn |
|----|---------|----------------|---------------|-------|
| A12-1 | Hover card theo Figma 2268:35101: tên (link), "Tên đơn vị", huy hiệu Hero, số Kudo nhận/gửi, nút "Gửi KUDO" (ẩn trên thẻ của mình); không avatar | "Xem profile" như D004 | `features/profile/components/sunner-card-content.tsx` | [L174](spec/decision-log.md#L174), [L186](spec/decision-log.md#L186) |
| A12-2 | "Kudos đã gửi" của **người khác** không tính Kudo ẩn danh (tránh lộ ai vừa gửi ẩn danh); trang của chính mình vẫn tính. Ảnh hưởng quyền riêng tư | Tính cả ẩn danh | `KudoPublicQuery.count` ở `features/kudos-feed/server/kudo-public-query.ts` | [L175](spec/decision-log.md#L175) |
| A12-3 | Trang người khác chỉ có "Đã nhận" + nút "Gửi lời cảm ơn và ghi nhận tới {tên}"; chú thích "Bộ sưu tập icon" | — | `features/profile/components/` | [L176](spec/decision-log.md#L176) |
| A12-4 | Hover card: bộ nhớ đệm 60 s (có thể hiện số cũ tới 60 s), focus chuyển tay (Tab từ tên vào thẻ, 2 điểm Tab thêm nếu dừng ≥ 300 ms); tự vào id của mình → `/profile`, id lạ → "Không tìm thấy Sunner này." (404 mềm) | TTL ngắn hơn | `features/profile/lib/sunner-card-cache.ts`, `features/profile/components/use-hover-card-keyboard.ts` | [L187](spec/decision-log.md#L187) |

### Phase 13 — Thông báo

| ID | Đã chọn | Phương án khác | Đổi thì sửa ở | Nguồn |
|----|---------|----------------|---------------|-------|
| A13-1 | Chỉ 7 loại thông báo thật (Kudo mới, tim, Secret Box, thăng hạng Hero, Kudo bị ẩn, đủ 6 icon, Kudos Quốc Dân); bỏ dòng mẫu của Figma và thông báo "lời nhắn cần xem xét" cho Admin; Kudo ẩn danh dùng nickname | Làm thêm loại thông báo | `features/notifications/server/map-event-to-notifications.ts` | [L182](spec/decision-log.md#L182) |
| A13-2 | Thăng hạng Hero: "trước" = bậc cao nhất đã từng báo, "sau" = `tierFromCount` trong transaction (khác ALG-002 trong spec); nhảy nhiều bậc chỉ báo bậc đạt được; tụt bậc vì spam không mở lại | Theo ALG-002 (vị trí) | `features/notifications/server/detect-hero-tier-up.ts` | [L189](spec/decision-log.md#L189) |
| A13-3 | Thông báo Kudo bị ẩn dẫn tới `/kudos/{id}` (Figma) thay vì trang tiêu chuẩn (D007) | Dẫn sang Tiêu chuẩn cộng đồng | `features/notifications/server/map-event-to-notifications.ts` | [L189](spec/decision-log.md#L189) |
| A13-4 | Event lỗi thử lại giãn 1/2/4/8 phút (`OUTBOX_RETRY_BASE_DELAY_SECONDS = 60`, tối đa 5 lần, khoảng 15 phút) rồi `failed_at`. Chạy lại tay bằng SQL | Thử lại mỗi nhịp cron 5 s | `features/notifications/notification-config.ts` | [L190](spec/decision-log.md#L190) |

### Phase 14 — Admin User / Overview

| ID | Đã chọn | Phương án khác | Đổi thì sửa ở | Nguồn |
|----|---------|----------------|---------------|-------|
| A14-1 | Chọn ngày dùng ô date của trình duyệt (như phase 06) thay lịch AntD; sửa chính tả tiêu đề cột ("reveived", "atleast"); số "(100)" trên tiêu đề cột = tổng của bộ lọc hiện tại | Lịch AntD như Figma | `features/admin-users/components/admin-user-filters.tsx`, `features/admin-overview/components/` | [L185](spec/decision-log.md#L185) |
| A14-2 | Thứ tự kiểm tra đổi role: khoá admin theo id → NOT_FOUND → đã đúng role thì bỏ qua → SELF_DEMOTE → ENV_ADMIN → LAST_ADMIN → FORBIDDEN (người thao tác phải còn trong nhóm admin đã khoá). Bên thua khi hai admin hạ nhau nhận LAST_ADMIN. Ảnh hưởng phân quyền | Spec không nêu phương án khác; đổi thứ tự là đổi kết quả của bên thua khi hai admin hạ nhau (xem C1) | `features/admin-users/server/user-role-service.ts` | [L192](spec/decision-log.md#L192) |
| A14-3 | Mã lỗi export viết thường như phase 08 (`export_too_large` 422, `invalid_params`, `invalid_date_range` 400). Sắp xếp: không sort → tên A–Z; `dir` mặc định giảm dần; ô trống luôn cuối. Danh sách lọc thêm "Tất cả", "Chưa gán đơn vị", "Chưa có Level" | — | `app/api/admin/*/export/route.ts`, `features/admin-users/server/user-admin-query.ts` | [L192](spec/decision-log.md#L192), [L193](spec/decision-log.md#L193) |
| A14-4 | CSV User: tiêu đề tiếng Anh, Level "New Hero"…, ngày `dd/MM/yyyy HH:mm` giờ admin, ô trống thay "—", uuid đầy đủ; CSV Overview có dòng All đầu (xem B8 cho phần tiêu đề) | Tiêu đề tiếng Việt | `features/admin-users/server/user-export-columns.ts`, `features/admin-overview/server/overview-export-columns.ts` | [L192](spec/decision-log.md#L192) |
| A14-5 | Dòng của chính mình khoá nút ⋯ kèm chú thích; admin trong `ADMIN_EMAILS` có nhãn "Admin · env", "Set as User" tắt; lỗi đổi role hiện trong hộp xác nhận. Overview: dòng All không đánh số, đậm vừa (Figma thường, spec đậm); lỗi xuất file dùng chung câu của phase 08 | Câu lỗi riêng cho Overview như spec | `features/admin-users/components/admin-user-role-menu.tsx` | [L193](spec/decision-log.md#L193) |
| A14-6 | Tiêu chí "403/409" của tự hạ quyền, ENV_ADMIN, LAST_ADMIN, bị hạ giữa chừng hiểu theo **mã lỗi trong kết quả** `{ ok:false, error }` (server action), không phải mã HTTP. Trang và route export vẫn trả HTTP 403 cho người không phải admin | Trả HTTP status | `features/admin-users/server/set-user-role-action.ts` | [L194](spec/decision-log.md#L194) |

Chính sách chặn hạ role của admin trong `ADMIN_EMAILS` (409 `ENV_ADMIN`) **đã được user chốt 2026-11-15** ([L63](spec/decision-log.md#L63)); chỉ câu thông báo còn chờ BTC (xem B6).

## B. Câu chữ chờ BTC xác nhận

Mọi mục dưới đây sửa bằng JSON trừ khi ghi khác. Khi sửa, đổi cả `messages/vi.json` và `messages/en.json` (hai file phải đủ cùng khoá).

| # | Nội dung | Khoá / file cần sửa | Hiện trạng | Nguồn |
|---|----------|---------------------|------------|-------|
| B1 | **Bản tiếng Anh** (toàn bộ `en.json`) là bản dịch tạm | `messages/en.json` (cùng khoá với `vi.json`); riêng tooltip Hero: `hero.{new,rising,super,legend}.tooltipTitle/tooltipBody` | Chờ BTC dịch/duyệt | [phase 07 O1](phase-07-awards-portal.md#L163), [phase 09 L122](phase-09-hero-badges.md#L122), [phase 13 L150](phase-13-notifications.md#L150) |
| B2 | **Thể lệ** bản cuối | `awardsPortal.rules.*` (`receiversTitle`, `receiversIntro`, `sendersTitle`, `sendersBody`, `collectNote`, `nationalTitle`, `nationalBody`) | Nguyên văn Figma | [phase 07 O1](phase-07-awards-portal.md#L163), [D007](phase-07-awards-portal.md#L40) |
| B3 | **Tiêu chuẩn cộng đồng** bản cuối | `awardsPortal.standards.*` (`lead`, `intro`, `violations[]`, `securityIntro`, `securityItems[]`, `contact`) | Nguyên văn Figma | [phase 07 O1](phase-07-awards-portal.md#L163) |
| B4 | Câu `WRITING_CLOSED` khi **trước giờ mở** (Admin hoặc request tự chế thấy "Sự kiện đã kết thúc, không thể gửi hoặc sửa Kudo nữa.") | `kudosComposer.errors.WRITING_CLOSED`; muốn câu riêng cho trước giờ mở thì cần thêm khoá + sửa `features/kudos-authoring/server/create-kudo-action.ts` (dòng 21) và `update-kudo-action.ts` (dòng 20); đây là sửa code, không chỉ JSON | Dùng chung câu với "đã kết thúc" | [L132](spec/decision-log.md#L132), [O3](phase-07-awards-portal.md#L165) |
| B5 | Lý do khi thả tim **trước giờ mở** (nút báo "Sự kiện đã kết thúc, không thể thả tim nữa" cho Admin; `kudo-heart-service.ts` dòng 62 cùng ném `EVENT_ENDED` khi cửa ghi đóng) | `kudosHearts.errors.EVENT_ENDED`; muốn câu trung tính riêng cần thêm mã lỗi (code + test) | Còn mở | [O4](phase-07-awards-portal.md#L166) |
| B6 | Thông báo từ chối hạ **admin trong `ADMIN_EMAILS`** | `adminUsers.roleErrors.envAdmin` (vi: "Admin được cấu hình qua ADMIN_EMAILS. Hãy gỡ email khỏi ADMIN_EMAILS trước khi hạ role."); nhãn `adminUsers.role.envAdmin` ("Admin · env", `messages/*.json` dòng 799) | Chờ BTC | [phase 14 L165](phase-14-admin-users-and-overview.md#L165), [L167](phase-14-admin-users-and-overview.md#L167) |
| B7 | Thông báo **Kudos Quốc Dân** và "đủ 6 icon" | `notifications.types.national_kudos.ranked`, `notifications.types.national_kudos.plain`, `notifications.types.icon_set_completed` (`messages/*.json` dòng 745–749; `notifications.types` bắt đầu ở dòng 732); `MYSTERY_GIFT_NAME` ("Quà bí ẩn từ BTC SAA 2025") ở `features/secret-box-rewards/secret-box-config.ts:15` (code) | Chữ tạm (D006); câu E09 "đủ 6 icon" là suy ra | [phase 13 L150](phase-13-notifications.md#L150), [phase 10 L161](phase-10-secret-box-rewards.md#L161) |
| B8 | **Tiêu đề CSV** export. Users và Overview: tiếng Anh. Kudos: **tiếng Việt** (không phải tiếng Anh) | Code, không phải JSON: `USER_CSV_HEADER` (`features/admin-users/server/user-export-columns.ts:13`), `OVERVIEW_CSV_HEADER` (`features/admin-overview/server/overview-export-columns.ts:11`), `ADMIN_KUDO_CSV_HEADER` (`features/admin-moderation/server/admin-kudo-export.ts:13`); nhãn Level/Role cùng file user (`TIER_LABEL`, `ROLE_LABEL`) | Chờ BTC chốt ngôn ngữ chung | [phase 14 L167](phase-14-admin-users-and-overview.md#L167) |
| B9 | **Slack handle** `duong.thi.thuy.an` trong Tiêu chuẩn cộng đồng (giữ hay bỏ; xem xét quyền riêng tư) | `awardsPortal.standards.contact` (`messages/vi.json:543`, `en.json:543`) | Nguyên văn Figma | [O7](phase-07-awards-portal.md#L169) |
| B10 | Chữ **"Hoặc"** màu `#2E3940` trên nền `#00101A` chỉ ~1.5:1, không đạt WCAG AA (Figma là chuẩn) | `awardsPortal.awardsPage.or` (nội dung); màu nằm ở component trang Hệ thống giải (cần sửa CSS nếu đổi) | Giữ theo Figma | [O6](phase-07-awards-portal.md#L168) |
| B11 | **Nút nổi** bút / logo Kudos trên Homepage (Figma 5022:15169): làm hay bỏ. User đã hoãn 2026-11-17, chờ BTC | Không có khoá; làm thì cần code mới. Hệ quả: hiện chỉ có ô viết trên Live board (F003 D014) và Thể lệ vào qua footer | Chưa làm | [L125](spec/decision-log.md#L125), [O2](phase-07-awards-portal.md#L164) |
| B12 | **Mô tả ngắn giải** trên thẻ Homepage: Best Manager, Signature, MVP dùng chung một câu theo Figma | `awardsPortal.awards.{best-manager,signature-2025-creator,mvp}.short` | BTC sửa sau qua JSON | [L128](spec/decision-log.md#L128) |
| B13 | **Kho quà Secret Box**: tên quà, trọng số, tồn kho là giá trị tạm; tên quà chỉ có tiếng Việt | `db/seeds/secret-box-prize-catalog.ts` rồi `npm run db:seed` | Placeholder | [L169](spec/decision-log.md#L169), [phase 10 L161](phase-10-secret-box-rewards.md#L161) |
| B14 | **Danh sách phòng ban và hashtag** lấy nguyên văn Figma | `db/seeds/departments.ts`, `db/seeds/hashtags.ts` rồi `npm run db:seed` | Chưa được BTC xác nhận | [phase 01 L115](phase-01-foundation-infrastructure.md#L115), [L180](phase-01-foundation-infrastructure.md#L180) |

Nhắc: chữ "Sunner", tên giải, v.v. cũng nằm trong `messages/*.json`; BTC chỉ cần gửi bản cuối theo khoá ở cột 3.

## C. Đã cố ý để lại (không làm)

Nguồn: [reviewer-261123-phase-14.md](../reports/reviewer-261123-phase-14.md) và [phase 14 Next Steps](phase-14-admin-users-and-overview.md#L152). Không chặn bàn giao.

| # | Việc | Lý do để lại | Khi nào xem lại |
|---|------|--------------|-----------------|
| C1 | **Oracle trạng thái của người thao tác đã bị hạ giữa chừng** (Low): với role đã đúng, ENV_ADMIN hoặc LAST_ADMIN, người đó có thể nhận `ok:true`/409 trước khi nhận FORBIDDEN (`user-role-service.ts:40-47`) | Không ghi được gì. Thứ tự kiểm tra cố định theo spec § 3.4 để bên thua khi hai admin hạ nhau nhận LAST_ADMIN. Đổi thứ tự là đổi hành vi đã chốt | Khi PO muốn đổi thứ tự (xem A14-2) |
| C2 | **Tổng hợp tim mỗi trang đọc mọi tim của Kudo công khai** (`user-admin-sql-fragments.ts:36`, `heartCountsSubquery`), tăng tuyến tính | Đo được 233 ms ở 100k Kudo, trong ngân sách 500 ms | Khi dữ liệu gấp ~10 lần |
| C3 | Truy vấn danh sách User dùng `SET LOCAL enable_nestloop = off` trong transaction; test kế hoạch (ngân sách 500 ms, đo tối đa 237 ms) có thể chập chờn trên CI chậm | Sửa ở phạm vi hẹp nhất, có đo (15,7 s → 48 ms) và có test; ước lượng sai khi tìm không dấu | Nếu test chập chờn trên CI |
| C4 | `adminKudoExportFilename` (`features/admin-moderation/server/admin-kudo-export.ts`) trùng `adminCsvFilename` ở `shared/admin/admin-csv-filename.ts` | Code phase 08; không đụng khi chưa sửa file đó | Lần tới sửa phase 08 |
| C5 | Khoá ngoại tự tham chiếu `role_updated_by` chưa có index (xoá profile quét tuần tự) | Không đáng kể ở 5k người dùng | Nếu có luồng xoá profile |
| C6 | ~~`test:prod` chưa phủ `/admin/users` và route export; chưa đo coverage~~ **Xong 2026-11-24:** `test:prod` 25 kiểm tra gồm `/admin/users` và ba route CSV; `@vitest/coverage-v8` đã cài, đo được khoảng 49% câu lệnh (unit + integration, chưa đặt ngưỡng), xem mục E | Đã đóng | — |

## D. Việc kỹ thuật trước go-live (không phải quyết định)

| Việc | Nguồn |
|------|-------|
| Kiểm kênh Realtime riêng tư trên Supabase hosted (chưa chạy ở đâu); tắt "Allow public access"; ghi kết quả vào `evidence/phase-11/` | [phase 11 L147](phase-11-spotlight-board-realtime.md#L147) |
| POST thật một lần tới `/api/internal/secret-box/tick` với header đúng và sai (cron pg_cron → pg_net chưa từng chạy với `INTERNAL_JOB_SECRET`) | [phase 10 L166](phase-10-secret-box-rewards.md#L166) |
| Kiểm cron drain thông báo trên **hosted/staging** (secret Vault thật, URL thật). Đã kiểm trên Supabase local 2026-11-24: pg_cron → pg_net → drain xử lý sự kiện trong khoảng 2 s, route trả 200 (`evidence/post-14-hardening/cron-drain-local-run.txt`). ~~Lên lịch dọn `domain_event_outbox` và `cron.job_run_details`~~ **Xong:** migration `0023` (outbox đã tiêu thụ > 30 ngày lúc 02:00 ICT, lịch sử cron > 7 ngày lúc 02:15 ICT; xem `docs/system/architecture.md`) | [phase 13 L147-152](phase-13-notifications.md#L147) |
| Chọn host: `redirectTo` OAuth Google lấy từ Host của request, user hoãn tới lúc chọn hosting (A: `APP_ORIGIN` cố định, B: allow-list origin) | [L92](spec/decision-log.md#L92) |

## Phụ lục — tài liệu đã đồng bộ

Ngày 2026-11-24 đã chạy `rebuild-spec` đủ: lượt lõi, đặc tả 15 tính năng (F001–F015) và đặc tả 20 màn hình (SCR001–SCR020), sau khi đánh số lại mã màn hình. 22 thư mục `docs/screens` cũ đã xoá. Báo cáo: [rebuild-spec-261124-core-and-features](../reports/rebuild-spec-261124-core-and-features.md), [rebuild-spec-261124-screen-sync-and-fixes](../reports/rebuild-spec-261124-screen-sync-and-fixes.md).

## E. Còn lại sau vòng hardening 2026-11-24

| # | Việc | Trạng thái |
|---|------|------------|
| E1 | Chạy `/tkm:rebuild-spec` | **Xong 2026-11-24** (xem Phụ lục). Còn 9 link chết `screens/SCR###/REG###/spec.md` trong README của F003, F004, F005, F008, F010, F013 do script sinh mục lục của kit; sửa tay sẽ bị ghi đè, cần sửa ở kit |
| E2 | Coverage unit + integration khoảng 49% câu lệnh, chưa đặt ngưỡng; Playwright không được đo | Hai hook thông báo (`use-notification-list.ts`, `use-notification-channel.ts`) đã lên khoảng 95% (commit `6e34454`). Các file 0% khác phần lớn đã có e2e |
| E3 | Push lên origin main | **Xong**: user cho push 2026-11-24; gitleaks quét toàn lịch sử sạch |
| E4 | `npm audit` | Dependency chạy thật: 0. Dev còn 4 mức moderate, đều trong `drizzle-kit` 0.31.11 (esbuild qua `@esbuild-kit`), chờ thư viện cập nhật |
| E5 | Kiểm cron drain, Realtime, nhịp mở Secret Box trên staging (xem mục D) | Local đã kiểm; chờ chọn hosting |
| E6 | Cách nộp bài và thư mục `.claude/` | **User chốt 2026-11-24**: nộp bằng link repo `hailv-3571/agentic-coding-hands-on` (không mở PR lên upstream); không commit `.claude/` |
