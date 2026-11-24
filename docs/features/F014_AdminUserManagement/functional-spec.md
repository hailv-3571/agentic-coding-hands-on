---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->
<!-- Nửa BA/QA của cặp spec: đọc file này là trả lời được "làm gì, ứng xử ra sao, màn hình hiện gì" mà không phải mở file khác. Chi tiết kỹ thuật (đường dẫn, trích nguồn, ghi dữ liệu) nằm ở technical-spec.md. -->

# Functional Spec — F014_AdminUserManagement

**Priority**: P2
**Type**: ui
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — điểm vào, trích nguồn, pseudocode, thực thể dữ liệu và các lần ghi cho Dev/QA/SA.

**Traceability:** F014_AdminUserManagement → SCR018_AdminUser → US009_BrowseUsers, US010_PromoteUserToAdmin, US011_DemoteAdminToUser, US012_ExportUsersCsv → ROUTE004, ROUTE032

## 1. Overview

**Problem:** BTC cần một chỗ xem toàn bộ Sunner cùng mức tham gia (Kudo gửi và nhận, tim, Level, Badge, lần đăng nhập cuối) và cần cấp hoặc thu quyền Admin mà không phải sửa tay trong cơ sở dữ liệu; nếu giao quyền sai hoặc hết Admin thì không còn ai vào được khu Admin để quản lý sự kiện.
**Solution:** Admin có trang "User": bảng Sunner 20 dòng mỗi trang, lọc theo phòng ban, Level, Role, ô tìm theo tên hoặc email, sắp xếp theo các cột số liệu; mỗi dòng có menu "⋯" để đổi role sau khi xác nhận (kèm các chốt an toàn); và nút Export tải CSV đúng danh sách đang lọc. Bộ lọc nằm trên địa chỉ trang nên tải lại hoặc gửi link cho người khác ra cùng kết quả.
**Scope:** Bảng người dùng của Admin (cột, lọc, tìm, sắp xếp, phân trang, trạng thái trống và lỗi); đổi role User và Admin qua hộp xác nhận với các chốt: không tự hạ mình, luôn còn ít nhất một Admin, không hạ Admin cấu hình sẵn; ghi lại Admin và thời điểm của lần đổi role gần nhất; Export CSV của danh sách đang lọc.
**Non-Scope:** Đăng nhập, tạo hồ sơ, kiểm tra role Admin và việc đặt Admin theo danh sách cấu hình sẵn (F001_Auth); khung và menu khu Admin, trang 403 (F002_AppShell); trạng thái Public hay Spam của Kudo (F007_AdminModeration), cách đếm tim (F005_KudosHearts), cách tính hạng Hero (F009_HeroBadges), Badge và thời điểm đủ 6 icon (F010_SecretBoxRewards) — F014 chỉ đọc các số liệu này; tạo Admin đầu tiên, vô hiệu hoá hay xoá tài khoản, sửa tên, email, phòng ban của người dùng, lịch sử đầy đủ mọi lần đổi role; số liệu theo đơn vị (F015_AdminOverview).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Admin | Sunner có role Admin | Tra cứu người dùng và mức tham gia, cấp hoặc thu quyền Admin, xuất danh sách cho BTC |
| Sunner thường | Nhân viên đã đăng nhập, role User (hoặc khách chưa đăng nhập) | Không dùng được trang này; mở thẳng thì nhận trang 403, khách thì được chuyển về trang đăng nhập |

