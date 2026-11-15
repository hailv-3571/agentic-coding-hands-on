<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft, provenance inherited from the folder) -->

# Functional Spec — F012_Profile

**Priority**: P2
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F012_Profile → SCR (TBD (draft)) → US001_ViewOwnProfile, US002_ViewColleagueProfile, US003_BrowseOwnKudos, US004_BrowseColleagueKudos, US005_SendKudoFromProfile, US006_PeekSunnerCard

## 1. Overview

**Problem:** Sunner muốn xem mình đang được ghi nhận ra sao (danh hiệu, icon đã gom, số liệu, Kudo đã nhận/đã gửi) và muốn biết thêm về đồng nghiệp trước khi cảm ơn họ; nếu không có trang riêng thì lời ghi nhận chỉ trôi trên Live board.
**Solution:** Hai trang profile (của mình, của người khác) cùng một thẻ thông tin nhanh hiện khi rê chuột lên avatar. Trang của mình có bộ sưu tập icon, bảng thống kê và danh sách Kudo Đã gửi/Đã nhận có lọc; trang của người khác có bộ sưu tập icon, nút gửi lời cảm ơn và danh sách Kudo họ đã nhận.
**Scope:** Trang profile của chính mình, trang profile của Sunner khác, thẻ thông tin nhanh khi rê chuột lên avatar. Các khối bên trong (thẻ Kudo, huy hiệu Hero, bộ sưu tập icon, bảng thống kê, form viết Kudo) do feature khác sở hữu và được nhúng vào đây.
**Non-Scope:** Sửa tên/avatar/phòng ban (chưa có yêu cầu, xem D001); thẻ Kudo và che người gửi ẩn danh (F004_KudosFeed); huy hiệu Hero (F009_HeroBadges); bộ sưu tập icon, bảng thống kê, mở Secret Box (F010_SecretBoxRewards); duyệt/đánh dấu Spam (F007_AdminModeration); form viết Kudo (F003_KudosAuthoring); hồ sơ và phòng ban (F001_Auth).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner (chủ profile) | Nhân viên đã đăng nhập, xem trang của chính mình | Xem danh hiệu, icon, số liệu và các Kudo mình nhận/gửi |
| Sunner (người xem) | Nhân viên đã đăng nhập, xem đồng nghiệp | Tìm hiểu đồng nghiệp, đọc Kudo họ nhận, gửi lời cảm ơn cho họ |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Profile của mình | Xem thông tin, huy hiệu Hero, bộ sưu tập icon và bảng thống kê cá nhân | US001_ViewOwnProfile | FR-001, FR-002, FR-101, FR-201, FR-202, FR-203, FR-601 | BR-004, BR-005 | TBD (draft) — SCR-own-profile |
| CAP-02 | Profile người khác | Xem thông tin và bộ sưu tập icon của đồng nghiệp, bấm gửi lời cảm ơn tới họ | US002_ViewColleagueProfile, US005_SendKudoFromProfile | FR-102, FR-103, FR-104, FR-301, FR-302, FR-303, FR-304 | DEC-001 | TBD (draft) — SCR-other-profile |
| CAP-03 | Kudo trên profile | Duyệt danh sách Kudo Đã gửi/Đã nhận của mình (có lọc) hoặc Kudo đồng nghiệp đã nhận | US003_BrowseOwnKudos, US004_BrowseColleagueKudos | FR-204, FR-205, FR-305, FR-401, FR-402, FR-405, FR-602, FR-603, FR-604 | BR-001, BR-002, BR-003, BR-006, DEC-002 | TBD (draft) — vùng KUDOS dùng chung của hai trang profile |
| CAP-04 | Thẻ thông tin nhanh | Rê chuột lên avatar để xem nhanh một Sunner mà không rời trang | US006_PeekSunnerCard | FR-403, FR-404 | BR-007, DEC-003 | TBD (draft) — SCR-avatar-hover-card |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Sunner có sửa được thông tin/avatar của mình trên profile không? | Không; trang chỉ đọc, tên/avatar lấy từ Google, phòng ban do F001 | Figma không có nút sửa hay form nào | no |
| D002 | Kudo gửi ẩn danh có hiện trên profile người nhận không? | Có, ở danh sách Đã nhận với nhãn "Ẩn danh", không lộ người gửi | Người nhận cần thấy lời cảm ơn; che người gửi do F004 đảm nhiệm | no |
| D003 | Kudo ẩn danh mình đã gửi có hiện trong "Đã gửi" của mình không? | Có, thẻ vẫn mang nhãn "Ẩn danh" như mọi người thấy | Để Sunner nhìn lại bài mình gửi mà không lộ gì thêm | no |
| D004 | Nội dung thẻ thông tin nhanh khi rê chuột? | Avatar, tên, phòng ban, huy hiệu Hero và lối "Xem profile" [UNVERIFIED] | Figma chỉ cho thấy khung thẻ, chưa chụp được nội dung | no |
| D005 | Thẻ thông tin nhanh áp cho avatar nào? | Avatar người gửi/người nhận (không ẩn danh) trên thẻ Kudo | Chỉ những avatar dẫn tới profile mới có thẻ | no |
| D006 | Số trong "Đã gửi (n)" tính cả Kudo Spam của mình không? | Có, vì thẻ Spam vẫn hiện trong danh sách | Số phải khớp danh sách người dùng thấy | no |
| D007 | Màn cảm ứng không có rê chuột thì sao? | Chạm avatar đi thẳng tới profile, không có thẻ nhanh | Tránh phải chạm hai lần | no |
| D008 | Form viết Kudo mở từ nút trên profile người khác có cho đổi người nhận không? | Người nhận điền sẵn và khoá | Nút ghi rõ "tới {tên}" nên đổi người nhận sẽ gây hiểu nhầm | no |
| D009 | Địa chỉ của hai trang profile (tạm thời) | Một địa chỉ cố định cho trang của mình, một địa chỉ có mã Sunner cho trang người khác (chi tiết ở technical-spec.md, DEC-001) | Ngắn, khớp mục Profile trong menu avatar của F002 | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Thông tin profile (tên, avatar, phòng ban) lấy từ hồ sơ và danh sách phòng ban do F001_Auth quản lý.
- **FR-002** Tính năng này chỉ đọc: không sửa thông tin cá nhân, không tạo hay sửa Kudo.

