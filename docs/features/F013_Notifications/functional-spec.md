---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---

# Functional Spec — F013_Notifications

**Priority**: P2
**Type**: mixed
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — cách đọc hàng đợi sự kiện, chống sinh trùng, kênh realtime riêng tư, endpoint dự kiến và thiết kế dữ liệu cho Dev/QA/SA.

**Traceability:** F013_Notifications → TBD (draft) → TBD (draft) → TBD (draft) → TBD (draft) → TBD (draft)

## 1. Overview

**Problem:** Sunner không biết kịp thời khi có việc liên quan mình: nhận Kudo mới, Kudo của mình được thả tim, có thêm Secret Box, lên cấp Hero, hay Kudo bị tạm ẩn. Nếu thông báo sinh trùng, lộ người gửi ẩn danh, hoặc mỗi lượt tim một dòng thì danh sách thành nhiễu và mất lòng tin.
**Solution:** Hệ thống tự tạo một thông báo cho đúng Sunner mỗi khi các feature khác báo có sự việc liên quan. Chuông ở header hiện chấm đỏ khi còn thông báo chưa đọc và cập nhật ngay, không cần tải lại trang. Bấm chuông mở danh sách thông báo mới nhất; "Xem tất cả" mở trang đầy đủ. Bấm một thông báo thì đánh dấu đã đọc và đi tới đối tượng liên quan; có thể đánh dấu đọc tất cả.
**Scope:** Tạo thông báo từ sự kiện của Kudo, thả tim, Secret Box, cấp Hero, Kudo bị tạm ẩn, gom đủ bộ 6 icon và Kudos Quốc Dân; chuông với chấm đỏ; dropdown thông báo; trang "Tất cả thông báo"; đánh dấu đã đọc một dòng và tất cả; nhận thông báo mới theo thời gian thực.
**Non-Scope:** Không tự phát hiện hay tính toán nghiệp vụ gốc: Kudo (F003), tim (F005), kiểm duyệt (F007), cấp Hero (F009), Secret Box (F010) chỉ báo sự việc cho feature này. Không dựng header (F002 chỉ chừa chỗ cho chuông). Không có thông báo cho Admin về Kudo bị hệ thống gắn cờ (F007 đã loại ở D014). Không có thông báo nhắc tên (mention) trong lời nhắn (F003 đã hỏi riêng). Không gửi email hay thông báo đẩy ngoài trình duyệt. Không có trang chi tiết riêng cho thông báo: bấm dòng đi thẳng tới đối tượng. Không có các dòng mẫu không thuộc sản phẩm trong thiết kế (khen ngợi từ cấp trên, lời nhắn từ nhóm, hoàn thành khóa học...), xem D004.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner nhận thông báo | Sunner đã đăng nhập, đang dùng ứng dụng hoặc quay lại sau một lúc | Biết ngay có việc liên quan mình và đi thẳng tới đó |
| Hệ thống | Các feature nguồn (Kudo, tim, kiểm duyệt, Hero, Secret Box) báo sự việc | Mỗi sự việc ra đúng một thông báo cho đúng người, không trùng, không lộ ẩn danh |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Generate notifications from events | Nhận một thông báo đúng loại, đúng người cho mỗi sự việc liên quan mình | US001_ReceiveNotifications | FR-001, FR-002, FR-004, FR-405, FR-406, FR-407, FR-408, FR-603 | BR-001, BR-002, BR-003, BR-004, BR-005, BR-006, BR-008, BR-010 | TBD (draft) |
| CAP-02 | Bell badge and realtime delivery | Thấy chấm đỏ trên chuông khi còn thông báo chưa đọc, cập nhật ngay khi có thông báo mới | US002_SeeUnreadBell | FR-101, FR-401, FR-402, FR-409, FR-602 | DEC-003 | TBD (draft) |
| CAP-03 | Browse notifications | Xem thông báo mới nhất ở dropdown và toàn bộ ở trang riêng | US003_BrowseRecentNotifications, US004_BrowseAllNotifications | FR-003, FR-102, FR-201, FR-202, FR-203, FR-301, FR-302, FR-601 | BR-009, DEC-001, DEC-002, DEC-004 | TBD (draft) |
| CAP-04 | Open a notification and manage read state | Bấm thông báo để tới đối tượng liên quan và đánh dấu đã đọc, hoặc đánh dấu tất cả | US005_OpenNotification, US006_MarkAllRead | FR-103, FR-403, FR-404 | BR-007, SM-001 | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Thả nhiều tim cho cùng một Kudo thì mỗi tim một thông báo hay gộp? | Gộp: mỗi Kudo một thông báo chưa đọc, hiện số tim; khi đã đọc rồi mà có tim mới thì mở thông báo mới | Một Kudo hot có thể nhận hàng chục tim, mỗi tim một dòng sẽ dìm các thông báo khác | no |
| D002 | Chuông hiện chấm đỏ hay số lượng chưa đọc? | Chấm đỏ như thiết kế; số chưa đọc vẫn có sẵn nếu sau này cần | Ảnh thiết kế chỉ có chấm đỏ, mô tả feature nhắc "số chưa đọc" | no |
| D003 | Biểu tượng ≡ ở dropdown là gì? | Đánh dấu đọc tất cả, khớp nút "Đánh dấu đọc tất cả" ở trang riêng [INFERRED] | Hai màn dùng cùng biểu tượng, trang riêng ghi rõ nhãn | no |
| D004 | Các dòng mẫu không thuộc sản phẩm trong thiết kế có làm không? | Không làm: chỉ bảy loại thật ở FR-004; dòng mẫu coi là chữ giả của thiết kế | Không có sự kiện nguồn nào tạo ra chúng | no |
| D005 | Kudo được Un Spam trở lại có báo cho chủ không? | Không báo | Thiết kế chỉ có thông báo tạm ẩn; F007 chỉ phát sự kiện khi Mark Spam | no |
| D006 | Câu chữ và biểu tượng thông báo Kudos Quốc Dân là gì? | Thiết kế chưa có; ship với câu chúc mừng tạm nêu tên quà Root Further và dẫn tới Kudo xếp hạng cao nhất của người đó [NEEDS_DOMAIN_CONFIRMATION] | F010 chốt người gửi nhận quà nhưng thiết kế không có mẫu thông báo | no |
| D007 | Bấm một dòng thì làm gì và đi tới đâu? | Đánh dấu dòng đã đọc rồi đi tới: Kudo mới và tim → chi tiết Kudo; Secret Box → màn mở hộp; lên cấp Hero và đủ 6 icon → profile của chính mình; Kudo bị tạm ẩn → trang Tiêu chuẩn cộng đồng; Kudos Quốc Dân → chi tiết Kudo | Mỗi loại đã có đối tượng đích ở feature khác; profile là mặc định tạm cho hai loại chưa có đích rõ | no |
| D008 | Số "X lời nhắn" trong thông báo lên cấp Hero đếm gì? | Số người gửi khác nhau, cùng cách F009 tính cấp | Số này là căn cứ lên cấp nên phải khớp F009 | no |
| D009 | Thông báo cũ có bị xoá sau một thời gian không? | Không xoá: giữ toàn bộ trong thời gian sự kiện | Quy mô nhỏ, chiến dịch ngắn; dọn dẹp chỉ thêm việc | no |
| D010 | Thả tim bị bỏ, Un Spam, hay đổi nguồn sau đó có sửa hay rút thông báo đã gửi không? | Không rút, không sửa | Khớp cách F010 không thu hồi Secret Box; thông báo là bản ghi một sự việc đã xảy ra | no |
| D011 | Dropdown và trang riêng hiện bao nhiêu dòng mỗi lần? | Dropdown 10 dòng mới nhất; trang riêng nạp 20 dòng mỗi lần bằng nút "Tải thêm" [INFERRED] | Thiết kế không nêu số dòng; "Tải thêm" khớp feed của F004 | no |
| D012 | Cần trang chi tiết riêng cho một thông báo không? | Không: bấm dòng đi thẳng tới đối tượng | Mô tả feature có "xem chi tiết" nhưng thiết kế không có màn này và đối tượng đích đã có chi tiết | no |
| D013 | Các feature nguồn báo sự việc bằng cách nào? | Mỗi feature nguồn ghi sự việc vào hàng đợi sự kiện chung cùng lúc với thay đổi dữ liệu của mình; F013 là bên đọc | Cùng cơ chế F010 đã chọn: không mất và không phát thừa sự việc khi thao tác bị huỷ | no |
| D014 | Thông báo Kudo ẩn danh hiện câu gì? | "Một Sunner ẩn danh vừa gửi đến bạn lời ghi nhận đầy yêu thương!"; không bao giờ có tên người gửi [INFERRED] | Khớp quy tắc ẩn danh của F004; thiết kế chỉ có mẫu có tên | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mỗi sự việc liên quan tới một Sunner sinh đúng một thông báo cho Sunner đó, kể cả khi hệ thống xử lý sự việc nhiều lần.
- **FR-002** Thông báo lưu loại và dữ kiện, không lưu câu chữ; câu hiển thị theo ngôn ngữ đang chọn, kể cả thông báo cũ.
- **FR-003** Mỗi Sunner chỉ xem và đổi trạng thái thông báo của chính mình.
- **FR-004** Có bảy loại thông báo: Kudo mới nhận, Kudo được thả tim, có Secret Box mới, lên cấp Hero, Kudo bị tạm ẩn, gom đủ 6 icon, Kudos Quốc Dân.