Feature này chưa tham gia luồng liên-feature nào được ghi trong thư mục luồng của tài liệu (hiện chưa có luồng nào); các feature khác chỉ cung cấp số liệu để bảng hiển thị.

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | View, filter, search and sort users | Xem bảng Sunner kèm số liệu tham gia, lọc theo Unit, Level, Role, tìm theo tên hoặc email, sắp theo cột số liệu, chuyển trang; trạng thái nằm trên địa chỉ trang | US009_BrowseUsers | FR-101, FR-102, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-207, FR-208, FR-210, FR-402, FR-407, FR-408, FR-409, FR-601 | BR-004, BR-005, BR-008, BR-009, DEC-003, DEC-004 | SCR018_AdminUser |
| CAP-02 | Change a user's role | Mở menu "⋯" ở dòng, chọn "Set as Admin" hoặc "Set as User", xác nhận trong hộp thoại và thấy kết quả ngay trên dòng; bị chặn khi vi phạm các chốt an toàn | US010_PromoteUserToAdmin, US011_DemoteAdminToUser | FR-001, FR-002, FR-209, FR-401, FR-404, FR-405, FR-406, FR-410, FR-411, FR-602 | BR-001, BR-002, BR-003, BR-007, DEC-001, DEC-005, SM-001, SM-002 | N/A — dùng chung màn hình đã nêu ở CAP-01 |
| CAP-03 | Export the filtered user list | Tải tệp CSV gồm mọi Sunner đang khớp bộ lọc, theo đúng thứ tự đang xem | US012_ExportUsersCsv | FR-403, FR-603, FR-604 | BR-006, DEC-002 | N/A — dùng chung màn hình đã nêu ở CAP-01 |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Câu thông báo khi từ chối hạ Admin cấu hình sẵn và nhãn "Admin · env" trên dòng có dùng đúng chữ BTC muốn không? (chính sách chặn đã được chốt; chỉ còn chữ) | Giữ nguyên: nhãn "Admin · env" và câu nhắc gỡ email khỏi danh sách Admin cấu hình sẵn trước khi hạ role | Chính sách đã chốt nên chỉ đổi chữ khi BTC có yêu cầu; không ảnh hưởng hành vi | no |
| D002 | Tiêu đề cột của tệp Export người dùng viết bằng tiếng Anh hay tiếng Việt? Hiện tệp này dùng tiếng Anh còn tệp Export của trang Review content dùng tiếng Việt | Giữ tiếng Anh, cùng nhãn với bảng | Cột và nhãn lấy thẳng từ bảng; chờ BTC chốt một ngôn ngữ chung cho các tệp Export | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi người dùng luôn có đúng một trong hai role: User hoặc Admin; hồ sơ mới mặc định là User.
- **FR-002** Hệ thống ghi lại Admin nào và lúc nào đã đổi role gần nhất của người dùng; không giữ lịch sử các lần đổi trước đó.

### Navigation (1xx)

- **FR-101** Admin vào trang User từ mục "User" trên menu khu Admin.
- **FR-102** Bộ lọc, từ khoá, cột sắp xếp và trang hiện tại nằm trên địa chỉ trang; tải lại hoặc chia sẻ đường dẫn thì ra cùng kết quả.

### Admin User screen (2xx)

- **FR-201** Bảng liệt kê mọi người dùng có hồ sơ; mỗi dòng có ID rút gọn (8 ký tự đầu), tên, email, số Kudo gửi, số Kudo nhận, tổng tim, Level, số Badge, thời điểm đủ 6 Badge, lần đăng nhập cuối, role và nút thao tác; ngày giờ dạng ngày/tháng/năm giờ:phút theo múi giờ Admin.
- **FR-202** Bảng hiện 20 dòng mỗi trang với phân trang đánh số (ẩn khi chỉ có một trang); địa chỉ có trang vượt cuối thì hiện trang cuối.
- **FR-203** Admin lọc theo phòng ban (Unit) bằng dropdown, có "Tất cả" và "Chưa gán đơn vị".
- **FR-204** Admin lọc theo Level bằng dropdown gồm "Tất cả", bốn hạng Hero và "Chưa có Level".
- **FR-205** Admin lọc theo Role (Admin hoặc User) bằng dropdown.
- **FR-206** Admin tìm theo tên hoặc email bằng ô Search: không phân biệt hoa thường và dấu tiếng Việt, tối đa 100 ký tự, tự áp dụng sau khi ngừng gõ khoảng 0,3 giây hoặc khi nhấn Enter.
- **FR-207** Admin sắp xếp tăng hoặc giảm bằng cách bấm đầu cột Kudo gửi, Kudo nhận, Total Heart, Level, Number of Badges, Time to get 6 Badges hoặc Last Logged in; cột mới bắt đầu từ giá trị lớn nhất, bấm lại thì đảo chiều.
- **FR-208** Ô chưa có giá trị (chưa có Level, chưa đủ 6 Badge, chưa từng đăng nhập) hiện dấu gạch, không để trống.
- **FR-209** Mỗi dòng có nút "⋯" mở menu đổi role phù hợp với role hiện tại của dòng.
- **FR-210** Tiêu đề hai cột Kudo gửi và Kudo nhận kèm tổng của toàn bộ kết quả đang lọc, không chỉ của trang đang xem.

### Interaction (4xx)

