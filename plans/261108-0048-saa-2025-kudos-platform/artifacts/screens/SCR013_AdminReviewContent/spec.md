---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR013_AdminReviewContent — Screen Spec

**Screen**: SCR013_AdminReviewContent: AdminReviewContent
**Feature**: F007_AdminModeration
**Type**: atomic
**Route**: /admin/review
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Admin rà soát toàn bộ Kudo (cả public lẫn spam) trong một bảng, lọc theo người gửi, người nhận, trạng thái, khoảng ngày và nội dung, tạm ẩn hoặc trả lại từng Kudo (Mark Spam / Un Spam) và xuất CSV theo bộ lọc đang chọn.
**Actors:** Admin
**Entry Conditions:** Đã đăng nhập với vai trò admin; guest bị chuyển về đăng nhập, người không phải admin nhận trang 403.
**Exit Conditions:** Admin rời trang qua thanh điều hướng khu admin (do khung SCR002_AdminLayout cung cấp); trong trang, việc "xong" là bảng đã được lọc hoặc kiểm duyệt xong hoặc tệp CSV đã tải.

## 2. Screen Layout

### Layout Sketch

Nội dung nằm trong cột giữa của khung admin (thanh trên cùng và footer rút gọn do SCR002_AdminLayout cung cấp). Từ trên xuống: hàng tiêu đề "Review content" cùng bộ chọn khoảng ngày và nút Export, thanh lọc (người gửi, người nhận, trạng thái, ô tìm nội dung), dòng báo lỗi lọc nếu có, bảng Kudo cuộn ngang khi hẹp, rồi phân trang; toast cố định ở đáy màn hình. (`features/admin-moderation/components/review-content-screen.tsx:61-103`, `app/admin/layout.tsx:15`)

