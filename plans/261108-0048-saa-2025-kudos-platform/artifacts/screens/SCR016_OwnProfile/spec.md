---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR016_OwnProfile — Screen Spec

**Screen**: SCR016_OwnProfile: OwnProfile
**Feature**: F012_Profile
**Type**: atomic
**Route**: /profile
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner xem hồ sơ của chính mình (avatar, tên, đơn vị, bậc Hero, bộ sưu tập icon, số liệu cá nhân và các Kudo đã gửi hoặc đã nhận) và mở Secret Box; họ vào màn này từ menu tài khoản, từ kết quả tìm Sunner hoặc từ thông báo lên bậc Hero / đủ bộ icon.
**Actors:** Sunner (người dùng đã đăng nhập và đã chọn đơn vị). Người dùng luôn là chủ phiên, không có tham số chọn người khác.
**Entry Conditions:** Có phiên hợp lệ và hồ sơ đã có đơn vị; khách bị đưa về trang đăng nhập, người chưa có đơn vị bị đưa về trang chọn đơn vị trước khi trang render.
**Exit Conditions:** Người dùng rời sang chi tiết một Kudo hoặc hồ sơ người khác; hoặc ở lại để lọc, tải thêm, sửa Kudo, mở Secret Box. Màn chỉ đọc, không có thao tác "lưu".

## 2. Screen Layout

### Layout Sketch

Trang nằm trong layout nhóm `(app)`: header dính trên cùng (mờ, cao 80 px), phần thân và footer. Thân trang là một cột 680 px canh giữa, phủ ảnh keyvisual Live board chạy ngầm dưới header (`-mt-20`), gồm ba khối cách nhau 64 px: khối thông tin hồ sơ canh giữa (avatar 200 px, tên, mã đơn vị kèm huy hiệu Hero, hàng 6 icon và chú thích), bảng thống kê cá nhân kèm nút "Mở Secret Box", rồi phần KUDOS với bộ lọc Đã gửi / Đã nhận và danh sách thẻ Kudo. Bảng thống kê tải trong một Suspense riêng nên các khối khác không phải chờ nó. (`app/(app)/layout.tsx:17-29`, `features/profile/components/profile-page-frame.tsx:9-16`, `app/(app)/profile/page.tsx:29-35`)