### Navigation (1xx)

- **FR-101** Chuông thông báo nằm trong header (chỗ F002 chừa); bấm chuông mở dropdown thông báo.
- **FR-102** Liên kết "Xem tất cả" ở dropdown mở trang "Tất cả thông báo".
- **FR-103** Bấm một thông báo đi tới đối tượng liên quan của loại đó (xem D007).

### Notification Dropdown (2xx)

- **FR-201** Dropdown có tiêu đề "Thông báo", liên kết "Xem tất cả", nút đánh dấu đọc tất cả và danh sách thông báo mới nhất trước.
- **FR-202** Mỗi dòng có biểu tượng theo loại, nội dung, thời gian tương đối ("15 phút trước"); dòng chưa đọc có chấm đỏ bên phải; dòng đang trỏ chuột được làm nổi.
- **FR-203** Chưa có thông báo nào thì dropdown hiện trạng thái trống.

### All Notifications Page (3xx)

- **FR-301** Trang "Tất cả thông báo" có tiêu đề "Thông báo", hành động "Đánh dấu đọc tất cả" và danh sách dài cùng kiểu dòng như dropdown.
- **FR-302** Danh sách trang riêng nạp thêm từng đợt khi bấm "Tải thêm"; chưa có thông báo thì hiện trạng thái trống.

