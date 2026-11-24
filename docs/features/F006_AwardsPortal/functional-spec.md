---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F006_AwardsPortal

**Priority**: P1
**Type**: mixed
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — handler, quy tắc kỹ thuật, trích dẫn mã nguồn, cấu hình kỹ thuật cho Dev/QA/SA.

**Traceability:** F006 → SCR008, SCR009, SCR010, SCR011, SCR012 → US045, US046, US047, US048 → BL013

## 1. Overview

**Problem:** Sunner cần một chỗ biết lễ trao giải SAA 2025 diễn ra khi nào, ở đâu, có những giải nào, mỗi giải bao nhiêu người và trị giá bao nhiêu, cùng thể lệ và tiêu chuẩn cộng đồng. Trước giờ mở hệ thống, người dùng thường chưa được vào các trang Kudo (chưa ai gửi Kudo hay thả tim được) nên cần một màn đếm ngược rõ ràng thay vì trang chưa sẵn sàng, còn quản trị viên vẫn phải vào được để chuẩn bị. Lý do tồn tại của "cổng trước giờ mở" không được nêu trong user story nào; nó suy ra từ quyết định của dự án (Countdown công khai, Admin bỏ qua cổng, ghi dữ liệu chỉ mở từ giờ mở) [INFERRED].
**Solution:** Một cổng thông tin hai ngôn ngữ (Việt/Anh) gồm năm trang: Đếm ngược (trước giờ mở), Trang chủ (hero, đếm ngược tới lễ, thời gian và địa điểm, bài chủ đề, lưới 6 giải, banner Sun* Kudos), Hệ thống giải (6 khối giải có menu neo), Thể lệ và Tiêu chuẩn cộng đồng. Một cổng kiểm tra giờ ở mỗi lần truy cập quyết định người dùng thấy Đếm ngược hay trang thật. Phần lớn nội dung là chữ tĩnh.
**Scope:** Quyết định "trước hay sau giờ mở" và màn Đếm ngược; năm trang nội dung kể trên; điều hướng từ các trang này sang trang giải và Live board Kudos; việc hiển thị (chỉ hiển thị) nội dung Thể lệ.
**Non-Scope:** Đăng nhập, phiên và danh sách trang công khai (F001_Auth). Header, footer, đổi ngôn ngữ, trang lỗi (F002_AppShell). Live board Kudos là đích điều hướng, thuộc F004_KudosFeed. Luật tính tim, Secret Box, huy hiệu Hero và Kudos Quốc Dân (F005_KudosHearts, F009_HeroBadges, F010_SecretBoxRewards): F006 chỉ hiện chữ mô tả các luật đó. Cửa sổ cho phép gửi Kudo và thả tim (F003_KudosAuthoring, F005_KudosHearts). Trang quản trị cấu hình. Ứng dụng native.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên Sun* đã đăng nhập và đã chọn phòng ban | Xem thông tin lễ trao giải, các giải, thể lệ, tiêu chuẩn cộng đồng và đi tiếp tới Kudos |
| Khách chưa đăng nhập | Người chưa có phiên | Xem màn Đếm ngược và trang đăng nhập trước giờ mở; mọi trang khác dẫn tới đăng nhập |
| Admin | Sunner có thêm quyền quản trị | Vào mọi trang trước giờ mở để chuẩn bị nội dung; chưa ghi được Kudo hay tim tới giờ mở |

