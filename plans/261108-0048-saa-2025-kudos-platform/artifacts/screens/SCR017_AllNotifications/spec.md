---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR017_AllNotifications — Screen Spec

**Screen**: SCR017_AllNotifications: AllNotifications
**Feature**: F013_Notifications
**Type**: atomic
**Route**: /notifications
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner xem toàn bộ thông báo của mình (nhận Kudo, nhận tim, được cấp Secret Box, lên bậc Hero, Kudo bị ẩn, đủ bộ icon, Kudos Quốc Dân), đánh dấu đã đọc và đi tới đối tượng liên quan; họ vào màn này từ nút "Xem tất cả" ở dropdown chuông hoặc mở trực tiếp.
**Actors:** Sunner (người dùng đã đăng nhập, đã có đơn vị). Mỗi người chỉ thấy thông báo của chính mình.
**Entry Conditions:** Có phiên hợp lệ và hồ sơ đã có đơn vị; khách và người chưa có đơn vị bị chuyển đi trước khi trang render.
**Exit Conditions:** Người dùng bấm một dòng để sang Kudo, Live board, hồ sơ của mình hoặc trang Tiêu chuẩn cộng đồng; hoặc ở lại đánh dấu đọc và cuộn xem thêm.

## 2. Screen Layout

### Layout Sketch

Trang nằm trong layout nhóm `(app)`: header dính trên cùng (có chuông), phần thân và footer. Thân trang có ảnh keyvisual Live board chạy ngầm dưới header (`-mt-20`), phía trên là một panel 680 px canh giữa (nền tối, bo góc 16) gồm hàng tiêu đề "Thông báo" kèm nút "Đánh dấu đọc tất cả", rồi danh sách dòng thông báo mới nhất lên đầu. Danh sách cuộn theo trang (không có hộp cuộn riêng); một điểm neo vô hình dưới dòng cuối kích hoạt tải thêm. Trong lúc route tải, `loading.tsx` hiện panel khung xương nhưng không có keyvisual. (`app/(app)/notifications/page.tsx:24-27`, `features/notifications/components/notification-list-page-client.tsx:47-67`, `app/(app)/notifications/loading.tsx:6-17`)

