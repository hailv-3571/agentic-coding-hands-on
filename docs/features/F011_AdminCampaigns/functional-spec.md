<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft, provenance inherited from the folder) -->

# Functional Spec — F011_AdminCampaigns

**Priority**: P2
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F011_AdminCampaigns → SCR (TBD (draft)) → US001_ListCampaigns, US002_AddCampaign, US003_EditCampaign, US004_DeleteCampaign, US005_ActiveCampaignDoubleHearts

## 1. Overview

**Problem:** BTC muốn chạy các khung giờ "Ngày x2 tim" để kích thích Sunner thả tim, nhưng hệ số tim không thể cứng trong mã: mỗi đợt có giờ bắt đầu và kết thúc riêng, và người vận hành phải tự chỉnh được mà không nhờ lập trình viên.
**Solution:** Trang Setting trong khu Admin liệt kê các campaign (tên, giờ bắt đầu, giờ kết thúc) và cho Admin thêm, sửa, xoá. Campaign nào đang trong khung giờ của nó thì tim Sunner nhận được trong lúc đó nhân đôi; feature này cung cấp cho F005 và F010 thông tin "có campaign đang chạy không, tên và khung giờ là gì".
**Scope:** Quản lý campaign (danh sách, thêm, sửa, xoá, kiểm hợp lệ, cấm chồng giờ); xác định campaign đang hiệu lực tại một thời điểm và trả cho F005 / F010.
**Non-Scope:** Tính hệ số và đếm tim (F005_KudosHearts; campaign ở đây không đổi tim đã thả); hiển thị nhãn / tooltip x2 trên bảng thống kê cá nhân (F010_SecretBoxRewards); khung, menu khu Admin (F002_AppShell); kiểm tra role Admin (F001_Auth); hệ số tuỳ chỉnh khác 2 (D001); các loại cấu hình khác ngoài campaign trên trang Setting; thông báo cho Sunner khi campaign bắt đầu (F013_Notifications, chưa yêu cầu).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Admin | Sunner có role Admin | Đặt khung giờ x2 tim đúng, sửa khi đổi kế hoạch, gỡ campaign không còn dùng |
| Sunner | Nhân viên đã đăng nhập | Được nhân đôi tim nhận trong khung giờ campaign và biết khung giờ đó |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Xem danh sách campaign | Vào trang Setting, xem bảng campaign và mở menu thao tác từng dòng | US001_ListCampaigns | FR-002, FR-101, FR-201, FR-202, FR-204, FR-205, FR-404, FR-601, FR-602 | BR-006, DEC-001 | TBD (draft) |
| CAP-02 | Thêm và sửa campaign | Mở hộp thoại, nhập tên cùng giờ bắt đầu / kết thúc, lưu; sửa theo luật khoá của từng giai đoạn | US002_AddCampaign, US003_EditCampaign | FR-001, FR-003, FR-203, FR-301, FR-302, FR-303, FR-304, FR-305, FR-306, FR-307 | BR-002, BR-003, BR-004, DEC-002 | TBD (draft) |
| CAP-03 | Xoá campaign | Xoá campaign chưa kết thúc sau khi xác nhận | US004_DeleteCampaign | FR-308 | BR-005 | TBD (draft) |
| CAP-04 | Cung cấp campaign đang hiệu lực | Sunner nhận tim nhân đôi trong khung giờ campaign; F005 và F010 lấy được campaign đang chạy | US005_ActiveCampaignDoubleHearts | FR-401, FR-402, FR-403 | BR-001 | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Hệ số nhân cố định x2 hay Admin chỉnh được (x3, x1.5...)? (F005 đã hỏi; F011 nêu khuyến nghị) | Cố định x2; form chỉ có tên, giờ bắt đầu, giờ kết thúc; không có cột hệ số | Thiết kế chỉ có ba trường đó và chữ "x2" nằm cứng trong tooltip; thêm cột hệ số khi có yêu cầu thật (YAGNI) | no |
| D002 | Hai campaign có được chồng khoảng giờ không? | Không: từ chối khi lưu và nêu campaign đang trùng; campaign sau bắt đầu đúng lúc campaign trước kết thúc thì được | Chồng giờ không có nghĩa nghiệp vụ (hệ số vẫn là 2) và làm "campaign đang chạy" không còn duy nhất, tooltip khó hiển thị | no |
| D003 | Sửa hoặc xoá campaign đã kết thúc / đang chạy có được không? | Đã kết thúc: chỉ đọc, không sửa, không xoá. Đang chạy: sửa được tên và giờ kết thúc, khoá giờ bắt đầu; xoá được. Chưa chạy: sửa và xoá tự do | Giữ lịch sử đã chạy; chặn đổi giờ bắt đầu quá khứ; xoá campaign đang chạy là cách dừng sớm. Tim đã thả giữ nguyên hệ số (BR-005) nên không thiệt hại hồi tố | no |
| D004 | Giờ nhập và hiển thị theo múi giờ nào? | Giờ Việt Nam (UTC+7) cho mọi Admin; hệ thống lưu theo giờ quốc tế (UTC) | Công ty và sự kiện ở Việt Nam; thiết kế không có bộ chọn múi giờ | no |
| D005 | Giờ bắt đầu trong quá khứ hoặc giờ kết thúc đã qua có được nhập không? | Giờ bắt đầu trong quá khứ được (campaign chạy ngay); giờ kết thúc phải sau hiện tại và sau giờ bắt đầu | Cho phép "bật ngay" mà không cần chờ phút kế; campaign kết thúc rồi thì vô nghĩa | no |
| D006 | Bảng sắp xếp thế nào và có phân trang không? | Giờ bắt đầu mới nhất trước; hiện toàn bộ, không phân trang | Thiết kế không có phân trang; số campaign mỗi sự kiện rất ít | no |
| D007 | Tên campaign dài tối đa bao nhiêu, có bắt trùng tên không? | Bắt buộc, cắt khoảng trắng hai đầu, tối đa 100 ký tự, cho phép trùng tên | Tên chỉ để Admin nhận biết; cấm trùng tên thêm lỗi mà không có lợi ích | no |
| D008 | Có lưu ai tạo / sửa campaign và lịch sử thay đổi không? | Không; chỉ lưu thời điểm tạo và sửa gần nhất | Yêu cầu tối thiểu, khớp cách F007 xử lý lịch sử kiểm duyệt | no |
| D009 | Nội dung hộp "Delete Campaign", nhãn hai nút của hộp đó và nhãn nút lưu của hộp "Edit Campaign"? | Hộp nêu tên campaign và câu hỏi xác nhận; nút xác nhận "Delete", nút huỷ "Cancel"; nút lưu của hộp sửa "Save" | Chưa đọc được chữ trên thiết kế; chờ đối chiếu frame | no |
| D010 | Menu thao tác mỗi dòng có những mục nào? | Hai mục: Edit và Delete | Popover thiết kế nhỏ, suy ra hai mục `[INFERRED]` | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi campaign có mã số (ID), tên, giờ bắt đầu và giờ kết thúc (gồm ngày, giờ, phút).
- **FR-002** Giờ nhập và giờ hiển thị luôn theo giờ Việt Nam; hệ thống lưu thống nhất theo giờ quốc tế.
- **FR-003** Hai campaign không bao giờ chồng khoảng giờ lên nhau.

