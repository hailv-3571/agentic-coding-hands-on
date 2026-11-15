---
status: implemented
authored_by: takumi
fcode: F004
created: 2026-11-08
lang: vi
---

# F004_KudosFeed — Technical Spec

**Priority**: P1
**Type**: ui
**Generated**: 2026-11-08

**See also:** [`functional-spec.md`](./functional-spec.md) — plain-language overview, open
decisions, requirements/business rules stated in one-liners, screens, user stories, scenarios,
edge cases, and configuration for a BA/QA audience.

**How to read this file:** § 2 is the index — pick the action you care about and read its block
in § 3 straight through; each block is one complete thread, top to bottom. § 4 is the shared
appendix — jump in only when a § 3 block points you there.

## 1. Technical Overview

Feature chỉ đọc: Sunner đã đăng nhập xem Highlight Kudos, feed All Kudos, chi tiết Kudo, sao chép liên kết và tìm Sunner. Dữ liệu Kudo do F003 ghi, số tim do F005 cung cấp, trạng thái Public/Spam do F007 quyết định, Phòng ban/hồ sơ do F001. Truy vấn chạy phía server (Next.js App Router + Drizzle trên Supabase Postgres), trình duyệt chỉ nhận dữ liệu đã che người gửi ẩn danh. Tên handler dưới đây là tên dự kiến (planned); cách nối Route Handler / Server Component sẽ chốt khi triển khai.

## 2. Action Index

| # | Action (handler) | Method · Path | Codes | Writes | Detail |
|---|---|---|---|---|---|
| **A0** | *cross-cutting — belongs to no single action* | — | FR-002, FR-601 | — | § 4.4 |
| **A1** | `KudosFeedHandler#highlight` (planned) | `GET` `/api/kudos/highlight` | FR-001, FR-101, FR-201, FR-202, FR-203, FR-204, FR-401, FR-402, FR-602, BR-001, BR-002, BR-003, BR-004, US001, US002 | — *(read-only)* | § 3.1 |
| **A2** | `KudosFeedHandler#list` (planned) | `GET` `/api/kudos` | FR-001, FR-205, FR-301, FR-302, FR-304, FR-402, FR-602, BR-001, BR-003, BR-005, BR-006, DEC-001, US003 | — *(read-only)* | § 3.2 |
| **A3** | `KudosFeedHandler#detail` (planned) | `GET` `/api/kudos/{id}` | FR-001, FR-102, FR-305, FR-403, FR-602, BR-001, BR-003, US004 | — *(read-only)* | § 3.3 |
| **A4** | `KudoCard#copyLink` (planned, client only) | — | FR-303, FR-404, US005 | — *(client only, no server write)* | § 3.3 |
| **A5** | `SunnerSearchHandler#search` (planned) | `GET` `/api/sunners/search` | FR-206, US006 | — *(read-only)* | § 3.4 |

## 3. Actions

### 3.1 CAP-01 — Xem Highlight Kudos

#### A1 · Lấy Highlight Kudos (có lọc)
`GET /api/kudos/highlight` → `` `KudosFeedHandler#highlight` (planned) ``
`FR-001` `FR-101` `FR-201` `FR-202` `FR-203` `FR-204` `FR-401` `FR-402` `FR-602` `BR-001` `BR-002` `BR-003` `BR-004` `DEC-001` `US001` `US002` · `TBD (draft)`