Chưa có luồng liên-feature nào (flows) được sinh nên feature này chưa tham chiếu luồng nào.

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Prelaunch Gate and Countdown | Trước giờ mở chỉ thấy màn đếm ngược Ngày/Giờ/Phút tới giờ mở (Admin vẫn vào được mọi trang); tới giờ thì tự vào Trang chủ | N/A — không có user story riêng, xem § 1 | FR-002, FR-201, FR-202, FR-203, FR-401, FR-403, FR-601, FR-602, FR-604, FR-605 | BR-001, BR-002, BR-004, DEC-001, DEC-002 | SCR010 |
| CAP-02 | Event Homepage | Xem hero, đếm ngược tới lễ, thời gian và địa điểm, bài chủ đề, 6 giải tóm tắt, banner Sun* Kudos và đi tiếp tới trang giải hoặc Live board Kudos | US045, US046 | FR-101, FR-102, FR-103, FR-104, FR-211, FR-212, FR-213, FR-214, FR-215, FR-216 | BR-006 | SCR011 |
| CAP-03 | Award Categories Browsing | Xem 6 hạng mục giải với mô tả, số lượng, giá trị; nhảy tới từng giải bằng menu neo | US047 | FR-301, FR-302, FR-303, FR-304, FR-305, FR-306, FR-307, FR-308, FR-309 | BR-003, BR-005, DEC-003, DEC-004 | SCR008 |
| CAP-04 | Static Information Pages | Đọc Thể lệ và Tiêu chuẩn cộng đồng (kèm Tiêu chuẩn bảo mật) bằng tiếng Việt hoặc Anh; đóng Thể lệ để quay về trang trước | US048 | FR-001, FR-311, FR-312, FR-313, FR-314, FR-321, FR-402, FR-603 | BR-007, BR-008, DEC-005 | SCR012, SCR009 |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Chữ Thể lệ, Tiêu chuẩn cộng đồng và bài chủ đề trong bản dịch có phải bản cuối do ban tổ chức duyệt không? | Coi là bản cuối; ban tổ chức sửa trực tiếp trong file bản dịch, không cần sửa code | Code đã có đủ chữ nhưng không có nguồn thứ hai để đối chiếu | no |
| D002 | Chữ cố định gắn mốc thời gian (banner Sun* Kudos nêu "triển khai vào tháng 11/2025", địa điểm Âu Cơ Art Center) có cần cập nhật theo giờ lễ cấu hình không? | Giữ nguyên; ban tổ chức sửa file bản dịch khi đổi mốc | Ngày lễ trên Trang chủ lấy từ cấu hình nhưng các câu chữ này nằm trong bản dịch | no |
| D003 | Số liệu trong Thể lệ (5 tim mỗi Secret Box, 5 Kudo Quốc Dân, ngưỡng bậc Hero) có nên lấy từ cấu hình thật thay vì chữ cố định không? | Giữ chữ cố định; ai đổi luật gốc phải sửa bản dịch cùng lúc | Thể lệ chỉ hiển thị, không tính toán; đọc cấu hình sẽ kéo Thể lệ phụ thuộc vào ba feature khác | no |
| D004 | Sau giờ bắt đầu lễ, Trang chủ có cần hiện nội dung khác không? | Giữ nguyên: đồng hồ dừng ở 00 00 00, nhãn "Sắp diễn ra" ẩn, ngày và địa điểm vẫn hiện | Code hiện xử lý đúng như vậy và không có yêu cầu khác | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mọi chữ trên các trang của cổng có đủ bản tiếng Việt và tiếng Anh, theo ngôn ngữ đang chọn ở khung chung.
- **FR-002** Giờ mở hệ thống và giờ bắt đầu lễ là cấu hình bắt buộc, đổi được mà không sửa code; thiếu hoặc sai thì ứng dụng không khởi động.

### Navigation (1xx)

- **FR-101** Sau giờ mở, địa chỉ gốc của hệ thống là Trang chủ, dành cho Sunner đã đăng nhập.
- **FR-102** Mỗi thẻ giải ở Trang chủ có "Chi tiết" dẫn tới đúng khối của giải đó trên trang Hệ thống giải, kèm tên truy cập riêng theo từng giải cho trình đọc màn hình.
- **FR-103** Trang chủ có hai nút: "ABOUT AWARDS" (nút chính) mở trang Hệ thống giải và "ABOUT KUDOS" mở Live board Kudos.
- **FR-104** Nút "Chi tiết" của banner Sun* Kudos mở Live board Kudos.

### Countdown (2xx)

- **FR-201** Trước giờ mở, màn Đếm ngược hiện tiêu đề và đếm ngược DAYS, HOURS, MINUTES tới giờ mở, mỗi đơn vị ít nhất hai chữ số, và không có liên kết tới thông tin giải.
- **FR-202** Số đếm ngược tự cập nhật mỗi khi số phút hiển thị đổi, kể cả ngay khi tab vừa hiện lại, không cần tải lại trang.
- **FR-203** Khi đếm về 0 người dùng được đưa sang Trang chủ mà không phải tự tải lại; sau giờ mở, mở màn Đếm ngược cũng tự chuyển sang Trang chủ.

### Homepage (2xx)

- **FR-211** Trang chủ có phần hero với logo "ROOT FURTHER" trên ảnh nền.
- **FR-212** Trang chủ hiện nhãn "Sắp diễn ra" và đếm ngược DAYS, HOURS, MINUTES tới giờ bắt đầu lễ; sau mốc đó nhãn ẩn và đồng hồ dừng ở 00 00 00.
- **FR-213** Trang chủ hiện thời gian (ngày lễ dạng ngày/tháng/năm), địa điểm (Âu Cơ Art Center) và dòng "Tường thuật trực tiếp qua sóng Livestream" chỉ là chữ, không có liên kết.
- **FR-214** Trang chủ có bài giới thiệu chủ đề "Root Further" kèm câu "A tree with deep roots fears no storm".
- **FR-215** Trang chủ có mục "Hệ thống giải thưởng" gồm 6 thẻ giải, mỗi thẻ có ảnh, tên, mô tả ngắn và "Chi tiết".
- **FR-216** Trang chủ có banner "Phong trào ghi nhận – Sun* Kudos – ĐIỂM MỚI CỦA SAA 2025" kèm nút "Chi tiết".

