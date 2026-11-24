---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->
<!-- Nửa BA/QA của cặp spec: đọc file này là trả lời được "làm gì, ứng xử ra sao, màn hình hiện gì" mà không phải mở file khác. Chi tiết kỹ thuật (đường dẫn, trích nguồn, ghi dữ liệu) nằm ở technical-spec.md. -->

# Functional Spec — F002_AppShell

**Priority**: P0
**Type**: ui
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — luồng xử lý từng action, trích nguồn, thiết kế dữ liệu, cấu hình kỹ thuật cho Dev/QA/SA.

**Traceability:** F002_AppShell → SCR002_AdminLayout, SCR003_AppLayout, SCR004_Error403, SCR005_Error404 → US001_NavigateAdminSections, US002_OpenAdminDashboard, US017_ReturnToLoginFromNotFound, US020_SwitchLanguage, US021_NavigateSunnerPages, US022_ReturnHomeFromErrorPage → ROUTE036

## 1. Overview

**Problem:** Mọi trang sau đăng nhập cần cùng một khung: điều hướng, đổi ngôn ngữ, menu tài khoản, và trang báo lỗi khi vào sai chỗ hoặc thiếu quyền. Nếu mỗi tính năng tự dựng thì giao diện lệch nhau, và khu Admin có nguy cơ lộ phần giao diện quản trị cho người không phải admin.
**Solution:** Một khung dùng chung cho khu Sunner (header, footer, chuông thông báo, thông báo gửi Kudo), một khung riêng cho khu Admin (thanh trên mang nhãn ADMIN, bốn mục menu), nút đổi ngôn ngữ Tiếng Việt / English, menu tài khoản, và hai trang lỗi dùng chung cho cả hai khu: không có quyền (403) và không tìm thấy (404). Khung chỉ chứa phần dùng chung, không chứa nội dung nghiệp vụ của trang nào.
**Scope:** Điều hướng chính và footer của khu Sunner; menu thu gọn trên màn hình nhỏ; menu tài khoản (Profile, Dashboard cho admin, Logout); đổi và nhớ ngôn ngữ; khung Admin; cổng chặn trước khi khung hiện; hai trang lỗi.
**Non-Scope:** Đăng nhập, đăng xuất, tạo phiên và kiểm tra quyền (F001_Auth). Nội dung chuông và danh sách thông báo (F013_Notifications). Hộp thoại viết Kudo (F003_KudosAuthoring). Nội dung các trang nằm trong khung. Nút nổi viết Kudo trên Homepage (xem D001). Ngôn ngữ thứ ba ngoài Tiếng Việt và English.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên Sun* đã đăng nhập và đã chọn đơn vị | Đi tới các trang chính, đổi ngôn ngữ, mở menu tài khoản, quay về trang chủ khi gặp trang lỗi |
| Admin | Sunner có thêm role quản trị | Vào khu Admin, chuyển giữa các mục quản trị, quay về khu Sunner |
| Khách | Người chưa có phiên đăng nhập | Đổi ngôn ngữ ở trang đăng nhập và đếm ngược; được đưa về đăng nhập khi vào trang cần phiên |

