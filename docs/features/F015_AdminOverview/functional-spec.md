<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft, provenance inherited from the folder) -->

# Functional Spec — F015_AdminOverview

**Priority**: P3
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F015_AdminOverview → SCR (TBD (draft)) → US001_ViewUnitStatistics, US002_FilterByDateRange, US003_ExportUnitStatistics

## 1. Overview

**Problem:** BTC cần biết phong trào Kudo đang chạy thế nào ở từng đơn vị (phòng/ban): đơn vị nào gửi nhiều, nhận nhiều, bao nhiêu người đã được ghi nhận, bao nhiêu Secret Box đã phát ra. Hiện chưa có chỗ nào tổng hợp các con số này, và muốn so sánh theo từng giai đoạn thì phải tự đếm tay.
**Solution:** Admin có trang "Overview": một bảng số liệu theo từng đơn vị kèm dòng tổng "All", lọc được theo khoảng ngày, và nút Export tải bảng ra tệp CSV. Trang chỉ đọc, không sửa dữ liệu nào.
**Scope:** Bảng thống kê theo đơn vị với năm chỉ số (tổng thành viên, Kudo gửi, Kudo nhận, số người có Kudo, Secret Box nhận); dòng tổng "All"; bộ lọc khoảng ngày; Export CSV.
**Non-Scope:** Biểu đồ, xu hướng theo thời gian, so sánh giữa hai kỳ; xem sâu vào từng người trong đơn vị (thuộc F014_AdminUserManagement); duyệt hoặc kiểm duyệt nội dung Kudo (F007_AdminModeration); khung và menu Admin (F002_AppShell); nguồn dữ liệu phòng ban và kiểm role Admin (F001_Auth); định dạng XLSX; lọc theo đơn vị cụ thể hoặc theo người.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Admin | Sunner có role Admin | Nắm số liệu Kudo và Secret Box theo đơn vị trong một giai đoạn, xuất ra báo cáo cho BTC |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Xem thống kê theo đơn vị | Xem bảng năm chỉ số theo từng đơn vị và dòng tổng "All", chọn khoảng ngày để thu hẹp giai đoạn | US001_ViewUnitStatistics, US002_FilterByDateRange | FR-001, FR-002, FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-207, FR-401, FR-403, FR-601 | BR-001, BR-002, BR-003, BR-004, BR-005, BR-006, DEC-001, DEC-002 | TBD (draft) |
| CAP-02 | Xuất thống kê | Tải bảng đang xem ra tệp CSV | US003_ExportUnitStatistics | FR-402, FR-602 | — | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Cột "Total user have atleast kudos" đếm người đã nhận ít nhất 1 Kudo, đã gửi ít nhất 1 Kudo, hay một trong hai? | Đếm người đã **nhận** ít nhất 1 Kudo Public trong khoảng ngày | Tên cột nói "có Kudo" (được ghi nhận); mô tả feature cũng viết "số người có ≥1 Kudos"; người gửi đã có cột Kudo gửi | yes |
| D002 | Kudo gửi và Kudo nhận được gán cho đơn vị nào? | Kudo gửi tính cho đơn vị của người gửi, Kudo nhận tính cho đơn vị của người nhận; Kudo ẩn danh vẫn tính cho đơn vị người gửi | Mỗi Kudo có hai đầu, hai cột riêng nên mỗi đầu về đơn vị của chính người đó | yes |
| D003 | Khoảng ngày lọc theo thời điểm nào? | Kudo lọc theo ngày gửi; Secret Box lọc theo ngày được cấp; ngày đầu và ngày cuối tính trọn ngày giờ Việt Nam | Khớp cách F007_AdminModeration lọc ngày; Secret Box chỉ có ngày cấp và ngày mở, ngày cấp là mốc "nhận" | no |
| D004 | "Total member" đếm ai và có đổi theo khoảng ngày không? | Đếm mọi hồ sơ hiện thuộc đơn vị (kể cả Admin), không đổi theo khoảng ngày | Đây là mẫu số "đơn vị có bao nhiêu người", không phải số hoạt động; không lưu lịch sử vào/ra đơn vị | no |
| D005 | Kudo bị Spam có tính vào các con số không? | Không; chỉ Kudo Public được tính | Khớp F007_AdminModeration: Kudo Spam không tính vào mọi số thống kê | no |
| D006 | "Total received secret box" tính hộp đã cấp hay chỉ hộp đã mở? | Tính mọi hộp đã cấp trong khoảng ngày (cả đã mở lẫn chưa mở) | "Received" nghĩa là nhận; hộp chưa mở vẫn là hộp đã nhận | no |
| D007 | Sunner chưa thuộc đơn vị nào hiện ở đâu? | Thêm dòng "Chưa gán đơn vị" ở cuối bảng, chỉ hiện khi có người như vậy; dòng "All" luôn gồm cả họ | Để tổng các đơn vị cộng lại bằng dòng "All", không có số "mồ côi" | no |
| D008 | Khoảng ngày mặc định khi mở trang là gì? | Để trống (toàn thời gian) | Thiết kế chỉ minh hoạ một khoảng ngày mẫu; mặc định theo "tháng này" sẽ bất ngờ khi BTC mở giữa kỳ | no |
| D009 | Có làm dropdown chọn nhanh khoảng thời gian (thiết kế có khung "chọn thời gian") không? | Bản đầu chỉ có chọn khoảng ngày bằng lịch; chưa làm mục chọn nhanh (Hôm nay, 7 ngày, 30 ngày) | Khung đó chưa rõ nội dung `[INFERRED]`; làm khi có yêu cầu rõ (YAGNI) | no |
| D010 | Nhãn cột hiển thị chữ gì (thiết kế có lỗi chính tả "reveived", "atleast")? | Dùng "Total received kudos" và "Total users with at least 1 kudo"; tiếng Việt qua next-intl | Có vẻ là lỗi chính tả; nhãn tiếng Việt chưa có trên thiết kế | no |
| D011 | Thứ tự các đơn vị trong bảng? | Theo tên A-Z (số trong tên xếp tự nhiên, CECV2 trước CECV10), "Chưa gán đơn vị" cuối cùng; không sắp xếp bằng cách bấm đầu cột | Thiết kế không có biểu tượng sắp xếp; số đơn vị ít | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi Sunner thuộc tối đa một đơn vị; thống kê gom theo đơn vị hiện tại ghi trong hồ sơ.
- **FR-002** Chỉ Kudo Public được tính vào mọi số liệu về Kudo; Kudo Spam không tính.

