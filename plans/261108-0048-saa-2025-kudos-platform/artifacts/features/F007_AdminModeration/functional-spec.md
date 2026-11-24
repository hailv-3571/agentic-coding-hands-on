---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->
<!-- Nửa BA/QA của cặp spec: đọc file này là trả lời được "làm gì, ứng xử ra sao, màn hình hiện gì" mà không phải mở file khác. Chi tiết kỹ thuật (đường dẫn, trích nguồn, ghi dữ liệu) nằm ở technical-spec.md. -->

# Functional Spec — F007_AdminModeration

**Priority**: P1
**Type**: ui
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — luồng xử lý từng action, trích nguồn, giao dịch chuyển trạng thái, thiết kế dữ liệu cho Dev/QA/SA.

**Traceability:** F007_AdminModeration → SCR013_AdminReviewContent → US005_BrowseKudosForReview, US006_MarkKudoSpam, US007_RestoreSpamKudo, US008_ExportKudoReviewCsv → ROUTE001, ROUTE002, ROUTE018, ROUTE027, ROUTE028

## 1. Overview

**Problem:** Kudo là nội dung do người dùng tự viết và hiện công khai cho cả công ty. Nếu có bài vi phạm tiêu chuẩn cộng đồng, BTC cần một chỗ xem toàn bộ Kudo, gỡ bài vi phạm khỏi các trang công khai và trả lại được khi gỡ nhầm, thay vì phải nhờ đội kỹ thuật vào cơ sở dữ liệu.
**Solution:** Admin có trang "Review content": một bảng mọi Kudo (cả Public lẫn Spam) với bộ lọc, tìm theo nội dung, sắp theo tim, phân trang, nút Mark Spam hoặc Un Spam trên từng dòng và nút Export CSV. Toàn bộ trạng thái của bảng nằm trên địa chỉ trang nên tải lại hay gửi link cho Admin khác vẫn ra đúng kết quả. Kudo bị Mark Spam biến mất khỏi các trang công khai; chủ Kudo vẫn thấy bài của mình, phủ mờ kèm cảnh báo vi phạm.
**Scope:** Bảng duyệt Kudo của Admin với lọc, tìm, sắp xếp, phân trang; chuyển một Kudo giữa Public và Spam; xuất CSV theo bộ lọc đang chọn; hiển thị người gửi thật của Kudo ẩn danh cho Admin; phát sự kiện để báo cho chủ Kudo khi bài bị ẩn; lớp phủ cảnh báo và thẻ "Spam" trên Kudo spam của chính chủ.
**Non-Scope:** Viết hoặc sửa Kudo (F003_KudosAuthoring); hiển thị feed công khai (F004_KudosFeed, chỉ nhận trạng thái từ feature này); gửi và hiển thị thông báo (F013_Notifications); khung, menu và trang từ chối truy cập của khu Admin (F002_AppShell); kiểm role Admin (F001_Auth); đổi role người dùng (F014_AdminUserManagement); bắt buộc nhập lý do kiểm duyệt; lịch sử từng lần kiểm duyệt; gắn cờ tự động nội dung nghi vi phạm; trạng thái thứ ba như Reject; xoá hẳn Kudo; kiểm duyệt hàng loạt; định dạng XLSX.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Admin | Sunner có role Admin | Rà soát mọi Kudo, tạm ẩn bài vi phạm, trả lại bài bị ẩn nhầm, xuất dữ liệu cho BTC |
| Chủ Kudo | Sunner là người gửi của một Kudo đang bị tạm ẩn | Biết bài của mình đang bị tạm ẩn và vì sao |

Feature này chưa tham gia luồng liên-feature nào được ghi trong thư mục luồng của tài liệu (hiện chưa có luồng nào).

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Duyệt, lọc và sắp xếp Kudo | Mở trang Review content, xem bảng mọi Kudo, lọc theo người gửi, người nhận, trạng thái, khoảng ngày, tìm theo nội dung, sắp theo tim, chuyển trang, thấy thông báo khi bộ lọc sai, khi không có dòng nào hoặc khi không tải được | US005_BrowseKudosForReview | FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-207, FR-208, FR-209, FR-210, FR-211, FR-212, FR-601, FR-604 | BR-002, BR-004, BR-005, DEC-001, DEC-002, DEC-003, DEC-004, DEC-005, DEC-006 | SCR013_AdminReviewContent |
| CAP-02 | Đánh dấu Spam và bỏ đánh dấu Spam | Chuyển một Kudo giữa Public và Spam bằng một mục xác nhận trên dòng, thấy kết quả ngay trên dòng, biết khi Admin khác đã đổi trước | US006_MarkKudoSpam, US007_RestoreSpamKudo | FR-001, FR-002, FR-401, FR-402, FR-403, FR-404, FR-405, FR-602 | BR-001, BR-003, BR-006, DEC-007, SM-001 | N/A — thao tác nằm trên chính màn hình đã nêu ở CAP-01 |
| CAP-03 | Xuất CSV | Tải tệp CSV các Kudo theo đúng bộ lọc và thứ tự đang xem, mở được bằng Excel | US008_ExportKudoReviewCsv | FR-406, FR-407, FR-603 | BR-008, BR-009, DEC-008 | N/A — nút Export nằm trên chính màn hình đã nêu ở CAP-01 |
| CAP-04 | Cảnh báo vi phạm cho chủ Kudo | Chủ Kudo thấy bài của mình bị phủ mờ kèm thẻ "Spam" và cảnh báo vi phạm khi bài đang bị tạm ẩn | N/A — chưa có user story riêng cho phần hiển thị này | FR-301, FR-302 | BR-007 | N/A — hiển thị trên thẻ Kudo của feature khác, không có màn hình riêng |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Ngôn ngữ của tiêu đề cột và nhãn trong tệp CSV Kudo, và ngôn ngữ chung của các tệp xuất trong khu Admin (tệp Users và Overview dùng tiêu đề tiếng Anh, tệp Kudos dùng tiếng Việt) có giữ như hiện tại không? | Giữ như hiện tại: tiêu đề cột và nhãn hashtag tiếng Việt, tên người gửi, người nhận theo hồ sơ | Ngôn ngữ chung của các tệp xuất và bản tiếng Anh của giao diện đang chờ BTC chốt; đổi chỉ là sửa hằng số tiêu đề | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi Kudo ở đúng một trong hai trạng thái Public hoặc Spam; Kudo mới luôn là Public; chỉ Admin chuyển qua lại giữa hai trạng thái.
- **FR-002** Kudo Spam bị loại khỏi mọi trang công khai và mọi số liệu ở thời điểm đọc, không sửa bộ đếm nào; Un Spam thì Kudo được tính lại.