```
┌─────────────────────────────────────────────────────┐
│ (admin top bar SCR002_AdminLayout)                  │
├─────────────────────────────────────────────────────┤
│ R1: Header Row (static)                             │
│  Review content            [ngày → ngày] [Export]   │
├─────────────────────────────────────────────────────┤
│ R2: Filter Bar (static)                             │
│  [Người gửi][Người nhận][Trạng thái]   [Tìm kiếm]   │
│  (dòng báo lỗi lọc, chỉ khi tham số sai)            │
├─────────────────────────────────────────────────────┤
│ R3: Kudo Table (scroll ngang)                       │
│  ID|Gửi|Nhận|Nội dung|Hashtag|Tim▲▼|Trạng thái|Thao tác │
├─────────────────────────────────────────────────────┤
│ R4: Pagination (static, ẩn khi 1 trang)             │
└─────────────────────────────────────────────────────┘
        ┌─ R5: Toast (fixed-bottom, tạm thời) ─┐
        └──────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Header Row | static | no | ReviewContentScreen, ReviewDateRangeFilter, ReviewExportButton |
| R2 | Filter Bar | static | no | ReviewFilters, ReviewPersonFilter, ReviewStatusFilter, ReviewSearchInput |
| R3 | Kudo Table | static | yes | ReviewTable, ReviewTableRow, ReviewModerationButton, AdminLoadErrorPanel |
| R4 | Pagination | static | no | ReviewPagination |
| R5 | Toast | fixed-bottom | no | CampaignSettingsToast |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Review content (`<h1>`) | region label | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Ngày bắt đầu | date input | no | Empty | Always | Lọc theo ngày gửi từ ngày này | — | `yyyy-MM-dd` | placeholder "Ngày bắt đầu" | binding: `view.from` |
| E03 | Ngày kết thúc | date input | no | Empty | Always | Lọc theo ngày gửi tới ngày này | — | `yyyy-MM-dd` | placeholder "Ngày kết thúc" | binding: `view.to` |
| E04 | Export | button | — | Enabled | Always | Tải CSV theo bộ lọc đang chọn | — | — | — | N/A |
| E05 | Người gửi | select | no | Empty ("Chọn người gửi") | Always | Lọc theo người gửi | — | tên người | placeholder | MODEL004_Profile.full_name (binding: `view.senderId`) |
| E06 | Người nhận | select | no | Empty ("Chọn người nhận") | Always | Lọc theo người nhận | — | tên người | placeholder | MODEL004_Profile.full_name (binding: `view.receiverId`) |
| E07 | Trạng thái | select | no | Empty ("Chọn trạng thái") | Always | Lọc theo Public / Spam / Tất cả | — | raw | placeholder | MODEL003_Kudo.status (binding: `view.status`) |
| E08 | Tìm theo nội dung | text input | no | Empty | Always | Lọc theo nội dung (sau 300 ms hoặc Enter) | — | raw, tối đa 100 ký tự | placeholder "Tìm theo nội dung" | binding: `view.query` |
| E09 | Thông báo lỗi bộ lọc | message | — | Hidden | Conditional | — | route param | raw | hidden | N/A |
| E10 | Tim (tiêu đề cột sắp xếp) | button | — | Enabled | Always | Đổi thứ tự sắp xếp theo tim | — | — | — | N/A |
| E11 | ID | display field | — | Visible | Always | — | API field | 8 ký tự đầu của mã Kudo | dash | MODEL003_Kudo.id (binding: `row.shortId`) |
| E12 | Người gửi (cột) kèm nhãn "Ẩn danh" | display field | — | Visible | Always | — | API field | tên thật người gửi; nhãn khi Kudo ẩn danh | dash | MODEL004_Profile.full_name (binding: `row.sender`) |
| E13 | Người nhận (cột) | display field | — | Visible | Always | — | API field | tên | dash | MODEL004_Profile.full_name (binding: `row.receiver`) |
| E14 | Nội dung (tiêu đề đậm + lời nhắn) | display field | — | Visible | Always | — | API field | chữ thuần, cắt 4 dòng, bỏ dấu Markdown | dash | MODEL003_Kudo.message (binding: `row.message`) |
| E15 | Hashtag | list | — | Visible | Always | — | API field | mỗi hashtag một dòng, cắt bằng dấu ba chấm | dash | MODEL005_KudoHashtag (binding: `row.hashtags`) |
| E16 | Tim (số lượt) | display field | — | Visible | Always | — | API field | số có dấu phân cách hàng nghìn theo ngôn ngữ | `0` | MODEL008_KudoHeart (binding: `row.heartCount`) |
| E17 | Trạng thái (nhãn Public / Spam) | display field | — | Visible | Always | — | API field | nhãn chữ | — | MODEL003_Kudo.status (binding: `row.status`) |
| E18 | Mark Spam / Un Spam | button | — | Enabled | Always | Mở hộp xác nhận một mục rồi đổi trạng thái Kudo | — | — | — | N/A |
| E19 | Không có Kudo nào phù hợp bộ lọc. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E20 | Xoá bộ lọc | button | — | Hidden | Conditional | Xoá mọi bộ lọc | — | — | — | N/A |
| E21 | Không tải được danh sách Kudo. Vui lòng thử lại. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E22 | Thử lại | button | — | Hidden | Conditional | Đọc lại bảng từ máy chủ | — | — | — | N/A |
| E23 | Phân trang (Trước, số trang, Sau) | list | — | Hidden | Conditional | Chuyển trang | — | tối đa 5 số quanh trang hiện tại | hidden | binding: `view.page` |
| E24 | Toast kết quả (Mark Spam, Un Spam, xuất CSV) | message | — | Hidden | Conditional | — | static | raw, tự tắt sau 5 giây | hidden | N/A |

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`. Mọi thay đổi bộ lọc, tìm kiếm, sắp xếp, trang đều thay URL tại chỗ (`router.replace`), nên vẫn là tương tác trong màn hình.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Lọc theo ngày gửi | E02, E03 | Đổi một ô ngày | Khoảng không bị ngược | Bảng lọc lại, về trang 1 | `features/admin-moderation/components/review-date-range-filter.tsx:64-69` |
| Xuất CSV | E04 | Bấm | Không đang xuất | Nút khoá kèm spinner, tải tệp; lỗi thì toast | `features/admin-moderation/components/review-export-button.tsx:40-53` |
| Lọc theo người gửi | E05 | Chọn một Sunner (gõ để tìm) | — | Bảng lọc lại, về trang 1; gõ lại sau khi chọn sẽ bỏ lọc | `features/admin-moderation/components/review-person-filter.tsx:35-39` |
| Lọc theo người nhận | E06 | Chọn một Sunner (gõ để tìm) | — | Như trên | `features/admin-moderation/components/review-person-filter.tsx:35-39` |
| Lọc theo trạng thái | E07 | Chọn Tất cả / Public / Spam | — | Bảng lọc lại, về trang 1 | `features/admin-moderation/components/review-status-filter.tsx:18-28` |
| Tìm theo nội dung | E08 | Gõ rồi dừng 300 ms, hoặc Enter | Chuỗi đã cắt khoảng trắng khác lần gửi trước | Bảng lọc lại, về trang 1 | `features/admin-moderation/components/review-search-input.tsx:33-39,57,59-63` |
| Đổi sắp xếp theo tim | E10 | Bấm tiêu đề cột Tim | — | Vòng: mới nhất → nhiều tim → ít tim → mới nhất | `features/admin-moderation/components/review-url-params.ts:48-57` |
| Mark Spam / Un Spam | E18 | Bấm nút, rồi chọn mục trong hộp xác nhận | Kudo đang public thì Mark Spam, đang spam thì Un Spam | Nút khoá kèm spinner tới khi có kết quả, nhãn trạng thái đổi ngay tại dòng, toast báo | `features/admin-moderation/components/review-moderation-button.tsx:40-60`, `features/admin-moderation/components/review-content-screen.tsx:48-56` |
| Xoá bộ lọc | E20 | Bấm | Có bộ lọc đang bật và bảng rỗng | Mọi bộ lọc về mặc định | `features/admin-moderation/components/review-table.tsx:94-98` |
| Thử lại | E22 | Bấm | Đang ở trạng thái lỗi đọc | Đọc lại trang, nút khoá khi đang đọc | `features/admin-moderation/components/admin-load-error-panel.tsx:18-25` |
| Chuyển trang | E23 | Bấm Trước / Sau / số trang | Không phải trang đang xem; Trước và Sau khoá ở hai đầu | URL đổi trang, bảng tải trang đó | `features/admin-moderation/components/review-pagination.tsx:23-50` |

