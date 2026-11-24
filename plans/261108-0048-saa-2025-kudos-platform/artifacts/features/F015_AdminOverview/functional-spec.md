---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->
<!-- Nửa BA/QA của cặp spec: đọc file này là trả lời được "làm gì, ứng xử ra sao, màn hình hiện gì" mà không phải mở file khác. Chi tiết kỹ thuật (đường dẫn, trích nguồn, ghi dữ liệu) nằm ở technical-spec.md. -->

# Functional Spec — F015_AdminOverview

**Priority**: P3
**Type**: ui
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — luồng xử lý từng action, trích nguồn, truy vấn tổng hợp, thiết kế dữ liệu cho Dev/QA/SA.

**Traceability:** F015_AdminOverview → SCR019_AdminOverview → US003_FilterOverviewByDateRange, US004_ExportOverviewCsv → ROUTE003

## 1. Overview

**Problem:** BTC cần biết phong trào Kudo đang chạy ra sao ở từng đơn vị (phòng/ban): đơn vị nào gửi nhiều, nhận nhiều, bao nhiêu người đã được ghi nhận, bao nhiêu Secret Box đã phát ra. Nếu không có chỗ tổng hợp, muốn so sánh theo từng giai đoạn thì phải đếm tay, và số đếm tay dễ lệch nhau giữa các lần báo cáo.
**Solution:** Admin có trang "Overview": một bảng số liệu theo từng đơn vị kèm hàng tổng "All", lọc được theo khoảng ngày nằm ngay trên địa chỉ trang (tải lại hay gửi link cho người khác vẫn ra đúng số), và nút Export tải đúng bảng đang xem ra tệp CSV. Trang chỉ đọc, không sửa dữ liệu nào.
**Scope:** Bảng thống kê theo đơn vị với năm chỉ số (tổng thành viên, Kudo gửi, Kudo nhận, số người nhận được Kudo, Secret Box nhận); hàng "All"; hàng "Chưa gán đơn vị" khi có Sunner chưa chọn đơn vị; bộ lọc khoảng ngày; thông báo khi bộ lọc sai; Export CSV; trạng thái chờ và lỗi của bảng.
**Non-Scope:** Biểu đồ, xu hướng theo thời gian, so sánh hai kỳ; xem sâu từng người trong đơn vị (F014_AdminUserManagement); duyệt hoặc kiểm duyệt nội dung Kudo (F007_AdminModeration); khung và menu Admin, trang từ chối truy cập (F002_AppShell); nguồn dữ liệu đơn vị và kiểm role Admin (F001_Auth); định dạng XLSX; lọc theo đơn vị cụ thể hoặc theo người; chọn nhanh khoảng thời gian (Hôm nay, 7 ngày, 30 ngày); sắp xếp bằng cách bấm đầu cột.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Admin | Sunner có role Admin | Nắm số liệu Kudo và Secret Box theo đơn vị trong một giai đoạn và xuất ra báo cáo cho BTC |