### Navigation (1xx)

- **FR-101** Admin vào Review content từ mục "Review content" trên menu khu Admin; lúc trang đang tải hiện khung chờ.

### Review content (2xx)

- **FR-201** Bảng hiện cả Kudo Public lẫn Spam, 10 dòng mỗi trang, mới nhất trước, với tám cột ID, Người gửi, Người nhận, Nội dung, Hashtag, Tim, Trạng thái, Thao tác.
- **FR-202** Mỗi dòng hiện 8 ký tự đầu của mã Kudo, tiêu đề đậm, viết hoa (chỉ kiểu hiển thị) trên lời nhắn rút gọn 4 dòng ở dạng chữ thường (không hiện định dạng), hashtag mỗi thẻ một dòng, số tim thật (không nhân hệ số x2), huy hiệu Public hoặc Spam; ô trống hiện dấu gạch.
- **FR-203** Kudo gửi ẩn danh hiện người gửi thật kèm nhãn "Ẩn danh" (di chuột thấy biệt danh đã dùng); di chuột lên tên người gửi, người nhận thấy email.
- **FR-204** Các bộ lọc ghép bằng AND: người gửi, người nhận (chọn từ ô tìm Sunner), trạng thái Public hoặc Spam, khoảng ngày gửi, tìm theo nội dung; bỏ trống một bộ lọc là "Tất cả".
- **FR-205** Tìm theo nội dung không phân biệt hoa thường và dấu, trên tiêu đề cộng lời nhắn; kết quả cập nhật khi người dùng ngừng gõ 300 mili giây hoặc nhấn Enter, không gửi lại cùng một từ khoá; ô nhận tối đa 100 ký tự.
- **FR-206** Khoảng ngày tính trọn ngày theo giờ Việt Nam, để trống một đầu là không giới hạn đầu đó; khoảng ngược (ngày bắt đầu sau ngày kết thúc) bị từ chối ngay tại ô kèm thông báo.
- **FR-207** Bấm tiêu đề cột Tim đổi vòng sắp xếp: mới nhất, nhiều tim nhất, ít tim nhất, rồi lại mới nhất.
- **FR-208** Mọi thay đổi bộ lọc, từ khoá hay sắp xếp đều đưa bảng về trang 1; chỉ đổi trang mới giữ nguyên bộ lọc; trang vượt cuối được kẹp về trang cuối và bộ phân trang theo đó.
- **FR-209** Toàn bộ trạng thái (trang, sắp xếp, trạng thái, người gửi, người nhận, ngày, từ khoá) nằm trên địa chỉ trang, giá trị mặc định bị bỏ khỏi địa chỉ; tải lại hay gửi link cho cùng kết quả.
- **FR-210** Địa chỉ mang tham số sai (khoá lặp, mã không hợp lệ, ngày không có thật, trạng thái hoặc sắp xếp lạ, trang nhỏ hơn 1, từ khoá quá 200 ký tự, khoảng ngược) thì hiện thông báo lỗi lọc phía trên bảng chưa lọc ở trang 1.
- **FR-211** Không có dòng nào thì hiện thông báo rỗng, kèm nút "Xoá bộ lọc" khi đang có bộ lọc.
- **FR-212** Khi không đọc được dữ liệu, vùng bảng hiện thông báo lỗi kèm nút thử lại thay cho bảng và phân trang; các bộ lọc vẫn dùng được.

### Interaction (4xx)

- **FR-401** Dòng Public có nút "Mark Spam", dòng Spam có nút "Un Spam"; bấm mở một mục xác nhận, chọn mục là xác nhận (không bắt nhập lý do); Esc, bấm ra ngoài hoặc Tab thì huỷ và trả focus về nút.
- **FR-402** Trong lúc máy chủ xử lý nút bị khoá kèm biểu tượng chờ; xong thì dòng đổi trạng thái ngay tại chỗ, không tải lại cả trang, kèm thông báo thành công.
- **FR-403** Việc chuyển trạng thái chỉ tác động khi Kudo đang ở trạng thái nguồn; nếu Admin khác đã đổi trước thì Kudo giữ nguyên, không ghi đè người và giờ kiểm duyệt của người đó, và Admin thấy thông báo "đã được cập nhật bởi Admin khác".
- **FR-404** Kudo không còn tồn tại thì báo "không còn tồn tại"; mã Kudo không hợp lệ hoặc lỗi bất ngờ thì báo lỗi chung và dòng giữ nguyên.
- **FR-405** Khi một Kudo thật sự chuyển từ Public sang Spam, hệ thống ghi nhận một sự kiện để chủ Kudo được báo bài bị tạm ẩn; Un Spam không tạo sự kiện nào.
- **FR-406** Export tải tệp CSV chứa mọi dòng khớp bộ lọc và thứ tự đang xem (không chỉ trang hiện tại), với mười ba cột gồm mã Kudo đầy đủ, ngày gửi, người gửi và email, ẩn danh, người nhận, tiêu đề, lời nhắn, hashtag, tim, trạng thái, người và giờ kiểm duyệt.
- **FR-407** Số dòng vượt giới hạn xuất thì không tạo tệp và hiện thông báo "quá nhiều dòng"; trong lúc chuẩn bị tệp nút Export bị khoá kèm biểu tượng chờ; mọi lỗi khác hiện thông báo lỗi và không tải tệp nào.