**Who** · Sunner đã đăng nhập *(gate A0 — § 4.4)*
**FE** · Vùng Highlight của Live board vẽ carousel (một thẻ giữa rõ nét, hai thẻ bên mờ), hai dropdown lọc Hashtag/Phòng ban, nút trước/sau và chỉ số "n/N". Đổi lọc thì gọi lại action và đặt carousel về thẻ đầu (FR-401). Danh sách lựa chọn Hashtag lấy từ danh sách của F003, Phòng ban từ F001. Thẻ dùng chung component thẻ Kudo với A2 (nhánh ẩn danh theo DEC-001, giải thích ở A2).
**Request** · param `hashtag` *(id, tuỳ chọn; vắng = Tất cả)*, `department` *(id, tuỳ chọn; vắng = Tất cả)*; kiểm bằng Zod
**BE** · `` `KudosFeedHandler#highlight` (planned) `` — chọn Kudo Public (BR-001, chỉ Kudo Public xuất hiện), áp lọc, xếp theo tim, lấy 5 bài, che người gửi ẩn danh (BR-003, Kudo ẩn danh không lộ người gửi). Trả mảng rỗng khi không khớp để FE hiện trạng thái trống (FR-402).
**Rule**
- **BR-002 — Highlight lấy 5 Kudo nhiều tim nhất sau lọc, bằng tim thì bài mới hơn trước.** Số lượng lấy từ `HIGHLIGHT_COUNT` (§ 4.6). Tiêu chí còn chờ xác nhận (D001). TBD (draft)
- **BR-004 — Hashtag và Phòng ban cùng phải khớp (AND); vắng tham số nghĩa là không lọc.** Phòng ban tính theo người nhận (mặc định, D002). TBD (draft)
- **BR-001 — Chỉ Kudo Public được trả về.** *(§ 4.4)*
- **BR-003 — Kudo ẩn danh không bao giờ trả định danh người gửi.** *(§ 4.4)*
**Result** · read-only — không ghi DB. Trả tối đa 5 thẻ đã che; tổng số thẻ cho chỉ số trang.
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (chỉ đọc, đồng bộ). -->

---

### 3.2 CAP-02 — Duyệt feed All Kudos

#### A2 · Lấy trang feed All Kudos
`GET /api/kudos` → `` `KudosFeedHandler#list` (planned) ``
`FR-001` `FR-205` `FR-301` `FR-302` `FR-304` `FR-402` `FR-602` `BR-001` `BR-003` `BR-005` `BR-006` `DEC-001` `US003` · `TBD (draft)`

**Who** · Sunner đã đăng nhập; Chủ Kudo thấy thêm nút sửa trên bài của mình *(gate A0 — § 4.4)*
**FE** · Vùng All Kudos vẽ danh sách thẻ Kudo (người gửi, người nhận kèm huy hiệu Hero từ F009, thời gian, danh hiệu, nội dung cắt gọn, ảnh, hashtag, số tim và nút tim của F005, Copy Link, Xem chi tiết) và nút "Tải thêm". Nút tim chỉ là chỗ cắm, hành vi do F005.
**Request** · param `cursor` *(chuỗi mờ, tuỳ chọn; vắng = trang đầu)*; kích thước trang cố định bởi `FEED_PAGE_SIZE` (§ 4.6)
**BE** · `` `KudosFeedHandler#list` (planned) `` — chọn Kudo Public, xếp mới nhất trước, phân trang theo cursor, gắn cờ `isOwner` bằng so khớp người gửi với phiên, che người gửi ẩn danh (BR-003, Kudo ẩn danh không lộ người gửi). Trả `nextCursor` (vắng khi hết).
**Rule** · quyết định cách dựng người gửi trên thẻ:

| DEC | subtype | Condition | What the user sees | Source |
|---|---|---|---|---|
| **DEC-001** | render | `kudo.isAnonymous = true` | nhãn "Ẩn danh" + ảnh đại diện mặc định thay cho tên, ảnh, phòng ban, huy hiệu người gửi; ngược lại hiện đầy đủ | TBD (draft) |

- **BR-005 — Feed xếp theo thời điểm gửi, mới nhất trước; bằng nhau thì theo id giảm dần để cursor ổn định.** TBD (draft)
- **BR-006 — Nút sửa chỉ hiện khi `isOwner` đúng.** Quyết định ở server, FE không tự suy từ id. TBD (draft)
- **BR-001 — Chỉ Kudo Public được trả về.** *(§ 4.4)*
- **BR-003 — Kudo ẩn danh không bao giờ trả định danh người gửi, kể cả `isOwner` chỉ gửi cho chính chủ.** *(§ 4.4)*
**Result** · read-only — không ghi DB. Trang thẻ đã che + `nextCursor`. Không có Kudo thì trả mảng rỗng và FE hiện trạng thái trống (FR-402).
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (chỉ đọc, đồng bộ). -->

---

### 3.3 CAP-03 — Xem chi tiết và sao chép liên kết Kudo

