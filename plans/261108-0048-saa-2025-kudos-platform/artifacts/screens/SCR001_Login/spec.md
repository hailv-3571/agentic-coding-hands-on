---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR001_Login — Screen Spec

**Screen**: SCR001_Login: Login
**Feature**: F001_Auth
**Type**: atomic
**Route**: /login (query `next`, `error`)
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Khách chưa có phiên (Sunner dùng email công ty) đăng nhập vào SAA 2025 bằng tài khoản Google; họ gặp màn này khi mở một trang cần phiên hoặc bị đăng xuất.
**Actors:** Khách (chưa đăng nhập). Người đã đăng nhập không thấy màn này vì proxy đưa về trang chủ.
**Entry Conditions:** Chưa có phiên hợp lệ (người đã đăng nhập bị đưa về `/` trước khi render). `/login` luôn công khai, kể cả trước ngày mở cổng.
**Exit Conditions:** Bấm nút Google rồi hoàn tất OAuth (người dùng rời màn); hoặc OAuth lỗi và quay lại màn này kèm banner lỗi.

## 2. Screen Layout

### Layout Sketch

Trang `/login` nằm trong layout nhóm `(public)`: thanh header trên cùng (logo + đổi ngôn ngữ, không có menu), phần thân chiếm hết chiều cao còn lại và footer tối giản chỉ có dòng bản quyền. Thân trang có ảnh nền ROOT FURTHER phủ kín, chạy ngầm dưới header mờ (`-mt-20`); nội dung xếp dọc gồm wordmark (tiêu đề `h1`), hai dòng giới thiệu và form Google. Từ breakpoint `md` nội dung canh giữa theo chiều dọc và canh trái, ảnh nền dời sang phải; dưới `md` nút nằm sát đáy phần thân. (`app/(public)/layout.tsx:6-13`, `app/(public)/login/page.tsx:32-66`)