### Navigation (1xx)

- **FR-101** Admin vào trang Setting từ mục "Settings" trên menu khu Admin.

### Setting — danh sách (2xx)

- **FR-201** Bảng có bốn cột ID, Name, Time, Actions; mỗi dòng một campaign, cột Time hiện giờ bắt đầu và giờ kết thúc dạng ngày/tháng/năm - giờ:phút.
- **FR-202** Bảng sắp theo giờ bắt đầu mới nhất trước và hiện toàn bộ campaign, không phân trang.
- **FR-203** Nút "Add Campaign" ở góc trên bên phải trang mở hộp thoại thêm campaign.
- **FR-204** Mỗi dòng có biểu tượng thao tác mở menu Edit / Delete; mục không áp dụng cho giai đoạn của campaign thì ẩn hoặc làm mờ.
- **FR-205** Chưa có campaign nào thì bảng hiện trạng thái trống kèm gợi ý bấm "Add Campaign".

### Hộp thoại Add / Edit / Delete (3xx)

- **FR-301** Hộp "Add Campaign" có ô Campaign Name, ô Start Date, ô End Date (đều bắt buộc, chọn ngày kèm giờ bằng bộ chọn lịch), nút Cancel và nút Add Campaign.
- **FR-302** Hộp "Edit Campaign" có cùng các ô, điền sẵn giá trị hiện tại của campaign.
- **FR-303** Hệ thống kiểm: tên không rỗng và tối đa 100 ký tự; có đủ giờ bắt đầu và kết thúc; giờ kết thúc sau giờ bắt đầu và sau thời điểm hiện tại; lỗi hiện ngay dưới ô liên quan.
- **FR-304** Khoảng giờ trùng campaign khác thì không lưu và báo rõ tên cùng khoảng giờ của campaign đang trùng.
- **FR-305** Lưu thành công thì hộp thoại đóng, bảng cập nhật và hiện thông báo thành công; Cancel đóng hộp mà không lưu gì.
- **FR-306** Campaign đang chạy: ô giờ bắt đầu bị khoá, vẫn sửa được tên và giờ kết thúc.
- **FR-307** Campaign đã kết thúc: chỉ xem, không có Edit và Delete.
- **FR-308** Delete mở hộp xác nhận "Delete Campaign" nêu tên campaign; chỉ khi xác nhận mới xoá, Cancel đóng hộp mà không xoá.