### Navigation (1xx)

- **FR-101** Sunner vào profile của mình từ mục "Profile" trong menu avatar.
- **FR-102** Bấm avatar hoặc tên một Sunner (không ẩn danh) trên thẻ Kudo, kết quả tìm kiếm hoặc thẻ nhanh thì mở profile người đó.
- **FR-103** Mở profile của chính mình bằng đường dẫn của người khác thì được đưa về trang profile của mình.
- **FR-104** Mở profile của một Sunner không tồn tại thì thấy trang không tìm thấy.

### Profile của mình (2xx)

- **FR-201** Phần đầu trang hiện avatar lớn ở giữa, tên, mã phòng ban và huy hiệu Hero (chỉ khi có cấp).
- **FR-202** Dưới tên có 6 ô icon tròn (ô chưa có hiện xám rỗng) với chú thích "Bộ sưu tập icon của tôi".
- **FR-203** Bảng thống kê cá nhân hiện: Kudos nhận, Kudos đã gửi, tim nhận, Secret Box đã mở, Secret Box chưa mở, kèm nút "Mở Secret Box".
- **FR-204** Mục KUDOS có dropdown "Đã gửi (n)" / "Đã nhận (n)"; mặc định là Đã gửi.
- **FR-205** Danh sách là các thẻ Kudo như trên Live board; Kudo Spam của chính mình hiện kèm thẻ cam "Spam".

### Profile người khác (3xx)

- **FR-301** Phần đầu trang hiện avatar, tên, mã phòng ban và huy hiệu Hero giống trang của mình.
- **FR-302** 6 ô icon hiện kèm tên bên dưới (REVIVAL, TOUCH OF LIGHT, STAY GOLD, FLOW TO HORIZON, BEYOND THE BOUNDARY, ROOT FURTHER), chú thích "Bộ sưu tập icon của {tên}".
- **FR-303** Trang người khác không có bảng thống kê cá nhân.
- **FR-304** Nút rộng "Gửi lời cảm ơn và ghi nhận tới {tên}" mở form viết Kudo với người nhận đã điền sẵn.
- **FR-305** Mục KUDOS hiện nhãn "Đã nhận: n Kudos", không có dropdown, danh sách là các Kudo người đó đã nhận.

### Interaction (4xx)

- **FR-401** Đổi dropdown Đã gửi/Đã nhận thì danh sách tải lại từ đầu theo lựa chọn mới.
- **FR-402** Danh sách nạp thêm khi Sunner bấm "Tải thêm", mới nhất trước.
- **FR-403** Rê chuột lên avatar thì avatar có vòng vàng và hiện thẻ thông tin nhanh.
- **FR-404** Rời chuột (hoặc nhấn Esc) thì thẻ đóng; bấm vào thẻ mở profile người đó.
- **FR-405** Danh sách không có Kudo nào thì hiện trạng thái trống.

