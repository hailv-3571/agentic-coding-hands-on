---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F010_SecretBoxRewards

**Priority**: P2
**Type**: mixed
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoint, trích nguồn, pseudocode, thực thể và các lần ghi cơ sở dữ liệu cho Dev/QA/SA.

**Traceability:** F010_SecretBoxRewards → SCR007_KudosLiveBoardFeed/REG006_RewardsColumn → US044_OpenSecretBox → BL027_SecretBoxTickEndpoint, BL028_SecretBoxTickCron, BL032_NationalKudosFinalize, BL033_SecretBoxSweep, BL034_SecretBoxTick → ROUTE006, ROUTE015, ROUTE016

## 1. Overview

**Problem:** Sunner gửi Kudo cần được ghi nhận khi lời cảm ơn của mình được đồng nghiệp thả tim. Nếu việc cấp hộp, mở hộp hay phát quà không chặt, một cú bấm đúp hoặc hai tab có thể mở một hộp hai lần, cấp thừa hộp, hay phát quá số quà BTC đã chuẩn bị.
**Solution:** Cứ mỗi 5 điểm tim (đã nhân hệ số chiến dịch) mà các Kudo công khai của một người gửi nhận được, hệ thống tự cấp cho người đó một Secret Box. Người gửi mở hộp để ra một icon trong bộ 6 hoặc một quà hiện vật; gom đủ 6 icon khác nhau thì nhận một Quà bí ẩn. Song song, 5 Kudo công khai nhiều tim nhất tại mốc chốt trở thành Kudos Quốc Dân và người gửi của chúng nhận quà đặc biệt "Root Further". Cột phần thưởng của Live board hiện thống kê cá nhân, nút Mở Secret Box và 10 Sunner nhận quà mới nhất.
**Scope:** Một kết quả duy nhất, "phần thưởng cho người gửi Kudo kiếm được từ tim mà Kudo công khai của họ nhận", qua hai đường: Secret Box (cấp hộp, mở hộp, bộ sưu tập 6 icon, Quà bí ẩn, thống kê cá nhân, danh sách người nhận quà) và Kudos Quốc Dân (chốt 5 Kudo một lần). Kèm theo là các tiến trình nền chạy mỗi phút để cấp bù hộp và chốt Kudos Quốc Dân, và việc phát tín hiệu (có hộp mới, đủ 6 icon, Kudos Quốc Dân đã chốt) cho tính năng thông báo.
**Non-Scope:** Không thả hay đếm tim (do tính năng Tim làm, tính năng này chỉ đọc tổng tim). Không dựng trang Live board hay trang profile, chỉ cung cấp vùng và thành phần nhúng. Không gửi thông báo. Không quản lý chiến dịch nhân đôi tim. Không có màn Admin để sửa kho quà. Không có màn công bố Kudos Quốc Dân. Không theo dõi việc BTC giao quà hiện vật, Quà bí ẩn hay quà "Root Further" (BTC giao ngoài hệ thống).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner gửi Kudo | Sunner đã đăng nhập, có Kudo công khai được cộng đồng thả tim | Tích đủ tim để có Secret Box, mở hộp, gom đủ 6 icon |
| Sunner xem | Sunner đã đăng nhập đang xem Live board hoặc profile của đồng nghiệp | Xem ai vừa nhận quà và bộ sưu tập icon của đồng nghiệp |
| Hệ thống và BTC | Tiến trình nền chạy mỗi phút và Ban tổ chức đứng sau kho quà | Cấp hộp đúng, phát quà đúng số lượng, chốt Kudos Quốc Dân một lần |