### Happy Path

1. Admin mở `/admin/review`; R3 hiện trang 1 gồm 10 Kudo mới nhất, mỗi dòng có trạng thái Public hoặc Spam.
2. Admin chọn bộ lọc hoặc gõ từ khoá ở R1/R2; các ô điều khiển đổi ngay, các dòng mờ đi cho tới khi máy chủ trả bảng mới.
3. Admin bấm Mark Spam ở một dòng, chọn mục xác nhận; nhãn trạng thái dòng đổi sang Spam, toast "Đã đánh dấu Spam." hiện ở R5.
4. Admin bấm Export; trình duyệt tải tệp CSV của đúng bộ lọc đang chọn (mọi trang, không riêng trang hiện tại).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 (đọc bảng) | Tham số URL sai (UUID, ngày, trạng thái, sắp xếp, trang < 1, `q` quá 200 ký tự, tham số lặp) | Hiện bảng chưa lọc trang 1 kèm dòng báo lỗi lọc | `app/admin/review/page.tsx:42-43,54`, `features/admin-moderation/schemas/admin-kudo-filter-schema.ts:74-88` |
| Bước 1 (đọc bảng) | Đọc dữ liệu thất bại | Thay bảng bằng khối lỗi kèm nút Thử lại | `app/admin/review/page.tsx:19-26,55`, `features/admin-moderation/components/review-content-screen.tsx:83-85` |
| Bước 1 (đọc bảng) | Không có Kudo khớp bộ lọc | Một dòng "Không có Kudo nào phù hợp bộ lọc."; có thêm nút Xoá bộ lọc nếu đang lọc | `features/admin-moderation/components/review-table.tsx:89-101` |
| Bước 2 (ngày) | Ngày bắt đầu sau ngày kết thúc | Báo lỗi dưới ô ngày, bảng giữ nguyên, URL không đổi | `features/admin-moderation/components/review-date-range-filter.tsx:62,67,93-97` |
| Bước 2 (trang) | URL có `page` vượt trang cuối | Máy chủ cắt về trang cuối; bộ phân trang hiện đúng trang cuối | `features/admin-moderation/server/kudo-admin-query.ts:28-29`, `features/admin-moderation/components/review-content-screen.tsx:99` |
| Bước 3 (kiểm duyệt) | Kudo đã được Admin khác đổi trạng thái | Dòng hiện trạng thái hiện tại, toast "Kudo đã được cập nhật bởi Admin khác." | `features/admin-moderation/components/review-content-screen.tsx:54` |
| Bước 3 (kiểm duyệt) | Kudo không còn tồn tại hoặc lỗi bất ngờ | Toast lỗi, dòng không đổi | `features/admin-moderation/components/review-content-screen.tsx:49-52` |
| Bước 4 (xuất) | Quá nhiều dòng (HTTP 422) hoặc lỗi khác | Toast lỗi, không có tệp | `features/admin-moderation/components/review-export-button.tsx:45-46,48-49` |

### Interaction Notes

