---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR015_OtherProfile — Screen Spec

**Screen**: SCR015_OtherProfile: OtherProfile
**Feature**: F012_Profile
**Type**: atomic
**Route**: /profile/:userId
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner đã đăng nhập xem hồ sơ một đồng nghiệp (tên, phòng ban, huy hiệu Hero, bộ sưu tập icon, các Kudo người đó đã nhận) và gửi lời cảm ơn trực tiếp tới họ khi bấm tên hoặc avatar ở nơi khác.
**Actors:** Sunner (người xem, đã chọn phòng ban)
**Entry Conditions:** Có phiên đăng nhập và đã chọn phòng ban; `userId` trên URL là mã hợp lệ của một Sunner khác (không phải chính người xem). Trước thời điểm mở cửa, người không phải admin không tới được trang (cổng prelaunch).
**Exit Conditions:** Người dùng gửi xong một Kudo qua composer (hồ sơ giữ nguyên), hoặc đi sang một Kudo, một hồ sơ khác, hoặc Live board (xem mục 8); với id của chính mình, trang chuyển về hồ sơ của mình; với id sai hoặc không có, trang hiện thông báo không tìm thấy.

## 2. Screen Layout

### Layout Sketch

Trang là một `<main>` kéo lên dưới header trong suốt (`-mt-20`), keyvisual Live board làm nền ở đỉnh trang. Một cột giữa rộng tối đa 680 px, các khối cách nhau 64 px: khối thông tin (avatar 200 px, tên, mã phòng ban kèm huy hiệu Hero, bộ sưu tập 6 icon), nút gửi lời cảm ơn dạng viên thuốc, rồi phần KUDOS với tiêu đề, số Kudo đã nhận và danh sách thẻ Kudo. Hover card của người trên thẻ và composer gửi Kudo là lớp nổi mở theo thao tác. (`features/profile/components/profile-page-frame.tsx:11-13`, `app/(app)/profile/[userId]/page.tsx:37-43`)