### Security (6xx)

- **FR-601** Mọi trang và dữ liệu của tính năng này yêu cầu Sunner đã đăng nhập.
- **FR-602** Kudo ẩn danh không bao giờ lộ người gửi trên danh sách profile hay thẻ nhanh.
- **FR-603** Bảng thống kê và danh sách "Đã gửi" chỉ chủ profile xem được; kiểm ở server.
- **FR-604** Kudo Spam chỉ hiện cho chính người gửi, trên danh sách "Đã gửi" của họ.

## 5. Business Rules

- Danh sách "Đã nhận" của bất kỳ ai chỉ gồm Kudo ở trạng thái Public (BR-001)
- "Đã gửi" chỉ có trên profile của mình, gồm Kudo Public và Kudo Spam của chính mình, trộn theo thời gian; Spam gắn thẻ "Spam" (BR-002)
- Kudo ẩn danh luôn hiện với nhãn "Ẩn danh" trên mọi danh sách profile, kể cả của người nhận và người gửi (BR-003)
- Số liệu cá nhân (bảng thống kê) chỉ hiện trên profile của chính mình (BR-004)
- Huy hiệu Hero chỉ hiện khi Sunner đã có cấp; chưa có thì không hiện ô trống (BR-005)
- Con số trong dropdown và nhãn "Đã nhận" bằng số Kudo mà danh sách đó thật sự hiển thị cho người xem (BR-006)
- Thẻ thông tin nhanh chỉ có cho Sunner thật; Sunner ẩn danh không có thẻ (BR-007)
- Profile nào hiện là "của mình" hay "của người khác" do người đang đăng nhập quyết định, không do đường dẫn (DEC-001)
- Danh sách Kudo dựng theo lựa chọn: Đã gửi → Kudo mình gửi; Đã nhận → Kudo người đó nhận (DEC-002)
- Thẻ nhanh chỉ mở cho avatar của Sunner không ẩn danh (DEC-003)

## 6. Screens

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Profile của mình | TBD (draft) — SCR-own-profile | Header, nền hero, avatar, tên, phòng ban, huy hiệu, 6 icon, bảng thống kê, mục KUDOS có dropdown và danh sách thẻ | Mở Secret Box, đổi Đã gửi/Đã nhận, tải thêm, bấm sang profile người khác |
| Profile người khác | TBD (draft) — SCR-other-profile | Như trên nhưng icon có tên, không có bảng thống kê, có nút gửi lời cảm ơn, mục "Đã nhận: n Kudos" | Gửi lời cảm ơn tới người đó, tải thêm, bấm sang profile khác |
| Thẻ thông tin nhanh | TBD (draft) — SCR-avatar-hover-card | Khung nhỏ cạnh avatar đang rê chuột (nội dung chưa chốt, D004) | Bấm thẻ để mở profile |

### User Journey

1. Sunner mở menu avatar, chọn Profile và thấy trang của mình: thông tin, icon, số liệu.
2. Sunner cuộn tới mục KUDOS, đổi từ Đã gửi sang Đã nhận để đọc lời cảm ơn mình nhận.
3. Trên Live board, Sunner rê chuột lên avatar một đồng nghiệp và thấy thẻ nhanh.
4. Sunner bấm vào thẻ, tới profile đồng nghiệp, đọc các Kudo họ đã nhận.
5. Sunner bấm "Gửi lời cảm ơn và ghi nhận tới {tên}", form viết Kudo mở ra với người nhận đã điền sẵn.

## 7. User Stories

### US001_ViewOwnProfile — Xem profile của mình

**Actor:** Sunner (chủ profile)
**Goal:** Xem thông tin, huy hiệu, icon đã gom và số liệu của chính mình.
**Business value:** Cho Sunner thấy sự ghi nhận mình đã đạt được, khuyến khích tiếp tục tham gia.

**Acceptance Criteria:**
- [ ] Thấy avatar, tên, mã phòng ban và huy hiệu Hero (nếu có cấp).
- [ ] Thấy 6 ô icon, ô chưa có hiện xám rỗng, chú thích "Bộ sưu tập icon của tôi".
- [ ] Thấy bảng thống kê năm con số và nút "Mở Secret Box".

### US002_ViewColleagueProfile — Xem profile đồng nghiệp