Feature này chưa tham gia luồng liên-feature nào được ghi trong thư mục luồng của tài liệu (hiện chưa có luồng nào).

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Xem thống kê theo đơn vị | Mở trang Overview, xem bảng năm chỉ số theo từng đơn vị và hàng "All", chọn khoảng ngày để thu hẹp giai đoạn, thấy thông báo khi bộ lọc sai hoặc khi không tải được số liệu | US003_FilterOverviewByDateRange | FR-001, FR-002, FR-101, FR-102, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-207, FR-401, FR-403, FR-404, FR-601 | BR-001, BR-002, BR-003, BR-004, BR-005, BR-006, DEC-001, DEC-002, DEC-003, DEC-004 | SCR019_AdminOverview |
| CAP-02 | Xuất thống kê | Tải đúng bảng đang xem (cùng khoảng ngày, có hàng "All") ra tệp CSV mở được bằng Excel | US004_ExportOverviewCsv | FR-402, FR-405, FR-602 | BR-007 | N/A — nút Export nằm trên cùng màn hình đã nêu ở CAP-01 |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Cột "Total users with at least 1 kudo" đếm người đã nhận ít nhất 1 Kudo, đã gửi ít nhất 1 Kudo, hay một trong hai? | Đếm người đã **nhận** ít nhất 1 Kudo Public trong khoảng ngày (đang chạy đúng như vậy) | Tên cột nói "có Kudo" tức được ghi nhận; người gửi đã có cột Kudo gửi riêng | no |
| D002 | Kudo gửi và Kudo nhận gán cho đơn vị nào, và Kudo ẩn danh tính ra sao? | Kudo gửi tính cho đơn vị người gửi, Kudo nhận cho đơn vị người nhận; Kudo ẩn danh vẫn tính cho đơn vị người gửi | Mỗi Kudo có hai đầu, mỗi đầu về đơn vị của chính người đó; ẩn danh chỉ là chuyện hiển thị tên | no |
| D003 | Khoảng ngày lọc theo thời điểm nào? | Kudo lọc theo ngày gửi, Secret Box lọc theo ngày được cấp; ngày đầu và ngày cuối tính trọn ngày giờ Việt Nam | Khớp cách F007_AdminModeration lọc ngày; Secret Box chỉ có ngày cấp và ngày mở, ngày cấp là mốc "nhận" | no |
| D004 | "Total member" đếm ai và có đổi theo khoảng ngày không? | Đếm mọi hồ sơ hiện thuộc đơn vị (kể cả Admin), không đổi theo khoảng ngày | Đây là mẫu số "đơn vị có bao nhiêu người", không phải số hoạt động; hệ thống không lưu lịch sử vào/ra đơn vị | no |
| D006 | "Total received secret box" tính hộp đã cấp hay chỉ hộp đã mở? | Tính mọi hộp đã cấp trong khoảng ngày, cả đã mở lẫn chưa mở | "Received" nghĩa là đã nhận; hộp chưa mở vẫn là hộp đã nhận | no |
| D008 | Khoảng ngày mặc định khi mở trang là gì? | Để trống, tức toàn thời gian | Mặc định theo "tháng này" sẽ gây bất ngờ khi BTC mở giữa kỳ | no |
| D009 | Có làm mục chọn nhanh khoảng thời gian (thiết kế có khung "chọn thời gian") không? | Chưa làm; chỉ chọn khoảng ngày bằng hai ô ngày | Nội dung khung đó chưa rõ `[INFERRED]`; làm khi có yêu cầu rõ (YAGNI) | no |
| D011 | Thứ tự các đơn vị trong bảng? | Theo tên A-Z (số trong tên xếp tự nhiên, CECV2 trước CECV10), "Chưa gán đơn vị" cuối cùng; không sắp xếp bằng cách bấm đầu cột | Thiết kế không có biểu tượng sắp xếp; số đơn vị ít | no |
| D012 | Ngôn ngữ của bản tiếng Anh trang Overview và của tệp CSV: tiêu đề cột tiếng Anh và tên đơn vị luôn tiếng Việt trong tệp, kể cả khi giao diện đang tiếng Anh, có giữ không? | Giữ như hiện tại: tiêu đề cột tiếng Anh, tên đơn vị tiếng Việt; bản tiếng Anh của trang là bản tạm | Bản tiếng Anh và ngôn ngữ chung của các tệp xuất đang chờ BTC chốt | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi Sunner thuộc tối đa một đơn vị; số liệu gom theo đơn vị hiện ghi trong hồ sơ, hệ thống không lưu lịch sử đổi đơn vị.
- **FR-002** Chỉ Kudo đang ở trạng thái Public được tính vào mọi số liệu về Kudo; Kudo Spam không tính và được tính lại khi bỏ Spam.

### Navigation (1xx)

- **FR-101** Admin vào trang Overview từ tab "Overview" trên thanh menu khu Admin hoặc từ mục "Dashboard" trong menu tài khoản.
- **FR-102** Địa chỉ gốc của khu Admin tự chuyển thẳng tới trang Overview.

### Admin Overview (2xx)

- **FR-201** Bảng có các cột No, Unit, Total member, Total sent kudos, Total received kudos, Total users with at least 1 kudo, Total received secret box.
- **FR-202** Hàng đầu tiên là "All" (tổng toàn hệ thống), sau đó mỗi đơn vị một hàng theo tên A-Z (số xếp tự nhiên), hàng "Chưa gán đơn vị" nằm cuối.
- **FR-203** Khoảng ngày lọc bốn chỉ số hoạt động (Kudo gửi, Kudo nhận, người nhận được Kudo, Secret Box nhận); "Total member" không đổi theo khoảng ngày.
- **FR-204** Admin có thể để trống một đầu hoặc cả hai đầu khoảng ngày (cả hai trống là toàn thời gian); mỗi ngày tính trọn ngày theo giờ Việt Nam.
- **FR-205** Đơn vị chưa có hoạt động nào vẫn hiện hàng với giá trị 0; hàng "Chưa gán đơn vị" chỉ hiện khi có Sunner chưa thuộc đơn vị nào.
- **FR-206** Bảng hiện đủ mọi đơn vị trên một trang, không phân trang.
- **FR-207** Trong lúc tải hiện trạng thái chờ; khi đọc lỗi hiện thông báo kèm nút thử lại; không để bảng trắng.

