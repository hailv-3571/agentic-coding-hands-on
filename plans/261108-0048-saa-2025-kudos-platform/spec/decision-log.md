---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# Decision Log — SAA 2025 Kudos Platform

Sổ quyết định chốt sau Stage 1.5 (gap clarification). **Ưu tiên cao hơn mọi Open Decision / default trong từng feature spec.** Chỗ nào spec ghi khác, theo file này; spec sẽ được đối soát khi promote.

## Session 2026-11-08 — User decisions (16)

### Phạm vi & truy cập
- Q: Mốc thời gian (countdown, khóa, chốt Kudos Quốc Dân)? → A: **Cấu hình được** qua env/config (`LAUNCH_AT`, `EVENT_AT`, `EVENT_END_AT`, `NATIONAL_KUDOS_FINALIZE_AT`). Ngày trong Figma chỉ là ví dụ. Áp dụng: F006, F003, F005, F010, F011.
- Q: Trước giờ mở cửa ai xem gì? → A: **Countdown công khai** (khách + Sunner chỉ thấy Login + Countdown); **Admin bỏ qua cổng**. Áp dụng: F001, F006 (giải C-09).
- Q: Admin đầu tiên? → A: **`ADMIN_EMAILS` trong env**; đăng nhập bằng email đó tự thành Admin; sau đó cấp quyền qua trang User. Áp dụng: F001, F014.
- Q: Nguồn phòng ban? → A: **File seed + Sunner tự chọn ở lần đăng nhập đầu**. Áp dụng: F001 (thêm bước chọn phòng ban), F015 (vẫn giữ hàng "Chưa gán đơn vị").

### Ẩn danh & spam
- Q: Admin thấy người gửi thật của Kudo ẩn danh? → A: **Có, kèm nhãn "Ẩn danh"**; người dùng thường không bao giờ thấy. Áp dụng: F004, F007, F012, F013, F014 (giải C-13).
- Q: Kudo ẩn danh có tính điểm? → A: **Tính đầy đủ** (tim → Secret Box cho người gửi; người gửi khác nhau → Hero cho người nhận). Áp dụng: F005, F009, F010.
- Q: Spam xử lý điểm thế nào? → A: **Ngừng tính, không thu hồi hộp**: Kudo spam bị loại khỏi mọi số liệu ở thời điểm truy vấn; Un Spam tự tính lại; Secret Box đã cấp/đã mở giữ nguyên. Áp dụng: F005, F007, F008, F009, F010, F014, F015.
- Q: Tự gắn cờ nội dung? → A: **Giai đoạn 1 chỉ duyệt tay** (Public/Spam). Auto-flag + thông báo "Có <x> lời nhắn cần bạn xem xét" ngoài phạm vi. Áp dụng: F007, F013.

### Luật game
- Q: x2 tim tính gấp đôi vào tiến độ Secret Box? → A: **Có**. Thẻ Kudo vẫn hiển thị số người thả tim thật (raw). Áp dụng: F005, F010, F011.
- Q: "Số tim bạn nhận được" là tim trên Kudo nào? → A: **Kudo mình ĐÃ GỬI** (theo thể lệ). Áp dụng: F005, F010, F012, F014.
- Q: Cột "Level" trong Admin User? → A: **Level = hạng Hero** (New/Rising/Super/Legend hoặc trống); bỏ thang 1–5; bộ lọc Level = 4 hạng. Thông báo "thăng hạng <tên level>" = tier-up Hero. Áp dụng: F009, F013, F014 (giải C-12, `LevelQuery` dùng `HeroTierQuery`).
- Q: Kho quà Secret Box? → A: **Cấu hình trong DB, có tồn kho**: mỗi loại quà/icon có trọng số + số lượng tồn; hết quà chỉ ra icon; BTC chỉnh bằng file seed. Áp dụng: F010.

### Luật viết Kudo
- Q: Tự gửi / giới hạn? → A: **Cấm tự gửi Kudo cho mình và cấm tự thả tim Kudo của mình; không giới hạn số lượng**, gửi nhiều lần cho cùng người được. Áp dụng: F003, F005; các feature đếm không cần loại self-kudo (vì không tồn tại) — giải C-10.
- Q: Hashtag? → A: **Danh sách cố định (seed), chọn 1–3 hashtag/Kudo** (superseded: 1–5, see 2026-11-15). Áp dụng: F003, F004, F007.
- Q: Sửa/xóa? → A: **Sửa mọi trường trừ người nhận; Kudo đang Spam thì khóa sửa; không ai xóa** (Admin dùng Spam để ẩn). Áp dụng: F003, F007, F012 (giải C-17 phần sửa).
- Q: Sau sự kiện? → A: **Khóa gửi Kudo và thả tim sau `EVENT_END_AT`**; chỉ còn xem; chốt Kudos Quốc Dân; hộp đã có vẫn mở được. Áp dụng: F003, F005, F010.

## Default policy cho các gap còn lại

Mọi gap khác do 15 researcher nêu (UI, copy, phân trang, định dạng export, giới hạn kỹ thuật…) **lấy phương án `recommended`** ghi trong khối Gaps / Open Decisions của từng spec. Gap có `recommended: TBD` mà không thuộc danh sách trên → planner chọn phương án đơn giản nhất (YAGNI) và ghi lại; nội dung copy/text cuối do BTC cung cấp hoặc lấy nguyên văn Figma khi implement.