**Actor:** Sunner (người xem)
**Goal:** Xem thông tin và icon của một đồng nghiệp.
**Business value:** Hiểu người được ghi nhận, tăng gắn kết trong công ty.

**Acceptance Criteria:**
- [ ] Thấy avatar, tên, phòng ban, huy hiệu Hero và 6 icon kèm tên.
- [ ] Không thấy bảng thống kê cá nhân.

### US003_BrowseOwnKudos — Duyệt Kudo đã gửi/đã nhận của mình

**Actor:** Sunner (chủ profile)
**Goal:** Đọc lại Kudo mình gửi và nhận, đổi qua lại giữa hai danh sách.
**Business value:** Cho Sunner nhìn lại lời cảm ơn, kể cả thấy Kudo của mình bị đánh dấu Spam.

**Acceptance Criteria:**
- [ ] Dropdown có "Đã gửi (n)" và "Đã nhận (n)", mặc định Đã gửi.
- [ ] Kudo Spam của mình hiện thẻ cam "Spam" trong Đã gửi.
- [ ] Đổi dropdown thì danh sách tải lại từ đầu.

### US004_BrowseColleagueKudos — Duyệt Kudo đồng nghiệp đã nhận

**Actor:** Sunner (người xem)
**Goal:** Đọc các lời cảm ơn công khai đồng nghiệp đã nhận.
**Business value:** Thấy đóng góp của đồng nghiệp được ghi nhận ra sao.

**Acceptance Criteria:**
- [ ] Nhãn "Đã nhận: n Kudos" và danh sách thẻ Kudo Public.
- [ ] Kudo ẩn danh không lộ người gửi.

### US005_SendKudoFromProfile — Gửi lời cảm ơn từ profile

**Actor:** Sunner (người xem)
**Goal:** Gửi Kudo cho đúng người đang xem mà không phải tìm lại họ.
**Business value:** Rút ngắn đường từ "muốn cảm ơn" tới "đã gửi", tăng số Kudo.

**Acceptance Criteria:**
- [ ] Nút ghi đúng tên người đang xem.
- [ ] Form viết Kudo mở ra với người nhận đã điền sẵn.

### US006_PeekSunnerCard — Xem nhanh một Sunner

**Actor:** Sunner (người xem)
**Goal:** Xem nhanh thông tin một Sunner ngay trên avatar mà không rời trang.
**Business value:** Giảm số lần chuyển trang khi lướt Live board.

**Acceptance Criteria:**
- [ ] Rê chuột lên avatar thì có vòng vàng và thẻ nhanh.
- [ ] Rời chuột thì thẻ đóng; bấm thẻ mở profile.

## 8. Scenarios

### US001_ViewOwnProfile — Happy Path

**Given** Sunner đã đăng nhập và có cấp Hero, **When** mở Profile từ menu avatar, **Then** thấy đủ thông tin, huy hiệu, 6 icon và bảng thống kê.

### US001_ViewOwnProfile — Error: chưa có cấp Hero và chưa có icon nào

**Given** Sunner mới chưa có Kudo, **When** mở profile của mình, **Then** không có huy hiệu, cả 6 ô icon xám rỗng, các con số bằng 0.

### US002_ViewColleagueProfile — Happy Path

**Given** Sunner đã đăng nhập, **When** bấm tên đồng nghiệp trên thẻ Kudo, **Then** thấy profile đồng nghiệp không có bảng thống kê.

### US002_ViewColleagueProfile — Error: Sunner không tồn tại

**Given** một đường dẫn tới Sunner không có thật, **When** Sunner mở nó, **Then** thấy trang không tìm thấy.

### US003_BrowseOwnKudos — Happy Path

**Given** Sunner có Kudo đã gửi và đã nhận, **When** chuyển dropdown sang Đã nhận, **Then** danh sách tải lại và chỉ có Kudo mình nhận.

### US003_BrowseOwnKudos — Error: tải danh sách lỗi

**Given** mạng lỗi khi tải danh sách, **When** Sunner đổi dropdown, **Then** thấy thông báo lỗi kèm nút thử lại, phần còn lại của trang không đổi.

### US004_BrowseColleagueKudos — Happy Path

**Given** đồng nghiệp có Kudo Public, **When** Sunner mở profile họ, **Then** thấy "Đã nhận: n Kudos" và danh sách thẻ.

### US004_BrowseColleagueKudos — Error: đồng nghiệp chưa nhận Kudo nào

**Given** đồng nghiệp chưa có Kudo Public, **When** Sunner mở profile họ, **Then** thấy trạng thái trống thay cho danh sách.

