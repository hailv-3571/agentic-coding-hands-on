---
authored_by: rebuild-spec
---
<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->
<!-- Contract: references/feature-spec-researcher-contract.md -->
<!-- Nửa BA/QA của cặp spec: đọc file này là trả lời được "làm gì, ứng xử ra sao, màn hình hiện gì" mà không phải mở file khác. Chi tiết kỹ thuật (điểm vào, trích dẫn nguồn, mã giả, bảng ghi) nằm ở technical-spec.md. -->

# Functional Spec — F009_HeroBadges

**Priority**: P2
**Type**: background
**Generated**: 2026-11-24

**See also:** [`technical-spec.md`](./technical-spec.md) — điểm vào, trích dẫn nguồn, mã giả, thực thể và các bảng bị ghi cho Dev/QA/SA.

**Traceability:** F009_HeroBadges → US040_ViewHeroBadgeTooltip → BL014_HeroTierUpDetection

## 1. Overview

**Problem:** Sunner nhận được lời cảm ơn từ đồng đội nhưng không có dấu hiệu nhìn thấy ngay mình được ghi nhận ở mức nào; thể lệ muốn mức đó hiện cạnh tên để khích lệ và lan toả văn hoá cảm ơn.
**Solution:** Tính bậc Hero của mỗi người theo số đồng đội khác nhau đã gửi Kudo công khai cho họ, tính ở mỗi lần đọc chứ không lưu; vẽ một huy hiệu dùng chung kèm tooltip giải thích; và báo cho hệ thống thông báo khi một người vừa lên bậc.
**Scope:** Luật tính bậc (New, Rising, Super, Legend); huy hiệu viên nhãn dùng chung; tooltip giải thích từng bậc; quyết định "người này vừa lên bậc, cần báo".
**Non-Scope:** Màn hình riêng (feature không sở hữu màn hình nào, huy hiệu nằm trong màn của feature khác); đánh dấu Spam (F007); việc ghi và hiển thị thông báo (F013); cột Level và bộ lọc Level của bảng Admin (F014, chỉ dùng lại nguồn bậc); Secret Box và quà (F010).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên đã đăng nhập bằng email công ty, vừa xem vừa có thể là người nhận Kudo | Thấy mình và đồng đội được ghi nhận ở bậc nào và hiểu bậc đó nghĩa là gì |
| Admin | Quản trị viên của BTC | Lọc và xem bậc Hero của từng người trong bảng người dùng |

## 2. Functional Capabilities

<!-- Có US040 chỉ ở CAP-03; các CAP còn lại là nền (không có câu chuyện riêng, chỉ có yêu cầu). -->

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Tính bậc Hero khi đọc | Mọi màn hình cần bậc nhận cùng một kết quả: số người gửi công khai khác nhau của người nhận quy ra bậc, không cần lưu | N/A — nền, không có câu chuyện riêng | FR-001, FR-002, FR-003, FR-004, FR-601, FR-602, FR-603 | BR-001, BR-002, BR-003, BR-004, DEC-002 | N/A — F009 không sở hữu màn hình, xem § 12 |
| CAP-02 | Huy hiệu Hero dùng chung | Thấy huy hiệu bậc cạnh tên người nhận trên thẻ Kudo, header profile, thẻ nhanh và trang Thể lệ; không có bậc thì không thấy gì | N/A — nền, không có câu chuyện riêng | FR-201, FR-202, FR-203 | BR-005, DEC-001 | N/A — F009 không sở hữu màn hình, xem § 12 |
| CAP-03 | Tooltip giải thích bậc | Rê, focus hoặc chạm vào huy hiệu để đọc tên bậc và ý nghĩa; đóng bằng nhiều cách; mỗi lúc chỉ một tooltip mở | US040 | FR-401, FR-402, FR-403, FR-404 | DEC-003, DEC-004, SM-001 | N/A — nằm trong màn của feature khác, xem § 12 |
| CAP-04 | Báo khi lên bậc | Người nhận được thông báo trong app khi vừa đạt bậc cao hơn bậc đã từng được báo | N/A — nền, không có câu chuyện riêng | FR-405, FR-406 | BR-006 | N/A — thông báo hiện ở màn của F013 |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Bản tiếng Anh của tên bậc và lời tooltip (toàn bộ bản tiếng Anh đang là bản dịch tạm) có được BTC duyệt chưa | Giữ bản dịch tạm hiện có | Bản tiếng Việt đã khớp Figma; bản tiếng Anh chờ BTC dịch hoặc duyệt | no |
| D002 | Lời tooltip xưng "bạn" ("Có 5–9 người gửi Kudos cho bạn") có giữ nguyên khi xem huy hiệu của người khác hay cần câu riêng cho trường hợp đó | Giữ nguyên văn Figma, xưng "bạn" ở mọi nơi | Một nguồn thông điệp dùng chung với trang Thể lệ, không lệch nhau | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Bậc Hero của một người được tính ở mỗi lần đọc từ số người gửi công khai khác nhau của họ, không lưu sẵn ở đâu.
- **FR-002** Bậc theo số người gửi: New từ 1 đến 4, Rising từ 5 đến 9, Super từ 10 đến 20, Legend từ 21; dưới 1 thì không có bậc.
- **FR-003** Hỏi bậc cho nhiều người một lần; lô lớn được tách, id trùng được gộp, lô rỗng không tốn truy vấn nào.
- **FR-004** Cột Level và bộ lọc Level của Admin dùng cùng nguồn bậc để khớp với huy hiệu người dùng thấy.

