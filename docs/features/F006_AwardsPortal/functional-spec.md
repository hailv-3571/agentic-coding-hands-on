# Functional Spec — F006_AwardsPortal

**Priority**: P1
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — handler dự kiến, quy tắc kỹ thuật, cấu hình kỹ thuật cho Dev/QA/SA.

**Traceability:** F006_AwardsPortal → TBD (draft)

## 1. Overview

**Problem:** Sunner cần một chỗ biết lễ trao giải SAA 2025 diễn ra khi nào, ở đâu, có những giải nào, trị giá bao nhiêu và luật chơi ra sao. Trước giờ mở hệ thống, người dùng cũng cần một màn hình đếm ngược thay vì các trang chưa sẵn sàng.
**Solution:** Một cổng thông tin gồm năm trang: Countdown (trước giờ mở), Homepage (hero, đếm ngược tới lễ, thông tin sự kiện, bài chủ đề, lưới 6 giải, banner Sun* Kudos), Hệ thống giải (6 hạng mục với số lượng và giá trị), Thể lệ và Tiêu chuẩn cộng đồng. Nội dung gần như hoàn toàn tĩnh, có hai ngôn ngữ.
**Scope:** Quyết định "trước hay sau giờ mở" và màn Countdown; năm trang nội dung kể trên; việc hiển thị (chỉ hiển thị) nội dung Thể lệ.
**Non-Scope:** Đăng nhập, phiên, danh sách trang công khai (F001_Auth). Header, footer, đổi ngôn ngữ, trang 404/403 (F002_AppShell). Luật tính tim, Secret Box, huy hiệu Hero và Kudos Quốc Dân (F005_KudosHearts, F009_HeroBadges, F010_SecretBoxRewards): F006 chỉ hiện chữ mô tả các luật đó. Trang quản trị cấu hình. Ứng dụng native.

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên Sun* đã đăng nhập | Xem thông tin lễ trao giải, các giải, thể lệ, tiêu chuẩn cộng đồng |
| Khách chưa đăng nhập | Người chưa có phiên | Xem màn đếm ngược trước giờ mở; trang khác dẫn tới Login (D001 đã chốt: Countdown công khai) |
| Admin | Sunner có thêm quyền quản trị | Xem cổng như Sunner; vào được mọi trang trước giờ mở nhưng chưa ghi được Kudo hay tim tới giờ mở (D003 đã chốt, decision-log 2026-11-22) |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Prelaunch Gate and Countdown | Trước giờ mở chỉ thấy màn đếm ngược Ngày/Giờ/Phút tới giờ mở; tới giờ thì tự vào Homepage | US001_SeeCountdownBeforeLaunch | FR-002, FR-201, FR-202, FR-203, FR-401, FR-601, FR-602 | BR-001, BR-002, DEC-001, DEC-002 | TBD (draft) — SCR011_CountdownPrelaunch |
| CAP-02 | Event Homepage | Xem hero, đếm ngược tới lễ, thời gian – địa điểm, bài chủ đề, 6 giải tóm tắt, banner Sun* Kudos và đi tiếp tới các trang chi tiết | US002_ViewHomepage | FR-101, FR-102, FR-103, FR-104, FR-211, FR-212, FR-213, FR-214, FR-215, FR-216 | — | TBD (draft) — SCR012_Homepage |
| CAP-03 | Award Categories Browsing | Xem 6 hạng mục giải với mô tả, số lượng, giá trị; nhảy tới từng giải bằng menu neo | US003_BrowseAwardCategories | FR-301, FR-302, FR-303, FR-304, FR-305, FR-306 | BR-003 | TBD (draft) — SCR009_AwardsSystem |
| CAP-04 | Static Information Pages | Đọc Thể lệ và Tiêu chuẩn cộng đồng (kèm Tiêu chuẩn bảo mật) bằng tiếng Việt hoặc Anh | US004_ReadRules, US005_ReadCommunityStandards | FR-001, FR-311, FR-312, FR-321, FR-402, FR-603 | — | TBD (draft) — SCR013_Rules, SCR010_CommunityStandards |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Khách chưa đăng nhập có được xem màn Countdown không? (F001_Auth D001 đã hỏi, F006 nêu mặc định) | Countdown công khai; F006 giữ logic "trước giờ mở", F001 chỉ giữ danh sách trang công khai | Báo cáo thiết kế ghi khách "chỉ thấy đăng nhập / đếm ngược" | no |
| D002 | Trước giờ mở, người dùng thường được xem những trang nào? | Chỉ Login, Countdown và trang Hệ thống giải (chữ tĩnh, màn Countdown có liên kết tới đây); mọi trang khác chuyển về Countdown | Thiết kế Countdown có liên kết tới giải; chặn phần còn lại để chưa ai gửi Kudos trước giờ | no |
| D003 | Admin có được vượt cổng trước giờ mở để chuẩn bị nội dung không? | Có, Admin vượt cổng | BTC cần kiểm tra hệ thống trước ngày mở | no |
| D004 | Giờ mở hệ thống (LAUNCH_AT) là mấy giờ ngày nào? | [NEEDS_DOMAIN_CONFIRMATION] Cấu hình bằng biến môi trường, chưa có giá trị mặc định | Thiết kế chỉ ghi lễ 26/12/2025, không ghi giờ mở | yes |
| D005 | Mốc đếm ngược ở Homepage là gì, và sau mốc đó thì hiện gì? Ngày lễ 26/12/2025 đã qua so với ngày soạn spec (08/11/2026) | Mốc là giờ bắt đầu lễ (EVENT_AT, cấu hình được); sau mốc hiện 00:00:00 và ẩn nhãn "Coming soon" | Cấu hình được nên đổi ngày không cần sửa code | no |
| D006 | Nhãn trên thiết kế viết "Comming soon" (sai chính tả): giữ nguyên hay sửa? | Sửa thành "Coming soon" (tiếng Anh) và "Sắp diễn ra" (tiếng Việt) | Lỗi chính tả trên thiết kế, không phải chủ ý | no |
| D007 | Nội dung đầy đủ của Thể lệ và Tiêu chuẩn cộng đồng (kể cả Tiêu chuẩn bảo mật) lấy từ đâu? | [NEEDS_DOMAIN_CONFIRMATION] BTC cung cấp bản chữ cuối; lượt soạn này chỉ nắm được các điểm chính của Thể lệ | Không tự bịa nội dung luật | yes |
| D008 | "Tường thuật trực tiếp qua sóng Livestream" chỉ là dòng chữ hay có liên kết xem? | Chỉ là dòng chữ | Chưa có địa chỉ livestream | no |
| D009 | Menu neo bên trái của trang Hệ thống giải hiển thị thế nào trên màn hình nhỏ? | Thanh chip nằm ngang ở đầu trang, cuộn được | Thiết kế chỉ có bản desktop | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Mọi chữ trên năm trang có đủ bản tiếng Việt và tiếng Anh, theo ngôn ngữ đang chọn ở khung chung.
- **FR-002** Giờ mở hệ thống và giờ bắt đầu lễ cấu hình được, không phải sửa code; mọi so sánh dùng giờ máy chủ theo múi giờ Việt Nam.