### US005_SendKudoFromProfile — Happy Path

**Given** Sunner đang xem profile đồng nghiệp, **When** bấm nút gửi lời cảm ơn, **Then** form viết Kudo mở với người nhận đã điền sẵn.

### US005_SendKudoFromProfile — Error: đóng form giữa chừng

**Given** form viết Kudo đang mở, **When** Sunner đóng form, **Then** quay lại profile như cũ, chưa có Kudo nào được gửi.

### US006_PeekSunnerCard — Happy Path

**Given** Sunner rê chuột lên avatar người gửi không ẩn danh, **When** dừng lại, **Then** avatar có vòng vàng và thẻ nhanh hiện ra.

### US006_PeekSunnerCard — Error: thẻ không tải được

**Given** dữ liệu thẻ lỗi, **When** Sunner rê chuột lên avatar, **Then** không hiện thẻ trống; bấm avatar vẫn mở profile.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Mở profile của chính mình qua đường dẫn người khác | Chuyển về trang profile của mình | None — chuyển trang im lặng |
| Danh sách Đã gửi/Đã nhận trống | Hiện trạng thái trống, bỏ nút "Tải thêm" | "Chưa có Kudo nào." |
| Sunner chưa có phòng ban hoặc chưa có cấp Hero | Bỏ phần phòng ban hoặc huy hiệu, bố cục không để ô trống | None — ẩn phần thiếu |
| Mở profile người không tồn tại | Hiện trang không tìm thấy | "Không tìm thấy Sunner này." |
| Kudo Public bị Admin đánh dấu Spam khi đang xem | Lần tải kế tiếp biến khỏi "Đã nhận" của người nhận; chủ bài thấy thẻ "Spam" | None — cập nhật khi tải lại |
| Người xem đổi dropdown nhanh liên tiếp | Chỉ kết quả của lựa chọn cuối cùng được hiện | None — xử lý im lặng |
| Kudo ẩn danh trong danh sách | Thẻ hiện nhãn "Ẩn danh", avatar người gửi không có thẻ nhanh | None — nhãn "Ẩn danh" |

## 10. Edge Behaviours to Verify

- **FR-103** → Mở profile của chính mình qua đường dẫn người khác thì về trang profile của mình.
- **FR-203** → Bảng thống kê hiện đủ 5 số và nút "Mở Secret Box" chỉ trên trang của mình.
- **FR-303** → Trang người khác không có bảng thống kê.
- **FR-305** → "Đã nhận: n Kudos" bằng số thẻ Public người đó nhận.
- **FR-403** → Rê chuột lên avatar có vòng vàng và thẻ; rời chuột thì đóng.
- **FR-602** → Kudo ẩn danh không lộ người gửi dù xem bằng profile của người nhận.
- **FR-603** → Người xem không có cách nào xem "Đã gửi" của người khác.
- **FR-604** → Kudo Spam chỉ hiện cho chính người gửi.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Mỗi lần rê chuột lên avatar có thể gọi dữ liệu thẻ, trên Live board có hàng chục avatar | Tải thừa cho máy chủ, thẻ hiện chậm | [EXPECTED] cần cơ chế nạp có trễ và nhớ tạm khi triển khai |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F001_Auth | feature | Phiên đăng nhập, hồ sơ và phòng ban | FR-001, FR-601 |
| F002_AppShell | feature | Mục Profile trong menu avatar, header, trang không tìm thấy | FR-101, FR-104 |
| F003_KudosAuthoring | feature | Form viết Kudo mở với người nhận điền sẵn | FR-304 |
| F004_KudosFeed | feature | Thẻ Kudo, lọc Public, che người gửi ẩn danh | FR-205, FR-305, FR-602 |
| F005_KudosHearts | feature | Số tim trên thẻ và số tim nhận ở bảng thống kê | FR-203, FR-205 |
| F007_AdminModeration | feature | Kudo Spam của chính người gửi và thẻ "Spam" | FR-205, FR-604 |
| F009_HeroBadges | feature | Huy hiệu Hero cạnh tên | FR-201, FR-301 |
| F010_SecretBoxRewards | feature | Bộ sưu tập icon, bảng thống kê, nút Mở Secret Box | FR-202, FR-203, FR-302 |

## 13. Configuration

```text
PROFILE_KUDOS_PAGE_SIZE = TBD (draft)   # số Kudo mỗi lần nạp trên profile (đề xuất bằng kích thước trang của feed, F004)
```
