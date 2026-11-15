---
status: draft
authored_by: takumi
created: 2026-11-08
lang: vi
---
<!-- Contract: references/feature-spec-researcher-contract.md ; authoring delta: references/spec-authoring-contract.md (greenfield draft) -->

# F012_Profile — Technical Spec

**Priority**: P2
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`functional-spec.md`](./functional-spec.md) — plain-language overview, open
decisions, requirements/business rules stated in one-liners, screens, user stories, scenarios,
edge cases, and configuration for a BA/QA audience.

**How to read this file:** § 2 is the index — pick the action you care about and read its block
in § 3 straight through. § 4 is the shared appendix — jump in only when a § 3 block points you there.

## 1. Technical Overview

Feature chỉ đọc: hai trang profile (của mình, của người khác) và thẻ thông tin nhanh trên avatar. Trang là Server Component của Next.js App Router, dữ liệu qua Drizzle trên Supabase Postgres; khối nhúng do feature khác sở hữu (thẻ Kudo và `KudoPublicQuery` của F004, `HeroBadge` + `HeroTierQuery` của F009, `IconCollection` + `PersonalStatsPanel` của F010, `OwnSpamKudoQuery#listBySender` của F007, `KudoComposerModal` của F003) và được dùng lại nguyên tên, không đặc tả lại. Tên handler dưới đây là tên dự kiến (planned); cách nối Route Handler / Server Component sẽ chốt khi triển khai.

## 2. Action Index

| # | Action (handler) | Method · Path | Codes | Writes | Detail |
|---|---|---|---|---|---|
| **A0** | *cross-cutting — belongs to no single action* | — | FR-001, FR-002, FR-601 | — | § 4.4 |
| **A1** | `ProfilePage#showOwn` (planned) | `GET` `/profile` | FR-101, FR-201, FR-202, FR-203, FR-603, BR-004, BR-005, US001_ViewOwnProfile | — *(read-only)* | § 3.1 |
| **A2** | `ProfilePage#showOther` (planned) | `GET` `/profile/{userId}` | FR-102, FR-103, FR-104, FR-301, FR-302, FR-303, BR-004, BR-005, DEC-001, US002_ViewColleagueProfile | — *(read-only)* | § 3.2 |
| **A3** | `ProfileKudosHandler#list` (planned) | `GET` `/api/profile/{userId}/kudos` | FR-204, FR-205, FR-305, FR-401, FR-402, FR-405, FR-602, FR-603, FR-604, BR-001, BR-002, BR-003, BR-006, DEC-002, ALG-001, US003_BrowseOwnKudos, US004_BrowseColleagueKudos | — *(read-only)* | § 3.3 |
| **A4** | `ProfileSendKudoButton#open` (planned, client only) | — | FR-304, US005_SendKudoFromProfile | — *(client only, no server write)* | § 3.2 |
| **A5** | `SunnerCardHandler#get` (planned) | `GET` `/api/sunners/{userId}/card` | FR-403, FR-404, BR-005, BR-007, DEC-003, US006_PeekSunnerCard | — *(read-only)* | § 3.4 |

**Rung set** theo template: Who → FE → Request → BE → Rule → Result → State → Source. Rung vắng thì bỏ hẳn. **State** bỏ trong bản nháp vì chưa có nguồn xác nhận; feature không có state machine.

## 3. Actions

### 3.1 CAP-01 — Profile của mình

#### A1 · Dựng trang profile của chính mình
`GET /profile` → `` `ProfilePage#showOwn` (planned) ``
`FR-101` `FR-201` `FR-202` `FR-203` `FR-603` `BR-004` `BR-005` `US001_ViewOwnProfile` · `SCR-own-profile` (draft)