#### A3 · Lấy chi tiết một Kudo
`GET /api/kudos/{id}` → `` `KudosFeedHandler#detail` (planned) ``
`FR-001` `FR-102` `FR-305` `FR-403` `FR-602` `BR-001` `BR-003` `US004` · `TBD (draft)`

**Who** · Sunner đã đăng nhập *(gate A0 — § 4.4)*
**FE** · Trang chi tiết (dạng trang riêng theo mặc định D004) hiện toàn bộ lời nhắn, mọi ảnh, hashtag, số tim, Copy Link; Kudo không có thì dùng trang "không tìm thấy" của F002 (FR-403).
**Request** · param `id` *(uuid, Zod)*
**BE** · `` `KudosFeedHandler#detail` (planned) `` — đọc Kudo theo id, chỉ Public (BR-001, chỉ Kudo Public xuất hiện), che người gửi ẩn danh (BR-003, Kudo ẩn danh không lộ người gửi). Không có hoặc không Public đều trả cùng một kết quả "không tìm thấy" để không lộ việc Kudo tồn tại.
**Rule**
- **BR-001 — Chỉ Kudo Public được trả về.** *(§ 4.4)*
- **BR-003 — Kudo ẩn danh không bao giờ trả định danh người gửi.** *(§ 4.4)*
**Result** · read-only — không ghi DB. Trả bản chi tiết đã che, hoặc "không tìm thấy" (404).
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (chỉ đọc, đồng bộ). -->

---

#### A4 · Sao chép liên kết Kudo *(client only)*
`—` → `` `KudoCard#copyLink` (planned) ``
`FR-303` `FR-404` `US005` · `TBD (draft)`

**Who** · Sunner đã đăng nhập
**FE** · Nút Copy Link trên thẻ và trên trang chi tiết ghi địa chỉ cố định của Kudo (dạng `{origin}/kudos/{id}`, route chốt ở D004) vào bộ nhớ tạm, rồi hiện thông báo thành công (FR-404); nếu trình duyệt từ chối thì hiện thông báo lỗi kèm liên kết để sao chép tay.
**Result** · không gọi server, không ghi DB. Người mở liên kết đi qua A0 rồi A3.
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (thuần client). -->

---

### 3.4 CAP-04 — Tìm profile Sunner

#### A5 · Tìm Sunner theo tên
`GET /api/sunners/search` → `` `SunnerSearchHandler#search` (planned) ``
`FR-206` `US006` · `TBD (draft)`

**Who** · Sunner đã đăng nhập *(gate A0 — § 4.4)*
**FE** · Ô tìm trên Live board gõ tới đâu gợi ý tới đó (có debounce), chọn kết quả thì mở profile (F012; đích đến `TBD (draft)` chờ screen-flow).
**Request** · param `q` *(chuỗi 1–50 ký tự, Zod)*
**BE** · `` `SunnerSearchHandler#search` (planned) `` — khớp tên và email trên hồ sơ Sunner của F001 (mặc định D007), trả tối đa một số ít kết quả (id, tên, ảnh, phòng ban). Nếu F003 đã có endpoint tìm người nhận thì dùng chung, không làm bản thứ hai (DRY).
**Result** · read-only — không ghi DB. Danh sách gợi ý hoặc mảng rỗng (FE hiện "Không tìm thấy Sunner nào").
**Source:** TBD (draft)

<!-- Không có diagram: dưới ngưỡng (chỉ đọc, đồng bộ). -->

---

### 3.5 Edge cases

| Action | Scenario | Behavior |
|---|---|---|
| A1 | Không Kudo nào khớp hai bộ lọc, hoặc ít hơn 5 Kudo đủ điều kiện | Trả mảng rỗng / số thẻ thực có; FE hiện trạng thái trống hoặc chỉ số theo số thật |
| A1 · A2 | Kudo bị Mark Spam giữa hai lần gọi | Lần gọi sau không còn Kudo đó; không cần huỷ cache thủ công nếu không cache (xem § 5.3) |
| A2 | Hai Kudo cùng thời điểm gửi | Phân xử theo id giảm dần (BR-005) để cursor không lặp hay sót |
| A2 | `cursor` hỏng hoặc hết hạn | Trả lỗi 400 với thông điệp chung; FE hiện lỗi và cho thử lại từ trang đầu |
| A3 | `id` không phải uuid, không tồn tại, hoặc Kudo không Public | Cùng một phản hồi 404, không phân biệt được ba trường hợp |
| A4 | Trình duyệt chặn ghi bộ nhớ tạm | Hiện lỗi kèm liên kết để sao chép tay |
| A5 | `q` rỗng hoặc dài quá giới hạn | 400 từ Zod; FE không gửi khi `q` rỗng |
| A1-A5 | Chưa đăng nhập | Chuyển về màn đăng nhập (trang) hoặc 401 (dữ liệu) — cite A0 § 4.4 |

