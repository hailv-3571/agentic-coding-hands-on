<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft, provenance inherited from the folder) -->

# Functional Spec — F014_AdminUserManagement

**Priority**: P2
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F014_AdminUserManagement → SCR026_AdminUser (TBD (draft)) → US001_BrowseUserTable, US002_FilterSearchSortUsers, US003_ChangeUserRole, US004_ExportUsers

## 1. Overview

**Problem:** BTC cần một chỗ xem toàn bộ Sunner cùng mức độ tham gia (Kudo gửi/nhận, tim, Level, Badge, lần đăng nhập cuối) và cần cấp hoặc thu quyền Admin mà không phải sửa tay trong cơ sở dữ liệu.
**Solution:** Admin có trang "User": bảng Sunner kèm bộ lọc theo phòng ban, Level, Role, ô tìm kiếm, sắp xếp theo các cột số liệu, menu thao tác trên từng dòng để đổi role, và nút Export.
**Scope:** Bảng người dùng của Admin (cột, lọc, tìm, sắp xếp, phân trang); đổi role User/Admin kèm hai chốt an toàn (không tự hạ mình, luôn còn ít nhất một Admin); Export danh sách đang lọc.
**Non-Scope:** Đăng nhập, tạo hồ sơ và kiểm tra role Admin (F001_Auth); khung và menu khu Admin (F002_AppShell); cách tính tim, Badge, Hero tier (F005_KudosHearts, F010_SecretBoxRewards, F009_HeroBadges — F014 chỉ đọc số liệu); tạo Admin đầu tiên (F001 đã hỏi); vô hiệu hoá hay xoá tài khoản; sửa tên, email, phòng ban của người dùng; số liệu theo đơn vị (F015_AdminOverview).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Admin | Sunner có role Admin | Tra cứu người dùng, xem mức độ tham gia, cấp/thu quyền Admin, xuất danh sách cho BTC |
| Sunner | Nhân viên đã đăng nhập, role User | Không dùng được trang này; vào thẳng thì nhận trang 403 |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Xem, lọc, tìm kiếm, sắp xếp người dùng | Xem bảng Sunner kèm số liệu, lọc theo Unit / Level / Role, tìm theo tên hoặc email, sắp theo cột số liệu, phân trang | US001_BrowseUserTable, US002_FilterSearchSortUsers | FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-207, FR-208, FR-402, FR-407, FR-408, FR-601 | BR-004, BR-005, DEC-003 | TBD (draft) |
| CAP-02 | Đổi role người dùng | Mở menu thao tác ở dòng, đặt người đó làm Admin hoặc về User, thấy kết quả ngay trên dòng | US003_ChangeUserRole | FR-001, FR-002, FR-209, FR-401, FR-404, FR-405, FR-406, FR-602 | BR-001, BR-002, BR-003, DEC-001, SM-001 | TBD (draft) |
| CAP-03 | Xuất danh sách người dùng | Tải tệp CSV các Sunner đang lọc | US004_ExportUsers | FR-403, FR-603 | BR-006, DEC-002 | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Cột và bộ lọc Level lấy từ đâu? (câu hỏi mở chung của dự án: có trùng Hero tier không, trong khi Level hiện 1–5 còn Hero có 4 cấp) `[NEEDS_DOMAIN_CONFIRMATION]` | Chưa chốt. Cột và bộ lọc nối vào một nguồn thay thế được; chưa có nguồn thì cột hiện dấu gạch và bộ lọc không có lựa chọn | Không tự bịa quy tắc tính Level; đổi nguồn không đụng tới phần còn lại của bảng | yes |
| D002 | "Number of Badges" đếm gì? Mẫu thiết kế có dòng 7 trong khi bộ sưu tập chỉ có 6 loại | Số loại icon khác nhau mà người dùng có, từ 0 đến 6 | Khớp với "Time to get 6 Badges" là lúc đủ 6 loại; dòng 7 coi là dữ liệu mẫu sai | no |
| D003 | "Time to get 6 Badges" lấy ở đâu? | Thời điểm F010 ghi nhận người dùng gom đủ 6 loại icon; chưa đủ thì để trống | F010 đã lưu thời điểm này, không tính lại | no |
| D004 | Con số "(100)" cạnh các cột tổng trên thiết kế là gì? | Chỉ là giá trị mẫu; không hiện hàng hay số tổng | Chưa có yêu cầu tổng toàn cột; làm thêm khi được xác nhận | no |
| D005 | Cột ID hiển thị gì? | Mã rút gọn 8 ký tự đầu của mã người dùng | Chưa có mã nhân viên trong hồ sơ | no |
| D006 | Bảng có phân trang không, cỡ trang bao nhiêu? | Có phân trang đánh số, 20 dòng mỗi trang | Danh sách người dùng dài hơn danh sách Kudo trang; ảnh chụp chưa cho thấy phân trang | no |
| D007 | Đổi role có bước xác nhận không, và có lưu lịch sử không? | Có xác nhận ngắn; chỉ lưu Admin và thời điểm của lần đổi gần nhất, không có bảng lịch sử | Quyền Admin nhạy cảm nên cần xác nhận; lịch sử đầy đủ chỉ làm khi cần truy vết | no |
| D008 | Hai chốt an toàn khi đổi role: tự hạ role chính mình, hạ Admin cuối cùng | Chặn cả hai (FR-404, FR-405) | Tránh cả hệ thống không còn ai vào khu Admin; không có cách tạo Admin từ giao diện khi đã hết Admin | no |
| D009 | Ô tìm kiếm tìm theo trường nào, có bỏ qua dấu không? | Tên và email, không phân biệt hoa thường và dấu tiếng Việt | Admin gõ không dấu vẫn tìm ra, cùng quy ước với trang Review content | no |
| D010 | Cột Total Heart tính tim thô hay đã nhân hệ số x2? | Số lượt tim thô, theo định nghĩa tổng tim của F005_KudosHearts | Cùng cách hiểu với trang Review content; chờ F005 chốt | no |
| D011 | Thứ tự mặc định khi Admin chưa chọn cột sắp xếp? | Theo tên người dùng A–Z | Thiết kế không cho thấy cột nào đang sắp `[INFERRED]` | no |
| D012 | Định dạng Export | Tệp CSV, cùng các cột như bảng (trừ cột thao tác), tối đa 10.000 dòng, mở được bằng Excel với tiếng Việt đúng | Giống Export của trang Review content, không thêm thư viện | no |
| D013 | Nhãn menu khu Admin ghi "Role" ở chỗ này, "User" ở chỗ khác | Không nêu lại ở đây; đã có câu hỏi chung | Tránh hỏi hai lần | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi người dùng luôn có đúng một trong hai role: User hoặc Admin.
- **FR-002** Hệ thống ghi lại Admin nào và lúc nào đã đổi role gần nhất của người dùng.

