# Functional Spec — F002_AppShell

**Priority**: P0
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — handler dự kiến, quy tắc kỹ thuật, cấu hình kỹ thuật cho Dev/QA/SA.

**Traceability:** F002_AppShell → TBD (draft)

## 1. Overview

**Problem:** Mọi trang sau đăng nhập cần cùng một khung điều hướng, đổi ngôn ngữ, menu tài khoản và trang lỗi. Nếu mỗi feature tự dựng thì giao diện lệch nhau và lặp việc.
**Solution:** Một khung dùng chung gồm header, footer, đổi ngôn ngữ Việt/Anh, menu avatar, khung và menu riêng cho khu Admin, cùng trang lỗi 404 và 403. Khung không chứa nội dung nghiệp vụ của trang nào.
**Scope:** Header (logo, 3 liên kết điều hướng, chỗ đặt chuông thông báo, đổi ngôn ngữ, avatar + menu), footer, menu thu gọn trên màn hình nhỏ, khung Admin với menu 4 mục, trang 404 và 403.
**Non-Scope:** Đăng nhập, phiên, kiểm tra quyền (F001_Auth). Nội dung chuông thông báo và danh sách thông báo (F013_Notifications). Nội dung các trang đích như Homepage, Hệ thống giải (F006_AwardsPortal). Nút nổi (FAB) của Live board chưa có chủ, xem D003. Ứng dụng native.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên Sun* đã đăng nhập | Đi tới các trang chính, đổi ngôn ngữ, mở menu tài khoản |
| Admin | Sunner có thêm quyền quản trị | Vào khu Admin và chuyển giữa các mục quản trị |
| Khách chưa đăng nhập | Người chưa có phiên | Thấy trang lỗi 404 khi vào địa chỉ không tồn tại (chi tiết xem D002, D005) |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Common Navigation | Đi tới About SAA 2025, Award Information, Sun* Kudos từ header; xem footer; dùng menu thu gọn trên màn nhỏ | US001_NavigateWithHeader | FR-101, FR-102, FR-103, FR-104, FR-105, FR-402 | — | TBD (draft) — SCR-app-layout |
| CAP-02 | Account Menu | Mở menu avatar để vào Profile, vào khu Admin (nếu là Admin) hoặc đăng xuất | US003_OpenAccountMenu | FR-201, FR-601 | BR-002, DEC-001 | TBD (draft) — SCR-app-layout |
| CAP-03 | Language Switching | Chọn Tiếng Việt hoặc English, giao diện đổi ngay và được nhớ cho lần sau | US002_SwitchLanguage | FR-001, FR-002, FR-202, FR-401 | BR-001 | TBD (draft) — SCR-app-layout |
| CAP-04 | Admin Frame | Dùng khung riêng của khu Admin và chuyển giữa Overview, Review content, User, Settings | US004_UseAdminMenu | FR-301, FR-302, FR-303, FR-602 | — | TBD (draft) — SCR-admin-layout |
| CAP-05 | Error Pages | Thấy trang 404 hoặc 403 rõ ràng và quay về trang chính | US005_SeeNotFoundPage, US006_SeeForbiddenPage | FR-351, FR-352, FR-353, FR-603 | DEC-002 | TBD (draft) — SCR-error-404, SCR-error-403 |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Ngôn ngữ nằm trong địa chỉ trang (tiền tố /vi, /en) hay chỉ lưu lựa chọn, địa chỉ giữ nguyên? | Chỉ lưu lựa chọn, địa chỉ không có tiền tố | Web nội bộ, không cần SEO; đơn giản hơn, liên kết chia sẻ không phụ thuộc ngôn ngữ | no |
| D002 | Trang chưa đăng nhập (Login, Countdown) có dùng nút đổi ngôn ngữ của khung không? | Có, chỉ dùng riêng nút đổi ngôn ngữ, không có menu điều hướng | Người chưa đăng nhập vẫn cần đọc được màn hình; tái dùng một thành phần | no |
| D003 | Ai sở hữu nút nổi (FAB) trên Live board? | Feature Live board (F004/F003) sở hữu, khung chung không chứa | Hành động của FAB gắn với Kudos, không phải với khung | no |
| D004 | Ngôn ngữ đã chọn lưu ở đâu? | Chỉ lưu trên trình duyệt, không ghi vào hồ sơ Sunner | Không cần thêm cột dữ liệu; đổi thiết bị thì chọn lại | no |
| D005 | Trang 404 và 403 có hiện header/footer không, và khách chưa đăng nhập thấy nút nào? | 404 hiện khung chung nếu đã đăng nhập; 403 dùng trang đơn giản có nút về trang chủ; khách thấy nút về trang đăng nhập | Tránh dựng thêm biến thể; 403 không cần menu | no |
| D006 | Nội dung footer (liên kết, bản quyền, logo) là gì? | [NEEDS_DOMAIN_CONFIRMATION] Logo + dòng bản quyền + 3 liên kết như header | Chưa đọc được chi tiết footer từ thiết kế trong lượt này | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mọi chữ hiển thị trong khung (nhãn menu, nút, thông báo lỗi) có đủ bản tiếng Việt và tiếng Anh.
- **FR-002** Lần đầu vào, ngôn ngữ được chọn theo quy tắc ở BR-001.

