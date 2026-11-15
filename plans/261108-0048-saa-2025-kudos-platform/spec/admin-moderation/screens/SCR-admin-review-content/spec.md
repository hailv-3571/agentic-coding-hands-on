---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# SCR-admin-review-content — Screen Spec

**Screen**: SCR-admin-review-content: Admin Review content
**Feature**: F007_AdminModeration
**Type**: composite
**Route**: TBD (draft) — trang "Review content" dưới khu Admin
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Admin rà soát mọi Kudo trong một bảng, lọc và tìm bài nghi vấn, tạm ẩn (Mark Spam) hoặc trả lại (Un Spam) từng bài và xuất danh sách đang lọc.
**Actors:** Admin
**Entry Conditions:** Đã đăng nhập, có role Admin và chọn mục "Review content" trên menu Admin.
**Exit Conditions:** Admin chuyển sang mục Admin khác hoặc quay về khu Sunner; hoặc đã tải xong tệp Export.

## 2. Screen Layout

### Layout Sketch

Trang nằm trong khung Admin của F002 (thanh trên có logo "Sun* Annual Awards 2025 | ADMIN", menu, chuông, ngôn ngữ, avatar, và chân trang bản quyền — không thuộc màn này). Nền xám, bảng tối. Từ trên xuống: tiêu đề cùng khoảng ngày và nút Export màu vàng; hàng bộ lọc; bảng Kudo; phân trang.