Tính năng này chưa tham gia luồng liên tính năng nào (chưa có luồng nào được lập).

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Earn Secret Boxes from hearts | Có thêm Secret Box tự động mỗi khi tổng tim nhận được đủ thêm một mốc, không phải thao tác | — | FR-001, FR-401, FR-405, FR-407 | BR-001, BR-002, BR-006, BR-007 | — |
| CAP-02 | Open a Secret Box and win | Mở từng hộp chưa mở, thấy ngay icon hoặc quà nhận được, gom đủ 6 icon để nhận Quà bí ẩn | US044_OpenSecretBox | FR-002, FR-003, FR-004, FR-102, FR-301, FR-302, FR-303, FR-304, FR-305, FR-402, FR-403, FR-404, FR-408, FR-601, FR-602 | BR-003, BR-004, BR-005, BR-010, BR-013, DEC-002, DEC-004, DEC-005, SM-001, SM-002 | SCR007_KudosLiveBoardFeed/REG006_RewardsColumn |
| CAP-03 | Track rewards | Xem bảng thống kê cá nhân, 10 Sunner nhận quà mới nhất và bộ sưu tập 6 icon | — | FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-207, FR-208, FR-604 | BR-009, BR-011, DEC-001, DEC-003 | — |
| CAP-04 | Finalize Kudos Quốc Dân | Biết Kudo nào thành Kudos Quốc Dân; người gửi nhận thông báo và quà đặc biệt | — | FR-406 | BR-008 | — |
| CAP-05 | Run the scheduled tick | Hệ thống tự chạy mỗi phút để cấp bù hộp và chốt Kudos Quốc Dân, không ai kích hoạt được từ trình duyệt | — | FR-603 | BR-012 | — |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Quà bí ẩn khi gom đủ 6 icon chính thức là gì? | Giữ tên tạm "Quà bí ẩn từ BTC SAA 2025"; BTC giao ngoài hệ thống, ứng dụng không theo dõi việc giao | Tên đang là nội dung tạm chờ BTC xác nhận | no |
| D002 | Trọng số bốc và số lượng từng quà hiện vật là bao nhiêu? | Giữ danh mục tạm: mỗi icon trọng số 10, ba quà (áo phông SAA, lót chuột Root Further, khăn Root Further) trọng số 1 và kho 50 mỗi món | BTC chưa đưa số thật; thiết kế không phụ thuộc con số vì sửa danh mục rồi nạp lại là đổi được | yes |
| D003 | Quà đặc biệt "Root Further" của Kudos Quốc Dân được ghi nhận và giao thế nào? | Chỉ nêu trong nội dung thông báo cho người gửi và trang Thể lệ; BTC giao ngoài hệ thống, hệ thống không lưu tên quà hay việc giao | Kết quả chốt chỉ lưu Kudo, hạng và số tim | no |
| D004 | Kết quả Kudos Quốc Dân có cần hiện ở màn nào cho mọi Sunner thấy không? | Không có màn hiển thị; chỉ người gửi của 5 Kudo nhận thông báo | Hiện chưa có màn nào đọc kết quả chốt; thêm màn là việc riêng | no |
| D005 | Mốc kết thúc sự kiện (ngừng tính tim cho hộp mới) và mốc chốt Kudos Quốc Dân đặt giá trị nào ở môi trường thật? | Hai mốc đặt qua cấu hình môi trường, mốc chốt không sớm hơn mốc kết thúc | Hệ thống từ chối cấu hình mốc chốt sớm hơn mốc kết thúc; giá trị thật do BTC quyết | yes |
| D006 | Quà hiện vật chưa có ảnh sản phẩm thì hiện gì? | Quầng sáng vàng kèm tên quà | Nhật ký quyết định thiết kế ghi chưa có ảnh quà | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Cứ mỗi 5 điểm tim có trọng số mà Kudo công khai của người gửi nhận được, người gửi có thêm đúng một Secret Box; con số 5 đổi được bằng cấu hình.
- **FR-002** Mỗi Secret Box chỉ mở được đúng một lần và kết quả được lưu để xem lại hoặc phát lại.
- **FR-003** Kho phần thưởng gồm 6 icon không giới hạn và các quà hiện vật có số lượng giới hạn, nạp sẵn từ danh mục trước khi chiến dịch chạy.
- **FR-004** Trọng số và số lượng quà đổi được bằng cách sửa danh mục rồi nạp lại, không sửa mã; nạp lại giữ nguyên số quà đã phát.

### Navigation (1xx)

- **FR-101** Bảng thống kê cá nhân và danh sách người nhận quà nằm ở cột phải Live board; bảng thống kê cũng dùng lại trên profile của chính mình.
- **FR-102** Nút "Mở Secret Box" mở hộp thoại mở hộp; hộp thoại cũng mở thẳng được từ đường dẫn trong thông báo hộp quà, kể cả khi bảng thống kê lỗi.

### Rewards Column (2xx)

