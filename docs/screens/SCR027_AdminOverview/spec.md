---
status: draft
authored_by: takumi
fcode: F015
created: 2026-11-08
lang: vi
---

# SCR027_AdminOverview — Screen Spec

**Screen**: SCR027_AdminOverview: Admin Overview
**Feature**: F015_AdminOverview
**Type**: composite
**Route**: TBD (draft) — trang "Overview" dưới khu Admin
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Admin xem số liệu Kudo và Secret Box theo từng đơn vị trong một bảng, chọn khoảng ngày để thu hẹp giai đoạn và xuất bảng ra tệp CSV.
**Actors:** Admin
**Entry Conditions:** Đã đăng nhập, có role Admin và chọn mục "Overview" trên menu Admin.
**Exit Conditions:** Admin chuyển sang mục Admin khác hoặc quay về khu Sunner; hoặc đã tải xong tệp Export.

## 2. Screen Layout

### Layout Sketch

Trang nằm trong khung Admin của F002 (thanh trên có logo "Sun* Annual Awards 2025 | ADMIN", menu Overview · Review content · Role · Settings với Overview đang chọn, chuông, ngôn ngữ, avatar — không thuộc màn này). Từ trên xuống: tiêu đề "Overview" cùng ô khoảng ngày và nút Export màu vàng; bảng thống kê. Bảng không có phân trang.

```
┌────────────────────────────────────────────────────────────┐
│ (Khung Admin F002: thanh trên + menu)                      │
├────────────────────────────────────────────────────────────┤
│ R1: Overview     [Start date → End date 📅] [▾ nhanh] [Export]│
├────────────────────────────────────────────────────────────┤
│ R2: No | Unit | Total member | Total sent kudos |          │
│     Total received kudos | Total users with at least 1 kudo│
│     | Total received secret box                            │
│     All   ...tổng toàn hệ thống...                         │
│     CECV1 ...                                              │
│     CECV2 ...                                              │
│     ...mỗi đơn vị một dòng...                              │
└────────────────────────────────────────────────────────────┘
```

Mục chọn nhanh "▾ nhanh" vẽ bằng nét đứt vì chỉ là đề xuất, chưa chốt (D009).

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Header (tiêu đề, khoảng ngày, Export) | static | no | TBD (draft) |
| R2 | Unit Statistics Table | static | yes | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Overview | region label | — | — | Always | — | static | — | — | N/A |
| E02 | Date range (Start date → End date) | date input | no | Trống (toàn thời gian) | Always | Chọn ngày bắt đầu và kết thúc bằng lịch (biểu tượng lịch mở lịch) | route param | ngày `YYYY-MM-DD` | placeholder text "Start date" / "End date" | TBD (draft) |
| E03 | Chọn nhanh khoảng thời gian | select | no | "Tuỳ chọn" | Conditional | Chọn khoảng có sẵn (ví dụ Hôm nay, 7 ngày, 30 ngày) `[INFERRED]` | static | — | placeholder text | TBD (draft) |
| E04 | Export | button | — | Enabled | Always | Tải tệp CSV của bảng đang xem | static | — | — | N/A |
| E05 | No (cột) | table | — | — | Always | — | computed | số thứ tự | dash | TBD (draft) |
| E06 | Unit (cột) | table | — | — | Always | — | API field | tên đơn vị | dash | TBD (draft) |
| E07 | Total member (cột) | table | — | — | Always | — | API field | số nguyên | dash | TBD (draft) |
| E08 | Total sent kudos (cột) | table | — | — | Always | — | API field | số nguyên | dash | TBD (draft) |
| E09 | Total received kudos (cột) | table | — | — | Always | — | API field | số nguyên | dash | TBD (draft) |
| E10 | Total users with at least 1 kudo (cột) | table | — | — | Always | — | API field | số nguyên | dash | TBD (draft) |
| E11 | Total received secret box (cột) | table | — | — | Always | — | API field | số nguyên | dash | TBD (draft) |
| E12 | Dòng "All" | table | — | — | Always | — | computed | số nguyên, in đậm `[INFERRED]` | giá trị 0 | TBD (draft) |
| E13 | Dòng đơn vị | table | — | — | Always | — | API field | số nguyên | giá trị 0 | TBD (draft) |
| E14 | Dòng "Chưa gán đơn vị" | table | — | — | Conditional | — | API field | số nguyên | giá trị 0 | TBD (draft) |

Ghi chú: Figma viết "reveived", "atleast"; spec dùng "received", "at least" (D010 ở functional-spec). Cột No của dòng "All" để trống. Bảng không có phân trang và không có biểu tượng sắp xếp (D011).

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn khoảng ngày | E02 | click biểu tượng lịch, chọn ngày | — | Bảng dựng lại theo khoảng ngày; "Total member" giữ nguyên | TBD (draft) |
| Chọn nhanh khoảng thời gian | E03 | click, chọn | Có mục chọn nhanh (D009) | E02 điền khoảng tương ứng, bảng dựng lại | TBD (draft) |
| Export | E04 | click | — | Tải tệp CSV theo khoảng ngày đang chọn | TBD (draft) |

