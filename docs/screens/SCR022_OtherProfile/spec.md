---
status: draft
authored_by: takumi
fcode: F012
created: 2026-11-08
lang: vi
---

# SCR022_OtherProfile — Screen Spec

**Screen**: SCR022_OtherProfile: Profile người khác
**Feature**: F012_Profile
**Type**: composite
**Route**: TBD (draft) — đề xuất địa chỉ có mã Sunner
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner xem thông tin, huy hiệu, bộ sưu tập icon của đồng nghiệp, đọc Kudo họ đã nhận và gửi lời cảm ơn tới họ. (Figma 362:5097)
**Actors:** Sunner (người xem)
**Entry Conditions:** Đã đăng nhập; bấm avatar/tên một Sunner không ẩn danh, kết quả tìm kiếm hoặc thẻ nhanh; Sunner đó phải tồn tại.
**Exit Conditions:** Sunner mở form viết Kudo, sang profile khác hoặc rời trang.

## 2. Screen Layout

### Layout Sketch

Giống profile bản thân ở phần header, hero và thông tin; 6 ô icon đều có tên bên dưới; không có bảng thống kê; thay vào đó là nút rộng "Gửi lời cảm ơn và ghi nhận tới {tên}"; mục KUDOS chỉ có nhãn "Đã nhận: n Kudos" (không dropdown) và danh sách thẻ.

