---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-awards-system — Screen Spec

**Screen**: SCR-awards-system: Hệ thống giải
**Feature**: F006_AwardsPortal
**Type**: composite
**Route**: /awards (TBD (draft))
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Cho Sunner xem từng hạng mục giải SAA 2025 với mô tả, số lượng và giá trị, và nhảy nhanh giữa các giải.
**Actors:** Sunner, Admin; người dùng thường trước giờ mở nếu D002 giữ mặc định
**Entry Conditions:** Đã có phiên đăng nhập; từ Homepage, từ header, hoặc từ màn đếm ngược.
**Exit Conditions:** Người dùng sang Sun* Kudos qua banner cuối trang hoặc rời qua header.

## 2. Screen Layout

### Layout Sketch

Hero và tiêu đề "Hệ thống giải thưởng SAA 2025" ở đầu. Bên trái là menu neo 6 giải đứng yên khi cuộn; bên phải là 6 khối giải xếp dọc, mỗi khối có ảnh, tên, mô tả, số lượng, giá trị. Cuối trang là banner Sun* Kudos. Header và footer do khung chung cấp (F002_AppShell). Chi tiết bố cục ảnh trái/phải chưa đối chiếu từ frame `[UNVERIFIED]`.

```
┌─────────────────────────────────────────┐
│ R1: Hero + tiêu đề                      │
├──────────────┬──────────────────────────┤
│ R2: Anchor   │ R3: Award Sections       │
│ Menu (sticky)│ (scrollable, 6 khối)     │
├──────────────┴──────────────────────────┤
│ R4: Kudos Banner                        │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Hero | static | no | TBD (draft) |
| R2 | Anchor Menu | sticky | no | TBD (draft) |
| R3 | Award Sections | static | yes | TBD (draft) |
| R4 | Kudos Banner | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Hero và tiêu đề "Hệ thống giải thưởng SAA 2025" | image | — | — | Always | — | static | — | hidden | N/A |
| E02 | Mục menu neo (6 mục, theo tên giải) | link | — | Mục đầu được đánh dấu | Always | Cuộn tới giải | static | — | — | N/A |
| E03 | Ảnh giải (6) | image | — | — | Always | — | static | — | hidden | N/A |
| E04 | Tên giải (6) | text | — | — | Always | — | static | — | — | N/A |
| E05 | Mô tả giải (6) | text | — | — | Always | — | static | — | dash | N/A |
| E06 | Số lượng giải thưởng (6) | display field | — | — | Always | — | static | số + loại người nhận | dash | N/A |
| E07 | Giá trị giải thưởng (6) | display field | — | — | Always | — | static | số có dấu chấm + "VNĐ/giải" | dash | N/A |
| E08 | Mức giá trị thứ hai (chỉ Signature 2025 - Creator) | display field | — | — | Conditional | — | static | số có dấu chấm + "VNĐ" | hidden | N/A |
| E09 | Banner Sun* Kudos | image | — | — | Always | — | static | — | hidden | N/A |
| E10 | Chi tiết (banner Kudos) | button | — | Enabled | Always | Mở Sun* Kudos | static | — | — | N/A |

Bảng nội dung 6 giải (một nguồn dùng chung với Homepage, chỉ ghi số liệu; mô tả đầy đủ do thiết kế/BTC cung cấp):

| Giải | Số lượng giải thưởng | Giá trị giải thưởng |
|------|----------------------|---------------------|
| Top Talent | 10 cá nhân | 7.000.000 VNĐ/giải |
| Top Project | 02 tập thể | 15.000.000 VNĐ/giải |
| Top Project Leader | 03 cá nhân | 7.000.000 VNĐ/giải |
| Best Manager | 01 cá nhân | 10.000.000 VNĐ/giải |
| Signature 2025 - Creator | 01 cá nhân hoặc tập thể | 5.000.000 VNĐ (cá nhân); 8.000.000 VNĐ (tập thể) |
| MVP (Most Valuable Person) | 01 | 15.000.000 VNĐ/giải |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Tới một giải | E02 | click | — | Cuộn mượt tới khối giải, mục menu được đánh dấu | TBD (draft) |
| Mở Sun* Kudos | E10 | click | — | Rời trang | TBD (draft) |

### Happy Path

1. Người dùng thấy hero và menu neo ở R2.
2. Người dùng bấm "Top Project" ở R2 và trang cuộn tới khối Top Project ở R3.
3. Người dùng cuộn tiếp, mục menu đổi theo giải đang xem.
4. Người dùng xuống cuối trang, thấy banner ở R4.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Mở trang | Địa chỉ có mục neo hợp lệ (đến từ Homepage) | Trang cuộn thẳng tới giải đó | TBD (draft) |
| Mở trang | Mục neo không khớp giải nào | Trang mở từ đầu, không báo lỗi | TBD (draft) |

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| initial | Trang tải xong | Mục đầu của menu được đánh dấu | Mọi liên kết | TBD (draft) |
| scrolling | Người dùng cuộn | Mục menu đổi theo khối đang ở giữa màn hình | Mọi liên kết | TBD (draft) |
| image-error | Ảnh giải lỗi | Khung thay thế, chữ vẫn đọc được | Mọi liên kết | TBD (draft) |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Giải có hai mức giá trị | hardcoded-id | E08 | Giải là Signature 2025 - Creator | Năm giải còn lại | Chỉ giải này tách mức cá nhân và tập thể |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR-homepage | Chi tiết của thẻ giải hoặc ABOUT AWARDS | — | TBD (draft) |
| TBD (draft) — SCR-app-layout | Liên kết "Award Information" | — | TBD (draft) |
| TBD (draft) — SCR-countdown-prelaunch | Liên kết thông tin giải | Trước giờ mở, D002 giữ mặc định | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở Sun* Kudos | E10 | — | TBD (draft) — SCR-kudos-live-board-feed | redirect | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Menu neo là điều hướng có nhãn; mục đang xem báo trạng thái hiện tại |
| Keyboard navigation | [EXPECTED] | Tab đi qua menu neo rồi các khối giải; Enter cuộn tới giải |
| Focus management | [EXPECTED] | Sau khi chọn mục, focus chuyển tới tiêu đề giải |
| Screen reader compatibility | [EXPECTED] | Mỗi giải là một vùng có tiêu đề riêng |
| Error announcement | [EXPECTED] | Không áp dụng; màn không có form |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile | R2 | Thành thanh chip nằm ngang ở đầu trang, cuộn được (theo D009) | TBD (draft) |