- **Reload hoặc chia sẻ link cho ra cùng kết quả vì toàn bộ trạng thái (lọc, tìm, sắp xếp, trang) nằm trong URL** — mặc định bị lược khỏi URL nên bảng gốc là `/admin/review` trần — source: `features/admin-moderation/components/review-url-params.ts:12-26`
- **Điều khiển đổi ngay còn các dòng mờ 60% cho tới khi máy chủ trả dữ liệu mới, bộ lọc vẫn dùng được** — `useOptimistic` trong transition — source: `features/admin-moderation/components/review-content-screen.tsx:31-46`, `features/admin-moderation/components/review-table.tsx:47-48`
- **Mọi thay đổi bộ lọc quay về trang 1, chỉ đổi trang mới giữ trang** — source: `features/admin-moderation/components/review-url-params.ts:43-46`
- **Bấm Mark Spam / Un Spam mở hộp một mục hướng sang trái; chọn mục là xác nhận, Esc, bấm ra ngoài hoặc Tab thì huỷ và trả focus về nút** — source: `features/admin-moderation/components/review-moderation-button.tsx:21-28,62-67`
- **Trong lúc đang kiểm duyệt nút bị khoá kèm spinner nên không gửi hai lần** — source: `features/admin-moderation/components/review-moderation-button.tsx:78-80`
- **Không gửi cùng một từ khoá hai lần liên tiếp và gõ tiếp thì huỷ hẹn giờ cũ** — source: `features/admin-moderation/components/review-search-input.tsx:36,56-57`
- **Bấm Xoá bộ lọc hoặc nút Back của trình duyệt làm các ô lọc nạp lại giá trị mới, còn chữ người dùng đang gõ không bị reset** — source: `features/admin-moderation/components/use-external-reset-key.ts:1-21`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở trang hoặc lần đầu đọc bảng | Skeleton: tiêu đề, ô lọc giả, thanh tiêu đề bảng và 5 dòng nhấp nháy | none | `app/admin/review/loading.tsx:4-9`, `features/admin-moderation/components/review-content-skeleton.tsx:9-28` |
| loading (đổi bộ lọc) | Đổi bộ lọc, tìm, sắp xếp, trang | Bảng mờ 60% và `aria-busy`; bộ lọc vẫn dùng được | Đổi tiếp bộ lọc | `features/admin-moderation/components/review-table.tsx:47-48` |
| empty | Không có Kudo khớp | Dòng thông báo trong bảng; nút Xoá bộ lọc nếu đang lọc | Xoá bộ lọc | `features/admin-moderation/components/review-table.tsx:89-101` |
| error (đọc bảng) | Đọc dữ liệu thất bại | Khối `role="alert"` với "Không tải được danh sách Kudo. Vui lòng thử lại." | Thử lại | `features/admin-moderation/components/admin-load-error-panel.tsx:16-26` |
| error (tham số lọc sai) | Tham số URL không hợp lệ | Dòng `role="alert"` đỏ phía trên bảng, bảng hiện chưa lọc | Đổi bộ lọc | `features/admin-moderation/components/review-content-screen.tsx:78-82` |
| saving | Đang Mark Spam / Un Spam | Nút kèm spinner, `aria-disabled` | none (trên dòng đó) | `features/admin-moderation/components/review-moderation-button.tsx:78-85` |
| exporting | Đang chuẩn bị CSV | Nút đổi chữ "Đang xuất…" kèm spinner, `aria-disabled` | none | `features/admin-moderation/components/review-export-button.tsx:56-59` |
| success | Kiểm duyệt xong | Nhãn dòng đổi tại chỗ; toast thành công tự tắt sau 5 giây | none | `features/admin-moderation/components/review-content-screen.tsx:53-55`, `features/admin-campaigns/components/campaign-settings-toast.tsx:20-25` |
| single page | Chỉ một trang | Bộ phân trang không hiện | none | `features/admin-moderation/components/review-pagination.tsx:15` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E02, E03 | Ngày bắt đầu phải trước hoặc bằng ngày kết thúc | Ngày bắt đầu phải trước hoặc bằng ngày kết thúc | change |
| E08 | Tối đa 100 ký tự | (không có thông báo; ô chặn gõ thêm) | change |
| E09 | Khoảng ngày trong URL không hợp lệ | Khoảng ngày không hợp lệ, đang hiện tất cả Kudo. | server response |
| E09 | Tham số lọc khác trong URL không hợp lệ | Bộ lọc không hợp lệ, đang hiện tất cả Kudo. | server response |
| E04 | Quá nhiều dòng để xuất | Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc. | server response |
| E04 | Xuất thất bại (lỗi khác hoặc mạng) | Không xuất được tệp. Vui lòng thử lại. | server response |
| E18 | Kudo không còn tồn tại | Kudo không còn tồn tại. | server response |
| E18 | Kiểm duyệt thất bại (lỗi bất ngờ, mã không hợp lệ) | Không cập nhật được trạng thái. Vui lòng thử lại. | server response |
| E18 | Kudo đã được Admin khác đổi sang đúng trạng thái đích | Kudo đã được cập nhật bởi Admin khác. | server response |
| E18 | Mark Spam thành công | Đã đánh dấu Spam. | server response |
| E18 | Un Spam thành công | Đã chuyển Kudo về Public. | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Chỉ admin xem được trang | auth | E01–E24 (cả trang) | Người dùng có vai trò admin | Guest (chuyển về đăng nhập), người không phải admin (trang 403) | Consequence if bypassed: redirect hoặc 403 trước khi sinh bất kỳ markup admin nào |
| Báo lỗi lọc khi tham số URL sai | configuration | E09 | URL chứa tham số không hợp lệ | URL hợp lệ | Chữ thông báo theo loại lỗi (ngày hoặc tham số khác) |
| Trạng thái rỗng và nút Xoá bộ lọc | configuration | E19, E20 | Bảng không có dòng; riêng E20 còn cần có bộ lọc đang bật | Có ít nhất một dòng; E20 ẩn khi không lọc | — |
| Trạng thái lỗi đọc | configuration | E21, E22 (thay E10–E19, E23) | Đọc dữ liệu thất bại | Đọc thành công | Khi lỗi, bảng và phân trang bị thay hoàn toàn bằng khối lỗi |
| Phân trang chỉ hiện khi có nhiều trang | configuration | E23 | Số trang > 1 | Chỉ một trang | — |
| Nhãn nút kiểm duyệt theo trạng thái dòng | configuration | E18 | Mark Spam khi dòng public; Un Spam khi dòng spam | — | Nhãn đổi tại chỗ ngay sau khi kiểm duyệt thành công |
| Toast chỉ khi có kết quả | configuration | E24 | Có thông báo mới (5 giây) | Hết giờ hoặc chưa có thông báo | — |
| Nhãn "Ẩn danh" khi Kudo gửi ẩn danh | configuration | E12 | Kudo được gửi ẩn danh | Kudo gửi công khai | Tên thật người gửi luôn hiện; biệt danh chỉ nằm trong chú giải (`title`) của nhãn |