### Interaction (4xx)

- **FR-401** Đổi khoảng ngày thì bảng cập nhật theo và địa chỉ trang giữ khoảng ngày đã chọn, nên tải lại hoặc gửi link vẫn ra đúng số liệu.
- **FR-402** Export tải tệp CSV đúng số liệu của bảng đang xem: bảy cột như bảng, hàng "All" đứng đầu, đơn vị đánh số từ 1, theo khoảng ngày đang chọn.
- **FR-403** Khoảng ngày ngược (ngày bắt đầu sau ngày kết thúc) gõ trong ô chọn ngày bị từ chối ngay tại ô kèm thông báo; bảng và địa chỉ giữ nguyên.
- **FR-404** Khoảng ngày sai nằm sẵn trên địa chỉ (ngược, ngày không có thật, tham số lặp, định dạng lạ) thì hiện thông báo phía trên bảng toàn thời gian; lúc đó Export xuất bảng toàn thời gian.
- **FR-405** Trong lúc tệp đang chuẩn bị, nút Export bị khoá kèm trạng thái chờ; mọi lỗi khi xuất hiện thông báo lỗi và không tải tệp nào.

### Security (6xx)

- **FR-601** Chỉ Admin vào được trang Overview và dùng Export; Sunner thường bị từ chối, khách bị đưa về trang đăng nhập, kể cả khi gọi thẳng vào hệ thống.
- **FR-602** Tệp Export an toàn khi mở bằng Excel: ô văn bản bắt đầu bằng ký tự công thức hiện ra như chữ thường, tiếng Việt hiển thị đúng.

## 5. Business Rules

- Một Kudo chỉ tính khi đang Public và ngày gửi nằm trong khoảng ngày; ngày tính theo giờ Việt Nam, đầu và cuối khoảng đều trọn ngày; Kudo Spam ngừng tính nhưng hộp đã cấp giữ nguyên — chờ D003 (BR-001)
- Kudo gửi tính cho đơn vị của người gửi, Kudo nhận tính cho đơn vị của người nhận; Kudo ẩn danh vẫn tính cho đơn vị người gửi — chờ D002 (BR-002)
- "Total users with at least 1 kudo" đếm số người khác nhau đã nhận ít nhất 1 Kudo trong khoảng ngày, mỗi người một lần dù nhận nhiều — chờ D001 (BR-003)
- "Total member" là số hồ sơ hiện thuộc đơn vị (kể cả Admin), không phụ thuộc khoảng ngày — chờ D004 (BR-004)
- "Total received secret box" đếm mọi hộp được cấp cho người của đơn vị trong khoảng ngày, đã mở hay chưa; hộp không bị trừ khi Kudo sinh ra nó sau này bị Spam — chờ D006 (BR-005)
- Hàng "All" bằng tổng toàn hệ thống và bằng tổng các hàng đơn vị cộng hàng "Chưa gán đơn vị" (BR-006)
- Tệp Export luôn dùng tên đơn vị tiếng Việt và tiêu đề cột tiếng Anh, dù giao diện đang ở ngôn ngữ nào — chờ D012 (BR-007)
- Hàng "Chưa gán đơn vị" chỉ hiện khi có ít nhất một Sunner chưa thuộc đơn vị nào; hàng "All" luôn gồm cả họ (DEC-001)
- Khoảng ngày trống cả hai đầu thì tính toàn thời gian; chỉ có ngày bắt đầu thì tính từ ngày đó đến hiện tại; chỉ có ngày kết thúc thì tính từ đầu đến hết ngày đó; có cả hai thì tính khoảng kín, hai đầu trọn ngày — chờ D008 (DEC-002)
- Khi địa chỉ mang khoảng ngày sai, trang vẫn hiện bảng toàn thời gian kèm thông báo, và Export xuất đúng bảng toàn thời gian đó (DEC-003)
- Ô chọn ngày chỉ gửi khoảng ngày đi khi hợp lệ: khoảng ngược bị giữ lại tại ô, một đầu trống vẫn được gửi (DEC-004)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Admin Overview | SCR019_AdminOverview | Tiêu đề "Overview", hai ô ngày "Ngày bắt đầu" và "Ngày kết thúc" kèm biểu tượng lịch, nút Export màu vàng, dòng cảnh báo khi bộ lọc sai, bảng thống kê theo đơn vị với hàng "All" ở đầu và hàng "Chưa gán đơn vị" ở cuối khi có; khi đang tải thấy khung chờ, khi lỗi thấy thông báo kèm nút "Thử lại" | Chọn hoặc xoá khoảng ngày, xem số liệu, bấm Export để tải CSV, bấm "Thử lại" khi không tải được |