```
┌─────────────────────────────────────────────┐
│ R1: App Header (sticky, mờ)  [bell] [avatar]│
├─────────────────────────────────────────────┤
│  (keyvisual nền, cột 680 px canh giữa)      │
│  ┌───────────────────────────────────────┐  │
│  │ R2: Profile Info (static)             │  │
│  │   avatar · tên · đơn vị · Hero · icon │  │
│  ├───────────────────────────────────────┤  │
│  │ R3: Personal Stats (static, Suspense) │  │
│  │   5 số liệu · [Mở Secret Box]         │  │
│  ├───────────────────────────────────────┤  │
│  │ R4: KUDOS Section (static)            │  │
│  │   KUDOS ........ [Đã gửi (n) ▾]       │  │
│  │   thẻ Kudo ... [Tải thêm]             │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│ R5: App Footer (static)                     │
└─────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | App Header | sticky | no | AppHeader, NotificationBellSlot (thuộc SCR003_AppLayout, không mô tả lại) |
| R2 | Profile Info | static | no | ProfilePageFrame, ProfileHeader, UserAvatar, KudoCardHeroBadgeSlot, IconCollection |
| R3 | Personal Stats | static | no | ProfileStatsPanelSlot, PersonalStatsPanel, SecretBoxLauncher, OpenSecretBoxButton, RewardsStatusMessage |
| R4 | KUDOS Section | static | no | ProfileKudosSection, LiveBoardSectionHeader, ProfileKudosDirectionDropdown, KudoCard, KudoFeedStatusMessage |
| R5 | App Footer | static | no | AppFooter |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Avatar (200 px, viền trắng) | image | — | Chữ cái đầu của tên khi chưa có ảnh | Always | — | API field | raw | chữ cái đầu (hoặc "?") | MODEL004_Profile.avatar_url |
| E02 | Tên Sunner (tiêu đề h1) | display field | — | Visible | Always | — | API field | raw, xuống dòng tự do | — | MODEL004_Profile.full_name |
| E03 | Mã đơn vị | display field | — | Visible | Conditional | — | API field | raw | hidden | MODEL001_Department.code |
| E04 | Huy hiệu Hero (kèm tooltip) | display field | — | Hidden | Conditional | — | API field | nhãn bậc | hidden | MODEL003_Kudo (bậc tính khi đọc) |
| E05 | Bộ sưu tập icon (6 vòng tròn, "×N" khi có từ 2 cái) | list | — | 6 vòng, chưa có thì xám | Conditional | — | API field | ×N khi số lượng > 1 | hidden | MODEL012_UserIcon |
| E06 | Chú thích "Bộ sưu tập icon của tôi" | display field | — | Visible | Conditional | — | static | raw | hidden | N/A |
| E07 | Số Kudos bạn nhận được | display field | — | Visible | Conditional | — | API field | số theo locale | dash | MODEL003_Kudo |
| E08 | Số Kudos bạn đã gửi | display field | — | Visible | Conditional | — | API field | số theo locale | dash | MODEL003_Kudo |
| E09 | Số tim bạn nhận được | display field | — | Visible | Conditional | — | API field | số theo locale (có trọng số) | dash | MODEL008_KudoHeart |
| E10 | Huy hiệu "x2" (tim đang nhân đôi) | image | — | Hidden | Conditional | — | API field | "x2" | hidden | MODEL008_KudoHeart |
| E11 | Số Secret Box bạn đã mở | display field | — | Visible | Conditional | — | API field | số theo locale | dash | MODEL011_SecretBox |
| E12 | Số Secret Box chưa mở | display field | — | Visible | Conditional | — | API field | số theo locale | dash | MODEL011_SecretBox |
| E13 | Mở Secret Box | button | — | Enabled (mờ khi chưa có hộp) | Conditional | Mở cửa sổ Secret Box | — | — | — | N/A |
| E14 | Lỗi "Không tải được thống kê. Vui lòng thử lại." | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E15 | Thử lại (thống kê) | button | — | Enabled | Conditional | Đọc lại cả trang từ server | — | — | — | N/A |
| E16 | Tiêu đề KUDOS (kèm dòng "Sun* Annual Awards 2025" và đường kẻ) | region label | — | Visible | Always | — | static | raw | — | N/A |
| E17 | Bộ lọc "Đã gửi (n)" / "Đã nhận (n)" | select | no | "Đã gửi" | Conditional | Mở danh sách chọn chiều | store state | "{nhãn} ({số})" | hidden | MODEL003_Kudo |
| E18 | Danh sách thẻ Kudo (10 thẻ mỗi trang, thả tim và Copy Link nằm trong thẻ) | list | — | Danh sách trang đầu do server dựng | Always | — | API field | thẻ rộng 680 px | Chưa có Kudo nào. | MODEL003_Kudo |
| E19 | Bút sửa Kudo trên thẻ | button | — | Hidden | Conditional | Mở cửa sổ sửa Kudo | — | — | hidden | N/A |
| E20 | Xem chi tiết (trên thẻ) | link | — | Visible | Always | Mở chi tiết Kudo | — | — | — | N/A |
| E21 | Tên người trong thẻ (người gửi / người nhận) | link | — | Visible | Always | Mở hồ sơ người đó | API field | raw | — | MODEL004_Profile.full_name |
| E22 | Tag "Spam" và lớp phủ mờ cảnh báo trên thẻ | message | — | Hidden | Conditional | — | API field | raw | hidden | MODEL003_Kudo |
| E23 | Tải thêm | button | — | Enabled | Conditional | Tải trang Kudo kế tiếp | — | — | — | N/A |
| E24 | Trạng thái danh sách ("Đang tải Kudos…", "Chưa có Kudo nào.", "Không tải được Kudos. Vui lòng thử lại.") | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E25 | Thử lại / Đăng nhập lại (trạng thái lỗi danh sách) | button | — | Enabled | Conditional | Tải lại danh sách / đi tới trang đăng nhập | — | — | — | N/A |

Ghi chú: thẻ Kudo (E18–E22) là component dùng chung với Live board; màn này chỉ truyền `variant="post"` và cờ `writingOpen`, phần còn lại (nội dung thẻ, nút thả tim, Copy Link, hover card avatar) thuộc F003/F004/F005 và không liệt kê lại. Cụm số liệu E07–E13 nằm trong một vùng có tên "Thống kê của bạn".

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở Secret Box | E13 | click | Có ít nhất một hộp chưa mở | Mở cửa sổ Secret Box; đóng lại thì số liệu E07–E12 được đọc lại | `features/secret-box-rewards/components/secret-box-launcher.tsx:51-58,69-70` |
| Xem lý do không mở được | E13 | hover chuột / focus bàn phím / chạm | Chưa có hộp nào (nút mờ nhưng vẫn focus được) | Hiện tooltip "Bạn chưa có Secret Box nào"; nút không làm gì | `features/secret-box-rewards/components/open-secret-box-button.tsx:27,51-57` |
| Đọc lại thống kê | E15 | click | Thống kê đọc lỗi | Nút khóa trong lúc server dựng lại trang, rồi thay bằng bảng số liệu hoặc lại báo lỗi | `features/secret-box-rewards/components/rewards-status-message.tsx:31-37` |
| Đổi chiều danh sách | E17 | click rồi chọn "Đã gửi" hoặc "Đã nhận" | Đã có số đếm | Danh sách và nút lọc chuyển sang chiều mới, bắt đầu lại từ trang đầu | `features/profile/components/profile-kudos-direction-dropdown.tsx:42-46`, `features/profile/components/use-profile-kudos-list.ts:76-82` |
| Sửa Kudo của mình | E19 | click | Kudo của chính mình, không bị đánh dấu spam, cửa sổ viết còn mở | Mở cửa sổ viết Kudo ở chế độ sửa trên màn này | `features/kudos-feed/components/kudo-owner-edit-button.tsx:25-39`, `features/kudos-feed/components/kudo-card.tsx:36,53` |
| Mở chi tiết Kudo | E20 | click | — | Rời màn (xem § 8) | `features/kudos-feed/components/kudo-card.tsx:76-80` |
| Mở hồ sơ người trong thẻ | E21 | click | Thẻ không nằm dưới lớp phủ spam | Rời màn (xem § 8) | `features/kudos-feed/components/kudo-card-sender.tsx:28` |
| Tải thêm Kudo | E23 | click | Còn trang kế tiếp và không có yêu cầu đang chạy | Nối thêm tối đa 10 thẻ, focus chuyển tới thẻ đầu của đợt mới, thông báo "Đã tải thêm {n} Kudo" | `features/profile/components/profile-kudos-section.tsx:45-51,68-79` |
| Thử lại danh sách | E25 | click | Đọc danh sách lỗi (không phải 401) | Đọc lại trang đầu, hoặc đúng trang đang lỗi nếu đã có trang đầu | `features/profile/components/use-profile-kudos-list.ts:90-92` |

### Happy Path

1. Sunner mở `/profile`; khối R2 hiện avatar, tên, mã đơn vị, huy hiệu Hero và hàng 6 icon với chú thích "Bộ sưu tập icon của tôi".
2. Khối R3 xuất hiện sau khi server đọc xong thống kê cá nhân (năm số liệu và nút "Mở Secret Box").
3. Khối R4 hiện sẵn trang đầu của chiều "Đã gửi" (10 thẻ), nút lọc ghi "Đã gửi (n)".
4. Sunner chọn "Đã nhận" ở E17; danh sách đổi sang các Kudo đã nhận, số đếm trên nút cập nhật theo.
5. Sunner bấm "Tải thêm" ở E23; các thẻ mới nối vào cuối, focus chuyển tới thẻ đầu tiên của đợt mới.
6. Sunner bấm "Mở Secret Box" ở E13, mở hộp xong thì đóng cửa sổ; số "đã mở / chưa mở" được cập nhật.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 (dựng trang) | Hồ sơ của phiên không đọc được | Trang không render mà ném lỗi nội bộ (không phải 404) | `app/(app)/profile/page.tsx:26-27` |
| Bước 1 | Đọc bậc Hero lỗi | Bỏ huy hiệu, vẫn hiện mã đơn vị | `features/profile/server/profile-page-data.ts:23-30,45`, `features/profile/components/profile-header.tsx:32-36` |
| Bước 1 | Đọc bộ sưu tập icon lỗi | Bỏ cả hàng icon lẫn chú thích | `features/profile/server/profile-page-data.ts:46`, `features/profile/components/profile-header.tsx:39` |
| Bước 2 | Đọc thống kê lỗi | Thay bảng số liệu bằng E14 và E15; deep link `?secretBox=open` vẫn mở được cửa sổ, nút E13 không hiện | `features/profile/components/profile-stats-panel-slot.tsx:13-22`, `features/secret-box-rewards/components/personal-stats-panel.tsx:63-67` |
| Bước 3 | Đọc trang đầu của danh sách lỗi | Không có số đếm nên không hiện E17; E24 báo lỗi kèm E25 | `features/profile/server/profile-page-data.ts:55`, `features/profile/components/profile-kudos-section.tsx:56,65` |
| Bước 3 | Chiều hiện tại không có Kudo nào | Hiện "Chưa có Kudo nào." và không có nút "Tải thêm" | `features/profile/components/profile-kudos-section.tsx:67` |
| Bước 4 | Đổi chiều liên tục nhiều lần | Yêu cầu cũ bị hủy, chỉ chiều chọn sau cùng được hiện | `features/profile/components/use-profile-kudos-list.ts:36,64` |
| Bước 5 | Con trỏ trang bị server từ chối (400) khi tải thêm | Danh sách xóa sạch, E25 "Thử lại" đọc lại từ trang đầu | `features/profile/components/use-profile-kudos-list.ts:49-54,90-92` |
| Bước 5 | Phiên hết hạn (401) khi đọc danh sách | E24 "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." và E25 thành liên kết đăng nhập quay về `/profile` | `features/kudos-feed/components/kudo-feed-status-message.tsx:34-39,50-52` |
| Thẻ Kudo spam của mình | Kudo của chính mình bị đánh dấu spam | Thẻ có tag "Spam" và lớp phủ mờ; ẩn thả tim, Copy Link, bút sửa; các liên kết trong thẻ không focus được | `features/kudos-feed/components/kudo-card.tsx:37,47-48,62-63,75` |
| Bước 6 | Chưa có hộp chưa mở | Nút mờ, bấm không mở gì (xem tooltip ở trên) | `features/secret-box-rewards/components/open-secret-box-button.tsx:27` |

### Interaction Notes

- **Chọn chiều ở bộ lọc bằng bàn phím: mũi tên lên/xuống, Home, End để di chuyển, Enter/Space để chọn, Esc đóng và trả focus về nút, Tab đóng rồi đi tiếp** — source: `features/profile/components/profile-kudos-direction-dropdown.tsx:38-40,48-63`
- **Bấm "Tải thêm" thì focus nhảy tới thẻ Kudo đầu tiên của đợt vừa tải và người dùng đọc màn hình nghe "Đã tải thêm {n} Kudo"** — source: `features/profile/components/profile-kudos-section.tsx:41-51,80-82`
- **Đổi chiều lọc không đổi URL; nút "Tải thêm" bị bỏ qua khi một yêu cầu đang chạy, tránh tải đôi** — source: `features/profile/components/use-profile-kudos-list.ts:85-88`
- **Đóng cửa sổ Secret Box làm trang đọc lại từ server nên số liệu thống kê tự cập nhật; mở bằng deep link thì tham số `secretBox` bị gỡ khỏi URL mà không điều hướng** — source: `features/secret-box-rewards/components/secret-box-launcher.tsx:51-58`
- **Sau khi gửi hoặc sửa một Kudo, phần KUDOS dựng lại nếu trang đầu mới khác trang đầu cũ (khóa theo số đếm và id thẻ đầu)** — source: `features/profile/server/profile-page-data.ts:60-64`, `app/(app)/profile/page.tsx:33`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading (trang) | Mở `/profile` | Route chặn: layout và trang đọc phiên rồi mới render, không có skeleton riêng | none | `app/(app)/profile/page.tsx:16,24-25` |
| loading (thống kê) | Server đang đọc thống kê | Vùng R3 trống (Suspense `fallback={null}`), các khối khác đã hiện | none | `features/profile/components/profile-stats-panel-slot.tsx:24-30` |
| loading (đổi chiều / tải thêm) | `fetch` danh sách đang chạy | Đổi chiều: dòng "Đang tải Kudos…". Tải thêm: nút có spinner, `aria-busy`, `aria-disabled` | none | `features/profile/components/profile-kudos-section.tsx:66,72-77` |
| empty | Chiều chọn không có Kudo | "Chưa có Kudo nào.", không có nút "Tải thêm" | Đổi chiều lọc | `features/profile/components/profile-kudos-section.tsx:67` |
| error (thống kê) | Đọc thống kê lỗi | E14 "Không tải được thống kê. Vui lòng thử lại." và nút "Thử lại" | Thử lại (E15) | `features/profile/components/profile-stats-panel-slot.tsx:16-20`, `features/secret-box-rewards/components/personal-stats-panel.tsx:63-67` |
| error (danh sách) | Trang đầu hoặc `fetch` lỗi | "Không tải được Kudos. Vui lòng thử lại." và nút "Thử lại" | Thử lại (E25) | `features/profile/components/use-profile-kudos-list.ts:30,54,66`, `features/kudos-feed/components/kudo-feed-status-message.tsx:33-45` |
| error (phiên hết hạn) | Danh sách trả 401 | Thông báo hết phiên và liên kết "Đăng nhập lại" | Đăng nhập lại (E25) | `features/kudos-feed/components/kudo-feed-status-message.tsx:34-39` |
| error (hồ sơ) | Không có hồ sơ cho user của phiên | Lỗi nội bộ do trang ném ra (hiển thị phụ thuộc error boundary toàn cục, xem Unresolved Questions) | none | `app/(app)/profile/page.tsx:27` |
| saving | Server Action thả tim / sửa Kudo đang chạy | Do thẻ Kudo và cửa sổ sửa xử lý (component dùng chung, không mô tả ở đây) | none | `features/kudos-feed/components/kudo-card.tsx:65-73` |
| success | Tải thêm xong; sửa Kudo xong | Thẻ mới nối vào và có thông báo đọc màn hình; toast "Đã lưu thay đổi." nằm ở layout `(app)` | dismiss (toast tự tắt) | `features/profile/components/profile-kudos-section.tsx:48-51`, `features/kudos-feed/components/kudo-owner-edit-button.tsx:8-13` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E14 | Thống kê cá nhân phải đọc được | "Không tải được thống kê. Vui lòng thử lại." | server response |
| E24 | Danh sách Kudo phải đọc được | "Không tải được Kudos. Vui lòng thử lại." | server response |
| E24 | Phiên phải còn hạn khi đọc danh sách | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." | server response |
| E24 | Chiều "Đã nhận"/"Đã gửi" không có dữ liệu | "Chưa có Kudo nào." | change |

Màn không có ô nhập nào để kiểm tra phía client; thông báo của việc sửa Kudo và thả tim thuộc component dùng chung (F003, F005).

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Trang chỉ dành cho Sunner đã đăng nhập và đã có đơn vị | auth | E01..E25 | Có phiên và hồ sơ có đơn vị | Khách (về đăng nhập) hoặc chưa có đơn vị (về trang chọn đơn vị) | Consequence if bypassed: redirect `/login` hoặc `/onboarding/department`; người dùng luôn lấy từ phiên nên không lộ dữ liệu người khác |
| Mã đơn vị chỉ hiện khi hồ sơ có đơn vị | configuration | E03 | Hồ sơ có đơn vị | Hồ sơ chưa có đơn vị | Dòng đơn vị / huy hiệu ẩn nếu cả hai đều trống |
| Huy hiệu Hero chỉ hiện khi Sunner đã có bậc | configuration | E04 | Đã có bậc Hero và đọc được bậc | Chưa có bậc, hoặc đọc bậc lỗi | Dấu chấm phân cách chỉ hiện khi có cả mã đơn vị lẫn huy hiệu |
| Hàng icon chỉ hiện khi đọc được bộ sưu tập | configuration | E05, E06 | Đọc bộ sưu tập thành công | Đọc lỗi | Hàng bị bỏ hẳn thay vì hiện rỗng |
| Bảng số liệu chỉ hiện khi đọc thống kê thành công | configuration | E07, E08, E09, E11, E12, E13 | Đọc thống kê thành công | Đọc thống kê lỗi (hiện E14, E15 thay thế) | Khi lỗi, nút E13 ẩn nhưng deep link vẫn mở được cửa sổ |
| Khối lỗi thống kê chỉ hiện khi đọc thống kê lỗi | configuration | E14, E15 | Đọc thống kê lỗi | Đọc thống kê thành công | Deep link vẫn mở được cửa sổ Secret Box |
| Huy hiệu "x2" chỉ hiện khi chiến dịch nhân đôi tim đang chạy | configuration | E10 | Có chiến dịch tim đang hoạt động | Không có chiến dịch | — |
| Nút "Mở Secret Box" mờ khi không còn hộp chưa mở | configuration | E13 | Còn hộp chưa mở thì bấm được | Không còn hộp: nút mờ kèm tooltip | Vẫn focus được để đọc tooltip |
| Bộ lọc chiều chỉ hiện khi đã có số đếm | configuration | E17 | Trang đầu đọc được và có số Kudo đã gửi | Trang đầu đọc lỗi | — |
| Bút sửa chỉ hiện trên Kudo của mình, không spam, khi cửa sổ viết còn mở | configuration | E19 | Chủ Kudo, không spam, còn trong cửa sổ viết | Kudo người khác, Kudo spam, hết cửa sổ viết | Cửa sổ viết do máy chủ tính; server vẫn kiểm lại khi lưu |
| Kudo spam của chính mình hiện kèm tag và lớp phủ | configuration | E22 | Kudo của mình bị đánh dấu spam | Kudo không spam | Chỉ chủ Kudo thấy Kudo spam của mình trong danh sách |
| Nút "Tải thêm" chỉ hiện khi còn trang kế | configuration | E23 | Còn con trỏ trang kế và danh sách đã tải | Hết trang, hoặc đang lỗi và không chạy | Ẩn khi lỗi để nhường chỗ cho E25 |
| Trạng thái danh sách chỉ hiện khi có tình huống tương ứng | configuration | E24, E25 | Đang tải, rỗng, hoặc lỗi | Danh sách có thẻ và không lỗi | — |

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
| SCR003_AppLayout | Menu tài khoản › Profile | — | `features/app-shell/components/account-menu.tsx:61` |
| SCR002_AdminLayout | Menu tài khoản › Profile | — | `features/app-shell/components/admin-top-bar.tsx:45`, `features/app-shell/components/account-menu.tsx:61` |
| SCR015_OtherProfile | Mở `/profile/{userId}` | `userId` là chính mình (redirect về `/profile`) | `app/(app)/profile/[userId]/page.tsx:33` |
| SCR007_KudosLiveBoardFeed | Chọn chính mình trong kết quả tìm Sunner | Ô tìm không loại chính mình (`excludeSelf=false`); đi qua `/profile/{id}` rồi redirect | `features/kudos-feed/components/sunner-profile-search.tsx:25,40` |
| SCR003_AppLayout | Bấm dòng thông báo lên bậc Hero hoặc đủ bộ icon trong dropdown chuông | Dòng loại `hero_tier_up` / `icon_set_completed` | `features/notifications/server/notification-view-mapper.ts:51-53` |
| SCR017_AllNotifications | Bấm dòng thông báo lên bậc Hero hoặc đủ bộ icon | Dòng loại `hero_tier_up` / `icon_set_completed` | `features/notifications/server/notification-view-mapper.ts:51-53`, `features/notifications/components/notification-row.tsx:41-45` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở chi tiết Kudo | E20 | — | SCR006_KudoDetail | redirect (điều hướng client) | `features/kudos-feed/components/kudo-card.tsx:76-80` |
| Mở hồ sơ người trong thẻ | E21 | Thẻ không nằm dưới lớp phủ spam | SCR015_OtherProfile (tên chính mình quay lại `/profile`, xem Unresolved Questions) | redirect | `features/kudos-feed/components/kudo-card-sender.tsx:28` |
| Mở Secret Box | E13 | Còn hộp chưa mở | (stays on screen) | modal | `features/secret-box-rewards/components/secret-box-launcher.tsx:69-70` |
| Sửa Kudo | E19 | Kudo của mình, không spam, còn cửa sổ viết | (stays on screen) | modal | `features/kudos-feed/components/kudo-owner-edit-button.tsx:36-39` |
| Đăng nhập lại | E25 | Danh sách trả 401 | SCR001_Login | redirect (liên kết thường, quay về `/profile`) | `features/kudos-feed/components/kudo-feed-status-message.tsx:24,35-39` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Phần KUDOS là `section` gắn với tiêu đề h2; vùng thống kê có `aria-label` "Thống kê của bạn" và dùng `dl`; hàng icon là `ul` có tên "Bộ sưu tập icon của tôi" với từng `role="img"` đọc trạng thái ("REVIVAL, chưa có"); chú thích trùng tên bị `aria-hidden`; nút lọc có `aria-haspopup="listbox"`, `aria-expanded`; avatar `alt=""` trang trí |
| Keyboard navigation | supported | Danh sách chọn chiều có mũi tên, Home, End, Enter/Space, Esc, Tab; nút "Mở Secret Box" mờ vẫn focus được (`aria-disabled`); tooltip đóng bằng Esc |
| Focus management | managed | Mở danh sách chọn chiều thì focus vào mục hiện tại; chọn xong trả focus về nút; "Tải thêm" chuyển focus tới thẻ đầu đợt mới; đóng cửa sổ Secret Box trả focus về nút; thẻ spam không có liên kết focus được |
| Screen reader compatibility | partial | Có landmark `main`, một h1 (tên), h2 "KUDOS"; vùng `role="status"` ẩn công bố số thẻ vừa tải; chưa có kiểm thử với trình đọc màn hình |
| Error announcement | supported | Lỗi thống kê và lỗi danh sách dùng `role="alert"`; trạng thái đang tải dùng `aria-live="polite"` |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (< md) | R2, E02 | Tên cỡ `headline-large`; từ `md` lên `display-small` | `features/profile/components/profile-header.tsx:31` |
| mobile (< md) | R2..R4 | Lề ngang 16 px, đệm trên 144 px (`pt-36`); từ `md` đệm trên 184 px (`md:pt-46`) | `features/profile/components/profile-page-frame.tsx:11` |
| mobile (< md) | R4, E17 | Phần tiêu đề KUDOS xếp dọc, nút lọc canh trái (`self-start`); từ `md` xếp ngang và danh sách chọn bám mép phải | `features/kudos-feed/components/live-board-section-header.tsx:24`, `features/profile/components/profile-kudos-direction-dropdown.tsx:66,86` |
| mobile (< md) | E18 | Thẻ Kudo đệm ngang 16 px, từ `md` đệm 40 px | `features/kudos-feed/components/kudo-card.tsx:42-44` |
| desktop (md+) | R2..R4 | Cột nội dung rộng tối đa 680 px, canh giữa | `features/profile/components/profile-page-frame.tsx:13` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 2. | component | `export const instant = false`: trang đọc phiên và dữ liệu theo từng request nên là route chặn | `app/(app)/profile/page.tsx:16` |
| § 3. | helper | `loadProfilePageData(userId, userId)` đọc song song hồ sơ, bậc Hero, icon, trang Kudo đầu (chiều `sent`) và cửa sổ viết; id sai định dạng hoặc không có hồ sơ trả null; mỗi vùng phụ lỗi thì rơi về `null` (`settle`) | `features/profile/server/profile-page-data.ts:23-58` |
| E07..E13 | helper | `ProfileStatsPanelSlot` (Server Component trong Suspense) gọi `requireSunner()` rồi `PersonalRewardStatsQuery.forUser(userId)`; lỗi chỉ ghi log, `stats = null` | `features/profile/components/profile-stats-panel-slot.tsx:13-22` |
| E13 | endpoint | Cửa sổ Secret Box dùng `GET /api/secret-boxes/me` (ROUTE015) và `POST /api/secret-boxes/open` (ROUTE016) | `docs/generated/route-list.md:100,106` |
| E13 | js | `useSearchParams().get("secretBox") === "open"` mở cửa sổ ở bất kỳ trang nào chứa launcher; đóng thì `router.refresh()` và `history.replaceState` gỡ tham số | `features/secret-box-rewards/components/secret-box-launcher.tsx:40,51-58` |
| E17, E23, E25 | endpoint | `GET /api/profile/{userId}/kudos?direction=received\|sent&cursor=` (ROUTE014). Request: `direction`, `cursor`; Success: 200 `{ items, nextCursor?, counts: { received, sent? } }`, 10 thẻ mỗi trang, `(created_at, id)` giảm dần; Error: 401, 403 (`sent` của người khác), 400 (tham số / con trỏ sai), 404, 500, body chỉ có `{ code }`; mọi câu trả lời `Cache-Control: private, no-store` | `app/api/profile/[userId]/kudos/route.ts:10-23,25-48` |
| E17 | js | Hook `useProfileKudosList`: `AbortController` hủy yêu cầu cũ, 400 khi có cursor thì xóa danh sách để thử lại từ đầu, 401 thành trạng thái `unauthorized` | `features/profile/components/use-profile-kudos-list.ts:35-74` |
| E19 | endpoint | Cửa sổ sửa dùng `GET /api/kudos/:id/edit` (ROUTE009), `updateKudo` (ROUTE024), `POST /api/kudos/images/sign` (ROUTE010) | `docs/generated/route-list.md:64,70,154` |
| E18 | endpoint | Trong thẻ: `addHeartAction` (ROUTE025), `removeHeartAction` (ROUTE026), `GET /api/sunners/:userId/card` (ROUTE019) cho hover card avatar | `docs/generated/route-list.md:160,161,124` |
| E19 | helper | `kudoCardCanEdit({ isOwner, isSpam, writingOpen })` quyết định có hiện bút | `features/kudos-feed/components/kudo-card.tsx:36` |
| E25 | js | `returnTo = APP_ROUTES.profile` đưa vào liên kết `/login?next=%2Fprofile` | `features/profile/components/profile-kudos-section.tsx:38`, `features/kudos-feed/components/kudo-feed-status-message.tsx:24` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| KudoCard | `variant` (`post` \| `highlight`), `kudo.isSpam` | `post` (thẻ rộng 680 px, tối đa 4 dòng nội dung); thẻ spam có tag và lớp phủ | `kudo`, `variant="post"`, `writingOpen` | DISC-002 (trạng thái `spam` của Kudo; luật hiển thị xem entities.md) |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` ở layout `(app)`, ở trang và ở slot thống kê | auth | Khách → redirect `/login`; chưa có đơn vị → redirect `/onboarding/department` (`shared/auth/current-user.ts:48-52`) |
| Proxy: không có phiên trên đường dẫn bảo vệ → `/login?next=` (trang) hoặc 401 JSON (API) | auth | Bỏ qua proxy thì `requireSunner()` vẫn chặn trang; API `/api/profile/*` vẫn gọi `requireApiSunner()` (`shared/auth/route-access-policy.ts:29-40`, `app/api/profile/[userId]/kudos/route.ts:26`) |
| Người dùng và thống kê luôn lấy từ phiên, không có tham số id trên `/profile` | permission | Không có đường nào đọc thống kê người khác (`app/(app)/profile/page.tsx:24-25`, `features/profile/components/profile-stats-panel-slot.tsx:14-17`) |
| `direction=sent` chỉ cho hồ sơ của chính người gọi | permission | 403 `FORBIDDEN` từ API, không đọc dữ liệu (`features/profile/server/profile-kudos-list-service.ts:30-31`, `app/api/profile/[userId]/kudos/route.ts:42`) |
| Kudo spam của mình chỉ chủ Kudo thấy | permission | Truy vấn chỉ thêm trạng thái spam khi `senderId === viewerId` và có `includeOwnSpam`; mọi trường hợp khác chỉ lấy Kudo công khai (`features/kudos-feed/server/kudo-public-query.ts:33,53-55`); hồ sơ chỉ bật `includeOwnSpam` cho danh sách "Đã gửi" của chính người xem (`features/profile/lib/profile-kudos-filter.ts:19-21`) |