### Interaction (4xx)

- **FR-401** Chuông hiện chấm đỏ khi còn ít nhất một thông báo chưa đọc và mất chấm khi hết.
- **FR-402** Thông báo mới hiện trên chuông trong vài giây, không cần tải lại trang; nếu dropdown đang mở thì dòng mới hiện ở đầu danh sách.
- **FR-403** Bấm một thông báo đánh dấu riêng thông báo đó đã đọc.
- **FR-404** Đánh dấu đọc tất cả đặt mọi thông báo chưa đọc thành đã đọc ngay và chấm đỏ biến mất.
- **FR-405** Tim cho cùng một Kudo khi thông báo chưa đọc thì gộp vào một dòng có số tim (xem D001).
- **FR-406** Thông báo Kudo mới nhận từ Kudo ẩn danh không để lộ người gửi.
- **FR-407** Thông báo lên cấp Hero chỉ gửi khi cấp thật sự cao hơn, đúng một lần cho mỗi cấp.
- **FR-408** Kudo đã bị tạm ẩn thì không sinh thông báo Kudo mới, tim hay lên cấp.
- **FR-409** Mất kết nối realtime rồi nối lại, hoặc quay lại tab, thì chuông tự cập nhật đúng số chưa đọc.

### Security (6xx)

- **FR-601** Mọi thao tác với thông báo đòi hỏi đã đăng nhập.
- **FR-602** Tin báo realtime chỉ đến đúng Sunner được thông báo, không đến người khác.
- **FR-603** Thông báo không chứa nội dung Kudo hay danh tính người gửi ẩn danh.

## 5. Business Rules