### Navigation (1xx)

- **FR-101** Admin vào trang User từ mục "User" trên menu khu Admin.

### User table (2xx)

- **FR-201** Bảng liệt kê mọi người dùng, mỗi dòng có ID, tên, email, tổng Kudo đã gửi, tổng Kudo đã nhận, tổng tim, Level, số Badge, thời điểm đủ 6 Badge, lần đăng nhập cuối, role và nút thao tác.
- **FR-202** Bảng phân trang đánh số; Admin chuyển trang và thấy trang hiện tại.
- **FR-203** Admin lọc theo phòng ban (Unit) bằng dropdown "Chọn phòng ban".
- **FR-204** Admin lọc theo Level bằng dropdown "Chọn Level".
- **FR-205** Admin lọc theo Role (Admin hoặc User) bằng dropdown "Chọn Role".
- **FR-206** Admin tìm người dùng bằng ô "Search" theo tên hoặc email.
- **FR-207** Admin sắp xếp tăng hoặc giảm bằng cách bấm đầu cột: Kudo gửi, Kudo nhận, Total Heart, Level, Number of Badges, Time to get 6 Badges, Last Logged in.
- **FR-208** Ô không có dữ liệu (chưa đăng nhập lần nào, chưa đủ 6 Badge, chưa có phòng ban hay Level) hiện dấu gạch, không để trống và không hiện số 0 giả.
- **FR-209** Mỗi dòng có nút "⋯" mở menu thao tác; menu hiện lựa chọn đổi role phù hợp với role hiện tại của dòng.
- **FR-408** Số Kudo, số tim và số Badge trong bảng và trong tệp Export chỉ tính Kudo đang Public; Kudo Spam không được tính.

### Interaction (4xx)