### Awards System (3xx)

- **FR-301** Trang Hệ thống giải có ảnh nền, logo và tiêu đề "Hệ thống giải thưởng SAA 2025".
- **FR-302** Menu neo liệt kê 6 giải, mỗi giải một mục: trên máy tính là cột đứng yên bên trái khi cuộn, trên điện thoại là thanh chip ngang ngay dưới header.
- **FR-303** Mỗi giải có ảnh, tên, mô tả, "Số lượng giải thưởng" kèm đơn vị người nhận và "Giá trị giải thưởng".
- **FR-304** Giải Signature 2025 - Creator hiện hai mức giá trị, cá nhân và tập thể, ngăn cách bằng chữ "Hoặc".
- **FR-305** Số lượng, đơn vị và giá trị của 6 giải đúng bảng quy định ở § 13.
- **FR-306** Cuối trang có banner Sun* Kudos.
- **FR-307** Bấm một mục menu thì cuộn mượt tới giải đó (tức thì nếu người dùng bật giảm chuyển động), đặt focus vào khối giải và cập nhật phần neo trên địa chỉ mà không thêm mục lịch sử; bấm kèm phím bổ trợ, bằng chuột không phải nút trái, hoặc khi chưa có JavaScript thì giữ hành vi link thường.
- **FR-308** Mục của giải đang nằm ở "đường đọc" (25% chiều cao khung nhìn) được đánh dấu cho trình đọc màn hình và cập nhật khi cuộn, đổi kích thước hoặc nhảy xa.
- **FR-309** Phần neo trên địa chỉ không khớp giải nào thì trang mở ở đầu trang và không báo lỗi.

### Rules (3xx)

- **FR-311** Trang Thể lệ hiện nội dung tĩnh: bốn bậc huy hiệu Hero (1–4, 5–9, 10–20, hơn 20 người gửi Kudos), luật Secret Box (mỗi 5 tim mở 1 hộp, sưu tập đủ 6 biểu tượng nhận quà bí ẩn) và Kudos Quốc Dân (5 Kudo nhiều tim nhất).
- **FR-312** Trang Thể lệ chỉ hiển thị; không tính toán và không đọc dữ liệu của người dùng.
- **FR-313** Nút "Đóng" ở cuối Thể lệ đưa người dùng về trang họ vừa đọc nếu có trang trước thuộc cùng site, không thì về Trang chủ.
- **FR-314** Nút "Viết KUDOS" ở cuối Thể lệ mở Live board Kudos; trang chỉ điều hướng, ô soạn Kudo không tự mở.

### Community Standards (3xx)

- **FR-321** Trang Tiêu chuẩn cộng đồng hiện nội dung tĩnh: mô tả mục đích, 10 tiêu chí vi phạm bị gắn nhãn Spam, mục "Tiêu chuẩn bảo mật" và dòng liên hệ.

### Interaction (4xx)

- **FR-401** Đếm ngược tính theo giờ máy chủ, không theo đồng hồ của thiết bị.
- **FR-402** Các trang dùng được trên máy tính và điện thoại (không cuộn ngang ở chiều rộng 375 px); bố cục tablet theo quyết định chung của dự án.
- **FR-403** Đồng hồ đếm ngược đọc được bằng trình đọc màn hình: một vùng thông báo lịch sự đọc dạng "5 ngày 3 giờ 7 phút", chỉ đổi chữ khi phút đổi.

### Security (6xx)

- **FR-601** Trước giờ mở, người không phải admin mở trang ngoài danh sách cho phép thì được đưa tới màn Đếm ngược.
- **FR-602** Mọi trang của cổng cần đăng nhập và đã chọn phòng ban, trừ màn Đếm ngược; chưa có phiên thì F001_Auth xử lý.
- **FR-603** Các trang tĩnh không nhận chữ người dùng nhập và không hiện thông tin cá nhân của ai.
- **FR-604** Trước giờ mở, thao tác ghi hoặc lời gọi lấy dữ liệu của người không phải admin trên đường bị chặn bị từ chối bằng mã lỗi prelaunch, không bị chuyển hướng.
- **FR-605** Admin vào được mọi trang trước giờ mở để chuẩn bị nội dung nhưng chưa ghi được Kudo hay tim cho tới giờ mở.

## 5. Business Rules

