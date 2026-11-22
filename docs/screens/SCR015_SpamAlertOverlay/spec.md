---
status: draft
authored_by: takumi
fcode: F007
created: 2026-11-08
lang: vi
---

# SCR015_SpamAlertOverlay — Screen Spec

**Screen**: SCR015_SpamAlertOverlay: Thẻ Kudo spam và Alert Overlay cảnh báo vi phạm
**Feature**: F007_AdminModeration
**Type**: atomic
**Route**: Không có route riêng. Hiển thị trên trang chi tiết `/kudos/{id}` của chính chủ bài (đã implement ở phase 08) và trên thẻ trong danh sách "Đã gửi" của profile (F012, phase 12; `KudoCard` đã mang sẵn lớp phủ). Live board không liệt kê Kudo spam nên không có lớp phủ ở đó
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Cho chủ bài thấy Kudo của mình đang bị tạm ẩn khỏi các trang công khai và lý do chung: vi phạm tiêu chuẩn cộng đồng.
**Actors:** Chủ bài (Sunner gửi Kudo đó)
**Entry Conditions:** Đã đăng nhập, mở trang chi tiết Kudo của chính mình (hoặc, từ phase 12, danh sách "Đã gửi" trong profile) và Kudo đang ở trạng thái Spam.
**Exit Conditions:** Chủ bài cuộn tiếp, đổi bộ lọc danh sách hoặc rời profile; không có thao tác nào kết thúc riêng ở lớp cảnh báo.

## 2. Screen Layout

### Layout Sketch

Một thẻ Kudo ở dạng biến thể "KUDO spam" (cùng bố cục thẻ Kudo, đã làm mờ) trong danh sách "Đã gửi"; thẻ "Spam" màu cam nằm góc trên bên phải thẻ; lớp Alert Overlay phủ lên thẻ với dòng "Cảnh báo vi phạm tiêu chuẩn cộng đồng". Lớp phủ che toàn bộ thẻ (Figma 3127:24672): nội dung bên dưới làm mờ, phủ xám `rgba(87,87,87,.7)`, tam giác cảnh báo ở giữa kèm dòng chữ trắng. Nhãn "Spam" và nút "Đóng" (trên trang chi tiết) nằm trên lớp mờ.

```
┌──────────────────────────────────────────────┐
│ R1: Thẻ Kudo spam                   [Spam]   │
│   người gửi → người nhận, thời gian          │
│   tiêu đề, lời nhắn, hashtag (làm mờ)        │
│ ┌ - - - - - - - - - - - - - - - - - - - - ┐  │
│ │ R2: Alert Overlay                       │  │
│ │ "Cảnh báo vi phạm tiêu chuẩn cộng đồng" │  │
│ └ - - - - - - - - - - - - - - - - - - - - ┘  │
└──────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Thẻ Kudo spam | static | no | TBD (draft) |
| R2 | Alert Overlay | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Thẻ "Spam" | display field | — | — | Always | — | static | màu cam `#FF8104`, viền `#EAEAEA`, góc trên bên phải | — | `KudoSpamTag` |
| E02 | Nội dung Kudo (người gửi, người nhận, thời gian, tiêu đề, lời nhắn, hashtag) | display field | — | — | Always | — | API field | giống thẻ Kudo thường, làm mờ | dash | TBD (draft) |
| E03 | Cảnh báo vi phạm tiêu chuẩn cộng đồng | message (`role="note"`) | — | — | Always | — | static | tam giác cảnh báo và chữ trắng đậm trong lớp phủ; kèm câu ẩn cho trình đọc màn hình "Kudo này đang bị tạm ẩn khỏi các trang công khai." | — | `SpamAlertOverlay` |

Thẻ này không có nút tim, Copy Link hay sửa. Lớp phủ không có nút đóng (D012, user chọn 2026-11-22). Trên trang chi tiết chỉ còn "Đóng" (về Live board) là phần tử tương tác.

## 4. User Actions

### Available Actions

N/A — no elements carry a discrete user-triggered action.

### Happy Path

1. Chủ bài mở danh sách "Đã gửi" trong profile của mình.
2. Chủ bài thấy Kudo bị tạm ẩn với thẻ "Spam" màu cam ở góc trên phải và dòng cảnh báo vi phạm tiêu chuẩn cộng đồng.
3. Chủ bài đọc cảnh báo rồi cuộn tiếp danh sách.

### Branches

N/A — single-action screen, no branches

### Interaction Notes

N/A — no non-trivial interaction patterns detected (only standard form input bindings).

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Danh sách "Đã gửi" đang tải | Thẻ khung chờ, chưa hiện cảnh báo | none | TBD (draft) |
| empty | Chủ bài không có Kudo nào bị tạm ẩn | Không hiện thẻ spam nào; danh sách chỉ có Kudo bình thường | none | TBD (draft) |
| error | Tải dữ liệu thẻ spam thất bại | Phần Kudo bình thường vẫn hiện; thẻ spam không hiện kèm thông báo lỗi nhẹ cho danh sách | thử lại | TBD (draft) |
| spam | Kudo của chủ bài đang ở trạng thái Spam | Thẻ biến thể làm mờ kèm thẻ "Spam" cam và lớp cảnh báo | none | TBD (draft) |
| restored | Admin bỏ đánh dấu Spam | Ở lần tải kế, thẻ trở lại bình thường, hết lớp cảnh báo | dùng tiếp | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Chỉ chủ bài thấy biến thể spam | auth | E01, E02, E03 | Người xem là người gửi và Kudo đang Spam | Mọi trường hợp khác (người khác không nhận dữ liệu) | Nếu lớp phủ bị bỏ qua phía trình duyệt, người khác vẫn không có dữ liệu để xem |
| Lớp cảnh báo có đóng được không | hardcoded-id | E03 | Cố định trên thẻ, không đóng được | — | D012 đã chốt: không đóng (decision-log 2026-11-22) |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — màn profile bản thân (F012) | Mở danh sách "Đã gửi" | Chủ bài có Kudo đang Spam | TBD (draft) |

### Exits

N/A — this screen has no exits (terminal screen).

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Thẻ "Spam" và dòng cảnh báo có chữ đọc được, không chỉ dựa vào màu cam |
| Keyboard navigation | [EXPECTED] | Link dưới lớp phủ (hồ sơ, link trong lời nhắn, "Xem chi tiết") có `tabIndex=-1`, ảnh ở trang chi tiết không còn là link; chỉ "Đóng" nhận focus. Không dùng `inert` để trình đọc màn hình vẫn đọc được chữ |
| Focus management | [EXPECTED] | Lớp cảnh báo không bẫy focus |
| Screen reader compatibility | [EXPECTED] | Lớp phủ được dựng trước nội dung thẻ nên cảnh báo được đọc trước; chữ của thẻ vẫn nằm trong DOM |
| Error announcement | [EXPECTED] | Lỗi tải danh sách được đọc tự động |

## 10. Responsive Behavior

Trên điện thoại chữ cảnh báo nhỏ hơn (22/28 thay cho 32/40); tam giác rộng khoảng 48% thẻ.