### User Journey

1. Admin bấm "Overview" trên menu khu Admin (hoặc "Dashboard" trong menu tài khoản, hoặc vào địa chỉ gốc của khu Admin) và thấy bảng số liệu toàn thời gian: hàng "All" rồi từng đơn vị.
2. Admin chọn khoảng ngày bằng hai ô ngày — bảng mờ đi một chút rồi cập nhật, bốn chỉ số hoạt động chỉ tính trong khoảng đó, "Total member" giữ nguyên, địa chỉ trang đổi theo.
3. Admin so các đơn vị với nhau và với hàng "All".
4. Admin bấm "Export" — nút khoá kèm chữ "Đang xuất…", trình duyệt tải về tệp CSV đúng như bảng đang xem; nếu lỗi thì hiện thông báo và không có tệp.

## 7. User Stories

### US003_FilterOverviewByDateRange — Filter Overview By Date Range

**Actor:** Admin
**Goal:** Xem số thành viên, Kudo gửi, Kudo nhận, số người nhận được Kudo và Secret Box nhận của từng đơn vị, rồi thu hẹp vào một giai đoạn do mình chọn để so sánh.
**Business value:** BTC thấy đơn vị nào sôi nổi, đơn vị nào chưa tham gia để kịp thúc đẩy, và báo cáo theo tuần, theo tháng hay theo đợt phát động thay vì chỉ có tổng cả chiến dịch.

**Acceptance Criteria:**
- [ ] Bảng có đủ bảy cột; hàng "All" đứng đầu, tiếp theo là từng đơn vị, "Chưa gán đơn vị" ở cuối khi có Sunner chưa chọn đơn vị.
- [ ] Đơn vị không có hoạt động vẫn hiện, các cột hoạt động bằng 0; hàng "All" bằng tổng các hàng còn lại.
- [ ] Chọn khoảng ngày thì bảng cập nhật và địa chỉ trang đổi theo; "Total member" không đổi; ngày cuối được tính trọn ngày giờ Việt Nam.
- [ ] Để trống một đầu hoặc xoá cả hai đầu vẫn hoạt động; xoá cả hai về bảng toàn thời gian.
- [ ] Khoảng ngược gõ trong ô bị chặn tại ô bằng thông báo, bảng giữ nguyên; địa chỉ mang ngày sai thì hiện thông báo phía trên bảng toàn thời gian.
- [ ] Đọc số liệu lỗi thì hiện thông báo kèm nút thử lại, ô ngày vẫn dùng được; người không phải Admin không vào được.

### US004_ExportOverviewCsv — Export Overview Csv

**Actor:** Admin
**Goal:** Tải bảng Overview đang xem ra tệp CSV để xử lý tiếp số liệu ngoài hệ thống.
**Business value:** BTC đưa số liệu vào báo cáo, slide mà không phải chép tay, và tệp luôn khớp với bảng đã xem.

**Acceptance Criteria:**
- [ ] Tệp có số liệu giống hệt bảng đang xem, theo khoảng ngày đang chọn (hoặc toàn thời gian khi địa chỉ có lỗi lọc), hàng "All" đứng đầu rồi đơn vị đánh số 1..n.
- [ ] Tệp có đúng bảy cột như bảng; tên tệp mang ngày giờ lúc xuất theo giờ Việt Nam.
- [ ] Mở bằng Excel hiển thị đúng tiếng Việt và không có ô nào chạy thành công thức.
- [ ] Trong lúc chuẩn bị tệp nút bị khoá kèm trạng thái chờ, không bấm đôi được; lỗi bất kỳ hiện thông báo lỗi và không tải tệp.