**Who** · Sunner đã đăng nhập, xem chính mình *(gate A0 — § 4.4)*
**FE** · Vào từ mục "Profile" của menu avatar (F002; FR-101). Trang gồm nền hero, avatar lớn giữa, tên (vàng), dòng "mã phòng ban · huy hiệu Hero", hàng 6 ô icon với chú thích "Bộ sưu tập icon của tôi", bảng `PersonalStatsPanel` (F010) và mục KUDOS. Mục KUDOS là vùng dùng chung, dữ liệu từ A3; trang nạp trang đầu của "Đã gửi" ngay trong server rồi giao cho client để đổi dropdown.
**Request** · không có tham số; `userId` luôn lấy từ phiên, không nhận từ client (FR-603)
**BE** · `` `ProfilePage#showOwn` `` gọi `ProfileQuery#getById` (planned; `profiles` nối `departments`), `HeroTierQuery#getTiersByRecipientIds([userId])` (F009), `IconCollectionQuery#forUser(userId)` (F010) và `PersonalRewardStatsQuery` (F010). Các truy vấn độc lập chạy song song.
**Rule**
- **BR-004 — Bảng thống kê chỉ dựng trên profile của chính mình.** Năm số do F010 tính; trang người khác không gọi truy vấn này. *(§ 4.4)*
- **BR-005 — Huy hiệu Hero chỉ dựng khi `HeroTierQuery` có trả cấp.** Không có khoá thì bỏ cả phần huy hiệu, không để chỗ trống. *(§ 4.4)*
**Result** · read-only — không ghi DB. Trả dữ liệu để vẽ header, icon, thống kê; không có hồ sơ tương ứng với phiên thì lỗi nội bộ (F001 luôn tạo hồ sơ lần đăng nhập đầu).
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (chỉ đọc, không ghi bảng, đồng bộ). -->

---

### 3.2 CAP-02 — Profile người khác

#### A2 · Dựng trang profile của một Sunner khác
`GET /profile/{userId}` → `` `ProfilePage#showOther` (planned) ``
`FR-102` `FR-103` `FR-104` `FR-301` `FR-302` `FR-303` `BR-004` `BR-005` `DEC-001` `US002_ViewColleagueProfile` · `SCR-other-profile` (draft)

**Who** · Sunner đã đăng nhập, xem đồng nghiệp *(gate A0 — § 4.4)*
**FE** · Vào từ avatar/tên trên thẻ Kudo (F004), kết quả `SunnerSearchHandler#search` (F004) hoặc thẻ nhanh (A5) — FR-102. Trang giống A1 ở phần header (FR-301), 6 ô icon hiện kèm tên bên dưới với chú thích "Bộ sưu tập icon của {tên}" (FR-302), KHÔNG có bảng thống kê (FR-303), có nút rộng của A4 và mục KUDOS nhãn "Đã nhận: n Kudos" không dropdown (dữ liệu từ A3).
**Request** · path param `userId` *(uuid, Zod kiểm; sai định dạng hoặc không có hồ sơ → trang không tìm thấy của F002, FR-104)*
**BE** · `` `ProfilePage#showOther` `` so `userId` với phiên; khác thì gọi `ProfileQuery#getById`, `HeroTierQuery#getTiersByRecipientIds([userId])`, `IconCollectionQuery#forUser(userId)`. Không gọi `PersonalRewardStatsQuery`.
**Rule** · quyết định trang nào dựng và địa chỉ canonical:

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-001** | flow | `userId == session.userId` | chuyển hướng về `/profile` (FR-103); mọi liên kết tới profile của mình đều đi qua đây nên có đúng một trang "của mình" | TBD (draft) |
| **DEC-001** | flow | `userId` không có hồ sơ | trang không tìm thấy (FR-104) | TBD (draft) |
| **DEC-001** | render | `userId != session.userId` và có hồ sơ | trang người khác, không bảng thống kê | TBD (draft) |

- **BR-004 — Bảng thống kê chỉ dựng trên profile của chính mình.** Trang này không dựng nó. *(§ 4.4)*
- **BR-005 — Huy hiệu Hero chỉ dựng khi có cấp; chưa có thì bỏ phần huy hiệu.** *(§ 4.4)*
**Result** · read-only — không ghi DB. Trả header, icon có tên, nhãn tên người; số Kudo nhận lấy từ A3.
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (chỉ đọc, đồng bộ). Route quyết định bởi DEC-001: `/profile` (mình) và `/profile/[userId]` (người khác) — tạm thời, D009. -->

---

#### A4 · Mở form viết Kudo với người nhận điền sẵn *(client only)*
`—` → `` `ProfileSendKudoButton#open` (planned) ``
`FR-304` `US005_SendKudoFromProfile` · `SCR-other-profile` (draft)

