---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR003_AppLayout — Screen Spec

**Screen**: SCR003_AppLayout: AppLayout
**Feature**: F002_AppShell
**Type**: composite
**Route**: /, /awards, /community-standards, /kudos, /kudos/:id, /notifications, /profile, /profile/:userId, /rules
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner đã đăng nhập duyệt mọi trang của SAA 2025 trong một khung chung: header có menu chính, chuông thông báo, đổi ngôn ngữ và menu tài khoản, cùng footer và toast xác nhận gửi Kudo.
**Actors:** Sunner (đã đăng nhập và đã chọn phòng ban), Admin (thêm mục Dashboard trong menu tài khoản).
**Entry Conditions:** Có phiên hợp lệ, hồ sơ tồn tại và đã chọn phòng ban; không thì guard chuyển hướng hoặc trả 401 trước khi khung hiện ra.
**Exit Conditions:** Chọn một mục menu hoặc link footer (sang màn con), mở thông báo, vào Profile / Dashboard, hoặc đăng xuất.

## 2. Screen Layout

### Layout Sketch

Khung gồm header `sticky` cao 80px (logo, 3 link chính ẩn dưới `md` và thay bằng nút menu, chuông thông báo, đổi ngôn ngữ, menu tài khoản), vùng nội dung con chiếm hết chiều cao còn lại, footer đầy đủ (logo, 5 link, bản quyền) và một vùng toast cố định ở đáy màn hình. Chuông nằm trong header, là vùng REG001 do feature Notifications sở hữu. Toast "đã gửi / đã lưu Kudo" được đặt ở khung này để không bị mất khi trang làm mới hoặc feed gắn lại. (`app/(app)/layout.tsx:17-29`, `features/app-shell/components/app-header.tsx:28-39`)