Feature này chưa tham gia luồng liên-feature nào được ghi trong thư mục luồng của tài liệu (hiện chưa có luồng nào).

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Điều hướng khung Sunner | Đi tới About SAA 2025, Award Information, Sun* Kudos từ header; dùng menu thu gọn trên màn nhỏ; mở Thể lệ và Tiêu chuẩn chung từ footer; chưa đăng nhập hoặc chưa chọn đơn vị thì được đưa về đúng bước | US021_NavigateSunnerPages | FR-101, FR-102, FR-103, FR-104, FR-105, FR-203 | BR-003, DEC-001 | SCR003_AppLayout |
| CAP-02 | Menu tài khoản | Mở menu avatar để vào Profile, vào Dashboard của khu Admin (chỉ admin thấy) hoặc đăng xuất | US002_OpenAdminDashboard | FR-201, FR-601 | BR-002, DEC-006 | N/A — menu này nằm trong cả khung Sunner và khung Admin, màn hình được tính ở CAP-01 và CAP-04 |
| CAP-03 | Đổi ngôn ngữ | Chọn Tiếng Việt hoặc English, toàn bộ giao diện đổi ngay và được nhớ cho lần sau; ngôn ngữ ban đầu theo trình duyệt | US020_SwitchLanguage | FR-001, FR-002, FR-202, FR-401 | BR-001, BR-005, DEC-005 | N/A — nút đổi ngôn ngữ nằm trong mọi khung, màn hình được tính ở CAP-01 và CAP-04 |
| CAP-04 | Khung Admin | Chuyển giữa Overview, Review content, User, Settings; quay về khu Sunner bằng logo ADMIN; người không phải admin không bao giờ nhận phần giao diện này | US001_NavigateAdminSections | FR-301, FR-302, FR-303, FR-304, FR-602 | BR-004, DEC-002, DEC-003 | SCR002_AdminLayout |
| CAP-05 | Trang lỗi 403 và 404 | Thấy trang báo không có quyền hoặc không tìm thấy, và quay về trang chủ (hoặc đăng nhập, nếu chưa có phiên) bằng một cú bấm | US017_ReturnToLoginFromNotFound, US022_ReturnHomeFromErrorPage | FR-351, FR-352, FR-353, FR-603 | DEC-004 | SCR004_Error403, SCR005_Error404 |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Có làm nút nổi (hình bút / logo Kudos) trên Homepage để mở hộp thoại viết Kudo không? Thiết kế có vẽ nút này, hiện chưa có chủ và chưa làm | Chưa làm; khung không chứa nút nổi, Kudo viết từ ô trên Live board | Hành động của nút gắn với Kudo, không gắn với khung; BTC chưa xác nhận | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mọi chữ trong khung (nhãn menu, nút, thông báo lỗi, nội dung hai trang lỗi) có đủ bản Tiếng Việt và English.
- **FR-002** Ngôn ngữ lúc vào lần đầu được chọn theo thứ tự ở BR-001.

### Navigation (1xx)

- **FR-101** Header khu Sunner có logo (về trang chủ) và ba link: About SAA 2025, Award Information, Sun* Kudos.
- **FR-102** Link của trang đang mở được đánh dấu "trang hiện tại"; trang con của một mục vẫn làm mục đó sáng (BR-003).
- **FR-103** Footer đầy đủ có logo và năm link: About SAA, Award Information, Sun* Kudos, Thể lệ, Tiêu chuẩn chung, kèm dòng bản quyền.
- **FR-104** Dưới breakpoint màn hình trung bình, ba link của header gom vào một nút menu; menu đóng khi chọn một mục, bấm ra ngoài hoặc nhấn Esc.
- **FR-105** Khung Sunner chừa chỗ cho chuông thông báo ở header và một vùng hiện thông báo gửi/sửa Kudo trên mọi trang; nội dung của hai thứ này do feature khác cấp.

### App Layout (2xx)

- **FR-201** Bấm avatar mở menu gồm Profile, Dashboard (chỉ admin) và Logout; Esc hoặc bấm ra ngoài đóng menu.
- **FR-202** Nút ngôn ngữ hiện mã ngôn ngữ đang dùng (VN hoặc EN) và liệt kê Tiếng Việt, English; chọn ngôn ngữ khác thì cả trang đổi ngay.
- **FR-203** Khung Sunner chỉ hiện sau khi cổng kiểm tra cho qua: khách về trang đăng nhập, người chưa chọn đơn vị về trang chọn đơn vị (DEC-001).

### Admin Layout (3xx)

- **FR-301** Khu Admin có thanh trên riêng với bốn mục Overview, Review content, User, Settings; mục của trang đang mở được đánh dấu, dưới màn hình trung bình bốn mục gom vào nút menu.
- **FR-302** Logo kèm nhãn ADMIN đưa về khu Sunner; tên truy cập của link nói rõ đích đến.
- **FR-303** Địa chỉ gốc của khu Admin chuyển thẳng sang trang Overview.
- **FR-304** Khung Admin không có chuông thông báo; footer chỉ có dòng bản quyền; ngôn ngữ và menu tài khoản dùng chung với khung Sunner.

### Error Pages (35x)

