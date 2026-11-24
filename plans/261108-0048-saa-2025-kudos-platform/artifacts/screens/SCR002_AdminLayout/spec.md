---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR002_AdminLayout — Screen Spec

**Screen**: SCR002_AdminLayout: AdminLayout
**Feature**: F002_AppShell
**Type**: atomic
**Route**: /admin/overview, /admin/review, /admin/users, /admin/settings (`/admin` chỉ chuyển hướng về `/admin/overview`)
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Admin chuyển giữa các mục của khu quản trị (Overview, Review content, User, Settings), đổi ngôn ngữ và mở menu tài khoản từ một thanh trên cố định, mà không phải gõ địa chỉ.
**Actors:** Admin. Người không phải admin không bao giờ nhận markup của khung này.
**Entry Conditions:** Đã đăng nhập và có role admin trong cơ sở dữ liệu; mọi URL `/admin/*` đã qua cổng proxy.
**Exit Conditions:** Admin chọn một mục menu (sang màn con), bấm logo ADMIN về khu Sunner, mở Profile / Dashboard, hoặc đăng xuất.

## 2. Screen Layout

### Layout Sketch

Khung gồm thanh trên `sticky` cao 88px (nền `bg-divider/95` mờ), vùng nội dung con căn giữa tối đa 1440px có padding, và footer tối giản chỉ có dòng bản quyền. Thanh trên chứa logo kèm nhãn ADMIN, 4 mục menu (ẩn dưới `md`, thay bằng nút menu), đổi ngôn ngữ và menu tài khoản. Khung này không có chuông thông báo. (`app/admin/layout.tsx:12-18`, `features/app-shell/components/admin-top-bar.tsx:32-47`)

