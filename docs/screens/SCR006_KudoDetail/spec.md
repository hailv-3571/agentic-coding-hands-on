---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR006_KudoDetail — Screen Spec

**Screen**: SCR006_KudoDetail: KudoDetail
**Feature**: F004_KudosFeed
**Type**: atomic
**Route**: /kudos/{id}
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner đọc đầy đủ một Kudo (lời nhắn không cắt, mọi ảnh, mọi hashtag, số tim) khi bấm "Xem chi tiết" trên thẻ, mở link được chia sẻ hoặc bấm dòng thông báo.
**Actors:** Sunner (người đã đăng nhập, đã chọn phòng ban); người gửi Kudo bị đánh dấu spam (chỉ họ xem được Kudo đó).
**Entry Conditions:** Đã đăng nhập và đã có phòng ban; trước giờ mở hệ thống thì phải là admin (cổng prelaunch chặn người khác). Id trong URL là uuid của một Kudo công khai, hoặc của Kudo spam do chính người xem gửi.
**Exit Conditions:** Người dùng bấm Đóng để về Live board, bấm tên hoặc avatar để sang hồ sơ, hoặc rời đi bằng trình duyệt. Id không hợp lệ thì dừng ở trang 404 với nút quay lại Live board.

## 2. Screen Layout

### Layout Sketch

Một trang `<main>` căn giữa, chạy dưới header trong suốt (`-mt-20`), nền là keyvisual Live board phủ kín và làm tối bằng lớp `rgba(0,16,26,.8)`. Giữa trang là một panel rộng tối đa 680 px, bo 24, nền kem, chứa tuần tự: người gửi → mũi tên gửi → người nhận, thời gian, danh hiệu, hộp lời nhắn, ảnh, hashtag, rồi hàng hành động (tim bên trái; Copy Link và Đóng bên phải). Với Kudo spam của chính chủ, một lớp cảnh báo mờ phủ cả panel, tag Spam nằm góc trên phải, chỉ nút Đóng còn nổi lên trên lớp phủ. (`app/(app)/kudos/[id]/page.tsx:51-64`, `features/kudos-feed/components/kudo-detail-view.tsx:30-66`)