## Source References

1. Page/View: `app/(app)/profile/page.tsx:1-36`
2. Layout: `app/(app)/layout.tsx:1-29`
3. Frame: `features/profile/components/profile-page-frame.tsx:1-16`
4. Header (R2): `features/profile/components/profile-header.tsx:1-50`
5. Icon collection: `features/secret-box-rewards/components/icon-collection.tsx:1-48`
6. Stats slot (R3): `features/profile/components/profile-stats-panel-slot.tsx:1-30`
7. Stats panel: `features/secret-box-rewards/components/personal-stats-panel.tsx:1-71`
8. Secret Box launcher: `features/secret-box-rewards/components/secret-box-launcher.tsx:1-73`
9. Open button: `features/secret-box-rewards/components/open-secret-box-button.tsx:1-60`
10. Status message (stats): `features/secret-box-rewards/components/rewards-status-message.tsx:1-43`
11. KUDOS section (R4): `features/profile/components/profile-kudos-section.tsx:1-86`
12. Direction filter: `features/profile/components/profile-kudos-direction-dropdown.tsx:1-108`
13. List hook: `features/profile/components/use-profile-kudos-list.ts:1-95`
14. Status message (list): `features/kudos-feed/components/kudo-feed-status-message.tsx:1-52`
15. Kudo card: `features/kudos-feed/components/kudo-card.tsx:1-84`
16. Owner edit button: `features/kudos-feed/components/kudo-owner-edit-button.tsx:1-40`
17. Page data: `features/profile/server/profile-page-data.ts:1-64`
18. List service: `features/profile/server/profile-kudos-list-service.ts:1-39`
19. List API: `app/api/profile/[userId]/kudos/route.ts:1-49`
20. DTOs: `features/profile/schemas/profile-views.ts:1-43`
21. UI copy: `messages/vi.json` (khóa `profile`, `secretBox`, `kudosFeed.status`, `kudosFeed.allKudos`)