Một số đã được orchestrator chốt từ ảnh Figma:
- Menu Admin là **thanh ngang trên cùng** (Overview · Review content · User · Settings); nhãn dùng **"User"**.
- Footer: logo + About SAA 2025 · Award Information · Sun* Kudos · Tiêu chuẩn chung + "Bản quyền thuộc về Sun* © 2025".
- Tablet: dùng layout desktop co giãn (không có thiết kế riêng).
- 6 icon: REVIVAL, TOUCH OF LIGHT, STAY GOLD, FLOW TO HORIZON, BEYOND THE BOUNDARY, ROOT FURTHER.
- Thông báo filler trong mock (khen từ cấp trên, khóa học, khách hàng…) ngoài phạm vi.

## Technical conflicts — planner phải giải khi lập blueprint

Danh sách đầy đủ ở `system/architecture.md` § Consistency Check (C-01…C-21). Hướng giải đã chốt:
- **C-16 / C-01 / C-03:** `domain_event_outbox` + helper `DomainEventOutbox#add` là **nền tảng chung** (phase foundation), schema hợp nhất cho F013 (`id`, `attempts`, `failed_at`, payload đủ trường như `giftName`). F003/F005/F007/F010 ghi outbox trong cùng transaction; F010 không gọi in-process.
- **C-02:** `HeartStatsQuery` của F005 thêm `asOf` và trả `{weightedTotal, rawTotal, campaignActive}`; F010/F014 dùng lại, không tự đếm.
- **C-04 / C-11 / C-19:** một nguồn duy nhất cho mỗi phép đếm (F009 cho tier, F005 cho tim).
- **C-05 / C-07 / C-06:** mở rộng `KudoPublicQuery` (lọc recipient/sender + cursor), `KudoComposerModal` nhận recipient điền sẵn + khóa; một endpoint tìm Sunner dùng chung.
- **C-08 / C-21:** cấp mã DISC/MODEL một lần cho cả hệ thống; tên bảng `profiles` thống nhất.
- **C-14:** module admin dùng chung (CSV serializer, date-range filter, `ADMIN_TIMEZONE`, `EXPORT_MAX_ROWS`).
- **C-15:** phase foundation có seed: departments, hashtags, secret box prizes/icons, Storage bucket.
- **C-18:** thống nhất kiểu mutation sau khi đọc `node_modules/next/dist/docs/` (Server Actions vs Route Handlers).
- **C-20:** RLS bật trên mọi bảng nghiệp vụ, **không có policy client**; mọi truy cập qua server.

## Session 2026-11-15 — Plan-review confirmations (2)
- Q: Admin có tên trong `ADMIN_EMAILS` có hạ quyền được từ trang User không? → A: **Không** — hiện badge "Admin · env", menu tắt, server trả `409 ENV_ADMIN` (vì lần đăng nhập sau sẽ tự lên Admin lại). Áp dụng: F014 (phase 14), F001 (phase 02).
- Q: Trước giờ mở cửa, trang Countdown có hiện link sang thông tin giải thưởng? → A: **Ẩn link** trong thời gian prelaunch (đúng quyết định "chỉ Login + Countdown"). Áp dụng: F006 (phase 07).
- Q: Tối đa bao nhiêu hashtag mỗi Kudo? → A: **Tối đa 5 theo Figma** (nút Hashtag frame 1002:13013 ghi "Tối đa 5"); **thay thế** quyết định "1–3" ở phiên 2026-11-08. Danh sách 8 hashtag xem `research/figma-design-tokens-and-seed-lists.md`. Áp dụng: F003 (phase 04), F007.

## Session 2026-11-15 — Technical decisions from phase 01 review
- Q: Root layout `export const instant = false` (vì `<html lang>` đọc cookie `NEXT_LOCALE` dưới Cache Components)? → A: **Giữ** — reviewer chấp nhận (docs Next 16 cho phép với app đọc session); hầu hết trang đều cần đăng nhập/cá nhân hoá. Đánh đổi: tắt kiểm tra static shell toàn app; segment con vẫn có thể bật `instant = true` + Suspense. Áp dụng: mọi phase.
- Q: Cấu hình Vitest? → A: đổi tên `vitest.config.ts` → `vitest.config.mts` (không thêm `"type":"module"`).
- Q: `forbidden()`/`unauthorized()` cần `experimental.authInterrupts` (Next 16.4.5)? → A: **Bật `authInterrupts: true`** trong `next.config.ts` (orchestrator, 2026-11-15). Lý do: phase 02 (`AdminGuard#requireAdmin`) và phase 03 (`app/forbidden.tsx`) đều thiết kế theo `forbidden()`; cờ có trong docs chính thức; phương án redirect sang route 403 riêng bị loại vì phải sửa kế hoạch 2 phase. Rủi ro: API thử nghiệm có thể đổi khi nâng Next — kiểm lại khi upgrade.

## Session 2026-11-15 — Phase 02/03 test decisions
- Q: Trang 404 khi đã đăng nhập có hiện header/footer (spec F002 D005)? → A: **Không — trang trần theo Figma** (frame 1378:5063 không có shell); CTA đổi theo trạng thái: "Về trang chủ" khi đã đăng nhập, "Đăng nhập" cho khách. Thay thế D005 của F002. Áp dụng: phase 03.
- Q: Khách vào `/` bị chuyển tới `/login` (không kèm `?next=%2F`)? → A: **Chấp nhận** — `next` bị bỏ khi bằng `/` (tương đương). Áp dụng: phase 02.
- Q: Trang 403 có nút "Về trang chủ" (Figma không có)? → A: **Giữ** — tránh ngõ cụt; copy 403 dùng "Bạn không có quyền truy cập tài nguyên này." (khớp frame mobile).