### Navigation (1xx)

- **FR-101** Header có logo và ba liên kết: About SAA 2025, Award Information, Sun* Kudos.
- **FR-102** Liên kết của trang đang mở được đánh dấu là đang chọn.
- **FR-103** Footer hiện ở cuối mọi trang sau đăng nhập.
- **FR-104** Trên màn hình nhỏ, ba liên kết gộp vào một nút menu thu gọn; bấm mở ra, chọn một mục hoặc bấm ra ngoài thì đóng lại.
- **FR-105** Header chừa chỗ cho chuông thông báo; nội dung và số chưa đọc do F013_Notifications cung cấp.

### App Layout (2xx)

- **FR-201** Bấm avatar mở menu gồm Profile, Admin Dashboard (chỉ Admin) và Logout.
- **FR-202** Nút đổi ngôn ngữ cho thấy ngôn ngữ hiện tại và liệt kê hai lựa chọn Tiếng Việt, English; chọn xong, trang đổi ngôn ngữ ngay.

### Admin Layout and Error Pages (3xx)

- **FR-301** Khu Admin có khung riêng với menu bốn mục: Overview, Review content, User, Settings.
- **FR-302** Mục Admin của trang đang mở được đánh dấu là đang chọn.
- **FR-303** Khung Admin có lối quay về khu Sunner và có menu avatar như khung chung.
- **FR-351** Địa chỉ không tồn tại hiện trang 404 với lời giải thích và nút quay về trang chính.
- **FR-352** Truy cập trái quyền hiện trang 403 với lời giải thích và nút quay về trang chính.
- **FR-353** Cả hai trang lỗi đều theo ngôn ngữ đang chọn.

### Interaction (4xx)

- **FR-401** Ngôn ngữ đã chọn được nhớ cho các lần vào sau trên cùng trình duyệt.
- **FR-402** Khung dùng được trên desktop và màn hình nhỏ; bố cục tablet theo quyết định chung về tablet.

### Security (6xx)

- **FR-601** Mục Admin Dashboard trong menu avatar chỉ hiện với người dùng có role Admin.
- **FR-602** Khung Admin chỉ hiện sau khi F001_Auth xác nhận quyền Admin; khung không tự quyết định quyền.
- **FR-603** Trang lỗi không để lộ thông tin nội bộ (đường dẫn máy chủ, nội dung lỗi kỹ thuật).

## 5. Business Rules

- Ngôn ngữ chọn theo thứ tự: lựa chọn đã lưu, rồi ngôn ngữ của trình duyệt (nếu là Việt hoặc Anh), cuối cùng là Tiếng Việt (BR-001)
- Menu avatar lấy role từ phiên của F001_Auth; ẩn mục Admin chỉ để gọn giao diện, không phải lớp bảo vệ (BR-002)
- Người dùng role Admin thấy mục Admin Dashboard trong menu avatar, người khác không thấy (DEC-001)
- F001_Auth báo "không đủ quyền" thì hiện trang 403; địa chỉ không tồn tại thì hiện trang 404; chưa đăng nhập do F001_Auth chuyển tới đăng nhập, khung không xử lý (DEC-002)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| App Layout | TBD (draft) — SCR-app-layout | Header (logo, 3 liên kết, chuông, đổi ngôn ngữ, avatar), footer; nút menu thu gọn trên màn nhỏ | Đi tới trang chính, đổi ngôn ngữ, mở menu avatar |
| Admin Layout | TBD (draft) — SCR-admin-layout | Khung Admin với menu 4 mục và avatar | Chuyển mục Admin, quay về khu Sunner |
| Not Found Page | TBD (draft) — SCR-error-404 | Thông báo trang không tồn tại | Quay về trang chính |
| Forbidden Page | TBD (draft) — SCR-error-403 | Thông báo không đủ quyền truy cập | Quay về trang chính |

### User Journey

1. Sunner vào một trang sau đăng nhập và thấy header, nội dung trang, footer.
2. Sunner bấm "Sun* Kudos" trên header — trang chuyển đi, liên kết đó được đánh dấu đang chọn.
3. Sunner bấm nút ngôn ngữ, chọn English — toàn bộ chữ của khung và trang đổi sang tiếng Anh, vẫn ở trang cũ.
4. Sunner bấm avatar, chọn Logout — phiên kết thúc (do F001_Auth xử lý).
5. Admin bấm avatar, chọn Admin Dashboard — vào khung Admin, chuyển giữa Overview, Review content, User, Settings.
6. Sunner thường gõ địa chỉ khu Admin — thấy trang 403 và nút quay về trang chính.