## 4. Shared Foundation

### 4.1 Components

| Component | Responsibility | Used in | File |
|---|---|---|---|
| `KudosFeedHandler` (planned) | Điểm vào đọc Highlight, feed, chi tiết | A1, A2, A3 | `TBD (draft)` |
| `KudoCard` (planned) | Thẻ Kudo dùng chung (nhánh ẩn danh, Copy Link, nút sửa, chỗ cắm tim/huy hiệu) | A1, A2, A3, A4 | `TBD (draft)` |
| `KudoPublicQuery` (planned) | Truy vấn Drizzle dùng chung: lọc Public + che người gửi ẩn danh | A1, A2, A3 | `TBD (draft)` |
| `SunnerSearchHandler` (planned) | Tìm Sunner theo tên/email | A5 | `TBD (draft)` |

### 4.2 Data Model

Feature này chỉ ĐỌC các thực thể do feature khác sở hữu; không có bảng mới.

| Entity | Table | Used for | Action |
|---|---|---|---|
| Kudo *(F003)* | `TBD (draft)` | Nội dung, người gửi/nhận, danh hiệu, cờ ẩn danh, trạng thái Public/Spam *(F007)*, thời gian | A1-A3 |
| Hashtag của Kudo *(F003)* | `TBD (draft)` | Lọc Highlight, hiển thị hashtag | A1-A3 |
| Ảnh đính kèm *(F003)* | `TBD (draft)` | Hiển thị ảnh trên thẻ/chi tiết | A2, A3 |
| Tim *(F005)* | `TBD (draft)` | Số tim để xếp Highlight và hiển thị | A1-A3 |
| Hồ sơ Sunner, Phòng ban *(F001)* | `TBD (draft)` | Người gửi/nhận, lọc Phòng ban, tìm kiếm | A1-A3, A5 |

#### Polymorphic Behavior

TBD (draft) — cờ ẩn danh (boolean, đổi nhánh dựng thẻ) và trạng thái Public/Spam là ứng viên discriminator do F003/F007 sở hữu; mã DISC-### được cấp khi data model được promote, không cấp ở đây.

### 4.3 State Management

None.

<!-- Trạng thái carousel (trang hiện tại, bộ lọc) là state UI cục bộ dưới ngưỡng (≥3 trạng thái hoặc ≥2 chuyển tiếp) nên không lập SM-###. -->

### 4.4 Shared Rules

#### Bin 3 — cross-cutting, belongs to no single action

**A0 · FR-601 / FR-002 — mọi action yêu cầu phiên đăng nhập hợp lệ và feature này không bao giờ ghi dữ liệu Kudo.**
Kiểm phiên Supabase Auth (Google, `@sun-asterisk.com`) ở lớp dùng chung của trang và route dữ liệu, trước khi chạy truy vấn; không có phiên thì chuyển về đăng nhập (trang) hoặc trả 401 (dữ liệu). Truy vấn của feature chỉ dùng câu SELECT. Cơ chế phiên thuộc F001; không phải rule riêng của feature này.
**Source:** TBD (draft)

#### Bin 2 — used by ≥2 named actions

**BR-001 — Chỉ Kudo ở trạng thái Public được hiển thị.**
Used in: **A1** · **A2** · **A3**. Mọi truy vấn đọc Kudo đi qua `KudoPublicQuery` (planned) để điều kiện Public không bị quên ở nơi nào.
**Source:** TBD (draft)
```text
kudosVisibleToViewers = SELECT kudos WHERE status = 'public'
# A1, A2, A3 đều bắt đầu từ tập này; Spam/khác -> không bao giờ vào kết quả
```