## 8. Navigation

> **D3 — the DRY statement that MUST appear verbatim in the template and the contract:**
>
> `## 8. Navigation` is the **per-screen projection** of `screen-flow.md § Screen Access Paths`.
> It is not a second source of truth. Every row here MUST be derivable from a path in
> `screen-flow.md`; every path in `screen-flow.md` touching this SCR### MUST appear here.
> Two-way consistency is a reviewer rule (`screen.nav_flow_skew`), not a Python check.
> `## 4. User Actions § Happy Path` narrative keeps its v27 scope rule unchanged: **prose still
> must not narrate cross-screen navigation**; only the § Exits *table* may name destinations.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR002_AdminLayout | Bấm mục Review content | Admin | `features/app-shell/components/admin-top-bar.tsx:23`, `docs/generated/screen-flow.md:235` |

### Exits

N/A — this screen has no exits (terminal screen).

> Ghi chú: trang không có link rời riêng; điều hướng khu admin diễn ra qua thanh trên cùng của SCR002_AdminLayout (`docs/generated/screen-flow.md` mục SCR013_AdminReviewContent, Exit Points).

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Bảng có `<caption>` ẩn, `scope="col"`, `aria-sort` ở cột Tim, `aria-busy` khi tải; thanh lọc là `role="search"`; nút kiểm duyệt có `aria-haspopup`/`aria-expanded`/`aria-label` nêu hành động và mã Kudo; hộp xác nhận `role="menu"`; select trạng thái `role="listbox"`; ô người dùng `role="combobox"`; phân trang `aria-current` (`review-table.tsx:49,77`, `review-filters.tsx:35`, `review-moderation-button.tsx:73-77,90-91`, `admin-filter-select.tsx:103-122`) |
| Keyboard navigation | supported | Select trạng thái hỗ trợ Home/End/mũi tên lên xuống; hộp xác nhận kiểm duyệt đóng bằng Esc/Tab; Enter gửi ô tìm kiếm (`admin-filter-select.tsx:75-91`, `review-search-input.tsx:59-63`) |
| Focus management | managed | Mở hộp xác nhận thì focus vào mục, đóng thì trả focus về nút (`review-moderation-button.tsx:43-45,49,62-67`) |
| Screen reader compatibility | unknown | Có nhãn `label`/`sr-only` cho ô tìm và ô lọc; ô ngày dùng `aria-label`; chưa có kết quả kiểm thử trình đọc màn hình trong mã |
| Error announcement | supported | Lỗi lọc, lỗi ngày ngược và khối lỗi đọc dùng `role="alert"`; toast thành công là `role="status"`, toast lỗi `role="alert"` (`review-content-screen.tsx:79`, `review-date-range-filter.tsx:94`, `admin-load-error-panel.tsx:16`, `campaign-settings-toast.tsx:29-33`) |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (`<sm`) | R1 | Bộ chọn ngày và nút Export chiếm toàn bề ngang và xuống dòng | `features/admin-moderation/components/review-content-screen.tsx:62-64` |
| mobile (`<sm`) | E02, E03 | Khung ngày rộng đủ hàng, từ `sm` rộng 296 px | `features/admin-moderation/components/review-date-range-filter.tsx:72` |
| mobile (`<md`) | R2 | Ba bộ lọc xếp dọc dưới `sm`, hàng ngang từ `sm`; ô tìm nội dung xuống dòng dưới `md` | `features/admin-moderation/components/review-filters.tsx:35-36`, `features/admin-moderation/components/review-search-input.tsx:42` |
| mobile (`<sm`) | E05, E06, E07 | Rộng toàn hàng, từ `sm` cố định 259 px | `features/admin-moderation/components/review-person-filter.tsx:32`, `features/admin-moderation/components/review-status-filter.tsx:27` |
| mobile / tablet | R3 | Bảng có bề rộng tối thiểu 960 px và cuộn ngang trong khung | `features/admin-moderation/components/review-table.tsx:47-48` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireAdmin()` gọi đầu trang; guest → `/login`, non-admin → `forbidden()` | `app/admin/review/page.tsx:41`, `shared/auth/admin-guard.ts:30-35` |
| R1–R4 | handler | `parseAdminKudoFilter(searchParams)` → `KudoAdminQuery.list(filter, locale)` + `resolveSelectedPeople` chạy song song; lỗi đọc trả `null` | `app/admin/review/page.tsx:19-26,42-46` |
| R3 | helper | `KudoAdminQuery.list`: đếm tổng, cắt trang về `[1, pageCount]`, 10 dòng mỗi trang | `features/admin-moderation/server/kudo-admin-query.ts:17,25-38` |
| E05, E06 | helper | `resolveSelectedPeople` lấy tên và email theo id trong URL qua `findSunnerOptionsByIds` | `features/admin-moderation/server/admin-kudo-selected-people.ts:13-22` |
| E05, E06 | endpoint | `GET /api/sunners/search` (ROUTE018, gọi bởi `SunnerSearchCombobox`; chọn cả bản thân) | `features/admin-moderation/components/review-person-filter.tsx:35-39` |
| E02–E08, E10, E23 | js | `ReviewContentScreen`: `useOptimistic(filter)` + `router.replace(reviewHref(next), { scroll: false })` trong `startTransition`; tham số `page`, `sort`, `status`, `sender`, `receiver`, `from`, `to`, `q` | `features/admin-moderation/components/review-content-screen.tsx:31-46`, `features/admin-moderation/components/review-url-params.ts:12-26` |
| E18 | endpoint | Server action `markKudoSpam(kudoId)` (ROUTE027): `requireAdmin` → kiểm tra uuid → `KudoModerationService.transition(id, "spam", adminId)` → `revalidatePath("/admin/review")`; mã lỗi `invalid`, `unexpected`, `not_found` | `features/admin-moderation/server/kudo-moderation-actions.ts:19-43` |
| E18 | endpoint | Server action `unSpamKudo(kudoId)` (ROUTE028): như trên với đích `public`; không ghi sự kiện | `features/admin-moderation/server/kudo-moderation-actions.ts:40-43` |
| E18 | helper | `transition`: một giao dịch `UPDATE kudos SET status, moderated_by, moderated_at WHERE id AND status = nguồn RETURNING`; chỉ public → spam ghi outbox `KudoMarkedSpam{kudoId, ownerId, moderatedAt}`; không có hàng cập nhật thì đọc lại để phân biệt "đã đổi bởi người khác" và "không tồn tại" | `features/admin-moderation/server/kudo-moderation-service.ts:21-42` |
| E04 | endpoint | `GET /api/admin/kudos/export?<cùng tham số, không page>` (ROUTE002) → 200 `text/csv; charset=utf-8` attachment `kudos-{yyyyMMdd-HHmm}.csv`; 401/403 trước khi đọc tham số, 400 tham số sai, 422 `export_too_large`, 500 `unexpected`; `Cache-Control: private, no-store` | `app/api/admin/kudos/export/route.ts:17-44` |
| E04 | helper | Đọc `EXPORT_MAX_ROWS + 1` dòng một lần; nhận đủ thì từ chối (422) | `app/api/admin/kudos/export/route.ts:31-32`, `features/admin-moderation/server/kudo-admin-query.ts:45-51` |
| E04 | helper | File schema CSV (13 cột, theo thứ tự): ID, Ngày gửi, Người gửi, Email người gửi, Ẩn danh, Người nhận, Tiêu đề, Lời nhắn, Hashtag, Tim, Trạng thái, Kiểm duyệt bởi, Kiểm duyệt lúc; UTF-8 BOM, chống công thức qua `serializeCsv`; không có mục BL trong `behavior-logic.md` cho luồng này nên danh sách cột ghi tại đây (xem Unresolved Questions) | `features/admin-moderation/server/admin-kudo-export.ts:13-27,31-47` |
| E04 | js | `ReviewExportButton` dùng `fetch(href, { headers: { accept: "text/csv" } })`, đọc `Content-Disposition` để đặt tên, tên dự phòng `kudos.csv` | `features/admin-moderation/components/review-export-button.tsx:40-53`, `features/admin-moderation/components/review-content-screen.tsx:74` |
| E21, E22 | js | `AdminLoadErrorPanel`: `router.refresh()` trong transition | `features/admin-moderation/components/admin-load-error-panel.tsx:18-25` |
| E08 | js | Hẹn giờ 300 ms (`SEARCH_DEBOUNCE_MS`), `maxLength` 100; truy vấn phía máy chủ chấp nhận tới 200 ký tự | `features/admin-moderation/components/review-search-input.tsx:9-10,57`, `features/admin-moderation/schemas/admin-kudo-filter-schema.ts:13,56-60` |
| E12 | helper | DTO `AdminKudoRow` dành riêng cho admin chứa người gửi thật, `isAnonymous`, `anonymousNickname`; biệt danh chỉ vào `title` của nhãn "Ẩn danh" | `features/admin-moderation/components/review-table-row.tsx:49-56` |
| § 5. | handler | `loading.tsx` là fallback Suspense của route | `app/admin/review/loading.tsx:4-9` |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireAdmin()` trong trang (sau `requireShellAdmin()` của khung admin) | role | Guest bị chuyển `/login`; non-admin nhận 403; không có markup admin cho người không đủ quyền |
| `requireAdmin()` đầu mỗi server action (`markKudoSpam`, `unSpamKudo`) | role | Khung admin không bảo vệ action; thiếu guard thì mọi người đăng nhập có thể đổi trạng thái Kudo |
| `requireAdminApi()` ở `GET /api/admin/kudos/export` | role | 401 (guest) hoặc 403 (non-admin) JSON trước khi đọc tham số; thiếu guard lộ tên, email người gửi và nội dung Kudo ẩn danh |
| Cổng prelaunch và session ở proxy cho `/api/admin/*` | role | [UNVERIFIED] server enforcement — static analysis cannot confirm API middleware |
| Truy vấn `KudoAdminQuery` không tự guard (Drizzle bỏ qua RLS) | permission | Mọi caller phải gọi guard trước; gọi từ đường không guard sẽ lộ người gửi ẩn danh thật |