- **FR-201** Bảng thống kê hiện năm số: Kudos nhận được, Kudos đã gửi, tim nhận được, Secret Box đã mở, Secret Box chưa mở.
- **FR-202** Khi chiến dịch nhân đôi tim đang chạy, số tim nhận được có nhãn "x2".
- **FR-203** Nút "Mở Secret Box" mờ và có chú thích "Bạn chưa có Secret Box nào" khi không còn hộp chưa mở, nhưng vẫn focus được bằng bàn phím.
- **FR-204** Danh sách "10 SUNNER NHẬN QUÀ MỚI NHẤT" hiện avatar, tên và tên quà của từng người, cuộn được.
- **FR-205** Danh sách chỉ gồm lần mở ra quà hiện vật, không gồm icon hay Quà bí ẩn.
- **FR-206** Danh sách trống thì hiện "Chưa có Sunner nào nhận quà." thay vì vùng trắng.
- **FR-207** Bộ sưu tập icon hiện 6 vòng tròn theo thứ tự cố định, icon chưa có là vòng xám rỗng, icon có nhiều bản hiện số lượng; dùng lại được trên profile của mình và của người khác.
- **FR-208** Mỗi panel của cột phần thưởng lỗi riêng: panel lỗi hiện thông báo của chính nó kèm "Thử lại", phần còn lại của trang vẫn dùng bình thường.

### Open Box Modal (3xx)

- **FR-301** Hộp thoại mở hộp hiện tiêu đề "KHÁM PHÁ SECRET BOX CỦA BẠN", hướng dẫn "Click vào box để mở" và số hộp chưa mở; không đọc được số hộp thì báo lỗi kèm "Thử lại".
- **FR-302** Bấm vào hộp chạy hoạt ảnh mở tối thiểu 0,9 giây (không giữ khi người dùng bật giảm chuyển động) rồi hiện icon hoặc quà nhận được.
- **FR-303** Xem xong kết quả, hộp thoại về trạng thái chờ hộp kế tiếp với số hộp chưa mở giảm một; hết hộp thì báo chưa có hộp nào; đóng hộp thoại làm mới trang để thống kê thấy số mới.
- **FR-304** Khi ra icon, kết quả cho biết đó là icon nào; icon đã có thì ghi "Bạn đã có icon này rồi" và chỉ tăng số lượng.
- **FR-305** Hộp thoại đóng được bằng nút X, phím Esc hoặc bấm nền, trừ lúc đang mở hộp để không lỡ kết quả; focus được giữ trong hộp thoại và trang nền không cuộn.

### Interaction (4xx)

- **FR-401** Hộp mới được cấp tự động khi đủ mốc, không cần thao tác; số hộp cập nhật ngay khi người dùng mở bảng thống kê hoặc hộp thoại, và tiến trình nền mỗi phút cấp bù cho người gửi vừa nhận tim.
- **FR-402** Kết quả mở hộp do máy chủ quyết định; bấm đúp, mở nhiều tab hay gửi lặp cùng một yêu cầu không mở thừa hộp, và sau lỗi chưa rõ kết quả thì lần bấm sau phát lại đúng kết quả đã lưu.
- **FR-403** Quà hiện vật hết số lượng thì không phát nữa; khi tranh nhau món cuối, người thua bốc lại và cuối cùng rơi về icon.
- **FR-404** Gom đủ 6 icon khác nhau thì nhận đúng một Quà bí ẩn, và chỉ một lần.
- **FR-405** Tim thả sau mốc kết thúc sự kiện không còn tính cho hộp mới; hộp đã kiếm được trong thời gian sự kiện vẫn được cấp bù và mọi hộp đã có vẫn mở được sau mốc.
- **FR-406** Tại mốc chốt, 5 Kudo công khai nhiều tim nhất toàn Sun* trở thành Kudos Quốc Dân, chốt đúng một lần; người gửi nhận thông báo kèm quà đặc biệt "Root Further".
- **FR-407** Mỗi lần cấp hộp mới, hệ thống phát tín hiệu để tính năng thông báo báo cho người gửi.
- **FR-408** Khi một Sunner vừa đủ 6 icon, hệ thống phát tín hiệu để tính năng thông báo báo cho người đó.

### Security (6xx)

- **FR-601** Chỉ Sunner đã đăng nhập mới xem thống kê và mở hộp, và chỉ mở hộp của chính mình; danh tính lấy từ phiên đăng nhập, không bao giờ từ dữ liệu người dùng gửi lên.
- **FR-602** Trình duyệt không bao giờ quyết định kết quả; nó chỉ gửi yêu cầu mở, kết quả bốc ở máy chủ.
- **FR-603** Sunner không tự kích hoạt được việc cấp bù hay chốt Kudos Quốc Dân; chỉ bộ lập lịch của hệ thống có mã bí mật mới gọi được tiến trình nền.
- **FR-604** Danh sách người nhận quà chỉ hiện cho Sunner đã đăng nhập, kèm tên thật của người nhận.

## 5. Business Rules