- **FR-401** Sau khi đổi role thành công, dòng cập nhật cột Role ngay mà không tải lại trang, kèm thông báo thành công.
- **FR-402** Đổi bất kỳ điều kiện lọc, từ khoá hay cột sắp xếp nào thì bảng về trang 1 và áp mọi điều kiện cùng lúc.
- **FR-403** Export tải về tệp CSV gồm toàn bộ người dùng khớp bộ lọc hiện tại theo đúng thứ tự đang xem, không chỉ trang đang xem.
- **FR-404** Admin không tự hạ role của chính mình: nút ở dòng của mình bị khoá kèm lời giải thích, và hệ thống từ chối nếu bị gọi thẳng.
- **FR-405** Hệ thống luôn còn ít nhất một Admin; hạ Admin cuối cùng bị từ chối.
- **FR-406** Hai Admin đổi role cùng một người, hoặc hạ nhau cùng lúc, thì không ghi đè lẫn nhau và không bao giờ để hệ thống hết Admin.
- **FR-407** Không có người dùng khớp thì hiện thông báo trống (kèm "Xoá bộ lọc" khi đang lọc); tải bảng lỗi thì hiện thông báo lỗi kèm nút thử lại; chỉ riêng lỗi nạp danh sách phòng ban thì dropdown Unit hết lựa chọn nhưng bảng vẫn dùng được.
- **FR-408** Số Kudo gửi, Kudo nhận và tim trong bảng và trong tệp Export chỉ tính Kudo đang Public; Kudo Spam không được tính và được tính lại khi bỏ Spam.
- **FR-409** Địa chỉ trang có tham số sai (từ khoá quá 100 ký tự, lặp tham số, giá trị lạ) thì hiện thông báo lỗi lọc và bảng là trang 1 chưa lọc.
- **FR-410** Tài khoản nằm trong danh sách Admin cấu hình sẵn không hạ được từ giao diện (đăng nhập sẽ đặt lại thành Admin): dòng có nhãn "Admin · env", mục "Set as User" bị khoá kèm lời giải thích, và hệ thống từ chối nếu bị gọi thẳng.
- **FR-411** Đổi role luôn qua hộp xác nhận nêu tên và email người đó; trong lúc lưu hai nút bị khoá, và khi bị từ chối thì lý do hiện ngay trong hộp, hộp không đóng.

### Security (6xx)

- **FR-601** Chỉ Admin vào được trang User; Sunner thường nhận trang 403 và khách được chuyển về trang đăng nhập.
- **FR-602** Chỉ Admin đổi được role; người thực hiện luôn lấy từ phiên đăng nhập chứ không từ dữ liệu gửi lên, và quyền Admin được kiểm lại từ cơ sở dữ liệu ở mỗi lần thao tác.
- **FR-603** Tệp Export an toàn khi mở bằng Excel: tên và email không thể chạy thành công thức, tiếng Việt không bị vỡ.
- **FR-604** Export từ chối người chưa đăng nhập hoặc không phải Admin trước khi đọc bất kỳ tham số nào, và câu trả lời không được lưu đệm.

## 5. Business Rules