- **FR-401** Admin đổi role thì dòng cập nhật ngay, không tải lại trang.
- **FR-402** Đổi bất kỳ điều kiện lọc, tìm kiếm hay sắp xếp nào thì bảng về trang 1 và áp mọi điều kiện cùng lúc.
- **FR-403** Export tải về tệp CSV gồm toàn bộ người dùng khớp bộ lọc hiện tại, không chỉ trang đang xem.
- **FR-404** Admin không tự hạ role của chính mình; lựa chọn này bị khoá ở dòng của mình và hệ thống từ chối nếu bị gọi thẳng.
- **FR-405** Hệ thống luôn còn ít nhất một Admin; hạ Admin cuối cùng bị từ chối.
- **FR-406** Hai Admin đổi role cùng một người, hoặc hạ nhau cùng lúc, thì không lỗi, không ghi đè, và không bao giờ để hệ thống hết Admin.
- **FR-407** Khi không có người dùng phù hợp hoặc tải lỗi, hiện thông báo (kèm nút thử lại khi lỗi) thay vì bảng trắng.

### Security (6xx)

- **FR-601** Chỉ Admin vào được trang User và dùng đổi role, Export; người khác nhận trang 403.
- **FR-602** Chỉ Admin đổi được role; Sunner thường không tự nâng role mình, kể cả khi gọi thẳng vào hệ thống.
- **FR-603** Tệp Export an toàn khi mở bằng Excel: tên và email không thể chạy thành công thức.

## 5. Business Rules