## Session 2026-11-15 — Phase 04 Figma vs spec (user)
- Q: Danh hiệu bắt buộc (Figma có dấu *) hay tuỳ chọn? → A: **Tuỳ chọn, ≤ 50 ký tự** (giữ D006; câu báo lỗi Figma chỉ nêu 3 trường). Sửa bài vẫn sửa được danh hiệu. Áp dụng: F003 (phase 04), F004.
- Q: Thanh định dạng lời nhắn (B / I / S / danh sách / link / trích dẫn) trong Figma? → A: **Làm thanh định dạng, lưu Markdown rút gọn** — thay D010. Tập cú pháp cho phép: `**đậm**`, `_nghiêng_`, `~~gạch~~`, danh sách `1.`/`-`, `> trích dẫn`, `[text](http(s)://…)`; giới hạn 1.000 ký tự tính trên text gốc; không bao giờ lưu/hiển thị HTML thô. Phase 05 render bằng bộ render whitelist (chỉ các thẻ trên, link chỉ http/https, `rel="noopener noreferrer nofollow"`). "@ + tên" vẫn là token văn bản. Áp dụng: F003 (phase 04), F004 (phase 05), F007, F012.
- Q: Ô "Nickname ẩn danh" (Figma, bắt buộc khi tick ẩn danh)? → A: **Thêm** cột `kudos.anonymous_nickname` (1–30 ký tự sau trim, bắt buộc khi `is_anonymous`, null khi không ẩn danh; CHECK ở DB). Bảng tin/thông báo hiện nickname thay cho tên thật; Admin vẫn thấy người gửi thật kèm nhãn "Ẩn danh". Áp dụng: F003 (phase 04), F004, F007, F012, F013.

## Session 2026-11-16 — Phase 04 review decisions (orchestrator)
- Lời nhắn **không cho chèn ảnh Markdown** `![…](…)` (lỗi `imageNotAllowed`) và **không cho link dạng tham chiếu** `[x]: url`; chỉ link inline `[text](http(s)://…)` và URL http(s) trần. Phase 05 render whitelist theo `research/phase-04-backend-contracts.md` § 1.1.
- Giới hạn **20 lượt ký upload ảnh chưa dùng / người / 24 giờ** (429 `UPLOAD_LIMIT`); job dọn ảnh mồ côi để sau.
- CHECK `kudos_body_not_blank` dùng regex `[^[:space:]]` (khớp trim của form).
- Câu DEC-001 nguyên văn Figma: "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!"
- Hoãn: magic-byte check ảnh, oracle 403/404 ở route sửa, trigram index tìm Sunner, soft-deactivate profile (FK RESTRICT nên không xóa profile).

## Session 2026-11-15 — Phase 02/03 review fix round 2
- Q: Trang 403 cho non-admin ở `/admin/*` trả status 403 thế nào (Cache Components gửi shell 200 trước khi render)? → A: **Proxy tự trả 403**: fetch trang public `/access-denied` (chỉ gửi cookie locale + Accept-Language) rồi trả HTML với status 403; non-GET/Server Action → JSON 403. Origin fetch lấy từ `INTERNAL_APP_ORIGIN` (tùy chọn) hoặc `http://127.0.0.1:$PORT`, **không bao giờ từ header Host** (chống SSRF). Phase 07: cổng prelaunch phải cho khách vào `/access-denied`. Hosting: server phải tự gọi được origin nội bộ đó.
- Q: Trigger chặn domain ngoài trên `auth.users`? → A: Tách 2 trigger: `reject_foreign_domain_on_insert` và `reject_foreign_domain_on_email_change` (chỉ khi `NEW.email IS DISTINCT FROM OLD.email`) — tài khoản cũ ngoài domain trên hosted không bị chặn khi GoTrue cập nhật cột khác.
- Q: `redirectTo` của OAuth Google đang lấy từ Host của request? → A: **Để đến lúc chọn hosting** (user, 2026-11-15). Rủi ro thấp (Next đối chiếu Origin/Host cho Server Action; allow-list redirect của Supabase khớp chính xác). Checklist go-live: chọn A (`APP_ORIGIN` cố định) nếu chỉ một origin, B (allow-list origin) nếu có preview; callback route theo cùng quyết định.