### Cảnh báo cho chủ Kudo (3xx)

- **FR-301** Kudo spam của chính chủ hiện phủ mờ không đóng được, kèm tam giác cảnh báo và câu "Cảnh báo vi phạm tiêu chuẩn cộng đồng"; nội dung bên dưới vẫn đọc được bằng trình đọc màn hình.
- **FR-302** Thẻ cam "Spam" nằm trên lớp phủ nên vẫn đọc rõ qua lớp mờ.

### Security (6xx)

- **FR-601** Chỉ Admin vào được trang, dùng được nút Mark Spam, Un Spam, Export và các điểm dữ liệu của trang; Sunner thường bị từ chối, khách bị đưa về trang đăng nhập.
- **FR-602** Admin thực hiện thao tác luôn lấy từ phiên đăng nhập chứ không từ dữ liệu client gửi lên; mã Kudo phải hợp lệ; quyền Admin được kiểm trước mọi việc khác.
- **FR-603** Tệp Export an toàn khi mở bằng Excel: ô văn bản bắt đầu bằng ký tự công thức hiện ra như chữ thường, tiếng Việt hiển thị đúng; trình duyệt và máy chủ trung gian không được lưu lại dữ liệu trả về.
- **FR-604** Người gửi thật của Kudo ẩn danh chỉ có trong bảng và tệp CSV dành cho Admin, không đi vào bất kỳ trang công khai nào.

## 5. Business Rules

