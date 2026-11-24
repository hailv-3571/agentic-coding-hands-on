---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR007_KudosLiveBoardFeed — Screen Spec

**Screen**: SCR007_KudosLiveBoardFeed: KudosLiveBoardFeed
**Feature**: F004_KudosFeed
**Type**: composite
**Route**: /kudos
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner xem Live board của Sun* Kudos: viết Kudo mới, tìm profile đồng nghiệp, xem HIGHLIGHT KUDOS, SPOTLIGHT BOARD realtime, dòng ALL KUDOS và cột phần thưởng của mình ngay khi vào mục Sun* Kudos.
**Actors:** Sunner (người đã đăng nhập, có phòng ban); chủ Kudo (thêm bút sửa trên thẻ của mình); admin (vào được trước giờ mở hệ thống).
**Entry Conditions:** Đã đăng nhập và đã có phòng ban; trước `LAUNCH_AT` thì phải là admin (cổng prelaunch). Phần theo request chỉ hiện sau khi session xác nhận.
**Exit Conditions:** Người dùng mở chi tiết một Kudo, mở hồ sơ một Sunner, mở trang Tiêu chuẩn cộng đồng từ composer, hoặc rời đi bằng header và footer.

Màn hình ghép sáu vùng do bốn feature sở hữu: ô viết Kudo (F003_KudosAuthoring, REG001), ô tìm Sunner, HIGHLIGHT và ALL KUDOS (F004_KudosFeed, REG002, REG003, REG005), Spotlight Board (F008_SpotlightBoard, REG004), cột phần thưởng (F010_SecretBoxRewards, REG006). Spec này mô tả khung trang và ranh giới vùng; hành vi bên trong modal composer và modal Secret Box xem spec của feature chủ.

## 2. Screen Layout

### Layout Sketch

Một `<main>` chạy dưới header trong suốt (`-mt-20`), keyvisual Live board ở đầu trang rồi mờ dần vào nền. Từ trên xuống: tiêu đề "Hệ thống ghi nhận và cảm ơn" kèm logo KUDOS; hàng hành động chia hai cột từ `lg` (ô viết Kudo rộng, ô tìm Sunner hẹp); HIGHLIGHT KUDOS với hai bộ lọc ở đầu và carousel một thẻ giữa kèm bộ chuyển trang; SPOTLIGHT BOARD; cuối cùng ALL KUDOS gồm feed rộng 680 cạnh cột phần thưởng 422 (xếp dưới feed khi hẹp hơn `lg`). Phần theo request (từ hàng hành động trở xuống) stream sau một skeleton; modal composer và modal Secret Box nổi lên trên cùng. (`app/(app)/kudos/page.tsx:42-98`)