### Navigation (1xx)

- **FR-101** Admin vào trang Overview từ mục "Overview" trên menu khu Admin.

### Admin Overview (2xx)

- **FR-201** Bảng có các cột No, Unit, Total member, Total sent kudos, Total received kudos, Total users with at least 1 kudo, Total received secret box.
- **FR-202** Dòng đầu tiên là "All" (tổng toàn hệ thống), sau đó mỗi đơn vị một dòng theo thứ tự tên.
- **FR-203** Khoảng ngày lọc bốn chỉ số hoạt động (Kudo gửi, Kudo nhận, người có Kudo, Secret Box nhận); "Total member" không đổi theo khoảng ngày.
- **FR-204** Admin để trống một đầu hoặc cả hai đầu khoảng ngày (cả hai trống là toàn thời gian); mỗi ngày tính trọn ngày giờ Việt Nam.
- **FR-205** Đơn vị chưa có hoạt động nào vẫn hiện dòng với giá trị 0; dòng "Chưa gán đơn vị" hiện khi có Sunner chưa thuộc đơn vị nào.
- **FR-206** Bảng hiện đủ mọi đơn vị trên một trang, không phân trang.
- **FR-207** Trong lúc tải hiện trạng thái chờ; khi tải lỗi hiện thông báo kèm nút thử lại; không để bảng trắng.

### Interaction (4xx)

- **FR-401** Đổi khoảng ngày thì bảng cập nhật theo và địa chỉ trang giữ khoảng ngày đã chọn (tải lại hoặc chia sẻ địa chỉ vẫn ra đúng số liệu).
- **FR-402** Export tải tệp CSV đúng số liệu của bảng đang xem, gồm cả dòng "All", theo khoảng ngày đang chọn.
- **FR-403** Ngày bắt đầu sau ngày kết thúc bị từ chối kèm thông báo lỗi; bảng giữ nguyên.