```
┌─────────────────────────────────────────────┐
│ (header SCR003_AppLayout, trong suốt)        │
├─────────────────────────────────────────────┤
│ R1: Keyvisual (absolute, top, aria-hidden)  │
│       ┌─────────────────────────────┐       │
│       │ R2: Info Block (static)     │       │
│       │  avatar • tên • mã PB+Hero  │       │
│       │  6 icon + caption           │       │
│       ├─────────────────────────────┤       │
│       │ R3: Send Pill (static)      │       │
│       ├─────────────────────────────┤       │
│       │ R4: KUDOS Section (static)  │       │
│       │  KUDOS • Đã nhận: n Kudos   │       │
│       │  [thẻ Kudo] [thẻ Kudo] ...  │       │
│       │  [Tải thêm]                 │       │
│       └─────────────────────────────┘       │
│  - - - - - - - - - - - - - - - - - - - - -  │
│  R5: Overlay (fixed, hover card / composer) │
├─────────────────────────────────────────────┤
│ (footer SCR003_AppLayout)                   │
└─────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Keyvisual | absolute | no | LiveBoardKeyvisualBackground |
| R2 | Info Block | static | yes | ProfileHeader, UserAvatar, KudoCardHeroBadgeSlot, IconCollection |
| R3 | Send Pill | static | yes | ProfileSendKudoButton, LockedRecipientComposer |
| R4 | KUDOS Section | static | yes | ProfileKudosSection, LiveBoardSectionHeader, KudoCard, KudoFeedStatusMessage |
| R5 | Overlay | fixed | no | AvatarHoverCard, SunnerCardContent, LockedRecipientComposer |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Avatar | image | — | Visible | Always | — | API field | tròn 200 px, viền trắng; thiếu ảnh thì chữ cái đầu | initial letter | MODEL004_Profile.avatar_url (binding: `profile.avatarUrl`) |
| E02 | Tên Sunner (`<h1>`) | display field | — | Visible | Always | — | API field | raw, tự xuống dòng | — | MODEL004_Profile.full_name (binding: `profile.fullName`) |
| E03 | Mã phòng ban | display field | — | Visible | Conditional | — | API field | raw | hidden | MODEL001_Department.code (binding: `profile.department.code`) |
| E04 | Huy hiệu Hero | display field | — | Visible | Conditional | — | computed | huy hiệu kèm tooltip | hidden | MODEL003_Kudo (bậc tính từ số người gửi khác nhau) (binding: `tier`) |
| E05 | Bộ sưu tập icon {icon_1..6} | list | — | 6 ô | Conditional | — | API field | thứ tự cố định; ô chưa có là vòng xám, ô có nhiều hơn 1 kèm "×N" | — | MODEL012_UserIcon (binding: `icons`) |
| E06 | Bộ sưu tập icon (caption) | message | — | Visible | Conditional | — | static | raw | hidden | N/A |
| E07 | Gửi lời cảm ơn và ghi nhận tới {tên} | button | — | Enabled | Always | Mở composer với người nhận đã điền và khoá | — | — | — | N/A |
| E08 | Sự kiện đã kết thúc, không thể gửi hoặc sửa Kudo nữa. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E09 | KUDOS (tiêu đề phần, kèm "Sun* Annual Awards 2025") | region label | — | Visible | Always | — | static | raw | — | N/A |
| E10 | Đã nhận: {n} Kudos | display field | — | Visible | Conditional | — | API field | số có dấu phân cách theo ngôn ngữ | hidden | MODEL003_Kudo (binding: `counts.received`) |
| E11 | Thẻ Kudo đã nhận {card_1..N} | list | — | 10 thẻ đầu | Always | — | API field | mới nhất trước; 680 px | — | MODEL003_Kudo (binding: `list.items`) |
| E12 | Tên hoặc avatar người trên thẻ | link | — | Enabled | Conditional | Mở hồ sơ người đó | — | — | — | MODEL004_Profile.full_name |
| E13 | Xem chi tiết | link | — | Enabled | Always | Mở chi tiết Kudo | — | — | — | N/A |
| E14 | Tim (nút thả tim và số lượt) | button | — | Enabled | Always | Thả hoặc bỏ tim cho Kudo | — | số lượt raw | `0` | MODEL008_KudoHeart (binding: `kudo.heartCount`) |
| E15 | Hover card của người trên thẻ | message | — | Hidden | Conditional | — | API field | tên, phòng ban, huy hiệu, hai số đếm | hidden | MODEL004_Profile, MODEL003_Kudo (binding: `card`) |
| E16 | Gửi KUDO (trong hover card) | button | — | Enabled | Conditional | Mở composer với người nhận đã điền và khoá | — | — | — | N/A |
| E17 | Tải thêm | button | — | Enabled | Conditional | Tải trang Kudo kế tiếp | — | — | — | N/A |
| E18 | Chưa có Kudo nào. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E19 | Đang tải Kudos… | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E20 | Không tải được Kudos. Vui lòng thử lại. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E21 | Thử lại | button | — | Hidden | Conditional | Tải lại danh sách | — | — | — | N/A |
| E22 | Đăng nhập lại | link | — | Hidden | Conditional | Mở trang đăng nhập (quay về hồ sơ này) | — | — | — | N/A |
| E23 | Đã tải thêm {n} Kudo (chỉ cho trình đọc màn hình) | message | — | Hidden | Conditional | — | computed | raw | hidden | N/A |
| E24 | Không tìm thấy Sunner này. (`<h1>` trạng thái 404) | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E25 | Quay lại Live board | button | — | Hidden | Conditional | Về Live board | — | — | — | N/A |

Ghi chú: thẻ Kudo (E11–E14) là component dùng chung với các màn hình khác; ở đây chỉ nêu cách hồ sơ này truyền props. Thẻ còn có nút Copy Link và nút sửa (chỉ chủ Kudo khi cửa sổ ghi còn mở). Composer gửi Kudo là component dùng chung, mở ở chế độ tạo mới với người nhận đã khoá (`lockRecipient`).

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở composer gửi Kudo | E07 | Bấm | Cửa sổ ghi còn mở (nút khoá khi đã đóng) | Hiện composer, người nhận là hồ sơ này và không đổi được | `features/profile/components/profile-send-kudo-button.tsx:30-37,48` |
| Mở hồ sơ người trên thẻ | E12 | Bấm tên (hoặc avatar bằng chuột) | Người đó không ẩn danh | Rời trang (xem mục 8) | `features/kudos-feed/components/kudo-card-sender.tsx:28-39` |
| Mở chi tiết Kudo | E13 | Bấm | — | Rời trang (xem mục 8) | `features/kudos-feed/components/kudo-card.tsx:76-79` |
| Thả hoặc bỏ tim | E14 | Bấm | Không phải Kudo của chính mình, cửa sổ ghi còn mở | Số tim đổi ngay (optimistic) | `features/kudos-feed/components/kudo-card-heart-slot.tsx:20-22` |
| Mở hover card | E15 | Rê chuột vào avatar 300 ms, hoặc focus bàn phím vào tên | Không phải thiết bị cảm ứng; người không ẩn danh | Hiện thẻ thông tin người đó; chỉ một thẻ mở cùng lúc | `features/profile/components/avatar-hover-card.tsx:16,90-97,108-111` |
| Gửi KUDO từ hover card | E16 | Bấm | Không phải thẻ của chính người xem và cửa sổ ghi còn mở | Đóng hover card, mở composer với người nhận đã khoá | `features/profile/components/avatar-hover-card.tsx:112-119`, `features/profile/components/sunner-card-content.tsx:91-100` |
| Tải thêm Kudo | E17 | Bấm | Còn trang kế và chưa có yêu cầu đang chạy | Nối thêm tối đa 10 Kudo, focus nhảy tới thẻ đầu của đợt mới, trình đọc màn hình được báo số lượng | `features/profile/components/profile-kudos-section.tsx:45-51`, `features/profile/components/use-profile-kudos-list.ts:85-88` |
| Thử lại | E21 | Bấm | Đang ở trạng thái lỗi tải | Tải lại trang hiện tại (hoặc trang đầu nếu cursor bị từ chối) | `features/profile/components/use-profile-kudos-list.ts:90-92` |

### Happy Path

1. Sunner mở `/profile/{userId}` của đồng nghiệp; R2 hiện avatar, tên, mã phòng ban, huy hiệu Hero (nếu có) và 6 ô icon.
2. R4 hiện "Đã nhận: n Kudos" và 10 thẻ Kudo đã nhận, mới nhất trước.
3. Sunner bấm nút gửi lời cảm ơn ở R3; composer hiện ra với người nhận đã điền sẵn và khoá.
4. Sunner viết và gửi Kudo; composer đóng, toast "đã gửi" hiện ở khung ứng dụng và hồ sơ giữ nguyên (khi dữ liệu làm mới, danh sách dựng lại nếu trang đầu đổi).
5. Sunner bấm "Tải thêm" để xem các Kudo cũ hơn.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 (mở trang) | `userId` sai định dạng hoặc không có hồ sơ | Hiện trạng thái 404 với thông báo và nút về Live board | `app/(app)/profile/[userId]/page.tsx:35`, `features/profile/server/profile-page-data.ts:39,50`, `app/(app)/profile/[userId]/not-found.tsx:11-25` |
| Bước 1 (mở trang) | `userId` là chính người xem | Chuyển về hồ sơ của mình (xem mục 8) | `app/(app)/profile/[userId]/page.tsx:33` |
| Bước 1 (khối con) | Đọc huy hiệu hoặc bộ sưu tập thất bại | Bỏ riêng huy hiệu hoặc hàng icon, trang vẫn hiện | `features/profile/server/profile-page-data.ts:22-30,53-54`, `features/profile/components/profile-header.tsx:39` |
| Bước 1 (khối con) | Đọc trang Kudo đầu thất bại | Phần KUDOS hiện lỗi kèm Thử lại | `features/profile/server/profile-page-data.ts:55`, `features/profile/components/use-profile-kudos-list.ts:30` |
| Bước 1 (khối con) | Người này chưa có huy hiệu | Không hiện huy hiệu | `features/profile/components/profile-header.tsx:32-37` |
| Bước 2 (danh sách) | Chưa có Kudo nào | Dòng "Chưa có Kudo nào.", không có nút Tải thêm | `features/profile/components/profile-kudos-section.tsx:67` |
| Bước 3 (gửi) | Cửa sổ ghi đã đóng | Nút khoá kèm thông báo "Sự kiện đã kết thúc…" | `features/profile/components/profile-send-kudo-button.tsx:32-33,43-47` |
| Bước 4 (đóng composer) | Đóng composer không gửi | Hồ sơ giữ nguyên | `features/profile/components/profile-send-kudo-button.tsx:19-20` |
| Bước 5 (tải thêm) | Phiên hết hạn (HTTP 401) | Thông báo phiên hết hạn kèm link đăng nhập lại | `features/profile/components/use-profile-kudos-list.ts:54`, `features/kudos-feed/components/kudo-feed-status-message.tsx:33-39,50-52` |
| Bước 5 (tải thêm) | Cursor bị từ chối (HTTP 400) | Danh sách xoá về trạng thái chưa tải; Thử lại bắt đầu từ trang đầu | `features/profile/components/use-profile-kudos-list.ts:49-53,91` |

### Interaction Notes

- **Hồ sơ người khác chỉ có "Đã nhận", không bao giờ hiện "Đã gửi"; số đếm cũng chỉ là số đã nhận** — danh sách luôn lọc theo người nhận là chủ hồ sơ, hướng "Đã gửi" chỉ có trên hồ sơ của chính mình — source: `features/profile/lib/profile-kudos-filter.ts:12-25,31-38`
- **Người gửi ẩn danh không có link hồ sơ và không có hover card** — chỉ người có tên mới bọc `AvatarHoverCard` — source: `features/kudos-feed/components/kudo-card-sender.tsx:21-26,76`
- **Hover card mở sau 300 ms rê chuột và khép lại sau 150 ms khi chuột rời, cho phép đưa chuột vào thẻ** — source: `features/profile/components/avatar-hover-card.tsx:16-18,98-101`
- **Chạm trên thiết bị cảm ứng không mở hover card, chỉ là bấm vào link hồ sơ** — source: `features/profile/components/avatar-hover-card.tsx:34,127-128`
- **Esc, bấm ra ngoài hoặc focus rời tên và thẻ thì đóng hover card; trang chỉ mở một hover card cùng lúc** — source: `features/profile/components/avatar-hover-card.tsx:20-21,69-88,93`
- **Dữ liệu hover card được nhớ 60 giây trên trang; sau khi gửi Kudo cho người đó thì bản nhớ bị bỏ để lần mở sau hiện số mới** — source: `features/profile/lib/sunner-card-cache.ts:4,51`, `features/profile/components/locked-recipient-composer.tsx:31`
- **"Tải thêm" nối thêm Kudo, đưa focus vào thẻ đầu của đợt mới và báo "Đã tải thêm n Kudo" cho trình đọc màn hình** — source: `features/profile/components/profile-kudos-section.tsx:41-51,80-82`
- **Yêu cầu mới huỷ yêu cầu cũ nên chỉ kết quả cuối được hiện** — source: `features/profile/components/use-profile-kudos-list.ts:36-38,64`
- **Gửi Kudo xong, nếu trang đầu của danh sách đổi thì phần KUDOS dựng lại với dữ liệu mới** — khoá dựng lại gồm số đã nhận và mã Kudo đầu — source: `features/profile/server/profile-page-data.ts:60-64`, `app/(app)/profile/[userId]/page.tsx:41`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading (mở trang) | Chuyển tới `/profile/{userId}` | Route chặn, không có skeleton riêng; hồ sơ, huy hiệu, icon, trang Kudo đầu và cửa sổ ghi được đọc song song rồi mới hiện | none | `app/(app)/profile/[userId]/page.tsx:22,34`, `features/profile/server/profile-page-data.ts:43-49` |
| loading (danh sách) | Đang tải thêm hoặc tải lại | "Đang tải Kudos…" khi chưa có trang đầu; nút Tải thêm có spinner, `aria-busy` | none | `features/profile/components/profile-kudos-section.tsx:66,72-77` |
| empty | Chủ hồ sơ chưa nhận Kudo nào | "Chưa có Kudo nào." | none | `features/profile/components/profile-kudos-section.tsx:67` |
| error (danh sách) | Đọc hoặc tải thêm thất bại | `role="alert"` "Không tải được Kudos. Vui lòng thử lại." kèm Thử lại | Thử lại | `features/profile/components/profile-kudos-section.tsx:65`, `features/kudos-feed/components/kudo-feed-status-message.tsx:32-46` |
| error (phiên hết hạn) | Máy chủ trả 401 | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." kèm link Đăng nhập lại về hồ sơ này | Đăng nhập lại | `features/kudos-feed/components/kudo-feed-status-message.tsx:24,33-39` |
| partial (thiếu huy hiệu hoặc icon) | Đọc riêng một khối thất bại | Khối đó bị bỏ, phần còn lại hiện bình thường | — | `features/profile/server/profile-page-data.ts:22-30`, `features/profile/components/profile-header.tsx:39` |
| not-found | Id sai hoặc không có hồ sơ | Màn hình một thông báo `<h1>` và nút về Live board trên nền keyvisual phủ tối | Quay lại Live board | `app/(app)/profile/[userId]/not-found.tsx:11-25` |
| writing closed | Cửa sổ ghi đã đóng | Nút gửi khoá mờ kèm thông báo; tim và nút sửa của thẻ cũng chỉ đọc | none | `features/profile/components/profile-send-kudo-button.tsx:32,43-47` |
| success | Gửi Kudo xong | Composer đóng; toast "đã gửi" nằm ở khung ứng dụng nên không mất khi hồ sơ dựng lại | none | `features/profile/components/locked-recipient-composer.tsx:17-21` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E08 | Không gửi được khi cửa sổ ghi đã đóng | Sự kiện đã kết thúc, không thể gửi hoặc sửa Kudo nữa. | submit |
| E20 | Đọc trang Kudo thất bại | Không tải được Kudos. Vui lòng thử lại. | server response |
| E20 | Phiên hết hạn khi tải thêm | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại. | server response |
| E24 | Id sai định dạng hoặc không có hồ sơ | Không tìm thấy Sunner này. | server response |

Các quy tắc nhập liệu và thông báo lỗi của composer (nội dung, người nhận, ảnh) thuộc component composer dùng chung; ở màn hình này người nhận bị khoá nên không có kiểm tra người nhận.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Trang chỉ cho Sunner đã chọn phòng ban | auth | E01–E25 (cả trang) | Có phiên đăng nhập và đã có phòng ban | Chưa đăng nhập (về đăng nhập), chưa có phòng ban (về onboarding) | Consequence if bypassed: redirect |
| Trước ngày mở cửa, non-admin bị chặn | auth | E01–E25 (cả trang) | Sau thời điểm mở cửa, hoặc là admin | Trước thời điểm mở cửa với non-admin | Consequence if bypassed: [UNVERIFIED] consequence — needs security review (thực thi ở proxy) |
| Hồ sơ của chính mình đi về trang riêng | auth | E01–E25 (cả trang) | `userId` khác người xem | `userId` là người xem (chuyển hướng) | Consequence if bypassed: không có dữ liệu bị lộ; chỉ là một trang hồ sơ trùng |
| Mã phòng ban chỉ hiện khi có | configuration | E03 | Hồ sơ có phòng ban | Không có phòng ban | — |
| Huy hiệu chỉ hiện khi đã có bậc Hero | configuration | E04 | Có ít nhất một người gửi khác nhau (có bậc) | Chưa có bậc | Khi chưa có bậc thì không hiện gì |
| Hàng icon chỉ hiện khi đọc được | configuration | E05, E06 | Đọc bộ sưu tập thành công | Đọc thất bại | Hàng bị bỏ thay vì hiện rỗng |
| Thông báo cửa sổ ghi đã đóng | configuration | E07, E08 | Nút khoá và thông báo hiện khi cửa sổ ghi đã đóng | Cửa sổ ghi còn mở | Thời điểm đóng theo cấu hình môi trường |
| Số đã nhận chỉ hiện khi đọc được số đếm | configuration | E10 | Đọc trang Kudo đầu thành công | Đọc thất bại | — |
| Link và hover card chỉ cho người có tên | configuration | E12, E15, E16 | Người gửi không ẩn danh; E16 còn cần không phải thẻ của chính người xem và cửa sổ ghi còn mở | Người gửi ẩn danh | Hover card không mở trên thiết bị cảm ứng |
| Nút Tải thêm | configuration | E17 | Còn cursor kế tiếp và danh sách đã tải | Hết trang | — |
| Trạng thái rỗng, đang tải, lỗi của danh sách | configuration | E18, E19, E20, E21, E22, E23 | Theo trạng thái danh sách | Còn lại | E21 chỉ khi lỗi thường, E22 chỉ khi phiên hết hạn |
| Trạng thái 404 | configuration | E24, E25 | Id sai hoặc không có hồ sơ | Hồ sơ hợp lệ | Thay toàn bộ nội dung trang |

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
| SCR007_KudosLiveBoardFeed | Chọn một Sunner trong kết quả tìm | Không phải chính mình | `docs/generated/screen-flow.md:216` |
| SCR007_KudosLiveBoardFeed | Bấm tên người nhận trong đám mây Spotlight | — | `docs/generated/screen-flow.md:218` |
| SCR007_KudosLiveBoardFeed | Bấm tên hoặc avatar người có tên trên thẻ Kudo | Người gửi không ẩn danh | `docs/generated/screen-flow.md:219` |
| SCR007_KudosLiveBoardFeed | Bấm tên hoặc avatar người có tên trên thẻ Highlight | Người gửi không ẩn danh | `docs/generated/screen-flow.md:220` |
| SCR006_KudoDetail | Bấm tên hoặc avatar người có tên | Người gửi không ẩn danh | `docs/generated/screen-flow.md:223` |
| SCR016_OwnProfile | Bấm tên người trong thẻ | Không phải chính mình | `docs/generated/screen-flow.md:229` |
| external | Mở thẳng `/profile/{userId}` | `userId` hợp lệ | `app/(app)/profile/[userId]/page.tsx:30-35` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở `/profile/{userId}` của chính mình | (tự động khi mở trang) | `userId` là chính người xem | SCR016_OwnProfile | redirect | `app/(app)/profile/[userId]/page.tsx:33` |
| Mở chi tiết Kudo | E13 | — | SCR006_KudoDetail | redirect (`/kudos/{id}`) | `features/kudos-feed/components/kudo-card.tsx:76` |
| Quay lại Live board | E25 | `userId` sai hoặc không có hồ sơ | SCR007_KudosLiveBoardFeed | redirect (`/kudos`) | `app/(app)/profile/[userId]/not-found.tsx:17-22` |
| Mở hồ sơ người trên thẻ | E12 | Người đó không ẩn danh | `/profile/{id}` (cùng loại màn hình; về SCR016_OwnProfile nếu là chính mình) | redirect | `features/kudos-feed/components/kudo-card-sender.tsx:28-39` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Danh sách icon có `aria-label` và mỗi ô là `role="img"` nêu tên icon và trạng thái; caption trùng bị `aria-hidden`; phần KUDOS `aria-labelledby`; hover card `role="dialog"` với `aria-label`; nút Tải thêm `aria-disabled` và `aria-busy` (`icon-collection.tsx:24,31`, `profile-header.tsx:43`, `profile-kudos-section.tsx:54,72-73`, `sunner-card-content.tsx:68-69`) |
| Keyboard navigation | supported | Mỗi người chỉ có một điểm dừng Tab (tên); focus vào tên mở hover card; Esc đóng; avatar là link chỉ cho chuột (`kudo-card-sender.tsx:21-26`, `avatar-hover-card.tsx:45,108-111`) |
| Focus management | managed | Tải thêm đưa focus vào thẻ đầu của đợt mới; hover card trả focus về tên khi đóng; composer trả focus về nơi mở (`profile-kudos-section.tsx:41-43,50`, `avatar-hover-card.tsx:73-76,114-115`) |
| Screen reader compatibility | unknown | Có `<main>`, `<header>`, `<section>`, h1/h2 theo thứ tự; vùng `role="status"` báo số Kudo vừa tải; chưa có kết quả kiểm thử trình đọc màn hình trong mã (`profile-kudos-section.tsx:80-82`) |
| Error announcement | supported | Lỗi danh sách là `role="alert"`; trạng thái đang tải và rỗng là `aria-live="polite"`; thông báo cửa sổ ghi đã đóng gắn vào nút qua `aria-describedby` (`kudo-feed-status-message.tsx:27,33`, `profile-send-kudo-button.tsx:33,43-47`) |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile / desktop (`md`) | R2, R4 | Cột giữa rộng tối đa 680 px, lề 16 px trên điện thoại; đệm trên 36 rồi 46 đơn vị từ `md` | `features/profile/components/profile-page-frame.tsx:11-13` |
| mobile / desktop (`md`) | E02 | Cỡ chữ tên lớn hơn từ `md` | `features/profile/components/profile-header.tsx:31` |
| mobile | E05 | Các ô icon tự xuống dòng | `features/secret-box-rewards/components/icon-collection.tsx:24` |
| mobile | E07 | Nút rộng toàn cột, cao tối thiểu 72 px | `features/profile/components/profile-send-kudo-button.tsx:38` |
| mobile / desktop (`md`) | E09, E10 | Tiêu đề phần và số đã nhận xếp dọc, từ `md` xếp ngang hai đầu | `features/kudos-feed/components/live-board-section-header.tsx:23` |
| mobile / desktop (`md`) | E11 | Thẻ đệm ngang 16 px, từ `md` 40 px | `features/kudos-feed/components/kudo-card.tsx:43-45` |
| mobile | E15 | Hover card rộng tối đa chiều rộng khung nhìn trừ 32 px; không mở trên thiết bị cảm ứng | `features/profile/components/sunner-card-content.tsx:72`, `features/profile/components/avatar-hover-card.tsx:34` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireSunner()` rồi so `userId` với người xem: bằng nhau → `redirect('/profile')`; `loadProfilePageData` trả `null` → `notFound()` | `app/(app)/profile/[userId]/page.tsx:31-35` |
| R2–R4 | helper | `loadProfilePageData(viewerId, userId)`: kiểm tra UUID, hướng danh sách mặc định `received`, đọc song song `ProfileQuery.getById`, `HeroTierQuery.getTiersByRecipientIds`, `IconCollectionQuery.forUser`, `listProfileKudos`, `isKudoWritingOpen`; lỗi của khối huy hiệu, icon, Kudo trả `null` riêng, lỗi hồ sơ thì ném | `features/profile/server/profile-page-data.ts:23-58` |
| E01–E03 | helper | `ProfileQuery.getById` chỉ chọn cột cần (không email, vai trò, lần đăng nhập cuối), join `departments`, bọc `cache()` | `features/profile/server/profile-query.ts:17-36` |
| E11 | helper | `listProfileKudos`: bộ lọc `{ recipientId }` cho "received"; "sent" của người khác bị từ chối trước mọi lần đọc; phân trang 10 Kudo mỗi trang theo bộ phân trang của Live board kèm số đếm | `features/profile/server/profile-kudos-list-service.ts:10,29-39`, `features/profile/lib/profile-kudos-filter.ts:12-25` |
| E17, E21 | endpoint | `GET /api/profile/:userId/kudos?direction=received&cursor=<opaque>` (ROUTE014): 200 `{ items, nextCursor?, counts }`; 401 `UNAUTHENTICATED`; 403 `ONBOARDING_REQUIRED` hoặc `FORBIDDEN`; 400 `VALIDATION`; 404 `NOT_FOUND`; 500 `UNEXPECTED`; `Cache-Control: private, no-store`; người gửi ẩn danh bị che với mọi người xem | `app/api/profile/[userId]/kudos/route.ts:10-49`, `features/profile/schemas/profile-kudos-request-schema.ts:11-16` |
| E17, E21 | js | `useProfileKudosList`: `fetch` có `AbortController`, trang tiếp dùng cursor, 400 kèm cursor quay về chưa tải, 401 thành `unauthorized` | `features/profile/components/use-profile-kudos-list.ts:35-74` |
| E07, E16 | endpoint | Server action `createKudo` (ROUTE023) qua composer ở chế độ tạo mới với `lockRecipient`; `onSaved` bỏ bản nhớ hover card của người nhận | `features/profile/components/locked-recipient-composer.tsx:22-34` |
| E14 | endpoint | Server action `addHeartAction` (ROUTE025) và `removeHeartAction` (ROUTE026) qua `KudoHeartButton` trong thẻ | `features/kudos-feed/components/kudo-card-heart-slot.tsx:20-22` |
| E15 | endpoint | `GET /api/sunners/:userId/card` (ROUTE019) qua `useSunnerCard`, bản nhớ trên trang `SUNNER_CARD_TTL_MS` = 60 000 ms | `features/profile/components/use-sunner-card.ts:12-30`, `features/profile/lib/sunner-card-cache.ts:4,51` |
| E08 | helper | `isKudoWritingOpen()` quyết định `writingOpen` truyền cho nút gửi và các thẻ | `features/profile/server/profile-page-data.ts:48,56`, `app/(app)/profile/[userId]/page.tsx:40-41` |
| § 5. | handler | `export const instant = false` (route chặn); không có `loading.tsx` riêng cho route này | `app/(app)/profile/[userId]/page.tsx:22` |
| § 2. | component | Khối KUDOS dùng `KudoCard` (variant `post`), `LiveBoardSectionHeader`, `KudoFeedStatusMessage` từ feature kudos-feed | `features/profile/components/profile-kudos-section.tsx:55-67` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| KudoCard | `variant`, `kudo.isSpam`, `kudo.sender.anonymous` | `post`; sender có tên hoặc ẩn danh; `isSpam` không bao giờ xảy ra ở danh sách "Đã nhận" của người khác | `variant="post"`, `writingOpen`, `kudo` từ danh sách "Đã nhận" | N/A |
| ProfileKudosSection | `own` | `own={false}`: chỉ "Đã nhận: n Kudos", không có bộ lọc hướng | `profileUserId`, `own=false`, `initial`, `writingOpen` | N/A |
| ProfileHeader | `iconCaption` | Caption "Bộ sưu tập icon" (người khác) thay cho "Bộ sưu tập icon của tôi" (hồ sơ của mình) | `iconCaption={t("iconCollectionOther")}` | N/A |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` ở trang và khung `(app)` | auth | Redirect về đăng nhập hoặc onboarding; không đọc được hồ sơ khi chưa đăng nhập |
| So `userId` với người xem trước khi đọc | permission | Chính mình được chuyển về `/profile`; không có đường dẫn tới danh sách "Đã gửi" qua trang này |
| Bộ lọc danh sách luôn là `{ recipientId }`, hướng "sent" của người khác bị từ chối (403) | permission | Nếu bỏ, lộ được ai gửi Kudo ẩn danh bằng cách lấy hiệu hai tập |
| `requireApiSunner()` ở `GET /api/profile/:userId/kudos` | auth | 401 hoặc 403 JSON trước khi đọc; thiếu guard lộ Kudo của người khác cho khách |
| `ProfileQuery` chỉ chọn cột cần | permission | Không bao giờ trả email, vai trò hay lần đăng nhập cuối ra client |
| Cổng prelaunch (proxy) | role | [UNVERIFIED] server enforcement — static analysis cannot confirm API middleware |

## Source References

1. Page/View: `app/(app)/profile/[userId]/page.tsx:12-44`
2. Not-found: `app/(app)/profile/[userId]/not-found.tsx:11-25`
3. Page frame: `features/profile/components/profile-page-frame.tsx:9-16`
4. Info block: `features/profile/components/profile-header.tsx:24-50`
5. Send pill + composer: `features/profile/components/profile-send-kudo-button.tsx:21-51`, `features/profile/components/locked-recipient-composer.tsx:22-35`
6. KUDOS section + list hook: `features/profile/components/profile-kudos-section.tsx:30-86`, `features/profile/components/use-profile-kudos-list.ts:22-95`
7. Page data + services: `features/profile/server/profile-page-data.ts:23-64`, `features/profile/server/profile-kudos-list-service.ts:29-39`, `features/profile/server/profile-query.ts:17-36`, `features/profile/lib/profile-kudos-filter.ts:12-38`
8. Route handler + params: `app/api/profile/[userId]/kudos/route.ts:19-49`, `features/profile/schemas/profile-kudos-request-schema.ts:11-16`
9. Shared card (props only): `features/kudos-feed/components/kudo-card.tsx:33-84`, `features/kudos-feed/components/kudo-card-sender.tsx:27-49,72-80`, `features/kudos-feed/components/kudo-card-heart-slot.tsx:20-22`
10. Hover card: `features/profile/components/avatar-hover-card.tsx:47-172`, `features/profile/components/sunner-card-content.tsx:41-103`, `features/profile/components/use-sunner-card.ts:12-30`
11. Icon collection + status message: `features/secret-box-rewards/components/icon-collection.tsx:19-48`, `features/kudos-feed/components/kudo-feed-status-message.tsx:22-52`
12. UI copy: `messages/vi.json` (`profile`, `kudosFeed.status`, `kudosFeed.allKudos`, `kudosFeed.card`, `kudosComposer.errors`)
13. Parent frame: `app/(app)/layout.tsx:17-28`

## Source Walkthrough

1. **File:** `app/(app)/profile/[userId]/page.tsx:12-44` — trang RSC: guard, chuyển hướng id của chính mình, 404, ghép ba khối; bắt đầu từ đây.
2. **File:** `features/profile/server/profile-page-data.ts:23-64` — toàn bộ dữ liệu trang đọc song song và cách mỗi khối thất bại độc lập (entities: MODEL004_Profile, MODEL001_Department, MODEL003_Kudo, MODEL012_UserIcon, MODEL008_KudoHeart trong `entities.md`).
3. **File:** `features/profile/lib/profile-kudos-filter.ts:12-38` — luật riêng tư: hồ sơ người khác chỉ có "Đã nhận".
4. **File:** `features/profile/components/profile-header.tsx:24-50` — khối thông tin, huy hiệu và bộ sưu tập icon.
5. **File:** `features/profile/components/profile-send-kudo-button.tsx:21-51` — nút gửi lời cảm ơn và trạng thái cửa sổ ghi đóng.
6. **File:** `features/profile/components/profile-kudos-section.tsx:30-86` — phần KUDOS: tiêu đề, danh sách thẻ, trạng thái rỗng/lỗi/tải thêm.
7. **File:** `features/profile/components/use-profile-kudos-list.ts:22-95` — trạng thái danh sách và gọi API phân trang.
8. **File:** `app/api/profile/[userId]/kudos/route.ts:19-49` — API trả trang Kudo.
9. **File:** `features/profile/components/avatar-hover-card.tsx:47-172` — hover card người trên thẻ.
10. **File:** `app/(app)/profile/[userId]/not-found.tsx:11-25` — màn hình không tìm thấy.

### Call Hierarchy

```text
OtherProfilePage (RSC) ─ requireSunner ─ redirect | loadProfilePageData ─ notFound
 └─ ProfilePageFrame ─ LiveBoardKeyvisualBackground
     ├─ ProfileHeader ─ UserAvatar / KudoCardHeroBadgeSlot / IconCollection
     ├─ ProfileSendKudoButton (client) ─ LockedRecipientComposer ─ KudoComposerModal
     └─ ProfileKudosSection (client) ─ useProfileKudosList ─ GET /api/profile/:userId/kudos
          └─ KudoCard ─ KudoCardPeople ─ AvatarHoverCard ─ SunnerCardContent ─ LockedRecipientComposer
                     └ KudoCardHeartSlot ─ KudoHeartButton
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
userId (route param) -> loadProfilePageData (song song: hồ sơ, bậc Hero, icon, trang Kudo đầu, cửa sổ ghi)
  -> props ProfileHeader / ProfileSendKudoButton / ProfileKudosSection(initial)