```
┌───────────────────────────────────────────────────────────┐
│ R1: App Header (sticky)                                   │
│ [☰] [Logo] About·Award·Kudos     ┌────────────┐ [VN▾] [👤]│
│                                  │R2: REG001 🔔│            │
│                                  └────────────┘            │
├───────────────────────────────────────────────────────────┤
│ R3: Child Outlet (static, scrollable theo trang)          │
│   nội dung của màn con (9 route Sunner)                   │
│                                  ┌───────────────────┐    │
│  - - - - - - - - - - - - - - - - │R5: Toast (fixed) -│ - -│
│                                  └───────────────────┘    │
├───────────────────────────────────────────────────────────┤
│ R4: Footer (static)  [Logo] 5 link ........ © Sun* 2025   │
└───────────────────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | App Header | sticky | no | AppHeader, MobileNavMenu, NavLinks, BrandLogo, HeaderActions, LanguageSwitcher, AccountMenu |
| R2 | Notification Bell (REG001_NotificationBell) | static (trong R1) | no | NotificationBellSlot, NotificationBell |
| R3 | Child Outlet | static | yes | child outlet — delegates rendering to [SCR011_Homepage / SCR008_AwardsSystem / SCR007_KudosLiveBoardFeed / SCR006_KudoDetail / SCR012_Rules / SCR009_CommunityStandards / SCR017_AllNotifications / SCR016_OwnProfile / SCR015_OtherProfile] per active route. No direct content rendered here. |
| R4 | Footer | static | no | AppFooter (variant `full`) |
| R5 | Toast Host | fixed-bottom | no | KudoComposerToastHost, KudoComposerToast |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Mở menu / Đóng menu | button | — | Đóng | Conditional | Mở hoặc đóng menu thu gọn | — | — | — | N/A |
| E02 | Logo Sun* Annual Awards 2025 | link | — | Enabled | Always | Về trang chủ | static | raw | — | N/A |
| E03 | About SAA 2025 | link | — | Enabled | Conditional | Mở trang chủ | static | raw | — | N/A |
| E04 | Award Information | link | — | Enabled | Conditional | Mở Thông tin giải | static | raw | — | N/A |
| E05 | Sun* Kudos | link | — | Enabled | Conditional | Mở bảng Kudo | static | raw | — | N/A |
| E06 | Thông báo (chuông) | button | — | Đóng, chấm đỏ nếu còn chưa đọc | Always | Mở dropdown 10 thông báo mới nhất | API field | raw | không có chấm | MODEL016_Notification (REG001_NotificationBell) |
| E07 | Đổi ngôn ngữ (VN / EN) | button | — | Hiện ngôn ngữ hiện tại | Always | Mở danh sách Tiếng Việt / English | store state | raw | — | N/A |
| E08 | Menu tài khoản (avatar) | button | — | Đóng | Always | Mở hoặc đóng menu tài khoản | store state | raw | chữ cái đầu / ảnh mặc định | MODEL004_Profile.full_name, MODEL004_Profile.avatar_url |
| E09 | Profile | link | — | Enabled | Conditional | Mở trang Profile của mình | static | raw | — | N/A |
| E10 | Dashboard | link | — | Enabled | Conditional | Mở Dashboard quản trị | store state | raw | — | MODEL004_Profile.role (DISC-001) |
| E11 | Logout | button | — | Enabled | Conditional | Đăng xuất thiết bị đang dùng | — | — | — | N/A |
| E12 | Báo lỗi đăng xuất / đổi ngôn ngữ | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E13 | Toast xác nhận Kudo | message | — | Hidden | Conditional | — | store state | raw | hidden | N/A |
| E14 | Logo (footer) | link | — | Enabled | Always | Về trang chủ | static | raw | — | N/A |
| E15 | About SAA 2025 (footer) | link | — | Enabled | Always | Mở trang chủ | static | raw | — | N/A |
| E16 | Award Information (footer) | link | — | Enabled | Always | Mở Thông tin giải | static | raw | — | N/A |
| E17 | Sun* Kudos (footer) | link | — | Enabled | Always | Mở bảng Kudo | static | raw | — | N/A |
| E18 | Thể lệ | link | — | Enabled | Always | Mở Thể lệ | static | raw | — | N/A |
| E19 | Tiêu chuẩn chung | link | — | Enabled | Always | Mở Tiêu chuẩn chung | static | raw | — | N/A |
| E20 | Bản quyền Sun* © 2025 | display field | — | Visible | Always | — | static | raw | — | N/A |

Ghi chú: dropdown của chuông (danh sách thông báo, "Xem tất cả", đánh dấu đã đọc) thuộc vùng REG001_NotificationBell, chi tiết do feature Notifications mô tả; ở đây chỉ ghi nút chuông (E06). E08 lấy tên (phần local của email nếu tên trống) và ảnh từ `ShellUser` (`features/app-shell/server/shell-session.ts:19-25`).

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Mở/đóng menu thu gọn | E01 | click | Dưới `md` | Mở hoặc đóng bảng 3 mục xếp dọc | `features/app-shell/components/mobile-nav-menu.tsx:29-39` |
| Đi tới một mục chính | E02, E03, E04, E05 | click | — | Mục khớp đường dẫn được đánh dấu (`aria-current`); bảng thu gọn tự đóng | `features/app-shell/components/app-header-nav-links.tsx:34-42` |
| Mở dropdown thông báo | E06 | click | — | Mở hoặc đóng dropdown 10 thông báo mới nhất | `features/notifications/components/notification-bell.tsx:76-91` |
| Mở danh sách ngôn ngữ | E07 | click | Không đang pending | Mở danh sách; chọn ngôn ngữ khác thì lưu cookie rồi làm mới trang | `features/app-shell/components/language-switcher.tsx:33-48` |
| Mở/đóng menu tài khoản | E08 | click | — | Mở danh sách Profile / Dashboard / Logout | `features/app-shell/components/account-menu.tsx:54` |
| Mở Profile | E09 | click | Menu đang mở | Đóng menu | `features/app-shell/components/account-menu.tsx:61-64` |
| Mở Dashboard | E10 | click | Menu đang mở, người dùng là admin | Đóng menu | `features/app-shell/components/account-menu.tsx:65-70` |
| Đăng xuất | E11 | click | Menu đang mở | Nút khóa trong lúc chờ; lỗi thì hiện E12 | `features/app-shell/components/account-menu.tsx:32-43,71-76` |
| Đi tới link footer | E14..E19 | click | — | Rời khung hiện tại sang màn đích | `features/app-shell/components/app-footer.tsx:37-47` |

### Happy Path

1. Sunner vào một trang Sunner; R1 hiện logo, 3 mục chính (mục khớp trang hiện tại được tô), chuông, đổi ngôn ngữ và avatar.
2. Chuông ở R2 hiện chấm đỏ nếu còn thông báo chưa đọc ngay lần hiển thị đầu; khi có thông báo mới chấm đỏ bật lên và được đọc cho trình đọc màn hình.
3. Sunner dùng menu chính hoặc link footer để chuyển trang trong khi R1 và R4 giữ nguyên, R3 đổi nội dung.
4. Sau khi gửi hoặc lưu một Kudo ở màn con, toast xác nhận hiện ở R5 khoảng 4 giây rồi tự biến mất.

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 1 | Người dùng là admin | Menu tài khoản có thêm mục Dashboard | `features/app-shell/components/account-menu.tsx:65-70` |
| Bước 2 | Đọc số thông báo chưa đọc ở server thất bại | Chuông hiện không có chấm, header vẫn hiện (lỗi được ghi log) | `features/notifications/components/notification-bell-slot.tsx:9-16` |
| Bước 4 | Gửi / lưu Kudo lần nữa trong lúc toast đang hiện | Thông báo mới thay thế, đồng hồ 4 giây bắt đầu lại | `features/kudos-authoring/components/kudo-composer-toast-host.tsx:15-18`, `features/kudos-authoring/components/kudo-composer-toast.tsx:20-25` |
| Menu tài khoản › Logout | Đăng xuất lỗi | Hiện "Không thể đăng xuất, vui lòng thử lại." trong menu | `features/app-shell/components/account-menu.tsx:35-42,77-81` |

### Interaction Notes

- **Nhấn Escape hoặc bấm ra ngoài sẽ đóng menu thu gọn, menu tài khoản, danh sách ngôn ngữ và dropdown chuông; Escape đưa focus về nút mở** — source: `features/app-shell/hooks/use-dismissable.ts:18-25`
- **Mục menu đang mở được nhận biết theo đường dẫn, kể cả trang con (ví dụ `/kudos/123` vẫn tô Sun* Kudos)** — source: `shared/ui/app-routes.ts:29-32`
- **Toast Kudo sống ở khung nên không bị cắt khi trang làm mới hoặc feed gắn lại** — source: `features/kudos-authoring/components/kudo-composer-toast-host.tsx:8-14`
- **Chấm đỏ của chuông cập nhật tức thời qua kênh Realtime của người dùng và đọc lại số chưa đọc mỗi lần kết nối lại** — source: `features/notifications/components/notification-bell.tsx:52-65`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading | Guard và đọc phiên (layout chặn, `instant = false`) | Không có skeleton ở khung; trình duyệt chờ đến khi guard xong | none | `app/(app)/layout.tsx:10,18-19` |
| empty (chuông) | Không có thông báo chưa đọc | Chuông không có chấm đỏ | Mở chuông | `features/notifications/components/notification-bell.tsx:89` |
| error (chuông) | Đọc số chưa đọc ở server lỗi | Không chấm đỏ, chỉ ghi log | Mở chuông | `features/notifications/components/notification-bell-slot.tsx:12-15` |
| error (không có hồ sơ) | Có phiên nhưng không có dòng hồ sơ | HTTP 401 (trang 401 mặc định của Next, repo không có `unauthorized.tsx`) | none | `shared/auth/current-user.ts:39` |
| saving (đăng xuất) | `signOut` đang chạy | Mục Logout mờ và bị khóa | none | `features/app-shell/components/account-menu.tsx:72` |
| saving (đổi ngôn ngữ) | `setLocaleAction` đang chạy | Nút ngôn ngữ mờ và bị khóa | none | `features/app-shell/components/language-switcher.tsx:59,64` |
| error (đăng xuất / đổi ngôn ngữ) | Hành động trả lỗi | Dòng báo lỗi đỏ (menu tài khoản / dưới nút ngôn ngữ) | Thử lại | `features/app-shell/components/account-menu.tsx:77-81`, `features/app-shell/components/language-switcher.tsx:93-100` |
| success (Kudo) | Gửi hoặc lưu Kudo xong | Toast ở đáy màn hình, tự tắt sau 4 giây | none (tự biến mất) | `features/kudos-authoring/components/kudo-composer-toast.tsx:20-33` |
| success (đăng xuất) | Đăng xuất thành công | Chuyển trang | none | `shared/auth/sign-out-action.ts:16-23` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E11 | Đăng xuất phải thành công | "Không thể đăng xuất, vui lòng thử lại." (en: "Could not sign out, please try again.") | server response |
| E07 | Chỉ nhận `vi` hoặc `en`; lưu cookie phải thành công | "Không thể đổi ngôn ngữ, vui lòng thử lại." (en: "Could not change the language, please try again.") | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Cả khung chỉ hiện cho Sunner đã chọn phòng ban | auth | E01..E20 (cả màn) | Có phiên, có hồ sơ, đã có phòng ban | Khách → `/login`; chưa có phòng ban → `/onboarding/department`; không có hồ sơ → 401 | Consequence if bypassed: trang Sunner hiển thị cho khách (dữ liệu từng trang vẫn có guard riêng) |
| Nút menu thu gọn chỉ có trên màn hẹp | responsive | E01 | Dưới `md` | Từ `md` trở lên | — |
| 3 mục menu chính hiện thành hàng ngang trên màn rộng | responsive | E03, E04, E05 | Từ `md` trở lên (trên màn hẹp mở qua E01) | Dưới `md` khi E01 chưa mở | — |
| Các mục tài khoản chỉ hiện sau khi mở menu tài khoản | configuration | E09, E10, E11 | Menu tài khoản đang mở | Menu đóng | Trạng thái mở/đóng cục bộ trong component, không phải cờ cấu hình |
| Dashboard chỉ dành cho admin | auth | E10 | Người dùng có role admin | Người dùng không phải admin | Consequence if bypassed: không có (link chỉ mang tính hiển thị; quyền thật do proxy và guard phía server kiểm) |
| Báo lỗi chỉ hiện sau khi hành động thất bại | configuration | E12 | Đăng xuất hoặc đổi ngôn ngữ vừa thất bại | Thành công hoặc chưa thử | — |
| Toast chỉ hiện sau khi gửi / lưu Kudo | configuration | E13 | Có thông báo thành công đang chờ (4 giây) | Không có thông báo | — |

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
| external | Mở một trong 9 URL Sunner (`/`, `/awards`, `/community-standards`, `/kudos`, `/kudos/:id`, `/notifications`, `/profile`, `/profile/:userId`, `/rules`) | Đã qua `requireSunner()` | `app/(app)/layout.tsx:18` |
| SCR001_Login | Hoàn tất OAuth, đích mặc định là trang chủ | Đã có phòng ban | `app/auth/callback/route.ts:30-31` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Bấm logo hoặc mục About SAA 2025 | E02, E03 | — | SCR011_Homepage | redirect | `features/app-shell/components/app-header.tsx:22,32` |
| Bấm mục Award Information | E04 | — | SCR008_AwardsSystem | redirect | `features/app-shell/components/app-header.tsx:23` |
| Bấm mục Sun* Kudos | E05 | — | SCR007_KudosLiveBoardFeed | redirect | `features/app-shell/components/app-header.tsx:24` |
| Bấm link footer Thể lệ | E18 | — | SCR012_Rules | redirect | `features/app-shell/components/app-footer.tsx:30` |
| Bấm link footer Tiêu chuẩn chung | E19 | — | SCR009_CommunityStandards | redirect | `features/app-shell/components/app-footer.tsx:31` |
| Bấm logo / About / Award / Kudos ở footer | E14, E15, E16, E17 | — | SCR011_Homepage, SCR008_AwardsSystem, SCR007_KudosLiveBoardFeed (cùng đích với header) | redirect | `features/app-shell/components/app-footer.tsx:27-29,37` |
| Menu tài khoản › Profile | E09 | Menu mở | SCR016_OwnProfile | redirect | `features/app-shell/components/account-menu.tsx:61` |
| Menu tài khoản › Dashboard | E10 | Admin | SCR019_AdminOverview | redirect | `features/app-shell/components/account-menu.tsx:66` |
| Menu tài khoản › Logout | E11 | Đăng xuất thành công | SCR001_Login | redirect | `shared/auth/sign-out-action.ts:23` |
| Bấm "Xem tất cả" trong dropdown chuông | E06 (REG001_NotificationBell) | — | SCR017_AllNotifications | redirect | `features/notifications/components/notification-panel.tsx:77` |
| Bấm dòng thông báo nhận Kudo / tim / Kudo bị ẩn / Kudos Quốc Dân | E06 (REG001_NotificationBell) | Dòng có `kudoId` | SCR006_KudoDetail | redirect | `docs/generated/screen-flow.md:211` |
| Bấm dòng thông báo hộp quà | E06 (REG001_NotificationBell) | Loại `secret_box_granted` | SCR007_KudosLiveBoardFeed (`/kudos?secretBox=open`) | redirect | `docs/generated/screen-flow.md:212` |
| Bấm dòng thông báo lên bậc Hero / đủ bộ icon | E06 (REG001_NotificationBell) | Loại `hero_tier_up` / `icon_set_completed` | SCR016_OwnProfile | redirect | `docs/generated/screen-flow.md:213` |
| Guard: khách | (cả khung) | Không có phiên | SCR001_Login | redirect | `shared/auth/current-user.ts:50` |
| Guard: chưa có phòng ban | (cả khung) | Hồ sơ chưa có phòng ban | SCR020_OnboardingDepartment | redirect | `shared/auth/current-user.ts:51` |
| Đổi ngôn ngữ | E07 | Chọn ngôn ngữ khác | (stays on screen) | làm mới trang | `features/app-shell/components/language-switcher.tsx:39-40` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | `nav aria-label` cho menu chính và footer; `aria-current="page"` mục active; `aria-expanded` / `aria-controls` cho nút menu, tài khoản, chuông; nút chuông đổi nhãn khi có thông báo chưa đọc; nút tài khoản có `aria-label` kèm tên người dùng |
| Keyboard navigation | supported | Phần tử native (link, button), viền focus `focus-visible:outline-2`; Escape đóng các popup |
| Focus management | partial | Escape trả focus về nút mở; không có focus trap trong popup; không autofocus |
| Screen reader compatibility | unknown | Có landmark `header`, `nav`, `footer`; chưa có kiểm thử với screen reader |
| Error announcement | partial | Báo lỗi đăng xuất / đổi ngôn ngữ dùng `role="alert"`; toast Kudo và thông báo mới dùng vùng `role="status"` `aria-live="polite"` |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (< md) | E01 | Nút menu hiện; 3 mục chính gom vào bảng thả xuống dọc | `features/app-shell/components/mobile-nav-menu.tsx:28,41-43` |
| desktop (md+) | E03, E04, E05 | Hiện thành hàng ngang trong R1 | `features/app-shell/components/app-header.tsx:35` |
| desktop (md+ / xl) | R1 | Padding ngang `px-4` → `md:px-12` → `xl:px-36`; khoảng cách logo-menu `gap-2` → `md:gap-12` | `features/app-shell/components/app-header.tsx:29-30` |
| desktop (lg+) | R4 | Footer chuyển từ cột (logo, link, bản quyền xếp dọc) sang hàng ngang canh hai đầu | `features/app-shell/components/app-footer.tsx:36` |
| desktop (md+) | E20 | Bản quyền chữ lớn, đậm (dưới `md`: chữ thường) | `features/app-shell/components/app-footer.tsx:19` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireSunner()`: không phiên → `redirect("/login")`; chưa có phòng ban → `redirect("/onboarding/department")`; có phiên nhưng không có hồ sơ → `unauthorized()` (401, không redirect để tránh vòng lặp với luật `/login` → `/`) | `shared/auth/current-user.ts:33-53` |
| § 1. | helper | `getSessionUser()` dùng `supabase.auth.getUser()` (không tin cookie thô), lỗi máy chủ xác thực thì coi như chưa đăng nhập | `shared/auth/current-user.ts:18-31` |
| § 1. | helper | `export const instant = false` — khung đọc phiên theo request nên là route chặn | `app/(app)/layout.tsx:10` |
| E02..E05 | helper | Mục menu dựng từ `APP_ROUTES` | `features/app-shell/components/app-header.tsx:21-25`, `shared/ui/app-routes.ts:5-15` |
| R2 | component | `NotificationBellSlot` (server) đọc `getUnreadCount(userId)` rồi dựng `NotificationBell` (client, kênh Realtime `notifications:{userId}`); số chưa đọc cũng đọc lại qua GET `/api/notifications/unread-count` (ROUTE012) | `features/notifications/components/notification-bell-slot.tsx:9-16`, `features/notifications/components/notification-bell.tsx:43-65` |
| E11 | endpoint | Server Action `signOut` (ROUTE035): `supabase.auth.signOut({ scope: "local" })` rồi `redirect("/login")`; lỗi thật trả `{ ok: false }` | `shared/auth/sign-out-action.ts:16-23` |
| E07 | endpoint | Server Action `setLocaleAction` (ROUTE036): ghi cookie `NEXT_LOCALE` (httpOnly, sameSite lax, 1 năm) | `shared/i18n/set-locale-action.ts:18-33` |
| E08 | helper | `getShellUser()` (memoize bằng `cache`): tên = `fullName` hoặc phần local của email; `isAdmin = role === "admin"`; chỉ ba trường này sang client | `features/app-shell/server/shell-session.ts:19-33` |
| R5 | js | `KudoComposerToastHost` giữ `notice` trong state, cung cấp `useShowComposerToast()`; ném lỗi nếu composer render ngoài host | `features/kudos-authoring/components/kudo-composer-toast-host.tsx:15-33` |
| R5 | js | `KudoComposerToast` tự gọi `onDone` sau `durationMs = 4000` | `features/kudos-authoring/components/kudo-composer-toast.tsx:20-25` |

