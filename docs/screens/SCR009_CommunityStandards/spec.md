---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR009_CommunityStandards — Screen Spec

**Screen**: SCR009_CommunityStandards: CommunityStandards
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /community-standards
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner đọc Tiêu chuẩn cộng đồng và Tiêu chuẩn bảo mật của phong trào Sun* Kudos để biết nội dung nào bị gắn nhãn Spam và bị ẩn, khi bấm link Tiêu chuẩn chung ở footer, link trong composer hoặc link trong thông báo Kudo bị ẩn.
**Actors:** Sunner (người đã đăng nhập, có phòng ban); admin (vào được trước giờ mở hệ thống).
**Entry Conditions:** Đã đăng nhập và đã có phòng ban; trước `LAUNCH_AT` thì phải là admin (cổng prelaunch).
**Exit Conditions:** Sunner đọc xong và quay lại bằng điều hướng của trình duyệt hoặc dùng header, footer (trang không có nút riêng).

## 2. Screen Layout

### Layout Sketch

Một `<main>` chạy dưới header (`-mt-20`), keyvisual Live board ở đầu trang rồi mờ dần vào nền. Trong cột nội dung `portalColumn`: logo ROOT FURTHER 451×200, rồi khối chữ tĩnh gồm tiêu đề, đoạn dẫn, danh sách 10 tiêu chí vi phạm, đường kẻ, phần Tiêu chuẩn bảo mật với các gạch đầu dòng và dòng liên hệ hỗ trợ. (`app/(app)/community-standards/page.tsx:25-39`, `features/awards-portal/components/community-standards-content.tsx:19-56`)