### Interaction (4xx)

- **FR-401** Campaign đang hiệu lực tại một thời điểm là campaign có giờ bắt đầu không muộn hơn thời điểm đó và giờ kết thúc muộn hơn thời điểm đó; không có thì không có campaign đang hiệu lực.
- **FR-402** Thêm, sửa, xoá có hiệu lực cho lần thả tim kế tiếp; tim đã thả giữ nguyên hệ số tại lúc thả.
- **FR-403** Với campaign đang hiệu lực, hệ thống cung cấp tên, giờ bắt đầu và giờ kết thúc để F010 hiện nhãn và tooltip "x2" cạnh "Số tim bạn nhận được".
- **FR-404** Không tải được bảng hoặc lưu / xoá lỗi thì hiện thông báo lỗi kèm nút thử lại, dữ liệu trên màn không bị đổi.

### Security (6xx)

- **FR-601** Chỉ Admin xem và thay đổi campaign; người không phải Admin bị chặn ở trang và ở từng thao tác thêm, sửa, xoá.
- **FR-602** Bảng campaign không đọc được trực tiếp từ trình duyệt bằng khoá công khai của dịch vụ dữ liệu; mọi truy cập đi qua máy chủ.

## 5. Business Rules

- Campaign đang hiệu lực khi giờ hiện tại từ giờ bắt đầu đến trước giờ kết thúc (đúng giờ kết thúc thì đã hết); không chồng giờ nên tối đa một campaign đang hiệu lực (BR-001)
- Hai campaign chồng giờ khi mỗi cái bắt đầu trước khi cái kia kết thúc; kết thúc đúng lúc cái khác bắt đầu thì không chồng; luôn bị từ chối (BR-002)
- Campaign hợp lệ khi tên không rỗng (sau khi cắt khoảng trắng) và tối đa 100 ký tự, giờ kết thúc sau giờ bắt đầu và sau hiện tại (BR-003)
- Quyền sửa xoá theo giai đoạn: đã kết thúc chỉ đọc; đang chạy sửa tên và giờ kết thúc, xoá được; chưa chạy sửa và xoá tự do (BR-004)
- Hệ số x2 gắn vào mỗi tim ngay lúc thả; sửa hay xoá campaign không tính lại tim đã thả (BR-005)
- Giờ hiển thị và nhập theo giờ Việt Nam, lưu theo giờ quốc tế; một campaign hiển thị cùng giờ cho mọi Admin (BR-006)
- Menu dòng: đã kết thúc không có mục nào; đang chạy và chưa chạy có Edit và Delete (DEC-001)
- Hộp Edit khoá ô giờ bắt đầu khi campaign đang chạy, mở khoá khi chưa chạy (DEC-002)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Admin Setting (Campaign) | TBD (draft) | Tiêu đề "Setting", nút "Add Campaign" màu vàng, bảng tối ID / Name / Time / Actions, menu thao tác từng dòng, hộp xác nhận "Delete Campaign" | Thêm campaign, mở menu dòng, chọn Edit hoặc Delete, xác nhận xoá |
| Hộp thoại Add / Edit Campaign | TBD (draft) | Tiêu đề "Add Campaign" hoặc "Edit Campaign", ba ô Campaign Name, Start Date, End Date (ngày kèm giờ), nút Cancel và nút lưu màu vàng | Nhập, chọn ngày giờ bằng lịch, lưu hoặc huỷ |