## Component Variants

| Component | Discriminating field | Variants on this screen | Screen-specific props/slots | Cross-ref |
|-----------|---------------------|------------------------|----------------------------|-----------|
| AppFooter | `variant` | `full` (logo, 5 link, bản quyền) | không truyền `variant` (mặc định `full`) | N/A — không có DISC-### trong entities |
| HeaderActions | `bellSlot` | có truyền `NotificationBellSlot` (khác khung Admin) | `user`, `signOutAction`, `bellSlot` | N/A |

## Child Routes

| Route | SCR | URL | Notes |
|-------|-----|-----|-------|
| About SAA 2025 | SCR011_Homepage | / | Trang chủ; cũng là đích của logo |
| Award Information | SCR008_AwardsSystem | /awards | Thông tin giải thưởng |
| Sun* Kudos | SCR007_KudosLiveBoardFeed | /kudos | Bảng Kudo trực tiếp |
| (không có mục menu) | SCR006_KudoDetail | /kudos/:id | Chi tiết một Kudo |
| Thể lệ (footer) | SCR012_Rules | /rules | Thể lệ giải |
| Tiêu chuẩn chung (footer) | SCR009_CommunityStandards | /community-standards | Tiêu chuẩn chung |
| (từ chuông) | SCR017_AllNotifications | /notifications | Danh sách mọi thông báo |
| Profile (menu tài khoản) | SCR016_OwnProfile | /profile | Hồ sơ của mình |
| (không có mục menu) | SCR015_OtherProfile | /profile/:userId | Hồ sơ người khác |