```
┌──────────────────────────────────────────┐
│ R1: Header (F002, fixed-top)             │
├──────────────────────────────────────────┤
│ R2: Hero + thông tin Sunner              │
│     ○ ○ ○ ○ ○ ○ (kèm tên)  Bộ sưu tập... │
│     [✏ Gửi lời cảm ơn và ghi nhận tới X] │
├──────────────────────────────────────────┤
│ R3: KUDOS   Đã nhận: n Kudos             │
│     [thẻ Kudo] ... [Tải thêm]            │
├──────────────────────────────────────────┤
│ R4: Footer (F002)                        │
└──────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | fixed-top | no | TBD (draft) — thuộc F002 |
| R2 | Hero + thông tin Sunner | static | yes | TBD (draft) — dùng lại huy hiệu Hero (F009), bộ sưu tập icon (F010) |
| R3 | KUDOS | static | yes | TBD (draft) — dùng lại thẻ Kudo (F004) |
| R4 | Footer | static | no | TBD (draft) — thuộc F002 |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Avatar lớn | image | — | Ảnh Google | Always | — | API field | tròn | avatar mặc định | MODEL profiles (F001) |
| E02 | Tên (vàng) | display field | — | — | Always | — | API field | raw | dash | MODEL profiles (F001) |
| E03 | Mã phòng ban | display field | — | — | Conditional | — | API field | raw | hidden | TBD (draft) |
| E04 | Huy hiệu Hero | display field | — | — | Conditional | Hiện giải thích cấp (F009) | computed | pill | hidden | TBD (draft) |
| E05 | 6 ô icon kèm tên + chú thích "Bộ sưu tập icon của {tên}" | list | — | 6 ô | Always | — | API field | tròn; tên dưới mỗi ô | xám rỗng | TBD (draft) |
| E06 | Gửi lời cảm ơn và ghi nhận tới {tên} | button | — | Enabled | Always | Mở form viết Kudo, người nhận điền sẵn | — | pill rộng | — | N/A |
| E07 | Nhãn "Đã nhận: n Kudos" | display field | — | — | Always | — | computed | "Đã nhận: n Kudos" | "Đã nhận: 0 Kudos" | TBD (draft) |
| E08 | Danh sách thẻ Kudo | list | — | — | Always | Bấm avatar/tên mở profile; nút trên thẻ theo F004 | API field | thẻ Kudo | trạng thái trống | TBD (draft) |
| E09 | Tải thêm | button | — | Enabled | Conditional | Nạp trang kế | — | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Gửi lời cảm ơn | E06 | bấm | — | Mở form viết Kudo (F003) phủ lên trang, người nhận đã điền sẵn và khoá | TBD (draft) |
| Tải thêm | E09 | bấm | Còn Kudo chưa nạp | Nối thêm thẻ vào cuối E08 | TBD (draft) |
| Mở hover thẻ nhanh | E08 | rê chuột lên avatar trên thẻ | Avatar Sunner thật | Hiện thẻ nhanh, xem SCR021_AvatarHoverCard | TBD (draft) |

### Happy Path

1. Sunner thấy thông tin, 6 icon kèm tên ở R2.
2. Sunner đọc "Đã nhận: n Kudos" và các thẻ ở R3.
3. Sunner bấm E06; form viết Kudo mở với người nhận đã điền sẵn.
4. Sunner gửi xong, form đóng, trang giữ nguyên (Kudo mới thấy khi tải lại nếu Public).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Chưa nhận Kudo Public nào | Nhãn "Đã nhận: 0 Kudos" + trạng thái trống | TBD (draft) |
| Bước 3 | Đóng form không gửi | Về trang như cũ | TBD (draft) |

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Tải trang hoặc nạp thêm | Khung xương R2 (lần đầu) và R3 | none | TBD (draft) |
| empty | Không có Kudo Public nhận | "Chưa có Kudo nào." | E06 | TBD (draft) |
| error | Gọi dữ liệu lỗi | Thông báo lỗi trong R3 + thử lại | thử lại | TBD (draft) |
| not-found | Sunner không tồn tại | Chuyển sang trang không tìm thấy (F002) "Không tìm thấy Sunner này." | về Live board | TBD (draft) |
| saving | — | N/A — trang chỉ đọc; việc gửi Kudo do form của F003 | — | TBD (draft) |
| success | Dữ liệu tải xong | Đủ nội dung | mọi thao tác | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E08 | Người xem không bao giờ thấy người gửi thật của Kudo ẩn danh | Thẻ hiện nhãn "Ẩn danh" | server response |
| E08 | Không hiển thị Kudo Spam của ai | Không có thẻ Spam trên trang người khác | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Sunner đã có cấp Hero | hardcoded-id | E04 | Có cấp | Chưa có cấp | — |
| Sunner có phòng ban | hardcoded-id | E03 | Có phòng ban | Chưa có | [NEEDS_DOMAIN_CONFIRMATION] cách hiện khi thiếu |
| Còn trang kế | hardcoded-id | E09 | Còn Kudo chưa nạp | Hết | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR008_KudosLiveBoardFeed (F004) | Bấm avatar/tên người gửi hoặc người nhận trên thẻ | Sunner không ẩn danh | TBD (draft) |
| SCR023_OwnProfile | Bấm avatar/tên người khác trên thẻ | — | TBD (draft) |
| SCR021_AvatarHoverCard | Bấm vào thẻ nhanh | — | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Gửi lời cảm ơn | E06 | — | SCR006_WriteKudoModal (F003) | modal | TBD (draft) |
| Mở profile khác | E08 | Avatar/tên Sunner không ẩn danh | SCR022_OtherProfile (khác) hoặc SCR023_OwnProfile nếu là chính mình | redirect | TBD (draft) |
| Xem chi tiết Kudo | E08 | Bấm "Xem chi tiết" | SCR007_KudoDetail (F004) | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Nút E06 ghi rõ tên người nhận; mỗi ô icon có tên |
| Keyboard navigation | [EXPECTED] | Tab tới E06, thẻ, Tải thêm |
| Focus management | [EXPECTED] | Đóng form viết Kudo trả tiêu điểm về E06 |
| Screen reader compatibility | [EXPECTED] | Nhãn "Đã nhận: n Kudos" đọc nguyên câu |
| Error announcement | [EXPECTED] | Thông báo lỗi R3 có vai trò alert |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R2–R3 | Một cột; frame iOS "Profile người khác" chỉ là tham chiếu, chưa đặc tả riêng | TBD (draft) |