## Source Walkthrough

1. **File:** `app/(app)/profile/page.tsx:1-36` — trang chính: lấy user từ phiên, đọc dữ liệu rồi ghép ba khối.
2. **File:** `features/profile/server/profile-page-data.ts:1-64` — dữ liệu nào đọc song song và vùng nào được phép lỗi riêng.
3. **File:** `features/profile/components/profile-header.tsx:1-50` — khối thông tin (avatar, tên, đơn vị, Hero, icon).
4. **File:** `features/profile/components/profile-stats-panel-slot.tsx:1-30` — khối thống kê chạy trong Suspense riêng.
5. **File:** `features/secret-box-rewards/components/personal-stats-panel.tsx:1-71` — năm số liệu và nút Secret Box, nhánh lỗi.
6. **File:** `features/secret-box-rewards/components/secret-box-launcher.tsx:1-73` — mở cửa sổ bằng nút hoặc deep link, làm mới sau khi đóng.
7. **File:** `features/profile/components/profile-kudos-section.tsx:1-86` — phần KUDOS: trạng thái, "Tải thêm", focus.
8. **File:** `features/profile/components/use-profile-kudos-list.ts:1-95` — logic đổi chiều, phân trang, hủy yêu cầu, lỗi.
9. **File:** `features/profile/components/profile-kudos-direction-dropdown.tsx:1-108` — bộ lọc chiều và bàn phím.
10. **File:** `features/kudos-feed/components/kudo-card.tsx:1-84` — thẻ Kudo dùng chung, nhánh spam.