```
┌─────────────────────────────────────────────┐
│ R1: App Header (sticky)   [bell] [avatar]   │
├─────────────────────────────────────────────┤
│  (R2: keyvisual nền, absolute, sau panel)   │
│  ┌───────────────────────────────────────┐  │
│  │ R3: Notification Panel (static, 680)  │  │
│  │  Thông báo        [✓ Đánh dấu đọc ...]│  │
│  │  ● icon  nội dung thông báo ...       │  │
│  │    icon  nội dung ...        1 giờ trước│ │
│  │  - - -  Đang tải thêm / lỗi + Thử lại │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│ R4: App Footer (static)                     │
└─────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | App Header | sticky | no | AppHeader, NotificationBellSlot (thuộc SCR003_AppLayout, không mô tả lại) |
| R2 | Keyvisual Background | absolute | no | LiveBoardKeyvisualBackground |
| R3 | Notification Panel | static | no | NotificationListPageClient, NotificationList, NotificationRow, NotificationTypeIcon |
| R4 | App Footer | static | no | AppFooter |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Ảnh keyvisual nền | image | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Tiêu đề "Thông báo" (h1) | display field | — | Visible | Always | — | static | raw | — | N/A |
| E03 | Đánh dấu đọc tất cả | button | — | Enabled | Always | Đánh dấu mọi thông báo đã đọc | — | — | — | N/A |
| E04 | Danh sách thông báo | list | — | Rỗng cho tới khi tải xong trang đầu | Conditional | — | API field | mới nhất lên đầu, 20 dòng mỗi lượt | Bạn chưa có thông báo nào | MODEL016_Notification |
| E05 | Biểu tượng loại thông báo (7 loại) | image | — | Visible | Conditional | — | API field | 40×40 | — | MODEL016_Notification.type (DISC-006) |
| E06 | Nội dung thông báo (cả dòng là liên kết) | link | — | Visible | Conditional | Đánh dấu đã đọc rồi mở đối tượng liên quan | API field | 1–2 dòng chữ theo loại, theo locale | — | MODEL016_Notification.params |
| E07 | Liên kết "Tiêu chuẩn cộng đồng" | link | — | Hidden | Conditional | Mở trang Tiêu chuẩn cộng đồng | static | raw | hidden | N/A |
| E08 | Thời gian tương đối ("Vừa xong", "15 phút trước"…) | display field | — | Visible | Conditional | — | computed | thời gian tương đối, làm tươi mỗi phút | — | MODEL016_Notification.occurred_at |
| E09 | Chấm đỏ chưa đọc | image | — | Hidden | Conditional | — | API field | chấm 8 px | hidden | MODEL016_Notification.read_at |
| E10 | Dòng trạng thái đang tải ("Đang tải thông báo…", khung xương) | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E11 | Trạng thái rỗng "Bạn chưa có thông báo nào" | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E12 | Lỗi "Không tải được thông báo. Vui lòng thử lại." | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E13 | Thử lại | button | — | Enabled | Conditional | Tải lại danh sách / tải lại đợt đang lỗi | — | — | — | N/A |
| E14 | Dòng "Đang tải thêm thông báo…" | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |

Ghi chú: E05–E09 lặp theo từng dòng. Thông báo `heart_received` có số lần tim được gộp vào một dòng (đếm "# lượt tim" trong câu). Điểm neo cuộn vô hạn là phần tử ẩn (`aria-hidden`, cao 1 px) nên không có hàng riêng.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Đánh dấu đọc tất cả | E03 | click | Không đang xử lý lần trước | Mọi dòng đã tải chuyển thành đã đọc ngay (bỏ chấm đỏ), chuông tắt chấm ngay; nếu server từ chối thì các dòng hoàn lại chưa đọc | `features/notifications/components/notification-list-page-client.tsx:37-44`, `features/notifications/hooks/use-notification-list.ts:151-158` |
| Mở thông báo | E06 | click / Enter | — | Dòng chưa đọc chuyển thành đã đọc ngay (lạc quan) rồi trình duyệt đi theo liên kết (xem § 8); lỗi thì dòng hoàn lại chưa đọc | `features/notifications/components/notification-row.tsx:41-45`, `features/notifications/components/notification-list-page-client.tsx:32-35`, `features/notifications/hooks/use-notification-list.ts:138-148` |
| Mở Tiêu chuẩn cộng đồng | E07 | click | Dòng loại Kudo bị ẩn | Rời màn (xem § 8) | `features/notifications/components/notification-row.tsx:53-61` |
| Thử lại | E13 | click | Đọc trang đầu lỗi, hoặc đợt tải thêm lỗi | Trang đầu: hiện lại khung xương rồi tải lại từ đầu; đợt tải thêm: tải lại đúng đợt đó | `features/notifications/components/notification-list.tsx:70-78,95-101`, `features/notifications/hooks/use-notification-list.ts:104-107` |

### Happy Path

1. Sunner mở `/notifications`; panel hiện khung xương rồi tới tối đa 20 dòng mới nhất, dòng chưa đọc có chấm đỏ.
2. Sunner cuộn xuống; khi điểm neo tới gần đáy (160 px), 20 dòng cũ hơn được nối vào cuối.
3. Sunner bấm "Đánh dấu đọc tất cả" ở E03; chấm đỏ của mọi dòng biến mất và chuông ở header tắt chấm.
4. Sunner bấm một dòng chưa đọc; dòng đó chuyển thành đã đọc ngay (điểm đến xem § 8).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Chưa có thông báo nào | Hiện "Bạn chưa có thông báo nào" | `features/notifications/components/notification-list.tsx:80-86` |
| Bước 1 | Đọc trang đầu lỗi (kể cả khi phiên hết hạn, trả 401) | Hiện "Không tải được thông báo. Vui lòng thử lại." kèm nút Thử lại; không có lời mời đăng nhập lại | `features/notifications/components/notification-list.tsx:70-78`, `features/notifications/lib/fetch-notifications.ts:10-14` |
| Bước 2 | Đợt tải thêm lỗi | Danh sách giữ nguyên, dưới cùng hiện lỗi và nút Thử lại | `features/notifications/components/notification-list.tsx:95-101` |
| Bước 2 | Hết thông báo cũ hơn | Không tải thêm nữa (con trỏ trang kế rỗng) | `features/notifications/components/notification-list.tsx:54-58`, `features/notifications/hooks/use-notification-list.ts:162` |
| Bước 3 | Server từ chối đánh dấu tất cả | Các dòng vừa đổi hoàn lại chưa đọc, không có thông báo lỗi nào | `features/notifications/hooks/use-notification-list.ts:155-157` |
| Bước 4 | Server từ chối đánh dấu một dòng | Dòng hoàn lại chưa đọc, không có thông báo lỗi nào; việc điều hướng vẫn diễn ra | `features/notifications/hooks/use-notification-list.ts:143-145`, `features/notifications/components/notification-row.tsx:43` |
| Bước 4 | Dòng đã đọc | Bấm chỉ điều hướng, không gọi server | `features/notifications/components/notification-list-page-client.tsx:33`, `features/notifications/hooks/use-notification-list.ts:140` |
| Đồng bộ với chuông | Chuông nhận thông báo mới trong cùng tab | Trang tải lại trang đầu và gộp lên đầu danh sách, các dòng đang xem giữ nguyên | `features/notifications/components/notification-list-page-client.tsx:27-30`, `features/notifications/lib/notification-list-merge.ts:25-34` |
| Đồng bộ với chuông | Đánh dấu đã đọc xong ở dropdown chuông | Trang tải lại danh sách từ trang đầu | `features/notifications/components/notification-list-page-client.tsx:29` |

### Interaction Notes

- **Cuộn gần đáy danh sách thì tự tải 20 dòng cũ hơn; trang ngắn khiến điểm neo vẫn lộ ra thì tiếp tục tải cho tới khi đầy màn hình** — source: `features/notifications/hooks/use-infinite-scroll-sentinel.ts:19-34`
- **Bấm cả dòng (không chỉ chữ) đều mở thông báo: liên kết kéo giãn phủ kín dòng, riêng liên kết "Tiêu chuẩn cộng đồng" nằm nổi trên cùng nên không bị lồng liên kết** — source: `features/notifications/components/notification-row.tsx:41-61`
- **Thời gian tương đối tự làm tươi mỗi phút ("Vừa xong" thành "1 phút trước") mà không tải lại** — source: `features/notifications/hooks/use-minute-clock.ts:6-13`
- **Một thông báo tim được gộp và đẩy lên đầu khi có thêm tim; dòng trùng id chỉ hiện một lần dù server chuyển nó giữa các trang** — source: `features/notifications/lib/notification-list-merge.ts:7-16,18-24`
- **Mark đã đọc không bị ghi đè bởi một phản hồi tải trang cũ đến muộn: các id đã đánh dấu tại chỗ vẫn giữ trạng thái đã đọc** — source: `features/notifications/hooks/use-notification-list.ts:56-62`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading (route) | Chuyển vào `/notifications` | `loading.tsx`: panel với 4 dòng khung xương, `aria-busy`, chưa có keyvisual | none | `app/(app)/notifications/loading.tsx:6-17` |
| loading (trang đầu) | Hook đang đọc `GET /api/notifications` | 3 dòng khung xương cùng đệm với dòng thật, câu "Đang tải thông báo…" chỉ cho trình đọc màn hình | none | `features/notifications/components/notification-list.tsx:60-68,96-111` |
| empty | Không có thông báo | "Bạn chưa có thông báo nào" | E03 (không tác dụng) | `features/notifications/components/notification-list.tsx:80-86` |
| error (trang đầu) | `fetchNotificationPage` ném lỗi và chưa có dòng nào | "Không tải được thông báo. Vui lòng thử lại." và nút Thử lại | Thử lại (E13) | `features/notifications/components/notification-list.tsx:70-78`, `features/notifications/hooks/use-notification-list.ts:89-93` |
| error (tải thêm) | Đợt cuộn kế tiếp lỗi | Giữ danh sách, thêm khối lỗi kèm nút Thử lại ở cuối | Thử lại (E13) | `features/notifications/components/notification-list.tsx:95-101` |
| loading (tải thêm) | Đang đọc đợt kế | "Đang tải thêm thông báo…" dưới dòng cuối | none | `features/notifications/components/notification-list.tsx:103-105` |
| saving | Đang đánh dấu đọc tất cả | Nút E03 `aria-disabled`, mờ, con trỏ chờ; bấm lần hai bị bỏ qua | none | `features/notifications/components/notification-list-page-client.tsx:37-39,52`, `features/notifications/components/notification-styles.ts:20` |
| success | Đánh dấu đọc xong | Chấm đỏ biến mất ngay (lạc quan), không có toast | — | `features/notifications/hooks/use-notification-list.ts:138-158` |
| error (làm mới nền) | Đồng bộ trang đầu lỗi khi đã có dòng | Giữ nguyên các dòng đang hiện, không báo lỗi | — | `features/notifications/hooks/use-notification-list.ts:89-93` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E12 | Danh sách thông báo phải đọc được | "Không tải được thông báo. Vui lòng thử lại." | server response |
| E11 | Người dùng có thể chưa có thông báo | "Bạn chưa có thông báo nào" | server response |

Màn không có ô nhập. Việc đánh dấu đọc thất bại (một dòng hay tất cả) không có thông báo cho người dùng, dòng chỉ quay về trạng thái chưa đọc (xem Unresolved Questions).

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Trang chỉ dành cho Sunner đã đăng nhập và đã có đơn vị | auth | E01..E14 | Có phiên và hồ sơ có đơn vị | Khách (về đăng nhập) hoặc chưa có đơn vị (về trang chọn đơn vị) | Consequence if bypassed: redirect `/login` hoặc `/onboarding/department`; API `/api/notifications` trả 401 và chỉ trả thông báo của chủ phiên |
| Danh sách chỉ hiện khi trang đầu đã tải và có dòng | configuration | E04, E05, E06, E08 | Tải xong và có ít nhất một thông báo | Đang tải, rỗng, hoặc lỗi lúc chưa có dòng | — |
| Liên kết "Tiêu chuẩn cộng đồng" chỉ có ở dòng Kudo bị ẩn | configuration | E07 | Dòng thông báo loại Kudo bị ẩn | Mọi loại khác | — |
| Chấm đỏ chỉ hiện ở dòng chưa đọc | configuration | E09 | Dòng chưa đọc | Dòng đã đọc (khi đó đệm phải của dòng tăng thêm) | Người đọc màn hình nghe thêm "Chưa đọc:" trước nội dung |
| Khung xương / câu đang tải chỉ hiện ở lần đọc đầu | configuration | E10 | Hook ở trạng thái `loading` | Đã `ready` hoặc `error` | Bấm Thử lại từ trạng thái lỗi đưa về `loading` |
| Trạng thái rỗng chỉ hiện khi không có dòng nào | configuration | E11 | Trang đầu tải xong và danh sách rỗng | Có dòng | — |
| Lỗi và nút Thử lại chỉ hiện khi đọc thất bại | configuration | E12, E13 | Lỗi ở trang đầu lúc chưa có dòng, hoặc lỗi ở đợt tải thêm | Mọi trường hợp khác | Cùng một câu lỗi cho cả hai nhánh |
| Dòng "Đang tải thêm" chỉ hiện trong lúc cuộn tải | configuration | E14 | Đang đọc đợt kế | Nhàn rỗi (vẫn có vùng `role="status"` ẩn để trình đọc màn hình) | — |
| Nội dung dòng "nhận Kudo" đổi theo việc Kudo ẩn danh hay có tên | configuration | E06 | Có biệt danh ẩn danh → "Sunner {biệt danh} (ẩn danh) …"; có tên người gửi → "Sunner {tên} …"; không có cả hai → "Một Sunner ẩn danh …" | — | Tên và biệt danh đọc lại theo trạng thái hiện tại của Kudo, nhưng thông báo tạo lúc Kudo ẩn danh không lưu người gửi, nên Kudo đó sửa thành có tên thì dòng hiện "Một Sunner ẩn danh …" |

## 8. Navigation

> **D3 — the DRY statement that MUST appear verbatim in the template and the contract:**
>
> `## 8. Navigation` is the **per-screen projection** of `screen-flow.md § Screen Access Paths`.
> It is not a second source of truth. Every row here MUST be derivable from a path in
> `screen-flow.md`; every path in `screen-flow.md` touching this SCR### MUST appear here.
> Two-way consistency is a reviewer rule (`screen.nav_flow_skew`), not a Python check.
> `## 4. User Actions § Happy Path` narrative keeps its v27 scope rule unchanged: **prose still
> must not narrate cross-screen navigation**; only the § Exits *table* may name destinations.