**Who** · Sunner đã đăng nhập, đang xem profile đồng nghiệp *(gate A0 — § 4.4)*
**FE** · Nút pill rộng "Gửi lời cảm ơn và ghi nhận tới {tên}" (FR-304) mở `KudoComposerModal` (F003) ở chế độ tạo, truyền `recipientId` và tên hiển thị. Người nhận khoá (D008). F003 chưa khai tham số điền sẵn nên cần F003 mở thêm (§ 5.3).
**Result** · không có gọi server của feature này; việc gửi do F003 xử lý.
**Source:** TBD (draft)

<!-- Không có diagram: thuần client, không gọi server. -->

---

### 3.3 CAP-03 — Kudo trên profile

#### A3 · Lấy một trang Kudo cho mục KUDOS của profile
`GET /api/profile/{userId}/kudos` → `` `ProfileKudosHandler#list` (planned) ``
`FR-204` `FR-205` `FR-305` `FR-401` `FR-402` `FR-405` `FR-602` `FR-603` `FR-604` `BR-001` `BR-002` `BR-003` `BR-006` `DEC-002` `ALG-001` `US003_BrowseOwnKudos` `US004_BrowseColleagueKudos` · `SCR-own-profile` (draft), `SCR-other-profile` (draft)

**Who** · Sunner đã đăng nhập; "Đã gửi" chỉ cho chủ profile *(gate A0 — § 4.4)*
**FE** · Vùng KUDOS dùng chung của hai trang. Trang mình: dropdown "Đã gửi (n)" / "Đã nhận (n)" mặc định Đã gửi (FR-204). Trang người khác: nhãn "Đã nhận: n Kudos", không dropdown (FR-305). Mỗi mục dựng bằng `KudoCard` (F004); thẻ Kudo Spam dựng bằng `KudoSpamCard` của F007 (thẻ cam "Spam", FR-205). Đổi dropdown thì gọi lại action và về trang đầu (FR-401); "Tải thêm" gửi `cursor` (FR-402); không có mục thì trạng thái trống (FR-405). Đổi nhanh liên tiếp: client bỏ kết quả cũ, chỉ nhận phản hồi của lần gọi cuối.
**Request** · path `userId` *(uuid)*; query `direction` *(`sent` | `received`; mặc định `received`, trang người khác chỉ chấp nhận `received`)*, `cursor` *(chuỗi mờ, tuỳ chọn; vắng = trang đầu)*; kiểm bằng Zod. Cỡ trang cố định bởi `PROFILE_KUDOS_PAGE_SIZE` (§ 4.6).
**BE** · `` `ProfileKudosHandler#list` (planned) `` kiểm `direction`, dựng danh sách theo DEC-002 qua `KudoPublicQuery` (F004, cần bộ lọc theo người nhận/người gửi — § 5.3). Với `sent`, gọi thêm `OwnSpamKudoQuery#listBySender` (F007) rồi gộp theo ALG-001. Trả `items`, `nextCursor`, `counts` `{ sent?, received }`.
**Rule** · quyết định danh sách dựng theo lựa chọn:

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-002** | render | `direction = received` | các Kudo Public mà `userId` nhận, người gửi ẩn danh bị che | TBD (draft) |
| **DEC-002** | render | `direction = sent` và `userId == session.userId` | Kudo Public mình gửi trộn với Kudo Spam của mình (thẻ "Spam") | TBD (draft) |
| **DEC-002** | flow | `direction = sent` và `userId != session.userId` | từ chối 403; không trả dữ liệu | TBD (draft) |

- **BR-001 — Danh sách "Đã nhận" chỉ có Kudo Public.** Mọi đọc Kudo đi qua `KudoPublicQuery`, không có đường truy vấn riêng bỏ điều kiện Public.
- **BR-002 — "Đã gửi" chỉ phục vụ chủ profile; bộ lọc người gửi không bao giờ nhận id từ client.** `senderId` gắn từ phiên. Nếu cho lọc theo người gửi của người khác, bộ lọc sẽ lộ người gửi của Kudo ẩn danh qua kết quả, nên bị chặn.
- **BR-003 — Kudo ẩn danh luôn trả thẻ đã che người gửi, kể cả trên "Đã gửi" của chính người gửi.** Dùng đúng việc che của `KudoPublicQuery`, không viết nhánh che thứ hai.
- **BR-006 — `counts` tính cùng điều kiện với danh sách.** `received` = số Kudo Public nhận; `sent` = số Kudo Public gửi + số Kudo Spam của mình, để số trong dropdown khớp số thẻ hiển thị (D006).
**Result** · read-only — không ghi DB. Một trang thẻ đã che, cursor tiếp theo và các số đếm.
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (chỉ đọc, đồng bộ, hai truy vấn gộp trong tiến trình — thứ tự gộp nằm ở ALG-001). -->