- Số hộp được cấp bằng phần nguyên của tổng tim có trọng số chia 5 trừ đi số hộp đã cấp, và không bao giờ cấp trùng một mốc (BR-001)
- Hộp đã cấp không bao giờ bị thu hồi; tim bị bỏ hay Kudo bị Spam sau đó chỉ làm hộp kế tiếp đến chậm hơn (BR-002)
- Mỗi hộp chỉ mở một lần; yêu cầu mở lặp lại cùng mã yêu cầu trả đúng kết quả cũ (BR-003)
- Kết quả bốc theo trọng số trong các phần thưởng còn khả dụng; quà hết hàng bị loại, thua tranh kho thì bốc lại tối đa 3 lần rồi chỉ bốc trong nhóm icon (BR-004)
- Gom đủ 6 icon khác nhau thì nhận một Quà bí ẩn đúng một lần; icon trùng chỉ cộng dồn số lượng (BR-005)
- Hộp chỉ tính tim thả đến mốc kết thúc sự kiện, nhưng hộp đã kiếm được trong thời gian đó vẫn được cấp bù muộn, và việc mở hộp không bị khoá theo thời gian (BR-006)
- Kudo ẩn danh vẫn được tính tim, hộp và Kudos Quốc Dân cho người gửi thật; danh tính chỉ ẩn khi hiển thị (BR-007)
- Kudos Quốc Dân là 5 Kudo công khai nhiều tim thô nhất tính đến mốc chốt, hoà thì Kudo cũ hơn đứng trước, mỗi Kudo cần ít nhất một tim, chốt đúng một lần (BR-008)
- Danh sách nhận quà lấy 10 lần mở hộp ra quà hiện vật gần nhất, mới nhất ở trên; một người có thể xuất hiện nhiều lần (BR-009)
- Mở hộp luôn lấy hộp có số thứ tự thấp nhất còn chưa mở; người dùng không chọn hộp (BR-010)
- Số Kudo nhận và gửi trên bảng thống kê chỉ tính Kudo đang công khai; Kudo gửi ẩn danh vẫn tính cho người gửi (BR-011)
- Mỗi phút một lần: quét người gửi có tim trong 10 phút gần nhất, tối đa 500 người đến hạn mỗi lần, một lần chạy tại một thời điểm, và mỗi tiến trình lỗi riêng (BR-012)
- Nạp lại danh mục giải giữ số quà đã phát; giải bị bỏ khỏi danh mục chỉ bị tắt chứ không xoá (BR-013)
- Nút Mở Secret Box bấm được khi còn hộp chưa mở, mờ kèm chú thích khi hết hộp, và không hiện khi không đọc được thống kê (DEC-001)
- Kết quả mở hộp hiện theo loại giải: quà hoặc đủ bộ thì có tiêu đề chúc mừng, icon trùng thì kèm "Bạn đã có icon này rồi", icon mới thì chỉ hiện icon (DEC-002)
- Panel người nhận quà hiện các dòng khi có người nhận, thông báo trống khi chưa ai nhận, và lỗi riêng kèm "Thử lại" khi không đọc được (DEC-003)
- Sau mỗi lần bấm mở, giao diện xử lý theo phản hồi: hết hộp, lỗi, hay chưa rõ kết quả thì giữ mã yêu cầu để lần bấm sau phát lại (DEC-004)
- Hộp thoại mở khi bấm nút hoặc theo đường dẫn thông báo, không đóng được lúc đang mở hộp, và đóng xong thì làm mới trang (DEC-005)
- Một Secret Box chỉ có hai trạng thái, chưa mở và đã mở, chuyển một chiều khi mở (SM-001)
- Hộp thoại mở hộp đi từ đang tải, sang chờ mở, đang mở, kết quả; hết hộp và không tải được là hai trạng thái phụ (SM-002)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Cột phần thưởng của Live board (vùng nhúng bên phải feed trên trang Live board) | SCR007_KudosLiveBoardFeed/REG006_RewardsColumn | Bảng thống kê cá nhân (năm số, nhãn "x2", nút Mở Secret Box), danh sách "10 SUNNER NHẬN QUÀ MỚI NHẤT"; khi bấm nút thì hộp thoại "KHÁM PHÁ SECRET BOX CỦA BẠN" với hộp quà, số hộp chưa mở và kết quả chúc mừng | Bấm Mở Secret Box, bấm hộp để mở và xem icon hoặc quà, mở hộp kế tiếp, đóng hộp thoại, cuộn danh sách, bấm Thử lại khi một panel lỗi |

Hộp thoại mở hộp không phải một màn riêng mà nằm trong vùng này. Bảng thống kê cá nhân và bộ sưu tập icon cũng được dùng lại trên profile của chính mình và của đồng nghiệp; màn profile do tính năng Profile sở hữu.

