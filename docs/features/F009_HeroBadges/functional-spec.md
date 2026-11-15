<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft, provenance inherited from the folder) -->

# Functional Spec — F009_HeroBadges

**Priority**: P2
**Type**: mixed
**Generated**: 2026-11-08

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F009_HeroBadges → SCR (TBD (draft)) → US001_SeeHeroBadge, US002_ReadHeroTierMeaning, US003_SeeTierFollowKudos

## 1. Overview

**Problem:** Sunner nhận được lời cảm ơn từ đồng đội nhưng không có dấu hiệu nhìn thấy ngay mức độ được ghi nhận; thể lệ muốn mức đó hiện trực tiếp cạnh tên để khích lệ và lan toả văn hoá cảm ơn.
**Solution:** Tính cấp Hero của mỗi Sunner theo số đồng đội khác nhau đã gửi Kudo công khai cho họ, và cung cấp một huy hiệu dùng chung (kèm tooltip giải thích) để thẻ Kudo, profile và bảng người dùng Admin hiện cạnh tên.
**Scope:** Quy tắc tính cấp Hero (New, Rising, Super, Legend); huy hiệu dạng viên nhãn nhỏ; tooltip giải thích từng cấp.
**Non-Scope:** Thẻ Kudo và feed (F004_KudosFeed, chỉ nhúng huy hiệu); trang profile (F012_Profile); bảng người dùng Admin và cột Level / Number of Badges (F014_AdminUserManagement); đánh dấu Spam (F007_AdminModeration); thông báo lên cấp (F013_Notifications); Secret Box và quà (F010_SecretBoxRewards).

**Actors**

| Actor | Description | Primary goal |
|-------|--------------|---------------|
| Sunner | Nhân viên đã đăng nhập bằng email công ty, vừa là người xem vừa có thể là người nhận Kudo | Thấy mình và đồng đội được ghi nhận ở cấp nào, hiểu cấp đó nghĩa là gì |

## 2. Functional Capabilities

| ID | Capability | What the user can do | User Stories | Requirements | Business Rules | Screens |
|----|------------|------------------------|-----------------|---------------|-------------------|---------|
| CAP-01 | Tính cấp Hero | Có cấp Hero đúng theo số người gửi, luôn theo kịp Kudo mới hoặc Kudo bị Spam | US003_SeeTierFollowKudos | FR-001, FR-002, FR-003, FR-601, FR-602 | BR-001, BR-002, BR-003, DEC-002 | TBD (draft) |
| CAP-02 | Hiển thị huy hiệu và giải thích | Thấy huy hiệu cạnh tên và đọc ý nghĩa cấp qua tooltip | US001_SeeHeroBadge, US002_ReadHeroTierMeaning | FR-101, FR-201, FR-202, FR-401, FR-402, FR-403, FR-603 | DEC-001, DEC-003 | TBD (draft) |

## 3. Open Decisions

| D### | Decision | Default proposal | Rationale | Blocks work |
|------|----------|-------------------|-----------|--------------|
| D001 | Kudo gửi ẩn danh có được tính vào số người gửi không? | Có; người gửi ẩn danh vẫn là một người gửi, con số không lộ ai | Thể lệ nói "số lượng đồng đội gửi", không loại ai; ẩn danh chỉ che hiển thị | no |
| D002 | Kudo bị Mark Spam có bị loại khỏi số đếm không? (câu hỏi chung về thu hồi khi Spam đã nằm trong danh sách mở của hệ thống) | Có; chỉ Kudo công khai được đếm, Spam bị loại thì cấp hạ, gỡ Spam thì cấp trả lại | Khớp cách tim bỏ qua Kudo Spam; không cần job thu hồi riêng | no |
| D003 | Số người gửi tính tích luỹ mọi thời gian hay chỉ trong kỳ chiến dịch? | Tích luỹ mọi thời gian | Thể lệ không nêu cửa sổ thời gian; tích luỹ đơn giản nhất | no |
| D004 | Người gửi tự gửi Kudo cho chính mình có tính không? (phụ thuộc quyết định "tự gửi" của F003_KudosAuthoring) | Không tính | Tránh tự nâng cấp dù F003 có cho tự gửi hay không | no |
| D005 | Ai phát hiện việc "lên cấp Hero" để F013 báo cho người nhận? | F013 so cấp trước và sau khi một Kudo mới được ghi, bằng cùng quy tắc ở đây | F009 không lưu cấp nên không có sự kiện riêng; tránh thêm bảng chỉ để báo | no |
| D006 | Lời tooltip dùng ngôi "bạn" khi xem huy hiệu của người khác ra sao, và dòng số người gửi của Rising/Super/Legend viết thế nào? | Dùng nguyên văn Figma ở mọi nơi; dòng số người gửi các cấp còn lại theo mẫu "Có 5–9 người gửi Kudos cho bạn" `[INFERRED]` | Figma là nguồn chuẩn; chỉ cấp New có dòng đầy đủ được xác nhận | no |
| D007 | Quan hệ giữa cấp Hero với cột Level (1–5) và Number of Badges ở bảng người dùng Admin? (câu hỏi chung đã mở của hệ thống) | F009 chỉ cung cấp cấp Hero; không suy ra Level hay số Badges từ đây | Không đủ dữ liệu để giả định quan hệ; để F014 chốt | no |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Cấp Hero của một Sunner được tính từ số đồng đội khác nhau đã gửi Kudo công khai cho Sunner đó.
- **FR-002** Có bốn cấp: New Hero 1–4 người gửi, Rising Hero 5–9, Super Hero 10–20, Legend Hero trên 20; chưa có người gửi nào thì không có huy hiệu.
- **FR-003** Cấp luôn được tính lại từ dữ liệu hiện tại, không lưu thành con số riêng, nên Kudo mới hoặc Kudo bị Spam được phản ánh ở lần xem kế tiếp.