---

### 3.4 CAP-04 — Thẻ thông tin nhanh

#### A5 · Lấy dữ liệu thẻ nhanh của một Sunner khi rê chuột
`GET /api/sunners/{userId}/card` → `` `SunnerCardHandler#get` (planned) ``
`FR-403` `FR-404` `BR-005` `BR-007` `DEC-003` `US006_PeekSunnerCard` · `SCR-avatar-hover-card` (draft)

**Who** · Sunner đã đăng nhập, rê chuột lên avatar *(gate A0 — § 4.4)*
**FE** · Component client `AvatarHoverCard` bọc avatar: rê chuột/focus bàn phím thì avatar có vòng vàng và thẻ (~344×300) mở sau một khoảng trễ ngắn rồi gọi A5 (FR-403); rời chuột hoặc Esc thì đóng, bấm thẻ mở profile (FR-404, `[UNVERIFIED]` nội dung). Kết quả được nhớ tạm trong phiên trang để rê lại không gọi lại (RISK-01). Màn cảm ứng không bọc (D007).
**Request** · path `userId` *(uuid)*
**BE** · `` `SunnerCardHandler#get` (planned) `` đọc `ProfileQuery#getById` (tên, avatar, phòng ban) và `HeroTierQuery#getTiersByRecipientIds([userId])`; trả đúng các trường đó, không trả email, thống kê, hay Kudo.
**Rule** · quyết định avatar nào có thẻ:

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-003** | interaction | avatar thuộc Sunner thật (người nhận, hoặc người gửi không ẩn danh) | rê chuột mở thẻ nhanh | TBD (draft) |
| **DEC-003** | interaction | avatar là người gửi ẩn danh | không bọc, không có thẻ, không gọi A5 | TBD (draft) |

- **BR-007 — Chỉ Sunner thật có thẻ nhanh.** Dữ liệu thẻ không gắn với Kudo, nên người gửi ẩn danh không thể bị suy ra từ thẻ; thẻ chỉ mở từ avatar mà thẻ Kudo đã hiển thị danh tính.
- **BR-005 — Huy hiệu Hero chỉ có trên thẻ khi có cấp.** *(§ 4.4)*
**Result** · read-only — không ghi DB. Trả `{ id, fullName, avatarUrl, department, heroTier? }`.
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (chỉ đọc, đồng bộ). -->

---

### 3.5 Edge cases

| Action | Scenario | Behavior |
|---|---|---|
| A2 | `userId` là chính mình | 307 về `/profile` (DEC-001) |
| A2 | `userId` sai định dạng hoặc không có hồ sơ | 404, dùng trang lỗi của F002 |
| A1, A2 | Sunner chưa có phòng ban (`department_id` null — F001 gap) hoặc chưa có cấp Hero | bỏ phần thiếu, không để ô trống |
| A3 | `direction = sent` với `userId` không phải mình | 403, không trả dữ liệu (DEC-002) |
| A3 | `cursor` hỏng | 400, client về trang đầu |
| A3 | Kudo bị Spam/Un Spam giữa hai lần gọi | lần gọi sau phản ánh trạng thái mới; cursor ổn định nhờ khoá (thời điểm, id) |
| A3 | Đổi dropdown nhanh liên tiếp | client chỉ nhận phản hồi lần cuối |
| A5 | Dữ liệu thẻ lỗi | không hiện thẻ; bấm avatar vẫn mở profile |
| A1-A5 | Chưa đăng nhập | chuyển về đăng nhập (trang) hoặc 401 (dữ liệu) — A0 § 4.4 |

## 4. Shared Foundation

### 4.1 Components