Bấm Tải thêm -> useProfileKudosList.loadMore -> GET /api/profile/:userId/kudos?cursor -> setItems (nối) -> vẽ lại + báo số lượng
Mở hover card -> useSunnerCard -> GET /api/sunners/:userId/card (bản nhớ 60 giây) -> SunnerCardContent
```

## Unresolved Questions

- `docs/generated/screen-flow.md` (Screen Access Paths của SCR015_OtherProfile) không có đường đi cho tên và avatar người trên thẻ Kudo của chính màn hình này (mỗi thẻ có link `/profile/{id}`, `kudo-card-sender.tsx:28-39`); chỉ có các Exit tới SCR016_OwnProfile, SCR006_KudoDetail, SCR007_KudosLiveBoardFeed. Cần bổ sung đường đi hoặc xác nhận cố ý bỏ.
- `docs/generated/screen-list.md` (SCR015) ghi chữ "Đã nhận: n Kudo"; chữ thật là "Đã nhận: {count} Kudos" (`messages/vi.json`, `profile.kudos.receivedTotal`). Cần sửa cho khớp.
- Hộp cảnh báo spam (SpamAlertOverlay) không bao giờ xuất hiện trên màn hình này: thẻ chỉ dựng spam khi `isSpam`, và `isSpam` chỉ có ở danh sách "Đã gửi" của chính người xem (`kudo-card.tsx:47-48`, `profile-kudos-filter.ts:19-21`); nó thuộc hồ sơ của mình, không thuộc SCR015.
- Đường đi phụ khi gửi Kudo thành công từ hover card (toast, làm mới) do composer dùng chung và khung ứng dụng xử lý; chưa đọc sâu `KudoComposerModal` vì nằm ngoài độ sâu một cấp — needs runtime confirmation.
- Chưa đọc chi tiết `KudoCardHeroBadgeSlot` và `KudoHeartButton` (không theo import cấp hai); hành vi tooltip huy hiệu và quy tắc tim chỉ được tham chiếu, không mô tả đầy đủ.