- **FR-351** Địa chỉ không khớp trang nào hiện trang 404 với tiêu đề, minh hoạ, lời giải thích và một nút (DEC-004).
- **FR-352** Người đã đăng nhập mà không đủ quyền hiện trang 403 với tiêu đề, minh hoạ, lời giải thích và nút "Về trang chủ".
- **FR-353** Hai trang lỗi là trang trần, không header, không footer, và hiện theo ngôn ngữ đang chọn.

### Interaction (4xx)

- **FR-401** Ngôn ngữ đã chọn được nhớ một năm trên cùng trình duyệt, kể cả khi chưa đăng nhập.

### Security (6xx)

- **FR-601** Mục Dashboard trong menu tài khoản chỉ hiện với người dùng có role admin (BR-002).
- **FR-602** Khung Admin chỉ được dựng sau khi xác nhận người dùng là admin; người không phải admin nhận trang 403 và không có chút giao diện admin nào trong phản hồi (BR-004).
- **FR-603** Hai trang lỗi không để lộ chi tiết kỹ thuật (đường dẫn máy chủ, nội dung lỗi).

## 5. Business Rules

- Ngôn ngữ được chọn theo thứ tự: lựa chọn đã lưu, rồi ngôn ngữ ưu tiên của trình duyệt (chỉ nhận Việt hoặc Anh, theo mức ưu tiên), cuối cùng là Tiếng Việt; giá trị lạ trong lựa chọn đã lưu bị bỏ qua (BR-001)
- Mục Dashboard ẩn với người không phải admin chỉ để giao diện gọn; lớp chặn thật nằm ở cổng của khu Admin, nên gõ thẳng địa chỉ vẫn bị chặn (BR-002)
- Mục đang mở trong thanh điều hướng được tính theo đường dẫn: trang chủ chỉ sáng đúng ở trang chủ, các mục khác sáng ở chính trang đó và mọi trang con (BR-003)
- Quyền admin luôn được đọc lại từ hồ sơ ở mỗi lần vào trang hay gọi hành động, không dựa vào dữ liệu lưu trong trình duyệt; người bị hạ quyền giữa phiên bị chặn ở lần vào kế tiếp (BR-004)
- Chỉ nhận hai giá trị ngôn ngữ vi và en; giá trị khác không đổi gì; lựa chọn lưu một năm và chỉ gửi kèm các lần vào trang của chính trình duyệt này (BR-005)
- Vào trang cần phiên: không có phiên thì về đăng nhập; có phiên nhưng chưa chọn đơn vị thì về trang chọn đơn vị; có phiên nhưng không có hồ sơ thì nhận trang lỗi chưa xác thực (DEC-001)
- Vào khu Admin: khách về đăng nhập; người đã đăng nhập không phải admin nhận trang 403 (DEC-002)
- Người không phải admin mở trang trong khu Admin nhận trang 403 kèm đúng mã lỗi; hành động gửi từ khu Admin của người không phải admin bị từ chối bằng thông điệp lỗi gọn, không có trang (DEC-003)
- Ở trang 404, người có phiên và có hồ sơ thấy nút "Về trang chủ"; người không có phiên hoặc thiếu hồ sơ thấy nút "Đăng nhập" (DEC-004)
- Chọn lại đúng ngôn ngữ đang dùng chỉ đóng danh sách; chọn ngôn ngữ khác thì đổi rồi làm mới trang; đổi thất bại thì giữ ngôn ngữ cũ và báo lỗi (DEC-005)
- Đăng xuất thành công thì rời khỏi trang; thất bại thì ở lại và báo lỗi ngay dưới menu (DEC-006)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| App Layout | SCR003_AppLayout | Header (logo, ba link, chuông thông báo, nút ngôn ngữ, avatar), vùng nội dung của trang, footer năm link kèm bản quyền; thông báo "đã gửi / đã lưu Kudo" nổi trên mọi trang | Mở các trang Sunner từ header và footer, mở menu thu gọn trên màn nhỏ, đổi ngôn ngữ, mở menu avatar (Profile, Dashboard cho admin, Logout) |
| Admin Layout | SCR002_AdminLayout | Thanh trên với logo kèm nhãn ADMIN, bốn mục Overview / Review content / User / Settings, nút ngôn ngữ, avatar; nội dung trang quản trị; footer chỉ có dòng bản quyền; không có chuông | Chuyển mục quản trị, bấm logo ADMIN để về khu Sunner, đổi ngôn ngữ, mở menu avatar |
| Forbidden Page | SCR004_Error403 | Trang trần: tiêu đề "Không có quyền truy cập", minh hoạ, lời giải thích "Bạn không có quyền truy cập tài nguyên này." | Bấm "Về trang chủ" |
| Not Found Page | SCR005_Error404 | Trang trần: tiêu đề "KHÔNG TÌM THẤY", minh hoạ, lời giải thích "Tài nguyên bạn tìm không tồn tại hoặc đã bị xóa." | Bấm "Về trang chủ" (đã đăng nhập) hoặc "Đăng nhập" (chưa có phiên) |