- Số còn lại = mốc − giờ máy chủ, đổi ra ngày, giờ, phút (làm tròn xuống), không bao giờ hiện số âm; từ mốc trở đi hiện 00 00 00 (BR-001)
- "Trước giờ mở" chỉ suy ra từ giờ máy chủ so với giờ mở ở mỗi lần truy cập, không lưu cờ riêng ở đâu cả; đúng giờ mở là đã mở (BR-002)
- Thông tin 6 giải (tên, mô tả, số lượng, giá trị) chỉ có một nguồn; Trang chủ và trang Hệ thống giải cùng đọc nguồn đó (BR-003)
- Vai trò admin luôn đọc từ cơ sở dữ liệu ở mỗi lần truy cập; không đọc được hoặc không có hồ sơ thì coi như không phải admin (BR-004)
- Mục menu neo được đánh dấu là giải cuối cùng đã vượt đường đọc 25% chiều cao khung nhìn; ở phía trên mọi giải thì là mục đầu tiên (BR-005)
- Ngày lễ ở Trang chủ hiển thị theo múi giờ sự kiện (mặc định giờ Việt Nam), không theo múi giờ của thiết bị hay máy chủ (BR-006)
- Bậc Hero trên Thể lệ dùng cùng chữ và cùng huy hiệu với chú giải huy hiệu của feature Hero nên hai nơi không lệch nhau (BR-007)
- Các danh sách của trang Tiêu chuẩn cộng đồng nằm trong file bản dịch: thêm hay bớt mục chỉ cần sửa file, phần tử không phải chữ bị bỏ qua (BR-008)
- Trước giờ mở: người không phải admin ngoài danh sách cho phép bị đưa tới Đếm ngược (tải trang) hoặc bị từ chối (thao tác, lấy dữ liệu); admin và danh sách cho phép đi tiếp; sau giờ mở chỉ còn luật Đếm ngược chuyển sang Trang chủ (DEC-001)
- Đếm về 0 thì màn Đếm ngược tự sang Trang chủ, còn đồng hồ ở Trang chủ dừng ở 00 00 00; nhãn "Sắp diễn ra" chỉ hiện khi còn đang đếm (DEC-002)
- Giải có hai mức giá trị thì mức thứ hai hiện sau chữ "Hoặc"; giải có chú thích thì chú thích hiện dưới số tiền (DEC-003)
- Bấm menu neo: kèm phím bổ trợ hoặc chuột khác nút trái thì giữ link thường; không tìm thấy khối cũng giữ link thường; còn lại thì cuộn, đặt focus và cập nhật phần neo (DEC-004)
- Đóng Thể lệ: có trang trước thuộc cùng site thì quay lại trang đó, không thì về Trang chủ (DEC-005)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Đếm ngược | SCR010_CountdownPrelaunch | Tiêu đề "Sự kiện sẽ bắt đầu sau" và ba ô DAYS, HOURS, MINUTES giữa màn hình trên ảnh nền mờ; không có liên kết tới thông tin giải | Xem thời gian còn lại; tới giờ thì tự sang Trang chủ |
| Trang chủ | SCR011_Homepage | Hero với logo và đếm ngược tới lễ, thời gian và địa điểm, bài chủ đề, lưới 6 thẻ giải, banner Sun* Kudos | Mở trang Hệ thống giải (nút hoặc "Chi tiết" từng giải), mở Live board Kudos |
| Hệ thống giải | SCR008_AwardsSystem | Tiêu đề, menu neo bên trái, 6 khối giải với ảnh, mô tả, số lượng và giá trị, banner Sun* Kudos | Bấm menu để tới từng giải, cuộn xem, mở Live board Kudos từ banner |
| Thể lệ | SCR012_Rules | Panel bên phải trên nền tối: bậc huy hiệu Hero, luật Secret Box với 6 biểu tượng, Kudos Quốc Dân | Đọc; "Đóng" để quay lại; "Viết KUDOS" để sang Live board Kudos |
| Tiêu chuẩn cộng đồng | SCR009_CommunityStandards | Logo, tiêu chuẩn cộng đồng với 10 tiêu chí vi phạm, mục Tiêu chuẩn bảo mật và dòng liên hệ | Đọc |

### User Journey

1. Trước giờ mở, Sunner đăng nhập xong và được đưa tới màn Đếm ngược, thấy số ngày, giờ, phút còn lại.
2. Tới giờ mở, màn Đếm ngược tự chuyển sang Trang chủ mà Sunner không cần làm gì.
3. Sunner đọc bài chủ đề rồi bấm "Chi tiết" ở thẻ MVP trên Trang chủ.
4. Sunner tới trang Hệ thống giải, đúng khối MVP, thấy 1 giải cá nhân trị giá 15.000.000 VNĐ.
5. Sunner bấm các mục menu bên trái để nhảy giữa các giải, rồi cuộn xuống cuối bấm "Chi tiết" ở banner Sun* Kudos để sang Live board Kudos.
6. Sunner mở Thể lệ từ khung chung, đọc luật huy hiệu và Secret Box, rồi bấm "Đóng" để về trang vừa đọc.