- Đổi role chỉ ghi khi role hiện tại khác role đích; lệnh trùng không báo lỗi và không ghi đè người đổi trước (BR-001)
- Admin không được tự hạ role của chính mình, kể cả khi còn nhiều Admin khác (BR-002)
- Luôn còn ít nhất một Admin; số Admin được đếm sau khi khoá nên hai Admin hạ nhau cùng lúc cũng không để hệ thống hết Admin (BR-003)
- Bảng và Export dùng chung một bộ lọc (mọi điều kiện cùng đúng) và một thứ tự; mặc định theo tên A–Z, bằng nhau thì theo mã người dùng (BR-004)
- Số Kudo gửi, Kudo nhận và tim chỉ tính Kudo Public tại lúc xem; Kudo ẩn danh vẫn tính cho người gửi thật (BR-005)
- Ô văn bản trong Export bắt đầu bằng ký tự công thức được vô hiệu hoá bằng dấu nháy đơn đứng đầu (BR-006)
- Tài khoản trong danh sách Admin cấu hình sẵn không hạ được từ giao diện, vì mỗi lần đăng nhập hệ thống lại đặt thành Admin (BR-007)
- Level là hạng Hero tính theo số người gửi Kudo Public khác nhau mà người đó nhận được (New từ 1, Rising từ 5, Super từ 10, Legend từ 21); chưa có hạng thì hiện dấu gạch (BR-008)
- Total Heart là số lượt tim thô mà các Kudo Public người đó đã gửi nhận được, không nhân hệ số chiến dịch; Number of Badges là số loại icon khác nhau họ đang có, từ 0 đến 6 (BR-009)
- Menu dòng: dòng của chính mình không có menu, dòng User có "Set as Admin", dòng Admin khác có "Set as User" (khoá nếu là Admin cấu hình sẵn) (DEC-001)
- Export tải tệp khi số dòng khớp không vượt trần; vượt trần thì không tải tệp và báo thu hẹp bộ lọc; lỗi khác thì báo không xuất được (DEC-002)
- Bảng có ba trạng thái thay cho các dòng: thông báo lỗi kèm thử lại, thông báo trống (kèm "Xoá bộ lọc" khi đang lọc) hoặc danh sách; lỗi nạp danh sách phòng ban chỉ làm trống dropdown Unit (DEC-003)
- Tham số lọc sai thì hiện thông báo tương ứng và bảng quay về trang 1 chưa lọc thay vì trang lỗi trắng (DEC-004)
- Sau khi xác nhận đổi role: thành công thì đóng hộp, đổi ô Role và báo thành công; bị từ chối thì hiện đúng lý do trong hộp và giữ hộp mở (DEC-005)
- Role của người dùng là User hoặc Admin; User lên Admin khi một Admin đặt (hoặc khi đăng nhập bằng email cấu hình sẵn), Admin về User chỉ khi qua đủ ba chốt an toàn (SM-001)
- Đổi role trên giao diện đi qua các bước mở menu, chọn mục, xác nhận, lưu; Huỷ hoặc Esc quay về, bị từ chối thì quay lại bước xác nhận kèm lý do (SM-002)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Admin User | SCR018_AdminUser | Tiêu đề "User" và nút Export màu vàng; ba dropdown Unit, Level, Role và ô Search; bảng người dùng gồm ID, User, Email, tổng Kudo gửi và nhận (kèm tổng của bộ lọc), Total Heart, Level, Number of Badges, Time to get 6 Badges, Last Logged in, Role (nhãn "Admin · env" cho Admin cấu hình sẵn) và nút "⋯"; phân trang đánh số; thông báo lỗi lọc, trạng thái trống hoặc lỗi khi có | Lọc, tìm, sắp xếp theo cột số liệu, chuyển trang, xoá bộ lọc; mở menu "⋯" để đổi role qua hộp xác nhận; bấm Export để tải CSV |

### User Journey

1. Admin chọn mục "User" trên menu khu Admin và thấy bảng Sunner ở Admin User, mặc định theo tên A–Z.
2. Admin chọn một phòng ban ở Unit và gõ một phần tên vào Search — bảng chỉ còn những người khớp cả hai điều kiện, về trang 1, và địa chỉ trang đổi theo.
3. Admin bấm đầu cột Number of Badges để xem ai gom được nhiều nhất; bấm lại để đảo chiều.
4. Admin bấm "⋯" ở dòng một Sunner, chọn "Set as Admin" và xác nhận trong hộp thoại — cột Role của dòng đổi sang Admin ngay, kèm thông báo thành công.
5. Admin thử hạ Admin cuối cùng và thấy lý do từ chối ngay trong hộp, hộp vẫn mở để huỷ.
6. Admin bấm Export — trình duyệt tải về tệp CSV của đúng danh sách đang lọc.

## 7. User Stories

### US009_BrowseUsers — Browse Users

**Actor:** Admin
**Goal:** Duyệt bảng Sunner kèm số liệu tham gia, lọc, tìm và sắp xếp để theo dõi mức hoạt động và vai trò của từng người.
**Business value:** BTC nắm được ai đang tích cực, ai chưa từng đăng nhập, ai là Admin của phòng nào mà không cần truy vấn thủ công.

**Acceptance Criteria:**
- [ ] Bảng 20 dòng mỗi trang, mặc định theo tên A–Z, đủ các cột theo FR-201; ngày giờ theo múi giờ Admin.
- [ ] Ba dropdown Unit, Level, Role (mỗi danh sách bắt đầu bằng "Tất cả") và ô Search kết hợp AND; ô Search tối đa 100 ký tự và áp dụng sau khi ngừng gõ hoặc khi nhấn Enter.
- [ ] Sắp xếp được theo bảy cột số liệu; cột mới bắt đầu giảm dần, bấm lại thì đảo chiều.
- [ ] Mọi thay đổi trừ đổi trang đều về trang 1; địa chỉ trang giữ toàn bộ trạng thái và trang vượt cuối được kéo về trang cuối.
- [ ] Tham số sai hiện lỗi lọc trên trang 1 chưa lọc; lỗi nạp phòng ban chỉ làm trống dropdown Unit; lỗi nạp bảng hiện thông báo kèm nút thử lại; không có dòng thì hiện thông báo trống kèm "Xoá bộ lọc" khi đang lọc.