```
┌────────────────────────────────────────────────────────────┐
│ (Khung Admin F002: thanh trên + chân trang)                │
├────────────────────────────────────────────────────────────┤
│ R1: Review content        [Start date → End date] [Export] │
├────────────────────────────────────────────────────────────┤
│ R2: [Sender ▾] [Receiver ▾] [Status ▾] [Search by content] │
├────────────────────────────────────────────────────────────┤
│ R3: ID|Sender|Receiver|Content|Hashtag|Heart↕|Status|Actions│
│     ...mỗi dòng một Kudo...                                │
├────────────────────────────────────────────────────────────┤
│ R4:                         < 1 2 3 4 5 >                  │
└────────────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Header (tiêu đề, khoảng ngày, Export) | static | no | TBD (draft) |
| R2 | Filter Bar | static | no | TBD (draft) |
| R3 | Kudo Table | static | yes | TBD (draft) |
| R4 | Pagination | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Review content | region label | — | — | Always | — | static | — | — | N/A |
| E02 | Start date | date input | no | Trống | Always | Chọn ngày bắt đầu (mở lịch) | store state | ngày | placeholder text "Start date" | TBD (draft) |
| E03 | End date | date input | no | Trống | Always | Chọn ngày kết thúc (mở lịch) | store state | ngày | placeholder text "End date" | TBD (draft) |
| E04 | Export | button | — | Enabled | Always | Tải tệp CSV các Kudo đang lọc | static | — | — | N/A |
| E05 | Sender | select | no | "Chọn Sender" (tất cả) | Always | Chọn người gửi, có ô tìm người | API field | tên | placeholder text | TBD (draft) |
| E06 | Receiver | select | no | "Chọn Receiver" (tất cả) | Always | Chọn người nhận, có ô tìm người | API field | tên | placeholder text | TBD (draft) |
| E07 | Status | select | no | "Chọn Status" (tất cả) | Always | Chọn Public / Spam / tất cả | static | — | placeholder text | TBD (draft) |
| E08 | Search by content | text input | no | Trống | Always | Nhập từ khoá tìm trong nội dung | store state | raw | placeholder text | TBD (draft) |
| E09 | ID (cột) | table | — | — | Always | — | computed | mã rút gọn | dash | TBD (draft) |
| E10 | Sender (cột) | table | — | — | Always | — | API field | tên | dash | TBD (draft) |
| E11 | Receiver (cột) | table | — | — | Always | — | API field | tên | dash | TBD (draft) |
| E12 | Content (cột) | table | — | — | Always | — | API field | tiêu đề in đậm + lời nhắn, cắt gọn `[INFERRED]` | dash | TBD (draft) |
| E13 | Hashtag (cột) | table | — | — | Always | — | API field | danh sách hashtag, cắt gọn khi dài | dash | TBD (draft) |
| E14 | Heart (cột) | table | — | Sắp mới nhất trước khi chưa chọn | Always | Bấm đầu cột để sắp tăng/giảm | API field | số nguyên, ngăn hàng nghìn theo ngôn ngữ (ví dụ 1.000.000) | dash | TBD (draft) |
| E15 | Status (cột) | table | — | — | Always | — | API field | huy hiệu Public (viền xanh) / Spam (viền vàng) | dash | TBD (draft) |
| E16 | Mark Spam | button | — | Enabled | Conditional | Tạm ẩn Kudo | static | — | — | N/A |
| E17 | Un Spam | button | — | Enabled | Conditional | Trả Kudo về Public | static | — | — | N/A |
| E18 | Xác nhận thao tác | message | — | — | Conditional | Xác nhận hoặc huỷ Mark Spam / Un Spam | static | — | — | N/A |
| E19 | Pagination | list | — | Trang 1 | Always | Chuyển trang (< 1 2 3 4 5 >) | computed | số trang | hidden khi chỉ có một trang | N/A |

Cột Actions chứa E16 hoặc E17 theo trạng thái dòng. Ghi chú: nhãn cột người nhận trên thiết kế viết "Recreiver"; spec dùng "Receiver" (D013 ở functional-spec).

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn khoảng ngày | E02, E03 | click, chọn ngày | — | Bảng lọc lại, về trang 1 | TBD (draft) |
| Chọn người gửi / người nhận | E05, E06 | click, gõ tìm, chọn | — | Bảng lọc lại, về trang 1 | TBD (draft) |
| Chọn trạng thái | E07 | click, chọn | — | Bảng lọc lại, về trang 1 | TBD (draft) |
| Tìm theo nội dung | E08 | gõ rồi dừng gõ / Enter | — | Bảng lọc lại, về trang 1 | TBD (draft) |
| Sắp theo tim | E14 | click đầu cột | — | Đảo thứ tự tăng/giảm, về trang 1 | TBD (draft) |
| Đổi trang | E19 | click | Có nhiều hơn một trang | Bảng hiện trang chọn | TBD (draft) |
| Mark Spam | E16 | click | Dòng đang Public | Mở xác nhận (E18), xác nhận xong dòng đổi sang Spam | TBD (draft) |
| Un Spam | E17 | click | Dòng đang Spam | Mở xác nhận (E18), xác nhận xong dòng đổi sang Public | TBD (draft) |
| Export | E04 | click | — | Tải tệp CSV các Kudo đang lọc | TBD (draft) |

### Happy Path

1. Admin thấy bảng mọi Kudo mới nhất trước ở R3.
2. Admin chọn Status = Public ở E07 và gõ từ khoá ở E08 — R3 chỉ còn các dòng khớp.
3. Admin bấm "Mark Spam" ở một dòng trong R3 và xác nhận — huy hiệu dòng đổi sang Spam, nút đổi sang "Un Spam".
4. Admin bấm "Export" ở R1 — trình duyệt tải về tệp các Kudo đang lọc.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 3 | Admin khác vừa đổi đúng Kudo này | Dòng hiện trạng thái hiện tại, không báo lỗi | TBD (draft) |
| Bước 3 | Lưu thất bại | Dòng giữ trạng thái cũ, hiện lỗi và cho thử lại | TBD (draft) |
| Bước 4 | Số dòng quá trần Export | Không tải, hiện lỗi yêu cầu thu hẹp bộ lọc | TBD (draft) |
| Bước 2 | Đang lọc Status = Public, vừa Mark Spam một dòng | Dòng rời khỏi kết quả ở lần tải kế | TBD (draft) |

### Interaction Notes

- **Đổi bất kỳ bộ lọc, tìm kiếm hay sắp xếp nào thì bảng về trang 1** — source: TBD (draft)
- **Nút thao tác của dòng bị khoá trong lúc đang lưu để không bấm đúp** — source: TBD (draft)
- **Nút Export bị khoá kèm trạng thái chờ trong lúc chuẩn bị tệp** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đang tải trang bảng | Các dòng khung chờ trong R3, bộ lọc vẫn thao tác được | đổi bộ lọc | TBD (draft) |
| empty | Không có Kudo khớp | Thông báo "Không có Kudo nào phù hợp bộ lọc." thay các dòng | xoá bộ lọc | TBD (draft) |
| error | Tải bảng thất bại | Thông báo lỗi kèm nút thử lại ở R3 | thử lại | TBD (draft) |
| saving | Đang Mark Spam / Un Spam | Nút của dòng khoá, hiện vòng chờ | none | TBD (draft) |
| success | Mark Spam / Un Spam xong | Huy hiệu và nút của dòng đổi tại chỗ; thông báo ngắn | dùng tiếp | TBD (draft) |
| exporting | Đang chuẩn bị tệp | E04 khoá, hiện vòng chờ | none | TBD (draft) |
| export-error | Quá trần hoặc lỗi tải tệp | Thông báo "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." hoặc lỗi chung | thu hẹp bộ lọc, thử lại | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E02, E03 | Ngày bắt đầu không sau ngày kết thúc | "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" | change |
| E08 | Tối đa 100 ký tự | "Từ khoá tối đa 100 ký tự" | change |
| E16, E17 | Lưu thất bại | "Không cập nhật được trạng thái. Vui lòng thử lại." | server response |
| E04 | Số dòng vượt trần Export | "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Nút thao tác theo trạng thái dòng | hardcoded-id | E16, E17 | E16 khi dòng Public; E17 khi dòng Spam | ngược lại | Không phải flag cấu hình; suy ra từ trạng thái dòng |
| Xác nhận trước khi đổi trạng thái | configuration | E18 | Sau khi bấm E16 hoặc E17 | Khi xác nhận hoặc huỷ | [NEEDS_DOMAIN_CONFIRMATION] D004: có bước xác nhận hay đổi ngay |
| Phân trang | responsive | E19 | Có hơn một trang kết quả | Chỉ có một trang | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR-admin-layout | Bấm mục "Review content" trên menu Admin | Role Admin | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Chuyển mục Admin | Menu của khung Admin | — | TBD (draft) — SCR-admin-layout (các trang Admin khác) | redirect | TBD (draft) |
| Không đủ quyền | — | Guard từ chối | TBD (draft) — SCR-error-403 | redirect | TBD (draft) |
| Tải tệp | E04 | — | (stays on screen) | tệp CSV được tải về | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Bảng có tiêu đề cột, cột Heart báo hướng sắp xếp; huy hiệu trạng thái có chữ, không chỉ màu viền |
| Keyboard navigation | [EXPECTED] | Tab qua bộ lọc, đầu cột Heart, nút thao tác, phân trang theo thứ tự hiển thị |
| Focus management | [EXPECTED] | Popover xác nhận giữ focus bên trong; đóng thì trả focus về nút đã bấm |
| Screen reader compatibility | [EXPECTED] | Có landmark cho bộ lọc và bảng; đổi trạng thái được đọc lên |
| Error announcement | [EXPECTED] | Lỗi ngày, lỗi lưu, lỗi Export được đọc tự động |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
