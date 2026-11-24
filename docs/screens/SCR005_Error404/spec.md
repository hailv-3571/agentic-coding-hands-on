---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR005_Error404 — Screen Spec

**Screen**: SCR005_Error404: Error404
**Feature**: F002_AppShell
**Type**: atomic
**Route**: mọi URL không khớp route nào (không có đường dẫn cụ thể; render bởi `app/not-found.tsx`, trạng thái HTTP 404)
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Người dùng mở một địa chỉ không tồn tại biết rằng trang không có, và có một nút để quay về trang chính (Home nếu đã đăng nhập, Login nếu không đọc được hồ sơ người dùng).
**Actors:** Sunner đã đăng nhập; người có phiên nhưng không có hồ sơ (khách thông thường bị proxy chuyển `/login` trước, xem Unresolved Questions).
**Entry Conditions:** URL không khớp route nào của ứng dụng và đã qua cổng proxy.
**Exit Conditions:** Bấm nút Home hoặc Login (rời màn).

## 2. Screen Layout

### Layout Sketch

Trang toàn màn hình không có header hay footer: ảnh nền ROOT FURTHER bị phủ mờ, giữa màn hình xếp dọc tiêu đề "KHÔNG TÌM THẤY", hình minh hoạ 404 (rộng hơn hình 403), dòng giải thích và một nút. Dùng chung khung `ErrorPanel` với trang 403. (`app/not-found.tsx:14-21`, `features/app-shell/components/error-panel.tsx:21-48`)