### User Journey

1. Sunner gửi Kudo và đồng nghiệp thả tim; khi tổng tim có trọng số đủ mốc 5, "Số Secret Box chưa mở" ở Cột phần thưởng của Live board tăng ngay khi Sunner mở trang hoặc mở hộp thoại, và một thông báo "có hộp mới" được gửi tới.
2. Sunner bấm "Mở Secret Box" ở bảng thống kê, hoặc bấm dòng thông báo hộp quà để vào thẳng hộp thoại.
3. Hộp thoại "KHÁM PHÁ SECRET BOX CỦA BẠN" hiện số hộp chưa mở; Sunner bấm vào hộp, hộp lắc tối thiểu 0,9 giây.
4. Kết quả hiện ra: icon (kèm "Bạn đã có icon này rồi" nếu trùng), hoặc quà hiện vật với tiêu đề chúc mừng; icon thứ sáu khác loại thì hiện thêm tên Quà bí ẩn.
5. Sunner mở tiếp hộp khác hoặc đóng hộp thoại; đóng thì trang làm mới và bảng thống kê thấy số hộp đã mở và chưa mở mới.
6. Sunner khác thấy tên và avatar của người vừa trúng quà hiện vật trong "10 SUNNER NHẬN QUÀ MỚI NHẤT"; bộ sưu tập icon ở profile sáng thêm một vòng.

## 7. User Stories

### US044_OpenSecretBox — Open Secret Box

**Actor:** Sunner gửi Kudo
**Goal:** Mở Secret Box đã kiếm được từ tim để nhận icon hoặc quà từ BTC và tiến dần tới trọn bộ 6 icon.
**Business value:** Đây là khoảnh khắc thưởng của cả cơ chế game hoá, nên phải công bằng, không mở thừa hộp và không gian lận được từ trình duyệt.

Câu chuyện này gồm cả các thao tác phụ cùng vùng và cùng nguồn dữ liệu: nút mở hộp thoại, đóng hộp thoại, tải lại khi lỗi và thông báo thử lại của các panel.

**Acceptance Criteria:**
- [ ] Nút "Mở Secret Box" có ở cột phần thưởng của Live board và ở bảng thống kê trên profile của mình; bấm mở hộp thoại "KHÁM PHÁ SECRET BOX CỦA BẠN" và nạp số hộp chưa mở; đường dẫn từ thông báo hộp quà mở hộp thoại ngay, kể cả khi bảng thống kê lỗi.
- [ ] Hết hộp thì nút mờ nhưng vẫn focus được; chú thích "Bạn chưa có Secret Box nào" hiện khi rê chuột, focus bàn phím hoặc chạm.
- [ ] Bấm vào hộp mở hộp có số thứ tự thấp nhất của mình, hiện khung đang mở tối thiểu 0,9 giây (không giữ khi bật giảm chuyển động), rồi hiện icon hoặc quà vừa nhận cùng số hộp còn lại.
- [ ] Icon đã có thì hiện "Bạn đã có icon này rồi"; mở trúng icon cuối của bộ 6 thì tiêu đề thành "Chúc mừng bạn đã nhận được phần quà từ BTC SAA 2025" và hiện tên Quà bí ẩn.
- [ ] Khi một lần mở chưa rõ kết quả (lỗi mạng, quá 15 giây, lỗi máy chủ, phiên hết hạn), lần bấm sau gửi lại đúng mã yêu cầu cũ nên hệ thống trả kết quả đã lưu, không mở thêm hộp; mỗi lần bấm bình thường dùng mã mới.
- [ ] Hết hộp hiện "Bạn chưa có Secret Box nào để mở"; lỗi khác hiện "Không thể mở hộp, vui lòng thử lại"; phiên hết hạn hiện "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại".
- [ ] Đóng hộp thoại bằng X, Esc hoặc bấm nền (không đóng được lúc đang mở hộp) thì trang làm mới để thống kê thấy số mới và tham số đường dẫn được gỡ; mở hộp vẫn được sau mốc kết thúc sự kiện.
- [ ] Không đọc được số hộp thì hộp thoại hiện "Không tải được số Secret Box. Vui lòng thử lại." kèm "Thử lại"; bảng thống kê lỗi hiện "Không tải được thống kê. Vui lòng thử lại." kèm "Thử lại" làm mới cột.

## 8. Scenarios

### US044_OpenSecretBox — Happy Path

**Given** Sunner còn 2 hộp chưa mở, **When** bấm vào hộp trong hộp thoại, **Then** hộp lắc, hộp thoại hiện icon hoặc quà vừa nhận, "Secretbox chưa mở" còn 01, và khi đóng hộp thoại bảng thống kê thấy số mới.