## Source References

1. Page/View: `app/admin/review/page.tsx:11-58`
2. Loading: `app/admin/review/loading.tsx:4-9`
3. Admin frame: `app/admin/layout.tsx:10-19`
4. Screen body: `features/admin-moderation/components/review-content-screen.tsx:28-105`
5. Filter bar: `features/admin-moderation/components/review-filters.tsx:28-69`
6. Person / status / search / date filters: `features/admin-moderation/components/review-person-filter.tsx:1-45`, `features/admin-moderation/components/review-status-filter.tsx:1-30`, `features/admin-moderation/components/review-search-input.tsx:19-71`, `features/admin-moderation/components/review-date-range-filter.tsx:18-100`
7. Table and row: `features/admin-moderation/components/review-table.tsx:43-109`, `features/admin-moderation/components/review-table-row.tsx:37-87`
8. Moderation button: `features/admin-moderation/components/review-moderation-button.tsx:29-109`
9. Export button: `features/admin-moderation/components/review-export-button.tsx:36-61`
10. Pagination: `features/admin-moderation/components/review-pagination.tsx:13-54`
11. URL params: `features/admin-moderation/components/review-url-params.ts:1-62`
12. Filter schema: `features/admin-moderation/schemas/admin-kudo-filter-schema.ts:1-88`
13. Query + selected people: `features/admin-moderation/server/kudo-admin-query.ts:17-53`, `features/admin-moderation/server/admin-kudo-selected-people.ts:13-22`
14. Actions + service: `features/admin-moderation/server/kudo-moderation-actions.ts:1-43`, `features/admin-moderation/server/kudo-moderation-service.ts:1-44`
15. Export route + CSV: `app/api/admin/kudos/export/route.ts:1-44`, `features/admin-moderation/server/admin-kudo-export.ts:1-56`
16. Error panel, toast, skeleton: `features/admin-moderation/components/admin-load-error-panel.tsx:12-28`, `features/admin-campaigns/components/campaign-settings-toast.tsx:20-39`, `features/admin-moderation/components/review-content-skeleton.tsx:9-28`
17. Admin guard: `shared/auth/admin-guard.ts:17-35`
18. UI copy: `messages/vi.json` (`adminModeration`)