### US010_PromoteUserToAdmin — Promote User To Admin

**Actor:** Admin
**Goal:** Nâng một Sunner lên Admin để người đó dùng được khu Admin.
**Business value:** BTC giao quyền quản trị đúng người mà không cần can thiệp vào cơ sở dữ liệu.

**Acceptance Criteria:**
- [ ] Dòng của Sunner role User (không phải dòng của mình) có nút "⋯" mở menu một mục "Set as Admin"; chọn mục mở hộp xác nhận nêu tên và email, có "Xác nhận" và "Huỷ", "Huỷ" giữ focus ban đầu.
- [ ] Esc hoặc "Huỷ" đóng hộp mà không ghi gì; trong lúc lưu cả hai nút bị khoá kèm trạng thái chờ và Esc không đóng hộp.
- [ ] Xác nhận thành công thì đóng hộp, ô Role của dòng đổi sang Admin ngay, hiện thông báo thành công; số liệu và bộ lọc Role khớp lại sau khi trang làm mới.
- [ ] Người đã là Admin thì được báo trạng thái hiện tại và không ghi lần hai; không thấy người dùng hoặc người thao tác đã bị hạ thì hiện lỗi trong hộp và hộp ở lại.
- [ ] Role mới có hiệu lực từ lần truy cập kế tiếp của người được nâng.

### US011_DemoteAdminToUser — Demote Admin To User

**Actor:** Admin
**Goal:** Hạ một Admin khác xuống User để thu hồi quyền vào khu Admin của người đó.
**Business value:** BTC thu hồi quyền kịp thời mà vẫn bảo đảm luôn còn người quản lý hệ thống.

**Acceptance Criteria:**
- [ ] Dòng Admin khác có menu một mục "Set as User"; chọn mục mở hộp xác nhận giống Promote.
- [ ] Dòng của chính mình: nút "⋯" bị khoá kèm chú thích, không có menu.
- [ ] Dòng Admin cấu hình sẵn có nhãn "Admin · env": mục "Set as User" hiện nhưng bị khoá kèm chú thích, chọn không mở hộp.
- [ ] Server từ chối theo thứ tự: tự hạ mình (kể cả khi còn Admin khác), tài khoản cấu hình sẵn, Admin cuối cùng, người thao tác đã bị hạ giữa chừng; lý do hiện trong hộp và hộp ở lại.
- [ ] Hai Admin hạ nhau cùng lúc: người thứ hai bị từ chối vì Admin cuối cùng, hệ thống không bao giờ về 0 Admin.
- [ ] Thành công thì dòng đổi sang User kèm thông báo; người bị hạ mất quyền vào khu Admin từ lần truy cập kế tiếp.

### US012_ExportUsersCsv — Export Users Csv

**Actor:** Admin
**Goal:** Xuất danh sách Sunner theo bộ lọc đang chọn ra tệp CSV để lập báo cáo hoạt động ngoài hệ thống.
**Business value:** BTC dùng số liệu trong Excel mà không phải chép tay từng trang.

**Acceptance Criteria:**
- [ ] Tệp chứa mọi Sunner khớp bộ lọc và thứ tự đang hiện, bỏ qua phân trang.
- [ ] Tối đa 10.000 dòng; thừa thì không có tệp và hiện thông báo thu hẹp bộ lọc.
- [ ] Tên tệp có ngày giờ theo múi giờ Admin; mở bằng Excel không vỡ tiếng Việt và không chạy công thức lạ.
- [ ] Tệp có mười một cột như bảng (trừ cột thao tác), ID là mã đầy đủ, Level ghi tên hạng Hero, ô trống của bảng để trống trong tệp.
- [ ] Tham số mà bảng từ chối thì Export cũng từ chối; chưa đăng nhập hoặc không phải Admin thì không nhận được tệp.

## 8. Scenarios

### US009_BrowseUsers — Happy Path

**Given** hệ thống có 45 Sunner và cỡ trang 20, **When** Admin mở trang User, **Then** thấy trang 1 với 20 dòng theo tên A–Z và phân trang ba trang.

### US009_BrowseUsers — Happy Path: lọc, tìm và sắp xếp