### User Journey

1. Sunner vào một trang sau đăng nhập và thấy Header, nội dung trang, Footer; mục của trang đang mở sáng lên.
2. Sunner bấm "Sun* Kudos" trên Header — trang chuyển đi, mục đó sáng lên.
3. Sunner bấm nút ngôn ngữ và chọn English — cả khung và nội dung trang đổi sang tiếng Anh, vẫn ở trang cũ; lần sau vào vẫn là English.
4. Admin mở menu avatar và chọn Dashboard — vào Admin Layout, trang Overview; chuyển qua Review content, User, Settings bằng thanh trên.
5. Admin bấm logo ADMIN — quay về App Layout ở trang chủ.
6. Sunner thường gõ địa chỉ khu Admin — thấy Forbidden Page và bấm "Về trang chủ" để quay về trang chủ.
7. Sunner gõ nhầm một địa chỉ không có — thấy Not Found Page và bấm "Về trang chủ".

## 7. User Stories

### US001_NavigateAdminSections — Navigate Admin Sections

**Actor:** Admin
**Goal:** Chuyển giữa các mục của khu Admin mà không phải gõ địa chỉ.
**Business value:** BTC làm việc nhanh giữa duyệt nội dung, quản lý người dùng, cấu hình và thống kê trong cùng một khung.

**Acceptance Criteria:**
- [ ] Thanh trên có bốn mục Overview, Review content, User, Settings; mục khớp trang hiện tại (kể cả trang con) được đánh dấu.
- [ ] Bấm một mục mở đúng trang của mục đó; địa chỉ gốc của khu Admin chuyển sang Overview.
- [ ] Dưới màn hình trung bình, bốn mục gom vào nút menu; chọn một mục thì menu đóng và trang mở; Esc hoặc bấm ra ngoài cũng đóng.
- [ ] Logo kèm nhãn ADMIN đưa về khu Sunner.
- [ ] Khung Admin không có chuông; người không phải admin không nhận phần giao diện này.
- [ ] Khi bảng campaign ở trang Settings đọc lỗi, khối lỗi có link tải lại mở lại đúng trang Settings.

### US002_OpenAdminDashboard — Open Admin Dashboard

**Actor:** Admin
**Goal:** Mở Dashboard từ menu tài khoản để vào thẳng trang Overview của khu Admin.
**Business value:** Admin ở bất kỳ trang Sunner nào cũng vào được khu quản trị bằng hai cú bấm.

**Acceptance Criteria:**
- [ ] Menu avatar của admin có mục "Dashboard"; Sunner thường không thấy mục này.
- [ ] Mục "Dashboard" có ở cả header Sunner lẫn thanh trên của khu Admin.
- [ ] Bấm "Dashboard" mở trang Overview và đóng menu.
- [ ] Mục ẩn chỉ là phần giao diện; trang đích vẫn tự kiểm tra quyền admin.

### US017_ReturnToLoginFromNotFound — Return To Login From Not Found

**Actor:** Khách
**Goal:** Quay về trang đăng nhập từ trang 404 thay vì kẹt ở một địa chỉ không tồn tại.
**Business value:** Người chưa có phiên (hoặc có phiên nhưng thiếu hồ sơ) có lối đi tiếp, không bị dừng ở ngõ cụt.

**Acceptance Criteria:**
- [ ] Địa chỉ không khớp trang nào hiện trang 404 trần với tiêu đề, minh hoạ và lời giải thích, không có chi tiết kỹ thuật.
- [ ] Người không có phiên (hoặc có phiên nhưng không có hồ sơ) thấy một nút duy nhất "Đăng nhập"; người đã có phiên và hồ sơ thấy "Về trang chủ".
- [ ] Bấm "Đăng nhập" mở trang đăng nhập sạch, không mang theo địa chỉ không tồn tại.