```
┌───────────────────────────────────────────────────────┐
│ R1: Admin Top Bar (sticky)                            │
│ [☰] [Logo | ADMIN]  Overview Review User Settings  [VN▾][👤] │
├───────────────────────────────────────────────────────┤
│ R2: Child Outlet (static, scrollable theo trang)      │
│   nội dung của màn con /admin/*                       │
├───────────────────────────────────────────────────────┤
│ R3: Minimal Footer (static)    © Sun* 2025            │
└───────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Admin Top Bar | sticky | no | AdminTopBar, MobileNavMenu, NavLinks, HeaderActions, LanguageSwitcher, AccountMenu |
| R2 | Child Outlet | static | yes | child outlet — delegates rendering to [SCR019_AdminOverview / SCR013_AdminReviewContent / SCR018_AdminUser / SCR014_AdminCampaignSettings] per active route. No direct content rendered here. |
| R3 | Minimal Footer | static | no | AppFooter (variant `minimal`) |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Mở menu / Đóng menu | button | — | Đóng | Conditional | Mở hoặc đóng menu thu gọn | — | — | — | N/A |
| E02 | Logo Sun* Annual Awards 2025 + ADMIN | link | — | Enabled | Always | Về khu Sunner | static | raw | — | N/A |
| E03 | Overview | link | — | Enabled | Conditional | Mở mục Overview | static | raw | — | N/A |
| E04 | Review content | link | — | Enabled | Conditional | Mở mục Review content | static | raw | — | N/A |
| E05 | User | link | — | Enabled | Conditional | Mở mục User | static | raw | — | N/A |
| E06 | Settings | link | — | Enabled | Conditional | Mở mục Settings | static | raw | — | N/A |
| E07 | Đổi ngôn ngữ (VN / EN) | button | — | Hiện ngôn ngữ hiện tại | Always | Mở danh sách Tiếng Việt / English | store state | raw | — | N/A |
| E08 | Menu tài khoản (avatar) | button | — | Đóng | Always | Mở hoặc đóng menu tài khoản | store state | raw | chữ cái đầu / ảnh mặc định | MODEL004_Profile.full_name, MODEL004_Profile.avatar_url |
| E09 | Profile | link | — | Enabled | Conditional | Mở trang Profile | static | raw | — | N/A |
| E10 | Dashboard | link | — | Enabled | Conditional | Mở Dashboard (Overview) | store state | raw | — | MODEL004_Profile.role (DISC-001) |
| E11 | Logout | button | — | Enabled | Conditional | Đăng xuất thiết bị đang dùng | — | — | — | N/A |
| E12 | Báo lỗi đăng xuất / đổi ngôn ngữ | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E13 | Bản quyền Sun* © 2025 | display field | — | Visible | Always | — | static | raw | — | N/A |

Ghi chú: E08 lấy tên (phần local của email nếu tên trống) và ảnh từ hồ sơ qua `ShellUser` (`features/app-shell/server/shell-session.ts:19-25`). Nhãn của mục menu thuộc `shell.admin.*` (`messages/vi.json`); bản tiếng Anh dùng "Overview / Review content / User / Settings".

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở/đóng menu thu gọn | E01 | click | Dưới `md` | Mở hoặc đóng bảng 4 mục xếp dọc | `features/app-shell/components/mobile-nav-menu.tsx:29-39` |
| Đi tới một mục quản trị | E03, E04, E05, E06 | click | — | Mục đang mở được đánh dấu (`aria-current`); bảng thu gọn tự đóng | `features/app-shell/components/app-header-nav-links.tsx:34-42` |
| Về khu Sunner | E02 | click | — | Rời khu Admin | `features/app-shell/components/admin-top-bar.tsx:37-42` |
| Mở danh sách ngôn ngữ | E07 | click | Không đang pending | Mở danh sách; chọn ngôn ngữ khác thì lưu cookie rồi làm mới trang | `features/app-shell/components/language-switcher.tsx:33-48` |
| Mở/đóng menu tài khoản | E08 | click | — | Mở danh sách Profile / Dashboard / Logout | `features/app-shell/components/account-menu.tsx:54` |
| Mở Profile | E09 | click | Menu đang mở | Đóng menu | `features/app-shell/components/account-menu.tsx:61-64` |
| Mở Dashboard | E10 | click | Menu đang mở, người dùng là admin | Đóng menu | `features/app-shell/components/account-menu.tsx:65-70` |
| Đăng xuất | E11 | click | Menu đang mở, có hàm `signOut` | Nút khóa trong lúc chờ; lỗi thì hiện E12 | `features/app-shell/components/account-menu.tsx:32-43,71-76` |

### Happy Path

1. Admin vào một URL `/admin/*`; thanh trên R1 hiển thị 4 mục, mục khớp đường dẫn hiện tại được tô và gạch chân.
2. Admin bấm một mục trong R1 (hoặc mở nút menu rồi chọn trên màn hẹp); nội dung R2 đổi theo mục, thanh trên giữ nguyên.
3. Admin mở menu tài khoản ở R1 hoặc đổi ngôn ngữ khi cần; xong việc thì đăng xuất, hoặc rời khu Admin.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Mục khớp một phần đường dẫn (ví dụ `/admin/users/...`) | Mục User vẫn được đánh dấu active | `shared/ui/app-routes.ts:29-32` |
| Bước 3 (Logout) | Đăng xuất lỗi (trả `ok: false` hoặc ném lỗi) | Hiện "Không thể đăng xuất, vui lòng thử lại." dưới danh sách, menu vẫn mở | `features/app-shell/components/account-menu.tsx:35-42,77-81` |
| Bước 3 (đổi ngôn ngữ) | Lưu cookie ngôn ngữ lỗi | Hiện "Không thể đổi ngôn ngữ, vui lòng thử lại." dưới nút | `features/app-shell/components/language-switcher.tsx:93-100` |

### Interaction Notes

- **Nhấn Escape hoặc bấm ra ngoài sẽ đóng menu thu gọn, menu tài khoản, danh sách ngôn ngữ; Escape đưa focus về nút mở** — source: `features/app-shell/hooks/use-dismissable.ts:18-25`
- **Chọn một mục trong bảng thu gọn thì bảng tự đóng** — source: `features/app-shell/components/app-header-nav-links.tsx:41`
- **Mục menu đang mở được nhận biết theo đường dẫn, kể cả trang con bên dưới** — source: `shared/ui/app-routes.ts:29-32`
- **Bấm vào logo (có nhãn ADMIN) dẫn về khu Sunner; tên truy cập của liên kết đọc là "Về khu Sunner"** — source: `features/app-shell/components/admin-top-bar.tsx:36-42`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Guard đọc phiên và vai trò (layout chặn, `instant = false`) | Không có skeleton ở khung; trình duyệt chờ đến khi guard xong | none | `app/admin/layout.tsx:7,11` |
| saving (đăng xuất) | `signOut` đang chạy | Mục Logout mờ và bị khóa | none | `features/app-shell/components/account-menu.tsx:72` |
| saving (đổi ngôn ngữ) | `setLocaleAction` đang chạy | Nút ngôn ngữ mờ và bị khóa | none | `features/app-shell/components/language-switcher.tsx:59,64` |
| error (đăng xuất) | `signOut` trả `{ ok: false }` hoặc ném lỗi | Dòng báo lỗi đỏ trong menu tài khoản | Bấm Logout lại | `features/app-shell/components/account-menu.tsx:77-81` |
| error (đổi ngôn ngữ) | Cookie ngôn ngữ không lưu được | Hộp báo lỗi dưới nút ngôn ngữ | Chọn lại | `features/app-shell/components/language-switcher.tsx:93-100` |
| success (đăng xuất) | Đăng xuất thành công | Chuyển trang (không có toast) | none | `shared/auth/sign-out-action.ts:16-23` |
| empty | — | N/A — khung không có vùng danh sách; trạng thái trống thuộc màn con | — | — |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E11 | Đăng xuất phải thành công | "Không thể đăng xuất, vui lòng thử lại." (en: "Could not sign out, please try again.") | server response |
| E07 | Chỉ nhận `vi` hoặc `en`; lưu cookie phải thành công | "Không thể đổi ngôn ngữ, vui lòng thử lại." (en: "Could not change the language, please try again.") | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Nút menu thu gọn chỉ có trên màn hẹp | responsive | E01 | Dưới `md` | Từ `md` trở lên | — |
| 4 mục menu hiện thành hàng ngang trên màn rộng | responsive | E03, E04, E05, E06 | Từ `md` trở lên (trên màn hẹp mở qua E01) | Dưới `md` khi E01 chưa mở | — |
| Các mục tài khoản chỉ hiện sau khi mở menu tài khoản | configuration | E09, E10, E11 | Menu tài khoản đang mở | Menu đóng | Trạng thái mở/đóng cục bộ trong component, không phải cờ cấu hình |
| Dashboard chỉ dành cho admin | auth | E10 | Người dùng có role admin | Người dùng không phải admin | Consequence if bypassed: không có (link chỉ mang tính hiển thị; quyền thật do proxy và guard phía server kiểm). Trong khung này luôn là admin nên mục luôn hiện khi menu mở |
| Logout chỉ hiện khi có hàm đăng xuất | configuration | E11 | Layout truyền hàm đăng xuất (luôn có) | Không truyền hàm | — |
| Báo lỗi chỉ hiện sau khi hành động thất bại | configuration | E12 | Đăng xuất hoặc đổi ngôn ngữ vừa thất bại | Thành công hoặc chưa thử | — |

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
| external | Mở URL `/admin/*` đã qua cổng proxy | Admin | `shared/auth/session-proxy.ts:108-110` |
| external | Mở `/admin` (chuyển hướng về `/admin/overview`) | Admin | `app/admin/page.tsx:4-6` |
| SCR003_AppLayout | Menu tài khoản › Dashboard | Chỉ hiện với admin | `features/app-shell/components/account-menu.tsx:65-70` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Bấm mục Overview | E03 | Admin | SCR019_AdminOverview | redirect (điều hướng client) | `features/app-shell/components/admin-top-bar.tsx:22` |
| Bấm mục Review content | E04 | Admin | SCR013_AdminReviewContent | redirect | `features/app-shell/components/admin-top-bar.tsx:23` |
| Bấm mục User | E05 | Admin | SCR018_AdminUser | redirect | `features/app-shell/components/admin-top-bar.tsx:24` |
| Bấm mục Settings | E06 | Admin | SCR014_AdminCampaignSettings | redirect | `features/app-shell/components/admin-top-bar.tsx:25` |
| Bấm logo ADMIN | E02 | — | SCR011_Homepage | redirect | `features/app-shell/components/admin-top-bar.tsx:37` |
| Mở Profile | E09 | Menu tài khoản mở | SCR016_OwnProfile | redirect | `features/app-shell/components/account-menu.tsx:61` |
| Mở Dashboard (trùng mục Overview, xem Unresolved Questions) | E10 | Menu tài khoản mở | SCR019_AdminOverview | redirect | `features/app-shell/components/account-menu.tsx:66` |
| Đăng xuất | E11 | Đăng xuất thành công | SCR001_Login | redirect | `shared/auth/sign-out-action.ts:23` |
| Đổi ngôn ngữ | E07 | Chọn ngôn ngữ khác | (stays on screen) | làm mới trang | `features/app-shell/components/language-switcher.tsx:39-40` |

Ngoài ra (nhánh vào, không phải thao tác trên màn): người không phải admin vào `/admin/*` nhận HTTP 403 với thân là SCR004_Error403 (`shared/auth/session-proxy.ts:108-110`); khách bị chuyển `/login?next=` (`shared/auth/route-access-policy.ts:37-39`).

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Thanh điều hướng `nav aria-label` ("Điều hướng quản trị"), `aria-current="page"` cho mục active, `aria-expanded` / `aria-controls` cho nút menu, nút tài khoản có `aria-label` kèm tên người dùng, tên truy cập của logo có chữ ẩn "Về khu Sunner" |
| Keyboard navigation | supported | Phần tử native (link, button), viền focus `focus-visible:outline-2`; Escape đóng các popup |
| Focus management | partial | Escape trả focus về nút mở; không có focus trap trong popup; không autofocus |
| Screen reader compatibility | unknown | Có landmark `header`, `nav`, `footer`; chưa có kiểm thử với screen reader |
| Error announcement | partial | Báo lỗi đăng xuất và đổi ngôn ngữ dùng `role="alert"`; không có vùng `aria-live` khác |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (< md) | E01 | Nút menu hiện; 4 mục gom vào bảng thả xuống dọc | `features/app-shell/components/mobile-nav-menu.tsx:28,41-43` |
| desktop (md+) | E03, E04, E05, E06 | Hiện thành hàng ngang trong R1 (`hidden md:block` ở mobile ẩn) | `features/app-shell/components/admin-top-bar.tsx:43` |
| desktop (md+ / lg) | R1 | Logo cao 48px (md: 64px); khoảng cách `gap-2` → `md:gap-8` → `lg:gap-12`; padding `px-4` → `md:px-12` → `xl:px-36` | `features/app-shell/components/admin-top-bar.tsx:33-38` |
| desktop (md+ / xl) | R2 | Padding nội dung `px-4` → `md:px-12` → `xl:px-36` | `app/admin/layout.tsx:15` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireShellAdmin()` → `requireAdmin()` → `resolveAdminAccess()`: đọc `profiles.role` từ DB mỗi request; guest → `redirect("/login")`, non-admin → `forbidden()` | `features/app-shell/server/shell-session.ts:41-44`, `shared/auth/admin-guard.ts:17-35` |
| § 1. | guard | Proxy bước 4b: `isAdminPath(pathname)` và role khác admin → `accessDeniedPage` (HTTP 403, trang GET) hoặc JSON `{ code: "forbidden" }` 403 (Server Action / method khác) | `shared/auth/session-proxy.ts:93-110` |
| § 1. | helper | `export const instant = false` — layout đọc phiên theo request nên là route chặn | `app/admin/layout.tsx:7` |
| E11 | endpoint | Server Action `signOut` (ROUTE035): `supabase.auth.signOut({ scope: "local" })` rồi `redirect("/login")`; lỗi thật trả `{ ok: false }` | `shared/auth/sign-out-action.ts:16-23` |
| E07 | endpoint | Server Action `setLocaleAction` (ROUTE036): ghi cookie `NEXT_LOCALE` (httpOnly, sameSite lax, 1 năm) | `shared/i18n/set-locale-action.ts:18-33` |
| E03..E06 | helper | Mục menu dựng từ `ADMIN_ROUTES` | `shared/ui/app-routes.ts:17-23` |
| E08 | helper | `toShellUser`: tên = `fullName` hoặc phần local của email; `isAdmin = role === "admin"`; chỉ ba trường này sang client | `features/app-shell/server/shell-session.ts:19-25` |
| R2 | component | `children` của layout; `/admin` chỉ gọi `redirect(ADMIN_ROUTES.overview)` | `app/admin/layout.tsx:15`, `app/admin/page.tsx:4-6` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| AppFooter | `variant` | `minimal` (chỉ dòng bản quyền) | `variant="minimal"` | N/A — không có DISC-### trong entities |
| HeaderActions | `bellSlot` | không truyền chuông (khác khung Sunner) | `user`, `signOutAction` | N/A |

## Child Routes

| Route | SCR | URL | Notes |
|-------|-----|-----|-------|
| Overview | SCR019_AdminOverview | /admin/overview | Tổng quan quản trị; `/admin` chuyển về đây |
| Review content | SCR013_AdminReviewContent | /admin/review | Bảng Kudo để rà soát, tạm ẩn hoặc trả lại |
| User | SCR018_AdminUser | /admin/users | Quản lý người dùng |
| Settings | SCR014_AdminCampaignSettings | /admin/settings | Cài đặt chiến dịch |

<!-- Route config source: app/admin/ (thư mục con overview, review, users, settings) và features/app-shell/components/admin-top-bar.tsx:21-26 -->

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Proxy: `isAdminPath` + role từ DB, khách → `/login?next=` | role | Người không phải admin xem được trang admin (trước đây proxy đã chặn bằng HTTP 403) |
| `requireShellAdmin()` / `requireAdmin()` ở đầu layout | role | Layout dựng markup admin cho non-admin; guard chạy trước nên không có markup nào được tạo |
| Mỗi trang, route handler và Server Action admin phải tự gọi guard (guard ở layout không bảo vệ Server Action) | permission | Server Action chạy không kiểm role [UNVERIFIED] server enforcement — static analysis cannot confirm each action's guard |

## Source References

1. Layout: `app/admin/layout.tsx:1-19`
2. Redirect `/admin`: `app/admin/page.tsx:1-6`
3. Top bar: `features/app-shell/components/admin-top-bar.tsx:1-49`
4. Nav links: `features/app-shell/components/app-header-nav-links.tsx:1-52`
5. Mobile menu: `features/app-shell/components/mobile-nav-menu.tsx:1-47`
6. Header actions: `features/app-shell/components/header-actions.tsx:1-22`
7. Account menu: `features/app-shell/components/account-menu.tsx:1-86`
8. Language switcher: `features/app-shell/components/language-switcher.tsx:1-103`
9. Dismiss hook: `features/app-shell/hooks/use-dismissable.ts:1-34`
10. Session seam: `features/app-shell/server/shell-session.ts:1-44`
11. Admin guard: `shared/auth/admin-guard.ts:1-35`
12. Proxy gate: `shared/auth/session-proxy.ts:93-110`
13. Route map: `shared/ui/app-routes.ts:1-32`
14. Footer: `features/app-shell/components/app-footer.tsx:1-55`

## Source Walkthrough

1. **File:** `app/admin/layout.tsx:1-19` — điểm vào: guard rồi top bar, outlet, footer.
2. **File:** `features/app-shell/server/shell-session.ts:1-44` — cách shell lấy `ShellUser` và guard admin.
3. **File:** `features/app-shell/components/admin-top-bar.tsx:1-49` — dựng 4 mục menu và logo ADMIN.
4. **File:** `features/app-shell/components/app-header-nav-links.tsx:1-52` — đánh dấu mục active theo pathname.
5. **File:** `features/app-shell/components/header-actions.tsx:1-22` — gom đổi ngôn ngữ và menu tài khoản.
6. **File:** `features/app-shell/components/account-menu.tsx:1-86` — Profile, Dashboard, Logout.
7. **File:** `shared/auth/admin-guard.ts:1-35` — luật guard (đọc role từ DB).

Lớp dữ liệu: chỉ đọc hồ sơ người dùng hiện tại, xem entities.md MODEL004_Profile.

### Call Hierarchy

```text
AdminLayout -> requireShellAdmin -> requireAdmin -> findSessionProfile
AdminLayout -> AdminTopBar -> MobileNavMenu -> NavLinks
                           -> NavLinks (usePathname)
                           -> HeaderActions -> LanguageSwitcher -> setLocaleAction
                                            -> AccountMenu -> signOut
AdminLayout -> children (R2) ; AppFooter(minimal)
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
profiles.role/full_name/avatar_url -> toShellUser -> ShellUser -> AdminTopBar -> AccountMenu (tên, avatar)
usePathname -> isRouteActive -> NavLinks (mục active)
```

## Unresolved Questions

- Mục Dashboard trong menu tài khoản của khung Admin dẫn tới `/admin/overview`, tức trùng mục Overview ở thanh trên. Chưa rõ có chủ ý hay không.
- Chưa xác nhận được bằng chạy thật rằng mọi Server Action và route handler dưới `/admin` tự gọi `requireAdmin` — nằm ngoài phạm vi màn này, xem Permissions.