| Component | Responsibility | Used in | File |
|---|---|---|---|
| `ProfilePage` (planned) | Server Component dựng hai trang profile | A1, A2 | `TBD (draft)` |
| `ProfileQuery` (planned) | Truy vấn Drizzle `profiles` nối `departments` theo id | A1, A2, A5 | `TBD (draft)` |
| `ProfileKudosHandler` (planned) | Route Handler danh sách Kudo của profile | A3 | `TBD (draft)` |
| `ProfileKudosSection` (planned) | Client component vùng KUDOS: dropdown, danh sách, Tải thêm, trạng thái trống/lỗi | A1, A2, A3 | `TBD (draft)` |
| `ProfileSendKudoButton` (planned) | Nút mở form viết Kudo điền sẵn người nhận | A4 | `TBD (draft)` |
| `SunnerCardHandler` (planned) | Route Handler dữ liệu thẻ nhanh | A5 | `TBD (draft)` |
| `AvatarHoverCard` (planned) | Client component bọc avatar, vòng vàng, thẻ nhanh; dùng lại ở thẻ Kudo của F004 | A5 | `TBD (draft)` |
| `KudoCard`, `KudoPublicQuery` *(F004)* | Thẻ Kudo và truy vấn Public + che ẩn danh | A3 | — |
| `KudoSpamCard`, `OwnSpamKudoQuery#listBySender` *(F007)* | Thẻ "Spam" và truy vấn Spam của chính người gửi | A3 | — |
| `HeroBadge`, `HeroTierQuery` *(F009)* | Huy hiệu và truy vấn cấp theo lô | A1, A2, A5 | — |
| `IconCollection`, `IconCollectionQuery#forUser`, `PersonalStatsPanel`, `PersonalRewardStatsQuery` *(F010)* | Icon, thống kê | A1, A2 | — |
| `KudoComposerModal` *(F003)* | Form viết Kudo | A4 | — |

### 4.2 Data Model

Feature này chỉ ĐỌC các thực thể do feature khác sở hữu; không có bảng mới.

| Entity | Table | Used for | Action |
|---|---|---|---|
| Hồ sơ Sunner, Phòng ban *(F001)* | `profiles`, `departments` | tên, avatar, phòng ban, role | A1, A2, A5 |
| Kudo *(F003)* | `TBD (draft)` | danh sách Đã gửi/Đã nhận, trạng thái Public/Spam *(F007)*, cờ ẩn danh | A3 |
| Icon của người dùng *(F010)* | `user_icons` | bộ sưu tập icon | A1, A2 |
| Hộp/tim *(F010, F005)* | `TBD (draft)` | năm số bảng thống kê | A1 |

#### Polymorphic Behavior

TBD (draft) — trạng thái Kudo Public/Spam (F007) và cờ ẩn danh (F003) là ứng viên discriminator do feature chủ sở hữu; mã DISC-### cấp khi data model được promote, không cấp ở đây.

### 4.3 State Management

None.

<!-- Trạng thái dropdown, trang đã nạp, thẻ nhanh đang mở là state UI cục bộ dưới ngưỡng (≥3 trạng thái hoặc ≥2 chuyển tiếp) nên không lập SM-###. -->

### 4.4 Shared Rules

#### Bin 3 — cross-cutting, belongs to no single action

**A0 · FR-601 / FR-002 / FR-001 — mọi action yêu cầu phiên đăng nhập hợp lệ, feature không bao giờ ghi dữ liệu, và dữ liệu profile luôn đọc từ hồ sơ của F001.**
Kiểm phiên Supabase Auth (Google, `@sun-asterisk.com`) ở lớp proxy dùng chung và ở route dữ liệu, trước khi chạy truy vấn; không có phiên thì chuyển về đăng nhập (trang) hoặc 401 (dữ liệu). Truy vấn của feature chỉ dùng SELECT; không có action sửa tên/avatar (D001). Cơ chế phiên thuộc F001; không phải rule riêng của feature này.
**Source:** TBD (draft)

#### Bin 2 — used by ≥2 named actions