### US020_SwitchLanguage — Switch Language

**Actor:** Sunner
**Goal:** Đổi giao diện giữa Tiếng Việt và English để đọc bằng ngôn ngữ mình quen.
**Business value:** Nhân sự đọc tiếng Anh tốt hơn tiếng Việt (và ngược lại) dùng hệ thống không gặp rào cản.

**Acceptance Criteria:**
- [ ] Nút ngôn ngữ ở header hiện mã đang dùng (VN hoặc EN) và mở danh sách Tiếng Việt, English; chọn lại đúng ngôn ngữ đang dùng thì không làm gì.
- [ ] Chọn ngôn ngữ khác thì cả trang đổi ngôn ngữ ngay và lựa chọn được nhớ một năm.
- [ ] Giá trị ngoài hai ngôn ngữ hỗ trợ không làm đổi gì.
- [ ] Đổi thất bại thì hiện "Không thể đổi ngôn ngữ, vui lòng thử lại." và giữ ngôn ngữ cũ; trong lúc chờ nút bị khoá.
- [ ] Esc hoặc bấm ra ngoài đóng danh sách; khách cũng đổi được ở trang đăng nhập và đếm ngược.

### US021_NavigateSunnerPages — Navigate Sunner Pages

**Actor:** Sunner
**Goal:** Mở các trang Sunner từ header, footer, menu tài khoản và dropdown chuông để tới đúng nội dung cần.
**Business value:** Người dùng không bị lạc giữa cổng giải thưởng, Kudos, thể lệ và tiêu chuẩn cộng đồng, nên dùng cả hai mảng nội dung.

**Acceptance Criteria:**
- [ ] Header có logo (về trang chủ) và ba link About SAA 2025, Award Information, Sun* Kudos; dưới màn hình trung bình ba link gom vào menu; link của trang hiện tại được đánh dấu.
- [ ] Footer đầy đủ có logo và năm link: About SAA, Award Information, Sun* Kudos, Thể lệ, Tiêu chuẩn chung.
- [ ] Menu tài khoản có "Profile" mở trang hồ sơ của chính mình.
- [ ] Dropdown chuông có "Xem tất cả" mở trang thông báo (link này thuộc F013_Notifications).
- [ ] Mọi đích đều qua cổng của khung: chưa có phiên thì về đăng nhập, chưa chọn đơn vị thì về trang chọn đơn vị.

### US022_ReturnHomeFromErrorPage — Return Home From Error Page

**Actor:** Sunner
**Goal:** Quay về trang chủ bằng một cú bấm từ trang lỗi 403 hoặc 404 để tiếp tục làm việc.
**Business value:** Trang lỗi không trở thành ngõ cụt, giảm số người bỏ phiên làm việc.

**Acceptance Criteria:**
- [ ] Trang 403 có đúng một nút "Về trang chủ"; trang 404 cho người đã đăng nhập cũng có "Về trang chủ".
- [ ] Bấm nút đi tới trang chủ.
- [ ] Hai trang là trang trần không header, không footer và không bao giờ hiện chi tiết lỗi.
- [ ] Người chưa chọn đơn vị bấm nút vẫn được đưa tiếp về trang chọn đơn vị.

## 8. Scenarios

### US001_NavigateAdminSections — Happy Path

**Given** Admin đang ở trang Overview, **When** bấm mục "Review content", **Then** trang Review content mở, mục này sáng lên và mục Overview hết sáng.

### US001_NavigateAdminSections — Error: không phải admin

**Given** Sunner thường đã đăng nhập, **When** gõ địa chỉ trang User của khu Admin, **Then** nhận trang 403 và trong phản hồi không có thanh trên Admin nào.

### US002_OpenAdminDashboard — Happy Path

**Given** Admin đang ở trang chủ Sunner, **When** mở menu avatar và bấm "Dashboard", **Then** trang Overview mở với bảng số liệu theo đơn vị và menu đóng.

### US002_OpenAdminDashboard — Error: Sunner thường