```
┌───────────────────────────────────────────────┐
│ R1: Keyvisual làm tối (absolute, phủ toàn trang)│
│   ┌─────────────────────────────────────┐     │
│   │ R2: Panel Kudo 680 (static)         │     │
│   │  người gửi → người nhận · thời gian │     │
│   │  danh hiệu · lời nhắn · ảnh · tag   │     │
│   │  ─────────────────────────────────  │     │
│   │  R3: Hàng hành động                 │     │
│   │  [tim]            [Copy Link][Đóng] │     │
│   │ - - - - - - - - - - - - - - - - - - │     │
│   │ R4: Lớp cảnh báo spam (chỉ khi spam)│     │
│   └─────────────────────────────────────┘     │
└───────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Nền keyvisual làm tối | static | no | LiveBoardKeyvisualBackground (`dimmed`) |
| R2 | Panel Kudo | static | yes | KudoDetailView, KudoCardPeople, KudoCardTime, KudoCardTitleRow, KudoBodyMarkdown, KudoCardImages, KudoCardHashtags |
| R3 | Hàng hành động | static | no | KudoCardHeartSlot (KudoHeartButton), KudoCopyLinkButton, liên kết Đóng |
| R4 | Lớp cảnh báo spam (có điều kiện) | static | no | SpamAlertOverlay, KudoSpamTag |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Spam | message | — | Hidden | Conditional | — | computed | raw | hidden | MODEL003_Kudo.status |
| E02 | Cảnh báo vi phạm tiêu chuẩn cộng đồng | message | — | Hidden | Conditional | — | computed | raw | hidden | MODEL003_Kudo.status |
| E03 | Người gửi (avatar, tên hoặc biệt danh, mã phòng ban, huy hiệu Hero) | link | — | Visible | Always | Mở hồ sơ người gửi (chỉ khi không ẩn danh) | API field | tên raw; mã phòng ban | dash | MODEL004_Profile.full_name; MODEL003_Kudo.anonymous_nickname |
| E04 | Người nhận (avatar, tên, mã phòng ban, huy hiệu Hero) | link | — | Visible | Always | Mở hồ sơ người nhận | API field | raw | dash | MODEL004_Profile.full_name |
| E05 | Thời gian gửi | display field | — | Visible | Always | — | API field | `HH:mm - MM/DD/YYYY`, giờ Asia/Ho_Chi_Minh | — | MODEL003_Kudo.created_at |
| E06 | Danh hiệu | display field | — | Visible | Always | — | API field | chữ hoa, căn giữa | hidden | MODEL003_Kudo.title |
| E07 | Lời nhắn | display field | — | Visible | Always | Mở link http(s) trong lời nhắn ở tab mới | API field | Markdown rút gọn (chữ, đậm, nghiêng, gạch, danh sách, trích dẫn, link) | — | MODEL003_Kudo.body |
| E08 | Ảnh đính kèm (tối đa 5) | list | — | Visible | Always | Mở ảnh đầy đủ ở tab mới (không áp dụng với Kudo spam) | API field | khung 88×88, URL ký tạm | hidden | MODEL006_KudoImage |
| E09 | Hashtag | display field | — | Visible | Always | — | API field | `#Tên` cách nhau dấu cách, không cắt dòng | hidden | MODEL005_KudoHashtag |
| E10 | Tim (số lượt và nút) | button | — | Enabled | Conditional | Thả hoặc bỏ tim | API field | số theo locale ("1.000") | — | MODEL008_KudoHeart |
| E11 | Copy Link | button | — | Enabled | Conditional | Sao chép `{origin}/kudos/{id}` | — | — | — | N/A |
| E12 | Đóng | link | — | Enabled | Always | Về Live board | static | — | — | N/A |
| E13 | Không tải được Kudo. Vui lòng thử lại. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E14 | Thử lại | link | — | Hidden | Conditional | Tải lại đúng URL của Kudo | static | — | hidden | N/A |
| E15 | Kudo này không tồn tại hoặc đã bị gỡ. | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E16 | Quay lại Live board | link | — | Hidden | Conditional | Về Live board | static | — | hidden | N/A |

Ghi chú: E15 và E16 thuộc trang 404 của route này (`not-found.tsx`), thay thế cả panel; E13 và E14 là khối báo lỗi thay cho panel khi đọc dữ liệu lỗi. Số tim là số Sunner đã thả (số thô, không nhân hệ số campaign).

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở hồ sơ người gửi | E03 | click tên hoặc avatar | Người gửi không ẩn danh | Rời màn hình (xem § 8); di chuột lên avatar hoặc focus bàn phím lên tên thì hiện hover card | `features/kudos-feed/components/kudo-card-sender.tsx:27-49` |
| Mở hồ sơ người nhận | E04 | click tên hoặc avatar | — | Rời màn hình (xem § 8); cùng hover card như người gửi | `features/kudos-feed/components/kudo-card-sender.tsx:81` |
| Mở link trong lời nhắn | E07 | click link | Lời nhắn có link http(s) | Mở tab mới (`noopener noreferrer nofollow`); href không phải http(s) thì chỉ là chữ | `features/kudos-feed/components/kudo-body-markdown.tsx:45-51` |
| Mở ảnh đầy đủ | E08 | click ảnh | Ảnh có URL, Kudo không phải spam | Mở tệp ảnh ở tab mới | `features/kudos-feed/components/kudo-card-images.tsx:37-40` |
| Thả hoặc bỏ tim | E10 | click | Không phải Kudo của mình; chưa hết cửa sổ ghi | Tim và số đổi ngay (optimistic), nút khoá tới khi server trả lời; lỗi thì hoàn lại và hiện toast | `features/kudos-hearts/components/kudo-heart-button.tsx:72-90` |
| Xem lý do tim bị khoá | E10 | click, hover hoặc focus | Kudo của mình, hoặc đã hết cửa sổ ghi | Không gửi gì; hiện tooltip và toast lý do | `features/kudos-hearts/components/kudo-heart-button.tsx:72-76` |
| Sao chép link | E11 | click | Không phải Kudo spam | Ghi URL tuyệt đối vào clipboard, hiện toast xác nhận (tự tắt sau 4 giây) hoặc toast lỗi kèm link để chép tay | `features/kudos-feed/components/kudo-copy-link-button.tsx:35-46` |
| Đóng | E12 | click | — | Rời màn hình (xem § 8) | `features/kudos-feed/components/kudo-detail-view.tsx:61-63` |
| Thử lại | E14 | click | Đọc Kudo lỗi | Tải lại trang tại cùng URL | `app/(app)/kudos/[id]/page.tsx:57-59` |
| Quay lại Live board | E16 | click | Trang 404 | Rời màn hình (xem § 8) | `app/(app)/kudos/[id]/not-found.tsx:17-22` |

