---
status: draft
authored_by: takumi
fcode: F010
created: 2026-11-08
lang: vi
---

# SCR017_LiveBoardRewardsColumn — Screen Spec

**Screen**: SCR017_LiveBoardRewardsColumn: Cột thưởng của Live board — thống kê cá nhân và 10 Sunner nhận quà mới nhất
**Feature**: F010_SecretBoxRewards
**Type**: composite
**Route**: TBD (draft) — không có route riêng; là vùng nhúng R6 (cột phải) của trang SCR008_KudosLiveBoardFeed do F004_KudosFeed sở hữu. Bảng thống kê cá nhân (R1 dưới đây) còn được dùng lại trên profile của chính mình (F012, TBD (draft)).
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner xem tiến độ phần thưởng của mình (Kudos nhận/gửi, tim, Secret Box đã/chưa mở), mở Secret Box, và thấy đồng nghiệp nào vừa nhận quà, mỗi khi vào Live board.
**Actors:** Sunner
**Entry Conditions:** Đã đăng nhập bằng email công ty; đang ở trang Live board (hoặc profile của chính mình đối với bảng thống kê).
**Exit Conditions:** Sunner bấm "Mở Secret Box" để sang màn mở hộp, hoặc rời trang qua phần khác của Live board / header.

## 2. Screen Layout

### Layout Sketch

Cột phải của Live board gồm hai khối xếp dọc: bảng thống kê cá nhân ở trên (năm dòng số liệu rồi nút vàng "Mở Secret Box"), và panel "10 SUNNER NHẬN QUÀ MỚI NHẤT" ở dưới với danh sách cuộn được. Hai khối nằm trong ô slot R6 của trang Live board nên vị trí và chiều rộng cột do F004 quyết. Thứ tự và tỉ lệ [INFERRED] từ báo cáo phân tích Figma, cần đối chiếu frame Live board khi triển khai.