## Session 2026-11-16 — Phase 05 Figma vs plan (orchestrator)
- Route Live board là `/kudos` (đã có trong `APP_ROUTES`); nút viết Kudo (launcher phase 04) chuyển từ `/` sang `/kudos`, đổi dáng thành viên thuốc theo Figma 2940:13449; bỏ deep link tạm `/?editKudo` — sửa Kudo mở modal ngay trên thẻ (nút bút của chủ bài).
- Chi tiết Kudo: **trang riêng `/kudos/[id]`** (giữ D004, Copy Link cần URL cố định) nhưng **vẽ theo Figma View Kudo 520:18779** — khung 680 giữa màn trên nền keyvisual mờ, nút "Đóng" quay về `/kudos`.
- Thẻ ẩn danh: avatar ẩn danh + **nickname** (Bold 22/28) + dòng phụ "Người gửi ẩn danh" (Figma 2099:9148, khớp quyết định nickname 2026-11-15). Không link profile.
- Thời gian trên thẻ theo đúng Figma `HH:mm - MM/DD/YYYY` cho cả vi/en (giờ Việt Nam `Asia/Ho_Chi_Minh`).
- Thẻ feed hiện cả "Copy Link" và "Xem chi tiết" (spec E20/E21; Figma thẻ feed chỉ vẽ Copy Link, thẻ Highlight vẽ cả hai).
- Huy hiệu Hero (phase 09) và số tim thật (phase 06) để seam: phase 05 không hiện huy hiệu (ẩn cả dấu chấm), tim hiện số đọc từ seam (mặc định 0).
- Highlight hiển thị tối đa 5 thẻ (Figma "2/5", D001); dropdown lọc có mục đầu "Tất cả".
- Lời nhắn render bằng bộ render Markdown whitelist tự viết (không thêm thư viện), theo `research/phase-04-backend-contracts.md` § 1.1; thẻ cắt bằng line-clamp, trang chi tiết hiện đủ.
- (review UI 2026-11-16) Nút bút sửa trên thẻ **ẩn khi hết hạn viết** (`EVENT_END_AT`), đồng bộ với nút viết Kudo bị khoá; server vẫn là bên quyết định (`WRITING_CLOSED`).
- (review UI 2026-11-16) Trang chi tiết **không có nút sửa** (Figma 520:18779 không vẽ) — đóng E11 "TBD".
- (review UI 2026-11-16) Ô tìm Sunner dùng debounce 250 ms của combobox dùng chung phase 04 (không sửa `features/sunner-search`); chấp nhận thay cho 300 ms trong phase file.
- (vòng sửa 2026-11-16) `/kudos/[id]` khi không có quyền xem (không tồn tại / id sai / spam của người khác) là **404 mềm**: trang "không tìm thấy" giống hệt nhau, status 200 trên production (Cache Components đã gửi shell trước khi `notFound()` chạy; Next tự thêm `noindex`). **User chọn 2026-11-16**, không kiểm tra ở proxy. E2E kiểm tra nội dung trang, không kiểm tra status.
- (vòng sửa 2026-11-16) Giữ nhánh FORBIDDEN trong hộp sửa Kudo (tab cũ còn nút bút sau khi đổi tài khoản ở tab khác) — có e2e phủ. Giữ `KudoComposerLauncherPlaceholder` (skeleton Live board đang dùng).
- (vòng sửa 2026-11-16) Markdown: `![x](url)` hiện nguyên văn (không link); URL có username/password bị bỏ; thân bài cắt 5.000 đơn vị UTF-16 trước khi parse (giới hạn ghi 1.000 code point nên không thân bài lưu nào bị cắt).

## Session 2026-11-16 — Phase 06 Figma vs plan (orchestrator)
- Q: Ô chọn ngày giờ chiến dịch x2 (Figma 1413:9045 vẽ lịch + cột giờ riêng)? → A: **Dùng `<input type="datetime-local">` của trình duyệt**, ô style theo Figma (user chọn 2026-11-16). Giá trị hiểu theo `ADMIN_TIMEZONE`.
- Q: Figma chỉ vẽ tim đã thả (đỏ đặc)? → A: **Chưa thả = cùng hình tim, viền đỏ `#D4271D`, ruột rỗng** (user chọn 2026-11-16).
- Seam phase 08 `features/admin-moderation/server/admin-kudo-heart-counts.ts` chưa tồn tại (phase 08 chưa làm) → phase 06 không tạo; phase 08 dùng thẳng `heartCountsSubquery` khi tới lượt.
- Trang Settings dùng khung admin có sẵn (AdminTopBar), không dựng lại header Figma; nền xám `#999` của Figma là canvas giả, giữ nền khung admin.
- (backend 2026-11-16) `campaigns.id` là `bigint identity` (tech spec §4.2, cột ID Figma hiện số ngắn), không phải uuid.
- (backend 2026-11-16) Payload `HeartAdded` giữ `{kudoId, heartUserId}` theo hợp đồng phase 01 trong architecture.md; không thêm `multiplier` (chưa ai đọc — YAGNI).
- (backend 2026-11-16) Hoãn kịch bản US003 "dữ liệu tim lỗi thì thẻ vẫn hiện, vùng tim báo lỗi nhẹ": lỗi truy vấn tim làm lỗi trang như mọi truy vấn feed khác. Cần thêm cờ vào `KudoCardView` nếu muốn làm sau.
- (test 2026-11-17) E2E toàn bộ đỏ 65/68 ở 6 worker do tranh tài nguyên với một `next dev` (lỗi timeout 5 s, mỗi lần một bộ khác nhau, chạy riêng đều qua; 3 worker thì 68/68). Chọn **giới hạn `workers` của Playwright ở 3 khi chạy local** (CI giữ mặc định) và khởi động lại dev trước khi chạy; không tăng timeout.
- (review UI 2026-11-17) Giữ hành vi theo spec: Esc/Hủy trên form chiến dịch đang nhập dở đóng luôn, không hỏi lại; toast lỗi tim tự tắt sau 5 giây.
- (vòng sửa UI 2026-11-17) Bấm tim bị khoá (Kudo của mình / hết hạn) hiện toast lý do, không gọi máy chủ; Esc ẩn tooltip tim; nút trong hộp thoại chiến dịch dùng `aria-disabled` để giữ focus; e2e dành riêng hashtag `think-outside-the-box` và `get-risky` cho test Highlight.
- (2026-11-17) User ký duyệt rủi ro phase 06 (migration, ghi dữ liệu, phân quyền admin).