## 7. User Stories

### US045_OpenAwardsFromHomepage — Open Awards From Homepage

**Actor:** Sunner
**Goal:** Từ Trang chủ mở trang Hệ thống giải, cả trang lẫn đúng khối giải mình quan tâm.
**Business value:** Sunner đọc được chi tiết số lượng và giá trị từng giải, tăng động lực gửi và nhận ghi nhận.

**Acceptance Criteria:**
- [ ] Nút "ABOUT AWARDS" ở hero mở trang Hệ thống giải và trang dừng ở đầu.
- [ ] Mỗi trong 6 thẻ giải (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) có "Chi tiết" mở đúng khối của giải đó và trang cuộn tới khối ấy.
- [ ] Phần neo không khớp khối nào thì trang đứng ở đầu.
- [ ] "Chi tiết" có tên truy cập riêng theo từng giải ("Chi tiết về giải {tên giải}") để trình đọc màn hình phân biệt được.

### US046_OpenKudosBoard — Open Kudos Board

**Actor:** Sunner
**Goal:** Đi tới Live board Kudos từ các lời mời Sun* Kudos mà không phải tự gõ địa chỉ.
**Business value:** Dẫn người đọc từ nội dung giới thiệu sang hành động ghi nhận, kéo hoạt động Kudos của cả sự kiện.

Story này gộp theo đích, không theo trang chứa; các điểm vào ở trang chi tiết Kudo và hai trang "không tìm thấy" thuộc F004_KudosFeed và F012_Profile, F006 chỉ sở hữu các điểm vào bên dưới.

**Acceptance Criteria:**
- [ ] "ABOUT KUDOS" ở hero Trang chủ và nút của banner Sun* Kudos (ở Trang chủ và trang Hệ thống giải) mở Live board Kudos.
- [ ] "Viết KUDOS" trên Thể lệ mở Live board Kudos; trang chỉ điều hướng, ô soạn Kudo không tự mở.

### US047_JumpToAwardSection — Jump To Award Section

**Actor:** Sunner
**Goal:** Bấm menu neo bên trái trang Hệ thống giải để nhảy tới khối của một giải.
**Business value:** Sunner khỏi phải cuộn qua cả 6 giải để tới giải mình cần.

**Acceptance Criteria:**
- [ ] Menu có 6 mục, một mục mỗi giải; bấm một mục cuộn mượt tới khối (tức thì khi người dùng bật giảm chuyển động), đặt focus vào khối và cập nhật phần neo mà không thêm mục lịch sử.
- [ ] Mục của giải đang ở đường đọc được đánh dấu và cập nhật theo cuộn và theo đổi kích thước; nhảy xa (Home, "về đầu trang") vẫn đánh dấu đúng.
- [ ] Bấm kèm Ctrl, Cmd, Shift, Alt hoặc không phải chuột trái thì giữ hành vi link thường; khi chưa có JavaScript link vẫn dùng được.
- [ ] Máy tính: cột menu đứng yên bên trái; điện thoại: thanh chip ngang dưới header, chip đang chọn tự cuộn vào tầm nhìn trong thanh.

### US048_CloseRulesPage — Close Rules Page

**Actor:** Sunner
**Goal:** Đóng trang Thể lệ để quay về trang vừa đọc.
**Business value:** Sunner tiếp tục việc đang làm mà không phải tự tìm đường quay lại.

**Acceptance Criteria:**
- [ ] Có trang trước thuộc cùng site thì "Đóng" quay lại trang đó.
- [ ] Không có trang trước cùng site (mở thẳng Thể lệ ở tab mới, hoặc đến từ site khác) thì "Đóng" mở Trang chủ.
- [ ] Nút nằm cạnh "Viết KUDOS" ở cuối panel, nhãn "Đóng" kèm biểu tượng đóng.

## 8. Scenarios

### US045_OpenAwardsFromHomepage — Happy Path

**Given** Sunner ở Trang chủ sau giờ mở, **When** bấm "Chi tiết" ở thẻ MVP, **Then** trang Hệ thống giải mở và cuộn tới khối MVP.

### US045_OpenAwardsFromHomepage — Error: phần neo lạ hoặc chưa tới giờ mở

**Given** địa chỉ trang Hệ thống giải có phần neo không khớp giải nào, **When** trang mở, **Then** hiện từ đầu trang và không báo lỗi; còn nếu chưa tới giờ mở và là Sunner thường thì người dùng bị đưa tới màn Đếm ngược chứ không thấy các nút.

### US046_OpenKudosBoard — Happy Path

**Given** Sunner ở Trang chủ, **When** bấm "ABOUT KUDOS", **Then** Live board Kudos mở.