**Given** Sunner thường, **When** mở menu avatar, **Then** menu chỉ có Profile và Logout; nếu gõ thẳng địa chỉ Overview thì nhận trang 403.

### US017_ReturnToLoginFromNotFound — Happy Path

**Given** người có phiên nhưng không có hồ sơ mở một địa chỉ không tồn tại, **When** bấm "Đăng nhập" trên trang 404, **Then** trang đăng nhập mở.

### US017_ReturnToLoginFromNotFound — Error: khách không thấy 404

**Given** khách chưa có phiên gõ một địa chỉ lạ, **When** cổng của hệ thống xử lý, **Then** khách được chuyển tới trang đăng nhập (kèm địa chỉ muốn tới) và không thấy trang 404.

### US020_SwitchLanguage — Happy Path

**Given** Sunner đang xem giao diện Tiếng Việt, **When** mở danh sách và chọn English, **Then** lựa chọn được lưu, trang làm mới bằng tiếng Anh và nút hiện EN.

### US020_SwitchLanguage — Error: đổi thất bại

**Given** việc lưu lựa chọn thất bại, **When** Sunner chọn English, **Then** giao diện giữ ngôn ngữ cũ và hiện "Không thể đổi ngôn ngữ, vui lòng thử lại."

### US021_NavigateSunnerPages — Happy Path

**Given** Sunner đang ở một trang Kudo, **When** bấm "Award Information" trên header, **Then** trang giải thưởng mở và link đó được đánh dấu trang hiện tại.

### US021_NavigateSunnerPages — Error: phiên hết hạn

**Given** phiên hết hạn trước khi bấm "Profile", **When** Sunner bấm, **Then** hệ thống đưa về trang đăng nhập thay vì mở hồ sơ.

### US022_ReturnHomeFromErrorPage — Happy Path

**Given** Sunner thường vừa nhận trang 403 khi vào khu Admin, **When** bấm "Về trang chủ", **Then** trang chủ Sunner mở với header và footer.

### US022_ReturnHomeFromErrorPage — Error: phiên hết hạn trên trang lỗi

**Given** phiên hết hạn trong lúc đang xem trang 403 hoặc 404, **When** bấm "Về trang chủ", **Then** hệ thống đưa về trang đăng nhập thay vì vào trang chủ.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Người không phải admin mở trang trong khu Admin (DEC-002, DEC-003) | Cổng chặn trước khi khung Admin được dựng; phản hồi là trang 403, không có giao diện admin | "Không có quyền truy cập — Bạn không có quyền truy cập tài nguyên này." |
| Admin bị hạ quyền giữa phiên rồi bấm sang mục khác (BR-004) | Quyền được đọc lại từ hồ sơ ở lần vào kế tiếp nên trang mới nhận trang 403; trang đang mở không tự thay đổi | "Không có quyền truy cập — Bạn không có quyền truy cập tài nguyên này." |
| Người không phải admin gửi một hành động quản trị (DEC-003) | Cổng từ chối ngay bằng thông điệp lỗi gọn, hành động không chạy | None — không có trang; cách từng form báo lỗi xem RISK-04 |
| Khách gõ địa chỉ lạ (DEC-004) | Chuyển tới trang đăng nhập kèm địa chỉ muốn tới, không thấy trang 404 | None — chuyển trang im lặng |
| Người đã đăng nhập mở địa chỉ không tồn tại (DEC-004) | Hiện trang 404 trần, nút "Về trang chủ" | "KHÔNG TÌM THẤY — Tài nguyên bạn tìm không tồn tại hoặc đã bị xóa." |
| Có phiên nhưng không có hồ sơ mở địa chỉ không tồn tại (DEC-004) | Hiện trang 404 trần, nút "Đăng nhập" | "KHÔNG TÌM THẤY — Tài nguyên bạn tìm không tồn tại hoặc đã bị xóa." |
| Sunner chưa chọn đơn vị mở trang Sunner (DEC-001) | Cổng đưa về trang chọn đơn vị trước khi khung hiện | None — chuyển trang im lặng |
| Có phiên nhưng không có hồ sơ mở trang Sunner (DEC-001) | Hệ thống trả trang lỗi chưa xác thực thay vì chuyển trang, để tránh vòng lặp chuyển hướng | "Chưa xác thực" (trang lỗi mặc định của hệ thống) |
| Đổi ngôn ngữ thất bại hoặc mất mạng (DEC-005) | Giữ ngôn ngữ cũ, nút khoá trong lúc chờ rồi mở lại | "Không thể đổi ngôn ngữ, vui lòng thử lại." |
| Chọn lại ngôn ngữ đang dùng (DEC-005) | Chỉ đóng danh sách, không gọi gì | None — không có thay đổi |
| Giá trị ngôn ngữ lạ trong lựa chọn đã lưu (BR-001, BR-005) | Bị bỏ qua, giao diện theo ngôn ngữ trình duyệt rồi Tiếng Việt | None — im lặng |
| Đăng xuất thất bại (DEC-006) | Ở lại trang, menu giữ nguyên | "Không thể đăng xuất, vui lòng thử lại." |
| Sunner thường mở menu avatar (BR-002, DISC role = user) | Menu chỉ có Profile và Logout | None — mục Dashboard vắng mặt |
| Admin mở menu avatar (BR-002, DISC role = admin) | Menu có thêm Dashboard giữa Profile và Logout | None — mục Dashboard hiện |
| Hệ thống không dựng được trang 403 có minh hoạ (DEC-003) | Vẫn trả mã từ chối nhưng với chữ thuần, không có nút | "403 Forbidden" (chữ thuần) |
| Phiên hết hạn lúc bấm "Về trang chủ" trên trang lỗi | Cổng đưa về trang đăng nhập | None — chuyển trang im lặng |