### Navigation (1xx)

- **FR-101** Sau giờ mở, địa chỉ gốc của hệ thống là Homepage.
- **FR-102** Mỗi thẻ giải ở Homepage có "Chi tiết" dẫn tới đúng hạng mục trên trang Hệ thống giải.
- **FR-103** Homepage có hai nút: "ABOUT AWARDS" (nút chính) dẫn tới trang Hệ thống giải, "ABOUT KUDOS" dẫn tới Live board Kudos.
- **FR-104** Nút "Chi tiết" của banner Sun* Kudos ở Homepage dẫn tới Sun* Kudos.

### Countdown (2xx)

- **FR-201** Trước giờ mở, màn Countdown hiện đếm ngược DAYS, HOURS, MINUTES tới giờ mở và liên kết tới thông tin giải.
- **FR-202** Số đếm ngược tự cập nhật mỗi phút, không cần tải lại trang.
- **FR-203** Khi đếm về 0, người dùng được đưa tới Homepage mà không phải tự tải lại.

### Homepage (2xx)

- **FR-211** Homepage có phần hero với hình "ROOT FURTHER".
- **FR-212** Homepage hiện nhãn sắp diễn ra và đếm ngược DAYS, HOURS, MINUTES tới giờ bắt đầu lễ.
- **FR-213** Homepage hiện thời gian (26/12/2025), địa điểm (Âu Cơ Art Center) và dòng tường thuật trực tiếp qua Livestream.
- **FR-214** Homepage có bài giới thiệu chủ đề "Root Further" kèm câu "A tree with deep roots fears no storm".
- **FR-215** Homepage có mục "Hệ thống giải thưởng" gồm 6 thẻ giải, mỗi thẻ có tên, mô tả ngắn và "Chi tiết".
- **FR-216** Homepage có banner "Phong trào ghi nhận – Sun* Kudos – ĐIỂM MỚI CỦA SAA 2025" kèm nút "Chi tiết".