**Given** Sunner ở nhiều phòng ban và role, **When** Admin chọn Unit, gõ một phần email rồi bấm đầu cột Total Heart, **Then** bảng chỉ còn người khớp cả hai điều kiện, sắp giảm dần theo tim, về trang 1, và địa chỉ trang giữ đủ ba điều kiện.

### US009_BrowseUsers — Error: từ khoá quá dài

**Given** Admin mở trang với từ khoá dài hơn 100 ký tự, **When** trang tải, **Then** thấy "Từ khoá tối đa 100 ký tự" phía trên bảng chưa lọc ở trang 1.

### US009_BrowseUsers — Error: tải bảng lỗi

**Given** máy chủ không đọc được bảng, **When** Admin mở trang User, **Then** thấy "Không tải được danh sách người dùng. Vui lòng thử lại." kèm nút "Thử lại" thay vì bảng trắng.

### US010_PromoteUserToAdmin — Happy Path

**Given** Sunner X có role User, **When** Admin chọn "Set as Admin" ở dòng X rồi bấm "Xác nhận", **Then** hộp đóng, cột Role của X đổi sang Admin, hiện "Đã đặt X làm Admin." và lần truy cập kế của X vào được khu Admin.

### US010_PromoteUserToAdmin — Error: người thao tác đã bị hạ

**Given** Admin vừa bị Admin khác hạ role trong lúc đang mở hộp, **When** bấm "Xác nhận", **Then** thấy "Bạn không còn quyền Admin." trong hộp và role của người kia không đổi.

### US010_PromoteUserToAdmin — Edge: đã là Admin

**Given** người đó vừa được Admin khác nâng, **When** Admin này bấm "Xác nhận", **Then** hộp đóng, dòng hiện Admin và không có lần ghi thứ hai.

### US011_DemoteAdminToUser — Happy Path

**Given** có hai Admin và Admin kia không thuộc danh sách cấu hình sẵn, **When** Admin chọn "Set as User" rồi "Xác nhận", **Then** dòng đổi sang User, hiện "Đã đặt tên người đó làm User." và người đó vào khu Admin nhận trang 403.

### US011_DemoteAdminToUser — Error: Admin cuối cùng

**Given** chỉ còn một Admin trong hệ thống, **When** một người thao tác gọi hạ người đó, **Then** thấy "Không thể hạ Admin cuối cùng." trong hộp và role giữ nguyên.

### US011_DemoteAdminToUser — Error: tự hạ mình hoặc Admin cấu hình sẵn

**Given** Admin xem dòng của chính mình hoặc dòng Admin cấu hình sẵn, **When** muốn hạ, **Then** nút hoặc mục bị khoá kèm lời giải thích; nếu gọi thẳng vào hệ thống thì bị từ chối với "Bạn không thể tự hạ role của mình." hoặc câu nhắc gỡ email khỏi danh sách cấu hình sẵn.

### US011_DemoteAdminToUser — Edge: hai Admin hạ nhau

**Given** chỉ có hai Admin, **When** mỗi người hạ người kia cùng lúc, **Then** đúng một thao tác thành công, người còn lại nhận "Không thể hạ Admin cuối cùng." và vẫn còn một Admin.

### US012_ExportUsersCsv — Happy Path

**Given** bộ lọc cho 37 người trải trên 2 trang, **When** Admin bấm Export, **Then** trình duyệt tải một tệp CSV có đúng 37 dòng dữ liệu theo thứ tự đang xem.

### US012_ExportUsersCsv — Error: quá trần

**Given** bộ lọc cho hơn 10.000 người, **When** Admin bấm Export, **Then** không có tệp và hiện "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc."

### US012_ExportUsersCsv — Edge: ô trống

