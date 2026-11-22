---
status: draft
authored_by: takumi
fcode: F007
created: 2026-11-08
lang: vi
---

# SCR014_AdminReviewContent — Screen Spec

**Screen**: SCR014_AdminReviewContent: Admin Review content
**Feature**: F007_AdminModeration
**Type**: composite
**Route**: `/admin/review` (`app/admin/review/page.tsx`; bộ lọc, sắp xếp và trang nằm trên URL: `page`, `sort`, `status`, `sender`, `receiver`, `from`, `to`, `q`)
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
| E05 | Sender | select | no | "Chọn người gửi" (vi) / "Chọn Sender" (en), nghĩa là tất cả | Always | Chọn người gửi, có ô tìm người (combobox Sunner dùng chung, gồm cả chính mình) | API field | tên | placeholder text | TBD (draft) |
| E06 | Receiver | select | no | "Chọn người nhận" (vi) / "Chọn Receiver" (en), nghĩa là tất cả | Always | Chọn người nhận, có ô tìm người | API field | tên | placeholder text | TBD (draft) |
| E07 | Status | select | no | "Chọn trạng thái" (vi) / "Chọn Status" (en), nghĩa là tất cả | Always | Chọn Tất cả / Public / Spam | static | — | placeholder text | TBD (draft) |
| E08 | Search by content | text input | no | Trống | Always | Nhập từ khoá tìm trong nội dung | store state | raw | placeholder text | TBD (draft) |
| E09 | ID (cột) | table | — | — | Always | — | computed | 8 ký tự đầu của uuid | dash | TBD (draft) |
| E10 | Sender (cột) | table | — | — | Always | — | API field | tên người gửi thật; Kudo ẩn danh kèm nhãn "Ẩn danh" (rê chuột hiện biệt danh) | dash | TBD (draft) |
| E11 | Receiver (cột) | table | — | — | Always | — | API field | tên | dash | TBD (draft) |
| E12 | Content (cột) | table | — | — | Always | — | API field | tiêu đề in đậm + lời nhắn dạng chữ thường, cắt 4 dòng | dash | TBD (draft) |
| E13 | Hashtag (cột) | table | — | — | Always | — | API field | danh sách hashtag, cắt gọn khi dài | dash | TBD (draft) |
| E14 | Heart (cột) | table | — | Sắp mới nhất trước khi chưa chọn | Always | Bấm đầu cột để sắp tăng/giảm | API field | số tim thô (không nhân x2), ngăn hàng nghìn theo ngôn ngữ (ví dụ 1.000.000) | dash | TBD (draft) |
| E15 | Status (cột) | table | — | — | Always | — | API field | huy hiệu Public (viền và chữ xanh `#3174C6`) / Spam (viền và chữ vàng) | dash | TBD (draft) |
| E16 | Mark Spam | button | — | Enabled | Conditional | Tạm ẩn Kudo | static | — | — | N/A |
| E17 | Un Spam | button | — | Enabled | Conditional | Trả Kudo về Public | static | — | — | N/A |
| E18 | Xác nhận thao tác | popover một mục | — | — | Conditional | Bấm nút ở cột Actions mở popover một mục ("Mark Spam" / "Un Spam"); bấm mục đó là xác nhận, Esc hoặc bấm ra ngoài là huỷ | static | — | — | N/A |
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
| Mark Spam | E16 | click | Dòng đang Public | Mở popover (E18); chọn mục trong popover thì dòng đổi sang Spam | `app/admin/review`, `markKudoSpam` |
| Un Spam | E17 | click | Dòng đang Spam | Mở popover (E18); chọn mục trong popover thì dòng đổi sang Public | `app/admin/review`, `unSpamKudo` |
| Export | E04 | click | — | Tải tệp CSV các Kudo đang lọc | TBD (draft) |

### Happy Path