### Navigation (1xx)

- **FR-101** Huy hiệu hiện cạnh tên Sunner trên thẻ Kudo, trang profile và bảng người dùng Admin; nơi chủ của từng màn hình quyết định đặt ở đâu. `[INFERRED]` đối với bảng Admin.

### Hero Badge (2xx)

- **FR-201** Huy hiệu là một nhãn nhỏ dạng viên ghi tên cấp ("New Hero", "Rising Hero", "Super Hero", "Legend Hero"), đặt dưới tên và phòng ban.
- **FR-202** Chỉ có một huy hiệu dùng chung, nhận cấp và vẽ giống nhau ở mọi nơi; nơi dùng không tự tính hay tự vẽ lại.

### Interaction (4xx)

- **FR-401** Rê chuột vào huy hiệu thì hiện tooltip gồm số người gửi của cấp đó và đoạn mô tả.
- **FR-402** Tooltip cũng mở được bằng bàn phím và chạm, đóng khi rời đi, mất focus, nhấn Esc hoặc chạm lần hai. `[EXPECTED]`
- **FR-403** Chữ trên huy hiệu và tooltip nằm trong tệp ngôn ngữ; bản tiếng Việt lấy nguyên văn từ thiết kế.

### Security (6xx)

- **FR-601** Chỉ Sunner đã đăng nhập mới xem được cấp Hero; không có đường xem công khai.
- **FR-602** Người xem chỉ nhận tên cấp, không bao giờ nhận danh sách những người đã gửi Kudo.
- **FR-603** Huy hiệu không được là đường lộ danh tính: với Kudo ẩn danh, cấp của người gửi không được truyền ra màn hình.

## 5. Business Rules

- Chỉ Kudo công khai được đếm; Kudo bị Spam không tính (BR-001)
- Một người gửi chỉ tính một lần dù gửi nhiều Kudo, và người gửi tự gửi cho chính mình không tính (BR-002)
- Người gửi ẩn danh vẫn được đếm như một người gửi (BR-003) [NEEDS_DOMAIN_CONFIRMATION] D001
- Huy hiệu chỉ hiện khi Sunner có ít nhất một người gửi; không có thì không hiện gì, kể cả khung rỗng (DEC-001)
- Cấp luôn theo kịp dữ liệu hiện tại: Kudo mới, Spam và gỡ Spam đều phản ánh ở lần xem kế tiếp (DEC-002)
- Tooltip hiện khi rê chuột, focus hoặc chạm và biến mất khi rời đi (DEC-003)

## 6. Screens

Huy hiệu là thành phần dùng chung nhúng vào màn hình của feature khác, nên feature này không có màn hình riêng và không cần screen spec. Màn hình chủ được liệt kê để người đọc biết huy hiệu xuất hiện ở đâu.

| Screen Name | SCR### | What User Sees | What User Can Do |
|-------------|--------|-----------------|-------------------|
| Thẻ Kudo trên Live board (F004_KudosFeed) | TBD (draft) | Viên huy hiệu dưới tên và phòng ban của Sunner trên thẻ | Rê chuột để đọc tooltip |
| Trang profile (F012_Profile) | TBD (draft) | Viên huy hiệu cạnh tên profile | Rê chuột để đọc tooltip |
| Bảng người dùng Admin (F014_AdminUserManagement) | TBD (draft) | Viên huy hiệu cạnh tên trong dòng người dùng `[INFERRED]` | Rê chuột để đọc tooltip |