- Đổi role chỉ ghi khi role hiện tại khác role đích; lệnh trùng không báo lỗi và không ghi đè người đổi trước (BR-001)
- Admin không được tự hạ role của chính mình (BR-002)
- Không được hạ Admin cuối cùng; luôn còn ít nhất một Admin, kể cả khi hai Admin thao tác cùng lúc (BR-003)
- Bảng và Export dùng cùng một bộ lọc và một thứ tự: mọi điều kiện cùng đúng, số liệu cùng nguồn (BR-004)
- Số Kudo gửi, Kudo nhận, tim và Badge tính từ Kudo Public; Un Spam thì số tự khôi phục (BR-005) [NEEDS_DOMAIN_CONFIRMATION] D002, D010
- Ô văn bản bắt đầu bằng ký tự công thức được vô hiệu hoá khi ghi vào tệp Export (BR-006)
- Menu dòng: người dùng role User có "Set as Admin"; Admin có "Set as User", khoá ở dòng của chính mình (DEC-001) [NEEDS_DOMAIN_CONFIRMATION] D007
- Export tải tệp CSV khi số dòng không vượt trần, vượt trần thì không tải và yêu cầu thu hẹp bộ lọc (DEC-002) [NEEDS_DOMAIN_CONFIRMATION] D012
- Ô "Time to get 6 Badges" hiện thời điểm khi người dùng đã đủ 6 loại icon, chưa đủ thì hiện dấu gạch (DEC-003) [NEEDS_DOMAIN_CONFIRMATION] D003
- Role của một người dùng là User hoặc Admin; User lên Admin khi Admin khác đặt, Admin về User khi qua đủ hai chốt an toàn (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Admin User | TBD (draft) — SCR026_AdminUser | Tiêu đề "User" và nút Export màu vàng, ba dropdown Unit / Level / Role, ô Search, bảng người dùng với các cột ID, User, Email, Kudo gửi, Kudo nhận, Total Heart, Level, Number of Badges, Time to get 6 Badges, Last Logged in, Role, Actions | Lọc, tìm, sắp xếp theo cột số liệu, đổi trang, mở menu "⋯" để đổi role, Export |

### User Journey

1. Admin chọn mục "User" trên menu khu Admin và thấy bảng Sunner ở Admin User.
2. Admin chọn một phòng ban ở Unit và gõ tên vào Search — bảng chỉ còn những người khớp, về trang 1.
3. Admin bấm đầu cột Number of Badges để xem ai gom được nhiều nhất.
4. Admin bấm "⋯" ở một dòng, chọn "Set as Admin" và xác nhận — cột Role của dòng đổi sang Admin.
5. Admin bấm "Export" — trình duyệt tải về tệp danh sách đang lọc.

## 7. User Stories

### US001_BrowseUserTable — Xem bảng người dùng

**Actor:** Admin
**Goal:** Xem mọi Sunner cùng số liệu tham gia trong một bảng.
**Business value:** BTC nắm được ai đang tích cực, ai chưa từng đăng nhập mà không cần truy vấn thủ công.

**Acceptance Criteria:**
- [ ] Mỗi Sunner đã có hồ sơ là một dòng với đủ các cột theo FR-201.
- [ ] Ô không có dữ liệu hiện dấu gạch.
- [ ] Không có người dùng phù hợp thì hiện thông báo trống; tải lỗi thì hiện lỗi kèm nút thử lại.

### US002_FilterSearchSortUsers — Lọc, tìm kiếm và sắp xếp người dùng

**Actor:** Admin
**Goal:** Thu hẹp bảng theo phòng ban, Level, Role, từ khoá và sắp theo một cột số liệu.
**Business value:** Tìm đúng nhóm người cần xem (ví dụ Admin của một phòng ban, người gom nhiều Badge nhất) trong vài thao tác.

**Acceptance Criteria:**
- [ ] Các điều kiện lọc và ô tìm kết hợp AND.
- [ ] Bấm đầu cột đổi thứ tự tăng/giảm; người chưa có giá trị luôn nằm cuối.
- [ ] Đổi bất kỳ điều kiện nào thì về trang 1.

### US003_ChangeUserRole — Đổi role người dùng

**Actor:** Admin
**Goal:** Cấp hoặc thu quyền Admin của một Sunner từ menu thao tác trên dòng.
**Business value:** BTC giao quyền quản trị cho đúng người mà không cần can thiệp vào cơ sở dữ liệu.

**Acceptance Criteria:**
- [ ] Menu của dòng User có "Set as Admin"; menu của dòng Admin có "Set as User".
- [ ] Lựa chọn hạ role bị khoá ở dòng của chính mình.
- [ ] Hạ Admin cuối cùng bị từ chối kèm thông báo rõ.
- [ ] Sau khi đổi, cột Role của dòng cập nhật ngay.

### US004_ExportUsers — Xuất danh sách người dùng

**Actor:** Admin
**Goal:** Tải danh sách người dùng đang lọc ra tệp để làm báo cáo.
**Business value:** BTC dùng số liệu ngoài hệ thống (Excel) mà không phải chép tay.

**Acceptance Criteria:**
- [ ] Tệp chứa toàn bộ người dùng khớp bộ lọc, theo thứ tự đang xem.
- [ ] Mở bằng Excel không vỡ tiếng Việt và không chạy công thức lạ.
- [ ] Quá trần số dòng thì không tải và hiện lỗi yêu cầu thu hẹp bộ lọc.

## 8. Scenarios

### US001_BrowseUserTable — Happy Path

**Given** hệ thống có 45 Sunner và cỡ trang 20, **When** Admin mở trang User, **Then** thấy trang 1 với 20 dòng và phân trang ba trang.

### US001_BrowseUserTable — Error: tải lỗi

**Given** máy chủ không trả được dữ liệu, **When** Admin mở trang User, **Then** thấy thông báo lỗi kèm nút thử lại thay vì bảng trắng.

### US002_FilterSearchSortUsers — Happy Path

**Given** nhiều Sunner ở nhiều phòng ban, **When** Admin chọn Unit = A, Role = Admin rồi gõ "nguyen", **Then** bảng chỉ còn Admin của phòng A có tên hoặc email chứa "nguyen", về trang 1.

### US002_FilterSearchSortUsers — Error: từ khoá quá dài

**Given** Admin gõ từ khoá quá 100 ký tự, **When** nội dung vượt giới hạn, **Then** thấy "Từ khoá tối đa 100 ký tự" và bảng không đổi.

### US003_ChangeUserRole — Happy Path

**Given** Sunner X có role User, **When** Admin chọn "Set as Admin" ở dòng X và xác nhận, **Then** cột Role của X đổi sang Admin và lần truy cập kế của X vào được khu Admin.

### US003_ChangeUserRole — Error: hạ Admin cuối cùng

**Given** chỉ còn một Admin trong hệ thống, **When** một Admin khác (đang đăng nhập) gọi hạ người đó, **Then** thấy "Không thể hạ Admin cuối cùng." và role giữ nguyên.

### US003_ChangeUserRole — Error: tự hạ mình

**Given** Admin đang xem dòng của chính mình, **When** muốn đặt mình về User, **Then** lựa chọn bị khoá kèm lời giải thích; nếu gọi thẳng vào hệ thống thì bị từ chối.

### US004_ExportUsers — Happy Path

**Given** bộ lọc cho 37 người trải trên 2 trang, **When** Admin bấm Export, **Then** tệp có đúng 37 dòng theo thứ tự đang xem.

### US004_ExportUsers — Error: quá trần

**Given** bộ lọc cho hơn 10.000 người, **When** Admin bấm Export, **Then** không có tệp và hiện "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc."

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Hai Admin cùng đặt một người làm Admin | Chỉ lần ghi đầu có hiệu lực; Admin đến sau nhận trạng thái hiện tại, không lỗi | None — dòng hiện Admin |
| Hai Admin hạ nhau cùng lúc khi chỉ có hai Admin | Hệ thống xử lý lần lượt; lần thứ hai bị từ chối vì chỉ còn một Admin | "Không thể hạ Admin cuối cùng." |
| Người dùng chưa từng đăng nhập hoặc chưa đủ 6 Badge | Ô tương ứng hiện dấu gạch; khi sắp xếp, người đó nằm cuối ở cả hai chiều | "—" |
| Không có kết quả khớp bộ lọc | Bảng thay bằng trạng thái trống | "Không có người dùng nào phù hợp bộ lọc." |
| Sunner thường mở thẳng trang User | Bị chặn trước khi lấy dữ liệu | "Bạn không có quyền truy cập trang này." |
| Admin vừa bị hạ role trong lúc đang mở trang | Lần thao tác kế bị từ chối vì hệ thống đọc lại role | "Bạn không còn quyền Admin." |
| Số dòng Export vượt trần | Không tạo tệp | "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." |

## 10. Edge Behaviours to Verify

- **FR-201** → mọi cột hiện đủ cho người đã có hồ sơ; số Kudo không tính Kudo Spam
- **FR-207** → sắp theo từng cột đúng chiều, người thiếu giá trị luôn nằm cuối, phân trang không lặp không sót
- **FR-402** → đổi lọc, tìm hoặc sắp xếp luôn về trang 1
- **FR-404** → dòng của chính mình không hạ được, cả trên giao diện lẫn khi gọi thẳng
- **FR-405** → còn một Admin thì không hạ được
- **FR-406** → hai Admin hạ nhau cùng lúc không bao giờ để hết Admin
- **FR-403** → tệp khớp từng dòng với bảng đã lọc
- **FR-601** → Sunner thường không xem, đổi role hay Export được

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Chưa chốt nguồn của Level (D001); nếu chọn nguồn không tính được ở truy vấn thì lọc và sắp xếp theo Level phải làm lại | Cột Level và bộ lọc Level chưa dùng được; các cột khác không bị ảnh hưởng | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | Mẫu thiết kế có Number of Badges = 7 trong khi tối đa 6 loại; nếu nghiệp vụ thật đếm cả icon trùng thì cột và sắp xếp phải đổi | Số Badge hiển thị khác kỳ vọng của BTC | [NEEDS_DOMAIN_CONFIRMATION] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Hồ sơ người dùng, role, phòng ban, lần đăng nhập cuối và hàm kiểm tra Admin | FR-601, FR-602 |
| F002_AppShell | feature | Khung và menu khu Admin có mục "User", trang 403 | FR-101 |
| F007_AdminModeration | feature | Trạng thái Public/Spam để loại Kudo Spam khỏi số liệu; quy ước Export dùng chung | FR-408, BR-006 |
| F005_KudosHearts | feature | Định nghĩa tổng tim cho cột Total Heart | FR-201, D010 |
| F010_SecretBoxRewards | feature | Số icon đã gom và thời điểm đủ 6 icon | FR-201, D002, D003 |
| Nguồn Level | data | Giá trị cho cột và bộ lọc Level; chưa xác định (có thể là cấp Hero của F009_HeroBadges) | D001 |

## 13. Configuration

```text
ADMIN_USER_PAGE_SIZE = 20         # số dòng mỗi trang bảng người dùng (đề xuất, D006)
EXPORT_MAX_ROWS = 10000           # trần số dòng của một lần Export, dùng chung với trang Review content (D012)
USER_SEARCH_MAX_LENGTH = 100      # độ dài tối đa của ô Search
```