- Một sự việc, một người nhận, một loại thì tối đa một thông báo; xử lý lại không sinh thêm (BR-001)
- Người gây ra sự việc không nhận thông báo về hành động của chính mình, như tự thả tim cho Kudo của mình (BR-002)
- Chỉ Kudo đang Public mới sinh thông báo Kudo mới, tim và lên cấp; thông báo Kudo bị tạm ẩn vẫn gửi cho chủ Kudo (BR-003)
- Tim cho cùng Kudo gộp vào thông báo chưa đọc; thông báo đã đọc thì tim sau mở thông báo mới (BR-004)
- Lên cấp Hero báo khi cấp tính ngay sau Kudo cao hơn cấp ngay trước, đúng một lần mỗi cấp mỗi người (BR-005)
- Kudo ẩn danh không bao giờ để lộ người gửi trong thông báo, kể cả ở dữ liệu gửi xuống trình duyệt (BR-006)
- Đã đọc là một chiều: không có thao tác đưa thông báo về chưa đọc; đánh dấu lặp không gây lỗi (BR-007)
- Thông báo đã gửi không bị rút hay sửa khi nguồn đổi sau đó (BR-008)
- Danh sách xếp mới nhất trước theo thời điểm của sự việc gần nhất (BR-009)
- Thông báo lưu loại và dữ kiện, câu chữ dựng theo ngôn ngữ đang chọn (BR-010)
- Chuông có chấm đỏ khi chưa đọc khác 0, không có chấm khi bằng 0 (DEC-003)
- Câu thông báo Kudo mới đổi sang bản không tên khi Kudo ẩn danh (DEC-001)
- Thông báo tim hiện số tim khi đã gộp từ hai tim trở lên, không thì dùng câu một tim (DEC-002)
- Danh sách rỗng thì hiện trạng thái trống thay vì khung trắng (DEC-004)
- Thông báo có vòng đời chưa đọc rồi đã đọc, một chiều (SM-001)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Notification Dropdown | TBD (draft) — SCR025_NotificationDropdown | Bảng thả xuống từ chuông: tiêu đề "Thông báo", "Xem tất cả", biểu tượng đánh dấu đọc tất cả và các dòng thông báo mới nhất | Bấm dòng để tới đối tượng, đánh dấu đọc tất cả, mở trang tất cả thông báo |
| All Notifications | TBD (draft) — SCR024_AllNotifications | Khung tối ở giữa trang với tiêu đề "Thông báo", "Đánh dấu đọc tất cả" và danh sách dài | Bấm dòng để tới đối tượng, đánh dấu đọc tất cả, nạp thêm |

### User Journey

1. Sunner đang dùng ứng dụng thì có người gửi Kudo cho mình; chuông ở header hiện chấm đỏ mà không cần tải lại trang.
2. Sunner bấm chuông và thấy dropdown với dòng mới nhất ở trên cùng, có chấm đỏ bên phải.
3. Sunner bấm dòng đó: chấm đỏ của dòng mất và Sunner được đưa tới Kudo vừa nhận.
4. Muốn xem lại những thông báo cũ, Sunner mở dropdown, bấm "Xem tất cả" và cuộn danh sách trên trang "Tất cả thông báo", bấm "Tải thêm" khi cần.
5. Sunner bấm "Đánh dấu đọc tất cả": mọi chấm đỏ và chấm trên chuông biến mất.

## 7. User Stories

### US001_ReceiveNotifications — Receive a notification for each relevant event

**Actor:** Sunner nhận thông báo
**Goal:** Nhận đúng một thông báo cho mỗi sự việc liên quan mình, đúng loại, không trùng.
**Business value:** Sunner biết kịp thời được ghi nhận, được thưởng hay Kudo bị ẩn, nên tiếp tục tham gia chiến dịch.

**Acceptance Criteria:**
- [ ] Mỗi sự việc trong bảy loại tạo một thông báo cho đúng người.
- [ ] Sự việc được xử lý lại không tạo thông báo thứ hai.
- [ ] Kudo ẩn danh không để lộ người gửi trong thông báo.
- [ ] Tim cho cùng một Kudo gộp thành một dòng khi chưa đọc.

### US002_SeeUnreadBell — See the unread dot on the bell

**Actor:** Sunner nhận thông báo
**Goal:** Nhìn chuông là biết còn thông báo chưa đọc, và thấy cập nhật ngay khi có thông báo mới.
**Business value:** Sunner không phải mở danh sách để kiểm tra, thông báo không bị bỏ sót.

