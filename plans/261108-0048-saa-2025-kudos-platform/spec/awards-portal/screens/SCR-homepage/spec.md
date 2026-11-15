---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-homepage — Screen Spec

**Screen**: SCR-homepage: Homepage SAA
**Feature**: F006_AwardsPortal
**Type**: composite
**Route**: / (TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Giới thiệu SAA 2025 cho Sunner đã đăng nhập: chủ đề, thời gian, địa điểm, các giải và Sun* Kudos, rồi đưa họ tới trang chi tiết.
**Actors:** Sunner, Admin
**Entry Conditions:** Đã có phiên đăng nhập và giờ máy chủ đã qua giờ mở.
**Exit Conditions:** Người dùng sang trang Hệ thống giải hoặc Sun* Kudos, hoặc rời qua header.

## 2. Screen Layout

### Layout Sketch

Trang cuộn dọc: hero "ROOT FURTHER" ở đầu kèm đếm ngược và thông tin sự kiện, hai nút chính, bài chủ đề dài, mục "Hệ thống giải thưởng" với lưới 6 thẻ, banner Sun* Kudos, rồi footer. Header và footer do khung chung cấp (F002_AppShell). Chi tiết bố cục lưới và hình chưa đối chiếu từ frame thiết kế `[UNVERIFIED]`.

```
┌─────────────────────────────────────────┐
│ R1: Hero (ROOT FURTHER, nhãn, đếm ngược)│
│     thời gian · địa điểm · livestream   │
│     [ABOUT AWARDS ↗] [ABOUT KUDOS ↗]    │
├─────────────────────────────────────────┤
│ R2: Theme Article (scrollable)          │
├─────────────────────────────────────────┤
│ R3: Awards Grid  [card][card][card]     │
│                  [card][card][card]     │
├─────────────────────────────────────────┤
│ R4: Kudos Banner                        │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Hero | static | no | TBD (draft) |
| R2 | Theme Article | static | yes | TBD (draft) |
| R3 | Awards Grid | static | yes | TBD (draft) |
| R4 | Kudos Banner | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Hình hero "ROOT FURTHER" | image | — | — | Always | — | static | — | hidden | N/A |
| E02 | Nhãn sắp diễn ra | message | — | — | Conditional | — | static | — | hidden | N/A |
| E03 | DAYS / HOURS / MINUTES | display field | — | Giá trị từ máy chủ | Always | — | computed | 2 chữ số mỗi ô | 00 | N/A |
| E04 | Thời gian: 26/12/2025 | display field | — | — | Always | — | static | dd/mm/yyyy | dash | N/A |
| E05 | Địa điểm: Âu Cơ Art Center | display field | — | — | Always | — | static | — | dash | N/A |
| E06 | Tường thuật trực tiếp qua sóng Livestream | message | — | — | Always | — | static | — | hidden | N/A |
| E07 | ABOUT AWARDS | button | — | Enabled | Always | Mở trang Hệ thống giải | static | — | — | N/A |
| E08 | ABOUT KUDOS | button | — | Enabled | Always | Mở Sun* Kudos | static | — | — | N/A |
| E09 | Bài chủ đề "Root Further" và câu "A tree with deep roots fears no storm" | text | — | — | Always | — | static | — | hidden | N/A |
| E10 | Tiêu đề "Sun* annual awards 2025 / Hệ thống giải thưởng" | region label | — | — | Always | — | static | — | — | N/A |
| E11 | Thẻ giải (6 thẻ: tên, mô tả ngắn, ảnh) | list | — | 6 thẻ | Always | — | static | mô tả cắt gọn | hidden | N/A |
| E12 | Chi tiết ↗ (mỗi thẻ) | link | — | Enabled | Always | Mở đúng giải ở trang Hệ thống giải | static | — | — | N/A |
| E13 | Banner "Phong trào ghi nhận / Sun* Kudos / ĐIỂM MỚI CỦA SAA 2025" | image | — | — | Always | — | static | — | hidden | N/A |
| E14 | Chi tiết (banner Kudos) | button | — | Enabled | Always | Mở Sun* Kudos | static | — | — | N/A |

Sáu thẻ giải: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP (Most Valuable Person). Nội dung đầy đủ từng giải xem spec màn SCR-awards-system.

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở thông tin giải | E07 | click | — | Rời trang | TBD (draft) |
| Mở Sun* Kudos | E08, E14 | click | — | Rời trang | TBD (draft) |
| Xem chi tiết một giải | E12 | click | — | Rời trang, tới đúng mục giải | TBD (draft) |

### Happy Path

1. Người dùng thấy hero, đếm ngược và thông tin sự kiện ở R1.
2. Người dùng cuộn xuống đọc bài chủ đề ở R2.
3. Người dùng xem 6 thẻ giải ở R3 và bấm "Chi tiết" ở một thẻ.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Đã qua giờ bắt đầu lễ | Đếm ngược dừng ở 00, ẩn nhãn sắp diễn ra (D005) | TBD (draft) |
| Bước 3 | Ảnh thẻ giải lỗi | Khung thay thế, chữ vẫn đọc được | TBD (draft) |

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| initial | Trang tải xong | Đếm ngược hiện giá trị tính phía máy chủ | Mọi nút | TBD (draft) |
| ticking | Mỗi phút | Ô số đổi | Mọi nút | TBD (draft) |
| after-event | Qua giờ bắt đầu lễ | 00:00:00, không nhãn sắp diễn ra | Mọi nút | TBD (draft) |
| image-error | Ảnh lỗi tải | Khung thay thế | Mọi nút | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Lễ chưa bắt đầu | configuration | E02 | Giờ máy chủ trước giờ bắt đầu lễ | Sau giờ bắt đầu lễ | [NEEDS_DOMAIN_CONFIRMATION] theo D005 |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR-countdown-prelaunch | Đếm về 0 | — | TBD (draft) |
| TBD (draft) — SCR-login | Đăng nhập thành công | Sau giờ mở | TBD (draft) |
| TBD (draft) — SCR-app-layout | Liên kết "About SAA 2025" | — | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở thông tin giải | E07 | — | TBD (draft) — SCR-awards-system | redirect | TBD (draft) |
| Xem chi tiết một giải | E12 | — | TBD (draft) — SCR-awards-system (đúng mục giải) | redirect | TBD (draft) |
| Mở Sun* Kudos | E08, E14 | — | TBD (draft) — SCR-kudos-live-board-feed | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Ảnh hero có chữ thay thế; thẻ giải là danh sách; nút có tên rõ |
| Keyboard navigation | [EXPECTED] | Mọi nút và liên kết nhận focus theo thứ tự đọc |
| Focus management | [EXPECTED] | Không bẫy focus; đếm ngược không cướp focus |
| Screen reader compatibility | [EXPECTED] | Tiêu đề phân cấp rõ để nhảy giữa các vùng |
| Error announcement | [EXPECTED] | Không áp dụng; màn không có form |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R3 | Lưới thẻ xếp một cột | TBD (draft) |
| mobile | R1 | Hai nút chính xếp dọc | TBD (draft) |
