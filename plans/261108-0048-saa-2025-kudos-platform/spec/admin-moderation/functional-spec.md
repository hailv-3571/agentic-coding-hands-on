<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft, provenance inherited from the folder) -->

# Functional Spec — F007_AdminModeration

**Priority**: P1
**Type**: mixed
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F007_AdminModeration → SCR (TBD (draft)) → US001_ReviewKudoList, US002_FilterSearchKudos, US003_MarkKudoSpam, US004_UnSpamKudo, US005_ExportKudos, US006_OwnerSeesSpamAlert

## 1. Overview

**Problem:** Kudo là nội dung do người dùng tự viết và hiện công khai cho cả công ty; nếu có bài vi phạm tiêu chuẩn cộng đồng thì BTC cần một chỗ xem toàn bộ Kudo, gỡ bài vi phạm khỏi các trang công khai và trả lại được khi gỡ nhầm.
**Solution:** Admin có trang "Review content": bảng mọi Kudo kèm bộ lọc, tìm kiếm, sắp xếp, phân trang, nút Mark Spam / Un Spam trên từng dòng và nút Export. Kudo bị đánh dấu Spam bị tạm ẩn khỏi feed; chủ bài vẫn thấy bài của mình kèm thẻ "Spam" và cảnh báo vi phạm, đồng thời được báo là bài bị tạm ẩn.
**Scope:** Trạng thái Public/Spam của Kudo và việc chuyển qua lại giữa hai trạng thái; bảng duyệt nội dung của Admin; Export; thẻ Kudo spam và cảnh báo cho chủ bài; phát sự kiện để thông báo cho chủ bài.
**Non-Scope:** Viết/sửa Kudo (F003_KudosAuthoring); hiển thị feed công khai (F004_KudosFeed, chỉ nhận trạng thái từ feature này); gửi và hiển thị thông báo (F013_Notifications); khung, menu, trang 403 của khu Admin (F002_AppShell); kiểm tra role Admin (F001_Auth); đổi role người dùng (F014_AdminUserManagement); tự động gắn cờ nội dung nghi vi phạm (ngoài phạm vi, D014); xoá hẳn Kudo, kiểm duyệt hàng loạt.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Admin | Sunner có role Admin | Rà soát mọi Kudo, tạm ẩn bài vi phạm, trả lại bài bị ẩn nhầm, xuất dữ liệu cho BTC |
| Chủ bài | Sunner là người gửi của Kudo bị tạm ẩn | Biết bài của mình bị tạm ẩn và vì sao |
| Sunner | Nhân viên đã đăng nhập | Chỉ xem nội dung hợp lệ; không thấy Kudo bị tạm ẩn của người khác |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Duyệt và lọc Kudo | Xem bảng mọi Kudo, lọc theo ngày/người gửi/người nhận/trạng thái, tìm theo nội dung, sắp theo tim, phân trang | US001_ReviewKudoList, US002_FilterSearchKudos | FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-207, FR-208, FR-402, FR-407, FR-601 | BR-002, DEC-001 | TBD (draft) |
| CAP-02 | Đánh dấu Spam / bỏ đánh dấu Spam | Chuyển một Kudo giữa Public và Spam, thấy kết quả ngay trên dòng | US003_MarkKudoSpam, US004_UnSpamKudo | FR-001, FR-002, FR-401, FR-403, FR-404, FR-406, FR-408, FR-602 | BR-001, BR-003, SM-001 | TBD (draft) |
| CAP-03 | Xuất dữ liệu | Tải tệp CSV các Kudo đang lọc | US005_ExportKudos | FR-405, FR-604 | BR-004, DEC-002 | TBD (draft) |
| CAP-04 | Cảnh báo vi phạm cho chủ bài | Thấy Kudo bị tạm ẩn của mình trong danh sách đã gửi kèm cảnh báo | US006_OwnerSeesSpamAlert | FR-301, FR-302, FR-303, FR-304, FR-603 | BR-005, DEC-003 | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Với Kudo gửi ẩn danh, Admin có thấy người gửi thật trong bảng và Export không? (câu hỏi chung của cả hệ thống) | Admin thấy người gửi thật kèm nhãn "Ẩn danh" và lọc được theo người gửi | Admin cần truy vết bài vi phạm; chờ chốt chung cho cả hệ thống | no |
| D002 | Khi Kudo bị Mark Spam, tim, huy hiệu Hero và Secret Box đã tích luỹ có bị thu hồi không? | Không xoá gì: số tim, huy hiệu, hộp tự loại Kudo Spam khi tính lại, Un Spam thì tự khôi phục; hộp đã cấp hoặc đã mở không bị thu hồi | Gỡ nhầm trả lại được, không phải cộng bù; thu hồi phần thưởng đã mở gây tranh cãi | no |
| D003 | Thẻ Kudo spam trong danh sách "Đã gửi" của chủ bài có mở được trang chi tiết không? | Không; chi tiết vẫn "không tìm thấy" với mọi người kể cả chủ bài (khớp F004) | Giữ một quy tắc "không Public thì không có trang chi tiết" | no |
| D004 | Mark Spam / Un Spam có bước xác nhận và có bắt nhập lý do không? | Có popover xác nhận ngắn, không bắt nhập lý do | Thiết kế có hai popover thao tác (Public/Spam) nhưng không thấy ô lý do | no |
| D005 | Chủ bài có được báo khi bài được Un Spam trở lại không? | Không; chỉ báo khi bị tạm ẩn (thông báo do F013 gửi) | Chỉ thấy lời nhắn cho chiều "bị tạm ẩn" trên thiết kế | no |
| D006 | Chủ bài có sửa được Kudo đang Spam không? | Không; khoá sửa đến khi Un Spam (F003 cần kiểm trạng thái) | Tránh sửa lách rồi chờ duyệt lại khi chưa có luồng khiếu nại | no |
| D007 | Export dùng định dạng nào, phạm vi nào? | Tệp CSV (mở được bằng Excel, đúng tiếng Việt), theo đúng bộ lọc đang chọn, tối đa 10.000 dòng (DEC-002) | Đơn giản, không cần thêm thư viện; XLSX chỉ làm khi có yêu cầu rõ | no |
| D008 | Có lưu lịch sử kiểm duyệt (ai, khi nào, từng lần) không? | Chỉ lưu Admin và thời điểm của lần thao tác gần nhất, không có bảng lịch sử | Yêu cầu tối thiểu; tăng cường sau nếu cần truy vết | no |
| D009 | Ô tìm theo nội dung có bỏ qua dấu tiếng Việt và hoa/thường không? | Không phân biệt hoa/thường và dấu | Admin gõ không dấu vẫn tìm ra | no |
| D010 | Cỡ trang bảng, thứ tự mặc định và cột Heart hiển thị số nào? | 10 dòng mỗi trang; mới nhất trước; Heart hiện số lượt thả (không nhân hệ số x2) | Thiết kế chỉ cho thấy phân trang "1 2 3 4 5"; số tim theo F005 | no |
| D011 | Cột ID hiển thị gì? | Mã rút gọn (8 ký tự đầu của mã Kudo) | Mã đầy đủ quá dài cho bảng; không có cột số thứ tự | no |
| D012 | Cảnh báo vi phạm là lớp phủ cố định trên thẻ spam hay hộp thoại đóng được? | Lớp phủ cố định trên thẻ trong danh sách của chủ bài, không có nút đóng [INFERRED] | Thiết kế có biến thể thẻ và một frame Alert Overlay, không rõ cách đóng | no |
| D013 | Nhãn cột người nhận trên thiết kế ghi "Recreiver" | Hiển thị "Receiver" (tiếng Anh) / "Người nhận" (tiếng Việt) | Có vẻ là lỗi chính tả | no |
| D014 | Có gắn cờ tự động nội dung nghi vi phạm và quyết định ba chiều (Hợp lệ / Tạm ẩn / Reject) như một thông báo trên thiết kế gợi ý không? | Giai đoạn 1 chỉ duyệt thủ công với hai trạng thái Public/Spam; gắn cờ tự động và Reject nằm ngoài phạm vi | Chưa có tiêu chí gắn cờ, chưa có trạng thái thứ ba trong dữ liệu; không tự bịa cơ chế | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi Kudo luôn ở đúng một trong hai trạng thái: Public hoặc Spam; Kudo mới luôn là Public.
- **FR-002** Hệ thống ghi lại Admin nào và lúc nào đã đổi trạng thái gần nhất của Kudo.