### User Journey

1. Sunner mở Live board và thấy thẻ Kudo có viên "Rising Hero" dưới tên người nhận.
2. Sunner rê chuột vào viên huy hiệu — tooltip hiện số người gửi của cấp và đoạn mô tả.
3. Sunner rời chuột — tooltip biến mất, thẻ giữ nguyên.
4. Sau khi có thêm người gửi Kudo cho người nhận, lần tải trang kế tiếp có thể hiện cấp cao hơn.

## 7. User Stories

### US001_SeeHeroBadge — Thấy huy hiệu Hero cạnh tên

**Actor:** Sunner
**Goal:** Thấy ngay cấp Hero của một đồng nghiệp ngay cạnh tên họ.
**Business value:** Lời ghi nhận của đồng đội được nhìn thấy, khích lệ người nhận và lan toả văn hoá cảm ơn.

**Acceptance Criteria:**
- [ ] Sunner có từ 1 người gửi trở lên thì có viên huy hiệu đúng cấp dưới tên và phòng ban.
- [ ] Sunner chưa có người gửi nào thì không hiện huy hiệu.
- [ ] Huy hiệu trông giống nhau trên thẻ Kudo, profile và bảng Admin.

### US002_ReadHeroTierMeaning — Đọc ý nghĩa cấp Hero

**Actor:** Sunner
**Goal:** Biết huy hiệu đang xem nghĩa là gì và cần bao nhiêu người gửi.
**Business value:** Huy hiệu có ý nghĩa rõ ràng, người xem hiểu thể lệ mà không phải tìm tài liệu.

**Acceptance Criteria:**
- [ ] Rê chuột vào huy hiệu thì hiện tooltip đúng cấp, gồm số người gửi và đoạn mô tả.
- [ ] Tooltip mở được bằng bàn phím và đóng khi nhấn Esc. `[EXPECTED]`

### US003_SeeTierFollowKudos — Cấp Hero theo kịp Kudo

**Actor:** Sunner
**Goal:** Thấy cấp Hero của mình đổi đúng khi có thêm người gửi Kudo hoặc khi một Kudo bị Spam.
**Business value:** Cấp phản ánh đúng thực tế, người nhận tin vào con số và không có cấp "ảo" do Kudo không hợp lệ.

**Acceptance Criteria:**
- [ ] Người gửi thứ 5 gửi Kudo công khai thì lần tải kế tiếp cấp lên Rising Hero.
- [ ] Kudo của người gửi thứ 5 bị Spam thì lần tải kế tiếp cấp trở về New Hero.

## 8. Scenarios

### US001_SeeHeroBadge — Happy Path

**Given** một Sunner có 7 người khác nhau đã gửi Kudo công khai, **When** người khác xem thẻ Kudo của Sunner đó, **Then** thấy viên "Rising Hero" dưới tên.

### US001_SeeHeroBadge — Error: không tính được cấp

**Given** hệ thống không đọc được dữ liệu để tính cấp, **When** mở thẻ Kudo, **Then** thẻ vẫn hiện đầy đủ nhưng không có huy hiệu, không có thông báo lỗi.

### US002_ReadHeroTierMeaning — Happy Path

**Given** viên "New Hero" đang hiện, **When** Sunner rê chuột vào, **Then** tooltip hiện "Có 1–4 người gửi Kudos cho bạn" cùng đoạn mô tả của New Hero.

### US002_ReadHeroTierMeaning — Error: màn hình không có chuột

**Given** Sunner dùng màn hình cảm ứng, **When** chạm vào huy hiệu, **Then** tooltip mở, chạm lần hai thì đóng. `[EXPECTED]`

### US003_SeeTierFollowKudos — Happy Path

**Given** một Sunner có 4 người gửi, **When** người thứ 5 gửi Kudo công khai và trang được tải lại, **Then** huy hiệu đổi từ "New Hero" sang "Rising Hero".

### US003_SeeTierFollowKudos — Error: Kudo bị Spam

**Given** một Sunner có đúng 5 người gửi, **When** Kudo của một người bị đánh dấu Spam và trang được tải lại, **Then** huy hiệu trở về "New Hero".

## 9. Edge Cases