### Awards System (3xx)

- **FR-301** Trang Hệ thống giải có phần hero và tiêu đề "Hệ thống giải thưởng SAA 2025".
- **FR-302** Menu neo bên trái liệt kê 6 giải, đứng yên khi cuộn; bấm một mục thì cuộn tới giải đó, mục của giải đang xem được đánh dấu.
- **FR-303** Mỗi giải có ảnh, tên, mô tả, "Số lượng giải thưởng" và "Giá trị giải thưởng".
- **FR-304** Giải Signature 2025 – Creator hiện hai mức giá trị: cá nhân và tập thể.
- **FR-305** Số lượng và giá trị của 6 giải đúng bảng nội dung ghi ở mục UI Elements của màn Hệ thống giải.
- **FR-306** Cuối trang có banner Sun* Kudos.

### Rules (3xx)

- **FR-311** Trang Thể lệ hiện nội dung tĩnh: bốn bậc huy hiệu Hero, luật Secret Box và Kudos Quốc Dân.
- **FR-312** Trang Thể lệ chỉ hiển thị; không tính toán và không đọc dữ liệu của người dùng.

### Community Standards (3xx)

- **FR-321** Trang Tiêu chuẩn cộng đồng hiện nội dung tĩnh, trong đó có mục "Tiêu chuẩn bảo mật".

### Interaction (4xx)

- **FR-401** Đếm ngược tính theo giờ máy chủ, không theo đồng hồ máy người dùng.
- **FR-402** Năm trang dùng được trên desktop và màn hình nhỏ; bố cục tablet theo quyết định chung về tablet.

### Security (6xx)

- **FR-601** Trước giờ mở, người dùng thường vào trang nào ngoài danh sách cho phép (D002) cũng bị đưa tới Countdown.
- **FR-602** Mọi trang của feature đều cần phiên đăng nhập, trừ Countdown (nếu D001 xác nhận công khai); chưa có phiên thì F001_Auth xử lý.
- **FR-603** Các trang tĩnh không nhận chữ người dùng nhập và không hiện thông tin cá nhân của ai.

## 5. Business Rules