### Navigation (1xx)

- **FR-101** Admin vào trang Review content từ mục "Review content" trên menu khu Admin.

### Review content (2xx)

- **FR-201** Bảng liệt kê mọi Kudo ở cả hai trạng thái, mỗi dòng có ID, người gửi, người nhận, nội dung (tiêu đề và lời nhắn), hashtag (cắt gọn khi dài), số tim, trạng thái, thao tác.
- **FR-202** Bảng phân trang đánh số; Admin chuyển trang và thấy trang hiện tại.
- **FR-203** Admin lọc theo khoảng ngày gửi (từ ngày, đến ngày), được để trống một đầu.
- **FR-204** Admin lọc theo người gửi và người nhận bằng dropdown chọn từ danh sách Sunner, có ô tìm.
- **FR-205** Admin lọc theo trạng thái: Tất cả, Public hoặc Spam.
- **FR-206** Admin tìm theo nội dung Kudo bằng ô "Search by content".
- **FR-207** Admin sắp xếp theo số tim tăng hoặc giảm bằng cách bấm cột Heart.
- **FR-208** Dòng Public có nút "Mark Spam", dòng Spam có nút "Un Spam"; trạng thái hiện bằng huy hiệu Public (viền xanh) hoặc Spam (viền vàng).

### Cảnh báo cho chủ bài (3xx)

