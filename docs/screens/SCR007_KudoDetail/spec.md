---
status: draft
authored_by: takumi
fcode: F004
created: 2026-11-08
lang: vi
---

# SCR007_KudoDetail — Screen Spec

**Screen**: SCR007_KudoDetail: Chi tiết Kudo
**Feature**: F004_KudosFeed
**Type**: atomic
**Route**: TBD (draft)
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner đọc đầy đủ một Kudo (lời nhắn dài, mọi ảnh) khi bấm "Xem chi tiết" hoặc mở liên kết được chia sẻ.
**Actors:** Sunner, Chủ Kudo
**Entry Conditions:** Đã đăng nhập; có liên kết hoặc nút tới Kudo đó; Kudo đang ở trạng thái Public.
**Exit Conditions:** Sunner quay lại Live board hoặc sang profile người gửi/nhận.

[EXPECTED] Dạng hiển thị (trang riêng hay modal) chưa chốt; bản này giả định trang riêng có địa chỉ cố định vì Copy Link cần liên kết ổn định. Đối chiếu frame View Kudo 520:18779 khi triển khai.

## 2. Screen Layout

### Layout Sketch

Trang gồm header chung, một khối nội dung Kudo (người gửi, người nhận, thời gian, danh hiệu, lời nhắn đầy đủ, ảnh, hashtag, số tim, Copy Link) và footer chung. Chi tiết bố cục theo Figma, chưa chốt.

```
┌──────────────────────────────────────┐
│ R1: Header (F002, fixed-top)         │
├──────────────────────────────────────┤
│ R2: Nội dung Kudo (scrollable)       │
│   [← Quay lại]  [Copy Link]          │
├──────────────────────────────────────┤
│ R3: Footer (F002)                    │
└──────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header | fixed-top | no | TBD (draft) — thuộc F002 |
| R2 | Nội dung Kudo | static | yes | TBD (draft) |
| R3 | Footer | static | no | TBD (draft) — thuộc F002 |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Quay lại | button | — | Enabled | Always | Về Live board | — | — | — | N/A |
| E02 | Người gửi hoặc nhãn "Ẩn danh" | display field | — | — | Always | Bấm mở profile (bài không ẩn danh) | API field | raw | nhãn "Ẩn danh" | TBD (draft) |
| E03 | Người nhận | display field | — | — | Always | Bấm mở profile | API field | raw | dash | TBD (draft) |
| E04 | Thời gian gửi | display field | — | — | Always | — | API field | ngày giờ theo ngôn ngữ | dash | TBD (draft) |
| E05 | Danh hiệu | display field | — | — | Always | — | API field | raw | hidden | TBD (draft) |
| E06 | Lời nhắn (đầy đủ) | display field | — | — | Always | — | API field | raw, không cắt | dash | TBD (draft) |
| E07 | Ảnh đính kèm | image | — | — | Conditional | Xem từng ảnh | API field | đầy đủ | hidden | TBD (draft) |
| E08 | Hashtag | display field | — | — | Always | — | API field | dạng "#TÊN" | hidden | TBD (draft) |
| E09 | Số tim / nút tim | button | — | — | Always | Thả tim (hành vi thuộc F005) | API field | số | 0 | TBD (draft) |
| E10 | Copy Link | button | — | Enabled | Always | Sao chép liên kết Kudo | — | — | — | N/A |
| E11 | Nút sửa | button | — | Ẩn | Conditional | Mở luồng sửa Kudo (F003) — TBD (draft) có hiện ở trang này không | — | — | — | N/A |
| E12 | Thông báo không tìm thấy | message | — | Ẩn | Conditional | Về Live board | static | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Sao chép liên kết | E10 | bấm | — | Liên kết vào bộ nhớ tạm, hiện thông báo ngắn | TBD (draft) |
| Xem ảnh | E07 | bấm | Kudo có ảnh | Hiện ảnh lớn hơn | TBD (draft) |

### Happy Path

1. Sunner tới trang chi tiết và thấy toàn bộ lời nhắn ở R2.
2. Sunner cuộn đọc hết lời nhắn và xem các ảnh đính kèm.
3. Sunner bấm Copy Link (E10) và thấy thông báo đã sao chép.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Kudo không tồn tại hoặc không còn Public | Hiện E12 "Kudo này không tồn tại hoặc đã bị gỡ." | TBD (draft) |
| Bước 3 | Trình duyệt chặn bộ nhớ tạm | Thông báo lỗi kèm liên kết để sao chép tay | TBD (draft) |

### Interaction Notes

N/A — no non-trivial interaction patterns detected (only standard form input bindings).

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang nạp Kudo | Khung chờ (skeleton) ở R2 | none | TBD (draft) |
| empty | Kudo không tồn tại / không Public | Thông báo không tìm thấy (E12) | Quay lại Live board | TBD (draft) |
| error | Nạp thất bại | "Không tải được Kudo. Vui lòng thử lại." | Thử lại | TBD (draft) |
| success | Sao chép xong | Thông báo ngắn "Đã sao chép liên kết" | tự ẩn | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E10 | Trình duyệt phải cho ghi bộ nhớ tạm | "Không sao chép được liên kết, vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Nút sửa chỉ hiện trên bài của chính người xem | auth | E11 | Người xem là người gửi | Người xem không phải người gửi | Che ở phía server |
| Ảnh chỉ hiện khi Kudo có ảnh | hardcoded-id | E07 | Kudo có ảnh | Không có ảnh | — |
| Thông báo không tìm thấy chỉ hiện khi Kudo không xem được | hardcoded-id | E12 | Không tồn tại hoặc không Public | Kudo xem được | Không phân biệt hai trường hợp để không lộ Kudo có tồn tại |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR008_KudosLiveBoardFeed | Bấm "Xem chi tiết" trên thẻ | — | TBD (draft) |
| Liên kết chia sẻ (ngoài hệ thống) | Mở liên kết đã sao chép | Đã đăng nhập; chưa thì qua đăng nhập (F001) rồi quay lại | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Quay lại | E01 | — | SCR008_KudosLiveBoardFeed | redirect | TBD (draft) |
| Mở profile người gửi/nhận | E02, E03 | Người gửi không ẩn danh | Profile (F012, TBD (draft)) | redirect | TBD (draft) |
| Sửa Kudo | E11 | Chủ Kudo | Luồng sửa Kudo (F003, TBD (draft)) | modal | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Nút quay lại, Copy Link, ảnh đều có nhãn/văn bản thay thế |
| Keyboard navigation | [EXPECTED] | Thứ tự Tab theo thứ tự đọc |
| Focus management | [EXPECTED] | Tiêu điểm vào tiêu đề nội dung khi mở trang |
| Screen reader compatibility | [EXPECTED] | Nhãn "Ẩn danh" đọc đúng; vùng nội dung có landmark |
| Error announcement | [EXPECTED] | Thông báo không tìm thấy và lỗi sao chép được đọc tự động |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.

[NEEDS_DOMAIN_CONFIRMATION] Điểm gãy cụ thể chưa chốt; theo Figma khi triển khai.