- Số còn lại = mốc − giờ máy chủ, đổi thành ngày, giờ, phút (làm tròn xuống), không bao giờ hiện số âm; về 0 thì hiện 00 (BR-001)
- "Trước giờ mở" chỉ suy ra từ giờ máy chủ so với giờ mở, không lưu cờ riêng ở đâu cả (BR-002)
- Thông tin 6 giải (tên, mô tả, số lượng, giá trị) chỉ có một nguồn; Homepage và trang Hệ thống giải cùng đọc nguồn đó (BR-003)
- Trước giờ mở, địa chỉ gốc và các trang ngoài danh sách cho phép đưa người dùng tới Countdown; sau giờ mở, địa chỉ gốc là Homepage (DEC-001)
- Đếm ngược về 0 thì màn Countdown tự đưa sang Homepage, còn đếm ngược ở Homepage dừng ở 00:00:00 (DEC-002)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Countdown Prelaunch | TBD (draft) — SCR011_CountdownPrelaunch | Ba ô đếm ngược Ngày/Giờ/Phút và liên kết tới thông tin giải | Xem thời gian còn lại, mở trang Hệ thống giải |
| Homepage | TBD (draft) — SCR012_Homepage | Hero, đếm ngược, thông tin sự kiện, bài chủ đề, 6 thẻ giải, banner Kudos | Mở trang giải, mở Sun* Kudos |
| Awards System | TBD (draft) — SCR009_AwardsSystem | Hero, menu neo 6 giải, từng giải với số lượng và giá trị, banner Kudos | Cuộn hoặc bấm menu để tới từng giải |
| Rules | TBD (draft) — SCR013_Rules | Thể lệ: bậc huy hiệu, Secret Box, Kudos Quốc Dân | Đọc |
| Community Standards | TBD (draft) — SCR010_CommunityStandards | Tiêu chuẩn cộng đồng và Tiêu chuẩn bảo mật | Đọc |

### User Journey

1. Trước giờ mở, Sunner đăng nhập xong và thấy Countdown với số ngày, giờ, phút còn lại.
2. Tới giờ mở, trang tự chuyển sang Homepage mà Sunner không cần làm gì.
3. Sunner kéo xuống đọc bài chủ đề, rồi bấm "Chi tiết" ở thẻ Top Talent.
4. Sunner tới trang Hệ thống giải, đúng mục Top Talent, thấy 10 giải cá nhân, mỗi giải 7.000.000 VNĐ.
5. Sunner cuộn xuống cuối, thấy banner Sun* Kudos và bấm "Chi tiết" để sang Kudos.
6. Sunner mở trang Thể lệ để xem luật huy hiệu và Secret Box.

## 7. User Stories

### US001_SeeCountdownBeforeLaunch — See countdown before launch

**Actor:** Sunner, Khách chưa đăng nhập
**Goal:** Biết hệ thống còn bao lâu nữa mở khi vào trước giờ mở.
**Business value:** Tạo chờ đợi cho sự kiện và tránh người dùng gặp trang chưa sẵn sàng.

**Acceptance Criteria:**
- [ ] Trước giờ mở, vào địa chỉ gốc thì thấy Countdown với DAYS, HOURS, MINUTES.
- [ ] Số đếm tự giảm theo phút, không cần tải lại.
- [ ] Về 0 thì tự sang Homepage.

### US002_ViewHomepage — View homepage

**Actor:** Sunner
**Goal:** Nắm thông tin chính về SAA 2025 và đi tiếp tới giải thưởng hoặc Kudos.
**Business value:** Mọi người hiểu chủ đề và thời gian lễ, tăng lượt vào trang giải và Kudos.

**Acceptance Criteria:**
- [ ] Thấy hero, đếm ngược, thời gian, địa điểm, livestream.
- [ ] Thấy bài chủ đề và 6 thẻ giải.
- [ ] Bấm "Chi tiết" ở một thẻ giải thì tới đúng giải đó ở trang Hệ thống giải.
- [ ] Bấm nút ở banner Kudos thì tới Sun* Kudos.

### US003_BrowseAwardCategories — Browse award categories

**Actor:** Sunner
**Goal:** Xem từng hạng mục giải: số lượng và giá trị.
**Business value:** Sunner biết rõ giải thưởng để có động lực gửi và nhận ghi nhận.