1. Admin thấy bảng mọi Kudo mới nhất trước ở R3.
2. Admin chọn Status = Public ở E07 và gõ từ khoá ở E08 — R3 chỉ còn các dòng khớp.
3. Admin bấm "Mark Spam" ở một dòng trong R3 rồi chọn mục trong popover — huy hiệu dòng đổi sang Spam, nút đổi sang "Un Spam", thông báo "Đã đánh dấu Spam."
4. Admin bấm "Export" ở R1 — trình duyệt tải về tệp các Kudo đang lọc.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 3 | Admin khác vừa đổi đúng Kudo này | Dòng hiện trạng thái hiện tại; thông báo "Kudo đã được cập nhật bởi Admin khác." (không phải lỗi) | `KudoTransitionResult.changed = false` |
| Bước 3 | Lưu thất bại | Dòng giữ trạng thái cũ, hiện lỗi và cho thử lại; Kudo không còn trong DB thì "Kudo không còn tồn tại." | `KudoModerationResult` |
| Bước 4 | Số dòng quá trần Export (`EXPORT_MAX_ROWS`) | Không tải, hiện lỗi yêu cầu thu hẹp bộ lọc (server trả 422) | `GET /api/admin/kudos/export` |
| Bước 2 | Đang lọc Status = Public, vừa Mark Spam một dòng | Dòng đổi huy hiệu tại chỗ ngay, rồi rời khỏi kết quả khi bảng tải lại (action làm mới `/admin/review` sau khi ghi) | `ReviewContentScreen`, `markKudoSpam` |

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
| E08 | Ô nhập giới hạn 100 ký tự (`maxLength`), không hiện thông báo; server chấp nhận `q` tối đa 200 ký tự, quá thì 400 `invalid_params` | — | change |
| E16, E17 | Lưu thất bại | "Không cập nhật được trạng thái. Vui lòng thử lại." | server response |
| E04 | Số dòng vượt trần Export | "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Nút thao tác theo trạng thái dòng | hardcoded-id | E16, E17 | E16 khi dòng Public; E17 khi dòng Spam | ngược lại | Không phải flag cấu hình; suy ra từ trạng thái dòng |
| Xác nhận trước khi đổi trạng thái | hardcoded-id | E18 | Sau khi bấm E16 hoặc E17 | Khi chọn mục hoặc huỷ | D004 đã chốt: popover một mục là bước xác nhận, không hỏi lý do |
| Phân trang | responsive | E19 | Có hơn một trang kết quả | Chỉ có một trang | — |

## 8. Navigation

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| TBD (draft) — SCR002_AdminLayout | Bấm mục "Review content" trên menu Admin | Role Admin | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Chuyển mục Admin | Menu của khung Admin | — | TBD (draft) — SCR002_AdminLayout (các trang Admin khác) | redirect | TBD (draft) |
| Không đủ quyền | — | Guard từ chối | TBD (draft) — SCR004_Error403 | redirect | TBD (draft) |
| Tải tệp | E04 | — | (stays on screen) | tệp CSV được tải về | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Bảng có tiêu đề cột, cột Heart có `aria-sort`; huy hiệu trạng thái có chữ, không chỉ màu viền; nút ở cột Actions có `aria-haspopup="menu"` |
| Keyboard navigation | [EXPECTED] | Tab qua bộ lọc, đầu cột Heart, nút thao tác, phân trang theo thứ tự hiển thị |
| Focus management | [EXPECTED] | Popover xác nhận giữ focus bên trong; đóng thì trả focus về nút đã bấm |
| Screen reader compatibility | [EXPECTED] | Có landmark cho bộ lọc và bảng; đổi trạng thái được đọc lên |
| Error announcement | [EXPECTED] | Lỗi ngày, lỗi lưu, lỗi Export được đọc tự động |

## 10. Responsive Behavior

Bảng rộng tối thiểu 960px, cuộn ngang khi khung hẹp hơn. Chưa có kiểm thử e2e cho mobile và en-locale của màn này.