Lớp dữ liệu: hồ sơ và đơn vị xem MODEL004_Profile, MODEL001_Department; Kudo xem MODEL003_Kudo; tim, hộp quà, icon xem MODEL008_KudoHeart, MODEL011_SecretBox, MODEL012_UserIcon trong entities.md. Màn không có tầng dữ liệu riêng.

### Call Hierarchy

```text
OwnProfilePage -> requireSunner -> loadProfilePageData -> ProfileQuery / HeroTierQuery / IconCollectionQuery / listProfileKudos
OwnProfilePage -> ProfilePageFrame -> ProfileHeader -> IconCollection
                                   -> ProfileStatsPanelSlot -> PersonalRewardStatsQuery -> PersonalStatsPanel -> SecretBoxLauncher
                                   -> ProfileKudosSection -> useProfileKudosList -> GET /api/profile/:id/kudos
                                                          -> ProfileKudosDirectionDropdown, KudoCard
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
requireSunner (userId) -> loadProfilePageData (page.tsx:24-25) -> props của ProfileHeader / ProfileKudosSection
Chọn chiều ở E17 -> selectDirection (use-profile-kudos-list.ts:76-82) -> fetch /api/profile/:id/kudos -> items + counts -> re-render danh sách
Bấm E23 -> loadMore -> fetch kèm cursor -> nối items, focus thẻ đầu -> thông báo "Đã tải thêm"
Đóng Secret Box -> router.refresh -> ProfileStatsPanelLoader đọc lại -> số liệu mới
```

