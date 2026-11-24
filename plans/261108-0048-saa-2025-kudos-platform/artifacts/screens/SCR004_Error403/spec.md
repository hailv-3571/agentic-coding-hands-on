---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR004_Error403 — Screen Spec

**Screen**: SCR004_Error403: Error403
**Feature**: F002_AppShell
**Type**: atomic
**Route**: /access-denied
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Người đã đăng nhập nhưng không đủ quyền (không phải admin) biết rằng họ không được vào khu vừa mở, và có một nút để về trang chủ.
**Actors:** Sunner không phải admin (khi mở `/admin/*`). Mở trực tiếp URL này thì ai cũng thấy, kể cả khách.
**Entry Conditions:** Proxy dựng thân HTTP 403 từ trang này cho người không phải admin vào `/admin/*`; hoặc guard gọi `forbidden()` (cùng nội dung qua `app/forbidden.tsx`); hoặc mở trực tiếp `/access-denied`.
**Exit Conditions:** Bấm "Về trang chủ" (rời màn).

## 2. Screen Layout

### Layout Sketch

Trang toàn màn hình không có header hay footer (không có markup quản trị): ảnh nền ROOT FURTHER bị phủ mờ, giữa màn hình xếp dọc tiêu đề, hình minh hoạ, dòng giải thích và một nút. Khung `ErrorPanel` này dùng chung với trang 404. (`features/app-shell/components/error-panel.tsx:21-48`)