## 8. Scenarios

### US003_FilterOverviewByDateRange — Happy Path

**Given** Kudo public rải trong tháng ở nhiều đơn vị, **When** Admin chọn khoảng từ 01/11 đến 15/11, **Then** địa chỉ trang đổi theo, bảng chỉ đếm Kudo public trong khoảng, "Total member" không đổi và hàng "All" bằng tổng các hàng còn lại.

### US003_FilterOverviewByDateRange — Error: Khoảng ngày ngược

**Given** Admin đang xem bảng toàn thời gian, **When** chọn ngày bắt đầu sau ngày kết thúc, **Then** ô hiện "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", bảng và địa chỉ giữ nguyên.

### US003_FilterOverviewByDateRange — Error: Địa chỉ mang ngày sai

**Given** Admin mở địa chỉ Overview có ngày không có thật (ví dụ 30/02), **When** trang tải, **Then** hiện "Bộ lọc không hợp lệ, đang hiện số liệu toàn thời gian." phía trên bảng toàn thời gian.

### US003_FilterOverviewByDateRange — Error: Không tải được số liệu

**Given** dịch vụ dữ liệu đang lỗi, **When** Admin mở trang Overview, **Then** hiện "Không tải được số liệu. Vui lòng thử lại." kèm nút "Thử lại"; bấm "Thử lại" thì trang đọc lại và hiện bảng nếu lần đọc thành công.

### US003_FilterOverviewByDateRange — Error: Không phải Admin

**Given** Sunner thường đã đăng nhập, **When** mở địa chỉ trang Overview, **Then** thấy trang "Không có quyền truy cập" và không có số liệu nào.

### US004_ExportOverviewCsv — Happy Path

**Given** Admin đã chọn khoảng 01/12 đến 05/12, **When** bấm Export, **Then** tải về tệp có hàng "All" và mọi đơn vị với đúng số liệu bảng đang hiện.

### US004_ExportOverviewCsv — Error: Lỗi khi tạo tệp

**Given** phiên đã hết hạn, Admin bị hạ role giữa chừng, hoặc dịch vụ dữ liệu đang lỗi, **When** Admin bấm Export, **Then** không có tệp nào và hiện "Không xuất được tệp. Vui lòng thử lại."

### US004_ExportOverviewCsv — Edge: Địa chỉ mang ngày sai

**Given** địa chỉ có ngày sai nên bảng đang hiện toàn thời gian, **When** Admin bấm Export, **Then** tệp là bảng toàn thời gian.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Hệ thống chưa có Kudo nào, hoặc khoảng ngày không có hoạt động | Mọi chỉ số hoạt động bằng 0, "Total member" vẫn đúng | "None — silent handling" |
| Chưa có đơn vị nào và không có Sunner chưa gán | Bảng chỉ có hàng "All" | "Chưa có đơn vị nào." |
| Chưa có đơn vị nào nhưng có Sunner chưa gán | Bảng có hàng "All" và hàng "Chưa gán đơn vị", không hiện dòng thông báo rỗng | "None — silent handling" |
| Tải bảng thất bại | Vùng bảng hiện lỗi kèm nút thử lại; ô ngày vẫn dùng được | "Không tải được số liệu. Vui lòng thử lại." |
| Gõ khoảng ngày ngược trong ô | Không gửi lên hệ thống; bảng và địa chỉ giữ nguyên | "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" |
| Địa chỉ mang khoảng ngược | Hiện bảng toàn thời gian kèm thông báo; Export xuất bảng toàn thời gian | "Khoảng ngày không hợp lệ, đang hiện số liệu toàn thời gian." |
| Địa chỉ mang ngày không có thật, tham số lặp hoặc định dạng lạ | Hiện bảng toàn thời gian kèm thông báo; Export xuất bảng toàn thời gian | "Bộ lọc không hợp lệ, đang hiện số liệu toàn thời gian." |
| Xoá một đầu của khoảng ngày | Bảng tính theo đầu còn lại, đầu trống không giới hạn | "None — silent handling" |
| Sunner đổi đơn vị sau khi đã gửi Kudo | Mọi số liệu của người đó chuyển sang đơn vị mới, không lưu lịch sử | "None — silent handling" |
| Kudo giữa hai người cùng đơn vị | Tính một lần vào Kudo gửi và một lần vào Kudo nhận của đơn vị đó | "None — silent handling" |
| Kudo bị Mark Spam hoặc được Un Spam | Lần tải kế loại hoặc tính lại Kudo đó; hộp đã cấp giữ nguyên | "None — silent handling" |
| Kudo gửi cuối ngày kết thúc (23 giờ 59 phút) | Vẫn được tính; Kudo gửi 0 giờ ngày kế tiếp thì không | "None — silent handling" |
| Giao diện đang tiếng Anh | Bảng hiện tên đơn vị và nhãn tiếng Anh; tệp CSV vẫn tên đơn vị tiếng Việt | "None — silent handling" |
| Màn hình hẹp | Bảng cuộn ngang trong khung riêng, trang không cuộn ngang | "None — silent handling" |
| Tên đơn vị bắt đầu bằng ký tự công thức hoặc chứa dấu phẩy, nháy kép | Tệp thêm dấu nháy đứng đầu hoặc bọc nháy kép; Excel mở ra như chữ thường | "None — silent handling" |
| Bấm Export hai lần liên tiếp | Lần bấm sau bị bỏ qua cho tới khi tệp đầu xong | "None — silent handling" |
| Xuất lỗi (phiên hết hạn, mất quyền Admin, khoảng ngày sai, lỗi đọc) | Không có tệp; nút mở khoá lại | "Không xuất được tệp. Vui lòng thử lại." |
| Sunner thường mở trang Admin hoặc gọi thẳng Export | Bị từ chối, không có số liệu | "Bạn không có quyền truy cập tài nguyên này." |
| Khách chưa đăng nhập mở trang Overview | Được đưa về trang đăng nhập, sau đó quay lại trang đang định vào | "None — silent handling" |
| Admin bị hạ role giữa chừng | Thao tác kế tiếp (đổi ngày, Export) bị từ chối | "Bạn không có quyền truy cập tài nguyên này." |