## 7. User Stories

### US001_NavigateWithHeader — Navigate with header

**Actor:** Sunner
**Goal:** Đi nhanh tới About SAA 2025, Award Information hoặc Sun* Kudos từ bất kỳ trang nào.
**Business value:** Người dùng không bị lạc giữa cổng giải thưởng và Kudos, tăng lượt dùng cả hai.

**Acceptance Criteria:**
- [ ] Header có logo và ba liên kết ở mọi trang sau đăng nhập.
- [ ] Liên kết của trang đang mở được đánh dấu.
- [ ] Trên màn hình nhỏ, ba liên kết nằm trong nút menu thu gọn.

### US002_SwitchLanguage — Switch language

**Actor:** Sunner
**Goal:** Đọc giao diện bằng Tiếng Việt hoặc English theo ý mình.
**Business value:** Phục vụ nhân sự đọc tiếng Anh tốt hơn tiếng Việt và ngược lại, không rào cản dùng hệ thống.

**Acceptance Criteria:**
- [ ] Chọn ngôn ngữ khác thì chữ của khung và trang đổi ngay, không cần đăng nhập lại.
- [ ] Vào lại lần sau vẫn thấy ngôn ngữ đã chọn.

### US003_OpenAccountMenu — Open account menu

**Actor:** Sunner
**Goal:** Mở menu avatar để xem Profile hoặc đăng xuất.
**Business value:** Một chỗ cố định cho việc liên quan tới tài khoản, người dùng khỏi phải tìm.

**Acceptance Criteria:**
- [ ] Menu có Profile và Logout.
- [ ] Mục Admin Dashboard chỉ xuất hiện với Admin.

### US004_UseAdminMenu — Use admin menu

**Actor:** Admin
**Goal:** Chuyển nhanh giữa Overview, Review content, User, Settings.
**Business value:** BTC theo dõi số liệu và kiểm duyệt nhanh, ít thao tác thừa.

**Acceptance Criteria:**
- [ ] Khung Admin có menu đủ 4 mục, mục đang mở được đánh dấu.
- [ ] Có lối quay về khu Sunner.

### US005_SeeNotFoundPage — See not-found page

**Actor:** Sunner
**Goal:** Biết rõ địa chỉ vừa vào không tồn tại và quay về được.
**Business value:** Tránh màn hình trắng hoặc lỗi kỹ thuật làm người dùng bỏ đi.

**Acceptance Criteria:**
- [ ] Địa chỉ không tồn tại hiện trang 404 theo ngôn ngữ đang chọn.
- [ ] Có nút quay về trang chính.

### US006_SeeForbiddenPage — See forbidden page

**Actor:** Sunner
**Goal:** Biết rõ mình không có quyền vào khu vừa mở.
**Business value:** Người dùng hiểu đây là giới hạn quyền, không phải hệ thống hỏng; giảm câu hỏi hỗ trợ.

**Acceptance Criteria:**
- [ ] Sunner thường vào khu Admin thì hiện trang 403, không lộ nội dung Admin.
- [ ] Có nút quay về trang chính.

## 8. Scenarios

### US001_NavigateWithHeader — Happy Path

**Given** Sunner đang ở một trang sau đăng nhập, **When** bấm "Award Information" trên header, **Then** chuyển tới trang Hệ thống giải và liên kết đó được đánh dấu.

### US001_NavigateWithHeader — Error: màn hình nhỏ

**Given** Sunner dùng điện thoại, **When** mở nút menu rồi bấm ra ngoài vùng menu, **Then** menu đóng lại, trang giữ nguyên.

### US002_SwitchLanguage — Happy Path

**Given** giao diện đang bằng Tiếng Việt, **When** Sunner chọn English trong nút ngôn ngữ, **Then** chữ của khung và trang đổi sang tiếng Anh, vẫn ở trang cũ.

### US002_SwitchLanguage — Error: lựa chọn đã lưu không hợp lệ

**Given** trình duyệt giữ một giá trị ngôn ngữ không được hỗ trợ, **When** Sunner vào trang, **Then** giao diện dùng Tiếng Việt và không báo lỗi.

### US003_OpenAccountMenu — Happy Path

**Given** Sunner thường đã đăng nhập, **When** bấm avatar, **Then** menu hiện Profile và Logout, không có Admin Dashboard.

### US003_OpenAccountMenu — Error: đăng xuất thất bại

**Given** mạng bị lỗi, **When** Sunner bấm Logout, **Then** Sunner vẫn ở trang hiện tại và thấy "Không thể đăng xuất, vui lòng thử lại."