**Acceptance Criteria:**
- [ ] Chuông có chấm đỏ khi còn thông báo chưa đọc, không có chấm khi đã đọc hết.
- [ ] Thông báo mới làm chuông cập nhật trong vài giây, không cần tải lại trang.
- [ ] Mất rồi có lại kết nối thì chuông tự khớp số thật.

### US003_BrowseRecentNotifications — Browse recent notifications in the dropdown

**Actor:** Sunner nhận thông báo
**Goal:** Mở chuông xem nhanh những thông báo mới nhất.
**Business value:** Sunner xem và xử lý nhanh mà không rời trang đang dùng.

**Acceptance Criteria:**
- [ ] Dropdown hiện thông báo mới nhất trước, mỗi dòng có biểu tượng, nội dung và thời gian tương đối.
- [ ] Dòng chưa đọc có chấm đỏ bên phải.
- [ ] Có liên kết "Xem tất cả" và trạng thái trống khi chưa có thông báo.

### US004_BrowseAllNotifications — Browse all notifications on a full page

**Actor:** Sunner nhận thông báo
**Goal:** Xem lại toàn bộ thông báo, kể cả cũ, trên một trang riêng.
**Business value:** Sunner không đánh mất thông báo đã trôi khỏi dropdown.

**Acceptance Criteria:**
- [ ] Trang hiện danh sách dài cùng kiểu dòng như dropdown, mới nhất trước.
- [ ] Nạp thêm từng đợt, không lặp dòng.
- [ ] Có hành động "Đánh dấu đọc tất cả" ngay trên trang.

### US005_OpenNotification — Open a notification to reach its object

**Actor:** Sunner nhận thông báo
**Goal:** Bấm một thông báo để tới đúng Kudo, Secret Box hay trang liên quan.
**Business value:** Từ thông báo tới hành động chỉ một cú bấm, tăng tương tác với Kudo và phần thưởng.

**Acceptance Criteria:**
- [ ] Bấm dòng đưa tới đối tượng đúng loại theo D007.
- [ ] Dòng được bấm chuyển thành đã đọc.
- [ ] Không thể đánh dấu hay mở thông báo của người khác.

### US006_MarkAllRead — Mark all notifications as read

**Actor:** Sunner nhận thông báo
**Goal:** Xoá hết chấm đỏ bằng một thao tác khi không cần xem từng dòng.
**Business value:** Chuông trở lại sạch để thông báo mới nổi bật.

**Acceptance Criteria:**
- [ ] Một thao tác đặt mọi thông báo chưa đọc thành đã đọc.
- [ ] Chấm đỏ ở các dòng và trên chuông biến mất ngay.
- [ ] Thông báo đến sau thao tác vẫn là chưa đọc.

## 8. Scenarios

### US001_ReceiveNotifications — Happy Path

**Given** Sunner B vừa được Sunner A gửi Kudo công khai, **When** hệ thống xử lý sự việc đó, **Then** B có một thông báo chưa đọc "A vừa gửi đến bạn lời ghi nhận đầy yêu thương!".

### US001_ReceiveNotifications — Error: Kudo ẩn danh

**Given** A gửi Kudo ẩn danh cho B, **When** B xem thông báo, **Then** B thấy câu không có tên và không có cách nào truy ra A từ thông báo.

### US002_SeeUnreadBell — Happy Path

**Given** B đang mở ứng dụng và hết thông báo chưa đọc, **When** một thông báo mới tới, **Then** chuông của B hiện chấm đỏ trong vài giây mà không cần tải lại trang.

### US002_SeeUnreadBell — Error: Mất kết nối

**Given** kết nối realtime của B bị đứt trong lúc có thông báo mới, **When** kết nối nối lại hoặc B quay lại tab, **Then** chuông khớp đúng số chưa đọc thật.

### US003_BrowseRecentNotifications — Happy Path

**Given** B có 12 thông báo, **When** B bấm chuông, **Then** dropdown hiện 10 thông báo mới nhất trước và liên kết "Xem tất cả".

### US003_BrowseRecentNotifications — Error: Chưa có thông báo

**Given** B chưa có thông báo nào, **When** B bấm chuông, **Then** dropdown hiện trạng thái trống thay vì danh sách rỗng.