### Happy Path

1. Admin thấy bảng số liệu toàn thời gian ở R2: dòng "All" rồi từng đơn vị.
2. Admin bấm E02 và chọn khoảng ngày — R2 hiện trạng thái chờ rồi cập nhật số liệu.
3. Admin so sánh các đơn vị với dòng "All" ở R2.
4. Admin bấm "Export" ở R1 — trình duyệt tải về tệp CSV đúng như bảng đang xem.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Ngày bắt đầu sau ngày kết thúc | Hiện lỗi cạnh E02, bảng giữ nguyên | TBD (draft) |
| Bước 2 | Tải số liệu thất bại | R2 hiện lỗi kèm nút thử lại, khoảng ngày giữ nguyên | TBD (draft) |
| Bước 4 | Tạo tệp thất bại | Không tải tệp, hiện lỗi cho phép thử lại | TBD (draft) |
| Bước 1 | Chưa có đơn vị nào | R2 chỉ có dòng "All" kèm thông báo "Chưa có đơn vị nào." | TBD (draft) |

### Interaction Notes

- **Chọn khoảng ngày thì địa chỉ trang giữ khoảng ngày, tải lại trang vẫn ra đúng số liệu** — source: TBD (draft)
- **Nút Export bị khoá kèm trạng thái chờ trong lúc chuẩn bị tệp** — source: TBD (draft)
- **Để trống một đầu hoặc cả hai đầu khoảng ngày vẫn hợp lệ** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang tải hoặc dựng lại bảng sau khi đổi ngày | Các dòng khung chờ trong R2, ô khoảng ngày vẫn thao tác được | đổi khoảng ngày | TBD (draft) |
| empty | Chưa có đơn vị nào | Chỉ dòng "All" kèm thông báo "Chưa có đơn vị nào." | none | TBD (draft) |
| error | Tải số liệu thất bại | Thông báo "Không tải được số liệu. Vui lòng thử lại." kèm nút thử lại ở R2 | thử lại | TBD (draft) |
| exporting | Đang chuẩn bị tệp | E04 khoá, hiện vòng chờ | none | TBD (draft) |
| export-error | Tạo tệp thất bại | Thông báo "Không xuất được số liệu. Vui lòng thử lại." | thử lại | TBD (draft) |
| success | Tệp đã tải xong | Trình duyệt hiện tệp đã tải; không có thông báo riêng | dùng tiếp | TBD (draft) |

Không có trạng thái saving: màn hình chỉ đọc.

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E02 | Ngày bắt đầu không sau ngày kết thúc | "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" | change |
| E02 | Ngày phải hợp lệ | "Ngày không hợp lệ" | change |
| E04 | Tạo tệp thất bại | "Không xuất được số liệu. Vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Mục chọn nhanh khoảng thời gian | configuration | E03 | Quyết định làm mục chọn nhanh | Mặc định bản đầu | [NEEDS_DOMAIN_CONFIRMATION] D009: nội dung khung "chọn thời gian" trên thiết kế chưa rõ |
| Dòng "Chưa gán đơn vị" | hardcoded-id | E14 | Có ít nhất một Sunner chưa thuộc đơn vị nào | Mọi Sunner đều đã có đơn vị | Suy ra từ dữ liệu, không phải cờ cấu hình; D007 |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR002_AdminLayout | Bấm mục "Overview" trên menu Admin | Role Admin | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Chuyển mục Admin | Menu của khung Admin | — | TBD (draft) — SCR002_AdminLayout (các trang Admin khác) | redirect | TBD (draft) |
| Không đủ quyền | — | Guard từ chối | TBD (draft) — SCR004_Error403 | redirect | TBD (draft) |
| Tải tệp | E04 | — | (stays on screen) | tệp CSV được tải về | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Bảng có tiêu đề cột; ô khoảng ngày và nút lịch có nhãn đọc được; dòng "All" được đánh dấu là dòng tổng |
| Keyboard navigation | [EXPECTED] | Tab qua ô khoảng ngày, nút lịch, Export theo thứ tự hiển thị; lịch chọn được bằng phím mũi tên |
| Focus management | [EXPECTED] | Lịch chọn ngày giữ focus bên trong; đóng thì trả focus về ô khoảng ngày |
| Screen reader compatibility | [EXPECTED] | Có landmark cho vùng bộ lọc và bảng; bảng dựng lại được đọc lên ("đã cập nhật số liệu") |
| Error announcement | [EXPECTED] | Lỗi ngày, lỗi tải số liệu, lỗi Export được đọc tự động |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