## Session 2026-11-17 — Phase 07 Figma vs plan (orchestrator)
- Q: Figma 3204:6051 vẽ Thể lệ thành khung bên phải 553px (nút "Đóng" + "Viết KUDOS"), plan/footer trỏ trang `/rules`? → A: **Trang `/rules` có URL riêng, vẽ thành khung 553px bên phải trên nền keyvisual làm tối** (như trang chi tiết Kudo). "Đóng" quay lại trang trước (không có lịch sử thì về `/`), "Viết KUDOS" dẫn tới Live board `/kudos` (user chọn 2026-11-17).
- Q: Nút nổi bút / logo Kudos (Figma 5022:15169) trên Homepage? → A: **Chưa làm trong phase 07**, giữ F003 D014 (chỉ ô viết trên Live board) và F002 D003; ghi thành việc còn mở chờ BTC xác nhận (user chọn 2026-11-17).
- Q: Font số đếm ngược "Digital Numbers" chưa có? → A: **DSEG7 Classic** (SIL OFL 1.1), tự chứa woff2, chỉ nạp ở component đếm ngược (user chọn 2026-11-17).
- Countdown (2268:35127) không vẽ link sang thông tin giải → khớp quyết định "ẩn link" 2026-11-15; trang chỉ có tiêu đề "Sự kiện sẽ bắt đầu sau" + 3 ô DAYS/HOURS/MINUTES.
- Mô tả ngắn trên thẻ giải Homepage lấy nguyên văn Figma (Best Manager, Signature, MVP trong Figma dùng chung một câu — giữ nguyên, BTC sửa sau qua JSON). Trang Hệ thống giải: Best Manager và MVP không có dòng phụ "cho mỗi giải thưởng" (đúng Figma).
- Huy hiệu Hero (4 bậc) và 6 icon Secret Box trong Thể lệ dùng ảnh xuất từ Figma (chỉ hiển thị); phase 09/10 có thể dùng lại.
- (gate 2026-11-17) Trước giờ mở, request không phải tải trang (Server Action có header `next-action`, `/api/*`, method khác GET/HEAD) của người không phải admin trên đường bị chặn nhận **JSON 403 `{code:"prelaunch"}`** thay vì redirect 307 (307 làm `fetch` gửi lại POST tới `/countdown` và action vẫn chạy). Đường được phép (`/login`, `/auth/callback`, `/countdown`, `/access-denied`) cho qua để đăng xuất trên `/countdown` vẫn chạy.
- (gate 2026-11-17) E2E trước giờ mở chạy trên server riêng: `npm run test:e2e:prelaunch` = `next build` + `next start -p 3100` với `LAUNCH_AT` = now + 30 ngày (hai `next dev` cùng thư mục bị khoá; `distDir` riêng làm Next sửa `tsconfig.json`). Không chạy cùng lúc với `npm run build` khác.
- Q: Proxy chỉ chặn trang; Server Action gửi thẳng tới `/countdown` vẫn ghi được trước giờ mở? → A: **Chặn trong cửa sổ ghi dùng chung**: `isEventWritingOpen` = `LAUNCH_AT ≤ now < EVENT_END_AT`; áp cho cả Admin (Admin vẫn xem mọi trang trước giờ mở nhưng không ghi được) (user chọn 2026-11-22). Thông báo lỗi dùng lại `WRITING_CLOSED` ("Sự kiện đã kết thúc…") — chỉ Admin hoặc request tự chế mới thấy trước giờ mở; chấp nhận, ghi thành việc còn mở nếu BTC muốn câu riêng.
- (test 2026-11-22) 10 e2e kudos đỏ do dev server :3000 chạy từ 11/17 bị chậm (TTFB /login 2,5 s → 5 s); user cho khởi động lại; trên server mới toàn bộ e2e 84 qua / 5 bỏ qua.
- (review 2026-11-22) W1: trước giờ mở, Server Action chọn phòng ban (`choose-department-action`) và đổi ngôn ngữ vẫn chạy khi gửi tới đường được phép (action giải theo id, không theo path). **Chấp nhận**: chỉ ghi vào hồ sơ của chính người dùng, ảnh hưởng thấp; đăng xuất và đổi ngôn ngữ phải luôn mở. Ghi thành việc còn mở nếu BTC muốn chặn.
- (review 2026-11-22) W2: thêm `globalSetup` cho bộ e2e thường (`tests/e2e/global-setup-require-launched-server.ts`): nếu `/countdown` (chưa đăng nhập) trả 200 thì server còn trước `LAUNCH_AT` → dừng ngay với thông báo rõ; config prelaunch bỏ bước này. Gợi ý của reviewer (nút tim báo EVENT_ENDED cho Admin trước giờ mở, tag log riêng khi tra role lỗi) để lại làm việc còn mở.
- Q: Không có lối vào nào tới `/rules` (nút nổi Figma đã hoãn)? → A: **Thêm mục "Thể lệ" (en "Rules") vào footer**, cạnh "Tiêu chuẩn chung"; e2e app-shell kiểm tra link (user chọn 2026-11-22).
- (2026-11-22) Gen gate (rebuild-spec Core/Flow) **bỏ qua** lần này; chạy một lượt gộp cho F003–F006, F011 sau (user chọn 2026-11-22).
- (2026-11-22) User ký duyệt rủi ro phase 07 (cổng prelaunch ở proxy, cửa sổ ghi theo `LAUNCH_AT`).