### Happy Path

1. Sunner mở `/kudos/{id}`; trang hiện keyvisual tối và panel Kudo ở R2.
2. Sunner đọc người gửi, người nhận, thời gian, danh hiệu, toàn bộ lời nhắn, ảnh và hashtag.
3. Sunner thả tim ở R3: số tim và biểu tượng đổi ngay, rồi giữ nguyên sau khi server xác nhận.
4. Sunner bấm Copy Link ở R3: toast "Đã sao chép liên kết" hiện rồi tự tắt.
5. Sunner bấm Đóng để về Live board.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Tải Kudo | Id sai định dạng, không có, hoặc là Kudo spam của người khác | Cùng một trang 404, không phân biệt các trường hợp; trạng thái HTTP có thể là 200 (soft 404) | `app/(app)/kudos/[id]/page.tsx:48`, `features/kudos-feed/server/kudo-public-query.ts:89-96` |
| Tải Kudo | Đọc dữ liệu lỗi (khác với "không thấy") | Khối báo lỗi và link Thử lại thay cho panel, không chuyển sang trang 404 | `app/(app)/kudos/[id]/page.tsx:54-60` |
| Hiển thị panel | Kudo spam của chính người xem | Lớp cảnh báo mờ, tag Spam; ẩn tim và Copy Link; chỉ Đóng còn bấm được; liên kết trong panel ra khỏi thứ tự Tab | `features/kudos-feed/components/kudo-detail-view.tsx:34-35,47-63` |
| Thả tim | Kudo do chính mình gửi (kể cả gửi ẩn danh) | Số tim vẫn hiện, nút bị khoá, lý do "Bạn không thể thả tim cho Kudo của mình" | `features/kudos-hearts/components/kudo-heart-button.tsx:61` |
| Thả tim | Đã hết cửa sổ ghi (từ `EVENT_END_AT`) | Nút bị khoá, lý do "Sự kiện đã kết thúc, không thể thả tim nữa" | `features/kudos-hearts/components/kudo-heart-button.tsx:61` |
| Sao chép link | Trình duyệt không có hoặc chặn clipboard | Toast lỗi kèm ô chỉ đọc chứa link để chép tay; toast ở lại tới khi bấm Đóng | `features/kudos-feed/components/kudo-copy-link-button.tsx:39-45`, `features/kudos-feed/components/kudo-copy-link-toast.tsx:38-54` |

### Interaction Notes