**Given** một Sunner chưa có Level và chưa từng đăng nhập, **When** mở tệp, **Then** hai ô Level và Last Logged in để trống chứ không ghi dấu gạch.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Hai Admin cùng đặt một người làm Admin | Chỉ lần ghi đầu có hiệu lực; Admin đến sau nhận trạng thái hiện tại, không lỗi | None — dòng hiện Admin |
| Hai Admin hạ nhau cùng lúc khi chỉ có hai Admin | Hệ thống xử lý lần lượt; lần thứ hai bị từ chối vì chỉ còn một Admin | "Không thể hạ Admin cuối cùng." |
| Admin tự hạ chính mình bằng cách gọi thẳng vào hệ thống | Bị từ chối kể cả khi còn nhiều Admin; trên giao diện nút đã khoá sẵn | "Bạn không thể tự hạ role của mình." |
| Hạ tài khoản trong danh sách Admin cấu hình sẵn | Bị từ chối vì đăng nhập sẽ đặt lại thành Admin; trên giao diện mục đã khoá sẵn | "Admin được cấu hình qua ADMIN_EMAILS. Hãy gỡ email khỏi ADMIN_EMAILS trước khi hạ role." |
| Admin vừa bị hạ role trong lúc đang mở trang | Lần thao tác kế bị từ chối vì hệ thống đọc lại role; không ghi gì | "Bạn không còn quyền Admin." |
| Người dùng đã bị xoá trong lúc hộp xác nhận đang mở | Không ghi gì, hộp ở lại | "Người dùng này không còn tồn tại." |
| Không lưu được role vì lỗi bất ngờ hoặc mất mạng | Không ghi gì, hộp ở lại để thử lại | "Không cập nhật được role. Vui lòng thử lại." |
| Tham số trên địa chỉ trang sai (từ khoá quá 100 ký tự, lặp khoá, giá trị lạ) | Bảng quay về trang 1 chưa lọc | "Từ khoá tối đa 100 ký tự" hoặc "Bộ lọc không hợp lệ, đang hiện tất cả người dùng." |
| Địa chỉ có số trang vượt tổng số trang | Hiện trang cuối | None — phân trang chuyển sang trang cuối |
| Không có người dùng nào khớp bộ lọc | Bảng thay bằng trạng thái trống, có nút "Xoá bộ lọc" khi đang lọc | "Không có người dùng nào phù hợp bộ lọc." |
| Tải bảng lỗi | Hiện thông báo lỗi kèm nút thử lại thay cho bảng | "Không tải được danh sách người dùng. Vui lòng thử lại." |
| Tải danh sách phòng ban lỗi | Dropdown Unit chỉ còn "Tất cả" và "Chưa gán đơn vị"; bảng vẫn dùng được | None — chỉ dropdown Unit hết phòng ban |
| Người chưa từng đăng nhập, chưa đủ 6 Badge hoặc chưa có Level | Ô hiện dấu gạch (để trống trong tệp Export); khi sắp xếp hai cột thời gian, ô trống luôn nằm cuối ở cả hai chiều | "—" |
| Sắp xếp theo Level tăng dần | Người chưa có hạng đứng đầu vì được tính là chưa có người gửi nào | None — sắp xếp như số |
| Kudo bị đánh dấu Spam rồi bỏ Spam | Số gửi, nhận, tim và Level giảm rồi khôi phục theo lần xem kế tiếp; số Badge không đổi | None — số tự cập nhật |
| Số dòng Export vượt trần | Không tạo tệp | "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." |
| Tên hoặc email bắt đầu bằng ký tự công thức hoặc chứa dấu phẩy, nháy kép | Ô được vô hiệu hoá công thức bằng dấu nháy đơn đứng đầu; ô có dấu phẩy hoặc nháy kép được bọc nháy kép | None — tệp mở an toàn |
| Sunner thường mở thẳng trang User, gọi đổi role hoặc Export | Bị chặn trước khi lấy dữ liệu, dữ liệu không đổi | "Không có quyền truy cập" / "Bạn không có quyền truy cập tài nguyên này." |

## 10. Edge Behaviours to Verify