## Session 2026-11-22 — Phase 08 Figma vs plan (orchestrator)
- Q: Figma 3127:24672 vẽ Kudo spam của chính người viết bị làm mờ + phủ xám + tam giác cảnh báo "Cảnh báo vi phạm tiêu chuẩn cộng đồng" (không đọc được), phase 05 đang cho đọc kèm nhãn Spam? → A: **Phủ mờ theo Figma ở cả Live board và trang chi tiết**, lớp phủ không đóng được, nhãn "Spam" màu cam `#FF8104` (viền `#EAEAEA`); nội dung vẫn có trong HTML cho trình đọc màn hình (user chọn 2026-11-22). Thay ghi chú "khoá sửa" của phase 05 trên thẻ.
- Badge trạng thái trong bảng Admin: **Public viền/chữ xanh `#3174C6`, Spam viền/chữ vàng** theo Figma 722:16251 (plan ghi Public xanh lá — Figma thắng).
- Nút "Mark Spam" / "Un Spam" ở cột Actions mở popover một mục (Figma 773:26295 "⚠ Mark Spam", 773:26373 "Un Spam") — bấm mục đó là xác nhận (D004: không lý do).
- Seam tim `admin-kudo-heart-counts.ts` không tạo; dùng thẳng `heartCountsSubquery` phase 06 (D010: số tim thô). `unaccent` đã có từ migration 0007 (`public.f_unaccent`) → không tạo wrapper mới.
- Q: Live board không liệt kê Kudo spam của chính người viết (phase 05 dành `includeOwnSpam` cho Profile "Đã gửi")? → A: **Giữ như phase 05**: Live board không đổi; thẻ phủ mờ hiện ở trang chi tiết bây giờ và ở Profile "Đã gửi" (phase 12). Câu hỏi trước của orchestrator ghi nhầm "trên Live board" (user chọn 2026-11-22). E2E khẳng định Kudo spam không có trên Live board của người viết (có Kudo công khai làm đối chứng).
- (UI 2026-11-22) Nhãn cột/bộ lọc tiếng Việt khi vi ("Người gửi", "Người nhận" — D013), tiếng Anh theo Figma khi en; "Review content", "Export", Public/Spam, Mark Spam/Un Spam giữ nguyên. Bảng co theo khung admin 1152px (Figma 1280). Nút "Đóng" và nhãn Spam nằm trên lớp mờ để người đọc không bị kẹt. Thông báo "Kudo đã được cập nhật bởi Admin khác." khi `changed:false`.
- (review 2026-11-22) W1: trên Kudo spam của người viết, mọi phần tử dưới lớp phủ bị bỏ khỏi thứ tự Tab (`tabIndex=-1`, ảnh chi tiết không còn là link) — không dùng `inert` để trình đọc màn hình vẫn đọc được chữ; chỉ "Đóng" nhận focus. W2: phân trang dùng trang đã kẹp (`?page=99` → trang cuối). S1: export đọc một lần tối đa `EXPORT_MAX_ROWS + 1` dòng, có dòng thừa → 422. Bỏ khoá `kudosFeed.card.spamTag/spamLocked` không còn dùng.
- (test 2026-11-22) Chưa đo coverage (chưa cài `@vitest/coverage-v8`; cài thêm là đổi dependency, cần user đồng ý). Phase 12 thêm e2e thứ tự Tab cho thẻ spam ở Profile "Đã gửi".
- (2026-11-22) User nhắn "làm tiếp toàn bộ các bước sau nhé, không cần dừng lại" → orchestrator làm tiếp các bước bàn giao; **ký duyệt rủi ro phase 08 vẫn hỏi riêng** (không suy ra chữ ký từ câu nhắn chung).
- (2026-11-22) User **ký duyệt rủi ro phase 08** (câu trả lời trực tiếp "Ký duyệt và commit") — migration 0013, ghi `kudos.status`, phân quyền admin, người gửi ẩn danh chỉ Admin thấy.

## Session 2026-11-22 — Run phases 09–14 continuously (user)
- Q: Ký duyệt rủi ro các phase 09–14? → A: **Ký trước có điều kiện** (user chọn 2026-11-22): mỗi phase chỉ coi là đã ký và được commit vào main (không push) khi đủ cả ba: toàn bộ kiểm thử xanh trên code cuối, review 0 critical, cổng kiểm chứng chỉ còn chờ chữ ký. Thiếu một điều → dừng hỏi user.
- Q: Chỗ trống / vênh giữa Figma và đặc tả? → A: **Orchestrator tự chọn phương án đề xuất** (bám Figma, giữ quyết định cũ, ít rủi ro), ghi vào decision log với nhãn "orchestrator mặc định, chờ user xem lại"; đổi quyết định nghiệp vụ đã chốt hoặc ảnh hưởng bảo mật thì vẫn hỏi (user chọn 2026-11-22).

## Session 2026-11-22 — Phase 09 Figma vs plan (orchestrator mặc định, chờ user xem lại)
- Badge Hero dùng lại ảnh xuất từ Figma ở phase 07 (`public/images/awards-portal/hero-tag-*.webp`) cho mọi cỡ (thẻ 109×19, tooltip 218×38) thay vì dựng lại bằng CSS; alt = tên bậc. *(orchestrator mặc định, chờ user xem lại)*
- Tooltip giữ nguyên văn Figma (xưng "bạn" kể cả trên huy hiệu người khác); chữ dùng chung với trang Thể lệ (một nguồn message); thống nhất gạch ngang "–" trong khoảng số. *(orchestrator mặc định, chờ user xem lại)*