**Acceptance Criteria:**
- [ ] Thấy đủ 6 giải, mỗi giải có ảnh, tên, mô tả, số lượng, giá trị.
- [ ] Bấm menu neo thì cuộn tới giải; mục đang xem được đánh dấu.
- [ ] Signature 2025 – Creator hiện cả mức cá nhân và tập thể.

### US004_ReadRules — Read rules

**Actor:** Sunner
**Goal:** Đọc thể lệ để hiểu huy hiệu, Secret Box và Kudos Quốc Dân.
**Business value:** Người dùng hiểu luật chơi, bớt câu hỏi gửi BTC.

**Acceptance Criteria:**
- [ ] Thấy bốn bậc huy hiệu Hero và số Kudos tương ứng.
- [ ] Thấy luật Secret Box và Kudos Quốc Dân.

### US005_ReadCommunityStandards — Read community standards

**Actor:** Sunner
**Goal:** Đọc tiêu chuẩn cộng đồng, gồm Tiêu chuẩn bảo mật.
**Business value:** Giữ nội dung ghi nhận lành mạnh và nhắc người dùng về an toàn thông tin.

**Acceptance Criteria:**
- [ ] Thấy nội dung tiêu chuẩn cộng đồng.
- [ ] Thấy mục "Tiêu chuẩn bảo mật".

## 8. Scenarios

### US001_SeeCountdownBeforeLaunch — Happy Path

**Given** hệ thống chưa tới giờ mở, **When** Sunner đã đăng nhập vào địa chỉ gốc, **Then** thấy Countdown với số ngày, giờ, phút còn lại.

### US001_SeeCountdownBeforeLaunch — Error: đồng hồ máy người dùng sai

**Given** đồng hồ máy người dùng lệch nhiều giờ, **When** mở Countdown, **Then** số còn lại vẫn theo giờ máy chủ.

### US002_ViewHomepage — Happy Path

**Given** hệ thống đã mở, **When** Sunner vào địa chỉ gốc, **Then** thấy Homepage đủ các phần và đếm ngược tới lễ.

### US002_ViewHomepage — Error: ảnh không tải được

**Given** ảnh hero hoặc ảnh thẻ giải lỗi, **When** trang hiển thị, **Then** vẫn đọc được toàn bộ chữ và nút bấm được.

### US003_BrowseAwardCategories — Happy Path

**Given** Sunner ở Homepage, **When** bấm "Chi tiết" ở thẻ Top Project, **Then** trang Hệ thống giải mở và cuộn tới mục Top Project.

### US003_BrowseAwardCategories — Error: mục neo không hợp lệ

**Given** địa chỉ trang có mục neo không khớp giải nào, **When** trang mở, **Then** hiện từ đầu trang và không báo lỗi.

### US004_ReadRules — Happy Path

**Given** Sunner đã đăng nhập, **When** mở trang Thể lệ, **Then** thấy bốn bậc huy hiệu, luật Secret Box và Kudos Quốc Dân.

### US004_ReadRules — Error: trước giờ mở

**Given** hệ thống chưa mở, **When** Sunner thường mở trang Thể lệ, **Then** được đưa tới Countdown (theo D002).

### US005_ReadCommunityStandards — Happy Path

**Given** Sunner đã đăng nhập, **When** mở trang Tiêu chuẩn cộng đồng, **Then** thấy nội dung kèm mục "Tiêu chuẩn bảo mật".

### US005_ReadCommunityStandards — Error: chưa đăng nhập