### User Journey

1. Admin bấm "Settings" trên menu Admin và thấy bảng campaign, mới nhất trước.
2. Admin bấm "Add Campaign", nhập tên "Campaign x2 heart release landing page", chọn giờ bắt đầu và kết thúc rồi bấm nút thêm.
3. Khoảng giờ không trùng ai nên hộp đóng, dòng mới hiện trên bảng cùng thông báo thành công.
4. Đến giờ bắt đầu, tim mọi Sunner nhận được nhân đôi và F010 hiện nhãn x2; hết giờ kết thúc thì về hệ số 1.
5. Admin đổi kế hoạch: mở menu dòng, chọn Edit, dời giờ kết thúc; nếu trùng campaign khác thì thấy lỗi nêu campaign đó.
6. Muốn dừng sớm, Admin chọn Delete và xác nhận; tim đã thả trước đó vẫn giữ nguyên số.

## 7. User Stories

### US001_ListCampaigns — Xem danh sách campaign

**Actor:** Admin
**Goal:** Xem mọi campaign với giờ bắt đầu và kết thúc trong một bảng.
**Business value:** Admin biết đang có và sắp có khung giờ x2 nào trước khi thêm hay sửa.

**Acceptance Criteria:**
- [ ] Bảng có đủ bốn cột ID, Name, Time, Actions và campaign mới bắt đầu nằm trên cùng.
- [ ] Giờ hiển thị theo giờ Việt Nam.
- [ ] Chưa có campaign thì thấy trạng thái trống, không phải bảng trắng.
- [ ] Người không phải Admin không vào được trang.

### US002_AddCampaign — Thêm campaign

**Actor:** Admin
**Goal:** Tạo campaign mới với tên và khung giờ.
**Business value:** BTC bật khung giờ x2 tim đúng kế hoạch mà không cần sửa mã.

**Acceptance Criteria:**
- [ ] Thiếu tên, giờ bắt đầu hoặc giờ kết thúc thì thấy lỗi dưới ô và không lưu.
- [ ] Giờ kết thúc không sau giờ bắt đầu thì bị từ chối.
- [ ] Khoảng giờ trùng campaign khác thì bị từ chối kèm tên campaign trùng.
- [ ] Thêm thành công thì dòng mới hiện trên bảng.

### US003_EditCampaign — Sửa campaign

**Actor:** Admin
**Goal:** Đổi tên hoặc khung giờ của campaign chưa kết thúc.
**Business value:** Sửa kế hoạch khi sự kiện đổi mà không phải xoá làm lại.

**Acceptance Criteria:**
- [ ] Hộp Edit mở ra với giá trị hiện tại.
- [ ] Campaign đang chạy: ô giờ bắt đầu bị khoá.
- [ ] Campaign đã kết thúc không có Edit.
- [ ] Các luật kiểm hợp lệ và chống trùng giống lúc thêm.

### US004_DeleteCampaign — Xoá campaign

**Actor:** Admin
**Goal:** Xoá campaign chưa kết thúc sau khi xác nhận.
**Business value:** Dừng hoặc huỷ khung giờ x2 khi kế hoạch đổi.

**Acceptance Criteria:**
- [ ] Hộp "Delete Campaign" nêu tên campaign và cần xác nhận.
- [ ] Cancel không xoá gì.
- [ ] Campaign đã kết thúc không có Delete.
- [ ] Xoá campaign đang chạy không làm đổi số tim đã nhận.