### US044_OpenSecretBox — Error: Không còn hộp

**Given** Sunner mở hộp thoại ở tab cũ trong khi hộp cuối đã được mở ở tab khác, **When** bấm vào hộp, **Then** hiện "Bạn chưa có Secret Box nào để mở" và số hộp về 0.

### US044_OpenSecretBox — Error: Mất kết nối

**Given** Sunner bấm mở hộp và mạng bị ngắt, **When** yêu cầu không tới được máy chủ hoặc quá 15 giây, **Then** hiện "Không thể mở hộp, vui lòng thử lại"; bấm lại gửi cùng mã yêu cầu nên hộp không mất và không mở hai hộp.

### US044_OpenSecretBox — Error: Phiên hết hạn

**Given** phiên đăng nhập đã hết hạn khi Sunner bấm mở hộp, **When** máy chủ từ chối, **Then** hiện "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" và hộp vẫn chưa mở.

### US044_OpenSecretBox — Error: Không tải được thống kê

**Given** dữ liệu thống kê tạm thời không đọc được, **When** Live board hiển thị, **Then** panel thống kê hiện "Không tải được thống kê. Vui lòng thử lại." kèm "Thử lại", phần còn lại của trang dùng bình thường và đường dẫn thông báo hộp quà vẫn mở được hộp thoại.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Hai tab cùng bấm mở khi chỉ còn 1 hộp | Một yêu cầu mở được hộp, yêu cầu kia thấy hết hộp | "Bạn chưa có Secret Box nào để mở" |
| Bấm đúp vào hộp | Chỉ một hộp được mở; lần bấm sau trong lúc đang mở bị bỏ qua, hộp bị khoá | Không có — xử lý im lặng |
| Hai người cùng mở khi chỉ còn 1 áo phông | Chỉ một người nhận áo, người kia bốc lại và ra giải khác | Không có — xử lý im lặng |
| Quà hiện vật hết hàng hoàn toàn | Mọi hộp sau đó ra icon | Không có — xử lý im lặng |
| Hộp ra icon đã có (icon trùng, bộ chưa đủ) | Cộng số lượng icon, bộ sưu tập không đổi | "Bạn đã có icon này rồi" |
| Hộp ra icon thứ sáu khác loại | Trao Quà bí ẩn một lần, hộp thoại đổi tiêu đề chúc mừng | "Chúc mừng bạn đã nhận được phần quà từ BTC SAA 2025" |
| Mất kết nối, quá 15 giây, hoặc máy chủ lỗi lúc mở | Kết quả có thể đã được lưu; lần bấm sau phát lại đúng kết quả đã lưu | "Không thể mở hộp, vui lòng thử lại" |
| Phiên đăng nhập hết hạn lúc mở hộp | Từ chối, hộp chưa mở, lần bấm sau dùng lại mã yêu cầu cũ | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" |
| Không đọc được số hộp khi mở hộp thoại | Hộp thoại hiện trạng thái lỗi kèm nút thử lại | "Không tải được số Secret Box. Vui lòng thử lại." |
| Không đọc được thống kê | Chỉ panel thống kê lỗi, nút Mở Secret Box không hiện nhưng đường dẫn thông báo vẫn mở được hộp thoại | "Không tải được thống kê. Vui lòng thử lại." |
| Không đọc được danh sách người nhận quà | Chỉ panel danh sách lỗi, panel thống kê vẫn hiển thị | "Không tải được danh sách nhận quà. Vui lòng thử lại." |
| Chưa ai nhận quà hiện vật | Panel danh sách hiện trạng thái trống | "Chưa có Sunner nào nhận quà." |
| Chưa có hộp chưa mở | Nút Mở Secret Box mờ, rê chuột hoặc focus thì hiện chú thích | "Bạn chưa có Secret Box nào" |
| Tim bị bỏ làm tổng tụt dưới mốc đã cấp hộp | Hộp đã cấp giữ nguyên, không cấp thêm cho tới khi vượt mốc mới | Không có — xử lý im lặng |
| Sau mốc kết thúc sự kiện | Tim thả sau mốc không tính; hộp đã kiếm trong thời gian sự kiện vẫn được cấp bù; mọi hộp đã có vẫn mở được | Không có — xử lý im lặng |
| Khách chưa đăng nhập vào Live board | Được chuyển về trang đăng nhập trước khi hiện thống kê hay tên người nhận quà | Không có — chuyển trang |
| Tiến trình nền mỗi phút bị lỡ hoặc chạy chồng | Lần chạy chồng bị bỏ qua; lần lỡ chỉ làm thông báo hộp mới đến trễ vì hộp vẫn được cấp khi người dùng mở trang | Không có — xử lý im lặng |
| Có ít hơn 5 Kudo công khai có tim lúc chốt Kudos Quốc Dân | Chốt bấy nhiêu Kudo có; chưa Kudo nào có tim thì chưa ghi gì và lần chạy sau kiểm lại | Không có — xử lý im lặng |
| Kudo ẩn danh nằm trong 5 Kudo nhiều tim nhất | Vẫn được xếp hạng; người gửi thật nhận thông báo, danh tính không hiện cho ai khác | Không có — xử lý im lặng |

