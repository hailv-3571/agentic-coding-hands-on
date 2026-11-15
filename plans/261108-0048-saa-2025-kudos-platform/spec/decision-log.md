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
- Q: Hashtag? → A: **Danh sách cố định (seed), chọn 1–3 hashtag/Kudo**. Áp dụng: F003, F004, F007.
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