## Session 2026-11-22 — Phase 10 Figma vs plan (orchestrator mặc định, chờ user xem lại)
- Ảnh kết quả quà tặng trong Figma (2995:15754) là áo phông có logo thương hiệu bên thứ ba → **không dùng**; quà hiển thị bằng hộp mở phát sáng + tên quà; ảnh riêng cho từng quà có thể thêm sau qua catalog. *(orchestrator mặc định, chờ user xem lại)*
- Nền modal dùng lớp phủ chung `rgba(0,16,26,0.8)` của app thay cho ảnh nền tối 20% trong Figma. Icon Secret Box dùng lại ảnh huy hiệu đã xuất ở phase 07. Khối "10 Sunner có sự thăng hạng mới nhất" (ẩn trong Figma) ngoài phạm vi. *(orchestrator mặc định, chờ user xem lại)*
- (review 2026-11-22) Phase 09 sửa ngoài file_ownership, chấp nhận vì là hệ quả bắt buộc: `kudo-card-sender.tsx` (badge + `tabbable` dưới lớp phủ spam, badge cho người không có phòng ban), trang Thể lệ đọc `hero.*` (bỏ `awardsPortal.rules.tiers`), dòng index trong `shared/db/schema/kudos.ts`, hai test tích hợp phase 05 (seam mặc định cũ: tier của r1 giờ là "new", feed 5 câu lệnh thay vì 4). Index thường (không CONCURRENTLY) khoá ghi `kudos` lúc tạo — chấp nhận trước giờ mở.
- (2026-11-22) Phase 09 đủ 3 điều kiện ký trước của user (kiểm thử toàn bộ xanh trên code cuối sau vòng sửa review; review 0 critical; cổng chỉ chờ chữ ký) → **áp dụng chữ ký có điều kiện user đã cho ngày 2026-11-22** và commit.

## Session 2026-11-22 — Phase 11 Figma vs plan (orchestrator mặc định, chờ user xem lại)
- Tìm trên Spotlight: tên khớp giữ nguyên, tên không khớp mờ còn 25%. Tên của sự kiện mới nhất tô `#F17676` vài giây (Figma tô một tên màu này). Ticker 5 dòng theo D006 (Figma vẽ 6), độ mờ 100/100/70/50/30 từ dưới lên; giờ theo định dạng ngôn ngữ. Vị trí tên trong đám mây cố định theo user id (không nhảy giữa các lần vẽ). *(orchestrator mặc định, chờ user xem lại)*
- (backend 2026-11-22) Phase 10: `/api/internal/secret-box/tick` được thêm vào `PUBLIC_PATHS` của proxy (đúng một đường, đường giống tên vẫn bị chặn; có unit test) vì cron không có cookie phiên; route tự kiểm `x-job-secret` so sánh hằng thời gian, thiếu cấu hình → 503. Đúng thiết kế plan (endpoint bảo vệ bằng secret), không đổi quyết định bảo mật đã chốt. `INTERNAL_JOB_SECRET` tuỳ chọn (≥ 32 ký tự). Cron dùng pg_cron + pg_net + Vault (migration 0016); dự phòng: cron máy chủ gọi curl mỗi phút.
- (backend 2026-11-22) Mở box vẫn được sau `EVENT_END_AT`; trước `LAUNCH_AT` không có box nào (không thả tim được) nên không thêm cổng. Chưa có cờ "icon trùng" trong kết quả mở (DEC-002 chú thích "đã có") → việc còn mở. Tên quà bí ẩn + trọng số/tồn kho trong catalog là giá trị tạm chờ BTC.
- (review 2026-11-22) Phase 10: payload `NationalKudosFinalized` mang `senderId` thật của cả Kudo ẩn danh (outbox đóng RLS, chưa ai đọc) → **ràng buộc cho phase 13: không bao giờ hiển thị/đưa `senderId` này vào thông báo hay feed**. Vòng sửa: thêm cờ `duplicate` cho kết quả mở (chú thích "Bạn đã có icon này rồi"), migration cron tự bỏ qua khi thiếu pg_cron/pg_net/vault, khoá chống chạy chồng tick + giới hạn số người mỗi tick.
- (2026-11-23) Phase 10 đủ 3 điều kiện ký trước (kiểm thử toàn bộ xanh trên code cuối sau vòng sửa; review 0 critical; cổng chỉ chờ chữ ký) → **áp dụng chữ ký có điều kiện của user (2026-11-22)** và commit.