## 10. Edge Behaviours to Verify

- **FR-001** → 4, 5, 9, 10, 12 điểm tim có trọng số lần lượt cho 0, 1, 1, 2, 2 hộp; chạy cấp hộp nhiều lần hay song song không đổi số hộp.
- **FR-002** → Hộp đã mở không mở lại được; bấm lại cùng mã yêu cầu thấy đúng kết quả cũ và số hộp chưa mở không đổi.
- **FR-004** → Nạp lại danh mục giữ số quà đã phát, và một giải bị bỏ khỏi danh mục bị tắt chứ không xoá.
- **FR-101** → Cột phần thưởng hiện ở Live board và bảng thống kê hiện ở profile của chính mình nhưng không hiện ở profile người khác.
- **FR-203** → Hết hộp thì nút mờ, vẫn focus được, chú thích hiện khi rê chuột, focus bàn phím và chạm.
- **FR-205** → Danh sách nhận quà tối đa 10 dòng, mới nhất trước, không có dòng nào ứng với icon hay Quà bí ẩn.
- **FR-208** → Một panel lỗi chỉ làm panel đó hiện lỗi, bấm "Thử lại" nạp lại cột.
- **FR-302** → Khung đang mở hiện tối thiểu 0,9 giây khi có chuyển động và không bị giữ khi bật giảm chuyển động.
- **FR-305** → Không đóng được hộp thoại bằng X, Esc hay bấm nền lúc đang mở hộp.
- **FR-402** → Hai tab, hoặc bấm đúp, không mở nhiều hơn số hộp đang có; sau lỗi chưa rõ kết quả, bấm lại không mở thêm hộp.
- **FR-403** → Khi chỉ còn một món quà hữu hạn, nhiều người mở cùng lúc thì chỉ một người nhận.
- **FR-404** → Đủ 6 icon khác nhau tạo đúng một Quà bí ẩn; mở thêm hộp sau đó không tạo thêm.
- **FR-405** → Tim thả sau mốc kết thúc không tính, hộp kiếm được trong thời gian sự kiện vẫn được cấp bù, hộp cũ vẫn mở được.
- **FR-406** → Chạy việc chốt nhiều lần, kể cả song song, cho đúng một bộ 5 Kudo; hoà thì Kudo cũ hơn đứng trước; Kudo bị Spam và tim thả muộn không được tính.
- **FR-601** → Người chưa đăng nhập không xem được thống kê, không mở được hộp; không mở được hộp của người khác.
- **FR-602** → Sửa yêu cầu từ trình duyệt không đổi được kết quả bốc.
- **FR-603** → Tiến trình nền từ chối khi chưa cấu hình mã bí mật hoặc mã sai, và bỏ qua lần chạy khi lần trước chưa xong.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Danh mục giải (trọng số, số lượng quà) và tên Quà bí ẩn còn là số liệu tạm, BTC chưa đưa số thật | Chạy thật với số tạm thì tỉ lệ ra quà và kho không phản ánh ý BTC; quyết định ở D001 và D002 | confirmed |
| RISK-02 | known-issue | Quà đặc biệt "Root Further" của Kudos Quốc Dân chỉ được nêu trong chữ của thông báo và trang Thể lệ; kết quả chốt không lưu tên quà hay việc giao, và chưa có màn nào đọc kết quả chốt | Không kiểm được từ hệ thống ai đã nhận quà; Sunner khác không thấy Kudos Quốc Dân ở đâu | [INFERRED] |
| RISK-03 | risk | Kudos Quốc Dân chỉ được chốt bởi tiến trình nền mỗi phút, không có đường nào khác; nếu bộ lập lịch không được cấu hình ở môi trường thật (hoặc thiếu lịch của máy chủ) thì không bao giờ được chốt, còn thông báo hộp mới đến trễ tới lần người dùng ghé lại | Mất kết quả Kudos Quốc Dân và thông báo, dù hộp vẫn được cấp khi người dùng mở trang; việc có cấu hình lịch ở môi trường thật chưa kiểm được | [UNVERIFIED] |
| RISK-04 | risk | Quà hiện vật hữu hạn có thể hết sớm khi nhiều người mở hộp ngay đầu chiến dịch; khi hết, mọi hộp ra icon | Người đến sau chỉ nhận icon | [EXPECTED] |
| RISK-05 | risk | Hộp đã cấp không thu hồi: tim có thể bị bỏ hoặc Kudo bị Spam sau khi hộp đã cấp | Số hộp đã cấp có thể cao hơn số tim còn lại | [EXPECTED] |
| RISK-06 | known-issue | Khi kho không còn icon không giới hạn đang bật, mọi lần mở hộp báo lỗi chung "Không thể mở hộp, vui lòng thử lại" và hộp không mất | Người dùng không mở được hộp cho tới khi nạp lại danh mục giải | confirmed |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Biết Sunner nào đang thao tác và lấy tên, avatar cho danh sách người nhận quà | FR-601, FR-204 |
| F003_KudosAuthoring | feature | Cung cấp Kudo, người gửi, người nhận, trạng thái công khai và cờ ẩn danh cho thống kê và Kudos Quốc Dân | FR-201, BR-007, BR-011 |
| F004_KudosFeed | feature | Sở hữu trang Live board chứa vùng cột phần thưởng và cung cấp tập Kudo công khai dùng để xếp hạng | FR-101, FR-406 |
| F005_KudosHearts | feature | Cung cấp tổng tim có trọng số, nhãn "x2" và truy vấn xếp hạng theo tim thô | FR-001, FR-202, BR-001, BR-008 |
| F007_AdminModeration | feature | Trạng thái Spam của Kudo quyết định Kudo còn được tính tim và Kudos Quốc Dân hay không | BR-002, BR-008 |
| F011_AdminCampaigns | feature | Chiến dịch nhân đôi tim ảnh hưởng gián tiếp qua hệ số tim (không bắt buộc) | FR-202 |
| F012_Profile | feature | Nhúng bảng thống kê cá nhân và bộ sưu tập icon vào profile; màn profile do tính năng đó sở hữu | FR-101, FR-207 |
| F013_Notifications | feature | Nhận tín hiệu có hộp mới, đủ 6 icon, Kudos Quốc Dân để gửi thông báo, và dẫn người dùng vào hộp thoại mở hộp | FR-102, FR-407, FR-408 |
| Danh mục phần thưởng do BTC cung cấp | data | Danh sách quà, số lượng, trọng số và tên Quà bí ẩn | FR-003, D001, D002 |
| Bộ lập lịch chạy nền mỗi phút | infrastructure | Lịch của cơ sở dữ liệu hoặc lịch của máy chủ gọi tiến trình nền để cấp bù hộp và chốt Kudos Quốc Dân | FR-401, FR-603, RISK-03 |
| Mốc kết thúc sự kiện, mốc chốt, mã bí mật tiến trình nền | config | Quyết định lúc ngừng tính tim, lúc chốt Kudos Quốc Dân và việc tiến trình nền có chạy được không | FR-405, FR-406, D005 |