- **Thả tim phản hồi tức thì rồi hoàn lại nếu server từ chối** — source: `features/kudos-hearts/components/kudo-heart-button.tsx:80-89` (useOptimistic, nút khoá bằng `aria-busy` để không bấm đúp)
- **Nhấn Esc ẩn tooltip lý do khi tim bị khoá** — source: `features/kudos-hearts/components/kudo-heart-button.tsx:63-70`
- **Di chuột lên avatar hoặc focus bàn phím lên tên người có tên thì hiện hover card thông tin Sunner; dưới lớp phủ spam thì tắt** — source: `features/kudos-feed/components/kudo-card-sender.tsx:27-49` (AvatarHoverCard `enabled={tabbable}`)
- **Bấm ảnh mở tệp đầy đủ ở tab mới, không rời trang** — source: `features/kudos-feed/components/kudo-card-images.tsx:37-40`
- **Ảnh không ký được URL thì hiện khung trống kèm chú thích cho trình đọc màn hình** — source: `features/kudos-feed/components/kudo-card-images.tsx:26-31`
- **Bấm Đóng ở Kudo spam vẫn được vì nút nằm trên lớp phủ, trang không nhốt người đọc** — source: `features/kudos-feed/components/kudo-detail-view.tsx:61`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở trang | Không có skeleton hay spinner riêng; route chặn (`instant = false`) tới khi session và Kudo đọc xong | none | `app/(app)/kudos/[id]/page.tsx:24` |
| not-found | Id sai, không có, hoặc spam của người khác | Trang 404: một thông báo chung và nút "Quay lại Live board" trên keyvisual tối | Quay lại Live board | `app/(app)/kudos/[id]/not-found.tsx:11-24` |
| error | Đọc Kudo ném lỗi | Khối `role="alert"` "Không tải được Kudo. Vui lòng thử lại." kèm link Thử lại | Thử lại | `app/(app)/kudos/[id]/page.tsx:26-35,54-60` |
| empty | Ảnh hoặc hashtag hoặc danh hiệu không có | Vùng đó không render | none | `features/kudos-feed/components/kudo-card-images.tsx:21`, `features/kudos-feed/components/kudo-card-parts.tsx:19-21,33` |
| spam-owner | Kudo spam của chính người xem | Lớp mờ `backdrop-blur` với tam giác cảnh báo và dòng "Cảnh báo vi phạm tiêu chuẩn cộng đồng"; tag Spam cam góc trên phải | Đóng | `features/kudos-feed/components/kudo-detail-view.tsx:34-35`, `features/admin-moderation/components/spam-alert-overlay.tsx:15-36` |
| saving | Tim đang chờ server | Nút `aria-busy`, giữ trạng thái optimistic, không bấm đúp | none | `features/kudos-hearts/components/kudo-heart-button.tsx:77,100` |
| success | Sao chép link thành công | Toast "Đã sao chép liên kết" 4 giây (vùng `role="status"`) | none | `features/kudos-feed/components/kudo-copy-link-toast.tsx:24-36` |
| error | Tim bị từ chối hoặc lỗi mạng | Toast `role="alert"` tối đa 5 giây với thông báo theo mã lỗi; số tim hoàn lại | none | `features/kudos-hearts/components/kudo-heart-error-toast.tsx:32-50` |
| error | Sao chép link thất bại | Toast `role="alert"` "Không sao chép được liên kết, vui lòng thử lại." kèm ô chứa link, ở lại tới khi đóng | Đóng toast, chép tay | `features/kudos-feed/components/kudo-copy-link-toast.tsx:38-54` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E10 | Không được thả tim cho Kudo của chính mình | Bạn không thể thả tim cho Kudo của mình | click (chặn phía client) |
| E10 | Hết cửa sổ ghi thì tim chỉ đọc | Sự kiện đã kết thúc, không thể thả tim nữa | click (chặn phía client), hoặc server response |
| E10 | Kudo không còn công khai | Kudo này không còn khả dụng | server response |
| E10 | Lỗi không xác định hoặc mất mạng | Không thể cập nhật, vui lòng thử lại | server response |
| E11 | Cần Clipboard API và được phép ghi | Không sao chép được liên kết, vui lòng thử lại. | click |