```
┌─────────────────────────────────────────┐
│ R1: Error Frame (static, min-h-screen)  │
│   (nền ROOT FURTHER, phủ mờ)            │
│ R2: Error Content (static)              │
│            KHÔNG TÌM THẤY               │
│           [ hình minh hoạ 404 ]         │
│   Tài nguyên bạn tìm không tồn tại ...  │
│     [ Về trang chủ | Đăng nhập ]        │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Error Frame (nền + lớp phủ mờ) | static | no | ErrorPanel, Image (nền) |
| R2 | Error Content | static | no | Image (minh hoạ 404), CTA link |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | KHÔNG TÌM THẤY | message | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Hình minh hoạ 404 | image | — | Visible | Always | — | static | raw | — | N/A |
| E03 | Tài nguyên bạn tìm không tồn tại hoặc đã bị xóa. | message | — | Visible | Always | — | static | raw | — | N/A |
| E04 | Về trang chủ | link | — | Enabled | Conditional | Về trang chủ | store state | raw | — | N/A |
| E05 | Đăng nhập | link | — | Enabled | Conditional | Tới màn đăng nhập | store state | raw | — | N/A |

Ghi chú: E04 và E05 chiếm cùng một vị trí, mỗi lúc chỉ hiện một nút; E01 là thẻ `h1`; E02 và ảnh nền là trang trí (`alt=""`). Chữ tiếng Anh: "NOT FOUND", "The resource you’re looking for doesn’t exist or has been removed.", "Back to home", "Log in" (`messages/en.json`, khóa `errors.notFound`). Màn không hiển thị tên hay dữ liệu người dùng; trạng thái đăng nhập chỉ dùng để chọn nút.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Về trang chủ | E04 | click | Có phiên | Rời màn (mô tả ở § 8) | `app/not-found.tsx:10-12` |
| Tới đăng nhập | E05 | click | Không đọc được hồ sơ người dùng | Rời màn (mô tả ở § 8) | `app/not-found.tsx:10-12` |

### Happy Path

1. Người dùng thấy tiêu đề, hình minh hoạ và dòng giải thích ở R2.
2. Người dùng bấm nút duy nhất đang hiện (Home hoặc Login) và rời màn.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Có phiên và đọc được hồ sơ người dùng | Nút "Về trang chủ" | `app/not-found.tsx:9-12` |
| Bước 1 | Có phiên nhưng không có hồ sơ (khách thông thường bị proxy chuyển `/login` trước khi tới đây) | Nút "Đăng nhập" | `app/not-found.tsx:9-12`, `features/app-shell/server/shell-session.ts:28-33` |

### Interaction Notes

N/A — no non-trivial interaction patterns detected (only standard form input bindings).

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Đọc phiên và hồ sơ để chọn nút | Không có skeleton; trình duyệt chờ đến khi render xong | none | `app/not-found.tsx:9` |
| default (đã đăng nhập) | URL không khớp, có phiên | Nút "Về trang chủ", HTTP 404 | Bấm E04 | `app/not-found.tsx:6,10-12` |
| default (không có hồ sơ) | URL không khớp, không đọc được hồ sơ người dùng | Nút "Đăng nhập", HTTP 404 | Bấm E05 | `app/not-found.tsx:10-12` |
| error | Đọc hồ sơ người dùng ném lỗi (DB) | [UNVERIFIED] code không bắt lỗi ở bước này, kết quả hiển thị chưa xác nhận — needs runtime confirmation | [UNVERIFIED] | `features/app-shell/server/shell-session.ts:28-33` |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Đã đăng nhập thì thấy nút Về trang chủ | auth | E04 | Đọc được hồ sơ người dùng | Có phiên nhưng không có hồ sơ | Consequence if bypassed: chỉ đổi nhãn và đích của nút; không lộ dữ liệu |
| Không có hồ sơ thì thấy nút Đăng nhập | auth | E05 | Người có phiên nhưng không có hồ sơ (khách thông thường bị proxy chuyển `/login` trước) | Đã đăng nhập có hồ sơ | Consequence if bypassed: chỉ đổi nhãn và đích của nút; không lộ dữ liệu |

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
| external | Mở URL không khớp route nào | Không có điều kiện thêm (trừ khi proxy chặn trước, xem Unresolved Questions) | `app/not-found.tsx:6-7` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Bấm nút Home | E04 | Đã đăng nhập | SCR011_Homepage | redirect | `app/not-found.tsx:11` |
| Bấm nút Login | E05 | Có phiên nhưng không có hồ sơ | SCR001_Login | redirect | `app/not-found.tsx:12` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | partial | Landmark `main`, một `h1`; ảnh trang trí `alt=""`, lớp phủ `aria-hidden` |
| Keyboard navigation | supported | Chỉ có một link native, có viền focus `focus-visible:outline-2` |
| Focus management | unmanaged | Không autofocus, không focus trap |
| Screen reader compatibility | unknown | Có `h1` và `main`; chưa có kiểm thử với screen reader |
| Error announcement | not implemented | Không có `role="alert"` hay vùng `aria-live`; nội dung lỗi là nội dung chính của trang |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop (md+) | E01 | Tiêu đề lớn hơn (`headline-large` → `display-large`) và cách hình minh hoạ xa hơn | `features/app-shell/components/error-panel.tsx:32` |
| desktop (md+) | E02 | Hình minh hoạ rộng 664px (dưới `md`: 320px) | `app/not-found.tsx:19` |
| desktop (md+) | E03 | Chữ giải thích lớn hơn (`title-large` → `headline-small`) | `features/app-shell/components/error-panel.tsx:41` |
| desktop (md+) | R1 | Khoảng cách giữa các khối `gap-8` → `md:gap-10` | `features/app-shell/components/error-panel.tsx:21` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | component | `app/not-found.tsx` là trang `not-found` gốc của Next.js: render cho mọi URL không khớp route (HTTP 404) và cho `notFound()` không có `not-found.tsx` riêng | `app/not-found.tsx:6-23` |
| E04, E05 | helper | `getShellUser()` (memoize bằng `cache`): có người dùng → `{ href: APP_ROUTES.home, label: ctaHome }`, ngược lại `{ href: APP_ROUTES.login, label: ctaLogin }` | `app/not-found.tsx:9-12`, `features/app-shell/server/shell-session.ts:28-33` |
| E02 | component | Hình `error-404-illustration.webp` 1100x721, lớp `w-80 md:w-166` | `app/not-found.tsx:18-19` |
| § 1. | helper | `/kudos/[id]` và `/profile/[userId]` có `not-found.tsx` riêng (trạng thái của SCR006_KudoDetail và SCR015_OtherProfile), không dùng trang này | `app/(app)/kudos/[id]/not-found.tsx:1`, `app/(app)/profile/[userId]/not-found.tsx:1` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| ErrorPanel | `illustration` / `cta` (props) | Biến thể 404 | Hình `error-404-illustration.webp`, nút chọn theo phiên, lớp rộng `w-80 md:w-166` | N/A — không có DISC-### trong entities |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Không có guard riêng; `getShellUser()` chỉ chọn nút, không hiển thị tên hay dữ liệu người dùng | auth | Không có: khách và người đã đăng nhập thấy cùng nội dung, chỉ nút khác nhau |
| Proxy: URL không công khai thì khách bị chuyển `/login?next=` trước khi tới trang này | auth | Khách thấy 404 thay vì bị chuyển (không lộ dữ liệu) |

## Source References

1. Page/View: `app/not-found.tsx:1-23`
2. Frame: `features/app-shell/components/error-panel.tsx:1-50`
3. Session seam: `features/app-shell/server/shell-session.ts:1-44`
4. Route map: `shared/ui/app-routes.ts:1-15`
5. Proxy gate: `shared/auth/route-access-policy.ts:29-40`
6. UI copy: `messages/vi.json:28-33`

## Source Walkthrough

1. **File:** `app/not-found.tsx:1-23` — trang 404: chọn nút theo phiên và truyền nội dung vào khung.
2. **File:** `features/app-shell/components/error-panel.tsx:1-50` — khung toàn màn hình chung 403/404.
3. **File:** `features/app-shell/server/shell-session.ts:1-44` — `getShellUser()` quyết định người dùng là khách hay đã đăng nhập.
4. **File:** `shared/auth/route-access-policy.ts:29-40` — luật proxy chuyển khách đi `/login` trước khi tới 404.

Lớp dữ liệu: chỉ đọc phiên và hồ sơ (MODEL004_Profile) để chọn nút; không hiển thị.

### Call Hierarchy

```text
NotFound (app/not-found.tsx) -> getShellUser -> getSessionUser -> findSessionProfile
NotFound -> ErrorPanel -> Image / Link(cta)
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
getShellUser() -> user | null -> cta (href, label) -> ErrorPanel (nút Home hoặc Login)
errors.notFound (messages vi/en) -> getTranslations -> tiêu đề, mô tả
```

## Unresolved Questions

- Khách mở URL không khớp thường không thấy trang này: proxy chuyển mọi đường dẫn không công khai tới `/login?next=` trước (`shared/auth/route-access-policy.ts:35-39`). Nhánh nút "Đăng nhập" nhiều khả năng chỉ đạt được khi người dùng có phiên nhưng không có hồ sơ; khi đó `/login` bị proxy đưa về `/` và `/` trả 401. screen-flow và screen-list mô tả "khách thấy nút Login". [UNVERIFIED] — needs runtime confirmation.
- `getShellUser()` không bắt lỗi đọc hồ sơ (`features/app-shell/server/shell-session.ts:31`), nên lỗi DB khi dựng trang 404 sẽ nổi lên; chưa rõ trang hiển thị gì. [UNVERIFIED] — needs runtime confirmation.