### US046_OpenKudosBoard — Error: mở từ Thể lệ

**Given** Sunner ở Thể lệ, **When** bấm "Viết KUDOS", **Then** Live board Kudos mở và ô soạn Kudo chưa mở; người dùng tự bấm nút viết nếu muốn gửi.

### US047_JumpToAwardSection — Happy Path

**Given** trang Hệ thống giải ở đầu trang, **When** Sunner bấm mục "MVP", **Then** trang cuộn mượt tới khối MVP, focus vào khối, phần neo thành mvp và mục MVP được đánh dấu.

### US047_JumpToAwardSection — Error: bấm kèm phím bổ trợ hoặc bật giảm chuyển động

**Given** Sunner giữ Ctrl khi bấm một mục, **When** bấm, **Then** trình duyệt mở giải đó ở tab mới và trang hiện tại không cuộn; còn nếu hệ điều hành bật giảm chuyển động thì trang nhảy tức thì thay vì cuộn mượt.

### US048_CloseRulesPage — Happy Path

**Given** Sunner mở Thể lệ từ footer của Live board, **When** bấm "Đóng", **Then** quay lại Live board.

### US048_CloseRulesPage — Error: mở thẳng hoặc từ site khác

**Given** Sunner dán địa chỉ Thể lệ vào tab mới hoặc đến từ site khác, **When** bấm "Đóng", **Then** Trang chủ mở.

### BL013_PrelaunchGate — Happy Path

**Given** chưa tới giờ mở, **When** Sunner thường đã đăng nhập mở Trang chủ, **Then** được đưa tới màn Đếm ngược với số ngày, giờ, phút còn lại; còn Admin thì vào thẳng Trang chủ.

### BL013_PrelaunchGate — Error: đồng hồ thiết bị sai

**Given** đồng hồ thiết bị lệch nhiều giờ hoặc nhiều ngày, **When** mở màn Đếm ngược hoặc Trang chủ, **Then** số còn lại vẫn theo giờ máy chủ.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Người không phải admin mở trang ngoài danh sách cho phép trước giờ mở (kể cả trang Hệ thống giải) | Được đưa tới màn Đếm ngược | "Sự kiện sẽ bắt đầu sau" (tiêu đề của màn Đếm ngược) |
| Admin mở trang trước giờ mở | Vào được mọi trang kể cả khu quản trị; chưa gửi được Kudo hay thả tim tới giờ mở | "None — cổng không hiện thông báo; việc từ chối ghi do feature gửi Kudo và thả tim thông báo" |
| Không đọc được vai trò (lỗi cơ sở dữ liệu hoặc chưa có hồ sơ) | Coi như không phải admin nên chịu cổng | "Sự kiện sẽ bắt đầu sau" (sau khi được đưa tới màn Đếm ngược) |
| Khách chưa đăng nhập mở Trang chủ trước giờ mở | Được đưa sang trang đăng nhập chứ không tới Đếm ngược; mở thẳng màn Đếm ngược hoặc trang đăng nhập thì vào được | "None — hiện trang đăng nhập" |
| Lời gọi trực tiếp (thao tác ghi hoặc lấy dữ liệu) của người không phải admin trước giờ mở | Bị từ chối với mã lỗi prelaunch, không chuyển hướng; giao diện thường không bao giờ gây ra vì người dùng đã bị đưa về Đếm ngược | "None — chỉ lời gọi trực tiếp nhận mã lỗi prelaunch, giao diện không hiện thông báo" |
| Mở màn Đếm ngược sau giờ mở, kể cả khách | Tự chuyển sang Trang chủ (khách tiếp tục sang đăng nhập) | "None — chuyển trang im lặng" |
| Đồng hồ chạm 0 trong khi máy chủ vẫn coi là trước giờ mở | Trang thử sang Trang chủ rồi bị đưa lại màn Đếm ngược | "None — im lặng, không báo lỗi" |
| Đồng hồ thiết bị lệch hoặc tab ẩn lâu rồi hiện lại | Số còn lại vẫn theo giờ máy chủ; tab hiện lại thì cập nhật ngay | "None — im lặng" |
| Mở Trang chủ sau giờ bắt đầu lễ | Đồng hồ dừng ở 00 00 00, nhãn "Sắp diễn ra" ẩn, ngày và địa điểm vẫn hiện | "None — im lặng" |
| Phần neo trên trang Hệ thống giải không khớp giải nào | Trang mở từ đầu | "None — im lặng" |
| Bấm menu neo kèm Ctrl, Cmd, Shift, Alt, bằng chuột không phải nút trái, bật giảm chuyển động, hoặc chưa có JavaScript | Phím bổ trợ hoặc chuột khác: hành vi link thường (mở tab mới); giảm chuyển động: nhảy tức thì; chưa có JavaScript: link vẫn dẫn tới khối | "None — im lặng" |
| Mở Thể lệ thẳng ở tab mới hoặc từ site khác rồi bấm "Đóng" | Về Trang chủ; bấm nút Back của trình duyệt sau đó quay lại Thể lệ | "None — im lặng" |
| Ảnh hero hoặc ảnh giải không tải được | Khung ảnh vẫn giữ chỗ, chữ vẫn đọc được và nút vẫn bấm được | "None — khung ảnh trống, không báo lỗi" |
| Đổi ngôn ngữ khi đang xem trang | Mọi chữ đổi sang ngôn ngữ mới | "None — im lặng" |
| Giờ mở hoặc giờ lễ thiếu hay sai định dạng | Ứng dụng không khởi động, người vận hành thấy danh sách lỗi cấu hình | "None — người dùng cuối không thấy; người vận hành đọc danh sách lỗi lúc khởi động" |