### US004_UseAdminMenu — Happy Path

**Given** Admin đang ở khung Admin, **When** bấm "Review content", **Then** chuyển sang trang đó và mục này được đánh dấu.

### US004_UseAdminMenu — Error: mất quyền giữa chừng

**Given** Admin vừa bị đổi về role User, **When** bấm một mục Admin, **Then** thấy trang 403.

### US005_SeeNotFoundPage — Happy Path

**Given** Sunner đã đăng nhập, **When** gõ địa chỉ không tồn tại, **Then** thấy trang 404 và nút "Về trang chủ".

### US005_SeeNotFoundPage — Error: khách chưa đăng nhập

**Given** người chưa đăng nhập, **When** gõ địa chỉ không tồn tại, **Then** thấy trang 404 với nút dẫn tới đăng nhập (theo D005).

### US006_SeeForbiddenPage — Happy Path

**Given** Sunner thường đã đăng nhập, **When** gõ địa chỉ khu Admin, **Then** thấy trang 403 và nút "Về trang chủ", không thấy gì từ khu Admin.

### US006_SeeForbiddenPage — Error: không có đường quay về

**Given** người dùng mở thẳng trang 403 trong tab mới, **When** bấm nút quay về, **Then** được đưa tới trang chính.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Tên người dùng rất dài | Tên bị cắt bằng dấu ba chấm trong header, tên đầy đủ hiện trong menu | "None — silent handling" |
| Người dùng chưa có ảnh đại diện | Hiện chữ cái đầu của tên thay cho ảnh | "None — silent handling" |
| Đổi ngôn ngữ khi đang nhập dở trong form hoặc modal | [EXPECTED] Chữ đổi, nội dung đang nhập được giữ nguyên | "None — silent handling" |
| Phiên hết hạn khi đang mở menu avatar | F001_Auth chuyển người dùng tới trang đăng nhập khi thao tác tiếp | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." |
| Đổi cỡ cửa sổ khi menu thu gọn đang mở | Menu tự đóng khi chuyển sang bố cục desktop | "None — silent handling" |
| Sunner thường gõ địa chỉ khu Admin | Hiện trang 403, không tải nội dung Admin | "Bạn không có quyền truy cập trang này." |

## 10. Edge Behaviours to Verify

- **FR-001** → Chuyển ngôn ngữ, không còn nhãn nào của khung giữ nguyên tiếng cũ hoặc hiện khoá dịch trần.
- **FR-002** → Xoá lựa chọn đã lưu, đặt trình duyệt tiếng Anh thì vào bằng English; trình duyệt ngôn ngữ khác thì vào bằng Tiếng Việt.
- **FR-102** → Mở từng trang đích, đúng một liên kết được đánh dấu.
- **FR-104** → Ở màn hình nhỏ, mở rồi đóng menu bằng cả nút lẫn bấm ra ngoài.
- **FR-401** → Chọn English, đóng trình duyệt, mở lại: vẫn English.
- **FR-601** → Đăng nhập bằng tài khoản User: menu avatar không có Admin Dashboard.
- **FR-602** → Tài khoản User gõ địa chỉ khu Admin: thấy 403, không thấy menu Admin nào.
- **FR-603** → Trang 404 và 403 không chứa đường dẫn máy chủ hay nội dung lỗi kỹ thuật.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Footer, thứ tự các nút bên phải header và vị trí menu Admin (thanh bên hay thanh trên) chưa được đối chiếu với frame thiết kế trong lượt soạn này | Dựng giao diện có thể lệch thiết kế nếu không đọc lại frame trước khi code | [NEEDS_DOMAIN_CONFIRMATION] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Cung cấp phiên, role Admin/User, hành động đăng xuất và kiểm tra quyền khu Admin | FR-201, FR-601, FR-602 |
| F013_Notifications | feature | Cung cấp nội dung chuông thông báo đặt trong header | FR-105 |
| F006_AwardsPortal | feature | Là trang đích của About SAA 2025 và Award Information | FR-101 |
| F004_KudosFeed | feature | Là trang đích của Sun* Kudos | FR-101 |
| F012_Profile | feature | Là trang đích của mục Profile trong menu avatar | FR-201 |
| Thư viện đa ngôn ngữ (next-intl) | external-service | Nạp bản dịch Việt/Anh | FR-001, FR-002 |

## 13. Configuration

```text
SUPPORTED_LOCALES = vi, en    # hai ngôn ngữ giao diện được hỗ trợ
DEFAULT_LOCALE = vi           # ngôn ngữ dùng khi không có lựa chọn và trình duyệt không thuộc hai ngôn ngữ trên
LANGUAGE_REMEMBER_DAYS = 365  # đề xuất: nhớ lựa chọn ngôn ngữ bao lâu, chờ xác nhận
```