**Given** người chưa đăng nhập, **When** mở trang Tiêu chuẩn cộng đồng, **Then** F001_Auth đưa tới đăng nhập.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Đếm về 0 khi người dùng đang mở Countdown | Tự chuyển sang Homepage | "None — silent handling" |
| Tab bị ẩn lâu rồi quay lại | Số còn lại cập nhật ngay theo giờ máy chủ | "None — silent handling" |
| Mở Homepage sau mốc lễ (EVENT_AT) | Đếm ngược dừng ở 00:00:00, ẩn nhãn sắp diễn ra (D005) | "None — silent handling" |
| Người dùng thường mở trang ngoài danh sách cho phép trước giờ mở | Chuyển tới Countdown | "Hệ thống sẽ mở sau: ... ngày ... giờ ... phút." |
| Mục neo sai trên trang Hệ thống giải | Trang mở từ đầu | "None — silent handling" |
| Người chưa đăng nhập mở trang cần phiên | F001_Auth chuyển tới đăng nhập | "Vui lòng đăng nhập để tiếp tục." |
| Ngôn ngữ đổi khi đang xem trang | Mọi chữ đổi ngay, vị trí cuộn giữ nguyên | "None — silent handling" |

## 10. Edge Behaviours to Verify

- **FR-002** → Đặt giờ mở sang tương lai và quá khứ, không sửa code: trang chuyển đúng giữa Countdown và Homepage.
- **FR-103** → Bấm "ABOUT AWARDS" tới trang Hệ thống giải, "ABOUT KUDOS" tới Live board Kudos.
- **FR-202** → Để Countdown mở hơn một phút: số phút giảm mà trang không tải lại.
- **FR-203** → Đặt giờ mở sau hiện tại 1 phút: hết phút trang tự sang Homepage.
- **FR-302** → Cuộn qua từng giải: mục menu tương ứng được đánh dấu.
- **FR-305** → So 6 giải với bảng nội dung: số lượng và giá trị khớp, Signature có hai mức.
- **FR-401** → Chỉnh đồng hồ máy người dùng lệch: số còn lại không đổi.
- **FR-601** → Trước giờ mở, tài khoản User mở trang Kudos: bị đưa tới Countdown.
- **FR-603** → Trang Thể lệ và Tiêu chuẩn cộng đồng không có ô nhập chữ.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Nội dung đầy đủ của Thể lệ và Tiêu chuẩn cộng đồng chưa đọc hết từ thiết kế trong lượt soạn này | Trang có thể thiếu hoặc sai điều khoản nếu dựng theo chữ tạm | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | Thể lệ nhắc lại số liệu thuộc F005, F009, F010 (bậc huy hiệu, 5 tim = 1 Secret Box); F006 chỉ hiển thị nên có thể lệch khi luật gốc đổi | Người dùng đọc luật khác với hệ thống tính | [INFERRED] |
| RISK-03 | risk | Ngày lễ 26/12/2025 đã qua so với ngày soạn spec; đếm ngược có thể chỉ hiện 00 nếu không cập nhật mốc | Homepage trông như bỏ quên | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Giữ phiên, danh sách trang công khai, chuyển tới đăng nhập; dùng quyết định "trước giờ mở" của F006 | FR-601, FR-602, D001 |
| F002_AppShell | feature | Cung cấp header, footer, đổi ngôn ngữ, trang 404/403 bao quanh các trang này | FR-001, FR-402 |
| F004_KudosFeed | feature | Là trang đích của nút ABOUT KUDOS và banner Sun* Kudos | FR-103, FR-104 |
| F005_KudosHearts, F009_HeroBadges, F010_SecretBoxRewards | feature | Là chủ của luật mà trang Thể lệ chỉ mô tả | FR-311, RISK-02 |
| Ảnh hero và ảnh 6 giải | data | Tài nguyên hình do thiết kế cung cấp | FR-211, FR-303 |
| Thư viện đa ngôn ngữ (next-intl) | external-service | Nạp bản dịch Việt/Anh cho nội dung tĩnh | FR-001 |

## 13. Configuration

```text
LAUNCH_AT = TBD (draft)                  # giờ mở hệ thống; trước giờ này người dùng thường chỉ thấy Countdown (D004)
EVENT_AT = TBD (draft)                   # giờ bắt đầu lễ, mốc đếm ngược ở Homepage (D005)
EVENT_TIMEZONE = Asia/Ho_Chi_Minh        # múi giờ dùng cho mọi so sánh giờ
```