### US005_ActiveCampaignDoubleHearts — Tim nhân đôi trong campaign

**Actor:** Sunner
**Goal:** Nhận tim gấp đôi trong khung giờ campaign và biết khung giờ đó.
**Business value:** Khuyến khích thả tim và gửi Kudo trong các đợt BTC chọn.

**Acceptance Criteria:**
- [ ] Trong khung giờ campaign, tim mới nhận được tính hệ số 2; ngoài khung giờ hệ số 1.
- [ ] Bảng thống kê cá nhân (F010) có thể hiện tên và khung giờ campaign đang chạy.
- [ ] Tim đã thả trước hoặc sau khung giờ không đổi khi Admin sửa hay xoá campaign.

## 8. Scenarios

### US001_ListCampaigns — Happy Path

**Given** có ba campaign, **When** Admin mở trang Setting, **Then** thấy ba dòng, campaign bắt đầu muộn nhất ở trên cùng.

### US001_ListCampaigns — Error: tải lỗi

**Given** máy chủ không trả được danh sách, **When** Admin mở trang Setting, **Then** thấy thông báo lỗi kèm nút thử lại thay vì bảng trống.

### US002_AddCampaign — Happy Path

**Given** chưa có campaign nào trong khoảng 23/12/2025 10:00 đến 24/12/2025 10:00, **When** Admin nhập tên, chọn khoảng đó và bấm Add Campaign, **Then** hộp đóng và dòng mới hiện trên bảng.

### US002_AddCampaign — Error: trùng giờ

**Given** đã có campaign từ 23/12/2025 10:00 đến 24/12/2025 10:00, **When** Admin thêm campaign từ 23/12/2025 18:00 đến 25/12/2025 10:00, **Then** không lưu và hiện lỗi nêu tên cùng khoảng giờ campaign đang trùng.

### US002_AddCampaign — Error: kết thúc không sau bắt đầu

**Given** hộp Add Campaign đang mở, **When** Admin chọn giờ kết thúc bằng hoặc trước giờ bắt đầu, **Then** thấy lỗi "Giờ kết thúc phải sau giờ bắt đầu" và nút lưu không tạo campaign.

### US003_EditCampaign — Happy Path

**Given** campaign chưa chạy, **When** Admin đổi giờ bắt đầu sang muộn hơn và lưu, **Then** bảng hiện giờ mới.

### US003_EditCampaign — Error: campaign đã kết thúc

**Given** Admin mở hộp Edit lúc 09:59 và campaign kết thúc lúc 10:00, **When** Admin bấm lưu lúc 10:01, **Then** không lưu và hiện "Chiến dịch đã kết thúc, không thể sửa".

### US004_DeleteCampaign — Happy Path

**Given** một campaign đang chạy, **When** Admin chọn Delete rồi xác nhận, **Then** dòng biến mất, tim từ giờ trở đi tính hệ số 1, tim đã nhận giữ nguyên.

### US004_DeleteCampaign — Error: đã bị xoá

**Given** Admin khác vừa xoá campaign, **When** Admin này xác nhận xoá cùng campaign, **Then** thấy "Chiến dịch không còn tồn tại" và bảng tải lại.

### US005_ActiveCampaignDoubleHearts — Happy Path

**Given** campaign chạy từ 10:00 đến 12:00, **When** Sunner thả tim lúc 11:00, **Then** tim đó tính hệ số 2.

### US005_ActiveCampaignDoubleHearts — Error: đọc campaign lỗi