## Session 2026-11-23 — Phase 12 Figma vs plan (orchestrator mặc định, chờ user xem lại)
- Hover card theo Figma 2268:35101 (không phải "Xem profile" của D004): tên (link tới profile), "Tên đơn vị: …", huy hiệu Hero, số Kudos nhận/đã gửi, nút "Gửi KUDO" mở hộp viết với người nhận điền sẵn (ẩn trên thẻ của chính mình). *(orchestrator mặc định, chờ user xem lại)*
- Số "Kudos đã gửi" của **người khác** (hover card) **không tính Kudo ẩn danh** — tránh lộ việc ai đó vừa gửi Kudo ẩn danh qua thay đổi con số; trang của chính mình vẫn tính như phase 10. *(orchestrator chọn phương án an toàn hơn, chờ user xem lại)*
- Trang người khác: chỉ danh sách "Đã nhận" + nút "Gửi lời cảm ơn và ghi nhận tới {tên}"; chú thích bộ icon dùng "Bộ sưu tập icon". *(orchestrator mặc định, chờ user xem lại)*
- (UI 2026-11-23) Phase 11: bậc cỡ tên tính theo hạng trên các số Kudo khác nhau `tier = 4 − floor(rank·4/k)` (cùng số → cùng bậc, nhiều nhất bậc 4, ít nhất bậc 1); điện thoại tối đa 24 tên, tên không còn chỗ thì bỏ (không chồng), bảng cao 460px; lớp nền network kéo 106% để không lộ đường nối. Policy `realtime.messages` siết thêm điều kiện topic của chính dòng (tránh đọc topic khác như thông báo phase 13). Checklist triển khai: tắt "Allow public access" của Realtime, không mở schema `realtime` qua Data API. *(orchestrator mặc định, chờ user xem lại)*
- (review 2026-11-23) Phase 11: sau event `removed`/`restored` bảng tự lấy lại snapshot sau 2–3 s (gộp loạt, có jitter); sau khi vào kênh lấy lại sau 0–2 s ngẫu nhiên; reducer giữ `restoredIds` qua mỗi lần REPLACE để dòng ticker của Kudo vừa Un Spam không quay lại (DEC-001), tải lại trang thì hiện đúng giờ gốc. Skeleton lúc tải cùng kích thước bảng thật. Checklist triển khai Realtime nằm ở `docs/system/architecture.md` (Deployment View). Còn mở: e2e Spotlight có thể chập chờn khi 2 worker chạy song song vì dọn dữ liệu bằng xoá cứng (không có event); chưa có test click nút thử lại (unit không có DOM). *(orchestrator mặc định, chờ user xem lại)*
- (2026-11-23) Phase 11 đủ 3 điều kiện ký trước (kiểm thử toàn bộ xanh trên code cuối sau vòng sửa; review 0 critical; cổng chỉ chờ chữ ký) → **áp dụng chữ ký có điều kiện của user (2026-11-22)** và commit.

## Session 2026-11-23 — Phase 13 Figma vs plan (orchestrator mặc định, chờ user xem lại)
- Chỉ làm các loại thông báo có thật (Kudo mới, tim, Secret Box, thăng hạng Hero, Kudo bị ẩn, đủ 6 icon, Kudos Quốc Dân); bỏ các dòng mẫu khác trong Figma và thông báo "lời nhắn cần xem xét" cho Admin (auto-flag ngoài phạm vi). Kudo ẩn danh: thông báo dùng nickname, không bao giờ tên thật. Kudos Quốc Dân dùng icon "đủ 6 icon". *(orchestrator mặc định, chờ user xem lại)*

## Session 2026-11-23 — Phase 14 Figma vs plan (orchestrator mặc định, chờ user xem lại)
- Bộ chọn ngày ở Admin User/Overview dùng ô date của trình duyệt (như phase 06) thay cho lịch AntD trong Figma; sửa lỗi chính tả tiêu đề cột ("reveived", "atleast"); số "(100)" trên tiêu đề cột là tổng của bộ lọc hiện tại; dùng lại bảng/bộ lọc/phân trang của phase 08. *(orchestrator mặc định, chờ user xem lại)*
- (build 2026-11-23) Phase 12: ALG-001 (gộp Kudo công khai + spam của chính mình) làm trong SQL bằng truy vấn phase 05 với một cursor `(created_at,id)` — không có hàm gộp riêng; thêm `KudoPublicQuery.count` dùng cùng điều kiện lọc để số đếm luôn khớp danh sách. Hover card không có avatar (Figma không vẽ); bàn phím mở được thẻ qua tên nhưng không Tab vào nút trong thẻ (hành động có sẵn ở link tên / nút trên trang profile). Người nhận khoá truyền cho hộp viết có `email: ""` (hộp viết chỉ dùng tên + id). Tự vào id của mình → `/profile`; id lạ → trang "Không tìm thấy Sunner này." (404 mềm trên production như `/kudos/[id]`). *(orchestrator mặc định, chờ user xem lại)*
- (review 2026-11-23) Phase 12: hover card vẫn nằm trong portal ở `body`, hook chuyển focus bằng tay (Tab từ tên vào thẻ → link tên → "Gửi KUDO"; Shift+Tab/Esc về tên; Tab ra khỏi nút cuối thì đóng); `aria-expanded`/`aria-controls` gắn trên link tên; sau Esc hoặc gửi, thẻ không tự mở lại cho tới khi focus rời tên. Bộ nhớ đệm thẻ 60 s (hết hạn thì hiện bản cũ trong lúc tải bản mới), xoá đệm của người nhận sau khi gửi Kudo từ thẻ/nút trên profile. `ProfileQuery.getById` bọc `cache()`. Còn mở: chưa có test trực tiếp cho độ trễ 300 ms; trường hợp lẫn chuột + bàn phím giữa hai thẻ làm focus rơi về body. *(orchestrator mặc định, chờ user xem lại)*
- (2026-11-23) Phase 12 đủ 3 điều kiện ký trước (kiểm thử toàn bộ xanh trên code cuối sau vòng sửa; review 0 critical; cổng chỉ chờ chữ ký) → **áp dụng chữ ký có điều kiện của user (2026-11-22)** và commit.