```
┌─────────────────────────────────────┐
│ R1: Thống kê cá nhân (static)       │
│   Số Kudos bạn nhận được      25    │
│   Số Kudos bạn đã gửi         25    │
│   Số tim bạn nhận được  🔥 25  [x2] │
│   Số Secret Box bạn đã mở     25    │
│   Số Secret Box chưa mở       25    │
│   [ Mở Secret Box 🎁 ]              │
├─────────────────────────────────────┤
│ R2: 10 SUNNER NHẬN QUÀ MỚI NHẤT     │
│   (avatar) Tên   Nhận được 1 áo...  │
│   (avatar) Tên   Nhận được ...      │
│   ...                  (scrollable) │
└─────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Bảng thống kê cá nhân | static | no | TBD (draft) — dùng lại được trên profile của mình |
| R2 | 10 Sunner nhận quà mới nhất | static | yes | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Số Kudos bạn nhận được | display field | — | 0 | Always | — | API field | số nguyên | 0 | TBD (draft) |
| E02 | Số Kudos bạn đã gửi | display field | — | 0 | Always | — | API field | số nguyên | 0 | TBD (draft) |
| E03 | Số tim bạn nhận được (kèm biểu tượng lửa) | display field | — | 0 | Always | — | API field | số nguyên đã nhân hệ số | 0 | TBD (draft) |
| E04 | Nhãn x2 | display field | — | Ẩn | Conditional | — | API field | "x2" | hidden | TBD (draft) |
| E05 | Số Secret Box bạn đã mở | display field | — | 0 | Always | — | API field | số nguyên | 0 | TBD (draft) |
| E06 | Số Secret Box chưa mở | display field | — | 0 | Always | — | API field | số nguyên | 0 | TBD (draft) |
| E07 | Mở Secret Box | button | — | Enabled | Always | Mở màn mở hộp | — | — | — | N/A |
| E08 | Chú thích nút bị mờ | message | — | Ẩn | Conditional | — | static | — | — | N/A |
| E09 | 10 SUNNER NHẬN QUÀ MỚI NHẤT (tiêu đề vùng) | region label | — | — | Always | — | static | — | — | N/A |
| E10 | Danh sách người nhận quà | list | — | — | Always | Cuộn xem | API field | mới nhất trước, tối đa 10 dòng | thông báo trống | TBD (draft) |
| E11 | Avatar người nhận | image | — | Avatar mặc định | Always | — | API field | tròn, thu nhỏ | avatar mặc định | TBD (draft) |
| E12 | Tên người nhận (màu vàng) | display field | — | — | Always | — | API field | raw | dash | TBD (draft) |
| E13 | Nội dung "Nhận được {tên quà}" | display field | — | — | Always | — | API field | raw | dash | TBD (draft) |
| E14 | Thông báo trống / lỗi (kèm thử lại) | message | — | Ẩn | Conditional | Thử lại | static | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở Secret Box | E07 | bấm | Còn ít nhất một hộp chưa mở | Mở màn mở hộp (SCR018_SecretBoxOpen) phủ lên trang | TBD (draft) |
| Cuộn danh sách nhận quà | E10 | cuộn | Có hơn số dòng vừa khung | Các dòng trượt theo | TBD (draft) |
| Thử lại | E14 | bấm | Đang ở trạng thái lỗi | Nạp lại vùng lỗi | TBD (draft) |

### Happy Path

1. Sunner mở Live board và thấy bảng thống kê (R1) với năm số cùng nút "Mở Secret Box".
2. Sunner thấy số "Secret Box chưa mở" lớn hơn 0 và nút vàng bấm được.
3. Sunner cuộn danh sách R2 để xem ai vừa nhận quà.
4. Sunner bấm "Mở Secret Box" (E07) và màn mở hộp hiện lên.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 2 | Số hộp chưa mở bằng 0 | E07 bị mờ, hiện E08 chú thích chưa có hộp | TBD (draft) |
| Bước 3 | Chưa ai nhận quà | R2 hiện thông báo "Chưa có Sunner nào nhận quà." | TBD (draft) |
| Bước 2 | Chiến dịch x2 đang chạy | E04 "x2" hiện cạnh số tim | TBD (draft) |

### Interaction Notes

- **Đóng màn mở hộp xong thì số hộp đã mở / chưa mở ở R1 cập nhật theo số vừa mở** — source: TBD (draft)
- **Danh sách R2 làm mới khi tải lại trang, không cập nhật tức thời cho người xem khác** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang nạp thống kê hoặc danh sách | Khung chờ (skeleton) ở từng khối | none | TBD (draft) |
| empty | Chưa ai nhận quà | Thông báo "Chưa có Sunner nào nhận quà." ở R2; R1 vẫn hiện số 0 | none | TBD (draft) |
| error | Nạp thất bại | Thông báo "Không tải được thống kê. Vui lòng thử lại." hoặc "Không tải được danh sách nhận quà." chỉ ở khối lỗi | Thử lại | TBD (draft) |
| saving | Bấm Mở Secret Box | Chuyển ngay sang màn mở hộp, không có chờ riêng ở cột | none | TBD (draft) |
| success | Mở hộp xong và quay lại | Số hộp đã mở / chưa mở cập nhật | none | TBD (draft) |
| no-box | Số hộp chưa mở bằng 0 | Nút "Mở Secret Box" mờ kèm chú thích | none | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E07 | Chỉ bấm được khi còn hộp chưa mở | "Bạn chưa có Secret Box nào" | change |
| E10 | Danh sách phải nạp được | "Không tải được danh sách nhận quà. Vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Nhãn x2 hiện khi chiến dịch "Ngày x2 tim" đang chạy | configuration | E04 | Chiến dịch đang hiệu lực | Không có chiến dịch | Cờ do hệ thống tim (F005) báo, FE không tự suy |
| Nút mở hộp chỉ bấm được khi còn hộp chưa mở | hardcoded-id | E07, E08 | Có hộp chưa mở (E07 bấm được) | Không còn hộp (E07 mờ, hiện E08) | — |
| Thông báo trống/lỗi chỉ hiện khi không có dữ liệu hoặc nạp lỗi | hardcoded-id | E14 | Không có dòng nào hoặc nạp lỗi | Có dữ liệu | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR008_KudosLiveBoardFeed (F004) | Tải trang Live board | Đã đăng nhập | TBD (draft) |
| Profile của chính mình (F012, TBD (draft)) | Tải trang (chỉ khối R1) | Đã đăng nhập | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở Secret Box | E07 | Còn hộp chưa mở | SCR018_SecretBoxOpen | modal | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Mỗi số liệu có nhãn đọc được kèm giá trị; nhãn x2 có mô tả "tim được nhân đôi" |
| Keyboard navigation | [EXPECTED] | Nút Mở Secret Box và danh sách cuộn dùng được bằng bàn phím |
| Focus management | [EXPECTED] | Đóng màn mở hộp thì tiêu điểm trở về nút Mở Secret Box |
| Screen reader compatibility | [EXPECTED] | Danh sách là danh sách có ngữ nghĩa, mỗi dòng đọc "Tên, nhận được tên quà" |
| Error announcement | [EXPECTED] | Thông báo lỗi và trống được đọc tự động |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.

[NEEDS_DOMAIN_CONFIRMATION] Vị trí cột phải ở tablet/mobile (xếp dưới feed hay ẩn) chưa chốt; cùng câu hỏi bố cục tablet của Live board do F004 nắm; cần đối chiếu Figma khi triển khai.
