---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-own-profile — Screen Spec

**Screen**: SCR-own-profile: Profile bản thân
**Feature**: F012_Profile
**Type**: composite
**Route**: TBD (draft) — đề xuất trang cố định riêng cho "profile của tôi"
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner xem thông tin, huy hiệu Hero, bộ sưu tập icon, số liệu cá nhân và các Kudo mình đã gửi/đã nhận; mở từ mục Profile của menu avatar. (Figma 362:5037)
**Actors:** Sunner (chủ profile)
**Entry Conditions:** Đã đăng nhập; chọn "Profile" trong menu avatar, hoặc mở địa chỉ profile của chính mình từ nơi khác.
**Exit Conditions:** Sunner sang Live board, profile người khác (bấm avatar/tên trên thẻ Kudo), màn mở Secret Box hoặc rời trang.

## 2. Screen Layout

### Layout Sketch

Trang gồm header chung, dải nền hero, khối thông tin ở giữa (avatar lớn, tên màu vàng, dòng "mã phòng ban · huy hiệu Hero"), hàng 6 icon tròn, bảng thống kê cá nhân, rồi mục "Sun* Annual Awards 2025 / KUDOS" có dropdown lọc và danh sách thẻ Kudo, cuối cùng là footer chung. Bố cục chi tiết theo Figma, chưa chốt thêm.