### Security (6xx)

- **FR-601** Chỉ Admin vào được trang Overview và dùng Export; người khác nhận trang 403, kể cả khi gọi thẳng vào hệ thống.
- **FR-602** Tệp Export an toàn khi mở bằng Excel: ô văn bản không thể chạy thành công thức.

## 5. Business Rules

- Một Kudo chỉ tính khi đang Public và ngày gửi nằm trong khoảng ngày; ngày tính theo giờ Việt Nam, đầu và cuối khoảng đều trọn ngày (BR-001) [NEEDS_DOMAIN_CONFIRMATION] D003, D005
- Kudo gửi tính cho đơn vị của người gửi, Kudo nhận tính cho đơn vị của người nhận; Kudo ẩn danh vẫn tính cho đơn vị người gửi (BR-002) [NEEDS_DOMAIN_CONFIRMATION] D002
- "Total users with at least 1 kudo" đếm số người khác nhau đã nhận ít nhất 1 Kudo trong khoảng ngày, mỗi người một lần dù nhận nhiều (BR-003) [NEEDS_DOMAIN_CONFIRMATION] D001
- "Total member" là số hồ sơ hiện thuộc đơn vị, không phụ thuộc khoảng ngày (BR-004) [NEEDS_DOMAIN_CONFIRMATION] D004
- "Total received secret box" đếm mọi hộp được cấp cho người của đơn vị trong khoảng ngày, đã mở hay chưa; hộp không bị trừ khi Kudo sinh ra nó sau này bị Spam (BR-005) [NEEDS_DOMAIN_CONFIRMATION] D006
- Dòng "All" bằng tổng toàn hệ thống và bằng tổng các dòng đơn vị cộng dòng "Chưa gán đơn vị" (BR-006)
- Dòng "Chưa gán đơn vị" chỉ hiện khi có ít nhất một Sunner chưa thuộc đơn vị nào (DEC-001) [NEEDS_DOMAIN_CONFIRMATION] D007
- Khoảng ngày trống cả hai đầu thì tính toàn thời gian; chỉ có ngày bắt đầu thì tính từ ngày đó đến hiện tại; chỉ có ngày kết thúc thì tính từ đầu đến hết ngày đó (DEC-002) [NEEDS_DOMAIN_CONFIRMATION] D008

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Admin Overview | TBD (draft) | Tiêu đề "Overview", ô khoảng ngày kèm biểu tượng lịch, nút Export màu vàng, bảng thống kê theo đơn vị với dòng "All" ở đầu | Chọn khoảng ngày, xem số liệu, Export |

### User Journey

1. Admin bấm "Overview" trên menu Admin, thấy bảng số liệu toàn thời gian: dòng "All" rồi từng đơn vị.
2. Admin chọn khoảng ngày bằng lịch — bảng cập nhật, bốn chỉ số hoạt động chỉ tính trong khoảng đó, "Total member" giữ nguyên.
3. Admin so các đơn vị với nhau và với dòng "All".
4. Admin bấm "Export" — trình duyệt tải về tệp CSV đúng như bảng đang xem.

## 7. User Stories

### US001_ViewUnitStatistics — Xem thống kê theo đơn vị

**Actor:** Admin
**Goal:** Xem số thành viên, Kudo gửi, Kudo nhận, số người có Kudo và Secret Box nhận của từng đơn vị trong một bảng.
**Business value:** BTC thấy đơn vị nào sôi nổi, đơn vị nào chưa tham gia để kịp thúc đẩy trước khi lễ trao giải.

**Acceptance Criteria:**
- [ ] Có đủ bảy cột và dòng "All" đầu tiên, tiếp theo là từng đơn vị.
- [ ] Đơn vị không có hoạt động vẫn hiện, giá trị bằng 0.
- [ ] Dòng "All" bằng tổng các dòng còn lại.
- [ ] Người không phải Admin không vào được.

### US002_FilterByDateRange — Lọc theo khoảng ngày