**BR-003 — Kudo ẩn danh không lộ người gửi ở bất kỳ dữ liệu nào đến trình duyệt.**
Used in: **A1** · **A2** · **A3**. Che ở server (không chọn cột người gửi khi `isAnonymous`), không dựa vào FE ẩn đi. Drizzle chạy bằng vai trò server nên bỏ qua RLS của Supabase; vì vậy việc che phải nằm trong `KudoPublicQuery`, không trông vào RLS.
**Source:** TBD (draft)
```text
for each kudo in result:
  if kudo.isAnonymous:
    drop sender.{id,name,avatar,department,heroLevel}
    mask sender = { anonymous: true }
  isOwner = (viewer.id == kudo.senderId)   # tính ở server; chỉ cấp cho chính chủ
```

### 4.5 Algorithms & Integrations

None.

<!-- Không có ALG/INT: xếp hạng Highlight là ORDER BY + LIMIT (BR-002), không có dịch vụ ngoài; realtime thuộc F008. -->

### 4.6 Configuration

```text
HIGHLIGHT_COUNT = 5     # số thẻ tối đa trong carousel (A1) — mặc định đề xuất, D001
FEED_PAGE_SIZE = 10     # số Kudo mỗi lần nạp (A2) — mặc định đề xuất, D003
```

**Client behavior:** see
[`behavior-logic.md`](../../docs/generated/behavior-logic.md) (client-side patterns — debounce, optimistic UI, polling, upload, realtime),
[`permissions.md`](../../docs/system/permissions.md) (feature flags / experiments / env / locale gates),
[`architecture.md`](../../docs/system/architecture.md) (guards / deep-link state restoration / unsaved-changes protection).

## 5. Verification & Technical Notes

### 5.1 Technical Verification

- **SC-001** *(A1, A2, A3)* Kudo Spam không xuất hiện ở bất kỳ action nào (covers FR-001, BR-001)
- **SC-002** *(A1, A2, A3)* Phản hồi của Kudo ẩn danh không chứa trường định danh người gửi (covers FR-602, BR-003)
- **SC-003** *(A1)* Highlight trả đúng 5 bài nhiều tim nhất sau lọc AND (covers FR-203, FR-204, BR-002, BR-004)
- **SC-004** *(A2)* Hai lần nạp liên tiếp bằng `nextCursor` không lặp, không sót (covers FR-205, BR-005)
- **SC-005** *(A3)* Id lạ, id đã Spam đều trả cùng 404 (covers FR-403)
- **SC-006** *(A1-A5)* Không phiên thì không có dữ liệu (covers FR-601)

#### US001_ViewHighlightKudos *(A1)*

**Independent Test:** Có ≥6 Kudo Public với số tim khác nhau; gọi A1 không lọc.

**Acceptance Scenarios:**

1. **Given** 8 Kudo Public, **When** gọi A1, **Then** trả 5 bài nhiều tim nhất, bằng tim thì bài mới hơn trước.
2. **Given** một Kudo nhiều tim nhất bị Spam, **When** gọi A1, **Then** bài đó không có trong kết quả.

#### US002_FilterHighlightKudos *(A1)*

**Independent Test:** Dữ liệu có hashtag và phòng ban khác nhau; gọi A1 với từng tham số và cả hai.

**Acceptance Scenarios:**

1. **Given** hashtag H và phòng ban P, **When** gọi A1 với cả hai, **Then** mọi bài trả về mang H và người nhận thuộc P.
2. **Given** không bài nào khớp, **When** gọi A1, **Then** trả mảng rỗng, không lỗi.

#### US003_BrowseAllKudos *(A2)*

**Independent Test:** 25 Kudo Public gồm 1 bài ẩn danh; gọi A2 ba lần theo cursor.

**Acceptance Scenarios:**

1. **Given** 25 bài, **When** nạp ba trang, **Then** thấy 10, 10, 5 bài, mới nhất trước, trang cuối không có `nextCursor`.
2. **Given** bài ẩn danh, **When** gọi A2, **Then** thẻ của bài đó không có định danh người gửi; `isOwner` chỉ đúng với chính chủ.

#### US004_ViewKudoDetail *(A3)*

**Independent Test:** Gọi A3 với id Public, id Spam, id lạ.

**Acceptance Scenarios:**

