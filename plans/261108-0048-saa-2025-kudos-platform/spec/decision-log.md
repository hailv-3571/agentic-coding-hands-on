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