- Chuyển trạng thái là một thao tác nguyên tử, lặp lại không gây hại: hai Admin cùng bấm thì chỉ một người đổi được, người kia nhận kết quả "đã đổi từ trước" và dấu vết kiểm duyệt của người đến trước giữ nguyên (BR-001)
- Admin luôn thấy người gửi thật của Kudo ẩn danh ở bảng, bộ lọc người gửi và tệp CSV; người khác không bao giờ thấy (BR-002)
- Spam chỉ đổi trạng thái của Kudo: số tim, huy hiệu Hero và Secret Box tự loại Kudo Spam khi tính lại và tự khôi phục khi Un Spam; hộp đã cấp hoặc đã mở không bị thu hồi (BR-003)
- Bảng, bộ đếm trang và tệp CSV dùng chung một bộ lọc: mọi điều kiện ghép bằng AND, tìm không phân biệt hoa thường và dấu, ngày tính trọn ngày giờ Việt Nam (BR-004)
- Thứ tự dòng cố định và không lặp giữa các trang: mới nhất trước theo mặc định; khi sắp theo tim, các Kudo bằng tim xếp theo mã Kudo mới nhất trước (BR-005)
- Chỉ lần chuyển từ Public sang Spam thật sự mới báo cho chủ Kudo; Un Spam không gửi gì và thông báo "bị ẩn" đã gửi trước đó vẫn còn nguyên (BR-006)
- Lớp phủ cảnh báo trên Kudo spam của chủ không có nút đóng và không chặn trình đọc màn hình; dưới lớp phủ không có phần tử nào nhận focus bàn phím (BR-007)
- Giới hạn số dòng xuất được kiểm trong cùng một lần đọc dữ liệu: vượt giới hạn thì từ chối cả tệp chứ không cắt bớt (BR-008)
- Tệp CSV có khuôn cố định: mười ba cột tiêu đề tiếng Việt, giờ theo giờ Việt Nam, tên tệp mang ngày giờ lúc xuất, mã Kudo đầy đủ — chờ D001 (BR-009)
- URL của trang là nguồn sự thật: khi địa chỉ sai, trang vẫn hiện bảng chưa lọc trang 1 kèm thông báo; khi đọc dữ liệu lỗi thì thay bảng bằng thông báo lỗi kèm nút thử lại (DEC-001)
- Bảng không có dòng nào thì luôn có thông báo rỗng; nút "Xoá bộ lọc" chỉ hiện khi đang có ít nhất một bộ lọc (DEC-002)
- Ô khoảng ngày chỉ gửi đi khi hợp lệ: khoảng ngược bị giữ lại tại ô, một đầu trống vẫn được gửi (DEC-003)
- Ô tìm chỉ gửi sau khi ngừng gõ hoặc khi nhấn Enter, và không gửi lại đúng từ khoá vừa gửi (DEC-004)
- Đổi bộ lọc, từ khoá hay sắp xếp luôn về trang 1; chỉ bấm số trang mới đổi trang mà giữ nguyên bộ lọc (DEC-005)
- Cột Tim đi vòng ba trạng thái: mới nhất, nhiều tim nhất, ít tim nhất (DEC-006)
- Kết quả một lần Mark Spam hoặc Un Spam rẽ năm nhánh: không còn tồn tại, lỗi chung, đã đổi từ trước, vừa chuyển sang Spam, vừa chuyển về Public — mỗi nhánh một thông báo riêng (DEC-007)
- Nút Export phân biệt ba kết quả: quá nhiều dòng, lỗi khác, và thành công lưu tệp (DEC-008)
- Mỗi Kudo là một vòng đời hai trạng thái Public và Spam, chỉ Admin đổi, không có trạng thái thứ ba (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Admin Review content | SCR013_AdminReviewContent | Tiêu đề "Review content"; hai ô ngày "Ngày bắt đầu" và "Ngày kết thúc" kèm biểu tượng lịch; nút Export màu vàng; thanh bộ lọc Người gửi, Người nhận, Trạng thái và ô "Tìm theo nội dung"; dòng cảnh báo khi bộ lọc sai; bảng tám cột với huy hiệu Public hoặc Spam, nhãn "Ẩn danh" trên Kudo ẩn danh; phân trang "< 1 2 3 4 5 >" khi có nhiều hơn một trang; khi đang tải thấy khung chờ, khi lỗi thấy thông báo kèm nút "Thử lại" | Chọn bộ lọc, gõ từ khoá, bấm cột Tim để đổi thứ tự, chuyển trang, bấm "Mark Spam" hoặc "Un Spam" rồi chọn mục xác nhận, bấm Export để tải CSV, bấm "Xoá bộ lọc" hoặc "Thử lại" |

### User Journey

1. Admin bấm "Review content" trên menu khu Admin và thấy bảng Kudo mới nhất trước, mười dòng mỗi trang.
2. Admin thu hẹp bảng: chọn người gửi hoặc người nhận bằng ô tìm Sunner, chọn trạng thái, chọn khoảng ngày, gõ từ khoá — bảng mờ đi một chút rồi cập nhật về trang 1, địa chỉ trang đổi theo.
3. Admin bấm cột Tim để xem các Kudo nhiều tim nhất hoặc ít tim nhất.
4. Với một Kudo vi phạm, Admin bấm "Mark Spam", chọn mục xác nhận — nút khoá kèm biểu tượng chờ, dòng đổi sang Spam và hiện thông báo "Đã đánh dấu Spam."; Kudo biến mất khỏi các trang công khai và chủ Kudo được báo.
5. Với Kudo bị đánh dấu nhầm, Admin bấm "Un Spam", chọn mục xác nhận — dòng về Public, Kudo hiện lại ở các trang công khai.
6. Admin bấm "Export" — nút khoá kèm "Đang xuất…", trình duyệt tải về tệp CSV đúng như bảng đang lọc; nếu quá nhiều dòng thì hiện thông báo thu hẹp bộ lọc và không có tệp.
7. Chủ Kudo bị đánh dấu Spam mở bài của mình và thấy lớp phủ mờ kèm thẻ "Spam" và câu cảnh báo vi phạm.

## 7. User Stories

### US005_BrowseKudosForReview — Browse Kudos For Review

**Actor:** Admin
**Goal:** Duyệt bảng mọi Kudo, thu hẹp bằng bộ lọc, từ khoá, sắp xếp và chuyển trang để rà soát nội dung cần kiểm duyệt.
**Business value:** BTC phát hiện nhanh nội dung vi phạm trong hàng nghìn Kudo mà không cần hỏi đội kỹ thuật, và gửi được đúng kết quả lọc cho đồng nghiệp bằng một đường link.

**Acceptance Criteria:**
- [ ] Bảng 10 dòng mỗi trang, mới nhất trước, có cả Kudo Public và Spam, đủ tám cột; lời nhắn rút gọn 4 dòng ở dạng chữ thường.
- [ ] Kudo ẩn danh hiện người gửi thật kèm nhãn "Ẩn danh"; chỉ Admin thấy người gửi thật.
- [ ] Bộ lọc người gửi, người nhận, trạng thái, khoảng ngày và từ khoá ghép bằng AND; khoảng ngược bị từ chối ngay trong ô; tìm không phân biệt hoa thường và dấu.
- [ ] Ô tìm chỉ gửi sau khi ngừng gõ 300 mili giây hoặc khi nhấn Enter, không gửi lại cùng từ khoá.
- [ ] Bấm cột Tim đổi vòng mới nhất, nhiều tim nhất, ít tim nhất; mọi thay đổi trừ đổi trang đưa về trang 1; trang vượt cuối được kẹp về trang cuối.
- [ ] Địa chỉ giữ toàn bộ trạng thái, giá trị mặc định bị bỏ; tải lại hay chia sẻ link ra cùng kết quả; tham số sai hiện lỗi lọc trên bảng chưa lọc trang 1.
- [ ] Không có dòng nào thì hiện thông báo rỗng kèm "Xoá bộ lọc" khi đang lọc; đọc lỗi hiện thông báo kèm nút thử lại; người không phải Admin không vào được.

### US006_MarkKudoSpam — Mark Kudo Spam

**Actor:** Admin
**Goal:** Đánh dấu một Kudo công khai là Spam để Kudo đó biến mất khỏi các trang công khai.
**Business value:** BTC gỡ nhanh bài vi phạm tiêu chuẩn cộng đồng mà không xoá dữ liệu, nên gỡ nhầm vẫn trả lại được.

**Acceptance Criteria:**
- [ ] Dòng Public có nút "Mark Spam"; bấm mở một mục xác nhận, chọn mục là xác nhận, không có bước nhập lý do; Esc, bấm ra ngoài hoặc Tab thì huỷ và trả focus về nút.
- [ ] Trong lúc xử lý nút bị khoá kèm biểu tượng chờ; dòng đổi sang Spam ngay tại chỗ kèm thông báo "Đã đánh dấu Spam.".
- [ ] Trạng thái, người kiểm duyệt và giờ kiểm duyệt được lưu trong một giao dịch; chỉ khi thật sự đổi mới ghi sự kiện cho chủ Kudo.
- [ ] Kudo đã là Spam (Admin khác làm trước) thì báo "Kudo đã được cập nhật bởi Admin khác.", không ghi đè người và giờ kiểm duyệt, không thêm sự kiện.
- [ ] Kudo không còn thì báo "Kudo không còn tồn tại."; mã không hợp lệ hoặc lỗi khác thì báo lỗi chung.
- [ ] Kudo Spam không còn xuất hiện ở trang công khai từ lần đọc sau; chủ Kudo nhận thông báo bài bị tạm ẩn.

### US007_RestoreSpamKudo — Restore Spam Kudo

**Actor:** Admin
**Goal:** Trả một Kudo Spam về công khai khi bị đánh dấu nhầm.
**Business value:** Sai sót kiểm duyệt sửa được ngay, bài của đồng nghiệp hiện lại mà không cần cộng bù số liệu.

**Acceptance Criteria:**
- [ ] Dòng Spam có nút "Un Spam"; bấm mở một mục xác nhận và chọn mục là xác nhận, cùng cách huỷ như Mark Spam.
- [ ] Trạng thái, người kiểm duyệt và giờ kiểm duyệt được lưu trong một giao dịch; không ghi sự kiện nên chủ Kudo không nhận thông báo mới.
- [ ] Dòng đổi sang Public ngay tại chỗ kèm thông báo "Đã chuyển Kudo về Public."; Kudo đã Public thì báo "đã được cập nhật bởi Admin khác".
- [ ] Kudo hiện lại ở các trang công khai từ lần đọc sau; thông báo "bị ẩn" đã gửi trước đó vẫn còn nguyên.

### US008_ExportKudoReviewCsv — Export Kudo Review Csv

**Actor:** Admin
**Goal:** Xuất CSV các Kudo theo bộ lọc đang chọn để đối soát nội dung kiểm duyệt ngoài hệ thống.
**Business value:** BTC đưa danh sách Kudo đã lọc vào báo cáo hoặc xử lý tiếp mà không phải chép tay, và tệp luôn khớp với bảng đã xem.

**Acceptance Criteria:**
- [ ] Nút Export dùng bộ lọc và thứ tự đang hiện nhưng bỏ trang: tệp chứa mọi dòng khớp, không chỉ trang hiện tại.
- [ ] Tối đa 10.000 dòng; vượt thì không có tệp và hiện thông báo "quá nhiều dòng".
- [ ] Tên tệp `kudos-năm-tháng-ngày-giờ-phút` theo giờ Việt Nam; tệp có BOM, mở bằng Excel đúng tiếng Việt, ô chữ bắt đầu bằng ký tự công thức hiện như chữ thường.
- [ ] Mười ba cột như FR-406; Kudo ẩn danh mang người gửi thật và cột ẩn danh là "Có".
- [ ] Nút khoá kèm biểu tượng chờ trong lúc chuẩn bị tệp; lỗi khác hiện thông báo lỗi; mọi câu trả lời không được lưu đệm.

## 8. Scenarios

### US005_BrowseKudosForReview — Happy Path

**Given** có Kudo Public và Spam, **When** Admin chọn trạng thái Spam rồi gõ một từ khoá, **Then** địa chỉ có trạng thái và từ khoá, bảng chỉ còn Kudo Spam khớp từ khoá và về trang 1.

### US005_BrowseKudosForReview — Error: Tham số sai

**Given** Admin mở địa chỉ có ngày bắt đầu sau ngày kết thúc, **When** trang tải, **Then** hiện "Khoảng ngày không hợp lệ, đang hiện tất cả Kudo." phía trên bảng chưa lọc trang 1.

### US005_BrowseKudosForReview — Error: Không tải được

**Given** dịch vụ dữ liệu đang lỗi, **When** Admin mở trang, **Then** vùng bảng hiện "Không tải được danh sách Kudo. Vui lòng thử lại." kèm nút "Thử lại"; bấm "Thử lại" thì trang đọc lại và hiện bảng nếu lần đọc thành công.

### US005_BrowseKudosForReview — Error: Không phải Admin

**Given** Sunner thường đã đăng nhập, **When** mở địa chỉ Review content, **Then** thấy trang "Không có quyền truy cập" và không có dữ liệu Kudo nào.

### US006_MarkKudoSpam — Happy Path

**Given** dòng Kudo đang Public, **When** Admin bấm "Mark Spam" rồi chọn mục xác nhận, **Then** dòng đổi sang Spam, hiện "Đã đánh dấu Spam." và chủ Kudo được báo.

### US006_MarkKudoSpam — Error: Admin khác đã đánh dấu

**Given** Admin khác vừa đánh dấu Spam dòng này, **When** Admin bấm xác nhận, **Then** dòng hiện Spam, thông báo "Kudo đã được cập nhật bởi Admin khác." và không có thông báo thứ hai cho chủ Kudo.

### US006_MarkKudoSpam — Error: Kudo không còn

**Given** Kudo đã bị xoá khỏi hệ thống, **When** Admin bấm xác nhận, **Then** hiện "Kudo không còn tồn tại." và dòng giữ nguyên.

### US006_MarkKudoSpam — Error: Mất quyền Admin giữa chừng

**Given** Admin bị hạ role trong lúc đang mở trang, **When** bấm xác nhận Mark Spam, **Then** không có gì thay đổi và hiện "Không cập nhật được trạng thái. Vui lòng thử lại.".

### US007_RestoreSpamKudo — Happy Path

**Given** dòng Kudo đang Spam, **When** Admin bấm "Un Spam" rồi chọn mục xác nhận, **Then** dòng đổi sang Public, hiện "Đã chuyển Kudo về Public." và chủ Kudo không nhận thông báo mới.

### US007_RestoreSpamKudo — Error: Lỗi bất ngờ

**Given** hệ thống lỗi bất ngờ khi lưu, **When** Admin bấm xác nhận, **Then** hiện "Không cập nhật được trạng thái. Vui lòng thử lại." và dòng giữ trạng thái Spam.

### US008_ExportKudoReviewCsv — Happy Path

**Given** bảng đang lọc trạng thái Spam với 25 dòng trên 3 trang, **When** Admin bấm Export, **Then** tải về tệp có đủ 25 dòng Spam theo thứ tự bảng, cột trạng thái là "Spam".

### US008_ExportKudoReviewCsv — Error: Quá nhiều dòng

**Given** số dòng khớp lớn hơn giới hạn xuất, **When** Admin bấm Export, **Then** không có tệp và hiện "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc.".

### US008_ExportKudoReviewCsv — Error: Mất quyền hoặc hết phiên

**Given** phiên đã hết hạn hoặc Admin bị hạ role giữa chừng, **When** Admin bấm Export, **Then** không có tệp và hiện "Không xuất được tệp. Vui lòng thử lại.".

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Hệ thống chưa có Kudo nào, hoặc bộ lọc không khớp dòng nào | Bảng rỗng, phân trang ẩn; thêm nút "Xoá bộ lọc" khi đang có bộ lọc | "Không có Kudo nào phù hợp bộ lọc." |
| Địa chỉ mang khoảng ngày ngược | Hiện bảng chưa lọc trang 1 kèm thông báo | "Khoảng ngày không hợp lệ, đang hiện tất cả Kudo." |
| Địa chỉ mang tham số sai khác (khoá lặp, mã không hợp lệ, ngày không có thật, trạng thái hoặc sắp xếp lạ, từ khoá quá 200 ký tự) | Hiện bảng chưa lọc trang 1 kèm thông báo | "Bộ lọc không hợp lệ, đang hiện tất cả Kudo." |
| Gõ khoảng ngày ngược trong ô | Không gửi lên hệ thống; bảng và địa chỉ giữ nguyên | "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" |
| Mở trang số vượt quá trang cuối | Hiện trang cuối; bộ phân trang cũng ở trang cuối | "None — silent handling" |
| Đọc dữ liệu lỗi | Vùng bảng và phân trang được thay bằng khung lỗi kèm nút thử lại; bộ lọc vẫn dùng được | "Không tải được danh sách Kudo. Vui lòng thử lại." |
| Tìm "nguyen" khi Kudo ghi "Nguyễn" | Khớp cả hai vì tìm không phân biệt hoa thường và dấu | "None — silent handling" |
| Từ khoá trùng ký hiệu định dạng (như `**`) hoặc địa chỉ của một liên kết trong lời nhắn | Vẫn khớp vì tìm chạy trên nguồn lời nhắn có định dạng, không phải chữ hiện trong bảng; dòng có thể hiện mà không thấy từ khoá | "None — silent handling" |
| Từ khoá có ký tự phần trăm, gạch dưới hoặc gạch chéo ngược | Được hiểu đúng là chính ký tự đó, không là ký tự đại diện | "None — silent handling" |
| Kudo gửi 23 giờ 59 phút ngày kết thúc (giờ Việt Nam) | Vẫn được tính; Kudo gửi 0 giờ ngày kế tiếp thì không | "None — silent handling" |
| Kudo ẩn danh | Bảng và tệp hiện người gửi thật kèm nhãn "Ẩn danh"; di chuột thấy biệt danh | "Ẩn danh" |
| Kudo chưa có tim | Hiện 0 và xếp cuối khi sắp nhiều tim nhất | "None — silent handling" |
| Kudo không có tiêu đề, không có hashtag hoặc lời nhắn chỉ có định dạng | Không có tiêu đề thì không hiện dòng tiêu đề; không có hashtag hoặc lời nhắn chỉ có định dạng thì ô tương ứng hiện dấu gạch | "—" |
| Chọn người gửi hoặc người nhận không còn hồ sơ trên địa chỉ | Ô chọn hiện trống nhưng bảng vẫn lọc theo mã đó nên có thể không có dòng nào | "Không có Kudo nào phù hợp bộ lọc." |
| Admin vào trang khi chưa là Admin (Sunner thường) | Trang bị từ chối, không có dữ liệu Kudo | "Bạn không có quyền truy cập tài nguyên này." |
| Khách chưa đăng nhập mở trang Review content | Được đưa về trang đăng nhập | "None — silent handling" |
| Dòng đang Public (trạng thái Public) | Hiện huy hiệu Public và nút "Mark Spam"; tệp ghi "Public" | "None — silent handling" |
| Dòng đang Spam (trạng thái Spam) | Hiện huy hiệu Spam và nút "Un Spam"; tệp ghi "Spam"; chủ Kudo thấy lớp phủ cảnh báo | "None — silent handling" |
| Hai Admin cùng đổi trạng thái một Kudo | Chỉ một người đổi được; người kia thấy trạng thái hiện có, dấu vết kiểm duyệt của người đến trước giữ nguyên, không có sự kiện thứ hai | "Kudo đã được cập nhật bởi Admin khác." |
| Kudo đã bị xoá khi Admin bấm Mark Spam hoặc Un Spam | Không đổi gì; dòng giữ nguyên | "Kudo không còn tồn tại." |
| Lỗi bất ngờ khi đổi trạng thái | Giao dịch huỷ hoàn toàn; không có sự kiện mồ côi; dòng giữ trạng thái cũ | "Không cập nhật được trạng thái. Vui lòng thử lại." |
| Admin bị hạ role giữa chừng rồi bấm Mark Spam, Un Spam hoặc Export | Không đổi gì, không có tệp; thông báo là lỗi chung, không nói rõ là mất quyền | "Không cập nhật được trạng thái. Vui lòng thử lại." (Mark Spam, Un Spam) hoặc "Không xuất được tệp. Vui lòng thử lại." (Export) |
| Mark Spam một Kudo khi bộ lọc trạng thái đang là Public | Dòng đổi sang Spam rồi biến mất khỏi bảng khi trang đọc lại | "Đã đánh dấu Spam." |
| Sự kiện tạo ra khi Mark Spam | Chỉ một loại sự kiện (bài bị ẩn) được ghi; Un Spam và mọi loại sự kiện khác không do feature này tạo | "None — silent handling" |
| Esc, bấm ra ngoài hoặc Tab khi mục xác nhận đang mở | Mục đóng, focus về nút, không gọi hệ thống | "None — silent handling" |
| Bấm Export hai lần liên tiếp | Lần sau bị bỏ qua cho tới khi tệp đầu xong | "None — silent handling" |
| Số dòng khớp vượt giới hạn xuất | Không có tệp; nút mở khoá lại | "Có quá nhiều dòng để xuất. Hãy thu hẹp bộ lọc." |
| Lời nhắn hoặc tên bắt đầu bằng ký tự công thức, hoặc chứa dấu phẩy, nháy kép, xuống dòng | Tệp thêm dấu nháy đứng đầu hoặc bọc nháy kép; Excel mở ra như chữ thường | "None — silent handling" |
| Chủ Kudo xem Kudo spam của mình | Thấy phủ mờ, thẻ "Spam" và cảnh báo; không có tim, Copy Link hay nút sửa; không bấm xuyên được lớp phủ | "Cảnh báo vi phạm tiêu chuẩn cộng đồng" |
| Người khác (kể cả Admin) mở trực tiếp trang chi tiết của Kudo spam | Thấy trang "không tìm thấy" như Kudo không tồn tại | "None — silent handling" |

## 10. Edge Behaviours to Verify

- **FR-001** → Kudo mới là Public; chỉ Admin đổi được trạng thái.
- **FR-002** → Mark Spam một Kudo thì Kudo biến mất khỏi trang công khai và số liệu ở lần đọc kế; Un Spam thì hiện lại; số tim giữ nguyên, hộp đã cấp không đổi.
- **FR-101** → Mục "Review content" trên menu khu Admin mở đúng trang; lúc tải thấy khung chờ.
- **FR-201** → Bảng có đủ tám cột, mười dòng mỗi trang, mới nhất trước, có cả Kudo Public lẫn Spam.
- **FR-202** → Tiêu đề đậm, lời nhắn cắt 4 dòng không hiện ký hiệu định dạng, hashtag mỗi thẻ một dòng, số tim đúng số thật, ô trống hiện dấu gạch.
- **FR-203** → Kudo ẩn danh hiện người gửi thật kèm "Ẩn danh"; di chuột thấy biệt danh.
- **FR-204** → Chọn đồng thời người gửi, trạng thái và khoảng ngày thì bảng chỉ còn dòng thoả mọi điều kiện.
- **FR-205** → Gõ không dấu tìm ra Kudo có dấu; không gửi lại khi từ khoá không đổi; nhấn Enter gửi ngay.
- **FR-206** → Chọn ngày kết thúc 05/12 thì Kudo gửi 23 giờ 30 ngày 05/12 vẫn có mặt; chọn khoảng ngược bị chặn ngay tại ô.
- **FR-207** → Bấm cột Tim hai lần cho nhiều tim nhất rồi ít tim nhất; lần ba về mới nhất.
- **FR-208** → Đổi bộ lọc khi đang ở trang 4 thì về trang 1; mở trang quá cuối thì ra trang cuối.
- **FR-209** → Đặt bộ lọc rồi tải lại: bộ lọc và dòng giữ nguyên; mở link đó ở tab khác cho cùng kết quả; bảng mặc định có địa chỉ trơn.
- **FR-210** → Mở địa chỉ có ngày sai hoặc khoá lặp thì thấy thông báo trên bảng chưa lọc trang 1.
- **FR-211** → Lọc ra không dòng nào thì thấy thông báo rỗng và "Xoá bộ lọc"; bấm thì về bảng chưa lọc.
- **FR-212** → Làm hỏng việc đọc dữ liệu thì thấy khung lỗi kèm "Thử lại", không thấy bảng trắng; bộ lọc vẫn dùng được.
- **FR-401** → Bấm "Mark Spam" mở mục xác nhận; chọn mục là xác nhận ngay không hỏi lý do; Esc, bấm ra ngoài, Tab đều huỷ và trả focus về nút.
- **FR-402** → Trong lúc xử lý nút khoá kèm biểu tượng chờ; xong dòng đổi ngay mà trang không tải lại.
- **FR-403** → Hai Admin cùng đổi một Kudo: người sau thấy "đã được cập nhật bởi Admin khác", người và giờ kiểm duyệt của người trước không đổi.
- **FR-404** → Kudo bị xoá giữa chừng thì báo "không còn tồn tại"; lỗi bất ngờ thì báo lỗi chung và dòng giữ nguyên.
- **FR-405** → Mark Spam thật sự thì chủ Kudo nhận thông báo bài bị ẩn; Un Spam hoặc lần đổi "đã đổi từ trước" thì không có thông báo mới.
- **FR-406** → Tệp có đủ mọi dòng khớp bộ lọc (nhiều trang), đúng thứ tự bảng, đủ mười ba cột, Kudo ẩn danh mang người gửi thật.
- **FR-407** → Vượt giới hạn thì không có tệp và thấy "quá nhiều dòng"; trong lúc xuất nút khoá kèm "Đang xuất…"; làm hỏng việc xuất thì thấy thông báo lỗi và nút mở lại.
- **FR-301** → Mở Kudo spam của chính mình thấy phủ mờ, tam giác và câu cảnh báo; không có nút đóng; không bấm xuyên được.
- **FR-302** → Thẻ "Spam" màu cam đọc rõ trên lớp mờ.
- **FR-601** → Sunner thường mở trang thấy trang từ chối; gọi thẳng điểm dữ liệu hoặc thử Mark Spam cũng bị từ chối; khách được đưa về đăng nhập.
- **FR-602** → Gọi tay thao tác với mã Kudo sai định dạng thì không đổi gì; người kiểm duyệt ghi nhận luôn là người đang đăng nhập.
- **FR-603** → Mở tệp bằng Excel: ô bắt đầu bằng dấu bằng hiện như chữ thường, tiếng Việt không vỡ chữ; câu trả lời không được trình duyệt lưu đệm.
- **FR-604** → Trang công khai và bản xem của người không phải Admin không bao giờ lộ người gửi thật của Kudo ẩn danh.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Admin thấy người gửi thật của Kudo ẩn danh trong bảng và tệp CSV; quyết định này đã chốt (người gửi vẫn là Sunner thật, chỉ Admin thấy) | Có thể trái kỳ vọng "ẩn danh với mọi người" của người gửi nếu chính sách thay đổi | confirmed |
| RISK-02 | risk | Mark Spam làm các số liệu dựa trên Kudo (tim, hạng Hero, số liệu theo đơn vị) tụt ở lần đọc kế; hộp Secret Box đã cấp hoặc đã mở không bị thu hồi | Người nhận thắc mắc vì số liệu tụt; hộp đã mở giữ nguyên nên có thể không công bằng | confirmed |
| RISK-03 | risk | Chỉ lưu người và giờ của lần kiểm duyệt gần nhất, không có bảng lịch sử | Không truy vết được ai đã đổi trạng thái bao nhiêu lần | confirmed |
| RISK-04 | known-issue | Thông báo "bài bị ẩn" luôn được gửi cho chủ Kudo kể cả khi Kudo đã được Un Spam sau đó, và Un Spam không gửi thông báo nào để đính chính | Chủ Kudo có thể thấy thông báo bị ẩn trong khi bài đã hiện lại | confirmed |
| RISK-05 | known-issue | Admin bị hạ role giữa phiên bấm Mark Spam, Un Spam hoặc Export chỉ nhận thông báo lỗi chung, không nói rõ là mất quyền; điểm dữ liệu JSON của bảng không có lời gọi nào từ giao diện | Người dùng khó hiểu vì sao thao tác thất bại; điểm dữ liệu không dùng đến có thể là mã thừa | [UNVERIFIED] |
| RISK-06 | risk | Tìm theo nội dung và sắp theo tim đọc không có chỉ mục riêng; ghi chú đo ở 10 nghìn Kudo cho khoảng 95 mili giây khi tìm có dấu | Bảng chậm khi Kudo lên hàng trăm nghìn bản ghi vào cao điểm lễ trao giải | [INFERRED] |
| RISK-07 | risk | Export dựng cả tệp trong bộ nhớ một lần (tối đa 10.000 dòng) và không có nhật ký ai đã xuất; tệp chứa email người gửi và nội dung Kudo | Rủi ro lộ dữ liệu nội bộ hàng loạt, khó truy vết | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Kiểm role Admin đọc từ dữ liệu ở mỗi lần gọi; hồ sơ Sunner làm người gửi, người nhận, người kiểm duyệt | FR-601, FR-602 |
| F002_AppShell | feature | Khung Admin và mục "Review content", trang từ chối truy cập, đổi ngôn ngữ | FR-101, FR-601 |
| F003_KudosAuthoring | feature | Tạo bản ghi Kudo (mặc định Public), danh sách hashtag, ô tìm Sunner cho bộ lọc người gửi và người nhận; khoá sửa Kudo Spam | FR-001, FR-204 |
| F004_KudosFeed | feature | Chỉ liệt kê Kudo Public nên Spam tự biến mất khỏi feed, Highlight, chi tiết; dựng thẻ có lớp phủ cảnh báo cho chủ Kudo | FR-002, FR-301 |
| F005_KudosHearts | feature | Số tim thô cho cột Tim; tổng tim loại Kudo Spam | FR-202, FR-002 |
| F008_SpotlightBoard | feature | Nhận tín hiệu khi Kudo bị ẩn hoặc hiện lại để bỏ khỏi đám mây tên và tổng số | FR-002 |
| F009_HeroBadges, F010_SecretBoxRewards | feature | Số đếm huy hiệu và Secret Box loại Kudo Spam | FR-002, BR-003 |
| F012_Profile | feature | Danh sách "Đã gửi" nơi chủ Kudo thấy thẻ Kudo bị tạm ẩn | FR-301 |
| F013_Notifications | feature | Nhận sự kiện bài bị ẩn và gửi thông báo cho chủ Kudo | FR-405, BR-006 |
| F014_AdminUserManagement, F015_AdminOverview | feature | Dùng lại ô khoảng ngày, nút Export và khung lỗi đọc của feature này (chiều ngược lại: F007 không phụ thuộc hai feature đó) | FR-206, FR-407, FR-212 |
| Múi giờ khu Admin | config | Cắt ngày của bộ lọc và giờ ghi trong tệp theo giờ Việt Nam | FR-206, BR-004, BR-009 |
| Giới hạn số dòng xuất | config | Trần 10.000 dòng một lần xuất | FR-407, BR-008 |

## 13. Configuration

```text
PAGE_SIZE = 10                  # số Kudo mỗi trang bảng Review content
SEARCH_DEBOUNCE_MS = 300        # ô tìm gửi sau khi ngừng gõ từng ấy mili giây (hoặc khi nhấn Enter)
SEARCH_MAX_LENGTH_UI = 100      # ô tìm nhận tối đa từng ấy ký tự (hệ thống chấp nhận tới 200 khi gõ tay vào địa chỉ)
EXPORT_MAX_ROWS = 10000         # số dòng tối đa của một lần xuất CSV; vượt thì không có tệp
DAY_CUTOFF_TIMEZONE = giờ Việt Nam   # ngày bắt đầu và ngày kết thúc tính trọn ngày theo múi giờ này; đổi được ở cấu hình máy chủ
NOTICE_DURATION_SEC = 5         # thông báo thành công hoặc lỗi tự tắt sau từng ấy giây
```