```
┌─────────────────────────────────────────┐
│ R1: Error Frame (static, min-h-screen)  │
│   (nền ROOT FURTHER, phủ mờ)            │
│ R2: Error Content (static)              │
│        Không có quyền truy cập          │
│           [ hình minh hoạ 403 ]         │
│   Bạn không có quyền truy cập ...       │
│          [ Về trang chủ ]               │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Error Frame (nền + lớp phủ mờ) | static | no | ErrorPanel, Image (nền) |
| R2 | Error Content | static | no | ForbiddenPanel, Image (minh hoạ 403), CTA link |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Không có quyền truy cập | message | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Hình minh hoạ 403 | image | — | Visible | Always | — | static | raw | — | N/A |
| E03 | Bạn không có quyền truy cập tài nguyên này. | message | — | Visible | Always | — | static | raw | — | N/A |
| E04 | Về trang chủ | link | — | Enabled | Always | Về trang chủ | static | raw | — | N/A |

Ghi chú: E01 là thẻ `h1`; E02 và ảnh nền là trang trí (`alt=""`). Chữ tiếng Anh: "Access Denied", "You don’t have permission to access this resource.", "Back to home" (`messages/en.json`, khóa `errors.forbidden`). Không có dữ liệu người dùng nào được hiển thị.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Về trang chủ | E04 | click | — | Rời màn (điều hướng, mô tả ở § 8) | `features/app-shell/components/error-panel.tsx:42-47` |

### Happy Path

1. Người dùng thấy tiêu đề, hình minh hoạ và dòng giải thích ở R2.
2. Người dùng bấm "Về trang chủ" và rời màn.

### Branches

N/A — single-action screen, no branches

### Interaction Notes

N/A — no non-trivial interaction patterns detected (only standard form input bindings).

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| default (HTTP 403) | Proxy dựng thân 403 cho người không phải admin vào trang GET `/admin/*` | Trang đầy đủ (cùng nội dung), trạng thái HTTP 403, `cache-control: private, no-store` | Bấm E04 | `shared/auth/access-denied-response.ts:48-51` |
| default (HTTP 200) | Mở trực tiếp `/access-denied` | Cùng nội dung, trạng thái HTTP 200, `noindex` | Bấm E04 | `app/access-denied/page.tsx:5-8,16-18` |
| default (guard) | Guard gọi `forbidden()` | Cùng nội dung qua `app/forbidden.tsx` | Bấm E04 | `app/forbidden.tsx:4-6` |
| error (proxy không dựng được trang) | Fetch tới `/access-denied` lỗi, quá 5 giây hoặc trả không OK | Chỉ có dòng chữ thuần "403 Forbidden", HTTP 403 (không có nút) | none | `shared/auth/access-denied-response.ts:52-59` |

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
| external | Mở `/admin/*` (proxy trả HTTP 403, thân là trang này) | Đã đăng nhập, role không phải admin | `shared/auth/session-proxy.ts:108-110` |
| SCR002_AdminLayout | Guard `requireShellAdmin()` gọi `forbidden()` (lớp thứ hai) | Role không phải admin | `shared/auth/admin-guard.ts:33` |
| external | Truy cập trực tiếp `/access-denied` | Không có (trang công khai, HTTP 200) | `shared/auth/public-paths.ts:17,33-40` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Về trang chủ | E04 | — | SCR011_Homepage | redirect | `features/app-shell/components/forbidden-panel.tsx:17` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | partial | Landmark `main`, một `h1`; ảnh trang trí `alt=""`, lớp phủ `aria-hidden`; link không cần nhãn riêng |
| Keyboard navigation | supported | Chỉ có một link native, có viền focus `focus-visible:outline-2` |
| Focus management | unmanaged | Không autofocus, không focus trap |
| Screen reader compatibility | unknown | Có `h1` và `main`; chưa có kiểm thử với screen reader |
| Error announcement | not implemented | Không có `role="alert"` hay vùng `aria-live`; nội dung lỗi là nội dung chính của trang |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| desktop (md+) | E01 | Tiêu đề lớn hơn (`headline-large` → `display-large`) và cách hình minh hoạ xa hơn | `features/app-shell/components/error-panel.tsx:32` |
| desktop (md+) | E02 | Hình minh hoạ rộng 428px (dưới `md`: 288px) | `features/app-shell/components/forbidden-panel.tsx:16` |
| desktop (md+) | E03 | Chữ giải thích lớn hơn (`title-large` → `headline-small`) | `features/app-shell/components/error-panel.tsx:41` |
| desktop (md+) | R1 | Khoảng cách giữa các khối `gap-8` → `md:gap-10` | `features/app-shell/components/error-panel.tsx:21` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | endpoint | GET `/access-denied` (trang công khai, không cần phiên): `generateMetadata` đặt tiêu đề và `robots: noindex, nofollow`; render `ForbiddenPanel` | `app/access-denied/page.tsx:5-18` |
| § 1. | handler | `accessDeniedPage(request)`: fetch `/access-denied` (timeout 5 giây, `redirect: "manual"`, `cache: "no-store"`), trả `NextResponse(body, { status: 403, cache-control: "private, no-store" })`; chỉ chuyển cookie `NEXT_LOCALE` và `accept-language`, không chuyển cookie phiên | `shared/auth/access-denied-response.ts:31-51` |
| § 1. | helper | Địa chỉ fetch lấy từ cấu hình máy chủ (`INTERNAL_APP_ORIGIN` hoặc `http://127.0.0.1:{PORT}`), không lấy từ request, để tránh SSRF qua header Host | `shared/auth/access-denied-response.ts:26-29` |
| § 1. | helper | Lý do proxy tự dựng thân: dưới Cache Components shell đã commit HTTP 200 trước khi `forbidden()` chạy, nên cần thân trả trực tiếp từ proxy để giữ status 403 | `shared/auth/access-denied-response.ts:7-17` |
| § 1. | handler | `forbiddenResponse`: trang GET/HEAD không có `next-action` → `accessDeniedPage`; Server Action và method khác → JSON `{ code: "forbidden" }` 403 | `shared/auth/session-proxy.ts:93-96` |
| § 1. | component | `ForbiddenPanel` là nguồn duy nhất cho `app/forbidden.tsx` và `app/access-denied/page.tsx`; truyền hình `error-403-illustration.webp` 860x859 và CTA tới `APP_ROUTES.home` | `features/app-shell/components/forbidden-panel.tsx:9-19` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| ErrorPanel | `illustration` / `cta` (props) | Biến thể 403 | Hình `error-403-illustration.webp`, nút về `/`, lớp rộng `w-72 md:w-107` | N/A — không có DISC-### trong entities |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Proxy bước 4b: `isAdminPath` + role từ DB khác admin | role | Người không phải admin xem được trang admin thay vì trang 403 |
| `requireAdmin()` → `forbidden()` ở guard (lớp thứ hai) | role | Non-admin chạy tiếp vào markup admin nếu proxy bị bỏ qua |
| `/access-denied` công khai, không phiên | auth | Không có: trang tĩnh, chỉ chứa chữ cố định, không lộ chi tiết lỗi hay dữ liệu người dùng |

## Source References

1. Page/View: `app/access-denied/page.tsx:1-18`
2. Guard page: `app/forbidden.tsx:1-6`
3. Panel: `features/app-shell/components/forbidden-panel.tsx:1-20`
4. Frame: `features/app-shell/components/error-panel.tsx:1-50`
5. Proxy response: `shared/auth/access-denied-response.ts:1-60`
6. Proxy gate: `shared/auth/session-proxy.ts:92-110`
7. Guard: `shared/auth/admin-guard.ts:12-35`
8. Public paths: `shared/auth/public-paths.ts:12-44`
9. UI copy: `messages/vi.json:22-27`

## Source Walkthrough

1. **File:** `app/access-denied/page.tsx:1-18` — trang công khai mà proxy đọc và người dùng có thể mở trực tiếp.
2. **File:** `features/app-shell/components/forbidden-panel.tsx:1-20` — nội dung 403 dùng chung hai điểm vào.
3. **File:** `features/app-shell/components/error-panel.tsx:1-50` — khung toàn màn hình chung 403/404.
4. **File:** `shared/auth/session-proxy.ts:92-110` — quyết định khi nào trả 403.
5. **File:** `shared/auth/access-denied-response.ts:1-60` — cách proxy dựng thân 403 và nhánh dự phòng.

Lớp dữ liệu: màn không đọc dữ liệu nào (chữ tĩnh `errors.forbidden`); vai trò kiểm ở proxy dựa trên MODEL004_Profile.role.

### Call Hierarchy

```text
Proxy (session-proxy) -> accessDeniedPage -> fetch GET /access-denied -> AccessDeniedPage -> ForbiddenPanel -> ErrorPanel
Guard forbidden() -> app/forbidden.tsx -> ForbiddenPanel -> ErrorPanel
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
errors.forbidden (messages vi/en) -> getTranslations -> ForbiddenPanel -> ErrorPanel (title, mô tả, CTA)
```

## Unresolved Questions

- Mở trực tiếp `/access-denied` trả HTTP 200 và ai cũng mở được; chỉ proxy mới dựng HTTP 403 (`app/access-denied/page.tsx:10-15`). Hành vi này ghi lại đúng như code. [NEEDS_DOMAIN_CONFIRMATION] — trang 403 mở công khai trả 200; unknown whether intentional design or oversight.
- Nút "Về trang chủ" với người không phải admin trước `LAUNCH_AT` sẽ bị proxy đưa tiếp tới `/countdown` (`features/awards-portal/server/prelaunch-gate.ts:67-69`); screen-flow chỉ ghi đích SCR011_Homepage. [UNVERIFIED] — needs runtime confirmation.