## 10. Edge Behaviours to Verify

- **FR-002** → Đặt giờ mở sang tương lai rồi quá khứ mà không sửa code: Sunner thường chuyển đúng giữa Đếm ngược và Trang chủ; bỏ trống một giờ thì ứng dụng không khởi động.
- **FR-103** → Bấm "ABOUT AWARDS" tới trang Hệ thống giải, "ABOUT KUDOS" tới Live board Kudos.
- **FR-201** → Màn Đếm ngược chỉ có tiêu đề và ba cột, mỗi cột ít nhất hai chữ số, không có liên kết tới trang giải.
- **FR-202** → Để màn Đếm ngược mở hơn một phút: số phút giảm mà trang không tải lại; ẩn tab rồi hiện lại thì số cập nhật ngay.
- **FR-203** → Đặt giờ mở sau hiện tại 1 phút: hết phút trang tự sang Trang chủ; sau giờ mở, mở màn Đếm ngược thì tự về Trang chủ.
- **FR-212** → Sau giờ bắt đầu lễ, đồng hồ Trang chủ dừng ở 00 00 00 và nhãn "Sắp diễn ra" ẩn.
- **FR-213** → Ngày lễ trên Trang chủ khớp ngày theo múi giờ sự kiện của giờ bắt đầu lễ cấu hình.
- **FR-302** → Máy tính: menu đứng yên khi cuộn; điện thoại: thanh chip ngang, chip đang chọn tự cuộn vào tầm nhìn.
- **FR-305** → So 6 giải với bảng § 13: số lượng, đơn vị và giá trị khớp; Signature có hai mức.
- **FR-307** → Bấm mục menu: cuộn mượt, focus vào khối, phần neo đổi, không thêm mục lịch sử; Ctrl+bấm mở tab mới.
- **FR-308** → Cuộn tay qua từng giải: đúng một mục được đánh dấu và đổi theo vị trí; nhảy về đầu trang thì mục đầu được chọn lại.
- **FR-309** → Mở trang Hệ thống giải với phần neo không tồn tại: trang ở đầu, không lỗi.
- **FR-313** → Mở Thể lệ từ một trang trong site rồi bấm "Đóng": quay lại trang đó; mở thẳng thì về Trang chủ.
- **FR-401** → Chỉnh đồng hồ thiết bị lệch lớn: số còn lại không đổi so với giờ máy chủ.
- **FR-403** → Trình đọc màn hình đọc đúng dạng "ngày giờ phút" và chỉ đọc lại khi phút đổi.
- **FR-601** → Trước giờ mở, tài khoản Sunner thường mở Trang chủ, Live board hoặc trang Hệ thống giải: bị đưa tới Đếm ngược.
- **FR-604** → Trước giờ mở, lời gọi trực tiếp của Sunner thường tới đường bị chặn nhận mã lỗi prelaunch, không bị chuyển hướng.
- **FR-605** → Trước giờ mở, tài khoản Admin vào được Trang chủ và khu quản trị.
- **FR-603** → Trang Thể lệ và Tiêu chuẩn cộng đồng không có ô nhập chữ.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Số liệu trong Thể lệ (5 tim mỗi Secret Box, 5 Kudo Quốc Dân, ngưỡng bậc Hero) là chữ trong file bản dịch, còn giá trị thật nằm ở cấu hình hoặc hằng số của feature khác; số tim mỗi hộp là cấu hình đổi được | Người dùng đọc luật khác với luật hệ thống tính nếu một bên đổi mà bên kia không | confirmed |
| RISK-02 | risk | Chữ cố định gắn mốc thời gian ("triển khai vào tháng 11/2025" ở banner Sun* Kudos, địa điểm) nằm trong bản dịch, không đổi theo giờ lễ cấu hình | Trang chủ có thể nêu mốc cũ khi giờ lễ đổi | [INFERRED] |
| RISK-03 | risk | Cổng trước giờ mở chỉ chặn theo đường dẫn nên thao tác ghi gửi tới đường dẫn công khai (màn Đếm ngược) vẫn tới máy chủ; việc chặn ghi dựa vào cửa sổ ghi dùng chung của feature gửi Kudo và thả tim | Nếu cửa sổ ghi bị gỡ hoặc sai, người dùng ghi được Kudo hay tim trước giờ mở | confirmed |
| RISK-04 | known-issue | Nút "Đóng" ở nhánh không có trang trước cùng site mở Trang chủ bằng cách thêm một mục vào lịch sử thay vì thay thế | Sau khi "Đóng" từ Thể lệ mở thẳng, bấm Back của trình duyệt quay lại Thể lệ | confirmed |
| RISK-05 | risk | Danh sách tiêu chí vi phạm hay mục bảo mật thiếu hoặc sai kiểu trong file bản dịch thì trang hiện danh sách rỗng mà không báo lỗi | Trang Tiêu chuẩn cộng đồng có thể trống một phần âm thầm sau khi sửa bản dịch | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Giữ phiên và việc chọn phòng ban, danh sách trang công khai, chuyển tới đăng nhập; cổng prelaunch chạy sau các bước đó | FR-602, BR-002, DEC-001 |
| F002_AppShell | feature | Cấp header, footer, đổi ngôn ngữ và trang lỗi bao quanh các trang; header và footer rút gọn cho màn Đếm ngược | FR-001, FR-402 |
| F004_KudosFeed | feature | Là đích của "ABOUT KUDOS", banner và "Viết KUDOS"; cho mượn ảnh nền Live board của Thể lệ và Tiêu chuẩn cộng đồng | FR-103, FR-104, FR-314 |
| F009_HeroBadges | feature | Cấp huy hiệu và chữ bậc Hero mà Thể lệ dùng lại | BR-007, FR-311 |
| F005_KudosHearts, F010_SecretBoxRewards | feature | Là chủ của luật tim, Secret Box và Kudos Quốc Dân mà Thể lệ chỉ mô tả bằng chữ | FR-311, RISK-01 |
| F003_KudosAuthoring, F005_KudosHearts | feature | Chặn ghi Kudo và tim tới giờ mở ở cửa sổ ghi dùng chung, bổ sung cho cổng chỉ chặn đường dẫn | FR-605, RISK-03 |
| Giờ mở hệ thống, giờ bắt đầu lễ, múi giờ sự kiện | config | Quyết định ai thấy gì trước giờ mở, mốc đếm ngược và ngày lễ hiển thị | FR-002, BR-002, BR-006 |
| Hồ sơ người dùng (vai trò admin hoặc thường) | data | Cổng cần biết ai là admin để cho qua trước giờ mở | BR-004, FR-605 |
| Ảnh nền, ảnh 6 giải, logo và biểu tượng | data | Tài nguyên hình do thiết kế cung cấp | FR-211, FR-303 |
| Thư viện đa ngôn ngữ và phông số đồng hồ | infrastructure | Nạp bản dịch Việt/Anh cho mọi chữ và vẽ chữ số đồng hồ | FR-001, FR-201 |