<!-- Route config source: thư mục `app/(app)/` (9 file page.tsx) -->

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Proxy: khách → `/login?next=`; trước `LAUNCH_AT` người không phải admin → `/countdown` | auth | Khách vào được trang Sunner (mỗi trang và action vẫn gọi guard riêng) |
| `requireSunner()` ở đầu layout | auth | Layout dựng khung cho khách hoặc người chưa chọn phòng ban |
| `unauthorized()` khi có phiên nhưng không có hồ sơ | auth | Người không có hồ sơ vào được khung; guard trả 401 thay vì redirect |
| Dashboard chỉ hiện với admin | permission | Chỉ là link hiển thị; `/admin/*` bị proxy và `requireAdmin` chặn riêng [UNVERIFIED] server enforcement — static analysis cannot confirm every API middleware |

## Source References

1. Layout: `app/(app)/layout.tsx:1-29`
2. Header: `features/app-shell/components/app-header.tsx:1-41`
3. Nav links: `features/app-shell/components/app-header-nav-links.tsx:1-52`
4. Mobile menu: `features/app-shell/components/mobile-nav-menu.tsx:1-47`
5. Header actions: `features/app-shell/components/header-actions.tsx:1-22`
6. Account menu: `features/app-shell/components/account-menu.tsx:1-86`
7. Language switcher: `features/app-shell/components/language-switcher.tsx:1-103`
8. Footer: `features/app-shell/components/app-footer.tsx:1-55`
9. Dismiss hook: `features/app-shell/hooks/use-dismissable.ts:1-34`
10. Session seam: `features/app-shell/server/shell-session.ts:1-44`
11. Guards: `shared/auth/current-user.ts:1-53`
12. Bell slot: `features/notifications/components/notification-bell-slot.tsx:1-17`
13. Bell: `features/notifications/components/notification-bell.tsx:29-91`
14. Toast host: `features/kudos-authoring/components/kudo-composer-toast-host.tsx:1-33`
15. Toast: `features/kudos-authoring/components/kudo-composer-toast.tsx:1-36`
16. Route map: `shared/ui/app-routes.ts:1-32`