### Entry Points

| From | Trigger there | Condition | Source |
|------|----------------|-----------|--------|
| SCR003_AppLayout | Bấm "Xem tất cả" trong dropdown chuông | — | `features/notifications/components/notification-panel.tsx:77-79` |
| external | Mở trực tiếp `/notifications` | Có phiên và đã có đơn vị | `app/(app)/notifications/page.tsx:21-22` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Mở thông báo nhận Kudo / nhận tim / Kudo bị ẩn / Kudos Quốc Dân | E06 | Dòng có `kudoId` | SCR006_KudoDetail | redirect (điều hướng client) | `features/notifications/server/notification-view-mapper.ts:35,45-48,54-55` |
| Mở thông báo hộp quà | E06 | Dòng loại `secret_box_granted` | SCR007_KudosLiveBoardFeed (`/kudos?secretBox=open`) | redirect | `features/notifications/server/notification-view-mapper.ts:49-50` |
| Mở thông báo lên bậc Hero / đủ bộ icon | E06 | Dòng loại `hero_tier_up` / `icon_set_completed` | SCR016_OwnProfile | redirect | `features/notifications/server/notification-view-mapper.ts:51-53` |
| Mở Tiêu chuẩn cộng đồng | E07 | Dòng loại `kudo_hidden_spam` | SCR009_CommunityStandards | redirect | `features/notifications/components/notification-row.tsx:53-61` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Panel là `section` gắn tiêu đề h1; danh sách là `ul` có tên "Thông báo"; mỗi dòng chưa đọc có `sr-only` "Chưa đọc:"; thời gian dùng `<time dateTime>`; biểu tượng loại, chấm đỏ, điểm neo cuộn đều `aria-hidden` |
| Keyboard navigation | supported | Cả dòng là liên kết native (Tab/Enter), có viền focus phủ cả dòng và nền khi focus-within; không có phím tắt riêng |
| Focus management | unmanaged | Không autofocus; tải thêm bằng cuộn không chuyển focus; sau khi bấm "Đánh dấu đọc tất cả" focus ở lại nút |
| Screen reader compatibility | partial | Có landmark `main`, một h1; vùng `role="status"` công bố đang tải, rỗng, đang tải thêm; chưa có kiểm thử với trình đọc màn hình |
| Error announcement | supported | Lỗi trang đầu và lỗi tải thêm dùng `role="alert"` |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (< md) | R3 | Lề ngang 16 px, đệm trên 128 px (`pt-32`); từ `md` đệm trên 192 px (`md:pt-48`) | `app/(app)/notifications/page.tsx:24` |
| mobile (< md) | E06 | Khoảng cách icon–chữ 16 px và đệm phải của dòng đã đọc 40 px; từ `md` là 24 px và 48 px | `features/notifications/components/notification-row.tsx:37` |
| mobile (< md) | E02, E03 | Hàng tiêu đề cho phép xuống dòng để nút "Đánh dấu đọc tất cả" không bị bóp | `features/notifications/components/notification-styles.ts:12,15` |
| desktop (md+) | R3 | Panel rộng tối đa 680 px, canh giữa | `features/notifications/components/notification-list-page-client.tsx:47` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 2. | component | `export const instant = false`: trang đọc phiên mỗi request; danh sách không do server render mà tải trong trình duyệt | `app/(app)/notifications/page.tsx:12-13,21-22` |
| E04, E10..E14 | endpoint | `GET /api/notifications?limit=<1..50, mặc định 20>&cursor=<mờ>` (ROUTE011) qua `fetchNotificationPage`. Request: `limit` (trang dùng 20), `cursor`; Success: 200 `{ items: NotificationView[], nextCursor: string \| null }`, mới nhất lên đầu, chỉ thông báo của chủ phiên; Error: 401 `unauthorized`, 400 `invalid_request`, 500 `unexpected`, body chỉ `{ code }`; `Cache-Control: private, no-store` | `app/api/notifications/route.ts:6-24`, `features/notifications/lib/fetch-notifications.ts:17-23`, `features/notifications/server/notification-api-session.ts:9-25` |
| E04 | helper | `NOTIFICATION_PAGE_SIZE = 20` (trang), `NOTIFICATION_DROPDOWN_LIMIT = 10` (chuông, cùng đường dữ liệu), `NOTIFICATION_MAX_PAGE_SIZE = 50` (trần của route) | `features/notifications/notification-config.ts:6-10` |
| E06 | endpoint | Server Action `markNotificationRead(id)` (ROUTE033): chủ là `requireSunner()`, id phải là uuid, trả `{ ok: true, unread }` hoặc `{ ok: false, code: "not_found" \| "unexpected" }` | `features/notifications/server/notification-actions.ts:15-26` |
| E03 | endpoint | Server Action `markAllNotificationsRead()` (ROUTE034): trả `{ ok: true, updated, unread }` hoặc `{ ok: false, code: "unexpected" }` | `features/notifications/server/notification-actions.ts:28-37` |
| E03, E06 | js | `useNotificationList` đánh dấu lạc quan, nhớ id đã đọc tại chỗ (`locallyRead`) và hoàn lại khi action ném lỗi hoặc trả `ok: false` | `features/notifications/hooks/use-notification-list.ts:21-28,138-158` |
| § 4. | js | Đồng bộ với chuông bằng `CustomEvent "saa:notifications-sync"` trên `window` (kind `incoming` / `all-read` / `read`, lọc theo nguồn `page`); chuông giữ kênh Realtime duy nhất, trang không tự nghe | `features/notifications/lib/notification-sync-events.ts:14-27`, `features/notifications/hooks/use-notification-sync.ts:1-12` |
| E06 | helper | `hrefOf(type, params)` chọn đích: Kudo (`/kudos/{id}`, rơi về `/kudos` nếu thiếu `kudoId`), hộp quà `/kudos?secretBox=open`, bậc Hero và đủ bộ icon `/profile`, Quốc Dân tới Kudo hạng cao nhất | `features/notifications/server/notification-view-mapper.ts:35,43-56` |
| E06 | helper | `formatNotificationMessage` dựng câu theo `type` + `params`, không lưu sẵn câu chữ (đổi ngôn ngữ thì dòng cũ dịch lại) | `features/notifications/lib/notification-message.ts:14-18,27-60` |
| E08 | helper | `formatNotificationRelativeTime`: dưới 1 phút "Vừa xong"; đơn vị lớn nhất lấp đầy (năm, tháng 30 ngày, tuần, ngày, giờ, phút), cắt xuống số nguyên | `features/notifications/lib/notification-relative-time.ts:9-19,36-40` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| NotificationRow / NotificationTypeIcon | `item.type` | kudo_received, heart_received, secret_box_granted, hero_tier_up, kudo_hidden_spam, icon_set_completed, national_kudos (Quốc Dân dùng lại biểu tượng "đủ bộ icon") | `item`, `now`, `onOpen` (đánh dấu đã đọc lạc quan); trên trang không truyền hộp cuộn riêng (`scrollRoot` bỏ trống, dùng viewport) | DISC-006 |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` ở trang `/notifications` và ở layout `(app)` | auth | Khách → redirect `/login`; chưa có đơn vị → redirect `/onboarding/department` (`app/(app)/notifications/page.tsx:22`, `shared/auth/current-user.ts:48-52`) |
| Proxy: không có phiên → `/login?next=` (trang) hoặc 401 JSON (API) | auth | Bỏ qua proxy thì trang và API vẫn tự kiểm phiên (`shared/auth/route-access-policy.ts:29-40`) |
| `requireNotificationUser()` đứng trước mọi lần đọc tham số; id người dùng chỉ lấy từ phiên | permission | 401 `unauthorized` và không đọc DB; không có tham số nào để xem thông báo người khác (`app/api/notifications/route.ts:14-15`, `features/notifications/server/notification-api-session.ts:22-25`) |
| Server Action đánh dấu đọc: chủ là phiên, chỉ nhận id uuid | permission | Đánh dấu thông báo của người khác không thể xảy ra: mọi lệnh cập nhật lọc `recipient_id = userId` của phiên và `read_at IS NULL` (`features/notifications/server/notification-actions.ts:11-20`, `features/notifications/server/notification-read-state.ts:11-18`) |

## Source References

1. Page/View: `app/(app)/notifications/page.tsx:1-29`
2. Loading state: `app/(app)/notifications/loading.tsx:1-21`
3. Screen body: `features/notifications/components/notification-list-page-client.tsx:1-69`
4. List: `features/notifications/components/notification-list.tsx:1-110`
5. Row: `features/notifications/components/notification-row.tsx:1-69`
6. Type icon: `features/notifications/components/notification-type-icon.tsx:1-31`
7. List hook: `features/notifications/hooks/use-notification-list.ts:1-171`
8. Sync: `features/notifications/lib/notification-sync-events.ts:1-28`, `features/notifications/hooks/use-notification-sync.ts:1-12`
9. Infinite scroll: `features/notifications/hooks/use-infinite-scroll-sentinel.ts:1-34`
10. Merge helpers: `features/notifications/lib/notification-list-merge.ts:1-44`
11. Fetch client: `features/notifications/lib/fetch-notifications.ts:1-42`
12. Copy and time: `features/notifications/lib/notification-message.ts:1-54`, `features/notifications/lib/notification-relative-time.ts:1-42`
13. Link targets: `features/notifications/server/notification-view-mapper.ts:35-56`
14. Read-state actions: `features/notifications/server/notification-actions.ts:1-37`
15. List API: `app/api/notifications/route.ts:1-24`
16. Config: `features/notifications/notification-config.ts:1-29`
17. UI copy: `messages/vi.json` (khóa `notifications`)

## Source Walkthrough

1. **File:** `app/(app)/notifications/page.tsx:1-29` — trang chính: kiểm phiên rồi ghép keyvisual và thân trang.
2. **File:** `features/notifications/components/notification-list-page-client.tsx:1-69` — tiêu đề, "Đánh dấu đọc tất cả", đồng bộ với chuông.
3. **File:** `features/notifications/hooks/use-notification-list.ts:1-171` — trạng thái danh sách: tải, tải thêm, gộp, đánh dấu lạc quan.
4. **File:** `features/notifications/components/notification-list.tsx:1-110` — các trạng thái rỗng, lỗi, tải thêm và neo cuộn.
5. **File:** `features/notifications/components/notification-row.tsx:1-69` — một dòng: liên kết phủ cả dòng, chấm đỏ, thời gian.
6. **File:** `features/notifications/server/notification-view-mapper.ts:35-56` — vì sao mỗi loại dẫn tới đích khác nhau.
7. **File:** `app/api/notifications/route.ts:1-24` — điểm đọc dữ liệu dùng chung với chuông.

Lớp dữ liệu: bảng thông báo xem MODEL016_Notification trong entities.md; màn không tự đọc DB, mọi dữ liệu đến qua `GET /api/notifications`.

### Call Hierarchy

```text
NotificationsPage -> requireSunner -> NotificationListPageClient -> useNotificationList -> fetchNotificationPage -> GET /api/notifications
NotificationListPageClient -> NotificationList -> NotificationRow -> NotificationTypeIcon
NotificationListPageClient -> useNotificationSync <-> window CustomEvent <-> NotificationBell (SCR003)
NotificationRow.onOpen -> useNotificationList.markRead -> markNotificationRead (Server Action)
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
Mount -> loadFirst("replace") (use-notification-list.ts:99-101) -> GET /api/notifications?limit=20 -> items + nextCursor -> NotificationList
Cuộn tới neo -> loadMore (use-notification-list.ts:109-126) -> GET ...&cursor= -> appendNotificationPage (bỏ id trùng)
Bấm dòng -> markRead (lạc quan) -> markNotificationRead -> emit "read" (page-client:34) -> chuông đọc lại số chưa đọc
Chuông phát "incoming" -> list.refresh -> mergeFirstNotificationPage -> danh sách giữ dòng cũ và thêm dòng mới trên đầu
```

## Unresolved Questions

- Đánh dấu đọc thất bại (một dòng hay tất cả) chỉ hoàn lại chấm đỏ, không có thông báo lỗi nào (`features/notifications/hooks/use-notification-list.ts:143-145,155-157`); chưa rõ đây là chủ ý hay thiếu trạng thái lỗi. [NEEDS_DOMAIN_CONFIRMATION] — người dùng không biết vì sao chấm đỏ quay lại.
- Khi phiên hết hạn lúc đọc danh sách (API trả 401), màn chỉ hiện lỗi chung kèm Thử lại, không có lối đăng nhập lại như màn hồ sơ và Live board (`features/notifications/lib/fetch-notifications.ts:10-14`, `features/notifications/components/notification-list.tsx:70-78`) — [UNVERIFIED] — needs runtime confirmation vì proxy có thể đưa trang về `/login` ở lần điều hướng kế tiếp.
- Nếu `params.kudoId` thiếu, dòng loại Kudo rơi về `/kudos` (Live board) thay vì Kudo cụ thể (`features/notifications/server/notification-view-mapper.ts:35`); screen-flow chỉ ghi đích SCR006 cho các dòng này. [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ trường hợp thiếu `kudoId` có thể xảy ra trong dữ liệu thật hay không.
- `loading.tsx` dựng panel không có keyvisual và không có `-mt-20`, trong khi trang thật có (`app/(app)/notifications/loading.tsx:6` so với `app/(app)/notifications/page.tsx:24`) nên nền và vị trí panel nhảy khi chuyển từ khung xương sang trang. [UNVERIFIED] — needs runtime confirmation.
- Thông báo "nhận Kudo" của một Kudo ẩn danh sau đó được sửa thành có tên vẫn hiện bản ẩn danh không tên "Một Sunner ẩn danh …": lúc tạo, thông báo của Kudo ẩn danh không lưu người gửi (`features/notifications/server/map-event-to-notifications.ts:36`); lúc đọc, tên chỉ được nối khi Kudo hiện không ẩn danh và có người gửi đã lưu (`features/notifications/server/notification-query.ts:42-43,49`), nên câu rơi về bản không tên (`features/notifications/lib/notification-message.ts:14-17`). [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ có chủ ý hay không.