## 13. Configuration

```text
LAUNCH_AT = (cấu hình theo môi trường, ISO 8601 có múi giờ)   # giờ mở hệ thống; trước giờ này người không phải admin chỉ thấy màn Đếm ngược
EVENT_AT = (cấu hình theo môi trường, ISO 8601 có múi giờ)    # giờ bắt đầu lễ; mốc đếm ngược và ngày lễ hiển thị ở Trang chủ
ADMIN_TIMEZONE = Asia/Ho_Chi_Minh                              # múi giờ hiển thị ngày lễ (mặc định)
AWARD_TOP_TALENT = 10 giải cá nhân, 7.000.000 VNĐ mỗi giải
AWARD_TOP_PROJECT = 2 giải tập thể, 15.000.000 VNĐ mỗi giải
AWARD_TOP_PROJECT_LEADER = 3 giải cá nhân, 7.000.000 VNĐ mỗi giải
AWARD_BEST_MANAGER = 1 giải cá nhân, 10.000.000 VNĐ
AWARD_SIGNATURE_2025_CREATOR = 1 giải cá nhân hoặc tập thể, 5.000.000 VNĐ (cá nhân) hoặc 8.000.000 VNĐ (tập thể)
AWARD_MVP = 1 giải cá nhân, 15.000.000 VNĐ
READING_LINE = 25% chiều cao khung nhìn                        # vị trí "đường đọc" để đánh dấu giải đang xem ở menu neo
```