### US004_BrowseAllNotifications — Happy Path

**Given** B có 45 thông báo, **When** B mở trang tất cả và bấm "Tải thêm" hai lần, **Then** B thấy 20, rồi 40, rồi đủ 45 dòng, không dòng nào lặp.

### US004_BrowseAllNotifications — Error: Nạp lỗi

**Given** mạng lỗi lúc nạp danh sách, **When** trang không lấy được dữ liệu, **Then** trang hiện thông báo lỗi kèm nút thử lại và chuông vẫn hoạt động.

### US005_OpenNotification — Happy Path

**Given** B có thông báo chưa đọc "Bạn vừa nhận được lượt mở Secret Box mới", **When** B bấm dòng đó, **Then** dòng thành đã đọc và màn mở hộp hiện ra.

### US005_OpenNotification — Error: Đối tượng không còn

**Given** thông báo dẫn tới một Kudo mà sau đó bị tạm ẩn, **When** B bấm dòng, **Then** B thấy trang "không tìm thấy" nhưng dòng vẫn được đánh dấu đã đọc.

### US006_MarkAllRead — Happy Path

**Given** B có 8 thông báo chưa đọc, **When** B bấm "Đánh dấu đọc tất cả", **Then** cả 8 thành đã đọc và chuông hết chấm đỏ.

### US006_MarkAllRead — Error: Mạng lỗi

**Given** mạng lỗi lúc B bấm đánh dấu tất cả, **When** yêu cầu không tới nơi, **Then** chấm đỏ trở lại ở lần nạp sau và B có thể bấm lại.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Một sự việc bị xử lý hai lần | Hệ thống chỉ giữ một thông báo; tim gộp không bị cộng đôi | "None — silent handling" |
| Tim đến đúng lúc Sunner vừa đọc dòng tim | Dòng đã đọc giữ nguyên, tim mới tạo một dòng chưa đọc | "None — silent handling" |
| Kudo bị tạm ẩn trước khi thông báo được tạo | Không tạo thông báo Kudo mới/tim/lên cấp; chủ Kudo vẫn nhận thông báo tạm ẩn | "None — silent handling" |
| Sunner tự thả tim cho Kudo của chính mình | Không tạo thông báo | "None — silent handling" |
| Nhiều Kudo tới gần nhau làm lên cấp | Chỉ một thông báo lên cấp cho mỗi cấp mới đạt | "None — silent handling" |
| Người gửi có hai Kudo trong Kudos Quốc Dân | Một thông báo liệt kê cả hai | "None — silent handling" |
| Chưa có thông báo nào | Dropdown và trang hiện trạng thái trống | "Bạn chưa có thông báo nào" |
| Mất kết nối realtime | Chuông tự khớp lại khi nối lại hoặc quay lại tab | "None — silent handling" |
| Nạp danh sách lỗi | Hiện lỗi kèm thử lại, không ảnh hưởng chuông | "Không tải được thông báo. Vui lòng thử lại." |
| Mở thông báo của người khác bằng cách đoán đường dẫn | Từ chối như thông báo không tồn tại | "Không tìm thấy trang này" |
| Chưa đăng nhập | Chuyển về màn đăng nhập | "Vui lòng đăng nhập để tiếp tục" |
| Thông báo dẫn tới Kudo đã bị tạm ẩn | Mở trang "không tìm thấy", dòng vẫn thành đã đọc | "Không tìm thấy trang này" |

## 10. Edge Behaviours to Verify

