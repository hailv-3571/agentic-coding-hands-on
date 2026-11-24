---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR018_AdminUser — Screen Spec

**Screen**: SCR018_AdminUser: AdminUser
**Feature**: F014_AdminUserManagement
**Type**: atomic
**Route**: /admin/users (query `page`, `unit`, `level`, `role`, `q`, `sort`, `dir`)
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Admin xem toàn bộ Sunner kèm số liệu tham gia (Kudo gửi/nhận, tim, Level, huy hiệu, lần đăng nhập cuối), lọc, tìm, sắp xếp, đổi role từng người và xuất CSV; họ vào màn này từ mục "User" của thanh menu Admin.
**Actors:** Admin (người có role Admin). Admin cấu hình qua biến môi trường và chính người đang thao tác được đánh dấu riêng trong menu role.
**Entry Conditions:** Có phiên hợp lệ và role hiện tại trong DB là Admin; người không phải Admin nhận trang từ chối truy cập (HTTP 403) từ proxy trước khi layout Admin chạy.
**Exit Conditions:** Admin ở lại màn để lọc, đổi trang, đổi role, xuất CSV; chuyển sang mục khác của khu Admin qua thanh menu thuộc SCR002_AdminLayout.

## 2. Screen Layout

### Layout Sketch

Màn nằm trong khung Admin: thanh trên cùng dính của Admin (88 px, logo kèm ADMIN và bốn mục menu), phần thân canh giữa rộng tối đa 1440 px và footer tối giản. Thân màn xếp dọc: hàng tiêu đề "User" kèm nút Export, thanh bộ lọc (Unit, Level, Role bên trái, ô tìm bên phải), dòng lỗi bộ lọc nếu có, bảng 12 cột trong hộp tự cuộn ngang, rồi phân trang canh giữa. Hộp thoại xác nhận đổi role và toast nổi phía trên. (`app/admin/layout.tsx:10-18`, `features/admin-users/components/admin-users-view.tsx:60-90`, `features/admin-users/components/admin-user-table.tsx:46-47`)