## 10. Edge Behaviours to Verify

- **FR-001** → Chuyển ngôn ngữ sang English rồi mở trang 403, trang 404, menu avatar: không còn chữ tiếng Việt trong khung.
- **FR-002** → Trình duyệt ưu tiên tiếng Anh, chưa chọn gì: giao diện là English; lựa chọn đã lưu thắng ngôn ngữ trình duyệt; giá trị lưu lạ rơi về ngôn ngữ trình duyệt hoặc Tiếng Việt.
- **FR-102** → Ở trang chi tiết một Kudo, mục Sun* Kudos vẫn sáng; ở trang chủ chỉ mục About SAA 2025 sáng, không sáng theo kiểu "bắt đầu bằng dấu gạch chéo".
- **FR-103** → Footer có đủ năm link và dòng bản quyền; footer khu Admin chỉ có dòng bản quyền.
- **FR-104** → Ở màn 375 điểm ảnh, bấm nút menu mở danh sách; chọn mục, bấm ra ngoài hoặc Esc đều đóng; Esc trả tiêu điểm về nút menu.
- **FR-203** → Khách vào trang Sunner về đăng nhập; người chưa chọn đơn vị về trang chọn đơn vị; không bao giờ thấy header Sunner trước khi cổng cho qua.
- **FR-201** → Menu avatar của Sunner thường có Profile và Logout; của admin có thêm Dashboard.
- **FR-202** → Nút ngôn ngữ đọc to đúng mã đang dùng; chọn xong cả trang đổi và vẫn ở trang cũ.
- **FR-301** → Admin thấy đúng bốn mục theo thứ tự, mục Overview sáng khi mở khu Admin; nhãn ADMIN hiện cạnh logo.
- **FR-303** → Gõ địa chỉ gốc khu Admin dẫn thẳng tới Overview.
- **FR-304** → Khu Admin không có chuông; footer chỉ có dòng bản quyền.
- **FR-351** → Địa chỉ lạ cho người đã đăng nhập: phản hồi mang trạng thái 404, không header, không footer, nút "Về trang chủ".
- **FR-401** → Chọn English rồi tải lại trang và mở trình duyệt lại: vẫn là English.
- **FR-601** → Sunner thường không thấy "Dashboard" trong menu.
- **FR-602** → Người không phải admin vào trang khu Admin nhận phản hồi trạng thái 403 và trong nội dung không có chữ "ADMIN", "Overview", "Review content".
- **FR-603** → Hai trang lỗi chỉ có tiêu đề, minh hoạ, lời giải thích và một nút; không có đường dẫn máy chủ hay chi tiết lỗi.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | known-issue | Nhánh khách của trang 404 gần như không với tới: cổng của hệ thống chuyển khách khỏi mọi đường dẫn ngoài danh sách công khai sang trang đăng nhập trước khi trang 404 dựng. Nút "Đăng nhập" chỉ tới được ở hai ca hẹp: có phiên nhưng thiếu hồ sơ, hoặc địa chỉ nằm ngoài phạm vi cổng mà Next vẫn dựng 404. Bài kiểm tra tự động hiện có chỉ phủ nhánh người đã đăng nhập | Người đọc spec dễ tưởng khách thường thấy trang 404 | [INFERRED] |
| RISK-02 | known-issue | Nhãn link footer cuối cùng là "Tiêu chuẩn chung" (English: "Community Standards"), trong khi tài liệu và user story gọi là "Tiêu chuẩn cộng đồng" | Tester dò theo tên trong user story sẽ không thấy chữ khớp | confirmed |
| RISK-03 | risk | Trang 403 do cổng dựng bằng cách tự tải nội bộ trang không có quyền (tối đa 5 giây); nếu tải lỗi hoặc quá hạn, người dùng nhận chữ thuần "403 Forbidden", không có minh hoạ và không có nút về trang chủ | Người bị chặn gặp ngõ cụt khi máy chủ chậm hoặc cấu hình địa chỉ nội bộ sai | confirmed |
| RISK-04 | risk | Hành động gửi từ trang quản trị của admin vừa bị hạ quyền bị cổng từ chối bằng thông điệp lỗi gọn, không phải trang; cách từng form hiển thị kết quả này thuộc feature của form và chưa được kiểm trong lượt này | Admin bị hạ quyền có thể thấy form "không phản ứng" thay vì thông báo rõ | [UNVERIFIED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Phiên đăng nhập, cổng chặn khách và người chưa chọn đơn vị, hành động đăng xuất, trang đăng nhập đích khi bị chuyển | FR-203, DEC-001, DEC-006 |
| F013_Notifications | feature | Chuông thông báo và dropdown nằm trong header Sunner; khung chỉ chừa chỗ | FR-105, SCR003_AppLayout |
| F003_KudosAuthoring | feature | Vùng hiện thông báo gửi/sửa Kudo đặt trong khung Sunner | FR-105 |
| F006_AwardsPortal | feature | Đích của link Homepage, Award Information, Thể lệ, Tiêu chuẩn chung | FR-101, FR-103 |
| F004_KudosFeed | feature | Đích của link Sun* Kudos | FR-101 |
| F012_Profile | feature | Đích của mục Profile trong menu tài khoản | FR-201 |
| F015_AdminOverview | feature | Đích của mục Overview và của Dashboard; trang Overview tự kiểm tra quyền admin | FR-301, FR-601, BR-002 |
| F007_AdminModeration | feature | Đích của mục Review content | FR-301 |
| F014_AdminUserManagement | feature | Đích của mục User | FR-301 |
| F011_AdminCampaigns | feature | Đích của mục Settings; khối lỗi tải lại của bảng campaign nằm trong khung điều hướng Admin | FR-301, US001_NavigateAdminSections |
| Hồ sơ Sunner (tên, avatar, role, đơn vị) | data | Hiện tên và avatar, quyết định mục Dashboard, nút của trang 404, và quyền vào khu Admin | FR-201, FR-602, DEC-004 |
| Dịch vụ xác thực và cơ sở dữ liệu của nền tảng | infrastructure | Xác nhận phiên ở mỗi lần vào trang và đọc hồ sơ | BR-004 |
| Địa chỉ nội bộ của chính ứng dụng | config | Cổng tự tải trang "không có quyền" từ địa chỉ này để dựng trang 403 | RISK-03 |

## 13. Configuration

```text
SUPPORTED_LANGUAGES = vi, en       # chỉ hai ngôn ngữ; ngôn ngữ mặc định là Tiếng Việt
LANGUAGE_CHOICE_TTL_DAYS = 365     # lựa chọn ngôn ngữ được nhớ một năm trên trình duyệt
HEADER_LINKS = 3                   # About SAA 2025, Award Information, Sun* Kudos
FOOTER_LINKS = 5                   # About SAA, Award Information, Sun* Kudos, Thể lệ, Tiêu chuẩn chung
ADMIN_MENU_ITEMS = 4               # Overview, Review content, User, Settings
```