## Unresolved Questions

- Khi `loadProfilePageData` trả null, trang ném `Error("[profile] the session user has no profile")` (`app/(app)/profile/page.tsx:27`) nhưng repo không có `error.tsx` cho `/profile` hay `app/error.tsx`; màn lỗi người dùng thực sự thấy phụ thuộc error boundary mặc định của Next — [UNVERIFIED] — needs runtime confirmation.
- Tên chính mình trên thẻ trong danh sách "Đã gửi" vẫn là liên kết tới `/profile/{id}` rồi bị redirect về `/profile` (`features/kudos-feed/components/kudo-card-sender.tsx:28`, `app/(app)/profile/[userId]/page.tsx:33`), trong khi screen-flow ghi điều kiện "Không phải chính mình". [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ có chủ ý cho phép bấm vào tên chính mình hay chỉ là hệ quả của việc dùng chung thẻ.
- Deep link `?secretBox=open` hoạt động trên mọi trang có `SecretBoxLauncher`, kể cả `/profile` (`features/secret-box-rewards/components/secret-box-launcher.tsx:40`), dù thông báo chỉ trỏ tới `/kudos?secretBox=open`. [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ hành vi này có được coi là tính năng hay không.
- Chưa đọc `SecretBoxModal` (component ở mức hai, nằm ngoài độ sâu đọc 1 cấp) nên nội dung cửa sổ Secret Box chưa được xác nhận ở đây (xem technical-spec của F010).