Server chặn lại các điều kiện trên; thông báo lấy từ `kudosHearts.errors` (xem `features/kudos-hearts/components/kudo-heart-button.tsx:25-34`).

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Người xem là người gửi và Kudo bị đánh dấu spam | auth | E01, E02 | Kudo spam do chính người xem gửi | Mọi trường hợp khác | Consequence if bypassed: người khác mở Kudo spam không thấy gì, chỉ nhận trang 404 vì server trả null; chỉ chủ mới đọc được |
| Người xem là người gửi và Kudo bị đánh dấu spam | auth | E10, E11 | Kudo công khai | Kudo spam của chính chủ | Consequence if bypassed: không có, thao tác tim và Copy Link vẫn do server kiểm tra riêng (`SELF_HEART`, Kudo phải công khai) |
| Hết cửa sổ ghi sự kiện | configuration | E10 | Còn cửa sổ ghi: nút bấm được | Từ `EVENT_END_AT`: số tim vẫn hiện nhưng nút bị khoá | Cửa sổ ghi lấy từ cấu hình thời gian sự kiện |
| Đọc Kudo lỗi | configuration | E13, E14 | Đọc dữ liệu ném lỗi (không phải "không thấy") | Đọc thành công | Điều kiện theo trạng thái đọc dữ liệu, không phải cấu hình; dùng loại gần nhất vì bảng loại không có mục trạng thái |
| Kudo không hiển thị cho người xem | configuration | E15, E16 | Id sai, không có, hoặc spam của người khác | Kudo hiển thị được | Điều kiện theo kết quả truy vấn; cùng chú thích loại như dòng trên |

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
| SCR007_KudosLiveBoardFeed/REG003_HighlightKudos | Bấm "Xem chi tiết" trên thẻ Kudo | Kudo công khai (Live board không bao giờ hiện Kudo spam) | `features/kudos-feed/components/kudo-card.tsx:76-79` |
| SCR007_KudosLiveBoardFeed/REG005_AllKudosFeed | Bấm "Xem chi tiết" trên thẻ Kudo | Kudo công khai (Live board không bao giờ hiện Kudo spam) | `features/kudos-feed/components/kudo-card.tsx:24-28,76-79` |
| SCR015_OtherProfile | Bấm "Xem chi tiết" trên thẻ | — | `docs/generated/screen-flow.md:225` |
| SCR016_OwnProfile | Bấm "Xem chi tiết" trên thẻ | — | `docs/generated/screen-flow.md:228` |
| SCR017_AllNotifications | Bấm dòng thông báo có `kudoId` | — | `docs/generated/screen-flow.md:230` |
| SCR003_AppLayout/REG001_NotificationBell | Bấm dòng thông báo nhận Kudo, tim, Kudo bị ẩn hoặc Kudos Quốc Dân | Dòng có `kudoId` | `docs/generated/screen-flow.md:211` |
| external | Mở link chia sẻ `/kudos/{id}` (từ nút Copy Link) | Đã đăng nhập, qua cổng prelaunch | `features/kudos-feed/components/kudo-copy-link-button.tsx:37` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đóng | E12 | — | SCR007_KudosLiveBoardFeed | redirect | `features/kudos-feed/components/kudo-detail-view.tsx:61-63` |
| Quay lại Live board | E16 | Trang 404 | SCR007_KudosLiveBoardFeed | redirect | `app/(app)/kudos/[id]/not-found.tsx:17-22` |
| Mở hồ sơ người gửi | E03 | Người gửi không ẩn danh | SCR015_OtherProfile | redirect | `features/kudos-feed/components/kudo-card-sender.tsx:27-38` |
| Mở hồ sơ người nhận | E04 | — | SCR015_OtherProfile | redirect | `features/kudos-feed/components/kudo-card-sender.tsx:81` |
| Mở hồ sơ chính mình | E03, E04 | Người đó là chính người xem | SCR016_OwnProfile | redirect (route hồ sơ tự chuyển `/profile/{id}` của mình về `/profile`) | `app/(app)/profile/[userId]/page.tsx:33` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | `<h1 class="sr-only">` tên trang, `<h2>` danh hiệu; `role="alert"` ở khối lỗi tải; `role="note"` ở lớp phủ spam kèm dòng `sr-only` "Kudo này đang bị tạm ẩn…"; nút tim `aria-pressed` và `aria-describedby` khi bị khoá; ảnh có `aria-label` "Mở ảnh đính kèm n trong thẻ mới"; keyvisual `aria-hidden` |
| Keyboard navigation | supported | Chỉ dùng phần tử gốc (link, nút) theo thứ tự DOM; Esc ẩn tooltip của tim bị khoá; dưới lớp phủ spam, liên kết và link lời nhắn ra khỏi thứ tự Tab (`tabIndex=-1`), ảnh không là link |
| Focus management | unmanaged | Không autofocus, không focus trap; nút Đóng ở Kudo spam được nâng `z-20` để vẫn bấm được |
| Screen reader compatibility | unknown | Dùng `<article>`, `<time dateTime>`, danh sách ảnh `<ul>`, nhãn ẩn "gửi đến" giữa hai người; chưa có kiểm thử thực tế. Lớp phủ không dùng `inert` để văn bản vẫn đọc được |
| Error announcement | supported | Khối lỗi tải `role="alert"`; toast tim lỗi và toast Copy Link lỗi `role="alert"`; toast Copy Link thành công trong vùng `role="status"` `aria-live="polite"` luôn có mặt |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (dưới md) | R2 | Lề ngang 16 px và đệm trên 24 px; từ md lề 40 px và đệm trên 40 px | `features/kudos-feed/components/kudo-detail-view.tsx:32` |
| mobile (dưới md) | R4 / E01 | Tag Spam ở top 12 px, right 12 px; từ md top 40 px, right 0 | `features/admin-moderation/components/kudo-spam-tag.tsx:12` |
| mobile (dưới md) | R4 / E02 | Chữ cảnh báo cỡ title-large; từ md cỡ headline-large | `features/admin-moderation/components/spam-alert-overlay.tsx:31` |
| mobile (khung tên hẹp hơn 12rem) | E03, E04 | Huy hiệu Hero rớt xuống dưới mã phòng ban và bỏ chấm phân cách | `features/kudos-feed/components/kudo-card-hero-badge-slot.tsx:24` |
| mọi cỡ | R3 | Hàng hành động tự xuống dòng khi hẹp (`flex-wrap`) | `features/kudos-feed/components/kudo-detail-view.tsx:46` |
| mobile (dưới md) | E15 | Tiêu đề 404 cỡ headline-small; từ md cỡ headline-large | `app/(app)/kudos/[id]/not-found.tsx:16` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireSunner()` chạy đầu `KudoDetailPage` trước khi đọc `params` | `app/(app)/kudos/[id]/page.tsx:44` |
| § 1. | handler | `KudoDetailPage` là Server Component chặn (`instant = false`); `notFound()` gọi ngoài try/catch nên thành soft 404 khi shell đã stream | `app/(app)/kudos/[id]/page.tsx:24,43-48` |
| § 5. | helper | `findKudo` bọc `KudoPublicQuery.findForViewer(id, viewerId, locale)`, trả `null` (không thấy), `"failed"` (lỗi) hoặc `KudoCardView` | `app/(app)/kudos/[id]/page.tsx:27-35` |
| § 7. | helper | Điều kiện hiển thị: `status = 'public'` hoặc (`status = 'spam'` và `sender_id = viewerId`); id phải là uuid; truy vấn cùng module với ROUTE007 | `features/kudos-feed/server/kudo-public-query.ts:89-96` |
| E10 | endpoint | Server Action `addHeartAction` (ROUTE025) và `removeHeartAction` (ROUTE026) | `features/kudos-hearts/components/kudo-heart-button.tsx:25-34` |
| E10 | feature-flag | `blockedBy = isOwner ? "SELF_HEART" : writingOpen ? null : "EVENT_ENDED"`; `writingOpen = isKudoWritingOpen()` từ `EVENT_END_AT` | `features/kudos-hearts/components/kudo-heart-button.tsx:61`, `features/kudos-authoring/server/kudo-write-window.ts:11-14` |
| E03, E04 | endpoint | `GET /api/sunners/:userId/card` (ROUTE019) do AvatarHoverCard gọi khi mở hover card | `features/kudos-feed/components/kudo-card-sender.tsx:27-49` |
| E08 | helper | URL ảnh là signed URL ngắn hạn từ `signKudoImageReadUrls`; dùng thẻ `<img>` thường; `url = null` thì hiện khung trống | `features/kudos-feed/components/kudo-card-images.tsx:14-31` |
| E07 | component | `parseKudoBody` ra AST rồi render phần tử React, không `dangerouslySetInnerHTML` | `features/kudos-feed/components/kudo-body-markdown.tsx:5-19` |
| E11 | js | `navigator.clipboard.writeText(`${window.location.origin}/kudos/${kudoId}`)`; toast qua `DocumentBodyPortal` | `features/kudos-feed/components/kudo-copy-link-button.tsx:35-58` |
| E05 | helper | `Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", hourCycle: "h23" })` cho cả hai locale | `features/kudos-feed/components/format-kudo-card-time.ts:5-18` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| KudoCardPeople / người gửi | `sender.anonymous` | named, anonymous (biệt danh, không link, không hover card) | `tabbable = !kudo.isSpam` | MODEL003_Kudo.is_anonymous |
| KudoHeartButton | `variant` | `detail` (khoảng cách 8) | `isOwner`, `writingOpen`, `heartCount`, `heartedByMe` | MODEL008_KudoHeart |
| LiveBoardKeyvisualBackground | `dimmed` | `dimmed` (phủ cả trang, lớp mờ 80%) | — | N/A |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` ở route và ở layout `(app)` | auth | Khách bị chuyển tới `/login`; người chưa có phòng ban bị chuyển tới onboarding; [UNVERIFIED] server enforcement — proxy session là lớp thứ hai, cần xác nhận khi chạy thật |
| Cổng prelaunch ở proxy | role | Trước `LAUNCH_AT`, người không phải admin bị chuyển tới `/countdown`; role đọc từ DB, lỗi đọc coi như không phải admin |
| Điều kiện hiển thị trong `findForViewer` | permission | Kudo spam của người khác trả `null` thành 404 giống hệt id không tồn tại, không lộ sự tồn tại; nếu bỏ điều kiện thì lộ nội dung Kudo đã bị ẩn |
| Link lời nhắn chỉ nhận http(s), `rel="noopener noreferrer nofollow"` | permission | href khác http(s) chỉ hiện là chữ, không tạo link thực thi |

## Source References

1. Page/View: `app/(app)/kudos/[id]/page.tsx:14-66`
2. Trang 404: `app/(app)/kudos/[id]/not-found.tsx:11-25`
3. Panel Kudo: `features/kudos-feed/components/kudo-detail-view.tsx:26-68`
4. Người gửi và người nhận: `features/kudos-feed/components/kudo-card-sender.tsx:27-84`
5. Lời nhắn, ảnh, hashtag, thời gian: `features/kudos-feed/components/kudo-body-markdown.tsx:14-87`, `features/kudos-feed/components/kudo-card-images.tsx:19-49`, `features/kudos-feed/components/kudo-card-parts.tsx:6-39`, `features/kudos-feed/components/format-kudo-card-time.ts:5-18`
6. Tim: `features/kudos-hearts/components/kudo-heart-button.tsx:49-123`
7. Copy Link: `features/kudos-feed/components/kudo-copy-link-button.tsx:29-61`, `features/kudos-feed/components/kudo-copy-link-toast.tsx:24-57`
8. Lớp phủ và tag spam: `features/admin-moderation/components/spam-alert-overlay.tsx:15-36`, `features/admin-moderation/components/kudo-spam-tag.tsx:9-16`
9. Truy vấn: `features/kudos-feed/server/kudo-public-query.ts:85-96`
10. Nền: `features/kudos-feed/components/live-board-keyvisual.tsx:9-19`
11. Parent shell context: `app/(app)/layout.tsx:17-28`

## Source Walkthrough

1. **File:** `app/(app)/kudos/[id]/page.tsx:14-66` — bắt đầu từ trang: nó quyết định ba nhánh (404, lỗi tải, panel).
2. **File:** `features/kudos-feed/server/kudo-public-query.ts:85-96` — vì sao id sai và spam của người khác cùng ra 404; đối chiếu MODEL003_Kudo trong `entities.md`.
3. **File:** `features/kudos-feed/components/kudo-detail-view.tsx:26-68` — ghép panel và rẽ nhánh spam.
4. **File:** `features/kudos-feed/components/kudo-card-sender.tsx:27-84` — người gửi ẩn danh so với người có tên, hover card.
5. **File:** `features/kudos-hearts/components/kudo-heart-button.tsx:49-123` — logic tim optimistic và các lý do bị khoá.
6. **File:** `features/kudos-feed/components/kudo-copy-link-button.tsx:29-61` — sao chép link và toast.
7. **File:** `app/(app)/kudos/[id]/not-found.tsx:11-25` — trang 404 dùng chung một nội dung.

### Call Hierarchy

```text
KudoDetailPage -> findKudo -> KudoPublicQuery.findForViewer
KudoDetailPage -> KudoDetailView -> KudoCardPeople -> AvatarHoverCard
KudoDetailView -> KudoBodyMarkdown / KudoCardImages / KudoCardHashtags
KudoDetailView -> KudoCardHeartSlot -> KudoHeartButton -> addHeartAction | removeHeartAction
KudoDetailView -> KudoCopyLinkButton -> KudoCopyLinkToast
KudoDetailView -> SpamAlertOverlay + KudoSpamTag (chỉ khi isSpam)
KudoDetailPage -> notFound() -> KudoNotFound (not-found.tsx)
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
URL id + session -> findForViewer (null | "failed" | KudoCardView) -> nhánh 404 | khối lỗi | KudoDetailView
Bấm tim -> useOptimistic đổi số -> Server Action -> publishHeartSummary (xác nhận) | toast lỗi (hoàn lại)
Bấm Copy Link -> clipboard.writeText -> toast thành công | toast lỗi kèm link
```

Các hop trên suy ra từ Call Hierarchy ở trên và các trích dẫn trong `## Source References`.

## Unresolved Questions

1. Mã trạng thái HTTP của trang 404 là 404 hay 200 trên production: chú thích trong `page.tsx` nói có thể là soft 404 (200) khi shell đã stream; cần xác nhận khi chạy thật. (`app/(app)/kudos/[id]/page.tsx:19-24`)
2. Văn bản thông báo của toast tim "Kudo này không còn khả dụng" chỉ xuất hiện nếu server trả `KUDO_UNAVAILABLE`; chưa đọc `kudo-heart-actions.ts` để xác nhận mọi điều kiện sinh mã này (không đọc: ngoài độ sâu một cấp). 
3. Hover card của avatar (AvatarHoverCard) thuộc spec riêng của feature Profile; không tài liệu hóa hành vi nội bộ ở đây (không đọc: tham chiếu qua import).
