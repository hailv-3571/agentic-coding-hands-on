---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR019_AdminOverview — Screen Spec

**Screen**: SCR019_AdminOverview: AdminOverview
**Feature**: F015_AdminOverview
**Type**: atomic
**Route**: /admin/overview (query `from`, `to`); `/admin` chỉ chuyển hướng về đây
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Admin xem bảng số liệu Kudo và Secret Box theo từng đơn vị (kèm dòng tổng "All"), thu hẹp theo khoảng ngày và xuất CSV; họ vào màn này làm trang mặc định của khu Admin, từ mục "Overview" hoặc từ mục "Dashboard" của menu tài khoản.
**Actors:** Admin (người có role Admin).
**Entry Conditions:** Có phiên hợp lệ và role hiện tại trong DB là Admin; người không phải Admin nhận trang từ chối truy cập (HTTP 403) từ proxy trước khi layout Admin chạy.
**Exit Conditions:** Admin ở lại màn để đổi khoảng ngày hoặc xuất CSV; chuyển sang mục khác của khu Admin qua thanh menu thuộc SCR002_AdminLayout.

## 2. Screen Layout

### Layout Sketch

Màn nằm trong khung Admin: thanh trên cùng dính của Admin, phần thân canh giữa rộng tối đa 1440 px và footer tối giản. Thân màn xếp dọc: hàng tiêu đề "Overview" với bộ chọn khoảng ngày và nút Export ở bên phải, dòng lỗi bộ lọc nếu có, rồi bảng bảy cột trong hộp tự cuộn ngang. Bảng không phân trang và không sắp xếp; dòng "All" đứng đầu. (`app/admin/layout.tsx:10-18`, `features/admin-overview/components/admin-overview-screen.tsx:42-72`, `features/admin-overview/components/overview-unit-stats-table.tsx:38-39`)