- **FR-301** Chủ bài vẫn thấy Kudo bị tạm ẩn của mình trong danh sách "Đã gửi" ở profile, có thẻ "Spam" màu cam ở góc trên bên phải thẻ.
- **FR-302** Thẻ đó kèm lớp cảnh báo "Cảnh báo vi phạm tiêu chuẩn cộng đồng".
- **FR-303** Thẻ Kudo bị tạm ẩn không cho thả tim, Copy Link hay sửa.
- **FR-304** Người khác không thấy Kudo bị tạm ẩn của chủ bài ở bất cứ đâu.

### Interaction (4xx)

- **FR-401** Admin bấm Mark Spam thì Kudo chuyển Spam; bấm Un Spam thì về Public; dòng cập nhật ngay, không tải lại trang.
- **FR-402** Đổi bất kỳ điều kiện lọc, tìm kiếm hay sắp xếp nào thì bảng về trang 1 và áp mọi điều kiện cùng lúc.
- **FR-403** Kudo Spam không còn được tính vào số tim, huy hiệu Hero, Secret Box và các số thống kê; Un Spam thì được tính lại.
- **FR-404** Kudo Spam biến mất khỏi Highlight, All Kudos, trang chi tiết và Spotlight; Un Spam thì hiện lại.
- **FR-405** Export tải về tệp CSV gồm toàn bộ Kudo khớp bộ lọc hiện tại, không chỉ trang đang xem.
- **FR-406** Hai Admin thao tác cùng một Kudo cùng lúc thì không có lỗi và không ghi đè nhau; Admin đến sau thấy trạng thái hiện tại.
- **FR-407** Khi không có Kudo phù hợp hoặc tải lỗi, hiện thông báo (kèm nút thử lại khi lỗi) thay vì bảng trắng.
- **FR-408** Khi Kudo bị Mark Spam, chủ bài nhận thông báo bài bị tạm ẩn (thông báo do F013_Notifications gửi, feature này chỉ phát sự kiện).

### Security (6xx)

- **FR-601** Chỉ Admin vào được trang Review content và dùng Mark Spam, Un Spam, Export; người khác nhận trang 403.
- **FR-602** Chỉ Admin đổi được trạng thái Kudo; chủ bài hay Sunner khác không tự đổi được, kể cả khi gọi thẳng vào hệ thống.
- **FR-603** Admin xem được Kudo Spam của mọi người; Sunner thường chỉ thấy Kudo Spam do chính mình gửi.
- **FR-604** Tệp Export an toàn khi mở bằng Excel: nội dung người dùng nhập không thể chạy thành công thức.

## 5. Business Rules