```
┌─────────────────────────────────────────────────┐
│ R1: Keyvisual + tiêu đề h1 (static)             │
├────────────────────────────┬────────────────────┤
│ R2: Ô viết Kudo (REG001)   │ R2: Ô tìm (REG002) │
├────────────────────────────┴────────────────────┤
│ R3: HIGHLIGHT KUDOS (REG003) carousel + pager   │
├─────────────────────────────────────────────────┤
│ R4: SPOTLIGHT BOARD (REG004)                    │
├──────────────────────────────┬──────────────────┤
│ R5: ALL KUDOS feed (REG005)  │ R6: Cột phần     │
│  thẻ Kudo ... [Tải thêm]     │ thưởng (REG006)  │
├──────────────────────────────┴──────────────────┤
│ - - R7: Modal composer / Secret Box, toast - -  │
└─────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Keyvisual và tiêu đề | static | no | LiveBoardKeyvisualBackground, LiveBoardHeading |
| R2 | Hàng hành động (REG001 ô viết Kudo, REG002 ô tìm Sunner) | static | no | KudoComposerLauncher, SunnerProfileSearch (SunnerSearchCombobox) |
| R3 | HIGHLIGHT KUDOS (REG003) | static | no | HighlightSection, LiveBoardSectionHeader, HighlightFilterDropdown x2, HighlightCarousel, KudoCard (highlight) |
| R4 | SPOTLIGHT BOARD (REG004) | static | no | LiveBoardSpotlightSlot, SpotlightBoardRegion, SpotlightBoard |
| R5 | ALL KUDOS feed (REG005) | static | no | AllKudosFeed, KudoCard (post), KudoFeedStatusMessage |
| R6 | Cột phần thưởng (REG006) | static | no | LiveBoardRewardsColumnSlot, RewardsColumn, PersonalStatsPanel, SecretBoxLauncher, LatestGiftWinnersList |
| R7 | Lớp nổi (có điều kiện) | absolute | no | KudoComposerModal, SecretBoxModal, toast (composer, Copy Link, tim) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Hệ thống ghi nhận và cảm ơn (tiêu đề và logo KUDOS) | region label | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai? | button | — | Enabled | Always | Mở modal viết Kudo | static | — | — | N/A |
| E03 | Sự kiện đã kết thúc, không thể gửi hoặc sửa Kudo nữa. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E04 | Tìm kiếm profile Sunner | text input | no | Empty | Always | Tìm Sunner và mở hồ sơ khi chọn kết quả | API field | kết quả theo combobox dùng chung | placeholder text | MODEL004_Profile.full_name |
| E05 | HIGHLIGHT KUDOS | region label | — | Visible | Always | — | static | raw | — | N/A |
| E06 | Hashtag (bộ lọc) | select | no | "Hashtag" (chưa lọc) | Always | Lọc Highlight theo hashtag | API field | nhãn hashtag, cắt ở 12rem | placeholder text | MODEL002_Hashtag |
| E07 | Phòng ban (bộ lọc) | select | no | "Phòng ban" (chưa lọc) | Always | Lọc Highlight theo phòng ban | API field | tên phòng ban | placeholder text | MODEL001_Department.name |
| E08 | Carousel Highlight (tối đa 5 thẻ Kudo) | list | — | Thẻ đầu ở giữa | Conditional | Chuyển thẻ bằng phím ←/→ | API field | thẻ highlight 528 px | hidden | MODEL003_Kudo |
| E09 | Mũi tên trước và sau của carousel | button | — | Enabled | Conditional | Chuyển thẻ trước hoặc sau | — | — | — | N/A |
| E10 | Bộ chuyển trang "n/N" | button | — | Enabled | Conditional | Chuyển thẻ trước hoặc sau | computed | số hiện tại lớn, tổng nhỏ | — | N/A |
| E11 | Trạng thái Highlight (rỗng, đang tải, lỗi) | message | — | Hidden | Conditional | Thử lại khi lỗi | static | raw | hidden | N/A |
| E12 | SPOTLIGHT BOARD và bộ đếm "{n} KUDOS" | display field | — | Visible | Always | — | API field | số theo locale | dash | MODEL003_Kudo |
| E13 | Đám mây tên người nhận | link | — | Visible | Always | Mở hồ sơ người nhận | API field | cỡ chữ theo số Kudo, người nhận mới nhất tô đỏ vài giây | hidden | MODEL004_Profile.full_name |
| E14 | Tìm kiếm (trong Spotlight) | text input | no | Empty | Always | Làm mờ các tên không khớp | — | tối đa 50 ký tự | placeholder text | N/A |
| E15 | Phóng to bảng | button | — | Enabled | Always | Vào hoặc thoát toàn màn hình | — | — | — | N/A |
| E16 | Dòng "Kudos mới nhất" (ticker) | display field | — | Visible | Always | — | API field | `HH:mm` giờ trình duyệt, 5 dòng mờ dần | hidden | MODEL003_Kudo |
| E17 | Trạng thái Spotlight (kết nối lại, lỗi live, lỗi tải) | message | — | Hidden | Conditional | Thử lại | static | raw | hidden | N/A |
| E18 | ALL KUDOS | region label | — | Visible | Always | — | static | raw | — | N/A |
| E19 | Thẻ Kudo trong feed (người gửi, người nhận, thời gian, danh hiệu, lời nhắn 4 dòng, ảnh, hashtag 2 dòng, tim, Copy Link, Xem chi tiết, bút sửa) | list | — | Visible | Always | Xem chi tiết, thả tim, Copy Link, sửa Kudo, mở hồ sơ | API field | thời gian `HH:mm - MM/DD/YYYY` Asia/Ho_Chi_Minh | hidden | MODEL003_Kudo; MODEL005_KudoHashtag; MODEL006_KudoImage; MODEL008_KudoHeart |
| E20 | Tải thêm | button | — | Enabled | Conditional | Nối trang Kudo cũ hơn | — | — | hidden | N/A |
| E21 | Trạng thái feed (rỗng, đang tải, lỗi, hết phiên) | message | — | Hidden | Conditional | Thử lại hoặc đăng nhập lại | static | raw | hidden | N/A |
| E22 | Thống kê của bạn (5 dòng, tim x2 khi có campaign) | display field | — | Visible | Always | — | API field | số theo locale | dash | MODEL003_Kudo; MODEL008_KudoHeart; MODEL011_SecretBox |
| E23 | Mở Secret Box | button | — | Enabled | Conditional | Mở modal Secret Box | API field | — | hidden | MODEL011_SecretBox |
| E24 | 10 SUNNER NHẬN QUÀ MỚI NHẤT | list | — | Visible | Always | — | API field | avatar, tên, "Nhận được {quà}" | placeholder text | MODEL013_MysteryGiftAward |

Ghi chú: thẻ Highlight (E08) và thẻ feed (E19) dùng cùng một KudoCard nên có cùng hành động trên thẻ; Highlight không hiện ảnh và chỉ cắt lời nhắn 2 dòng, hashtag 1 dòng. Live board không bao giờ liệt kê Kudo spam. Chi tiết bên trong modal composer (REG001) và modal Secret Box (REG006) thuộc spec của F003_KudosAuthoring và F010_SecretBoxRewards.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở modal viết Kudo | E02 | click | Còn cửa sổ ghi | Modal composer chế độ tạo mới mở (R7) | `features/kudos-authoring/components/kudo-composer-launcher.tsx:30-39` |
| Tìm và chọn Sunner | E04 | gõ rồi chọn kết quả | — | Combobox hiện kết quả sau 250 ms; chọn xong ô gọi điều hướng (xem § 8) | `features/kudos-feed/components/sunner-profile-search.tsx:23-26` |
| Lọc theo hashtag | E06 | chọn mục trong danh sách | — | Gọi lại Highlight, carousel về thẻ đầu, nút hiện giá trị đã chọn | `features/kudos-feed/components/highlight-filter-dropdown.tsx:54-58` |
| Lọc theo phòng ban | E07 | chọn mục trong danh sách | — | Như trên; hashtag và phòng ban là AND | `features/kudos-feed/components/use-highlight-kudos.ts:28-69` |
| Chuyển thẻ Highlight bằng phím | E08 | ← hoặc → khi focus trong carousel | Có từ 2 thẻ | Thẻ giữa đổi, giới hạn ở đầu và cuối | `features/kudos-feed/components/highlight-carousel.tsx:43-49` |
| Chuyển thẻ trước hoặc sau | E09 | click | Từ `md` trở lên (mũi tên bên); không ở đầu hoặc cuối | Thẻ giữa đổi một vị trí | `features/kudos-feed/components/highlight-carousel.tsx:51-65` |
| Chuyển trang Highlight | E10 | click | Không ở đầu hoặc cuối | Thẻ giữa đổi một vị trí | `features/kudos-feed/components/highlight-carousel.tsx:99-110` |
| Thử lại Highlight | E11 | click | Highlight lỗi | Gọi lại Highlight với bộ lọc hiện tại | `features/kudos-feed/components/highlight-section.tsx:54-57` |
| Mở hồ sơ từ Spotlight | E13 | click tên | — | Rời màn hình (xem § 8) | `features/spotlight-board/components/spotlight-name-cloud.tsx:44-55` |
| Tìm tên trong Spotlight | E14 | gõ | — | Sau 200 ms tên khớp giữ nguyên, tên khác mờ còn 25%; không khớp thì báo "Không tìm thấy tên nào" | `features/spotlight-board/components/spotlight-search-input.tsx:23-26` |
| Phóng to hoặc thu nhỏ bảng | E15 | click | — | Bảng vào hoặc thoát toàn màn hình; Esc cũng thoát | `features/spotlight-board/components/spotlight-fullscreen-button.tsx:16-28` |
| Thử lại Spotlight | E17 | click | Tải đầu lỗi, hoặc live lỗi sau 5 lần nối lại | Tải lại snapshot hoặc nối lại kênh realtime | `features/spotlight-board/components/spotlight-load-error.tsx:15-36`, `features/spotlight-board/components/spotlight-connection-banner.tsx:19-36` |
| Xem chi tiết Kudo | E19 | click | — | Rời màn hình (xem § 8) | `features/kudos-feed/components/kudo-card.tsx:76-79` |
| Thả hoặc bỏ tim | E19 | click nút tim | Không phải Kudo của mình; còn cửa sổ ghi | Tim đổi ngay, khoá tới khi server trả lời; lỗi thì hoàn lại | `features/kudos-hearts/components/kudo-heart-button.tsx:72-90` |
| Sao chép link Kudo | E19 | click Copy Link | — | URL `/kudos/{id}` vào clipboard, toast xác nhận hoặc toast lỗi kèm link | `features/kudos-feed/components/kudo-copy-link-button.tsx:35-46` |
| Sửa Kudo của mình | E19 | click bút | Là chủ Kudo, không spam, còn cửa sổ ghi | Mở modal composer chế độ sửa | `features/kudos-feed/components/kudo-owner-edit-button.tsx:25-42`, `features/kudos-feed/components/kudo-card-can-edit.ts:6-8` |
| Mở hồ sơ từ thẻ | E19 | click tên hoặc avatar | Người có tên (không phải gửi ẩn danh) | Rời màn hình (xem § 8); hover card khi di chuột lên avatar | `features/kudos-feed/components/kudo-card-sender.tsx:27-49` |
| Tải thêm Kudo | E20 | click | Còn trang kế tiếp | Nối 10 Kudo cũ hơn, focus vào thẻ mới đầu tiên, thông báo số thẻ đã tải | `features/kudos-feed/components/all-kudos-feed.tsx:53-95` |
| Thử lại hoặc đăng nhập lại | E21 | click | Feed lỗi (thử lại), hoặc hết phiên (đăng nhập lại) | Gọi lại trang, hoặc rời màn hình tới đăng nhập | `features/kudos-feed/components/kudo-feed-status-message.tsx:22-47` |
| Mở Secret Box | E23 | click | Có ít nhất một Secret Box chưa mở | Modal Secret Box mở; đóng thì refresh để cập nhật thống kê | `features/secret-box-rewards/components/secret-box-launcher.tsx:51-58` |

### Happy Path

1. Sunner vào `/kudos`; skeleton hiện ở R2 tới R5 rồi nội dung theo request thay vào.
2. Sunner đọc HIGHLIGHT KUDOS ở R3 và chuyển thẻ bằng mũi tên hoặc bàn phím.
3. Sunner lọc theo hashtag hoặc phòng ban ở R3; carousel đổi theo kết quả và về thẻ đầu.
4. Sunner cuộn tới ALL KUDOS ở R5, thả tim một thẻ và bấm Tải thêm để xem Kudo cũ hơn.
5. Sunner bấm ô viết Kudo ở R2, gửi Kudo trong modal composer; feed làm mới sau khi lưu.
6. Sunner bấm "Xem chi tiết" trên một thẻ để đọc đầy đủ (rời màn hình).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Cửa sổ ghi | Đã quá `EVENT_END_AT` | Ô viết Kudo bị khoá kèm dòng thông báo; bút sửa ẩn; nút tim bị khoá với lý do; server vẫn từ chối bằng mã đóng cửa sổ | `features/kudos-authoring/components/kudo-composer-launcher.tsx:30-44`, `features/kudos-feed/components/kudo-card-can-edit.ts:6-8` |
| Đọc dữ liệu từng vùng | Một vùng ném lỗi lúc render server | Chỉ vùng đó hiện trạng thái lỗi riêng, các vùng khác vẫn hiện | `app/(app)/kudos/page.tsx:27-35,47-53` |
| Highlight | Bộ lọc không khớp Kudo nào | Dòng "Chưa có Kudo nào phù hợp.", bộ lọc vẫn dùng được | `features/kudos-feed/components/highlight-section.tsx:54-57` |
| Bộ lọc Highlight | Đọc danh sách hashtag hoặc phòng ban lỗi | Danh sách chỉ còn mục "Tất cả", không có thông báo lỗi | `app/(app)/kudos/page.tsx:64-65` |
| Tải thêm | Server trả 400 (cursor bị từ chối) | Feed bỏ các trang đã nối, quay về trang đầu và hiện lỗi cho phép thử lại | `features/kudos-feed/components/all-kudos-feed.tsx:65-72` |
| Tải thêm | Hết trang | Nút Tải thêm biến mất | `features/kudos-feed/components/all-kudos-feed.tsx:105` |
| Deep link `?secretBox=open` | URL có tham số khi vào hoặc từ thông báo | Modal Secret Box mở ngay (kể cả khi thống kê lỗi); đóng thì xoá tham số rồi refresh | `features/secret-box-rewards/components/secret-box-launcher.tsx:38-58` |
| Thẻ spam | Kudo của chính người xem bị đánh dấu spam | Không bao giờ có trong feed hoặc Highlight của Live board; chỉ thấy ở chi tiết và hồ sơ | `features/kudos-feed/components/kudo-card.tsx:24-28` |

### Interaction Notes

- **Đổi bộ lọc Highlight huỷ yêu cầu cũ và chỉ áp kết quả mới nhất rồi về thẻ đầu** — source: `features/kudos-feed/components/use-highlight-kudos.ts:28-58`
- **Mũi tên bên của carousel chỉ hiện từ `md`, dưới đó chỉ còn bộ chuyển trang** — source: `features/kudos-feed/components/highlight-carousel.tsx:60,100-107`
- **Chỉ thẻ giữa carousel bấm và đọc được, thẻ bên bị `inert` và ẩn khỏi trình đọc màn hình** — source: `features/kudos-feed/components/highlight-carousel.tsx:80-90`
- **Danh sách bộ lọc điều hướng bằng ↑/↓/Home/End, Enter hoặc Space chọn, Tab và Shift+Tab đóng danh sách, Esc hoặc bấm ngoài cũng đóng** — source: `features/kudos-feed/components/highlight-filter-dropdown.tsx:28-30,60-78`
- **Sau khi Tải thêm, focus nhảy tới thẻ mới đầu tiên và một dòng trạng thái đọc "Đã tải thêm n Kudo"** — source: `features/kudos-feed/components/all-kudos-feed.tsx:49-51,81-84,117-119`
- **Chọn một kết quả trong ô tìm Sunner mở ngay hồ sơ đó, kể cả chính mình** — source: `features/kudos-feed/components/sunner-profile-search.tsx:23-26,40`
- **Tên người nhận mới nhất trong Spotlight sáng đỏ vài giây khi có Kudo mới đến qua kênh realtime** — source: `features/spotlight-board/components/spotlight-name-cloud.tsx:42-51`, `features/spotlight-board/components/spotlight-board.tsx:50-55`
- **Mất kết nối Spotlight giữ nguyên số đang hiện, hiện "Đang kết nối lại…", sau 5 lần thất bại hiện "Thử lại"** — source: `features/spotlight-board/components/spotlight-connection-banner.tsx:19-36`
- **Mở Secret Box khi chưa có hộp: nút mờ, vẫn focus được, tooltip "Bạn chưa có Secret Box nào" hiện khi hover, focus hoặc chạm** — source: `features/secret-box-rewards/components/open-secret-box-button.tsx:14-20`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Phần theo request chưa xong | LiveBoardSkeleton: hai viên thuốc hành động, header Highlight và thẻ, hai thẻ feed ở đúng kích thước; ẩn với trình đọc màn hình | none | `app/(app)/kudos/page.tsx:95`, `features/kudos-feed/components/live-board-skeleton.tsx:10-27` |
| loading | Spotlight đọc snapshot | SpotlightBoardSkeleton giữ đúng khung vùng | none | `features/kudos-feed/components/live-board-spotlight-slot.tsx:19-24` |
| loading | Cột phần thưởng đọc dữ liệu | Không có skeleton (`fallback={null}`), cột xuất hiện khi dữ liệu xong | none | `features/kudos-feed/components/live-board-rewards-column-slot.tsx:17-22` |
| loading | Đổi bộ lọc Highlight | Carousel mờ 60% và `aria-busy`; nếu đang rỗng hoặc lỗi thì hiện "Đang tải Kudos…" | none | `features/kudos-feed/components/highlight-carousel.tsx:68,71`, `features/kudos-feed/components/highlight-section.tsx:56` |
| empty | Highlight không có Kudo phù hợp | "Chưa có Kudo nào phù hợp." (vùng polite) | đổi bộ lọc | `features/kudos-feed/components/kudo-feed-status-message.tsx:25-31` |
| empty | Feed không có Kudo | "Chưa có Kudo nào phù hợp." | none | `features/kudos-feed/components/all-kudos-feed.tsx:104` |
| empty | Spotlight chưa có Kudo, hoặc tìm không khớp | "Chưa có Kudos nào để vinh danh." hoặc "Không tìm thấy tên nào" | xoá chữ tìm | `features/spotlight-board/components/spotlight-name-cloud.tsx:35-36,58-63` |
| empty | Chưa có người nhận quà | "Chưa có Sunner nào nhận quà." | none | `features/secret-box-rewards/components/latest-gift-winners-list.tsx:26-27` |
| error | Đọc feed lúc render hoặc Tải thêm lỗi | `role="alert"` "Không tải được Kudos. Vui lòng thử lại." kèm Thử lại | Thử lại | `features/kudos-feed/components/all-kudos-feed.tsx:39,102`, `features/kudos-feed/components/kudo-feed-status-message.tsx:32-46` |
| error | Phiên hết hạn khi gọi API (401) | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." kèm link Đăng nhập lại về `/login?next=/kudos` | Đăng nhập lại | `features/kudos-feed/components/kudo-feed-status-message.tsx:22-47,50-52` |
| error | Đọc Highlight lỗi | Cùng khối lỗi, cục bộ trong R3 | Thử lại | `features/kudos-feed/components/highlight-section.tsx:54-57` |
| error | Snapshot Spotlight lỗi | `role="alert"` "Không tải được Spotlight Board. Vui lòng thử lại." trong khung rỗng | Thử lại | `features/spotlight-board/components/spotlight-load-error.tsx:28-34` |
| error | Kênh realtime Spotlight thất bại | `role="alert"` "Không cập nhật được trực tiếp." kèm Thử lại; số liệu cũ giữ nguyên | Thử lại | `features/spotlight-board/components/spotlight-connection-banner.tsx:26-33` |
| error | Thống kê hoặc danh sách người nhận quà lỗi | Mỗi panel hiện lỗi riêng ("Không tải được thống kê…" hoặc "Không tải được danh sách nhận quà…") kèm Thử lại (refresh route) | Thử lại | `features/secret-box-rewards/components/personal-stats-panel.tsx:63-68`, `features/secret-box-rewards/components/rewards-status-message.tsx:18-43` |
| saving | Tải thêm đang chạy | Nút Tải thêm `aria-busy` và `aria-disabled`, có spinner, con trỏ chờ | none | `features/kudos-feed/components/all-kudos-feed.tsx:105-115` |
| saving | Tim đang chờ server | Nút khoá bằng `aria-busy`, số và tim đổi tạm | none | `features/kudos-hearts/components/kudo-heart-button.tsx:77,100` |
| success | Sao chép link thành công | Toast "Đã sao chép liên kết" 4 giây | none | `features/kudos-feed/components/kudo-copy-link-toast.tsx:24-36` |
| success | Tim hoàn tất | Số tim và biểu tượng giữ trạng thái đã xác nhận (không có toast) | none | `features/kudos-hearts/components/kudo-heart-button.tsx:86` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E14 | Tối đa 50 ký tự | Ô không nhận thêm ký tự | change |
| E19 | Không thả tim cho Kudo của mình | Bạn không thể thả tim cho Kudo của mình | click |
| E19 | Hết cửa sổ ghi thì tim chỉ đọc | Sự kiện đã kết thúc, không thể thả tim nữa | click |
| E19 | Kudo không còn khả dụng | Kudo này không còn khả dụng | server response |
| E19 | Lỗi mạng hoặc server khi đổi tim | Không thể cập nhật, vui lòng thử lại | server response |
| E19 | Sao chép cần quyền clipboard | Không sao chép được liên kết, vui lòng thử lại. | click |
| E02 | Hết cửa sổ ghi thì không gửi hoặc sửa | Sự kiện đã kết thúc, không thể gửi hoặc sửa Kudo nữa. | click (nút bị khoá, dòng thông báo thay vào) |
| E20 | Cursor hợp lệ | Không tải được Kudos. Vui lòng thử lại. | server response |
| E23 | Cần ít nhất một Secret Box chưa mở | Bạn chưa có Secret Box nào | click hoặc focus |

Quy tắc nhập liệu của modal composer (người nhận, lời nhắn, hashtag, ảnh, ẩn danh) thuộc spec của F003_KudosAuthoring, không lặp lại ở đây.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Hết cửa sổ ghi sự kiện | configuration | E02, E03, E19 | Từ `EVENT_END_AT`: ô viết Kudo bị khoá kèm E03; nút tim bị khoá; bút sửa ẩn | Còn cửa sổ ghi (từ `LAUNCH_AT` tới `EVENT_END_AT`) | Server vẫn từ chối bằng mã đóng cửa sổ khi bypass client |
| Người xem là chủ Kudo | auth | E19 | Bút sửa hiện khi là chủ, Kudo không spam, còn cửa sổ ghi | Mọi trường hợp khác | Consequence if bypassed: route sửa kiểm tra lại quyền sở hữu và khoá spam, trả lỗi quyền hạn thay vì cho sửa |
| Có đúng một thẻ hoặc Highlight rỗng | configuration | E08, E09, E10, E11 | Carousel, mũi tên và bộ chuyển hiện khi có ít nhất một Kudo; thông báo hiện khi rỗng, đang tải hoặc lỗi | Ngược lại | Điều kiện theo dữ liệu trả về, không phải cấu hình; dùng loại gần nhất vì bảng loại không có mục dữ liệu |
| Còn trang kế tiếp của feed | configuration | E20, E21 | E20 hiện khi còn `nextCursor`; E21 hiện khi rỗng, đang tải, lỗi | Hết trang và không lỗi | Điều kiện theo dữ liệu trả về; cùng chú thích loại như dòng trên |
| Có Secret Box chưa mở | configuration | E23 | Bấm được khi số hộp chưa mở lớn hơn 0; còn lại mờ kèm tooltip; không có nút khi thống kê lỗi | Thống kê lỗi (không có nút, deep link vẫn mở được modal) | Điều kiện theo dữ liệu của người xem |
| Kết nối realtime Spotlight | configuration | E17 | Đang nối lại hoặc đã thất bại | Đang kết nối hoặc đã live | Điều kiện theo trạng thái kênh |
| Màn hình rộng từ `md` hoặc `lg` | responsive | E09, E08 | Mũi tên bên của carousel chỉ từ `md`; hai cột R2 và R5/R6 từ `lg` | Dưới các mốc đó | Xem § 10 |

## 8. Navigation

> **D3 — the DRY statement that MUST appear verbatim in the template and the contract:**
>
> `## 8. Navigation` is the **per-screen projection** of `screen-flow.md § Screen Access Paths`.
> It is not a second source of truth. Every row here MUST be derivable from a path in
> `screen-flow.md`; every path in `screen-flow.md` touching this SCR### MUST appear here.
> Two-way consistency is a reviewer rule (`screen.nav_flow_skew`), not a Python check.
> `## 4. User Actions § Happy Path` narrative keeps its v27 scope rule unchanged: **prose still
> must not narrate cross-screen navigation**; only the § Exits *table* may name destinations.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR003_AppLayout | Bấm mục Sun* Kudos ở header hoặc footer | — | `docs/generated/screen-flow.md:204` |
| SCR011_Homepage | Bấm ABOUT KUDOS hoặc banner Kudos | — | `docs/generated/screen-flow.md:198` |
| SCR008_AwardsSystem | Bấm nút trong KudosBanner | — | `docs/generated/screen-flow.md:199` |
| SCR012_Rules | Bấm "Viết KUDOS" | — | `docs/generated/screen-flow.md:200` |
| SCR006_KudoDetail | Bấm Đóng hoặc nút về Live board ở trạng thái 404 | — | `docs/generated/screen-flow.md:222` |
| SCR015_OtherProfile | Bấm nút về Live board ở trạng thái 404 | `userId` sai định dạng hoặc không tồn tại | `docs/generated/screen-flow.md:227` |
| SCR003_AppLayout/REG001_NotificationBell | Bấm dòng thông báo hộp quà (`/kudos?secretBox=open`) | Dòng loại `secret_box_granted` | `docs/generated/screen-flow.md:212` |
| SCR017_AllNotifications | Bấm dòng thông báo hộp quà | Dòng loại `secret_box_granted` | `docs/generated/screen-flow.md:231` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Xem chi tiết Kudo (từ Highlight) | E19 | Kudo công khai | SCR006_KudoDetail | redirect | `features/kudos-feed/components/kudo-card.tsx:76-79` |
| Xem chi tiết Kudo (từ feed) | E19 | Kudo công khai | SCR006_KudoDetail | redirect | `features/kudos-feed/components/kudo-card.tsx:76-79` |
| Chọn một Sunner trong kết quả tìm | E04 | Không phải chính mình | SCR015_OtherProfile | redirect | `features/kudos-feed/components/sunner-profile-search.tsx:23-26` |
| Chọn chính mình trong kết quả tìm | E04 | Ô tìm không loại chính mình | SCR016_OwnProfile | redirect (route hồ sơ tự chuyển `/profile/{id}` của mình về `/profile`) | `app/(app)/profile/[userId]/page.tsx:33` |
| Bấm tên người nhận trong đám mây Spotlight | E13 | — | SCR015_OtherProfile | redirect | `features/spotlight-board/components/spotlight-name-cloud.tsx:44-55` |
| Bấm tên hoặc avatar người có tên trên thẻ Kudo | E19 | Người gửi không ẩn danh | SCR015_OtherProfile | redirect | `features/kudos-feed/components/kudo-card-sender.tsx:27-49` |
| Đăng nhập lại | E21 | Phiên hết hạn (401) | SCR001_Login (`/login?next=/kudos`) | redirect | `features/kudos-feed/components/kudo-feed-status-message.tsx:24,35-38` |
| Bấm link Tiêu chuẩn cộng đồng trong thanh công cụ composer | — (trong modal composer, REG001_KudoComposer; E02 chỉ là nút mở) | Modal composer đang mở | SCR009_CommunityStandards | new tab | `features/kudos-authoring/components/kudo-message-toolbar.tsx:52-60` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Carousel `role="region"` `aria-roledescription="carousel"` và từng slide `role="group"` đặt nhãn "n / N"; ô tìm Sunner có `<label>` `sr-only` và `role="combobox"`; bộ lọc `aria-haspopup="listbox"`, `aria-expanded`; `aria-labelledby` cho các section ALL KUDOS và Spotlight; ticker `role="log"`; nút tim `aria-pressed`; mũi tên và pager có `aria-label` |
| Keyboard navigation | supported | ←/→ trong carousel; ↑/↓/Home/End/Enter/Space/Tab/Esc trong danh sách lọc; combobox hỗ trợ ↑/↓/Enter/Esc; nút khoá dùng `aria-disabled` nên vẫn focus được; danh sách người nhận quà `tabIndex=0` để cuộn bằng bàn phím |
| Focus management | managed | Mở danh sách lọc thì focus vào mục đã chọn hoặc "Tất cả", đóng thì về nút; sau Tải thêm focus vào thẻ mới đầu tiên; đóng modal Secret Box trả focus về nút; thẻ bên carousel `inert` |
| Screen reader compatibility | unknown | Có `<h1>` ở tiêu đề, `<h2>` mỗi section, `<aside aria-label>` cho cột phần thưởng; skeleton `aria-hidden`; chưa có kiểm thử thực tế với trình đọc màn hình |
| Error announcement | supported | Lỗi feed, Highlight, Spotlight và panel phần thưởng đều `role="alert"`; trạng thái rỗng và đang tải ở vùng `aria-live="polite"`; dòng "Đã tải thêm n Kudo" ở `role="status"` |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (dưới lg) | R2 | Ô viết Kudo và ô tìm xếp dọc; từ `lg` chia hai cột 738fr/381fr | `app/(app)/kudos/page.tsx:58` |
| mobile (dưới lg) | R5, R6 | Cột phần thưởng xếp dưới feed toàn chiều rộng; từ `lg` cạnh nhau, feed 680 px và cột 422 px | `app/(app)/kudos/page.tsx:71-72`, `features/secret-box-rewards/components/rewards-column.tsx:16` |
| mobile (dưới md) | E09, R3 | Mũi tên bên và lớp mờ hai bên ẩn, thẻ rộng bằng khung trừ 32 px; còn bộ chuyển trang | `features/kudos-feed/components/highlight-carousel.tsx:18-22,60,94-95` |
| mobile (dưới md) | R1, R3, R5 | Tiêu đề section và h1 nhỏ hơn; đầu trang đệm trên 144 px, từ `md` đệm 184 px | `app/(app)/kudos/page.tsx:90`, `features/kudos-feed/components/live-board-section-header.tsx:24-25` |
| mobile (dưới md) | E06, E07 | Danh sách lọc mở neo trái; từ `md` neo phải | `features/kudos-feed/components/highlight-filter-dropdown.tsx:108` |
| mobile (dưới md) | E14, E12 | Ô tìm Spotlight và bộ đếm nằm cùng hàng trên cùng; từ `md` định vị tuyệt đối trên khung | `features/spotlight-board/components/spotlight-board.tsx:60-66` |
| mobile (dưới md) | E19 | Thẻ post lề ngang 16 px, từ `md` 40 px; hàng hành động tự xuống dòng | `features/kudos-feed/components/kudo-card.tsx:43-45,61` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| R2..R6 | handler | `KudosLiveBoardPage` đồng bộ; `LiveBoardContent` async đọc `requireSunner`, `isKudoWritingOpen`, `KudoPublicQuery.list`, `listHighlightKudos`, `listActiveHashtags`, `listDepartmentOptions` bằng `Promise.all`, mỗi vùng bọc `settle` | `app/(app)/kudos/page.tsx:28-53,88-98` |
| R4 | handler | `loadSpotlightSnapshot` (server) trong `SpotlightBoardLoader` với Suspense riêng | `features/kudos-feed/components/live-board-spotlight-slot.tsx:15-24` |
| R6 | handler | `loadRewardsColumnData` (server) trong `RewardsColumnLoader` với Suspense riêng | `features/kudos-feed/components/live-board-rewards-column-slot.tsx:13-22` |
| E02 | endpoint | Server Action `createKudo` (ROUTE023); modal còn gọi `POST /api/kudos/images/sign` (ROUTE010), `GET /api/hashtags` (ROUTE013), Storage `uploadKudoImage` từ trình duyệt | `features/kudos-authoring/components/kudo-image-upload-client.ts:35` |
| E19 | endpoint | Server Action `updateKudo` (ROUTE024) và `GET /api/kudos/:id/edit` (ROUTE009) cho chế độ sửa | `features/kudos-feed/components/kudo-owner-edit-button.tsx:36-40` |
| E04 | endpoint | `GET /api/sunners/search` (ROUTE018), debounce 250 ms, `excludeSelf=false` | `features/sunner-search/components/use-sunner-search.ts:23`, `features/kudos-feed/components/sunner-profile-search.tsx:36-41` |
| E06, E07, E08 | endpoint | `GET /api/kudos/highlight?hashtag&department` (ROUTE008) khi đổi bộ lọc | `features/kudos-feed/components/use-highlight-kudos.ts:35-43` |
| E12..E17 | endpoint | `GET /api/spotlight` (ROUTE017) cho snapshot và đồng bộ lại; kênh Realtime riêng `spotlight` qua `useSpotlightChannel` | `features/spotlight-board/components/spotlight-board.tsx:33-44` |
| E19, E20 | endpoint | `GET /api/kudos?cursor` (ROUTE007), 10 thẻ mỗi trang, mới nhất trước | `features/kudos-feed/components/all-kudos-feed.tsx:63-64`, `features/kudos-feed/server/kudo-public-query.ts:19` |
| E19 | endpoint | Server Action `addHeartAction` (ROUTE025), `removeHeartAction` (ROUTE026); hover card `GET /api/sunners/:userId/card` (ROUTE019) | `features/kudos-hearts/components/kudo-heart-button.tsx:25-34` |
| E22, E23 | endpoint | `GET /api/secret-boxes/me` (ROUTE015) và `POST /api/secret-boxes/open` (ROUTE016, có Idempotency-Key) do modal Secret Box gọi | `features/secret-box-rewards/components/secret-box-opener.ts:37` |
| E23 | js | Deep link: `useSearchParams().get("secretBox") === "open"`; đóng thì `history.replaceState` bỏ tham số rồi `router.refresh()` | `features/secret-box-rewards/components/secret-box-launcher.tsx:38-58` |
| § 7. | feature-flag | `writingOpen = isKudoWritingOpen()` → `isEventWritingOpen(now)`; mở từ `LAUNCH_AT` tới `EVENT_END_AT` | `features/kudos-authoring/server/kudo-write-window.ts:11-14`, `shared/config/event-window.ts:11` |
| E19 | helper | `kudoCardCanEdit({ isOwner, isSpam, writingOpen })` | `features/kudos-feed/components/kudo-card-can-edit.ts:6-8` |
| E21 | helper | `failureOf(response)`: 401 thành "unauthorized", còn lại "error" | `features/kudos-feed/components/kudo-feed-status-message.tsx:50-52` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| KudoCard | `variant` | `post` (feed, 680, có ảnh), `highlight` (528, viền vàng 4 px, không ảnh) | `writingOpen`; thẻ spam không xuất hiện trên màn hình này | DISC-002 |
| KudoCardPeople / người gửi | `sender.anonymous` | named, anonymous | `tabbable` | MODEL003_Kudo.is_anonymous |
| KudoHeartButton | `variant` | `card` | `isOwner`, `writingOpen` | MODEL008_KudoHeart |
| LiveBoardSectionHeader | — | dùng chung cho Highlight, Spotlight, All Kudos | `title`, `headingId`, `children` (bộ lọc) | N/A |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` trong `LiveBoardContent` và layout `(app)` | auth | Khách bị chuyển tới `/login`, người chưa có phòng ban tới onboarding; [UNVERIFIED] server enforcement — proxy session là lớp thứ hai, cần xác nhận khi chạy thật |
| Cổng prelaunch ở proxy | role | Trước `LAUNCH_AT`, người không phải admin bị chuyển tới `/countdown`; lời gọi API và Server Action nhận 403 JSON |
| Các API `GET /api/kudos`, `/api/kudos/highlight`, `/api/spotlight`, `/api/sunners/search` | auth | Không có phiên thì 401, giao diện hiện "hết phiên"; không có phiên mà vẫn đọc được thì lộ dòng thời gian Kudo |
| `KudoPublicQuery.list` chỉ trả Kudo công khai; spam của chính chủ chỉ khi `senderId = viewerId` | permission | Bypass sẽ lộ Kudo spam đang bị ẩn lên Live board; Live board không bật cờ này |
| Che người gửi ẩn danh ở server (`maskKudoRow`) | permission | Bỏ che thì lộ danh tính người gửi ẩn danh qua payload RSC và API |
| Kênh Realtime `spotlight` riêng tư | auth | [UNVERIFIED] — chính sách kênh nằm ngoài tầm đọc của spec này; xem spec F008_SpotlightBoard |

## Source References

1. Page/View: `app/(app)/kudos/page.tsx:22-100`
2. Khung layout và slot: `features/kudos-feed/components/live-board-keyvisual.tsx:9-30`, `features/kudos-feed/components/live-board-section-header.tsx:18-32`, `features/kudos-feed/components/live-board-skeleton.tsx:10-27`, `features/kudos-feed/components/live-board-spotlight-slot.tsx:15-25`, `features/kudos-feed/components/live-board-rewards-column-slot.tsx:13-23`
3. Ô viết Kudo (REG001): `features/kudos-authoring/components/kudo-composer-launcher.tsx:23-52`, `features/kudos-authoring/components/kudo-message-toolbar.tsx:52-60`
4. Ô tìm Sunner (REG002): `features/kudos-feed/components/sunner-profile-search.tsx:17-46`
5. Highlight (REG003): `features/kudos-feed/components/highlight-section.tsx:25-69`, `features/kudos-feed/components/highlight-carousel.tsx:36-113`, `features/kudos-feed/components/highlight-filter-dropdown.tsx:32-130`, `features/kudos-feed/components/use-highlight-kudos.ts:18-72`
6. Spotlight (REG004): `features/spotlight-board/components/spotlight-board-region.tsx:16-26`, `features/spotlight-board/components/spotlight-board.tsx:25-74`, `features/spotlight-board/components/spotlight-name-cloud.tsx:27-66`, `features/spotlight-board/components/spotlight-search-input.tsx:19-45`
7. Feed (REG005): `features/kudos-feed/components/all-kudos-feed.tsx:33-122`, `features/kudos-feed/components/kudo-card.tsx:33-84`, `features/kudos-feed/components/kudo-feed-status-message.tsx:22-52`, `features/kudos-feed/components/kudo-owner-edit-button.tsx:18-43`, `features/kudos-feed/components/kudo-card-can-edit.ts:6-8`
8. Cột phần thưởng (REG006): `features/secret-box-rewards/components/rewards-column.tsx:13-21`, `features/secret-box-rewards/components/personal-stats-panel.tsx:41-71`, `features/secret-box-rewards/components/secret-box-launcher.tsx:38-73`, `features/secret-box-rewards/components/open-secret-box-button.tsx:21-77`, `features/secret-box-rewards/components/latest-gift-winners-list.tsx:16-47`
9. Truy vấn: `features/kudos-feed/server/kudo-public-query.ts:19-96`
10. Parent shell context: `app/(app)/layout.tsx:17-28`

## Source Walkthrough

1. **File:** `app/(app)/kudos/page.tsx:22-100` — trang ghép sáu vùng, chỗ `settle` và Suspense, nơi nhìn rõ ranh giới các REG.
2. **File:** `features/kudos-feed/server/kudo-public-query.ts:19-96` — nguồn dữ liệu feed và quy tắc spam; đối chiếu MODEL003_Kudo trong `entities.md`.
3. **File:** `features/kudos-feed/components/kudo-card.tsx:33-84` — thẻ Kudo dùng cho cả Highlight và feed.
4. **File:** `features/kudos-feed/components/all-kudos-feed.tsx:33-122` — phân trang cursor, focus và thông báo sau Tải thêm.
5. **File:** `features/kudos-feed/components/highlight-section.tsx:25-69` — Highlight, bộ lọc và trạng thái cục bộ.
6. **File:** `features/kudos-feed/components/use-highlight-kudos.ts:18-72` — luồng lọc và huỷ yêu cầu cũ.
7. **File:** `features/kudos-feed/components/highlight-carousel.tsx:36-113` — carousel và bàn phím.
8. **File:** `features/kudos-authoring/components/kudo-composer-launcher.tsx:23-52` — REG001 và khoá theo cửa sổ ghi.
9. **File:** `features/spotlight-board/components/spotlight-board.tsx:25-74` — REG004, trạng thái realtime.
10. **File:** `features/secret-box-rewards/components/secret-box-launcher.tsx:38-73` — REG006 và deep link `secretBox=open`.

### Call Hierarchy

```text
KudosLiveBoardPage -> Suspense(LiveBoardSkeleton) -> LiveBoardContent -> settle(KudoPublicQuery.list | listHighlightKudos | listActiveHashtags | listDepartmentOptions)
LiveBoardContent -> KudoComposerLauncher -> KudoComposerModal
LiveBoardContent -> SunnerProfileSearch -> SunnerSearchCombobox -> router.push
LiveBoardContent -> HighlightSection -> useHighlightKudos -> GET /api/kudos/highlight
HighlightSection -> HighlightCarousel -> KudoCard
LiveBoardContent -> LiveBoardSpotlightSlot -> SpotlightBoardRegion -> SpotlightBoard -> useSpotlightChannel
LiveBoardContent -> AllKudosFeed -> KudoCard -> KudoHeartSlot | KudoCopyLinkButton | KudoOwnerEditButton
AllKudosFeed -> GET /api/kudos?cursor
LiveBoardContent -> LiveBoardRewardsColumnSlot -> RewardsColumn -> PersonalStatsPanel -> SecretBoxLauncher
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
session + locale -> LiveBoardContent (Promise.all, mỗi vùng settle) -> props (feed, highlight, hashtags, departments, writingOpen) -> vùng client
Đổi bộ lọc -> useHighlightKudos -> GET /api/kudos/highlight -> setFetched, active = 0 -> carousel
Bấm Tải thêm -> GET /api/kudos?cursor -> setOlder, setCursor -> thẻ mới, focus, thông báo
Kênh spotlight -> reducer -> tên, bộ đếm, ticker; kết nối lại -> GET /api/spotlight -> replace
```

Các hop trên suy ra từ Call Hierarchy ở trên và các trích dẫn trong `## Source References`.

## Unresolved Questions

1. Đọc danh sách hashtag hoặc phòng ban lỗi thì bộ lọc chỉ còn "Tất cả" mà không có thông báo nào (`?? []`). Đây là hành vi quan sát được; chưa rõ có chủ ý hay thiếu trạng thái lỗi cho bộ lọc. (`app/(app)/kudos/page.tsx:64-65`)
2. Cột phần thưởng không có skeleton (`fallback={null}`) nên có thể nhảy bố cục khi dữ liệu xong; chưa rõ có chủ ý. (`features/kudos-feed/components/live-board-rewards-column-slot.tsx:19`)
3. Chính sách quyền của kênh Realtime `spotlight` và hành vi nội bộ modal composer, modal Secret Box chưa đọc (không đọc: thuộc feature chủ ngoài độ sâu một cấp). 