## Source Walkthrough

1. **File:** `app/admin/review/page.tsx:11-58` — trang RSC: guard, đọc tham số URL, tải bảng; bắt đầu từ đây để thấy dữ liệu vào màn hình thế nào.
2. **File:** `features/admin-moderation/schemas/admin-kudo-filter-schema.ts:1-88` — luật chuyển tham số URL thành bộ lọc, nguồn của hai thông báo lỗi lọc.
3. **File:** `features/admin-moderation/server/kudo-admin-query.ts:17-53` — đọc bảng 10 dòng mỗi trang và đọc cho xuất CSV (entities: MODEL003_Kudo, MODEL004_Profile, MODEL005_KudoHashtag, MODEL008_KudoHeart trong `entities.md`).
4. **File:** `features/admin-moderation/components/review-content-screen.tsx:28-105` — thân màn hình: giữ trạng thái lọc optimistic, ghép mọi khối.
5. **File:** `features/admin-moderation/components/review-url-params.ts:1-62` — cách bộ lọc đổi thành URL và ngược lại.
6. **File:** `features/admin-moderation/components/review-filters.tsx:28-69` — thanh lọc và các ô con.
7. **File:** `features/admin-moderation/components/review-table.tsx:43-109` — bảng, trạng thái rỗng và nút sắp xếp theo tim.
8. **File:** `features/admin-moderation/components/review-moderation-button.tsx:29-109` — luồng Mark Spam / Un Spam và hộp xác nhận.
9. **File:** `features/admin-moderation/server/kudo-moderation-service.ts:1-44` — giao dịch đổi trạng thái an toàn khi hai admin thao tác cùng lúc.
10. **File:** `app/api/admin/kudos/export/route.ts:17-44` — luồng xuất CSV phía máy chủ.