## 13. Configuration

```text
SECRET_BOX_HEARTS_PER_BOX = 5          # số điểm tim có trọng số đổi một Secret Box (mặc định)
ICON_SET_SIZE = 6                      # số icon khác nhau cần gom để nhận Quà bí ẩn (cố định theo bộ icon)
LATEST_WINNERS_LIMIT = 10              # số dòng của danh sách nhận quà mới nhất
NATIONAL_KUDOS_COUNT = 5               # số Kudo thành Kudos Quốc Dân
EVENT_END_AT = <đặt theo môi trường>   # sau mốc này tim thả không còn tính cho hộp mới; hộp đã có vẫn mở được
NATIONAL_KUDOS_FINALIZE_AT = <đặt theo môi trường, không sớm hơn mốc trên>   # mốc chốt Kudos Quốc Dân
MYSTERY_GIFT_NAME = "Quà bí ẩn từ BTC SAA 2025"   # tên tạm của Quà bí ẩn, chờ BTC xác nhận
PRIZE_CATALOG_ICONS = 6 icon, trọng số 10 mỗi icon, không giới hạn số lượng   # số liệu tạm, chờ BTC
PRIZE_CATALOG_GIFTS = áo phông SAA, lót chuột Root Further, khăn Root Further; trọng số 1 và kho 50 mỗi món   # số liệu tạm, chờ BTC
```