**BR-004 — Bảng thống kê cá nhân chỉ dựng cho chính chủ.**
Used in: **A1** · **A2**. A1 gọi `PersonalRewardStatsQuery` bằng id lấy từ phiên; A2 không gọi và không dựng `PersonalStatsPanel`. Drizzle chạy bằng vai trò server nên bỏ qua RLS, vì vậy việc loại trừ nằm ở code của trang chứ không trông vào RLS.
**Source:** TBD (draft)
```text
if route == own:  stats = PersonalRewardStatsQuery(session.userId); render PersonalStatsPanel
else:             render nothing  # không có đường nào truyền userId khác vào truy vấn thống kê
```

**BR-005 — Huy hiệu Hero chỉ dựng khi `HeroTierQuery` có trả cấp.**
Used in: **A1** · **A2** · **A5**. `HeroTierQuery` trả bản đồ không có khoá cho người chưa có cấp (F009); host bỏ phần huy hiệu thay vì dựng ô trống. Lỗi truy vấn → bỏ huy hiệu, không bao giờ dựng cấp sai.
**Source:** TBD (draft)
```text
tier = HeroTierQuery([userId])[userId]
if tier exists: render HeroBadge(tier) else: omit
```

### 4.5 Algorithms & Integrations

### Gộp Kudo Spam của chính chủ vào trang "Đã gửi" theo thời gian (ALG-001)
**Linked FR:** FR-205
**Used in:** A3
**Source:** TBD (draft)
**Input:** một trang Kudo Public mình gửi (đã sắp mới nhất trước) + toàn bộ Kudo Spam của mình (mảng nhỏ) · **Output:** một trang đã gộp + `nextCursor` · **Complexity:** O(p + s) với p là cỡ trang, s là số Spam
**Description:** Trang Public đi theo cursor nên có biên thời gian; Spam không phân trang. Mỗi trang lấy những Spam nằm trong biên của trang Public đó, để thứ tự toàn cục là (thời điểm, id) giảm dần và cursor không bỏ sót hay lặp.

**Pseudocode:**
```text
page = public.sent(cursor, N)                      # sắp (createdAt desc, id desc)
upper = cursor ? cursor.key : +inf
lower = page.length == N ? page.last.key : -inf    # trang chưa đầy: lấy tới hết
spam  = ownSpam.filter(k => lower < k.key <= upper)
items = merge(page, spam) sorted by key desc
nextCursor = page.length == N ? page.last.key : null
```

### 4.6 Configuration

```text
PROFILE_KUDOS_PAGE_SIZE = TBD (draft)     # số Kudo mỗi lần nạp (A3); đề xuất dùng lại giá trị của feed F004
HOVER_CARD_OPEN_DELAY_MS = TBD (draft)    # trễ trước khi mở thẻ và gọi A5 (A5)
```

**Client behavior:** see
[`behavior-logic.md`](../../docs/generated/behavior-logic.md) (client-side patterns — debounce, optimistic UI, polling, upload, realtime),
[`permissions.md`](../../docs/system/permissions.md) (feature flags / experiments / env / locale gates),
[`architecture.md`](../../docs/system/architecture.md) (guards / deep-link state restoration / unsaved-changes protection).

## 5. Verification & Technical Notes

### 5.1 Technical Verification

- **SC-001** *(A2)* `userId` bằng phiên thì phản hồi chuyển hướng về trang của mình; id lạ thì 404 (covers FR-103, FR-104, DEC-001)
- **SC-002** *(A1, A2)* Trang của mình có bảng thống kê, trang người khác không có bất kể cách vào (covers FR-203, FR-303, BR-004)
- **SC-003** *(A3)* Không có kịch bản nào để Sunner A lấy được `direction=sent` của Sunner B; gọi thử trả 403 (covers FR-603, BR-002, DEC-002)
- **SC-004** *(A3, A5)* Kudo ẩn danh không để lộ định danh người gửi trong phản hồi của A3 (trên profile của người nhận lẫn của người gửi) và không có thẻ nhanh (covers FR-602, BR-003, BR-007, DEC-003)
- **SC-005** *(A3)* Kudo Spam chỉ xuất hiện trong "Đã gửi" của chính người gửi, kèm thẻ "Spam"; không xuất hiện trong "Đã nhận" của ai (covers FR-604, BR-001, BR-002)
- **SC-006** *(A3)* `counts` khớp số thẻ thực tế trong từng danh sách khi duyệt hết các trang (covers BR-006, FR-204, FR-305)