```
┌───────────────────────────────────────────────────────┐
│ R1: Admin Top Bar (sticky)  ADMIN | Overview Review   │
│                              User Settings  [lang][me]│
├───────────────────────────────────────────────────────┤
│ R2: Title Row (static)                                │
│   Overview        [Ngày bắt đầu → Ngày kết thúc][Export]│
│  - - - dòng lỗi bộ lọc (nếu có) - - -                 │
│ R3: Unit Stats Table (static, cuộn ngang trong hộp)   │
│  No|Unit|Total member|Sent|Received|≥1 kudo|Secret box│
│     All ...                                           │
│  1  CEVC1 ... (mỗi đơn vị một dòng)                   │
├───────────────────────────────────────────────────────┤
│ R4: Admin Footer (static, minimal)                    │
└───────────────────────────────────────────────────────┘
   (floating) toast lỗi xuất tệp
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Admin Top Bar | sticky | no | AdminTopBar (thuộc SCR002_AdminLayout, không mô tả lại) |
| R2 | Title Row | static | no | AdminOverviewScreen, ReviewDateRangeFilter, ReviewExportButton |
| R3 | Unit Stats Table | static | yes (cuộn ngang) | OverviewUnitStatsTable, AdminLoadErrorPanel |
| R4 | Admin Footer | static | no | AppFooter (variant `minimal`) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Tiêu đề "Overview" (h1) | display field | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Ngày bắt đầu | date input | no | Empty (toàn thời gian) | Always | Chọn ngày bắt đầu của khoảng | route param | `yyyy-MM-dd`; ô trống hiện chữ "Ngày bắt đầu" | placeholder text | N/A |
| E03 | Ngày kết thúc | date input | no | Empty (không giới hạn cuối) | Always | Chọn ngày kết thúc của khoảng | route param | `yyyy-MM-dd`; ô trống hiện chữ "Ngày kết thúc" | placeholder text | N/A |
| E04 | Lỗi khoảng ngược trong ô chọn | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E05 | Export | button | — | Enabled | Always | Tải CSV của đúng bảng đang hiển thị | — | — | — | N/A |
| E06 | Dòng lỗi bộ lọc | message | — | Hidden | Conditional | — | route param | raw | hidden | N/A |
| E07 | Bảng thống kê theo đơn vị (7 cột) | table | — | Dòng "All" rồi từng đơn vị | Conditional | — | API field | số theo locale | Chưa có đơn vị nào. | MODEL001_Department, MODEL004_Profile |
| E08 | Dòng "All" (ô No để trống) | display field | — | Visible | Conditional | — | computed | tổng của mọi dòng đơn vị kể cả "Chưa gán đơn vị" | — | N/A |
| E09 | Cột No / Unit (đơn vị đánh số từ 1; "Chưa gán đơn vị" xuống cuối khi có) | display field | — | Visible | Conditional | — | API field | số thứ tự; tên đơn vị xuống dòng tự do | — | MODEL001_Department.name_vi |
| E10 | Cột Total member, Total sent kudos, Total received kudos, Total users with at least 1 kudo, Total received secret box | display field | — | Visible | Conditional | — | API field | số theo locale, chữ số cùng độ rộng | — | MODEL004_Profile, MODEL003_Kudo, MODEL011_SecretBox |
| E11 | Khối lỗi đọc số liệu (câu lỗi kèm nút "Thử lại") | message | — | Hidden | Conditional | Đọc lại trang từ server | static | raw | hidden | N/A |
| E12 | Toast lỗi xuất tệp | message | — | Hidden | Conditional | — | computed | raw | hidden | N/A |

Ghi chú: E02 và E03 nằm chung một nhóm có tên "Khoảng ngày thống kê". Cột Total member không đổi theo khoảng ngày; bốn cột còn lại tính theo khoảng đã chọn (xem Unresolved Questions về nguồn của quy tắc này).

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn ngày bắt đầu | E02 | chọn ngày (bộ chọn hoặc gõ) | Khoảng không ngược | Bảng lọc theo khoảng mới: URL được thay thế, bảng mờ cho tới khi server trả | `features/admin-moderation/components/review-date-range-filter.tsx:64-69,74-81`, `features/admin-overview/components/admin-overview-screen.tsx:35-40,52-55` |
| Chọn ngày kết thúc | E03 | chọn ngày (bộ chọn hoặc gõ) | Khoảng không ngược | Như trên; để trống ngày kết thúc thì không giới hạn phía sau | `features/admin-moderation/components/review-date-range-filter.tsx:83-91`, `features/admin-overview/lib/overview-url-params.ts:8-15` |
| Xuất CSV | E05 | click | Không đang xuất | Nút khóa kèm spinner "Đang xuất…", tải CSV của bảng đang hiển thị; lỗi thì toast | `features/admin-moderation/components/review-export-button.tsx:36-60` |
| Đọc lại bảng | E11 | click | Đọc số liệu lỗi | Nút khóa trong lúc server dựng lại trang | `features/admin-moderation/components/admin-load-error-panel.tsx:16-23` |

### Happy Path

1. Admin mở `/admin/overview`; bảng hiện dòng "All" rồi từng đơn vị, số liệu toàn thời gian.
2. Admin chọn ngày bắt đầu ở E02 và ngày kết thúc ở E03; khi cả hai ô đều có giá trị hợp lệ (hoặc một ô được chọn), bảng mờ đi rồi đổi theo khoảng mới và URL cập nhật.
3. Admin bấm Export; trình duyệt lưu file CSV của đúng bảng đang xem.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 (mở trang) | URL có `from`/`to` ngược hoặc `to` trước `from` | Dòng lỗi "Khoảng ngày không hợp lệ, đang hiện số liệu toàn thời gian." trên bảng toàn thời gian | `features/admin-overview/schemas/overview-params-schema.ts:34-35`, `app/admin/overview/page.tsx:41-51` |
| Bước 1 | URL có `from`/`to` sai định dạng, ngày không tồn tại hoặc khóa lặp | Dòng lỗi "Bộ lọc không hợp lệ, đang hiện số liệu toàn thời gian." trên bảng toàn thời gian | `features/admin-overview/schemas/overview-params-schema.ts:23-33` |
| Bước 1 | Có lỗi bộ lọc trên URL | Hai ô ngày hiện trống; Export xuất đúng bảng toàn thời gian đang thấy | `features/admin-overview/components/admin-overview-screen.tsx:57` |
| Bước 1 | Đọc số liệu lỗi | Khối lỗi kèm "Thử lại" thay bảng; bộ chọn ngày và Export vẫn dùng được | `app/admin/overview/page.tsx:19-26,51`, `features/admin-overview/components/admin-overview-screen.tsx:65-67` |
| Bước 1 | Không có đơn vị nào | Bảng chỉ còn dòng "All" (toàn số 0) và dòng "Chưa có đơn vị nào." | `features/admin-overview/components/overview-unit-stats-table.tsx:82-90` |
| Bước 2 | Admin chọn khoảng mà ngày bắt đầu sau ngày kết thúc | Ô chọn từ chối ngay: viền đỏ, thông báo "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", bảng giữ nguyên, URL không đổi | `features/admin-moderation/components/review-date-range-filter.tsx:62,67,93-97` |
| Bước 3 | Xuất lỗi (mạng hoặc server) | Toast lỗi "Không xuất được tệp. Vui lòng thử lại." | `features/admin-moderation/components/review-export-button.tsx:46,48-49` |

### Interaction Notes

- **Mỗi lần đổi ngày hợp lệ ghi khoảng lên URL (`router.replace`, không cuộn lên đầu) nên tải lại hay gửi link cho người khác cho cùng số liệu** — source: `features/admin-overview/components/admin-overview-screen.tsx:35-40`
- **Trong lúc chờ server, ô ngày hiện giá trị mới ngay còn bảng mờ đi 60% và đánh dấu đang bận** — source: `features/admin-overview/components/admin-overview-screen.tsx:30`, `features/admin-overview/components/overview-unit-stats-table.tsx:38-39`
- **Chọn ngày bắt đầu sau ngày kết thúc bị chặn ngay trong ô chọn: ô kia nhận giới hạn tối thiểu hoặc tối đa theo ngày vừa chọn** — source: `features/admin-moderation/components/review-date-range-filter.tsx:74-90`
- **Nhấp vào bất kỳ chỗ nào của ô ngày đều mở bộ chọn ngày của trình duyệt; nếu trình duyệt không cho thì vẫn gõ ngày được** — source: `features/admin-moderation/components/review-date-range-filter.tsx:30-35`
- **Nút Export không đổi theo bộ chọn đang nhập dở mà theo bộ lọc đã vào URL; có lỗi bộ lọc thì xuất bảng toàn thời gian** — source: `features/admin-overview/components/admin-overview-screen.tsx:57`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading (route) | Chuyển vào `/admin/overview` | `loading.tsx`: tiêu đề, khung ô ngày và nút Export giả, 8 dòng khung xương | none | `app/admin/overview/loading.tsx:1-8`, `features/admin-overview/components/admin-overview-skeleton.tsx:5-23` |
| loading (đổi khoảng ngày) | `router.replace` trong transition | Ô ngày hiện giá trị mới, bảng mờ 60%, `aria-busy` | Tiếp tục đổi ngày | `features/admin-overview/components/admin-overview-screen.tsx:35-40`, `features/admin-overview/components/overview-unit-stats-table.tsx:38-39` |
| empty | Không có đơn vị nào | Dòng "All" kèm "Chưa có đơn vị nào." | Đổi khoảng ngày | `features/admin-overview/components/overview-unit-stats-table.tsx:82-90` |
| error (đọc số liệu) | Đọc số liệu lỗi | Khối lỗi "Không tải được số liệu. Vui lòng thử lại." kèm "Thử lại"; không có bảng | Thử lại, đổi ngày, Export | `app/admin/overview/page.tsx:19-26`, `features/admin-overview/components/admin-overview-screen.tsx:65-67` |
| error (render bất ngờ) | Lỗi render trong segment | `error.tsx`: cùng câu lỗi và nút "Thử lại" gọi `retry` | Thử lại | `app/admin/overview/error.tsx:12-21` |
| error (bộ lọc trên URL) | URL có tham số sai | Dòng chữ đỏ phía trên bảng, bảng toàn thời gian | Đổi ngày để sửa | `features/admin-overview/components/admin-overview-screen.tsx:60-64` |
| exporting | Fetch CSV đang chạy | Nút Export khóa, spinner, chữ "Đang xuất…" | none | `features/admin-moderation/components/review-export-button.tsx:56-58` |
| success | Xuất CSV xong | Trình duyệt lưu tệp; nút trở về "Export", không có toast | — | `features/admin-moderation/components/review-export-button.tsx:47,50-52` |
| saving | — | N/A — màn chỉ đọc, không có thao tác ghi | — | — |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E02, E04 | Ngày bắt đầu phải trước hoặc bằng ngày kết thúc | "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" | change |
| E06 | Khoảng ngày trên URL không được ngược | "Khoảng ngày không hợp lệ, đang hiện số liệu toàn thời gian." | server response |
| E06 | Tham số trên URL phải đúng định dạng ngày và không lặp | "Bộ lọc không hợp lệ, đang hiện số liệu toàn thời gian." | server response |
| E11 | Số liệu phải đọc được | "Không tải được số liệu. Vui lòng thử lại." | server response |
| E12 | Xuất phải thành công | "Không xuất được tệp. Vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Màn chỉ dành cho Admin | auth | E01..E12 | Role hiện tại trong DB là Admin | Khách (về `/login`) hoặc không phải Admin (trang từ chối 403) | Consequence if bypassed: 403 từ proxy cho trang và JSON 403 cho API; số liệu theo đơn vị lộ nếu cổng này hỏng |
| Lỗi khoảng ngược chỉ hiện khi hai ngày mâu thuẫn | configuration | E04 | Ngày bắt đầu sau ngày kết thúc trong ô chọn | Khoảng hợp lệ hoặc thiếu một đầu | Bảng và URL giữ nguyên khi đang ngược |
| Dòng lỗi bộ lọc chỉ hiện khi URL sai | configuration | E06 | URL có tham số sai | URL hợp lệ | Hai ô ngày trống và bảng là toàn thời gian |
| Bảng hay khối lỗi tùy việc đọc số liệu | configuration | E07, E08, E09, E10, E11 | Đọc thành công: bảng (E07..E10); thất bại: E11 | Ngược lại | — |
| Dòng "Chưa gán đơn vị" chỉ có khi tồn tại Sunner chưa có đơn vị | configuration | E09 | Có ít nhất một hồ sơ chưa có đơn vị | Mọi hồ sơ đã có đơn vị | Luôn xếp cuối bảng |
| Dòng "Chưa có đơn vị nào." chỉ hiện khi không có dòng đơn vị | configuration | E07 | Danh sách đơn vị rỗng | Có đơn vị | Dòng "All" vẫn hiện |
| Toast lỗi xuất tệp chỉ hiện trong 5 giây sau lỗi | configuration | E12 | Vừa xuất lỗi | Hết 5 giây hoặc chưa lỗi | — |

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
| SCR002_AdminLayout | Bấm mục "Overview" trên thanh menu Admin, mở `/admin` (chuyển hướng), hoặc menu tài khoản › Dashboard | Admin | `features/app-shell/components/admin-top-bar.tsx:21-23,45`, `app/admin/page.tsx:4-6`, `features/app-shell/components/account-menu.tsx:65-70` |
| SCR003_AppLayout | Menu tài khoản › Dashboard | Chỉ hiện với admin (cosmetic; quyền thật do proxy và layout kiểm) | `features/app-shell/components/account-menu.tsx:65-70` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đổi khoảng ngày | E02, E03 | Khoảng hợp lệ | (stays on screen) | redirect (thay URL cùng route, `/admin/overview?…`) | `features/admin-overview/components/admin-overview-screen.tsx:35-40` |
| Xuất CSV | E05 | — | (stays on screen) | tải tệp CSV | `features/admin-moderation/components/review-export-button.tsx:40-53` |

Các mục điều hướng khác của khu Admin (Review, User, Settings, về trang Sunner) thuộc thanh menu của SCR002_AdminLayout, không mô tả lại ở đây.

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Nhóm ô ngày `role="group"` có tên "Khoảng ngày thống kê"; mỗi ô ngày có `aria-label` ("Ngày bắt đầu", "Ngày kết thúc"), `aria-invalid` và `aria-describedby` khi ngược; bảng có `caption` ẩn, `th scope="col"`, tên đơn vị là `th scope="row"`, `aria-busy` khi bận; lỗi `role="alert"` |
| Keyboard navigation | supported | Ô ngày là `input type="date"` native; nút Export và Thử lại là button native; không có phím tắt riêng |
| Focus management | unmanaged | Không autofocus; sau khi đổi ngày focus ở lại ô vừa chọn |
| Screen reader compatibility | partial | Có caption và scope cho bảng, một h1; toast lỗi `role="alert"`; chưa có kiểm thử với trình đọc màn hình |
| Error announcement | supported | Lỗi khoảng ngược, lỗi bộ lọc URL, khối lỗi bảng và toast lỗi đều dùng `role="alert"` |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (< sm) | R2, E02, E03, E05 | Cụm ngày và nút Export chiếm cả chiều rộng và xuống dòng; từ `sm` bộ chọn ngày rộng 296 px | `features/admin-overview/components/admin-overview-screen.tsx:46`, `features/admin-moderation/components/review-date-range-filter.tsx:72` |
| mobile (< md) | R3 | Bảng giữ độ rộng tối thiểu 960 px và cuộn ngang trong hộp riêng | `features/admin-overview/components/overview-unit-stats-table.tsx:38-39` |
| mobile (< md) | E07 | Đệm ô bảng nhỏ hơn (`px-2`), từ `md` là `px-3` | `features/admin-overview/components/overview-unit-stats-table.tsx:12` |
| desktop (md+ / xl) | Khung nội dung | Đệm ngang tăng `px-4` → `md:px-12` → `xl:px-36`, rộng tối đa 1440 px | `app/admin/layout.tsx:15` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 2. | handler | Trang là Server Component: `requireAdmin()` trước hết, rồi `parseOverviewParams(searchParams)`; thành công thì dùng khoảng đã chuẩn hóa, thất bại thì dùng toàn thời gian; `UnitStatsQuery.forRange(range, locale)` bọc `try/catch`, lỗi trả `null` thành `loadError` | `app/admin/overview/page.tsx:19-26,35-54` |
| § 1. | handler | `/admin` chỉ gọi `redirect("/admin/overview")`, không phải màn riêng | `app/admin/page.tsx:4-6` |
| E02, E03 | helper | `from`/`to` là ngày nguyên `yyyy-MM-dd` theo múi giờ Admin, đổi sang khoảng UTC nửa mở [from 00:00, to + 1 ngày 00:00); thiếu một đầu là không giới hạn; ngược → `invalid_date_range`, sai định dạng / ngày không tồn tại / lặp khóa → `invalid_params` | `features/admin-overview/schemas/overview-params-schema.ts:1-35`, `shared/admin/date-range-filter.ts:14-30` |
| E02, E03 | js | `ReviewDateRangeFilter` giữ giá trị riêng, bỏ qua thay đổi làm khoảng ngược và chỉ gọi `onChange({ from, to })` khi hợp lệ; `useExternalResetKey` dựng lại ô khi URL đổi từ bên ngoài | `features/admin-moderation/components/review-date-range-filter.tsx:57-69`, `features/admin-overview/components/admin-overview-screen.tsx:33,47-56` |
| E07, E08 | helper | Dòng "All" là tổng của mọi dòng đã gom kể cả "Chưa gán đơn vị" (cộng trong TS, không có truy vấn thứ hai); đơn vị xếp A–Z theo tiếng Việt kiểu số tự nhiên, "Chưa gán đơn vị" xuống cuối | `features/admin-overview/server/add-all-row.ts:1-25` |
| E10 | helper | Truy vấn một câu bằng các truy vấn con gom theo đơn vị: chỉ Kudo công khai tính tại thời điểm đọc; gửi tính theo đơn vị người gửi, nhận và người nhận khác nhau tính theo đơn vị người nhận (Kudo ẩn danh vẫn tính); hộp theo `granted_at`; thành viên không theo khoảng ngày | `features/admin-overview/server/unit-stats-query.ts:11-19` |
| E05 | endpoint | `GET /api/admin/overview/export?from&to` (ROUTE003). Success: 200 `text/csv; charset=utf-8`, tệp đính kèm `overview-{yyyyMMdd-HHmm}.csv`; Error: 401 `unauthorized`, 403 `forbidden`, 400 (`invalid_date_range` hoặc `invalid_params`), 500 `unexpected`, body chỉ `{ code }`; mọi câu trả lời `Cache-Control: private, no-store` | `app/api/admin/overview/export/route.ts:14-40` |
| E05 | endpoint | File schema — see `docs/features/F015_AdminOverview/technical-spec.md` (mục A4, BR-007: 7 cột No, Unit, Total member, Total sent kudos, Total received kudos, Total users with at least 1 kudo, Total received secret box; hàng đầu "All" có No trống; tên đơn vị tiếng Việt và tiêu đề cột tiếng Anh bất kể ngôn ngữ giao diện); chưa có BL### cho điểm xuất này trong behavior-logic.md | `features/admin-overview/server/overview-export-columns.ts:11-34`, `docs/features/F015_AdminOverview/technical-spec.md:146-150` |
| E05 | js | Nút Export dùng `overviewExportHref(filterError ? ALL_TIME : filter)`; nhánh 422 của nút là mã dùng chung với màn Review, route này không bao giờ trả 422 | `features/admin-overview/components/admin-overview-screen.tsx:57`, `docs/features/F015_AdminOverview/technical-spec.md:136` |

## Component Variants

N/A — không có component đa biến thể dùng chung trên màn này (`ReviewDateRangeFilter` và `ReviewExportButton` chỉ khác nhãn nhóm và tên tệp dự phòng so với màn Review, không có biến thể theo trường phân biệt).

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Proxy bước 4b: người không phải Admin trên `/admin/*` nhận trang từ chối HTTP 403; admin bị hạ quyền giữa phiên cũng bị chặn ở đây, trước layout Admin | role | Bỏ qua proxy thì layout và trang vẫn chặn (`shared/auth/session-proxy.ts:92-110`) |
| `requireShellAdmin()` ở layout Admin | role | Không phải Admin thì không có markup Admin nào được tạo (`app/admin/layout.tsx:9-11`) |
| `requireAdmin()` ở trang | role | Khách → `/login`; không phải Admin → `forbidden()` (`app/admin/overview/page.tsx:40`, `shared/auth/admin-guard.ts:30-35`) |
| `requireAdminApi()` ở route xuất CSV, chạy trước khi đọc tham số; route nằm ngoài `isAdminPath` nên proxy không chặn | role | 401 / 403 JSON; bỏ cổng này thì lộ số liệu theo đơn vị (`app/api/admin/overview/export/route.ts:22-23`, `shared/auth/route-access-policy.ts:25-27`) |
| Mục "Dashboard" của menu tài khoản chỉ hiện với admin | permission | Chỉ là phần giao diện: người khác bấm trực tiếp `/admin/overview` vẫn bị chặn ở proxy, layout và trang (`features/app-shell/components/account-menu.tsx:65-70`) |

## Source References

1. Page/View: `app/admin/overview/page.tsx:1-54`
2. Redirect: `app/admin/page.tsx:1-6`
3. Layout: `app/admin/layout.tsx:1-19`
4. Loading / Error: `app/admin/overview/loading.tsx:1-8`, `app/admin/overview/error.tsx:1-21`
5. Screen body: `features/admin-overview/components/admin-overview-screen.tsx:1-73`
6. Table: `features/admin-overview/components/overview-unit-stats-table.tsx:1-93`
7. Skeleton: `features/admin-overview/components/admin-overview-skeleton.tsx:1-23`
8. URL params: `features/admin-overview/lib/overview-url-params.ts:1-24`, `features/admin-overview/schemas/overview-params-schema.ts:1-35`
9. Date range filter: `features/admin-moderation/components/review-date-range-filter.tsx:1-100`
10. Export button and error panel: `features/admin-moderation/components/review-export-button.tsx:1-61`, `features/admin-moderation/components/admin-load-error-panel.tsx:1-28`
11. Query and totals: `features/admin-overview/server/unit-stats-query.ts:1-40`, `features/admin-overview/server/add-all-row.ts:1-25`
12. Export route and columns: `app/api/admin/overview/export/route.ts:1-40`, `features/admin-overview/server/overview-export-columns.ts:1-34`
13. Guards: `shared/auth/session-proxy.ts:92-121`, `shared/auth/admin-guard.ts:1-35`
14. UI copy: `messages/vi.json` (khóa `adminOverview`, `adminModeration.dateRange`, `adminModeration.export`)

## Source Walkthrough

1. **File:** `app/admin/overview/page.tsx:1-54` — trang chính: guard, đọc tham số URL, đọc bảng.
2. **File:** `features/admin-overview/schemas/overview-params-schema.ts:1-35` — URL được kiểm thế nào, vì sao có hai mã lỗi bộ lọc.
3. **File:** `features/admin-overview/components/admin-overview-screen.tsx:1-73` — điều phối: URL là trạng thái, Export dùng khoảng nào.
4. **File:** `features/admin-moderation/components/review-date-range-filter.tsx:1-100` — ô chọn ngày và chặn khoảng ngược.
5. **File:** `features/admin-overview/components/overview-unit-stats-table.tsx:1-93` — cột, dòng "All", trạng thái rỗng.
6. **File:** `features/admin-overview/server/unit-stats-query.ts:1-40` — quy tắc tính từng số liệu.
7. **File:** `app/api/admin/overview/export/route.ts:1-40` — xuất CSV dùng chung truy vấn với bảng.

Lớp dữ liệu: đơn vị xem MODEL001_Department; thành viên MODEL004_Profile; Kudo MODEL003_Kudo; hộp quà MODEL011_SecretBox trong entities.md. Màn không có tầng dữ liệu riêng ở UI.

### Call Hierarchy

```text
AdminOverviewPage -> requireAdmin -> parseOverviewParams -> UnitStatsQuery.forRange -> addAllRow
AdminOverviewPage -> AdminOverviewScreen -> ReviewDateRangeFilter
                                         -> ReviewExportButton -> GET /api/admin/overview/export
                                         -> OverviewUnitStatsTable | AdminLoadErrorPanel
                                         -> CampaignSettingsToast
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
Đổi ngày hợp lệ -> markDatesSent + navigate (overview-screen.tsx:52-55) -> router.replace(overviewHref) -> RSC đọc lại bảng -> props mới -> render
Export -> overviewExportHref(filterError ? ALL_TIME : filter) (overview-screen.tsx:57) -> fetch CSV -> saveFile
```

## Unresolved Questions

- Quy tắc "Total member không theo khoảng ngày; bốn cột còn lại theo khoảng" chỉ thấy ở chú thích của `UnitStatsQuery` (`features/admin-overview/server/unit-stats-query.ts:11-19`), màn không có chữ nào cho Admin biết điều này. [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ có cần ghi chú trên giao diện hay không.
- Chọn khoảng chỉ có một đầu (chỉ ngày bắt đầu hoặc chỉ ngày kết thúc) vẫn lọc ngay (`features/admin-moderation/components/review-date-range-filter.tsx:64-69`); screen-flow ghi "đổi khoảng ngày đủ cả hai đầu mới `router.replace`". Mã cho phép khoảng một đầu (đầu trống là không giới hạn), không cần đủ cả hai. [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ hành vi nào là chủ ý.
- Lỗi `invalid_date_range` cho khoảng ngược do tự gõ chỉ chặn được ở ô chọn; vì `DateField` đặt `min`/`max` theo ngày bên kia, giá trị gõ tay ngoài khoảng vẫn có thể vào trạng thái ngược và hiện E04 (`features/admin-moderation/components/review-date-range-filter.tsx:62,67`). [UNVERIFIED] — needs runtime confirmation.
- Chưa đọc `UnitStatsQuery` toàn bộ phần SQL (từ dòng 40 trở đi) nên công thức từng cột chỉ dựa vào chú thích đầu file (xem technical-spec của F015).