```
┌─────────────────────────────────────────┐
│ R1: Keyvisual Live board (absolute, nền)│
│  R2: Logo ROOT FURTHER (static)         │
│  R3: Nội dung tiêu chuẩn (static)       │
│   Tiêu chuẩn cộng đồng + 10 tiêu chí    │
│   ───────────────────────────────────   │
│   Tiêu chuẩn bảo mật + liên hệ hỗ trợ   │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Nền keyvisual | static | no | LiveBoardKeyvisualBackground |
| R2 | Logo | static | no | Image (ROOT FURTHER) |
| R3 | Nội dung tiêu chuẩn | static | yes | CommunityStandardsContent |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Root Further (logo) | image | — | Visible | Always | — | static | 451×200 (280 px trên điện thoại) | — | N/A |
| E02 | Tiêu chuẩn cộng đồng | region label | — | Visible | Always | — | static | `<h1>` vàng | — | N/A |
| E03 | Lời dẫn về Tiêu chuẩn Cộng đồng | display field | — | Visible | Always | — | static | raw | — | N/A |
| E04 | Câu giới thiệu quy tắc gắn nhãn Spam | display field | — | Visible | Always | — | static | raw | — | N/A |
| E05 | Danh sách 10 tiêu chí vi phạm | list | — | Visible | Always | — | static | danh sách đánh số | hidden | N/A |
| E06 | Tiêu chuẩn bảo mật | region label | — | Visible | Always | — | static | `<h2>` vàng | — | N/A |
| E07 | Lời dẫn Tiêu chuẩn bảo mật | display field | — | Visible | Always | — | static | raw | — | N/A |
| E08 | Các mục bảo mật (2 gạch đầu dòng) | list | — | Visible | Always | — | static | danh sách chấm | hidden | N/A |
| E09 | Dòng Liên hệ Hỗ trợ (Slack của đại diện BTC SAA) | display field | — | Visible | Always | — | static | chữ thường, không phải link | — | N/A |

Ghi chú: chữ lấy từ `awardsPortal.standards` (`messages/vi.json:519-544`). E05 và E08 là mảng trong messages nên BTC thêm hoặc bớt mục bằng cách sửa JSON.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

N/A — no elements carry a discrete user-triggered action.

### Happy Path

1. Sunner mở `/community-standards`; keyvisual, logo và tiêu đề hiện.
2. Sunner đọc lời dẫn và danh sách 10 tiêu chí vi phạm ở R3.
3. Sunner cuộn xuống đọc Tiêu chuẩn bảo mật và dòng liên hệ hỗ trợ.

### Branches

N/A — single-action screen, no branches

### Interaction Notes

N/A — no non-trivial interaction patterns detected (only standard form input bindings).

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Mở trang | Không có skeleton riêng; route chặn (`instant = false`) tới khi session xác nhận | none | `app/(app)/community-standards/page.tsx:15-22` |
| empty | Mảng tiêu chí hoặc mục bảo mật trong messages không phải mảng chuỗi | Danh sách tương ứng không hiện mục nào, không có lỗi; chỉ giữ phần tử chuỗi | none | `features/awards-portal/components/community-standards-content.tsx:4-6,29-35,44-50` |

Nội dung hoàn toàn tĩnh nên không có trạng thái lỗi hay đang gửi riêng.

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

N/A — no conditional UI detected.

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
| SCR003_AppLayout | Bấm link "Tiêu chuẩn chung" ở footer | — | `docs/generated/screen-flow.md:206` |
| SCR007_KudosLiveBoardFeed/REG001_KudoComposer | Bấm link trong thanh công cụ của composer (mở tab mới) | Composer đang mở | `features/kudos-authoring/components/kudo-message-toolbar.tsx:52-60` |
| SCR017_AllNotifications | Bấm link trong dòng thông báo Kudo bị ẩn | Dòng loại `kudo_hidden_spam` | `docs/generated/screen-flow.md:233` |

### Exits

N/A — this screen has no exits (terminal screen).

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | `<h1>` tiêu đề, `<h2>` gắn với `<section aria-labelledby="security-standards-heading">`; logo có `alt`; keyvisual `aria-hidden`; danh sách dùng `<ol>` và `<ul>` thật |
| Keyboard navigation | not implemented | Trang không có phần tử tương tác để duyệt bằng Tab (ngoài header và footer của layout) |
| Focus management | unmanaged | Không có autofocus hay focus trap |
| Screen reader compatibility | unknown | Cấu trúc tiêu đề và danh sách ngữ nghĩa đầy đủ; chưa có kiểm thử thực tế với trình đọc màn hình |
| Error announcement | not implemented | Không có thông báo lỗi hay vùng `aria-live` vì trang tĩnh |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (dưới md) | R2, R3 | Đệm trên 144 px (`pt-36`), từ `md` 184 px (`pt-46`) | `app/(app)/community-standards/page.tsx:25` |
| mobile (dưới md) | E01 | Logo rộng 280 px, từ `md` 451 px | `app/(app)/community-standards/page.tsx:34-35` |
| mobile (dưới md) | E02, E06 | Tiêu đề cỡ headline-large, từ `md` cỡ display-medium | `features/awards-portal/components/community-standards-content.tsx:8` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireSunner()` đầu `CommunityStandardsPage`; route chặn (`instant = false`) | `app/(app)/community-standards/page.tsx:15,21-22` |
| E05, E08 | helper | `textList(t.raw(...))` chỉ giữ phần tử chuỗi; dùng `t.raw` để ký tự như "<" giữ nguyên là chữ | `features/awards-portal/components/community-standards-content.tsx:4-6,29-35,44-50` |
| E01 | component | `next/image` với `preload` và `sizes="(min-width: 768px) 451px, 280px"` | `app/(app)/community-standards/page.tsx:28-36` |
| R1 | component | `LiveBoardKeyvisualBackground` mượn từ module kudos-feed (không `dimmed`) | `app/(app)/community-standards/page.tsx:26` |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` ở route và ở layout `(app)` | auth | Khách bị chuyển tới `/login`, người chưa có phòng ban tới onboarding; nội dung tĩnh không nhạy cảm nhưng có nêu người liên hệ nội bộ; [UNVERIFIED] server enforcement — proxy session là lớp thứ hai |
| Cổng prelaunch ở proxy | role | Trước `LAUNCH_AT`, người không phải admin bị chuyển tới `/countdown` |

## Source References

1. Page/View: `app/(app)/community-standards/page.tsx:9-41`
2. Nội dung: `features/awards-portal/components/community-standards-content.tsx:4-56`
3. Nền keyvisual: `features/kudos-feed/components/live-board-keyvisual.tsx:9-19`
4. Nội dung chữ: `messages/vi.json:519-544`
5. Link vào từ composer: `features/kudos-authoring/components/kudo-message-toolbar.tsx:52-60`
6. Parent shell context: `app/(app)/layout.tsx:17-28`

## Source Walkthrough

1. **File:** `app/(app)/community-standards/page.tsx:9-41` — bắt đầu từ trang: bố cục ba vùng và kiểm tra session.
2. **File:** `features/awards-portal/components/community-standards-content.tsx:4-56` — toàn bộ nội dung chữ và cách đọc mảng từ messages.
3. **File:** `messages/vi.json:519-544` — nguồn chữ (màn hình này không có thực thể máy chủ trong `entities.md`).

### Call Hierarchy

```text
CommunityStandardsPage -> requireSunner
CommunityStandardsPage -> LiveBoardKeyvisualBackground | Image
CommunityStandardsPage -> CommunityStandardsContent -> getTranslations("awardsPortal.standards") -> textList(t.raw)
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
messages awardsPortal.standards -> getTranslations / t.raw -> textList -> <ol> và <ul> tĩnh
```

Các hop trên suy ra từ Call Hierarchy ở trên và các trích dẫn trong `## Source References`.

## Unresolved Questions

1. Dòng Liên hệ Hỗ trợ ghi một tài khoản Slack cụ thể của một cá nhân (đại diện BTC SAA) ngay trong messages; chưa rõ có cần chuyển sang cấu hình hay đây là nội dung cố định theo yêu cầu. (`messages/vi.json:519-544`)
2. `screen-flow.md` nêu thêm nguồn vào từ "dropdown chuông" cho dòng Kudo bị ẩn nhưng chưa đọc code của dropdown thông báo để xác nhận link (không đọc: thuộc feature thông báo). (`docs/generated/screen-flow.md:233`)