```
┌───────────────────────────────────────────────┐
│ R1: Public Header (sticky)   [Logo]  [VN ▾]   │
├───────────────────────────────────────────────┤
│ R2: Login Content (static, artwork nền)       │
│    ROOT FURTHER (h1)                          │
│    Bắt đầu hành trình ... / Đăng nhập ...     │
│  - - - [banner lỗi] - - -                     │
│    [ LOGIN With Google (G) ]                  │
├───────────────────────────────────────────────┤
│ R3: Footer tối giản (static)  © Sun* 2025     │
└───────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Public Header | sticky | no | PublicHeader, BrandLogo, LanguageSwitcher |
| R2 | Login Content | static | no | Image (artwork), Image (wordmark `h1`), GoogleSignInForm, LoginErrorBanner, GoogleSignInButton |
| R3 | Minimal Footer | static | no | AppFooter (variant `minimal`) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Logo Sun* Annual Awards 2025 | image | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Đổi ngôn ngữ (VN / EN) | button | — | Hiện ngôn ngữ hiện tại | Always | Mở danh sách Tiếng Việt / English | static | — | — | N/A |
| E03 | ROOT FURTHER (wordmark) | image | — | Visible | Always | — | static | raw | — | N/A |
| E04 | Hai dòng giới thiệu | message | — | Visible | Always | — | static | raw | — | N/A |
| E05 | Banner lỗi đăng nhập | message | — | Hidden | Conditional | — | route param | raw | hidden | binding: `error` |
| E06 | LOGIN With Google | button | — | Enabled | Always | Bắt đầu đăng nhập Google | — | — | — | N/A |
| E07 | Bản quyền Sun* © 2025 | display field | — | Visible | Always | — | static | raw | — | N/A |

Ghi chú: ô ẩn `next` trong form không hiển thị cho người dùng nên không nằm trong bảng (xem Implementation Mapping). E04 là hai dòng `introLine1` / `introLine2`. Nội dung tiếng Việt: "Bắt đầu hành trình của bạn cùng SAA 2025." / "Đăng nhập để khám phá!" (`messages/vi.json`, khóa `auth.login`). Nhãn nút trong cả hai ngôn ngữ là "LOGIN With Google".

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Bắt đầu đăng nhập Google | E06 | click | Chưa ở trạng thái pending | Nút bị khóa, hiện spinner, banner lỗi cũ biến mất | `features/auth/components/google-sign-in-button.tsx:24-40` |
| Mở danh sách ngôn ngữ | E02 | click | — | Mở danh sách VN / EN; chọn ngôn ngữ khác thì ghi cookie rồi làm mới trang (chi tiết của component dùng chung xem Source feature App Shell) | `features/app-shell/components/language-switcher.tsx:33-48` |

### Happy Path

1. Khách vào `/login`, thấy wordmark, hai dòng giới thiệu và nút "LOGIN With Google" ở R2.
2. Khách bấm nút Google; nút bị khóa và đổi biểu tượng G thành spinner (nhãn "Đang chuyển tới Google…").
3. Trình duyệt được chuyển sang Google để chọn tài khoản; màn này kết thúc ở bước chuyển hướng.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Mở trang | URL có `?error=domain_not_allowed` hoặc `?error=auth_failed` | Banner lỗi tương ứng hiện phía trên nút | `app/(public)/login/page.tsx:27`, `features/auth/components/google-sign-in-form.tsx:26-30` |
| Mở trang | `?error` là giá trị khác hoặc không có | Không hiện banner (giá trị lạ bị bỏ qua) | `features/auth/login-error-codes.ts:20-24` |
| Bước 2 (bấm nút) | Không khởi động được OAuth (Supabase trả lỗi hoặc không có URL) | Banner "Đăng nhập không thành công, vui lòng thử lại." hiện lại, nút mở khóa | `features/auth/server/sign-in-with-google-action.ts:46-48` |

### Interaction Notes

- **Bấm đúp nút Google không mở hai luồng OAuth — nút khóa ngay khi action đang chạy** — source: `features/auth/components/google-sign-in-button.tsx:28-29`
- **Banner lỗi cũ biến mất ngay khi người dùng bắt đầu lần thử mới, chỉ lỗi của lần thử mới mới hiện** — source: `features/auth/components/google-sign-in-form.tsx:25-26`
- **Đường dẫn `next` được giữ nguyên qua OAuth để quay lại đúng trang đang đi tới** — source: `app/(public)/login/page.tsx:26`, `features/auth/components/google-sign-in-form.tsx:31`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| idle | Mở trang không có `error` | Wordmark, giới thiệu, nút Google bật, không banner | Bấm E06, đổi ngôn ngữ | `features/auth/components/google-sign-in-form.tsx:19-26` |
| loading (đang chuyển Google) | Action `signInWithGoogle` đang chạy | Nút khóa, `aria-busy`, spinner thay biểu tượng G, con trỏ chờ | none (nút khóa) | `features/auth/components/google-sign-in-button.tsx:24-40` |
| error (từ callback) | `?error=domain_not_allowed` / `auth_failed` | Banner đỏ phía trên nút | Bấm lại E06 | `features/auth/components/google-sign-in-form.tsx:26-30` |
| error (khởi động OAuth thất bại) | Action trả `{ error: "auth_failed" }` | Banner `auth_failed`, nút mở khóa | Bấm lại E06 | `features/auth/server/sign-in-with-google-action.ts:46-48` |
| success | OAuth khởi động được | Trình duyệt chuyển sang Google (không có toast) | none | `features/auth/server/sign-in-with-google-action.ts:50` |
| empty | — | N/A — màn không có vùng danh sách/dữ liệu | — | — |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E05 | Chỉ tài khoản đúng tên miền công ty được đăng nhập (kiểm ở backend, màn chỉ hiển thị kết quả) | "Chỉ tài khoản @{tên miền} được phép đăng nhập." (en: "Only @{domain} accounts can sign in.") | server response (`?error=domain_not_allowed`) |
| E05 | Đăng nhập phải hoàn tất thành công | "Đăng nhập không thành công, vui lòng thử lại." (en: "Sign-in failed, please try again.") | server response (`?error=auth_failed` hoặc action thất bại) |

Màn không có ô nhập nào để kiểm tra phía client.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Banner lỗi chỉ hiện khi có mã lỗi hợp lệ | configuration | E05 | URL có `error` hợp lệ, hoặc action vừa thất bại, và không đang pending | Không có lỗi, đang pending, hoặc `error` là giá trị lạ | — |
| Tên miền trong thông điệp lấy từ cấu hình công ty | configuration | E05 | Mã lỗi `domain_not_allowed` | Mã lỗi khác | Giá trị `@{ALLOWED_EMAIL_DOMAIN}` chỉ có ở server, truyền xuống form qua prop |
| Người đã đăng nhập không bao giờ thấy màn này | auth | E01..E07 (cả màn) | Khách | Đã có phiên (proxy đưa về `/`) | Consequence if bypassed: người đã đăng nhập vào được `/login` chỉ thấy lại nút đăng nhập, không lộ dữ liệu |

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
| external | Khách mở trang cần phiên, proxy chuyển tới `/login?next=<đường dẫn gốc>` | Chưa có phiên | `shared/auth/route-access-policy.ts:37-39` |
| external | Mở trực tiếp `/login` | Khách (`/login` luôn công khai) | `shared/auth/public-paths.ts:33-40` |
| external | `/auth/callback` thất bại, quay lại `/login?next=&error=<code>` | Lỗi `domain_not_allowed` / `auth_failed` | `app/auth/callback/route.ts:18-21` |
| SCR003_AppLayout | Menu tài khoản › Logout (`signOut`) | Đăng xuất thành công | `shared/auth/sign-out-action.ts:23` |
| SCR002_AdminLayout | Menu tài khoản › Logout | Đăng xuất thành công | `shared/auth/sign-out-action.ts:23` |
| SCR005_Error404 | Nút Đăng nhập | Có phiên nhưng không có hồ sơ (khách thông thường bị proxy chuyển `/login` trước) | `app/not-found.tsx:12` |
| SCR010_CountdownPrelaunch | Tự gõ `/login` (màn đếm ngược không có link) | Khách | `shared/auth/public-paths.ts:34` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Bắt đầu đăng nhập Google | E06 | Khởi động OAuth thành công | external (Google OAuth, rồi `/auth/callback`) | redirect | `features/auth/server/sign-in-with-google-action.ts:50` |
| Hoàn tất OAuth | E06 | Hồ sơ chưa có phòng ban | SCR020_OnboardingDepartment | redirect (từ callback) | `app/auth/callback/route.ts:30-31` |
| Hoàn tất OAuth | E06 | Đã có phòng ban và `next` rỗng | SCR011_Homepage | redirect (từ callback) | `app/auth/callback/route.ts:30-31` |
| Hoàn tất OAuth | E06 | Trước `LAUNCH_AT`, người không phải admin | SCR010_CountdownPrelaunch | redirect (proxy chặn bước tiếp) | `features/awards-portal/server/prelaunch-gate.ts:67-69` |
| Quay lại sau lỗi | E06 | OAuth hoặc kiểm tra tên miền lỗi | (stays on screen) — `/login?error=` | redirect | `app/auth/callback/route.ts:21-37` |
| Đổi ngôn ngữ | E02 | Chọn ngôn ngữ khác | (stays on screen) | làm mới trang | `features/app-shell/components/language-switcher.tsx:39-40` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | partial | Banner `role="alert"`; spinner `role="status"` có nhãn; nút `aria-busy`; ảnh nền và biểu tượng G `aria-hidden`; wordmark có `alt` làm `h1` |
| Keyboard navigation | supported | Nút và công tắc ngôn ngữ là phần tử native, có viền focus (`focus-visible:outline-2`); không có phím tắt riêng |
| Focus management | unmanaged | Không autofocus; danh sách ngôn ngữ trả focus về nút khi nhấn Escape (component dùng chung) |
| Screen reader compatibility | unknown | Có landmark `main`, một `h1`; chưa có kiểm thử với screen reader |
| Error announcement | supported | Banner lỗi dùng `role="alert"` nên được đọc ngay khi xuất hiện |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (< md) | R2 | Nút Google canh giữa và sát đáy phần thân (`mt-auto`); wordmark và dòng giới thiệu canh trái; ảnh nền lệch `65%` | `app/(public)/login/page.tsx:40,46,63`, `features/auth/components/google-sign-in-form.tsx:29` |
| desktop (md+) | R2 | Nội dung canh giữa theo chiều dọc, thụt trái 16px; ảnh nền dời sang phải, lớp phủ chuyển thành gradient ngang | `app/(public)/login/page.tsx:40-46,63` |
| desktop (md+) | E03 | Wordmark rộng 451px (dưới `md`: 245px) | `app/(public)/login/page.tsx:55` |
| desktop (md+) | E06 | Nút cao 60px, chữ lớn, độ rộng theo nội dung (dưới `md`: cao 40px, rộng tối đa 245px) | `features/auth/components/google-sign-in-button.tsx:30` |
| desktop (md+ / xl) | R1 | Padding ngang của header tăng `px-4` → `md:px-12` → `xl:px-36` | `features/app-shell/components/public-header.tsx:11` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| E06 | endpoint | POST `/login` (Server Action `signInWithGoogle`, ROUTE021): đọc `next`, dựng `redirectTo` = `{origin}/auth/callback[?next=]`, gọi `supabase.auth.signInWithOAuth({ provider: "google", queryParams: { hd } })` | `features/auth/server/sign-in-with-google-action.ts:29-43` |
| E06 | endpoint | Request: field `next` (ô ẩn, đã qua `safeNextPath`); Success: `redirect(data.url)` sang Google; lỗi: ghi log rồi trả `{ error: "auth_failed" }` | `features/auth/server/sign-in-with-google-action.ts:33-50` |
| E06 | helper | `hd` chỉ thu hẹp danh sách tài khoản Google (UX); cổng tên miền thật chạy ở database và được kiểm lại ở callback | `features/auth/server/sign-in-with-google-action.ts:24-27` |
| E05 | helper | `parseLoginErrorCode(?error)` chỉ chấp nhận `domain_not_allowed` hoặc `auth_failed`; `loginErrorFromOAuth` ánh xạ lỗi Supabase thành hai mã đó | `features/auth/login-error-codes.ts:5,16-24` |
| E05 | js | `error = pending ? null : (state.error ?? (state === idle ? initialError : null))` (`useActionState`) | `features/auth/components/google-sign-in-form.tsx:24-26` |
| § 7. | helper | `decideRouteAccess`: path công khai và đã có phiên thì `redirect` về `/` | `shared/auth/route-access-policy.ts:30-34` |
| § 1. | helper | `requestOrigin()` lấy origin từ header `origin`, rồi `x-forwarded-host` / `host` | `features/auth/server/sign-in-with-google-action.ts:13-20` |
| E02 | component | `LanguageSwitcher` (client): `setLocaleAction` ghi cookie `NEXT_LOCALE` | `features/app-shell/components/language-switcher.tsx:15` |
| § 2. | component | `export const instant = false` — trang đọc `?next` / `?error` nên là route chặn (blocking) | `app/(public)/login/page.tsx:15` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| AppFooter | `variant` | `minimal` (chỉ dòng bản quyền) | `variant="minimal"` | N/A — không có DISC-### trong entities |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Proxy: `/login` nằm trong allowlist công khai; có phiên thì chuyển về `/` | auth | Nếu bỏ qua: người đã đăng nhập thấy lại form, không lộ dữ liệu [UNVERIFIED] server enforcement — static analysis cannot confirm API middleware |
| `safeNextPath(next)` chỉ nhận đường dẫn cùng origin | permission | Open redirect: người dùng có thể bị chuyển sang trang ngoài sau đăng nhập |
| Cổng tên miền email (auth hook + trigger DB + kiểm lại ở callback) | permission | Tài khoản ngoài công ty có thể có phiên; màn chỉ hiển thị `domain_not_allowed` |
| Supabase Auth đối chiếu `redirectTo` với allow-list | auth | Host giả có thể dẫn mã OAuth về origin lạ |

## Source References

1. Page/View: `app/(public)/login/page.tsx:1-69`
2. Layout: `app/(public)/layout.tsx:1-13`
3. Form: `features/auth/components/google-sign-in-form.tsx:1-35`
4. Button: `features/auth/components/google-sign-in-button.tsx:1-44`
5. Banner: `features/auth/components/login-error-banner.tsx:1-14`
6. Error codes: `features/auth/login-error-codes.ts:1-24`
7. Server Action: `features/auth/server/sign-in-with-google-action.ts:1-51`
8. Header: `features/app-shell/components/public-header.tsx:1-17`
9. Footer: `features/app-shell/components/app-footer.tsx:1-55`
10. Route gate: `shared/auth/route-access-policy.ts:1-40`
11. Callback (context): `app/auth/callback/route.ts:1-39`
12. UI copy: `messages/vi.json:1-20`

## Source Walkthrough

1. **File:** `app/(public)/login/page.tsx:1-69` — trang chính: đọc `next` / `error`, dựng artwork, wordmark và form.
2. **File:** `app/(public)/layout.tsx:1-13` — khung `(public)` đặt header và footer quanh trang.
3. **File:** `features/auth/components/google-sign-in-form.tsx:1-35` — form `useActionState`, chọn lỗi nào hiển thị.
4. **File:** `features/auth/components/google-sign-in-button.tsx:1-44` — trạng thái pending của nút.
5. **File:** `features/auth/server/sign-in-with-google-action.ts:1-51` — Server Action khởi động OAuth.
6. **File:** `features/auth/login-error-codes.ts:1-24` — mã lỗi và cách phân tích `?error`.
7. **File:** `shared/auth/route-access-policy.ts:1-40` — luật proxy cho `/login` (công khai, đã đăng nhập thì về `/`).

Lớp dữ liệu: màn không đọc bảng nào (mã lỗi lấy từ query, tên miền từ cấu hình `ALLOWED_EMAIL_DOMAIN`); hồ sơ người dùng do callback tạo, xem entities.md MODEL004_Profile.

### Call Hierarchy

```text
LoginPage (page.tsx) -> GoogleSignInForm -> GoogleSignInButton
                                         -> LoginErrorBanner
GoogleSignInForm -> signInWithGoogle (Server Action) -> supabase.auth.signInWithOAuth
(public)/layout -> PublicHeader -> LanguageSwitcher ; AppFooter(minimal)
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
?next / ?error -> safeNextPath / parseLoginErrorCode (page.tsx:26-27) -> props của GoogleSignInForm
Bấm E06 -> useActionState(pending=true) -> signInWithGoogle -> redirect(Google) | lỗi auth_failed -> banner
```

## Unresolved Questions

- Nhãn nút trong cả hai ngôn ngữ là "LOGIN With Google" (`messages/vi.json:12`), khác với mô tả "Đăng nhập bằng Google" trong tài liệu sinh ra; chưa rõ đây là chủ ý theo Figma hay cần dịch. [NEEDS_DOMAIN_CONFIRMATION] — nhãn nút tiếng Việt; unknown whether intentional design or missing translation.
- Chưa xác nhận bằng chạy thật thông điệp lỗi của Supabase hook `before_user_created` có luôn là `domain_not_allowed` — [UNVERIFIED] — needs runtime confirmation.