### Interaction (4xx)

- **FR-401** Tooltip mở khi rê chuột, khi focus bàn phím hoặc khi chạm vào huy hiệu.
- **FR-402** Mỗi lúc chỉ một tooltip mở trên trang; mở cái mới thì cái cũ đóng.
- **FR-403** Tooltip hiện tiêu đề và mô tả của bậc đó, cùng bộ chữ với trang Thể lệ.
- **FR-404** Tooltip luôn nằm trọn trong màn hình, kể cả màn 375 px, và không làm kẹt focus.
- **FR-405** Khi Kudo công khai mới đưa người nhận lên bậc cao hơn bậc cao nhất đã từng báo, hệ thống thông báo cho họ đúng một lần cho bậc đó.
- **FR-406** Nếu một Kudo làm vượt nhiều ngưỡng cùng lúc thì chỉ báo bậc đạt được; bậc tụt vì Spam không kích hoạt lại bậc cũ.

### Screen elements (2xx)

- **FR-201** Mọi nơi vẽ huy hiệu đều dùng một huy hiệu chung; người chưa có bậc không có viên nhãn rỗng và không có dấu chấm ngăn.
- **FR-202** Cỡ huy hiệu tuỳ nơi (thẻ Kudo, tooltip, trang Thể lệ, thẻ nhanh) nhưng cùng một hình theo bậc.
- **FR-203** Trang Thể lệ liệt kê đủ bốn bậc với tên, tiêu đề và mô tả lấy từ cùng nguồn chữ với tooltip.

### Security (6xx)

- **FR-601** Bậc chỉ được tính ở phía máy chủ và không có đường truy cập trực tiếp từ trình duyệt; người dùng chỉ nhận tên bậc trong dữ liệu của màn hình họ xem.
- **FR-602** Kết quả bậc không bao giờ kèm danh tính người gửi.
- **FR-603** Người gửi ẩn danh không có huy hiệu trên thẻ Kudo dù Kudo ẩn danh vẫn được tính cho người nhận.

## 5. Business Rules