- Mark Spam chỉ áp cho Kudo đang Public và Un Spam chỉ áp cho Kudo đang Spam; lệnh trùng không báo lỗi và không ghi đè (BR-001)
- Bảng và Export dùng cùng một bộ lọc và một thứ tự: mọi điều kiện cùng đúng, ngày tính trọn ngày giờ Việt Nam, mặc định mới nhất trước (BR-002)
- Mark Spam chỉ đổi trạng thái, không xoá tim, huy hiệu, Secret Box; số đếm tự loại Kudo Spam, Un Spam thì tự khôi phục, hộp đã cấp không thu hồi (BR-003) [NEEDS_DOMAIN_CONFIRMATION] D002
- Ô nội dung bắt đầu bằng ký tự công thức được vô hiệu hoá khi ghi vào tệp Export (BR-004)
- Chủ bài chỉ nhận Kudo Spam do chính mình gửi (BR-005)
- Dòng trong bảng hiện nút theo trạng thái: Public thì "Mark Spam", Spam thì "Un Spam" (DEC-001)
- Export tải tệp CSV khi số dòng không vượt trần, vượt trần thì không tải và yêu cầu thu hẹp bộ lọc (DEC-002) [NEEDS_DOMAIN_CONFIRMATION] D007
- Thẻ spam với cảnh báo chỉ dựng cho chính chủ bài; người khác không nhận dữ liệu (DEC-003)
- Kudo là Public hoặc Spam; Public chuyển Spam khi Admin Mark Spam, Spam về Public khi Admin Un Spam, không có trạng thái khác (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Admin Review content | TBD (draft) | Tiêu đề, khoảng ngày và nút Export, bốn bộ lọc (Sender, Receiver, Status, Search by content), bảng Kudo, phân trang | Lọc, tìm, sắp xếp theo Heart, đổi trang, Mark Spam / Un Spam, Export |
| Cảnh báo vi phạm (thẻ spam + Alert Overlay) | TBD (draft) | Thẻ Kudo bị tạm ẩn có thẻ "Spam" cam và lớp "Cảnh báo vi phạm tiêu chuẩn cộng đồng" | Đọc cảnh báo |

### User Journey

1. Admin bấm "Review content" trên menu Admin, thấy bảng mọi Kudo mới nhất trước.
2. Admin lọc Status = Public và tìm theo từ khoá nghi vấn; bảng chỉ còn các dòng khớp.
3. Admin bấm "Mark Spam" ở dòng vi phạm, xác nhận; dòng đổi sang huy hiệu Spam và nút "Un Spam".
4. Kudo biến mất khỏi feed của mọi Sunner; chủ bài nhận thông báo bài bị tạm ẩn.
5. Chủ bài mở danh sách "Đã gửi" trong profile, thấy thẻ có "Spam" cam và cảnh báo vi phạm.
6. Admin thấy đã gỡ nhầm thì bấm "Un Spam"; Kudo hiện lại, tim và huy hiệu tính lại như cũ.
7. Admin bấm Export để tải tệp CSV các Kudo đang lọc gửi BTC.

## 7. User Stories

### US001_ReviewKudoList — Duyệt bảng Kudo

**Actor:** Admin
**Goal:** Xem mọi Kudo Public và Spam trong một bảng, theo từng trang.
**Business value:** BTC rà soát được toàn bộ nội dung trước khi nội dung gây ảnh hưởng.

**Acceptance Criteria:**
- [ ] Bảng có đủ cột ID, Sender, Receiver, Content, Hashtag, Heart, Status, Actions.
- [ ] Mới nhất trước; bấm cột Heart sắp theo tim tăng hoặc giảm.
- [ ] Phân trang đánh số hoạt động; không có Kudo thì thấy thông báo trống.
- [ ] Người không phải Admin không vào được.

### US002_FilterSearchKudos — Lọc và tìm Kudo

**Actor:** Admin
**Goal:** Thu hẹp bảng theo ngày, người gửi, người nhận, trạng thái và nội dung.
**Business value:** Tìm nhanh bài nghi vấn thay vì lật từng trang.

**Acceptance Criteria:**
- [ ] Các điều kiện kết hợp cùng lúc; để trống nghĩa là không lọc.
- [ ] Đổi điều kiện thì bảng về trang 1.
- [ ] Ngày kết thúc được tính trọn ngày.
- [ ] Ngày bắt đầu sau ngày kết thúc thì báo lỗi.

### US003_MarkKudoSpam — Đánh dấu Kudo là Spam

**Actor:** Admin
**Goal:** Tạm ẩn một Kudo vi phạm tiêu chuẩn cộng đồng.
**Business value:** Nội dung vi phạm không còn hiện công khai, giữ văn hoá Kudo tích cực.

**Acceptance Criteria:**
- [ ] Dòng đổi sang huy hiệu Spam và nút "Un Spam" ngay sau khi bấm.
- [ ] Kudo biến mất khỏi Highlight, All Kudos, trang chi tiết, Spotlight.
- [ ] Chủ bài được báo bài bị tạm ẩn.
- [ ] Hai Admin cùng bấm một lúc không gây lỗi.

### US004_UnSpamKudo — Bỏ đánh dấu Spam

**Actor:** Admin
**Goal:** Trả một Kudo bị tạm ẩn nhầm về Public.
**Business value:** Sửa được sai sót kiểm duyệt mà không mất dữ liệu của người dùng.

**Acceptance Criteria:**
- [ ] Dòng đổi lại sang huy hiệu Public và nút "Mark Spam".
- [ ] Kudo hiện lại ở feed, tim và huy hiệu tính lại đầy đủ.

### US005_ExportKudos — Xuất danh sách Kudo

**Actor:** Admin
**Goal:** Tải tệp các Kudo đang lọc để báo cáo hoặc lưu trữ.
**Business value:** BTC làm báo cáo ngoài hệ thống mà không phải chép tay.

**Acceptance Criteria:**
- [ ] Tệp gồm mọi Kudo khớp bộ lọc, không chỉ trang đang xem, cùng thứ tự với bảng.
- [ ] Mở bằng Excel hiển thị đúng tiếng Việt.
- [ ] Quá nhiều dòng thì không tải và báo thu hẹp bộ lọc.

### US006_OwnerSeesSpamAlert — Chủ bài thấy cảnh báo vi phạm

**Actor:** Chủ bài
**Goal:** Biết Kudo của mình bị tạm ẩn và vì sao.
**Business value:** Người gửi hiểu tiêu chuẩn cộng đồng và điều chỉnh lần gửi sau thay vì thắc mắc vì sao bài biến mất.

**Acceptance Criteria:**
- [ ] Trong danh sách "Đã gửi" ở profile, Kudo bị tạm ẩn có thẻ "Spam" cam ở góc trên phải và dòng cảnh báo.
- [ ] Không có nút thả tim, Copy Link, sửa trên thẻ đó.
- [ ] Sunner khác không thấy Kudo này ở bất cứ đâu.

## 8. Scenarios

### US001_ReviewKudoList — Happy Path

**Given** có 25 Kudo ở hai trạng thái, **When** Admin mở Review content và chuyển qua các trang, **Then** thấy 10, 10, 5 dòng mới nhất trước, không lặp, không sót.

### US001_ReviewKudoList — Error: Không phải Admin

**Given** Sunner thường đã đăng nhập, **When** mở địa chỉ Review content, **Then** thấy trang 403 và không có dữ liệu nào.

### US002_FilterSearchKudos — Happy Path

**Given** Kudo của nhiều người gửi, **When** Admin chọn Sender = "Nguyễn Văn An", khoảng ngày 01/12–05/12 và gõ "người hùng", **Then** chỉ còn các dòng thoả cả ba điều kiện, kể cả bài gửi trong ngày 05/12.

### US002_FilterSearchKudos — Error: Khoảng ngày ngược

**Given** Admin chọn từ ngày 10/12 đến ngày 05/12, **When** áp dụng, **Then** hiện lỗi "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" và bảng giữ nguyên.

### US003_MarkKudoSpam — Happy Path

**Given** Kudo Public đang hiện ở feed, **When** Admin bấm Mark Spam và xác nhận, **Then** dòng đổi sang Spam, Kudo biến mất khỏi feed ở lần tải kế và chủ bài nhận thông báo bài bị tạm ẩn.

### US003_MarkKudoSpam — Error: Đã bị Admin khác đánh dấu

**Given** Admin khác vừa Mark Spam đúng Kudo này, **When** Admin này bấm Mark Spam, **Then** dòng hiện trạng thái Spam hiện tại, không báo lỗi và không có thông báo thứ hai cho chủ bài.

### US004_UnSpamKudo — Happy Path

**Given** Kudo đang Spam, **When** Admin bấm Un Spam và xác nhận, **Then** dòng đổi sang Public và Kudo hiện lại ở feed cùng số tim như trước.

### US004_UnSpamKudo — Error: Lỗi hệ thống khi lưu

**Given** dịch vụ dữ liệu đang lỗi, **When** Admin bấm Un Spam, **Then** hiện "Không cập nhật được trạng thái. Vui lòng thử lại." và dòng giữ nguyên trạng thái cũ.

### US005_ExportKudos — Happy Path

**Given** bộ lọc cho 37 Kudo trải trên 4 trang, **When** Admin bấm Export, **Then** tải về tệp có đúng 37 dòng theo thứ tự đang xem.

### US005_ExportKudos — Error: Quá nhiều dòng

**Given** bộ lọc cho hơn 10.000 Kudo, **When** Admin bấm Export, **Then** không tải tệp và hiện "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc."

### US006_OwnerSeesSpamAlert — Happy Path

**Given** Kudo của tôi vừa bị Mark Spam, **When** tôi mở danh sách "Đã gửi" trong profile, **Then** thấy thẻ có "Spam" cam và dòng "Cảnh báo vi phạm tiêu chuẩn cộng đồng".

### US006_OwnerSeesSpamAlert — Error: Xem Kudo của người khác

**Given** Kudo của đồng nghiệp bị Mark Spam, **When** tôi xem profile hay feed, **Then** không thấy Kudo đó ở đâu.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Hai Admin Mark Spam cùng một Kudo cùng lúc | Chỉ một lệnh ghi; lệnh sau nhận trạng thái hiện tại | "None — silent handling" |
| Bộ lọc không khớp Kudo nào | Bảng hiện trạng thái trống, bộ lọc giữ nguyên | "Không có Kudo nào phù hợp bộ lọc." |
| Tải bảng thất bại | Vùng bảng hiện lỗi kèm nút thử lại | "Không tải được danh sách Kudo. Vui lòng thử lại." |
| Đang xem trang cuối thì dữ liệu giảm (Kudo bị chuyển trạng thái, lọc theo Status) | Bảng chuyển về trang cuối còn dữ liệu | "None — silent handling" |
| Lời nhắn có ký tự công thức đầu ô (ví dụ bắt đầu bằng dấu bằng) | Ô được vô hiệu hoá công thức trong tệp Export | "None — silent handling" |
| Kudo ẩn danh trong bảng và Export | Hiển thị người gửi theo D001 | "None — silent handling" |
| Chủ bài mở liên kết cũ của Kudo bị tạm ẩn | Trang "không tìm thấy" như mọi người | "Kudo này không tồn tại hoặc đã bị gỡ." |
| Sunner thường mở trang Admin hoặc gọi thẳng thao tác Admin | Bị từ chối, trạng thái không đổi | "Bạn không có quyền truy cập trang này." |
| Admin bị hạ role giữa chừng | Thao tác kế tiếp bị từ chối | "Bạn không có quyền truy cập trang này." |

## 10. Edge Behaviours to Verify

- **FR-001** → Kudo mới tạo luôn là Public; trạng thái chỉ có Public hoặc Spam.
- **FR-002** → Sau Mark Spam hoặc Un Spam, hệ thống ghi đúng Admin và thời điểm thao tác gần nhất.
- **FR-101** → Mục "Review content" trên menu Admin mở đúng trang.
- **FR-201** → Bảng có đủ cột; hashtag dài bị cắt gọn, không làm vỡ dòng.
- **FR-202** → Chuyển trang không lặp, không sót dòng.
- **FR-203** → Chọn ngày kết thúc 05/12 thì bài gửi lúc 23:30 ngày 05/12 vẫn có mặt.
- **FR-204** → Chọn Sender hoặc Receiver thì mọi dòng thuộc đúng người đó.
- **FR-205** → Status = Spam thì mọi dòng đều là Spam.
- **FR-206** → Tìm một từ trong lời nhắn thì chỉ còn các dòng chứa từ đó.
- **FR-207** → Bấm cột Heart hai lần đảo thứ tự tăng giảm, thứ tự ổn định giữa các trang.
- **FR-208** → Dòng Public chỉ có "Mark Spam", dòng Spam chỉ có "Un Spam".
- **FR-301** → Chủ bài thấy Kudo bị tạm ẩn trong "Đã gửi" với thẻ "Spam" cam ở góc trên phải.
- **FR-302** → Thẻ đó có dòng "Cảnh báo vi phạm tiêu chuẩn cộng đồng".
- **FR-303** → Thẻ bị tạm ẩn không có nút tim, Copy Link, sửa.
- **FR-304** → Đăng nhập tài khoản khác: Kudo đó không xuất hiện ở bất cứ đâu.
- **FR-401** → Mark Spam rồi Un Spam: dòng đổi tại chỗ hai lần, trang không tải lại.
- **FR-402** → Đang ở trang 3, đổi bộ lọc thì về trang 1.
- **FR-403** → Mark Spam một Kudo nhiều tim: tổng tim của người nhận và huy hiệu giảm tương ứng; Un Spam trả lại đúng như cũ.
- **FR-404** → Kudo bị Mark Spam không còn ở Highlight, All Kudos, chi tiết, Spotlight.
- **FR-405** → Export khi bảng đang ở trang 2: tệp vẫn chứa mọi trang.
- **FR-406** → Hai Admin bấm cùng lúc: không có thông báo lỗi, kết quả nhất quán.
- **FR-407** → Lọc ra kết quả rỗng thấy thông báo trống; ngắt mạng thấy lỗi kèm nút thử lại.
- **FR-408** → Mark Spam thì chủ bài nhận một thông báo tạm ẩn; lệnh trùng không tạo thông báo thứ hai.
- **FR-601** → Sunner thường mở trang Review content nhận trang 403.
- **FR-602** → Sunner thường không đổi được trạng thái Kudo dù gọi thẳng vào hệ thống.
- **FR-603** → Admin thấy Kudo Spam của mọi người; Sunner thường chỉ thấy của mình.
- **FR-604** → Mở tệp Export bằng Excel: ô có ký tự công thức đầu ô hiện như chữ thường.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Admin thấy người gửi thật của Kudo ẩn danh trong bảng và Export | Có thể trái cam kết ẩn danh với người gửi nếu chính sách là "ai cũng không thấy" | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | Mark Spam làm huy hiệu Hero hạ cấp hoặc tim giảm sau khi người dùng đã thấy | Người nhận thắc mắc vì số liệu tụt; hộp đã mở không thu hồi nên có thể không công bằng | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-03 | risk | Chỉ lưu lần kiểm duyệt gần nhất, không có lịch sử | Không truy vết được ai đã đổi trạng thái bao nhiêu lần | [EXPECTED] |
| RISK-04 | risk | Tìm theo nội dung và sắp theo tim chậm khi số Kudo lớn | Bảng tải chậm vào cao điểm lễ trao giải | [INFERRED] |
| RISK-05 | risk | Export chứa dữ liệu cá nhân hàng loạt, không có nhật ký ai đã xuất | Rủi ro lộ dữ liệu nội bộ | [INFERRED] |
| RISK-06 | risk | Thiết kế gợi ý có gắn cờ tự động và quyết định ba chiều (Hợp lệ / Tạm ẩn / Reject) mà bản này không làm | Kỳ vọng của BTC lệch với phạm vi giai đoạn 1 | [NEEDS_DOMAIN_CONFIRMATION] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Kiểm role Admin cho mọi thao tác kiểm duyệt; hồ sơ Sunner làm người gửi/nhận | FR-601, FR-602 |
| F002_AppShell | feature | Khung, menu Admin (mục Review content), trang 403, đổi ngôn ngữ | FR-101, FR-601 |
| F003_KudosAuthoring | feature | Tạo bản ghi Kudo (mặc định Public), danh sách hashtag, tìm người cho dropdown; cần khoá sửa Kudo Spam theo D006 | FR-001, FR-204, D006 |
| F004_KudosFeed | feature | Chỉ hiển thị Kudo Public, nên Spam tự biến mất khỏi feed, Highlight, chi tiết | FR-404 |
| F005_KudosHearts | feature | Số tim cho cột Heart; tổng tim loại Kudo Spam | FR-201, FR-403 |
| F008_SpotlightBoard | feature | Phải bỏ Kudo Spam khỏi đám mây tên và tổng số | FR-404 |
| F009_HeroBadges, F010_SecretBoxRewards | feature | Số đếm huy hiệu, Secret Box loại Kudo Spam (BR-003) | FR-403 |
| F012_Profile | feature | Danh sách "Đã gửi" nơi chủ bài thấy thẻ Kudo bị tạm ẩn | FR-301 |
| F013_Notifications | feature | Gửi thông báo "bài bị tạm ẩn" cho chủ bài khi nhận sự kiện từ feature này | FR-408 |

## 13. Configuration

```text
ADMIN_REVIEW_PAGE_SIZE = 10        # số Kudo mỗi trang bảng Review content (đề xuất, D010)
EXPORT_MAX_ROWS = 10000            # trần số dòng của một lần Export (đề xuất, D007)
REVIEW_SEARCH_MAX_LENGTH = 100     # độ dài tối đa của ô Search by content
```