```
┌──────────────────────────────────────────┐
│ R1: Header (F002, fixed-top)             │
├──────────────────────────────────────────┤
│ R2: Hero + thông tin cá nhân             │
│     (avatar, tên, phòng ban · huy hiệu)  │
│     ○ ○ ○ ○ ○ ○  Bộ sưu tập icon của tôi │
├──────────────────────────────────────────┤
│ R3: Bảng thống kê (F010)  [Mở Secret Box]│
├──────────────────────────────────────────┤
│ R4: KUDOS  [Đã gửi (n) ▾]                │
│     [thẻ Kudo] [thẻ Kudo] ... [Tải thêm] │
├──────────────────────────────────────────┤
│ R5: Footer (F002)                        │
└──────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | fixed-top | no | TBD (draft) — thuộc F002 |
| R2 | Hero + thông tin cá nhân | static | yes | TBD (draft) — dùng lại huy hiệu Hero (F009), bộ sưu tập icon (F010) |
| R3 | Bảng thống kê | static | yes | TBD (draft) — dùng lại bảng thống kê cá nhân (F010) |
| R4 | KUDOS | static | yes | TBD (draft) — dùng lại thẻ Kudo (F004), thẻ Spam (F007) |
| R5 | Footer | static | no | TBD (draft) — thuộc F002 |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Avatar lớn | image | — | Ảnh Google | Always | — | API field | tròn | avatar mặc định | MODEL profiles (F001) |
| E02 | Tên (vàng) | display field | — | — | Always | — | API field | raw | dash | MODEL profiles (F001) |
| E03 | Mã phòng ban | display field | — | — | Conditional | — | API field | raw | hidden | TBD (draft) |
| E04 | Huy hiệu Hero | display field | — | — | Conditional | Hiện giải thích cấp (F009) | computed | pill | hidden | TBD (draft) |
| E05 | 6 ô icon + chú thích "Bộ sưu tập icon của tôi" | list | — | 6 ô xám rỗng | Always | — | API field | tròn; ô chưa có xám | xám rỗng | TBD (draft) |
| E06 | Bảng thống kê (5 số) | display field | — | 0 | Always | — | computed | số nguyên | 0 | TBD (draft) |
| E07 | Mở Secret Box | button | — | Enabled khi có hộp chưa mở | Always | Mở màn mở Secret Box (F010) | — | — | — | N/A |
| E08 | Tiêu đề "Sun* Annual Awards 2025 / KUDOS" | region label | — | — | Always | — | static | — | — | N/A |
| E09 | Dropdown "Đã gửi (n)" / "Đã nhận (n)" | select | yes | Đã gửi | Always | Đổi danh sách | computed | "Nhãn (n)" | — | TBD (draft) |
| E10 | Danh sách thẻ Kudo | list | — | — | Always | Bấm avatar/tên mở profile; các nút trên thẻ theo F004 | API field | thẻ Kudo | trạng thái trống | TBD (draft) |
| E11 | Thẻ cam "Spam" | message | — | — | Conditional | — | API field | tag góc phải trên | hidden | TBD (draft) |
| E12 | Tải thêm | button | — | Enabled | Conditional | Nạp trang kế | — | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Đổi danh sách | E09 | chọn | — | Danh sách E10 tải lại từ đầu theo lựa chọn, số (n) giữ nguyên | TBD (draft) |
| Tải thêm | E12 | bấm | Còn Kudo chưa nạp | Nối thêm thẻ vào cuối E10 | TBD (draft) |
| Mở Secret Box | E07 | bấm | Có Secret Box chưa mở | Mở màn mở Secret Box (F010) | TBD (draft) |
| Mở hover thẻ nhanh | E10 | rê chuột lên avatar trên thẻ | Avatar Sunner thật | Hiện thẻ nhanh, xem SCR-avatar-hover-card | TBD (draft) |

### Happy Path

1. Sunner mở trang, thấy avatar, tên, phòng ban, huy hiệu ở R2 và 6 icon.
2. Sunner xem 5 số ở R3.
3. Sunner cuộn tới R4, thấy "Đã gửi" mặc định với các thẻ, thẻ Spam có nhãn cam.
4. Sunner chọn "Đã nhận" ở E09, danh sách tải lại.
5. Sunner bấm "Tải thêm" để đọc tiếp.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Chưa có cấp Hero | Không hiện E04 | TBD (draft) |
| Bước 3 | Chưa gửi Kudo nào | Trạng thái trống thay danh sách | TBD (draft) |
| Bước 4 | Gọi lỗi | Thông báo lỗi kèm thử lại ở R4; các vùng khác giữ nguyên | TBD (draft) |

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Tải trang hoặc đổi E09 | Khung xương cho R2/R3 (lần đầu) và R4 | none | TBD (draft) |
| empty | Danh sách không có Kudo | Hình/chữ trống "Chưa có Kudo nào." | không có | TBD (draft) |
| error | Gọi dữ liệu lỗi | Thông báo lỗi trong vùng lỗi + nút thử lại | thử lại | TBD (draft) |
| saving | — | N/A — trang chỉ đọc | — | TBD (draft) |
| success | Dữ liệu tải xong | Vùng hiện đủ nội dung | mọi thao tác | TBD (draft) |
| loading-more | Bấm Tải thêm | Nút E12 khoá kèm chỉ báo | none | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E09 | Chỉ nhận "Đã gửi" hoặc "Đã nhận" | Nếu cập nhật lỗi: "Không tải được danh sách. Thử lại." | server response |
| E10 | Chỉ Kudo của chính mình được xem ở "Đã gửi" | Không hiển thị gì thêm; không có đường xem "Đã gửi" của người khác | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Sunner đã có cấp Hero | hardcoded-id | E04 | Có cấp | Chưa có cấp | — |
| Sunner có phòng ban | hardcoded-id | E03 | Có phòng ban | Chưa có (F001 gap) | [NEEDS_DOMAIN_CONFIRMATION] cách hiện khi thiếu phòng ban |
| Kudo là Spam của chính mình | hardcoded-id | E11 | Trên thẻ Spam trong "Đã gửi" | Mọi thẻ khác | — |
| Còn trang kế | hardcoded-id | E12 | Còn Kudo chưa nạp | Hết | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR-app-layout (F002) | Mục "Profile" của menu avatar | Đã đăng nhập | TBD (draft) |
| SCR-other-profile | Mở địa chỉ profile của chính mình | Chuyển về trang này | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở Secret Box | E07 | Có hộp chưa mở | SCR-secret-box-open (F010) | modal | TBD (draft) |
| Mở profile người khác | E10 | Bấm avatar/tên Sunner không ẩn danh | SCR-other-profile | redirect | TBD (draft) |
| Xem chi tiết Kudo | E10 | Bấm "Xem chi tiết" trên thẻ | SCR-kudo-detail (F004) | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Dropdown E09 có nhãn; 6 ô icon có tên đọc được cả khi chưa sở hữu |
| Keyboard navigation | [EXPECTED] | Dropdown, nút, thẻ Kudo đều tới được bằng Tab |
| Focus management | [EXPECTED] | Đổi dropdown giữ tiêu điểm tại E09; sau Tải thêm tiêu điểm vào thẻ mới đầu tiên |
| Screen reader compatibility | [EXPECTED] | Số liệu đọc kèm nhãn |
| Error announcement | [EXPECTED] | Thông báo lỗi vùng R4 có vai trò alert |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R2–R4 | Một cột; frame iOS "Profile bản thân" chỉ là tham chiếu, chưa đặc tả riêng | TBD (draft) |