### Call Hierarchy

```text
AdminReviewPage (RSC) ─ requireAdmin ─ parseAdminKudoFilter ─ KudoAdminQuery.list + resolveSelectedPeople
 └─ ReviewContentScreen (client)
     ├─ ReviewDateRangeFilter ─ onChange ─ navigate ─ router.replace
     ├─ ReviewExportButton ─ fetch GET /api/admin/kudos/export
     ├─ ReviewFilters ─ ReviewPersonFilter (SunnerSearchCombobox) / ReviewStatusFilter / ReviewSearchInput
     ├─ ReviewTable ─ ReviewTableRow ─ ReviewModerationButton ─ markKudoSpam / unSpamKudo ─ KudoModerationService.transition
     ├─ AdminLoadErrorPanel (khi lỗi đọc)
     ├─ ReviewPagination
     └─ CampaignSettingsToast
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
Điều khiển lọc -> applyFilterPatch (page = 1) -> setView (optimistic) + router.replace(URL)
  -> page.tsx đọc lại (parseAdminKudoFilter -> KudoAdminQuery.list) -> props mới -> bảng vẽ lại
Mark Spam / Un Spam -> server action -> kết quả (ok, status, changed) -> setPatched (đổi nhãn dòng) + toast -> revalidatePath
```

## Unresolved Questions

- `docs/generated/screen-list.md` (SCR013, Data Entity 2) ghi "Kudo ẩn danh hiện biệt danh". Mã hiện tên thật người gửi kèm nhãn "Ẩn danh"; biệt danh chỉ nằm trong chú giải `title` của nhãn (`review-table-row.tsx:49-56`). Cần sửa tài liệu cho khớp mã.
- Luồng xuất CSV (`/api/admin/kudos/export`) không có mục BL trong `behavior-logic.md`, nên file schema 13 cột chỉ có ở `admin-kudo-export.ts:13-27`; cần quyết định có thêm mục BL hay giữ trong tài liệu tính năng F007.
- Hộp thoại cảnh báo spam (SpamAlertOverlay) và nhãn Spam của chủ Kudo nằm trong `features/admin-moderation` nhưng được dựng từ thẻ Kudo và trang chi tiết Kudo của feed (`kudo-card.tsx`, `kudo-detail-view.tsx`), không phải trên màn hình này; spec này không mô tả chúng.
- Toast kết quả dùng lại component của feature admin-campaigns (`CampaignSettingsToast`), phụ thuộc chéo giữa hai feature; cần xác nhận có chủ ý hay không.