1. **Given** Kudo Public, **When** gọi A3, **Then** trả đủ lời nhắn, ảnh, hashtag, số tim.
2. **Given** id Spam hoặc id lạ, **When** gọi A3, **Then** cùng phản hồi 404.

#### US005_CopyKudoLink *(A4)*

**Independent Test:** Bấm Copy Link trên một thẻ, đọc bộ nhớ tạm.

**Acceptance Scenarios:**

1. **Given** quyền ghi bộ nhớ tạm, **When** bấm Copy Link, **Then** bộ nhớ tạm chứa địa chỉ Kudo và có thông báo thành công.
2. **Given** trình duyệt từ chối, **When** bấm Copy Link, **Then** hiện lỗi kèm liên kết để sao chép tay.

#### US006_SearchSunnerProfile *(A5)*

**Independent Test:** Gọi A5 với từ khoá có và không có kết quả.

**Acceptance Scenarios:**

1. **Given** Sunner "Nguyễn Văn An", **When** gọi A5 với `q=An`, **Then** kết quả có Sunner đó.
2. **Given** từ khoá không khớp, **When** gọi A5, **Then** trả mảng rỗng.

### 5.2 Assumptions

- *(A1, A2, A3)* F003/F005/F007 cung cấp đủ cột cần đọc (cờ ẩn danh, trạng thái Public/Spam, số tim) trong dữ liệu Postgres; feature này không tự thêm bảng.
- *(A1)* Số tim đọc được bằng truy vấn trực tiếp hoặc cột đếm sẵn do F005 quyết; mặc định đề xuất là cột đếm sẵn để xếp hạng nhanh.
- *(A1-A5)* Kết quả không cache ở bản đầu (mặc định), nên Mark Spam có hiệu lực ngay ở lần tải sau.

### 5.3 Unresolved Questions

1. **Cách nối dữ liệu trong Next.js 16** *(A1-A5)*: dùng Route Handler hay đọc thẳng trong Server Component? Phải đối chiếu `node_modules/next/dist/docs/` khi triển khai vì phiên bản này có thay đổi so với kiến thức cũ; tên và path ở đây chỉ là dự kiến.
2. **Cache và độ tươi** *(A1, A2)*: có cache kết quả không, và huỷ khi có Mark Spam / tim mới thế nào? Ảnh hưởng RISK-03.
3. **Cột đếm tim** *(A1)*: đếm sẵn hay tính lúc truy vấn, và chỉ mục nào cho ORDER BY tim? Do F005 quyết cùng.
4. **Dùng chung tìm người** *(A5)*: dùng chung endpoint với ô chọn người nhận của F003 hay tách?

### 5.4 Source References

Chưa có mã nguồn — xem `## 7. User Stories` trong `functional-spec.md` cho hành vi dự kiến.

#### Data Flow

```text
tham số lọc/cursor -> KudoPublicQuery (lọc Public, xếp hạng, che ẩn danh) -> thẻ JSON đã che -> KudoCard
```

### 5.5 Artifact References

| Artifact | File | Codes Used | Reviewed |
|----------|------|------------|----------|
| System Overview | [system-overview.md](../../docs/system/system-overview.md) | TBD (draft) | [ ] |
| Architecture | [architecture.md](../../docs/system/architecture.md) | TBD (draft) | [ ] |
| Feature List | [feature-list.md](../feature-list.md) | F004 | [x] |
| API Map | [api-map.md](../../docs/generated/api-map.md) | TBD (draft) | [ ] |
| Entities | [entities.md](../../docs/generated/entities.md) | TBD (draft) | [ ] |
| Screens | [functional-spec.md § 6](./functional-spec.md#6-screens) | TBD (draft) | [ ] |
| Behavior Logic | [behavior-logic.md](../../docs/generated/behavior-logic.md) | TBD (draft) | [ ] |
| Permissions Matrix | [permissions-matrix.md](../../docs/generated/permissions-matrix.md) | TBD (draft) | [ ] |
| User Stories | [user-stories.md](../../docs/generated/user-stories.md) | TBD (draft) | [ ] |

**Codes are written BARE — no braces.** Hàng chưa có mã thật ghi `TBD (draft)`.

**Rule:** Every code listed in Codes Used MUST exist in its source artifact. Orphan refs = reviewer critical.