- Kudo bị đánh dấu Spam không được đếm; Spam làm bậc tụt ở lần đọc sau và bỏ Spam khôi phục ngay (BR-001)
- Mỗi người gửi chỉ tính một lần dù gửi nhiều Kudo; Kudo tự gửi cho mình không bao giờ tính (BR-002)
- Kudo ẩn danh vẫn được đếm cho người nhận (BR-003)
- Bậc luôn tính lại mỗi lần đọc, không lưu và không dùng bản nhớ tạm (BR-004)
- Tên bậc, tiêu đề và mô tả đến từ một bộ chữ duy nhất dùng chung giữa huy hiệu, tooltip và trang Thể lệ (BR-005)
- Chỉ báo lên bậc khi bậc đạt được cao hơn bậc cao nhất đã từng báo cho người đó, kể cả khi sự kiện được xử lý trễ hay đảo thứ tự (BR-006)
- Trên thẻ Kudo, người gửi ẩn danh không có huy hiệu; người gửi có tên và người nhận có thì hiện (DEC-002)
- Không có bậc thì không vẽ gì; có bậc thì vẽ huy hiệu và dấu chấm khi đứng sau mã phòng ban (DEC-001)
- Tooltip mở khi rê, focus hoặc chạm và đóng khi chuột rời, mất focus, Esc, chạm lần hai hoặc nhấn chỗ khác; nhấn trong tooltip thì giữ mở (DEC-003)
- Tooltip nằm dưới huy hiệu, chỉ lật lên trên khi tràn đáy mà phía trên đủ chỗ, và luôn cách mép màn hình 16 px (DEC-004)
- Tooltip hoặc đóng hoặc mở, và tooltip khác mở thì đóng cái đang mở (SM-001)

## 6. Screens

N/A — background feature; no user-facing screens.

F009 không sở hữu màn hình nào. Huy hiệu và tooltip nằm trong màn của feature khác, liệt kê ở § 12.

## 7. User Stories

### US040_ViewHeroBadgeTooltip — Xem giải thích bậc Hero

**Actor:** Sunner
**Goal:** Hiểu huy hiệu Hero cạnh tên một người nói lên điều gì khi rê, focus hoặc chạm vào nó.
**Business value:** Huy hiệu có ý nghĩa rõ ràng nên khích lệ được người nhận và người xem hiểu cách được ghi nhận.

**Acceptance Criteria:**
- [ ] Tooltip mở khi rê chuột vào huy hiệu, khi focus bàn phím hoặc khi chạm; đóng khi chuột rời (trễ 120 ms), khi mất focus, nhấn Esc, chạm lần hai hoặc nhấn chỗ khác (nhấn trong tooltip thì giữ mở).
- [ ] Mỗi lúc chỉ một tooltip mở; tooltip không nhận focus nên focus không bị kẹt.
- [ ] Nội dung theo bậc: New (1–4 người gửi), Rising (5–9), Super (10–20), Legend (hơn 20), có tiêu đề và mô tả.
- [ ] Người chưa có người gửi nào không có huy hiệu; người gửi ẩn danh không có huy hiệu.
- [ ] Trên Kudo spam của chính mình (dưới lớp phủ), huy hiệu ra khỏi thứ tự Tab.

## 8. Scenarios

### US040_ViewHeroBadgeTooltip — Happy Path

**Given** người nhận có 5 người gửi công khai khác nhau, **When** Sunner rê chuột vào huy hiệu trên thẻ Kudo, **Then** tooltip mở với tiêu đề "Có 5–9 người gửi Kudos cho bạn" và mô tả của Rising.

### US040_ViewHeroBadgeTooltip — Error: người chưa có bậc

**Given** người nhận chưa có người gửi công khai nào, **When** Sunner xem thẻ Kudo của họ, **Then** không có huy hiệu, không có dấu chấm và không có gì để rê vào.

### US040_ViewHeroBadgeTooltip — Error: Kudo của người nhận bị Spam làm tụt bậc

**Given** người nhận đang ở Rising nhờ đúng 5 người gửi, **When** Admin đánh dấu Spam Kudo của một người trong số đó rồi trang được tải lại, **Then** huy hiệu hiện bậc New và tooltip đổi theo.

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Người nhận chưa có Kudo công khai nào | Không có bậc, không vẽ huy hiệu (DEC-001) | "None — không hiện huy hiệu" |
| Một người gửi nhiều Kudo cho cùng người nhận | Chỉ tính một lần (BR-002) | "None — silent handling" |
| Kudo bị Spam rồi được bỏ Spam | Số đếm giảm rồi khôi phục ở lần đọc kế tiếp, không cần tính lại (BR-001) | "None — silent handling" |
| Tra bậc lỗi lúc tải thẻ Kudo | Trang vẫn hiện, các thẻ chỉ không có huy hiệu (DEC-002) | "None — thẻ hiện bình thường, không có huy hiệu" |
| Chạm trên điện thoại | Lần chạm đầu mở, lần chạm thứ hai đóng; không mở rồi đóng ngay (DEC-003) | "None — silent handling" |
| Hai huy hiệu cùng muốn mở tooltip | Tooltip mới thay tooltip cũ (DEC-003) | "None — silent handling" |
| Huy hiệu sát đáy hoặc màn hình hẹp | Tooltip kẹp cách mép 16 px, chỉ lật lên trên khi tràn đáy và đủ chỗ (DEC-004) | "None — silent handling" |
| Người nhận nhảy qua nhiều ngưỡng cùng lúc | Thông báo chỉ nêu bậc đạt được (FR-406) | "Thông báo thăng hạng bậc đạt được (hiện ở màn thông báo)" |
| Người gửi ẩn danh | Không có huy hiệu cho người gửi nhưng vẫn góp vào số đếm của người nhận (DEC-002, BR-003) | "None — silent handling" |