#### US003_BrowseOwnKudos *(A3)*

**Independent Test:** Có Sunner với Kudo Public gửi, Kudo Spam gửi và Kudo nhận; mở profile, chuyển dropdown hai chiều.

**Acceptance Scenarios:**

1. **Given** có Kudo Public và Spam đã gửi, **When** mở "Đã gửi", **Then** hai loại trộn theo thời gian, Spam có thẻ "Spam".
2. **Given** ở "Đã gửi", **When** chọn "Đã nhận", **Then** danh sách tải lại từ đầu chỉ với Kudo Public nhận.

#### US006_PeekSunnerCard *(A5)*

**Independent Test:** Rê chuột lên avatar người gửi không ẩn danh trên thẻ Kudo, rồi lên avatar ẩn danh.

**Acceptance Scenarios:**

1. **Given** avatar Sunner thật, **When** rê chuột, **Then** có vòng vàng và thẻ.
2. **Given** thẻ Kudo ẩn danh, **When** rê chuột lên avatar mặc định, **Then** không có thẻ và không có gọi mạng.

### 5.2 Assumptions

- *(A1, A2)* Next.js 16 App Router cho phép trang là Server Component gọi thẳng Drizzle; route dữ liệu chỉ cần cho vùng client (A3, A5). `[UNVERIFIED]` — cần đối chiếu tài liệu Next.js trong `node_modules/next/dist/docs/` khi triển khai (AGENTS.md cảnh báo phiên bản có thay đổi phá vỡ).
- *(A3)* Số Kudo Spam của một Sunner nhỏ nên A5 của F007 trả toàn bộ không cần phân trang, đủ cho ALG-001.
- *(A5)* Nội dung thẻ nhanh là avatar, tên, phòng ban, huy hiệu Hero. `[UNVERIFIED]` — Figma 721:5827 / 2268:35101 chưa chụp được nội dung.

### 5.3 Unresolved Questions

1. **Bộ lọc của `KudoPublicQuery`** *(A3)*: F004 chưa khai lọc theo người nhận/người gửi và cursor theo (thời điểm, id) cho từng người; cần F004 mở thêm hay F012 viết truy vấn riêng bọc lại phần che ẩn danh?
2. **Tham số điền sẵn của `KudoComposerModal`** *(A4)*: F003 chưa khai `recipientId` điền sẵn/khoá; F003 D014 còn ghi lối vào từ profile là "chưa có thiết kế xác nhận".
3. **Nguồn dữ liệu số "Kudos bạn nhận/đã gửi/tim nhận"** *(A1)*: dùng `PersonalRewardStatsQuery` của F010 nguyên trạng, hay định nghĩa riêng (có tính Spam, ẩn danh?) — cần khớp với `counts` của A3 (BR-006).
4. **Cách vẽ avatar có thẻ nhanh trong thẻ Kudo của F004** *(A5)*: F004 bọc `AvatarHoverCard` hay F012 xuất component để F004 dùng?

### 5.4 Source References

No source code written yet — see `## 7. User Stories` in functional-spec.md for planned behavior.

### 5.5 Artifact References

| Artifact | File | Codes Used | Reviewed |
|----------|------|------------|----------|
| System Overview | [system-overview.md](../../docs/system/system-overview.md) | TBD (draft) | [ ] |
| Architecture | [architecture.md](../../docs/system/architecture.md) | TBD (draft) | [ ] |
| Feature List | [feature-list.md](../feature-list.md) | F012 | [x] |
| API Map | [api-map.md](../../docs/generated/api-map.md) | TBD (draft) | [ ] |
| Entities | [entities.md](../../docs/generated/entities.md) | TBD (draft) | [ ] |
| Screens | [functional-spec.md § 6](./functional-spec.md#6-screens) | TBD (draft) | [ ] |
| Behavior Logic | [behavior-logic.md](../../docs/generated/behavior-logic.md) | TBD (draft) | [ ] |
| Permissions Matrix | [permissions-matrix.md](../../docs/generated/permissions-matrix.md) | TBD (draft) | [ ] |
| User Stories | [user-stories.md](../../docs/generated/user-stories.md) | TBD (draft) | [ ] |