**Actor:** Admin
**Goal:** Giới hạn bốn chỉ số hoạt động vào một giai đoạn do mình chọn.
**Business value:** BTC báo cáo theo tuần, theo tháng hoặc theo đợt phát động thay vì chỉ có tổng cả chiến dịch.

**Acceptance Criteria:**
- [ ] Chọn khoảng ngày thì bảng cập nhật; "Total member" không đổi.
- [ ] Ngày cuối được tính trọn ngày.
- [ ] Để trống một đầu hoặc cả hai đầu vẫn hoạt động.
- [ ] Ngày bắt đầu sau ngày kết thúc thì báo lỗi.

### US003_ExportUnitStatistics — Xuất thống kê

**Actor:** Admin
**Goal:** Tải bảng đang xem ra tệp để làm báo cáo.
**Business value:** BTC đưa số liệu vào báo cáo, slide mà không phải chép tay.

**Acceptance Criteria:**
- [ ] Tệp có số liệu giống hệt bảng đang xem, gồm dòng "All", theo khoảng ngày đang chọn.
- [ ] Mở bằng Excel hiển thị đúng tiếng Việt.

## 8. Scenarios

### US001_ViewUnitStatistics — Happy Path

**Given** hệ thống có ba đơn vị và một số Kudo đã gửi, **When** Admin mở trang Overview, **Then** thấy dòng "All" rồi ba dòng đơn vị, số trên dòng "All" bằng tổng ba dòng.

### US001_ViewUnitStatistics — Error: Không phải Admin

**Given** Sunner thường đã đăng nhập, **When** mở địa chỉ trang Overview, **Then** thấy trang 403 và không có số liệu nào.

### US002_FilterByDateRange — Happy Path

**Given** một Kudo gửi lúc 23:30 ngày 05/12 giờ Việt Nam, **When** Admin chọn khoảng 01/12 đến 05/12, **Then** Kudo đó được tính vào Kudo gửi của đơn vị người gửi và Kudo nhận của đơn vị người nhận.

### US002_FilterByDateRange — Error: Khoảng ngày ngược

**Given** Admin chọn từ ngày 10/12 đến ngày 05/12, **When** áp dụng, **Then** hiện lỗi "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" và bảng giữ nguyên.

### US003_ExportUnitStatistics — Happy Path

**Given** Admin đã chọn khoảng 01/12 đến 05/12, **When** bấm Export, **Then** tải về tệp có dòng "All" và mọi đơn vị với đúng số liệu bảng đang hiện.

### US003_ExportUnitStatistics — Error: Lỗi khi tạo tệp

**Given** dịch vụ dữ liệu đang lỗi, **When** Admin bấm Export, **Then** không có tệp và hiện "Không xuất được số liệu. Vui lòng thử lại."

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Hệ thống chưa có Kudo nào | Mọi chỉ số hoạt động bằng 0, "Total member" vẫn đúng | "None — silent handling" |
| Chưa có đơn vị nào được tạo | Bảng chỉ có dòng "All" (và dòng "Chưa gán đơn vị" nếu có người) | "Chưa có đơn vị nào." |
| Khoảng ngày không có hoạt động | Mọi chỉ số hoạt động bằng 0, "Total member" giữ nguyên | "None — silent handling" |
| Tải bảng thất bại | Vùng bảng hiện lỗi kèm nút thử lại, khoảng ngày giữ nguyên | "Không tải được số liệu. Vui lòng thử lại." |
| Sunner đổi đơn vị sau khi đã gửi Kudo | Mọi số liệu của người đó chuyển sang đơn vị mới, không lưu lịch sử | "None — silent handling" |
| Một Kudo giữa hai người cùng đơn vị | Tính một lần vào Kudo gửi và một lần vào Kudo nhận của đơn vị đó | "None — silent handling" |
| Kudo bị Mark Spam hoặc được Un Spam | Số liệu lần tải kế loại hoặc tính lại Kudo đó; hộp đã cấp giữ nguyên | "None — silent handling" |
| Sunner thường mở trang Admin hoặc gọi thẳng Export | Bị từ chối, không có số liệu | "Bạn không có quyền truy cập trang này." |
| Admin bị hạ role giữa chừng | Thao tác kế tiếp (đổi ngày, Export) bị từ chối | "Bạn không có quyền truy cập trang này." |