## 10. Edge Behaviours to Verify

- **FR-001** → Sửa dữ liệu Kudo rồi tải lại: bậc đổi theo ngay, không có giá trị cũ nào bị giữ lại.
- **FR-002** → Với 1, 4, 5, 9, 10, 20, 21 người gửi, bậc lần lượt là New, New, Rising, Rising, Super, Super, Legend.
- **FR-003** → Một trang 50 người nhận chỉ tốn một lần truy vấn.
- **FR-402** → Mở tooltip thứ hai thì tooltip thứ nhất đóng.
- **FR-404** → Ở màn 375 px, tooltip không bị tràn mép trái hoặc phải và không lấy focus khỏi huy hiệu.
- **FR-405** → Người nhận vừa chạm ngưỡng mới nhận đúng một thông báo cho bậc đó, xử lý lại sự kiện không báo đôi.
- **FR-603** → Thẻ Kudo ẩn danh không hiện huy hiệu cho người gửi.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Ngôi "bạn" trong lời tooltip hiện cả khi xem huy hiệu của người khác | Người xem huy hiệu đồng đội có thể thấy câu nói với chính mình | chờ quyết định ở D002 |
| RISK-02 | risk | Bản tiếng Anh của lời tooltip là bản dịch tạm | Người dùng chọn tiếng Anh thấy chữ chưa được BTC duyệt | [UNVERIFIED] |
| RISK-03 | risk | Bậc tính ở mỗi lần đọc cho mọi trang thẻ; nếu thiếu chỉ mục từng phần thì truy vấn chậm hơn nhưng vẫn đúng | Trang Live board và danh sách Admin có thể chậm khi dữ liệu lớn | [INFERRED] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F004_KudosFeed | feature | Thẻ Kudo trên Live board, trang Kudo chi tiết nhúng huy hiệu và tooltip | SCR007/REG003, SCR007/REG005, SCR006, DEC-001 |
| F012_Profile | feature | Header profile của mình và của người khác nhúng huy hiệu; thẻ nhanh vẽ huy hiệu và dùng lại luật đặt vị trí tooltip | SCR015, SCR016, FR-201 |
| F013_Notifications | feature | Bộ xử lý thông báo dùng quyết định lên bậc và số đếm để sinh thông báo thăng hạng | FR-405, BR-006 |
| F014_AdminUserManagement | feature | Cột Level và bộ lọc Level dùng cùng nguồn bậc | SCR018, FR-004 |
| F007_AdminModeration | feature | Đánh dấu hoặc bỏ Spam đổi số đếm | BR-001 |
| F003_KudosAuthoring | feature | Tạo Kudo công khai (kể cả ẩn danh) là đầu vào của số đếm | BR-003 |
| F006_AwardsPortal | feature | Trang Thể lệ liệt kê bốn bậc dùng cùng huy hiệu và chữ | SCR012, FR-203 |

## 13. Configuration

```text
HERO_NEW_MIN = 1        # số người gửi tối thiểu để có bậc New
HERO_RISING_MIN = 5     # số người gửi tối thiểu để lên Rising
HERO_SUPER_MIN = 10     # số người gửi tối thiểu để lên Super
HERO_LEGEND_MIN = 21    # số người gửi tối thiểu để lên Legend
```