**Given** không đọc được campaign, **When** Sunner thả tim, **Then** tim vẫn thả được với hệ số 1 và Sunner không thấy lỗi.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Tên chỉ có khoảng trắng hoặc dài hơn 100 ký tự | Không lưu | "Vui lòng nhập tên chiến dịch (tối đa 100 ký tự)" |
| Hai Admin cùng lưu hai campaign chồng giờ gần như cùng lúc | Chỉ bản đến trước được lưu, bản sau bị từ chối như lỗi trùng giờ | "Khoảng thời gian trùng với chiến dịch {tên} ({giờ bắt đầu} - {giờ kết thúc})" |
| Campaign B bắt đầu đúng giờ campaign A kết thúc | Cho phép; tại đúng giờ đó chỉ B đang hiệu lực | None — lưu bình thường |
| Chưa có campaign nào | Bảng hiện trạng thái trống | "Chưa có chiến dịch nào. Bấm Add Campaign để tạo." |
| Giờ kết thúc đã qua khi tạo hoặc sửa | Không lưu | "Giờ kết thúc phải sau thời điểm hiện tại" |
| Admin sửa hoặc xoá campaign vừa kết thúc trong lúc đang mở hộp thoại | Không thực hiện; bảng tải lại | "Chiến dịch đã kết thúc, không thể sửa hoặc xoá" |
| Sunner thả tim đúng lúc Admin xoá campaign đang chạy | Tim đã nhận giữ hệ số tại lúc thả; tim sau đó tính hệ số 1 | None — xử lý im lặng |
| Người không phải Admin mở trang hoặc gọi thao tác | Chặn, không đọc hay ghi gì | "Bạn không có quyền truy cập trang này" |
| Mạng lỗi khi lưu | Hộp vẫn mở, giữ nguyên dữ liệu đã nhập | "Không lưu được, vui lòng thử lại" |

## 10. Edge Behaviours to Verify

- **FR-003** → Thêm campaign chồng giờ campaign khác bị từ chối; campaign bắt đầu đúng lúc campaign trước kết thúc thì được lưu.
- **FR-303** → Mỗi lỗi nhập (thiếu tên, tên quá dài, kết thúc không sau bắt đầu, kết thúc đã qua) hiện đúng thông báo dưới đúng ô.
- **FR-306** → Mở Edit trên campaign đang chạy thấy ô giờ bắt đầu bị khoá, vẫn đổi được tên và giờ kết thúc.
- **FR-307** → Campaign đã kết thúc không có Edit và Delete trên menu dòng, và thao tác gọi thẳng cũng bị từ chối.
- **FR-401** → Tại đúng giờ bắt đầu campaign đang hiệu lực; tại đúng giờ kết thúc thì không.
- **FR-402** → Xoá campaign đang chạy rồi kiểm số tim đã nhận: không đổi; tim thả sau đó có hệ số 1.
- **FR-601** → Tài khoản Sunner thường gọi thao tác thêm, sửa, xoá đều bị chặn.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Xoá campaign đang chạy làm nhãn x2 biến mất đột ngột với Sunner đang xem | Sunner có thể tưởng lỗi; chỉ ảnh hưởng tim thả sau đó | [INFERRED] |
| RISK-02 | risk | Không lưu ai sửa hay xoá campaign (D008) | Khó truy vết khi có tranh cãi về hệ số | [INFERRED] |
| RISK-03 | risk | Admin nhập nhầm giờ (AM/PM, 12 giờ) khiến campaign lệch 12 tiếng | Khung giờ x2 sai nhưng vẫn hợp lệ | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Kiểm role Admin cho trang và từng thao tác | FR-601 |
| F002_AppShell | feature | Khung và menu khu Admin chứa mục "Settings" | FR-101 |
| F005_KudosHearts | feature | Nhận campaign đang hiệu lực qua giao diện đọc F005 khai báo để quyết hệ số | FR-401, FR-402 |
| F010_SecretBoxRewards | feature | Dùng tên và khung giờ campaign để hiện nhãn và tooltip x2 | FR-403 |
| F007_AdminModeration | feature | Dùng chung quy ước bảng Admin và múi giờ Admin | FR-002 |
| Cơ sở dữ liệu của hệ thống | infrastructure | Lưu campaign và chặn chồng giờ ở tầng dữ liệu | FR-003 |

## 13. Configuration

```text
CAMPAIGN_NAME_MAX_LENGTH = 100        # độ dài tối đa tên campaign (đề xuất, D007)
ADMIN_TIMEZONE = Asia/Ho_Chi_Minh     # múi giờ nhập và hiển thị giờ campaign (D004), dùng chung với F007
```