## Source Walkthrough

1. **File:** `app/(app)/layout.tsx:1-29` — điểm vào: guard, header, outlet, footer và toast host.
2. **File:** `shared/auth/current-user.ts:1-53` — `requireSunner()` quyết định ai được vào khung.
3. **File:** `features/app-shell/components/app-header.tsx:1-41` — dựng 3 mục chính, logo và cụm hành động.
4. **File:** `features/app-shell/components/header-actions.tsx:1-22` — chỗ gắn chuông, ngôn ngữ, tài khoản.
5. **File:** `features/app-shell/components/account-menu.tsx:1-86` — Profile, Dashboard (admin), Logout.
6. **File:** `features/notifications/components/notification-bell-slot.tsx:1-17` — đọc số chưa đọc ở server (vùng REG001).
7. **File:** `features/kudos-authoring/components/kudo-composer-toast-host.tsx:1-33` — toast Kudo ở cấp khung.
8. **File:** `features/app-shell/components/app-footer.tsx:1-55` — footer đầy đủ.

Lớp dữ liệu: hồ sơ người dùng hiện tại (MODEL004_Profile) và thông báo chưa đọc (MODEL016_Notification), xem entities.md.

### Call Hierarchy

```text
AppLayout -> requireSunner -> getSunnerContext -> findSessionProfile
AppLayout -> getShellUser -> ShellUser
AppLayout -> AppHeader -> MobileNavMenu / NavLinks (usePathname)
                       -> HeaderActions -> NotificationBellSlot -> getUnreadCount -> NotificationBell -> useNotificationChannel
                                        -> LanguageSwitcher -> setLocaleAction
                                        -> AccountMenu -> signOut
AppLayout -> KudoComposerToastHost -> children (R3) ; KudoComposerToast (R5)
AppLayout -> AppFooter(full)
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
cookie phiên -> getUser -> findSessionProfile -> ShellUser -> AppHeader -> AccountMenu
userId -> getUnreadCount -> NotificationBell (chấm đỏ) <- kênh Realtime theo userId (notifications:<userId>)
Composer (màn con) -> useShowComposerToast -> notice -> KudoComposerToast (4 giây) -> onDone
```

## Unresolved Questions

- Footer có 5 link (About SAA 2025, Award Information, Sun* Kudos, Thể lệ, Tiêu chuẩn chung) trong code, trong khi chú thích trên hàm `AppFooter` còn ghi "four links" (`features/app-shell/components/app-footer.tsx:14`); tài liệu sinh ra (kể cả screen-flow, ghi "header hoặc footer" cho ba link trùng đích với header) đã khớp 5 link, chỉ còn lệch ở chú thích code.
- Ba hàng Exits về dòng thông báo (SCR006 / SCR007 / SCR016) dẫn nguồn từ `docs/generated/screen-flow.md` vì logic chọn đích nằm trong dropdown chuông (REG001_NotificationBell, thuộc feature Notifications), không đọc ở bước này. [UNVERIFIED] — needs runtime confirmation.
- Trang 401 khi "có phiên nhưng không có hồ sơ" dùng trang mặc định của Next vì không có `app/unauthorized.tsx`; chưa rõ có chủ ý hay không. [NEEDS_DOMAIN_CONFIRMATION] — 401 hiển thị trang mặc định; unknown whether intentional design or missing page.