| Scenario | What Happens | User-Facing Message |
|----------|--------------|----------------------|
| Sunner chưa có người gửi nào | Không có cấp, không vẽ huy hiệu | "None — silent handling" |
| Một người gửi nhiều Kudo cho cùng người nhận | Chỉ tính một người gửi | "None — silent handling" |
| Số người gửi đúng 5, 10 hoặc 21 | 5 là Rising, 10 là Super, 21 là Legend (cận dưới bao hàm) | "None — silent handling" |
| Người gửi tự gửi cho chính mình | Không tính vào số đếm | "None — silent handling" |
| Kudo bị Spam làm số người gửi tụt qua ngưỡng | Lần xem kế tiếp hiện cấp thấp hơn; gỡ Spam thì cấp trả lại | "None — silent handling" |
| Việc tính cấp bị lỗi | Thẻ, profile hoặc bảng vẫn hiện, chỉ thiếu huy hiệu | "None — silent handling" |
| Chưa đăng nhập mà vào trang có huy hiệu | Bị chuyển tới màn hình đăng nhập, không thấy cấp nào | "Vui lòng đăng nhập để tiếp tục" |

## 10. Edge Behaviours to Verify

- **FR-001** → Thêm một người gửi mới thì cấp đổi đúng theo số người gửi khác nhau.
- **FR-002** → Với 0, 1, 4, 5, 9, 10, 20, 21 người gửi, cấp lần lượt là không có, New, New, Rising, Rising, Super, Super, Legend.
- **FR-003** → Không cần thao tác nào ngoài tải lại trang để cấp theo kịp Kudo mới hoặc Spam.
- **FR-101** → Huy hiệu hiện cạnh tên trên thẻ Kudo, profile và bảng Admin.
- **FR-201** → Huy hiệu hiện dưới tên và phòng ban với đúng chữ của cấp.
- **FR-202** → Cùng một Sunner có huy hiệu giống hệt nhau ở mọi nơi.
- **FR-401** → Rê chuột vào huy hiệu hiện tooltip đúng cấp.
- **FR-402** → Tooltip mở bằng bàn phím và đóng bằng Esc.
- **FR-403** → Đổi ngôn ngữ giao diện thì chữ huy hiệu và tooltip đổi theo (nếu đã có bản dịch).
- **FR-601** → Chưa đăng nhập thì không xem được cấp ở đâu.
- **FR-602** → Không có màn hình nào cho thấy danh sách người đã gửi, chỉ có tên cấp.
- **FR-603** → Thẻ Kudo ẩn danh không hiện huy hiệu của người gửi.

## 11. Risks & Known Issues

| ID | Type | Description | Impact | Status |
|----|------|--------------|--------|--------|
| RISK-01 | risk | Lời tooltip của Figma viết ở ngôi "bạn" ("Có 1–4 người gửi Kudos cho bạn"), nhưng huy hiệu cũng hiện trên người khác | Người xem huy hiệu của đồng nghiệp đọc phải câu hướng tới chính mình | [NEEDS_DOMAIN_CONFIRMATION] |
| RISK-02 | risk | Cấp không có bản lưu nên không có sự kiện "lên cấp" sẵn cho thông báo | F013 phải tự phát hiện lên cấp, nếu không sẽ không có thông báo | [NEEDS_DOMAIN_CONFIRMATION] |

## 12. Dependencies

| Dependency | Type | Why this feature needs it | Evidence |
|------------|------|-----------------------------|----------|
| F003_KudosAuthoring | feature | Cung cấp dữ liệu Kudo (người gửi, người nhận, trạng thái) để đếm | FR-001, BR-001 |
| F001_Auth | feature | Hồ sơ Sunner và cổng đăng nhập | FR-601 |
| F007_AdminModeration | feature | Đổi Kudo sang Spam và gỡ Spam, làm cấp hạ hoặc trả lại | BR-001, D002 |
| F004_KudosFeed | feature | Nơi đầu tiên nhúng huy hiệu (thẻ Kudo); che người gửi ẩn danh | FR-101, FR-603 |
| F012_Profile | feature | Nhúng huy hiệu cạnh tên profile | FR-101 |
| F014_AdminUserManagement | feature | Nhúng huy hiệu ở bảng người dùng Admin `[INFERRED]` | FR-101, D007 |
| F013_Notifications | feature | Báo "lên cấp Hero" dựa trên cùng quy tắc tính cấp | D005, RISK-02 |

## 13. Configuration

```text
HERO_NEW_MIN = 1        # từ 1 người gửi là New Hero
HERO_RISING_MIN = 5     # từ 5 người gửi là Rising Hero
HERO_SUPER_MIN = 10     # từ 10 người gửi là Super Hero
HERO_LEGEND_MIN = 21    # trên 20 người gửi là Legend Hero
```