## 10. Edge Behaviours to Verify

- **FR-001** → Đổi đơn vị của một Sunner thì số liệu của người đó chuyển sang đơn vị mới ở lần tải kế.
- **FR-002** → Mark Spam một Kudo thì số Kudo gửi, nhận và số người có Kudo giảm tương ứng; Un Spam trả lại.
- **FR-101** → Mục "Overview" trên menu Admin mở đúng trang.
- **FR-201** → Bảng có đủ bảy cột đúng tên.
- **FR-202** → Dòng "All" ở đầu; các đơn vị xếp theo tên, CECV2 đứng trước CECV10.
- **FR-203** → Chọn khoảng ngày thì "Total member" giữ nguyên, bốn chỉ số còn lại đổi theo.
- **FR-204** → Chọn ngày kết thúc 05/12 thì Kudo gửi lúc 23:30 ngày 05/12 vẫn có mặt; để trống cả hai đầu cho số toàn thời gian.
- **FR-205** → Đơn vị không có hoạt động vẫn hiện số 0; có Sunner chưa gán đơn vị thì dòng "Chưa gán đơn vị" hiện.
- **FR-206** → Không có phân trang dù có nhiều đơn vị.
- **FR-207** → Ngắt mạng thì thấy lỗi kèm nút thử lại, không thấy bảng trắng.
- **FR-401** → Chọn khoảng ngày rồi tải lại trang: khoảng ngày và số liệu giữ nguyên.
- **FR-402** → Export cho tệp trùng từng số với bảng, gồm dòng "All".
- **FR-403** → Chọn ngày bắt đầu sau ngày kết thúc thì thấy lỗi và bảng không đổi.
- **FR-601** → Sunner thường mở trang Overview nhận trang 403; gọi thẳng Export cũng bị từ chối.
- **FR-602** → Mở tệp Export bằng Excel: ô có ký tự công thức đầu ô hiện như chữ thường.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Định nghĩa các chỉ số (người có Kudo, gán đơn vị, tính theo ngày nào) là suy đoán từ nhãn cột trên thiết kế | Số liệu BTC nhìn thấy lệch với kỳ vọng, báo cáo sai | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | "Total member" không theo khoảng ngày, còn các chỉ số khác theo khoảng ngày | So sánh hai kỳ khác nhau dễ hiểu nhầm đơn vị đông lên hoặc giảm đi | [INFERRED] |
| RISK-03 | risk | Không lưu lịch sử đơn vị; Sunner chuyển đơn vị thì số liệu cũ chuyển theo | Số của đơn vị cũ giảm, đơn vị mới tăng so với báo cáo đã xuất trước đó | [INFERRED] |
| RISK-04 | risk | Tổng hợp trên toàn bộ Kudo mỗi lần mở trang hoặc đổi ngày | Chậm khi Kudo lên hàng chục nghìn bản ghi vào cao điểm lễ trao giải | [INFERRED] |
| RISK-05 | risk | Tệp Export là số liệu nội bộ theo đơn vị, không có nhật ký ai đã xuất | Rủi ro lộ số liệu nội bộ ngoài công ty | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Hồ sơ Sunner, danh mục đơn vị (phòng ban) và kiểm role Admin | FR-001, FR-601 |
| F002_AppShell | feature | Khung Admin, mục "Overview" trên menu, trang 403, đổi ngôn ngữ | FR-101, FR-601 |
| F003_KudosAuthoring | feature | Nguồn dữ liệu Kudo: người gửi, người nhận, ngày gửi, ẩn danh | BR-001, BR-002 |
| F007_AdminModeration | feature | Trạng thái Public/Spam của Kudo; quy ước ngày và tệp CSV dùng chung | FR-002, FR-402, FR-602 |
| F010_SecretBoxRewards | feature | Nguồn dữ liệu Secret Box đã cấp và ngày cấp | BR-005 |

## 13. Configuration

```text
DEFAULT_DATE_RANGE = (trống)    # mở trang chưa chọn ngày: tính toàn thời gian (đề xuất, D008)
```
