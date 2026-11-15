---
status: draft
authored_by: takumi
fcode: F003
created: 2026-11-08
lang: vi
---

# SCR006_WriteKudoModal — Screen Spec

**Screen**: SCR006_WriteKudoModal (draft, chưa cấp SCR###): Modal Viết / Sửa Kudo
**Feature**: F003_KudosAuthoring
**Type**: composite
**Route**: TBD (draft) — modal mở đè lên Live board, route của Live board do F004 sở hữu
**Generated**: 2026-11-08

## 1. Overview

**Purpose:** Sunner dùng modal này để viết Kudo gửi đồng nghiệp, hoặc sửa lại Kudo mình đã đăng; gặp khi bấm ô "gửi lời cảm ơn" trên Live board hoặc nút sửa trên thẻ Kudo của mình.
**Actors:** Sunner, Chủ bài
**Entry Conditions:** Đã đăng nhập; ở chế độ sửa thì Kudo phải là của chính người dùng.
**Exit Conditions:** Gửi hoặc lưu thành công thì modal đóng; hoặc người dùng đóng modal / bấm Hủy.

## 2. Screen Layout

### Layout Sketch

Modal nằm giữa màn hình, phủ lớp nền mờ lên Live board (khung Figma "Viết Kudo", "Gửi lời chúc Kudos", "Sửa bài viết"). Thứ tự vùng dưới đây suy từ danh sách trường trong báo cáo phân tích, **[UNVERIFIED]** — chưa đối chiếu từng khung Figma. Dropdown người nhận, dropdown hashtag và hộp Add link mở thành lớp nổi phía trên modal.

```
┌──────────────────────────────────────────────┐
│ R1: Tiêu đề modal (Viết Kudo / Sửa bài viết) │
├──────────────────────────────────────────────┤
│ R2: Người nhận + Danh hiệu                   │
│ R3: Lời nhắn (soạn, nhắc "@", chèn link)     │
│ R4: Hashtag                                  │
│ R5: Ảnh đính kèm                             │
│ R6: Tuỳ chọn gửi ẩn danh                     │
├──────────────────────────────────────────────┤
│ R7: Thông báo lỗi + nút Hủy / Gửi (Lưu)      │
└──────────────────────────────────────────────┘
  - - - lớp nổi: dropdown người nhận, dropdown hashtag, hộp Add link - - -
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Tiêu đề modal | static | no | TBD (draft) |
| R2 | Người nhận + Danh hiệu | static | no | TBD (draft) |
| R3 | Lời nhắn | static | no | TBD (draft) |
| R4 | Hashtag | static | no | TBD (draft) |
| R5 | Ảnh đính kèm | static | no | TBD (draft) |
| R6 | Tuỳ chọn ẩn danh | static | no | TBD (draft) |
| R7 | Thanh hành động | static | no | TBD (draft) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Người nhận | select | yes | Trống (chế độ sửa: người nhận hiện tại) | Always | Mở dropdown tìm Sunner theo tên | TBD (draft) | tên + avatar + phòng ban | placeholder TBD (draft) | TBD (draft) |
| E02 | Danh hiệu | text input | no | Trống (sửa: danh hiệu hiện tại) | Always | — | TBD (draft) | raw | placeholder TBD (draft) | TBD (draft) |
| E03 | Lời nhắn | textarea | yes | Trống (sửa: nội dung hiện tại) | Always | Gõ "@" mở danh sách nhắc tên | TBD (draft) | văn bản, tối đa 1.000 ký tự | placeholder TBD (draft) | TBD (draft) |
| E04 | Chèn link | button | — | Enabled | Always | Mở hộp Add link | — | — | — | N/A |
| E05 | Hộp Add link | text input | — | Trống | Conditional | Xác nhận để chèn link vào lời nhắn | — | URL | — | TBD (draft) |
| E06 | Hashtag | select | yes | Chưa chọn (sửa: hashtag hiện tại) | Always | Mở dropdown hashtag, chọn từ danh sách | TBD (draft) | nhãn hashtag | placeholder TBD (draft) | TBD (draft) |
| E07 | Thêm ảnh | button | — | Enabled | Always | Chọn ảnh từ máy; vô hiệu khi đủ 5 ảnh | — | — | — | N/A |
| E08 | Ảnh đính kèm | list | no | Rỗng (sửa: ảnh hiện tại) | Always | Gỡ từng ảnh | TBD (draft) | thumbnail | hidden | TBD (draft) |
| E09 | Gửi ẩn danh | checkbox | no | Bỏ chọn (sửa: giá trị hiện tại — TBD (draft)) | Always | Bật/tắt gửi ẩn danh | — | — | — | TBD (draft) |
| E10 | Thông báo lỗi | message | — | Ẩn | Conditional | — | static | văn bản | hidden | N/A |
| E11 | Hủy | button | — | Enabled | Always | Đóng modal | — | — | — | N/A |
| E12 | Gửi / Lưu | button | — | Enabled | Always | Gửi Kudo mới (chế độ tạo) hoặc lưu bản sửa (chế độ sửa) | — | — | — | N/A |

## 4. User Actions

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn người nhận | E01 | click, gõ tên | — | Dropdown lọc theo tên; chọn xong hiện người nhận đã chọn | TBD (draft) |
| Nhắc tên | E03 | gõ "@" | — | Hiện danh sách Sunner; chọn xong chèn tên vào lời nhắn | TBD (draft) |
| Chèn link | E04, E05 | click rồi xác nhận | — | Link xuất hiện trong lời nhắn | TBD (draft) |
| Chọn hashtag | E06 | click | — | Hashtag đã chọn hiện trên ô | TBD (draft) |
| Thêm ảnh | E07 | click | Chưa đủ 5 ảnh | Thumbnail hiện trong danh sách | TBD (draft) |
| Gỡ ảnh | E08 | click nút gỡ trên thumbnail | — | Ảnh biến mất khỏi danh sách | TBD (draft) |
| Bật ẩn danh | E09 | click | — | Ô được chọn | TBD (draft) |
| Gửi / Lưu | E12 | click | — | Kiểm tra trường; hợp lệ thì chuyển sang trạng thái đang gửi | TBD (draft) |
| Hủy | E11 | click | — | Đóng modal, bỏ nội dung đang soạn | TBD (draft) |

### Happy Path

1. Người dùng mở modal; ở chế độ sửa, các trường đã điền sẵn nội dung hiện tại.
2. Người dùng chọn người nhận (E01) và hashtag (E06), viết lời nhắn (E03).
3. Người dùng tuỳ chọn thêm danh hiệu (E02), ảnh (E07), link (E04), bật ẩn danh (E09).
4. Người dùng bấm Gửi / Lưu (E12); nút chuyển sang trạng thái đang gửi.
5. Gửi thành công: modal đóng và người dùng thấy xác nhận.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 4 | Thiếu người nhận, lời nhắn hoặc hashtag | Hiện thông báo lỗi E10, modal giữ nguyên | TBD (draft) |
| Bước 4 | Máy chủ trả lỗi | Hiện thông báo lỗi chung, giữ nguyên nội dung đã nhập | TBD (draft) |
| Bước 3 | Đã đủ 5 ảnh | E07 vô hiệu, không thêm được ảnh | TBD (draft) |
| Hủy khi đã nhập dở | Có nội dung chưa gửi | Có xác nhận trước khi đóng hay không — TBD (draft) | TBD (draft) |

### Interaction Notes

- **Bấm Gửi hai lần liên tiếp chỉ gửi một lần vì nút bị khoá khi đang gửi** — source: TBD (draft)
- **Đóng dropdown khi bấm ra ngoài** — source: TBD (draft)

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở chế độ sửa, đang nạp nội dung Kudo | Skeleton hoặc spinner trong thân modal | Hủy | TBD (draft) |
| loading | Đang tìm Sunner / nạp hashtag | Spinner trong dropdown | Tiếp tục gõ | TBD (draft) |
| empty | Tìm Sunner không có kết quả | Dòng "không tìm thấy" trong dropdown (câu chữ TBD (draft)) | Gõ lại | TBD (draft) |
| error | Thiếu trường bắt buộc | Thông báo lỗi E10 | Điền bổ sung | TBD (draft) |
| error | Lỗi mạng hoặc máy chủ khi gửi / nạp | Thông báo lỗi chung, giữ nội dung | Thử lại | TBD (draft) |
| error | Tải ảnh lên thất bại | Báo lỗi trên thumbnail của ảnh đó | Gỡ hoặc thử lại | TBD (draft) |
| saving | Đang gửi hoặc đang lưu | Nút Gửi / Lưu khoá kèm chỉ báo đang xử lý | none | TBD (draft) |
| success | Gửi hoặc lưu xong | Modal đóng, hiện xác nhận | Đóng xác nhận | TBD (draft) |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E01 | Bắt buộc, đúng một người | "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!" | submit |
| E03 | Bắt buộc, tối đa 1.000 ký tự | "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!" (khi trống); câu khi vượt giới hạn TBD (draft) | submit |
| E06 | Bắt buộc, ít nhất một hashtag | "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!" | submit |
| E07 | Tối đa 5 ảnh, đúng định dạng và dung lượng | Câu báo lỗi ảnh — TBD (draft) | change |
| E05 | Phải là địa chỉ web hợp lệ | Câu báo lỗi link — TBD (draft) | submit |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Modal ở chế độ sửa | hardcoded-id | E01, E02, E03, E06, E08, E12 | Mở từ nút sửa của chủ bài: tiêu đề "Sửa bài viết", điền sẵn nội dung, nút là Lưu | Mở từ ô trên Live board: tiêu đề viết mới, trường trống, nút là Gửi | Trường nào khoá khi sửa (ví dụ người nhận) — [NEEDS_DOMAIN_CONFIRMATION] |
| Hộp Add link đang mở | responsive | E05 | Sau khi bấm Chèn link | Sau khi xác nhận hoặc đóng | Lớp nổi trên modal |
| Đã có thông báo lỗi | hardcoded-id | E10 | Sau khi bấm Gửi / Lưu mà thiếu trường hoặc lỗi | Khi người dùng sửa lại trường hoặc gửi lại | — |

## 8. Navigation

> `## 8. Navigation` is the per-screen projection of `screen-flow.md § Screen Access Paths`; every row here is derivable from (or becomes) a `screen-flow.md` path. Chưa có `screen-flow.md` ở bản nháp, nên mọi đích đến dưới đây là `TBD (draft)`.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| Live board (F004) — ô "gửi lời cảm ơn" | Bấm ô "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" | Đã đăng nhập | TBD (draft) |
| Live board / feed (F004) — thẻ Kudo | Bấm nút sửa trên thẻ | Là chủ bài | TBD (draft) |
| Lối vào khác (nút nổi, profile người khác) | TBD (draft) | Chưa chốt | TBD (draft) |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Gửi / Lưu thành công | E12 | Dữ liệu hợp lệ | (stays on screen) → quay về Live board (TBD (draft)) | modal đóng kèm xác nhận | TBD (draft) |
| Hủy | E11 | — | Live board (TBD (draft)) | modal đóng | TBD (draft) |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | [EXPECTED] | Modal có vai trò hộp thoại, mỗi trường có nhãn liên kết |
| Keyboard navigation | [EXPECTED] | Thao tác được hết bằng bàn phím: Tab, Esc đóng, chọn dropdown bằng phím mũi tên |
| Focus management | [EXPECTED] | Giữ focus trong modal khi mở; trả focus về nút gọi khi đóng |
| Screen reader compatibility | [EXPECTED] | Nhãn gắn với trường; dropdown đọc được số kết quả |
| Error announcement | [EXPECTED] | Thông báo lỗi được đọc ngay khi xuất hiện |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop | Toàn modal | Hộp thoại giữa màn hình, nền mờ — [UNVERIFIED] chưa đối chiếu khung Figma | TBD (draft) |
| mobile | Toàn modal | TBD (draft) — chưa đọc khung mobile "Viết Kudo" | TBD (draft) |
| tablet | Toàn modal | TBD (draft) — trang Tablet của Figma đang trống | TBD (draft) |