- **FR-201** → mọi cột hiện đủ cho người đã có hồ sơ; số Kudo không tính Kudo Spam; ô chưa có giá trị hiện dấu gạch
- **FR-207** → sắp theo từng cột đúng chiều, hai cột thời gian đặt ô trống cuối ở cả hai chiều, phân trang không lặp không sót
- **FR-402** → đổi lọc, tìm hoặc sắp xếp luôn về trang 1 và địa chỉ trang đổi theo
- **FR-204** → lọc từng hạng Hero và "Chưa có Level" ra đúng tập người theo số người gửi khác nhau
- **FR-404** → dòng của chính mình không hạ được, cả trên giao diện lẫn khi gọi thẳng
- **FR-405** → còn một Admin thì không hạ được
- **FR-406** → hai Admin hạ nhau cùng lúc không bao giờ để hết Admin
- **FR-410** → Admin cấu hình sẵn không hạ được từ giao diện, cả khi gọi thẳng
- **FR-411** → hộp xác nhận khoá hai nút khi đang lưu, hiện đúng lý do khi bị từ chối và không đóng
- **FR-403** → tệp khớp từng dòng và thứ tự với bảng đã lọc, mở bằng Excel không vỡ tiếng Việt
- **FR-603** → ô bắt đầu bằng ký tự công thức không chạy thành công thức khi mở tệp
- **FR-601** → Sunner thường không xem được trang, đổi role hay Export, khách bị chuyển về trang đăng nhập
- **FR-604** → Export của người chưa đăng nhập hoặc không phải Admin bị từ chối trước khi đọc tham số

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | known-issue | Người thao tác đã bị hạ giữa chừng có thể nhận kết quả khác "không còn quyền Admin": nếu role người đích đã đúng thì được báo thành công không ghi gì, nếu người đích là Admin cấu hình sẵn hoặc Admin cuối cùng thì nhận lý do tương ứng trước | Chỉ lệch thông báo, không ghi được gì; thứ tự này đảm bảo bên thua khi hai Admin hạ nhau nhận "Admin cuối cùng" | confirmed |
| RISK-02 | risk | Export người dùng chỉ được chặn bởi kiểm tra bên trong chính điểm vào; cổng chung của khu Admin không phủ đường dẫn xuất | Nếu kiểm tra này bị sửa mất thì Sunner thường tải được tên, email và mức tham gia của mọi Sunner | confirmed |
| RISK-03 | risk | Mỗi lần mở trang hoặc Export đều đọc lại toàn bộ lượt tim của Kudo Public và cần cấu hình riêng kế hoạch truy vấn để không chậm; chi phí tăng tuyến tính theo dữ liệu | Trang User và Export chậm khi dữ liệu lớn gấp nhiều lần hiện tại | [INFERRED] |
| RISK-04 | risk | Chỉ lưu Admin và thời điểm của lần đổi role gần nhất, không có lịch sử | Không dựng lại được chuỗi cấp và thu quyền Admin khi cần truy vết | confirmed |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Hồ sơ người dùng, role, phòng ban, lần đăng nhập cuối, kiểm tra Admin ở mỗi thao tác và việc đặt lại Admin theo danh sách cấu hình sẵn mỗi lần đăng nhập | FR-601, FR-602, BR-007 |
| F002_AppShell | feature | Khung và menu khu Admin có mục "User", trang 403 | FR-101, FR-601 |
| F003_KudosAuthoring | feature | Kudo là nguồn của số Kudo gửi, nhận và số người gửi khác nhau | FR-201, BR-005 |
| F005_KudosHearts | feature | Cách đếm lượt tim cho cột Total Heart | BR-009 |
| F007_AdminModeration | feature | Trạng thái Public hoặc Spam để loại Kudo Spam; nút Export, phân trang, ô tìm kiếm và bảng lỗi dùng chung của khu Admin | FR-408, FR-403 |
| F009_HeroBadges | feature | Hạng Hero và ngưỡng của từng hạng cho cột và bộ lọc Level | FR-204, BR-008 |
| F010_SecretBoxRewards | feature | Số loại icon đã gom và thời điểm đủ 6 icon | FR-201, BR-009 |
| F011_AdminCampaigns | feature | Khung hộp thoại, thông báo nhanh và kiểu nút dùng chung cho hộp xác nhận | FR-401, FR-411 |
| Danh sách Admin cấu hình sẵn | config | Xác định tài khoản không hạ được từ giao diện | FR-410, BR-007 |
| Trần dòng Export và múi giờ Admin | config | Giới hạn kích thước tệp và cách hiển thị ngày giờ trong bảng và tệp | DEC-002, FR-201 |
| Hàm bỏ dấu tiếng Việt của cơ sở dữ liệu | infrastructure | Tìm theo tên hoặc email không phân biệt dấu | FR-206 |

## 13. Configuration

```text
ADMIN_USER_PAGE_SIZE = 20          # số dòng mỗi trang của bảng người dùng
USER_SEARCH_MAX_LENGTH = 100       # độ dài tối đa của ô Search (ký tự)
SEARCH_DEBOUNCE_MS = 300           # ô Search tự áp dụng sau khi ngừng gõ chừng này mili giây
EXPORT_MAX_ROWS = 10000            # trần số dòng của một lần Export, dùng chung với các Export khác của khu Admin
ADMIN_TIMEZONE = Asia/Ho_Chi_Minh  # múi giờ hiển thị ngày giờ trong bảng và tên tệp Export
ADMIN_EMAILS = (danh sách email)   # tài khoản luôn là Admin và không hạ được từ giao diện; do vận hành đặt
```