## 10. Edge Behaviours to Verify

- **FR-001** → Đổi đơn vị của một Sunner thì số liệu của người đó chuyển sang đơn vị mới ở lần tải kế.
- **FR-002** → Mark Spam một Kudo thì số Kudo gửi, nhận và người nhận được Kudo giảm tương ứng; Un Spam trả lại; hộp đã cấp không đổi.
- **FR-101** → Tab "Overview" và mục "Dashboard" đều mở đúng trang.
- **FR-102** → Vào địa chỉ gốc của khu Admin thì tới trang Overview.
- **FR-201** → Bảng có đủ bảy cột đúng tên.
- **FR-202** → Hàng "All" ở đầu; các đơn vị xếp theo tên, CECV2 đứng trước CECV10; "Chưa gán đơn vị" cuối.
- **FR-203** → Chọn khoảng ngày thì "Total member" giữ nguyên, bốn chỉ số còn lại đổi theo.
- **FR-204** → Chọn ngày kết thúc 05/12 thì Kudo gửi 23 giờ 30 ngày 05/12 vẫn có mặt; để trống cả hai đầu cho số toàn thời gian.
- **FR-205** → Đơn vị không có hoạt động vẫn hiện số 0; có Sunner chưa gán đơn vị thì hàng "Chưa gán đơn vị" hiện.
- **FR-206** → Không có phân trang dù có nhiều đơn vị.
- **FR-207** → Làm hỏng việc đọc số liệu thì thấy lỗi kèm nút thử lại, không thấy bảng trắng; lúc đang tải thấy khung chờ.
- **FR-401** → Chọn khoảng ngày rồi tải lại trang: khoảng ngày và số liệu giữ nguyên; mở link đó ở tab khác cho cùng số.
- **FR-402** → Export cho tệp trùng từng số với bảng, hàng "All" đầu, đơn vị đánh số từ 1, đúng bảy cột.
- **FR-403** → Chọn ngày bắt đầu sau ngày kết thúc thì ô báo lỗi và bảng không đổi.
- **FR-404** → Mở địa chỉ có ngày sai thì thấy thông báo trên bảng toàn thời gian, bấm Export ra tệp toàn thời gian.
- **FR-405** → Bấm Export thì nút khoá kèm "Đang xuất…"; làm hỏng việc xuất thì hiện thông báo lỗi, không có tệp, nút mở lại.
- **FR-601** → Sunner thường mở trang Overview nhận trang từ chối; gọi thẳng Export cũng bị từ chối; khách được đưa về đăng nhập.
- **FR-602** → Mở tệp Export bằng Excel: tên đơn vị bắt đầu bằng `=` hiện như chữ thường, tiếng Việt không vỡ chữ.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Định nghĩa các chỉ số (người có Kudo, gán đơn vị, tính theo ngày nào, Total member có kể Admin) là suy đoán từ nhãn cột trên thiết kế, chưa có xác nhận của BTC (xem D001, D002, D003, D004, D006) | Số liệu BTC nhìn thấy lệch kỳ vọng, báo cáo sai | [INFERRED] |
| RISK-02 | risk | "Total member" không theo khoảng ngày còn các chỉ số khác theo khoảng ngày | So sánh hai kỳ khác nhau dễ hiểu nhầm đơn vị đông lên hoặc giảm đi | [INFERRED] |
| RISK-03 | risk | Không lưu lịch sử đơn vị; Sunner chuyển đơn vị thì số liệu cũ chuyển theo | Số của đơn vị cũ giảm, đơn vị mới tăng so với báo cáo đã xuất trước đó | confirmed |
| RISK-04 | risk | Mỗi lần mở trang, đổi ngày hay Export đều tổng hợp lại trên toàn bộ Kudo, không lưu bộ nhớ đệm; Secret Box chưa có chỉ mục theo ngày cấp | Có thể chậm khi Kudo lên hàng chục nghìn bản ghi vào cao điểm lễ trao giải; chưa có số đo xác nhận | [UNVERIFIED] |
| RISK-05 | risk | Giao diện tiếng Anh hiện tên đơn vị tiếng Anh còn tệp Export luôn tên đơn vị tiếng Việt, thứ tự đơn vị cũng theo tên của từng ngôn ngữ | Đối chiếu bảng với tệp trong giao diện tiếng Anh thấy tên và thứ tự không khớp | [INFERRED] |
| RISK-06 | risk | Tệp Export là số liệu nội bộ theo đơn vị, không có nhật ký ai đã xuất | Khó truy vết nếu số liệu nội bộ lộ ra ngoài công ty | [INFERRED] |
| RISK-07 | risk | Cổng Admin của proxy chỉ phủ các trang Admin, không phủ các điểm dữ liệu Admin; điểm Export chỉ được bảo vệ bởi kiểm tra bên trong chính nó | Một điểm dữ liệu Admin mới quên kiểm tra role sẽ chỉ còn lớp đăng nhập chặn | confirmed |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Hồ sơ Sunner, đơn vị (phòng ban) mỗi người thuộc về, và kiểm role Admin đọc từ dữ liệu ở mỗi lần gọi | FR-001, FR-601 |
| F002_AppShell | feature | Khung Admin, tab "Overview" và mục "Dashboard" dẫn tới trang, trang từ chối truy cập, đổi ngôn ngữ | FR-101, FR-601, SCR019_AdminOverview |
| F003_KudosAuthoring | feature | Nguồn dữ liệu Kudo: người gửi, người nhận, ngày gửi | BR-001, BR-002 |
| F007_AdminModeration | feature | Trạng thái Public/Spam của Kudo; ô chọn khoảng ngày, nút Export, khung báo lỗi đọc và cổng kiểm role cho điểm dữ liệu Admin dùng chung | FR-002, FR-403, FR-405, FR-601 |
| F010_SecretBoxRewards | feature | Nguồn dữ liệu Secret Box đã cấp và ngày cấp | BR-005 |
| Danh mục đơn vị | data | Danh sách đơn vị hiển thị và tên tiếng Việt, tiếng Anh; nạp sẵn, BTC chưa xác nhận danh sách | FR-201, FR-205 |
| Múi giờ khu Admin | config | Cắt ngày của bộ lọc và giờ ghi trong tên tệp theo giờ Việt Nam | BR-001, FR-204 |

## 13. Configuration

```text
DEFAULT_DATE_RANGE = (trống)            # mở trang chưa chọn ngày: tính toàn thời gian (D008)
DAY_CUTOFF_TIMEZONE = giờ Việt Nam      # ngày bắt đầu và ngày kết thúc tính trọn ngày theo múi giờ này; đổi được ở cấu hình máy chủ
PAGE_SIZE = (không phân trang)          # bảng hiện đủ mọi đơn vị trên một trang
EXPORT_ROW_LIMIT = (không áp)           # mỗi đơn vị một dòng nên không cần giới hạn số dòng xuất
```