- **FR-001** → xử lý lại cùng một sự việc không làm số thông báo hay số tim gộp tăng thêm
- **FR-002** → đổi ngôn ngữ Việt/Anh thì cả thông báo cũ đổi theo
- **FR-003** → Sunner không thấy và không đánh dấu được thông báo của người khác
- **FR-004** → mỗi trong bảy loại tạo thông báo đúng người, đúng nội dung
- **FR-101** → chuông có trong header và mở dropdown khi bấm
- **FR-102** → "Xem tất cả" mở trang tất cả thông báo
- **FR-103** → bấm từng loại đi tới đối tượng đúng theo D007
- **FR-201** → dropdown đủ tiêu đề, "Xem tất cả", nút đọc tất cả và danh sách mới nhất trước
- **FR-202** → dòng có biểu tượng, nội dung, thời gian tương đối; dòng chưa đọc có chấm đỏ bên phải
- **FR-203** → chưa có thông báo thì dropdown hiện trạng thái trống
- **FR-301** → trang riêng đủ tiêu đề, hành động đọc tất cả và danh sách dài
- **FR-302** → "Tải thêm" nạp đợt kế không lặp dòng; trống thì hiện trạng thái trống
- **FR-401** → chấm đỏ đúng với số chưa đọc, mất khi về 0
- **FR-402** → thông báo mới làm chuông cập nhật trong vài giây, không tải lại trang
- **FR-403** → bấm một dòng chỉ đổi dòng đó sang đã đọc
- **FR-404** → đánh dấu tất cả đổi mọi dòng chưa đọc, thông báo đến sau vẫn chưa đọc
- **FR-405** → năm tim liên tiếp cho cùng Kudo hiện một dòng với số tim
- **FR-406** → Kudo ẩn danh không để lộ người gửi trong thông báo hay dữ liệu gửi xuống
- **FR-407** → một cấp Hero chỉ báo một lần
- **FR-408** → Kudo đã bị tạm ẩn không sinh thông báo Kudo mới, tim, lên cấp
- **FR-409** → ngắt rồi nối lại kết nối thì chuông khớp số thật
- **FR-601** → chưa đăng nhập không đọc hay đổi được thông báo
- **FR-602** → thông báo mới của Sunner X không đến chuông của Sunner Y
- **FR-603** → thông báo không chứa nội dung Kudo hay danh tính người gửi ẩn danh

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Feature nguồn (Kudo, tim) có thể chưa báo sự việc vào hàng đợi chung khi build, nên loại thông báo tương ứng không bao giờ xuất hiện dù feature này hoàn chỉnh | Sunner không nhận thông báo Kudo mới và tim | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | Kênh realtime là best-effort: tin có thể rơi khi mạng chập chờn, chuông chỉ khớp lại ở lần nối lại hoặc khi quay lại tab | Chấm đỏ chậm tới lần đó | [EXPECTED] |
| RISK-03 | risk | Câu chữ cho Kudos Quốc Dân và cho tim gộp (số tim) chưa có trong thiết kế | Phải sửa chữ sau khi có xác nhận của thiết kế | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-04 | risk | Không có chính sách xoá, danh sách thông báo chỉ tăng theo thời gian | Trang riêng dài dần; chấp nhận được trong thời gian sự kiện | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Phiên đăng nhập, hồ sơ Sunner (tên, ảnh) hiện trong thông báo | FR-003, FR-601 |
| F002_AppShell | feature | Header chừa chỗ cho chuông; ngôn ngữ đang chọn | FR-101, FR-002 |
| F003_KudosAuthoring | feature | Báo sự việc có Kudo mới (người nhận, cờ ẩn danh) | FR-004, FR-406 |
| F004_KudosFeed | feature | Trang chi tiết Kudo là đích của thông báo Kudo mới và tim | FR-103 |
| F005_KudosHearts | feature | Báo sự việc có tim mới cho Kudo | FR-405 |
| F006_AwardsPortal | feature | Trang Tiêu chuẩn cộng đồng là đích của thông báo Kudo bị tạm ẩn | FR-103 |
| F007_AdminModeration | feature | Báo sự việc Kudo bị tạm ẩn | FR-004 |
| F009_HeroBadges | feature | Quy tắc tính cấp Hero để biết người nhận có lên cấp | FR-407 |
| F010_SecretBoxRewards | feature | Báo sự việc có Secret Box mới, đủ 6 icon, Kudos Quốc Dân; cơ chế hàng đợi sự kiện chung; màn mở hộp là đích | FR-004, FR-103 |
| F012_Profile | feature | Profile của chính mình là đích tạm của hai loại thông báo | FR-103 |
| Kênh realtime của Supabase | external-service | Đẩy tin báo có thông báo mới tới đúng Sunner | FR-402, FR-602 |

## 13. Configuration

```text
NOTIFICATION_DROPDOWN_LIMIT = 10   # số thông báo dropdown hiện mỗi lần mở [INFERRED]
NOTIFICATION_PAGE_SIZE = 20        # số thông báo trang tất cả nạp mỗi lần [INFERRED]
```