```
┌───────────────────────────────────────────────────────┐
│ R1: Admin Top Bar (sticky)  ADMIN | Overview Review   │
│                              User Settings  [lang][me]│
├───────────────────────────────────────────────────────┤
│ R2: Title Row (static)   User              [ Export ] │
│ R3: Filter Bar (static)  [Unit▾][Level▾][Role▾] [Search]│
│  - - - dòng lỗi bộ lọc (nếu có) - - -                 │
│ R4: User Table (static, cuộn ngang trong hộp)         │
│  ID|User|Email|∑ sent|∑ recv|Heart|Level|Badges|6B|Login|Role|⋯│
│  ... 20 dòng ...                                      │
│ R5: Pagination (static)      < 1 2 3 4 5 >            │
├───────────────────────────────────────────────────────┤
│ R6: Admin Footer (static, minimal)                    │
└───────────────────────────────────────────────────────┘
   (floating) hộp thoại xác nhận đổi role · toast
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Admin Top Bar | sticky | no | AdminTopBar (thuộc SCR002_AdminLayout, không mô tả lại) |
| R2 | Title Row | static | no | AdminUsersView, ReviewExportButton |
| R3 | Filter Bar | static | no | AdminUserFilters, AdminFilterSelect, ReviewSearchInput |
| R4 | User Table | static | yes (cuộn ngang) | AdminUserTable, AdminUserSortableHeader, AdminUserTableRow, AdminUserRoleMenu, AdminUserRoleDialog, AdminLoadErrorPanel |
| R5 | Pagination | static | no | ReviewPagination |
| R6 | Admin Footer | static | no | AppFooter (variant `minimal`) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Tiêu đề "User" (h1) | display field | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Export | button | — | Enabled | Always | Tải CSV theo bộ lọc và thứ tự đang chọn (không theo trang) | — | — | — | N/A |
| E03 | Bộ lọc Unit | select | no | "Tất cả" | Always | Lọc theo đơn vị | route param | tên đơn vị; thêm "Chưa gán đơn vị" | "Tất cả" | MODEL001_Department.name_vi |
| E04 | Bộ lọc Level | select | no | "Tất cả" | Always | Lọc theo bậc Hero | route param | nhãn bậc; thêm "Chưa có Level" | "Tất cả" | MODEL003_Kudo (bậc tính khi đọc) |
| E05 | Bộ lọc Role | select | no | "Tất cả" | Always | Lọc theo role Admin / User | route param | Admin / User | "Tất cả" | MODEL004_Profile.role (DISC-001) |
| E06 | Ô tìm theo tên hoặc email | text input | no | Empty | Always | Tìm kiếm sau khi ngừng gõ ~300 ms hoặc nhấn Enter | route param | tối đa 100 ký tự | placeholder "Search" | MODEL004_Profile.full_name, MODEL004_Profile.email |
| E07 | Dòng lỗi bộ lọc | message | — | Hidden | Conditional | — | route param | raw | hidden | N/A |
| E08 | Bảng người dùng (12 cột, 20 dòng mỗi trang) | table | — | Dòng của trang hiện tại | Conditional | — | API field | số theo locale | Không có người dùng nào phù hợp bộ lọc. | MODEL004_Profile |
| E09 | Tiêu đề cột sắp xếp (∑ sent Kudos (n), ∑ Received Kudos (n), Total Heart, Level, Number of Badges, Time to get 6 Badges, Last Logged in) | button | — | Enabled | Always | Sắp xếp theo cột; bấm lại đảo chiều | route param | "(n)" là tổng cột trên toàn bộ bộ lọc | — | N/A |
| E10 | Cột ID / User / Email | display field | — | Visible | Conditional | — | API field | ID là 8 ký tự đầu của uuid; tên và email xuống dòng tự do | dash | MODEL004_Profile.id, MODEL004_Profile.full_name, MODEL004_Profile.email |
| E11 | Cột ∑ sent, ∑ received, Total Heart (chữ đỏ), Level, Number of Badges | display field | — | Visible | Conditional | — | API field | số theo locale; Level là nhãn Hero; huy hiệu 0–6 | dash (Level) | MODEL003_Kudo, MODEL008_KudoHeart, MODEL012_UserIcon |
| E12 | Cột Time to get 6 Badges, Last Logged in | display field | — | Visible | Conditional | — | computed | `dd/MM/yyyy HH:mm` theo múi giờ Admin, ngày trên giờ dưới | dash | MODEL013_MysteryGiftAward.completed_at, MODEL004_Profile.last_login_at |
| E13 | Cột Role (Admin, User hoặc nhãn "Admin · env") | display field | — | Visible | Conditional | — | API field | raw | — | MODEL004_Profile.role (DISC-001) |
| E14 | Nút "⋯" Thao tác cho {tên} | button | — | Enabled | Conditional | Mở menu một mục ở bên trái nút | — | — | — | N/A |
| E15 | Mục menu "Set as Admin" / "Set as User" | button | — | Enabled | Conditional | Mở hộp thoại xác nhận đổi role | — | — | — | N/A |
| E16 | Gợi ý khóa của nút "⋯" hoặc mục menu | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E17 | Hộp thoại xác nhận (tiêu đề = hành động, câu hỏi, tên vàng, email) | message | — | Hidden | Conditional | — | computed | raw | hidden | MODEL004_Profile.full_name, MODEL004_Profile.email |
| E18 | Xác nhận (trong hộp thoại) | button | — | Enabled | Conditional | Đổi role | — | — | — | N/A |
| E19 | Huỷ (trong hộp thoại) | button | — | Enabled, có focus khi mở | Conditional | Đóng hộp thoại, giữ nguyên role | — | — | — | N/A |
| E20 | Lỗi trong hộp thoại | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E21 | Trạng thái bảng rỗng | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E22 | Xoá bộ lọc (chỉ nằm trong ô trạng thái rỗng) | button | — | Enabled | Conditional | Bỏ Unit, Level, Role và từ khoá | — | — | — | N/A |
| E23 | Phân trang (< 1 2 3 4 5 >) | list | — | Trang 1 | Conditional | Đổi trang | route param | tối đa 5 ô số quanh trang hiện tại | hidden | N/A |
| E24 | Khối lỗi đọc bảng (câu lỗi kèm nút "Thử lại") | message | — | Hidden | Conditional | Đọc lại trang từ server | static | raw | hidden | N/A |
| E25 | Toast kết quả (đổi role thành công; xuất tệp lỗi) | message | — | Hidden | Conditional | — | computed | raw | hidden | N/A |

Ghi chú: E10–E13 là các ô của cùng một dòng, lặp theo từng Sunner. Các tiêu đề cột ID, User, Email, Role, Actions không sắp xếp được.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Xuất CSV | E02 | click | Không đang xuất | Nút khóa kèm spinner "Đang xuất…", tải file CSV của bộ lọc và thứ tự đang chọn; lỗi thì toast | `features/admin-moderation/components/review-export-button.tsx:36-60` |
| Lọc theo Unit / Level / Role | E03, E04, E05 | chọn một mục | — | Bộ lọc đổi ngay (lạc quan), URL được thay thế, về trang 1, các dòng mờ cho tới khi server trả | `features/admin-users/components/admin-users-view.tsx:42-48`, `features/admin-users/lib/admin-user-url-params.ts:44-46` |
| Tìm kiếm | E06 | gõ rồi dừng ~300 ms, hoặc Enter | Từ khoá đã cắt khoảng trắng khác lần gửi trước | Bộ lọc đổi, về trang 1 | `features/admin-moderation/components/review-search-input.tsx:9,33-39,53-63` |
| Sắp xếp | E09 | click tiêu đề cột | — | Cột mới bắt đầu giảm dần, bấm lại đảo chiều; về trang 1 | `features/admin-users/lib/admin-user-url-params.ts:52-55` |
| Mở menu thao tác | E14 | click, Enter/Space hoặc ↓ | Không phải dòng của chính mình và không đang lưu | Mở menu một mục, focus vào mục | `features/admin-users/components/admin-user-role-menu.tsx:58-60,88-92,116` |
| Chọn đổi role | E15 | click | Không phải dòng admin cấu hình qua env | Đóng menu, mở hộp thoại xác nhận | `features/admin-users/components/admin-user-role-menu.tsx:67-73,140` |
| Xác nhận đổi role | E18 | click | Không đang lưu | Hai nút khóa kèm spinner "Đang lưu…"; thành công thì hộp thoại đóng, dòng đổi role ngay, toast; bị từ chối thì lỗi nằm trong hộp thoại | `features/admin-users/components/admin-user-role-menu.tsx:75-86`, `features/admin-users/components/admin-user-role-dialog.tsx:52-61` |
| Huỷ đổi role | E19 | click, hoặc Esc | Không đang lưu | Đóng hộp thoại, không đổi gì | `features/admin-users/components/admin-user-role-dialog.tsx:62-71` |
| Xoá bộ lọc | E22 | click | Bảng rỗng và đang có bộ lọc hoặc từ khoá | Bỏ Unit, Level, Role, từ khoá; sắp xếp được giữ | `features/admin-users/components/admin-users-view.tsx:23,57,84` |
| Đổi trang | E23 | click số trang hoặc mũi tên | Còn trang để tới | Chuyển trang, giữ bộ lọc | `features/admin-moderation/components/review-pagination.tsx:19-47`, `features/admin-users/components/admin-users-view.tsx:87` |
| Đọc lại bảng | E24 | click | Đọc bảng lỗi | Nút khóa trong lúc server dựng lại trang | `features/admin-moderation/components/admin-load-error-panel.tsx:16-23` |

### Happy Path

1. Admin mở `/admin/users`; bảng hiện 20 Sunner đầu theo thứ tự tên A–Z, tiêu đề cột số liệu kèm tổng "(n)" trên toàn bộ bộ lọc.
2. Admin chọn Unit ở E03; các dòng mờ đi rồi bảng đổi, URL cập nhật, phân trang về trang 1.
3. Admin gõ tên vào ô tìm ở E06; sau khi ngừng gõ ~300 ms bảng lọc theo tên hoặc email.
4. Admin bấm tiêu đề "∑ sent Kudos" để sắp xếp giảm dần.
5. Admin bấm "⋯" ở một dòng User, chọn "Set as Admin" và bấm "Xác nhận" trong hộp thoại.
6. Hộp thoại đóng, cột Role của dòng đổi ngay thành Admin và toast "Đã đặt {tên} làm Admin." hiện ít giây.
7. Admin bấm Export; trình duyệt lưu file CSV của đúng bộ lọc và thứ tự đang xem.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 (mở trang) | URL có `q` dài quá 100 ký tự | Dòng lỗi "Từ khoá tối đa 100 ký tự" trên bảng chưa lọc, trang 1 | `features/admin-users/schemas/user-list-params-schema.ts:69`, `app/admin/users/page.tsx:46-47,58` |
| Bước 1 | URL có tham số sai (sort lạ, page không hợp lệ, khóa lặp…) | Dòng lỗi "Bộ lọc không hợp lệ, đang hiện tất cả người dùng." trên bảng chưa lọc; Export cũng xuất bảng chưa lọc | `features/admin-users/schemas/user-list-params-schema.ts:36-41,65,71`, `features/admin-users/components/admin-users-view.tsx:63` |
| Bước 1 | Đọc bảng lỗi | E24 báo lỗi kèm "Thử lại"; bộ lọc, Export và tiêu đề vẫn dùng được | `app/admin/users/page.tsx:24-31`, `features/admin-users/components/admin-users-view.tsx:71-72` |
| Bước 1 | Đọc danh sách Unit lỗi | Dropdown Unit chỉ còn "Tất cả" và "Chưa gán đơn vị"; bảng vẫn dùng được | `app/admin/users/page.tsx:17,26-29`, `features/admin-users/components/admin-user-filters.tsx:30-34` |
| Bước 1 | `page` vượt quá số trang | Server kẹp về trang cuối, phân trang theo đó | `features/admin-users/server/user-admin-query.ts:105`, `features/admin-users/components/admin-users-view.tsx:86-87` |
| Bước 2 | Bộ lọc không có dòng nào | E21 "Không có người dùng nào phù hợp bộ lọc." kèm E22 khi đang có bộ lọc | `features/admin-users/components/admin-user-table.tsx:81-92` |
| Bước 5 | Dòng của chính Admin đang thao tác | Nút "⋯" bị khóa (mờ), tooltip "Bạn không thể tự hạ role của mình."; không mở menu | `features/admin-users/lib/admin-user-role-menu-state.ts:18`, `features/admin-users/components/admin-user-role-menu.tsx:62-65,109-126` |
| Bước 5 | Dòng admin cấu hình qua env | Menu mở nhưng mục "Set as User" mờ kèm gợi ý "Admin được cấu hình qua ADMIN_EMAILS nên không hạ role tại đây được."; không mở hộp thoại | `features/admin-users/components/admin-user-role-menu.tsx:67-68,129-138` |
| Bước 5 | Server từ chối (tự hạ, Admin cuối cùng, admin env, người dùng không còn, mất quyền Admin) | Hộp thoại giữ nguyên và hiện lỗi tương ứng ngay trong hộp | `features/admin-users/lib/admin-user-role-menu-state.ts:27-40`, `features/admin-users/components/admin-user-role-dialog.tsx:46-50` |
| Bước 5 | Action ném lỗi (mất mạng, hoặc proxy trả 403 JSON vì vừa bị hạ quyền) | Hộp thoại hiện "Không cập nhật được role. Vui lòng thử lại." | `features/admin-users/components/admin-user-role-menu.tsx:24-33` |
| Bước 7 | Bộ lọc cho ra nhiều dòng hơn giới hạn xuất | Toast lỗi "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." | `features/admin-moderation/components/review-export-button.tsx:45` |
| Bước 7 | Xuất lỗi khác hoặc mất mạng | Toast lỗi "Không xuất được tệp. Vui lòng thử lại." | `features/admin-moderation/components/review-export-button.tsx:46,48-49` |

### Interaction Notes

- **Mỗi lần đổi bộ lọc, tìm, sắp xếp hay trang đều ghi lên URL (`router.replace`, không cuộn lên đầu) nên tải lại hay gửi link cho người khác thấy cùng bảng** — source: `features/admin-users/components/admin-users-view.tsx:40-48`
- **Trong lúc chờ server, điều khiển cập nhật ngay còn các dòng mờ đi 60% và đánh dấu đang bận** — source: `features/admin-users/components/admin-users-view.tsx:35-36`, `features/admin-users/components/admin-user-table.tsx:46-47`
- **Đổi role xong thì dòng đó đổi ngay từ kết quả của action, sau đó trang đọc lại để cập nhật tổng và bộ lọc** — source: `features/admin-users/components/admin-users-view.tsx:50-55`, `features/admin-users/server/set-user-role-action.ts:24-26`
- **Hộp thoại mở với focus ở nút Huỷ (lựa chọn an toàn); trong lúc lưu cả hai nút khóa và Esc không đóng được** — source: `features/admin-users/components/admin-user-role-dialog.tsx:62-71`
- **Ô tìm giữ chữ người dùng đang gõ và chỉ đổi khi một thay đổi từ ngoài (Xoá bộ lọc, nút Back) làm đổi giá trị** — source: `features/admin-users/components/admin-user-filters.tsx:27,81-92`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading (route) | Chuyển vào `/admin/users` | `loading.tsx`: khung xương của bảng | none | `app/admin/users/loading.tsx:1-8` |
| loading (đổi bộ lọc / trang) | `router.replace` trong transition | Bộ điều khiển hiện giá trị mới, bảng mờ 60%, `aria-busy` | Tiếp tục đổi bộ lọc | `features/admin-users/components/admin-user-table.tsx:46-47` |
| empty | Bộ lọc không có kết quả | "Không có người dùng nào phù hợp bộ lọc." kèm "Xoá bộ lọc" nếu có bộ lọc | Xoá bộ lọc | `features/admin-users/components/admin-user-table.tsx:81-92` |
| error (đọc bảng) | Đọc bảng lỗi | Khối lỗi "Không tải được danh sách người dùng. Vui lòng thử lại." kèm "Thử lại"; không có bảng và phân trang | Thử lại, đổi bộ lọc, Export | `app/admin/users/page.tsx:24-26,59`, `features/admin-users/components/admin-users-view.tsx:71-72` |
| error (render bất ngờ) | Lỗi render trong segment | `error.tsx`: cùng câu lỗi và nút "Thử lại" gọi `retry` | Thử lại | `app/admin/users/error.tsx:12-21` |
| error (danh sách Unit) | Đọc danh sách Unit lỗi | Dropdown Unit chỉ còn hai mục cố định, bảng bình thường | Dùng bảng | `app/admin/users/page.tsx:17,26-29` |
| error (bộ lọc trên URL) | URL có tham số sai | Dòng chữ đỏ phía trên bảng, bảng chưa lọc | Đổi bộ lọc để sửa | `features/admin-users/components/admin-users-view.tsx:66-70` |
| exporting | Fetch CSV đang chạy | Nút Export khóa, spinner, chữ "Đang xuất…" | none | `features/admin-moderation/components/review-export-button.tsx:56-58` |
| saving | Đang đổi role | Nút "⋯" của dòng khóa kèm spinner; hộp thoại: hai nút khóa, "Đang lưu…" | none | `features/admin-users/components/admin-user-role-menu.tsx:65,120`, `features/admin-users/components/admin-user-role-dialog.tsx:54-61` |
| success | Đổi role xong | Toast "Đã đặt {tên} làm Admin." hoặc "… làm User." tự tắt sau 5 giây | dismiss (tự tắt) | `features/admin-users/components/admin-users-view.tsx:52-55`, `features/admin-campaigns/components/campaign-settings-toast.tsx:20-26` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E07 | Từ khoá trên URL tối đa 100 ký tự (ô nhập E06 chỉ lặng lẽ dừng ở 100 ký tự, không báo gì khi gõ) | "Từ khoá tối đa 100 ký tự" | server response |
| E07 | Các tham số trên URL phải hợp lệ (sort, dir, level, role, unit, page, không lặp khóa) | "Bộ lọc không hợp lệ, đang hiện tất cả người dùng." | server response |
| E20 | Không được tự hạ role của mình | "Bạn không thể tự hạ role của mình." | server response |
| E20 | Không được hạ Admin cuối cùng | "Không thể hạ Admin cuối cùng." | server response |
| E20 | Admin cấu hình qua env không hạ được tại đây | "Admin được cấu hình qua ADMIN_EMAILS. Hãy gỡ email khỏi ADMIN_EMAILS trước khi hạ role." | server response |
| E20 | Người thao tác phải còn quyền Admin | "Bạn không còn quyền Admin." | server response |
| E20 | Người dùng đích phải còn tồn tại | "Người dùng này không còn tồn tại." | server response |
| E20 | Lỗi không xác định hoặc dữ liệu gửi không hợp lệ | "Không cập nhật được role. Vui lòng thử lại." | server response |
| E25 | Xuất không vượt giới hạn dòng | "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." | server response |
| E25 | Xuất phải thành công | "Không xuất được tệp. Vui lòng thử lại." | server response |
| E24 | Bảng phải đọc được | "Không tải được danh sách người dùng. Vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Màn chỉ dành cho Admin | auth | E01..E25 | Role hiện tại trong DB là Admin | Khách (về `/login`) hoặc không phải Admin (trang từ chối 403) | Consequence if bypassed: 403 từ proxy cho trang và JSON 403 cho action và API; email toàn bộ Sunner sẽ lộ nếu cổng này hỏng |
| Dòng của chính mình khóa menu role | auth | E14, E16 | — (nút hiện nhưng khóa kèm gợi ý) | Dòng người khác: nút dùng được | Consequence if bypassed: server vẫn từ chối `SELF_DEMOTE` |
| Dòng admin cấu hình qua env không hạ được | auth | E15, E16, E13 | Dòng admin trong danh sách admin cấu hình qua env: nhãn "Admin · env" và mục "Set as User" mờ | Dòng Admin thường: mục dùng được | Consequence if bypassed: server từ chối `ENV_ADMIN` (và lần đăng nhập sau họ sẽ được đặt lại Admin) |
| Mục menu đảo theo role hiện tại | auth | E15, E17 | Dòng User: "Set as Admin"; dòng Admin khác: "Set as User" | Không có cả hai ở dòng của chính mình | Consequence if bypassed: server từ chối `LAST_ADMIN` khi chỉ còn một Admin |
| Dòng lỗi bộ lọc chỉ hiện khi URL sai | configuration | E07 | URL có tham số sai | URL hợp lệ | — |
| Bảng chỉ hiện khi đọc được; lỗi thì hiện khối lỗi thay thế | configuration | E08, E23, E24 | Đọc bảng thành công (E08, E23) hoặc thất bại (E24) | Ngược lại | Phân trang ẩn khi chỉ có một trang |
| Trạng thái rỗng và "Xoá bộ lọc" | configuration | E21, E22 | Không có dòng nào (E21); bảng rỗng và đang có Unit, Level, Role hoặc từ khoá (E22, chỉ nằm trong ô trạng thái rỗng) | Có dòng; không có bộ lọc | — |
| Hộp thoại xác nhận chỉ hiện sau khi chọn đổi role | configuration | E17, E18, E19, E20 | Đã chọn E15; lỗi E20 chỉ khi server từ chối | Đã đóng hoặc đổi xong | — |
| Toast chỉ hiện trong 5 giây sau một kết quả | configuration | E25 | Vừa đổi role xong hoặc vừa xuất lỗi | Hết 5 giây hoặc chưa có kết quả | — |
| Bộ lọc lệch trên cột nhỏ | responsive | E03, E04, E05, E06 | Từ `sm` các bộ lọc xếp hàng ngang | Dưới `sm` xếp dọc, ô tìm chiếm cả chiều rộng | — |

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
| SCR002_AdminLayout | Bấm mục "User" trên thanh menu Admin | Admin | `features/app-shell/components/admin-top-bar.tsx:21-26` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Lọc, tìm, sắp xếp, đổi trang | E03, E04, E05, E06, E09, E23 | — | (stays on screen) | redirect (thay URL cùng route, `/admin/users?…`) | `features/admin-users/components/admin-users-view.tsx:42-48` |
| Đổi role | E18 | Server chấp nhận | (stays on screen) | toast (không điều hướng) | `features/admin-users/components/admin-users-view.tsx:52-55` |
| Xuất CSV | E02 | — | (stays on screen) | tải tệp CSV | `features/admin-moderation/components/review-export-button.tsx:40-53` |

Các mục điều hướng khác của khu Admin (Overview, Review, Settings, về trang Sunner) thuộc thanh menu của SCR002_AdminLayout, không mô tả lại ở đây.

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Thanh bộ lọc `role="search"` có tên; bảng có `caption` ẩn, `th scope="col"`, `aria-sort` ở cột sắp xếp, `aria-busy` khi bận; nút "⋯" có tên "Thao tác cho {tên}", `aria-haspopup="menu"`, menu `role="menu"` / `role="menuitem"`; gợi ý khóa dùng `role="tooltip"` và `aria-describedby`; hộp thoại `role="alertdialog"` có mô tả; lỗi `role="alert"` |
| Keyboard navigation | supported | Menu mở bằng Enter/Space/↓, Esc đóng và trả focus về nút, Tab đóng rồi đi tiếp; ô tìm gửi bằng Enter; nút phân trang và tiêu đề cột là button native |
| Focus management | managed | Mở menu thì focus vào mục; hộp thoại có bẫy focus, focus đầu vào nút Huỷ, trả focus về nút "⋯" khi đóng; nút khóa vẫn focus được để đọc lý do |
| Screen reader compatibility | partial | Có caption và scope cho bảng; tiêu đề cột có `title` "Bấm để đổi thứ tự sắp xếp"; toast thành công qua `role="status"` polite; chưa kiểm thử với trình đọc màn hình |
| Error announcement | supported | Dòng lỗi bộ lọc, khối lỗi bảng, lỗi trong hộp thoại và toast lỗi đều dùng `role="alert"` |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (< sm) | R3, E03..E05 | Các ô lọc xếp dọc; từ `sm` xếp ngang với Unit rộng 259 px, Level và Role rộng 144 px | `features/admin-users/components/admin-user-filters.tsx:49-52,60-61` |
| mobile (< md) | R3, E06 | Ô tìm chiếm cả chiều rộng; từ `md` rộng tự do trong khoảng 256–360 px | `features/admin-moderation/components/review-search-input.tsx:42` |
| mobile (< md) | R4 | Bảng giữ độ rộng tối thiểu 1152 px và cuộn ngang trong hộp riêng | `features/admin-users/components/admin-user-table.tsx:46-47` |
| desktop (md+ / xl) | Khung nội dung | Đệm ngang tăng `px-4` → `md:px-12` → `xl:px-36`, rộng tối đa 1440 px | `app/admin/layout.tsx:15` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 2. | handler | Trang là Server Component: `requireAdmin()` trước hết, rồi `parseUserListParams(searchParams)` → bộ lọc; đọc song song `UserAdminQuery.listPage` và `UserFilterOptionsQuery.get` bằng `Promise.allSettled`; lỗi bảng thành `loadError`, lỗi Unit thành danh sách rỗng; id người thao tác (`actorId`) truyền xuống để ẩn việc tự hạ quyền | `app/admin/users/page.tsx:20-62` |
| E08 | helper | Kích thước trang `ADMIN_USER_PAGE_SIZE = 20`; trang vượt cuối kẹp về trang cuối | `features/admin-users/server/user-admin-query.ts:24,97-113` |
| § 2. | helper | `AdminUsersScreen` là Server Component để chuyển hai mốc thời gian sang múi giờ Admin trước khi đưa xuống trình duyệt | `features/admin-users/components/admin-users-screen.tsx:7-14` |
| E03..E06, E09, E23 | helper | Tên tham số URL dùng chung trang và route xuất: `page`, `unit`, `level`, `role`, `q`, `sort`, `dir`; mặc định không ghi lên URL, `dir` chỉ ghi kèm `sort`; thứ tự mặc định là tên A–Z rồi id | `features/admin-users/lib/admin-user-url-params.ts:13-26`, `features/admin-users/schemas/user-list-params-schema.ts:1-34` |
| E15, E18 | endpoint | Server Action `setUserRoleAction({ userId, role })` (ROUTE032): `requireAdmin()` đầu tiên, kiểm đầu vào (`INVALID`), `UserRoleService.setRole`, rồi `revalidatePath("/admin/users")`; trả `{ ok: true, role }` hoặc `{ ok: false, error }` với `SELF_DEMOTE`, `LAST_ADMIN`, `ENV_ADMIN`, `NOT_FOUND`, `FORBIDDEN`, `INVALID`, `UNEXPECTED` | `features/admin-users/server/set-user-role-action.ts:19-30`, `features/admin-users/lib/admin-user-role-menu-state.ts:27-40` |
| E15, E18 | helper | `UserRoleService.setRole` chạy trong một giao dịch khóa các hàng admin, kiểm theo thứ tự: không tồn tại, tự hạ, admin env, admin cuối cùng, rồi người thao tác còn là admin | `features/admin-users/server/user-role-service.ts:10-20,31-47` |
| E14 | helper | `roleMenuState` suy ra `promote` / `demote` / `env-locked` / `self` từ role hiện tại, cờ admin env và `actorId` | `features/admin-users/lib/admin-user-role-menu-state.ts:17-22` |
| E02 | endpoint | `GET /api/admin/users/export?<cùng tham số trang, bỏ page>` (ROUTE004). Success: 200 `text/csv; charset=utf-8`, tệp đính kèm `users-{yyyyMMdd-HHmm}.csv`; Error: 401 `unauthorized`, 403 `forbidden` (trước khi đọc tham số), 400 `invalid_params`, 422 `export_too_large`, 500 `unexpected`, body chỉ `{ code }`; mọi câu trả lời `Cache-Control: private, no-store` | `app/api/admin/users/export/route.ts:10-45` |
| E02 | endpoint | File schema — see `docs/features/F014_AdminUserManagement/technical-spec.md` (mục A4, BR-006, cột 11 giá trị: ID, User, Email, Sent Kudos, Received Kudos, Total Heart, Level, Number of Badges, Time to get 6 Badges, Last Logged in, Role); chưa có BL### cho điểm xuất này trong behavior-logic.md | `features/admin-users/server/user-export-columns.ts:14-27`, `docs/features/F014_AdminUserManagement/technical-spec.md:162-165` |
| E02 | js | Nút Export gọi `fetch(href, { accept: "text/csv" })` rồi lưu blob; 422 thành toast riêng, lỗi khác thành toast chung; `href` dùng bộ lọc hiện tại, không có `page` | `features/admin-moderation/components/review-export-button.tsx:40-53`, `features/admin-users/lib/admin-user-url-params.ts:38-41` |
| E17 | js | `useOptimistic(filter)` giữ giá trị bộ lọc đang hiển thị; `roles` vá tại chỗ sau khi đổi role gắn với đúng tập dòng vừa render | `features/admin-users/components/admin-users-view.tsx:35-39,50-55` |
| E15 | js | `setRoleSafely` bắt mọi lỗi ném ra và đổi thành `UNEXPECTED`, trừ ngắt điều hướng của Next (`unstable_rethrow`) | `features/admin-users/components/admin-user-role-menu.tsx:24-33` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| AdminUserRoleMenu | role hiện tại, cờ admin env, `id === actorId` | promote ("Set as Admin"), demote ("Set as User"), env-locked, self (nút khóa) | `user`, `role`, `actorId`, `onChanged` | DISC-001 |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Proxy bước 4b: người không phải Admin trên `/admin/*` nhận trang từ chối HTTP 403; Server Action và phương thức khác nhận JSON 403 (admin bị hạ quyền giữa phiên cũng bị chặn ở đây, trước layout Admin) | role | Bỏ qua proxy thì layout và trang vẫn chặn (`shared/auth/session-proxy.ts:92-110`) |
| `requireShellAdmin()` ở layout Admin | role | Không phải Admin thì không có markup Admin nào được tạo (`app/admin/layout.tsx:9-11`) |
| `requireAdmin()` ở trang và ở Server Action đổi role (layout không bảo vệ action) | role | Khách → `/login`; không phải Admin → `forbidden()` (`shared/auth/admin-guard.ts:30-35`, `features/admin-users/server/set-user-role-action.ts:19`) |
| `requireAdminApi()` ở route xuất CSV, chạy trước khi đọc tham số; route nằm ngoài `isAdminPath` nên proxy không chặn | role | 401 / 403 JSON; bỏ cổng này thì lộ email toàn bộ Sunner (`app/api/admin/users/export/route.ts:25-26`, `shared/auth/route-access-policy.ts:25-27`) |
| Luật đổi role trong giao dịch: không tự hạ, không hạ admin env, không hạ Admin cuối cùng, người thao tác còn là Admin | role | Hệ thống có thể mất hết Admin hoặc Admin tự khóa mình (`features/admin-users/server/user-role-service.ts:43-47`) |
| Serializer CSV vô hiệu hóa công thức (`=`, `+`, `-`, `@`) và thêm BOM | permission | Tên hoặc email do người dùng cung cấp có thể chạy công thức khi mở bằng bảng tính (`docs/features/F014_AdminUserManagement/technical-spec.md:165`) |

## Source References

1. Page/View: `app/admin/users/page.tsx:1-62`
2. Layout: `app/admin/layout.tsx:1-19`
3. Loading / Error: `app/admin/users/loading.tsx:1-8`, `app/admin/users/error.tsx:1-21`
4. Screen body (server): `features/admin-users/components/admin-users-screen.tsx:1-35`
5. Interactive view: `features/admin-users/components/admin-users-view.tsx:1-93`
6. Filters: `features/admin-users/components/admin-user-filters.tsx:1-93`
7. Table / header / row: `features/admin-users/components/admin-user-table.tsx:1-103`, `features/admin-users/components/admin-user-sortable-header.tsx:1-39`, `features/admin-users/components/admin-user-table-row.tsx:1-65`
8. Role menu and dialog: `features/admin-users/components/admin-user-role-menu.tsx:1-159`, `features/admin-users/components/admin-user-role-dialog.tsx:1-74`
9. Role menu state: `features/admin-users/lib/admin-user-role-menu-state.ts:1-41`
10. URL params: `features/admin-users/lib/admin-user-url-params.ts:1-61`, `features/admin-users/schemas/user-list-params-schema.ts:1-72`
11. Role action and service: `features/admin-users/server/set-user-role-action.ts:1-31`, `features/admin-users/server/user-role-service.ts:1-47`
12. Query: `features/admin-users/server/user-admin-query.ts:1-113`
13. Export route and columns: `app/api/admin/users/export/route.ts:1-45`, `features/admin-users/server/user-export-columns.ts:1-40`
14. Shared admin components: `features/admin-moderation/components/review-export-button.tsx:1-61`, `features/admin-moderation/components/review-pagination.tsx:1-43`, `features/admin-moderation/components/review-search-input.tsx:1-70`, `features/admin-moderation/components/admin-load-error-panel.tsx:1-28`
15. Guards: `shared/auth/session-proxy.ts:92-121`, `shared/auth/admin-guard.ts:1-35`
16. UI copy: `messages/vi.json` (khóa `adminUsers`, `adminModeration.export`, `adminModeration.pagination`)

## Source Walkthrough

1. **File:** `app/admin/users/page.tsx:1-62` — trang chính: guard, đọc tham số URL, đọc bảng và lựa chọn Unit.
2. **File:** `features/admin-users/schemas/user-list-params-schema.ts:1-72` — URL được kiểm thế nào, vì sao có hai mã lỗi bộ lọc.
3. **File:** `features/admin-users/components/admin-users-view.tsx:1-93` — điều phối: URL là trạng thái, lạc quan, toast, phân trang.
4. **File:** `features/admin-users/components/admin-user-table.tsx:1-103` — cột, tổng "(n)", trạng thái rỗng.
5. **File:** `features/admin-users/components/admin-user-role-menu.tsx:1-159` — menu "⋯", khóa tự hạ và admin env, gọi action.
6. **File:** `features/admin-users/components/admin-user-role-dialog.tsx:1-74` — hộp thoại xác nhận và lỗi trong hộp.
7. **File:** `features/admin-users/server/user-role-service.ts:1-47` — luật chặn hạ quyền ở phía server.
8. **File:** `app/api/admin/users/export/route.ts:1-45` — xuất CSV theo cùng bộ lọc.

Lớp dữ liệu: Sunner và role xem MODEL004_Profile; đơn vị MODEL001_Department; Kudo, tim, icon, quà bí ẩn xem MODEL003_Kudo, MODEL008_KudoHeart, MODEL012_UserIcon, MODEL013_MysteryGiftAward trong entities.md. Màn không có tầng dữ liệu riêng ở UI.

### Call Hierarchy

```text
AdminUsersPage -> requireAdmin -> parseUserListParams -> UserAdminQuery.listPage / UserFilterOptionsQuery.get
AdminUsersPage -> AdminUsersScreen -> AdminUsersView -> AdminUserFilters -> AdminFilterSelect / ReviewSearchInput
                                                    -> AdminUserTable -> AdminUserSortableHeader / AdminUserTableRow -> AdminUserRoleMenu -> AdminUserRoleDialog -> setUserRoleAction -> UserRoleService
                                                    -> ReviewPagination, ReviewExportButton -> GET /api/admin/users/export
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
Đổi bộ lọc / sort / trang -> applyUserFilterPatch (url-params.ts:44-46) -> router.replace -> RSC đọc lại bảng -> props mới -> render
Xác nhận đổi role -> setUserRoleAction -> UserRoleService.setRole -> revalidatePath -> kết quả -> patched roles + toast -> RSC đọc lại bảng
Export -> adminUsersExportHref (bỏ page) -> fetch CSV -> saveFile
```

## Unresolved Questions

- Tooltip của admin cấu hình qua env và thông báo lỗi `envAdmin` in nguyên tên biến môi trường `ADMIN_EMAILS` cho người dùng cuối (`messages/vi.json` khóa `adminUsers.roleMenu.envLocked`, `adminUsers.roleErrors.envAdmin`). [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ có chủ ý để lộ tên cấu hình cho Admin hay không.
- Admin bị hạ quyền giữa phiên: Server Action bị proxy chặn bằng JSON 403 trước khi tới action (`shared/auth/session-proxy.ts:106-110`), nên mã `FORBIDDEN` ("Bạn không còn quyền Admin.") chỉ xuất hiện khi mất quyền đúng trong khoảng giữa `requireAdmin()` và giao dịch; trường hợp thường gặp là câu lỗi chung "Không cập nhật được role." — [UNVERIFIED] — needs runtime confirmation về dạng lỗi mà trình duyệt nhận khi Server Action trả JSON 403.
- Cột `Level` sắp xếp theo giá trị nào (số người gửi Kudo hay thứ tự bậc) do truy vấn SQL quyết định, chưa đọc ở mức UI (`features/admin-users/server/user-admin-sql-fragments.ts`, xem technical-spec của F014).
- Khi URL có tham số sai, trang hiển thị bảng chưa lọc nhưng thanh địa chỉ vẫn giữ tham số sai cho tới khi người dùng đổi một bộ lọc (`app/admin/users/page.tsx:46-47`, `features/admin-users/components/admin-users-view.tsx:63`). [UNVERIFIED] — needs runtime confirmation.
