---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR012_Rules — Screen Spec

**Screen**: SCR012_Rules: Rules
**Feature**: F006_AwardsPortal
**Type**: atomic
**Route**: /rules
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner đã đăng nhập đọc thể lệ Kudos (bậc huy hiệu Hero cho người nhận, luật Secret Box cho người gửi, Kudos Quốc Dân) khi bấm link Thể lệ ở footer, rồi đóng panel hoặc đi viết Kudos.
**Actors:** Sunner (đã đăng nhập, đã chọn phòng ban), Admin
**Entry Conditions:** Có phiên đăng nhập và đã chọn phòng ban; nếu chưa có thì bị chuyển về đăng nhập hoặc onboarding. Trước thời điểm mở cửa, người không phải admin không tới được trang (cổng prelaunch).
**Exit Conditions:** Người dùng bấm Đóng (quay lại trang trước cùng origin, nếu không có thì về trang chủ) hoặc bấm "Viết KUDOS" để sang Live board.

## 2. Screen Layout

### Layout Sketch

Trang là một `<main>` kéo lên dưới header trong suốt (`-mt-20`); keyvisual của Live board được phủ tối toàn trang làm nền. Panel thể lệ rộng 553 px nằm sát bên phải, cao tối thiểu bằng khung nhìn trừ header, chữ tĩnh cuộn cùng trang; hàng nút Đóng / Viết KUDOS nằm cuối panel. Trên điện thoại panel chiếm toàn bề ngang. (`app/(app)/rules/page.tsx:22-27`, `features/awards-portal/components/rules-panel.tsx:19`)

```
┌──────────────────────────────────────────────┐
│ (header SCR003_AppLayout, trong suốt)         │
├──────────────────────────────────────────────┤
│ R1: Keyvisual tối (absolute, toàn trang)     │
│                        ┌───────────────────┐ │
│                        │ R2: Rules Panel   │ │
│                        │ (static, 553 px)  │ │
│                        │  Thể lệ           │ │
│                        │  • Người nhận     │ │
│                        │  • Người gửi      │ │
│                        │  • Kudos Quốc Dân │ │
│                        │ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ │
│                        │ R3: [Đóng][Viết]  │ │
│                        └───────────────────┘ │
├──────────────────────────────────────────────┤
│ (footer SCR003_AppLayout)                    │
└──────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Keyvisual tối | absolute | no | LiveBoardKeyvisualBackground (`dimmed`) |
| R2 | Rules Panel (3 section nội dung) | static | yes | RulesPanel, RulesHeroTierList, RulesSecretBoxBadges, HeroBadge |
| R3 | Hàng nút cuối panel | static | no | RulesCloseButton, Link "Viết KUDOS", PortalIcon |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Thể lệ (`<h1>`) | region label | — | Visible | Always | — | static | raw | — | N/A |
| E02 | NGƯỜI NHẬN KUDOS: HUY HIỆU HERO CHO NHỮNG ẢNH HƯỞNG TÍCH CỰC | region label | — | Visible | Always | — | static | raw | — | N/A |
| E03 | Đoạn giới thiệu huy hiệu Hero | display field | — | Visible | Always | — | static | căn đều | — | binding: `awardsPortal.rules.receiversIntro` |
| E04 | Các bậc Hero {tier_1..4} (huy hiệu, tiêu đề, mô tả) | list | — | 4 mục | Always | — | static | thứ tự cố định | — | binding: `HERO_TIERS` |
| E05 | NGƯỜI GỬI KUDOS: SƯU TẬP TRỌN BỘ 6 ICON, NHẬN NGAY PHẦN QUÀ BÍ ẨN | region label | — | Visible | Always | — | static | raw | — | N/A |
| E06 | Đoạn luật Secret Box (mỗi 5 lượt tim mở 1 hộp) | display field | — | Visible | Always | — | static | căn đều | — | binding: `awardsPortal.rules.sendersBody` |
| E07 | 6 icon Secret Box {badge_1..6} | list | — | 6 ảnh | Always | — | static | thứ tự cố định, tên icon làm `alt` | — | binding: `SECRET_BOX_BADGES` |
| E08 | Ghi chú sưu tập đủ bộ nhận quà bí ẩn | message | — | Visible | Always | — | static | raw | — | binding: `awardsPortal.rules.collectNote` |
| E09 | KUDOS QUỐC DÂN | region label | — | Visible | Always | — | static | raw | — | N/A |
| E10 | Đoạn luật Kudos Quốc Dân | display field | — | Visible | Always | — | static | căn đều | — | binding: `awardsPortal.rules.nationalBody` |
| E11 | Đóng | button | — | Enabled | Always | Đóng thể lệ | — | — | — | N/A |
| E12 | Viết KUDOS | link | — | Enabled | Always | Mở Live board để viết Kudos | — | — | — | N/A |

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Đóng thể lệ | E11 | Bấm | — | Rời trang: quay lại trang trước hoặc về trang chủ (xem mục 8) | `features/awards-portal/components/rules-close-button.tsx:28-31` |
| Viết KUDOS | E12 | Bấm | — | Rời trang (xem mục 8) | `features/awards-portal/components/rules-panel.tsx:43-46` |

### Happy Path

1. Sunner mở `/rules`; R2 hiện tiêu đề và ba phần nội dung (người nhận, người gửi, Kudos Quốc Dân).
2. Sunner đọc, cuộn nếu cần; không có ô nhập hay dữ liệu cá nhân nào trên trang.
3. Sunner bấm Đóng hoặc Viết KUDOS ở R3 để kết thúc (chi tiết ở mục 8).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Bước 3 (Đóng) | Trang trước là một trang cùng origin | Quay lại trang đó | `features/awards-portal/components/rules-close-button.tsx:15-23,29` |
| Bước 3 (Đóng) | Không có trang trước cùng origin (mở thẳng link, tab mới) | Chuyển về trang chủ | `features/awards-portal/components/rules-close-button.tsx:30` |

### Interaction Notes

- **Bấm Đóng quay lại đúng trang người dùng vừa ở nếu trang đó thuộc site, ngược lại về trang chủ** — ưu tiên Navigation API (`currentEntry.index > 0`), trình duyệt không có thì dùng `history.length > 1` cùng `document.referrer` cùng origin — source: `features/awards-portal/components/rules-close-button.tsx:15-31`
- **Bậc Hero hiện trên trang thể lệ là cùng huy hiệu và cùng chữ với tooltip huy hiệu ở nơi khác** — dùng chung `HeroBadge` và khoá `hero.*` nên hai chỗ không lệch nhau — source: `features/awards-portal/components/rules-kudos-rewards.tsx:17-38`

## 5. UI States

N/A — no async ops

> Đã quét: trang là RSC chặn (`instant = false`), không có `loading.tsx`, `error.tsx`, danh sách động hay lệnh gọi dữ liệu phía client; hai danh sách (bậc Hero, icon Secret Box) là hằng số cố định. (`app/(app)/rules/page.tsx:13`, `features/awards-portal/components/rules-kudos-rewards.tsx:8-15`)

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected.

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Người chưa đủ điều kiện không vào được trang | auth | E01–E12 (cả trang) | Có phiên đăng nhập và đã có phòng ban | Chưa đăng nhập (về đăng nhập), chưa có phòng ban (về onboarding) | Consequence if bypassed: redirect |
| Trước ngày mở cửa, non-admin bị chặn | auth | E01–E12 (cả trang) | Sau thời điểm mở cửa, hoặc là admin | Trước thời điểm mở cửa với non-admin | Consequence if bypassed: [UNVERIFIED] consequence — needs security review (thực thi ở proxy, static analysis không xác nhận) |

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
| SCR003_AppLayout | Bấm link Thể lệ ở footer | — | `features/app-shell/components/app-footer.tsx:30`, `docs/generated/screen-flow.md:205` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Đóng | E11 | Có trang trước cùng origin | (stays on site: trang trước đó, không cố định) | redirect (`router.back()`) | `features/awards-portal/components/rules-close-button.tsx:29` |
| Đóng | E11 | Không có trang trước cùng origin | SCR011_Homepage | redirect (`router.push('/')`) | `features/awards-portal/components/rules-close-button.tsx:30` |
| Viết KUDOS | E12 | — | SCR007_KudosLiveBoardFeed | redirect (`/kudos`) | `features/awards-portal/components/rules-panel.tsx:43` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | partial | Danh sách icon Secret Box có `aria-label`, mỗi ảnh có `alt` là tên icon; huy hiệu Hero có `alt` là tên bậc; icon trong nút `aria-hidden`; nền `aria-hidden` (`rules-kudos-rewards.tsx:44-49`, `portal-icon.tsx:26`) |
| Keyboard navigation | supported | Chỉ có nút và link chuẩn với vòng focus dùng chung; không có phím tắt riêng |
| Focus management | unmanaged | Không có modal hay focus bằng mã; panel là trang chứ không phải hộp thoại |
| Screen reader compatibility | unknown | Có `<main>`, `<section>` kèm h1/h2; chưa có kiểm thử trình đọc màn hình trong mã |
| Error announcement | not implemented | Trang không có thông báo lỗi hay vùng live |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (`<md`) | R2 | Panel chiếm toàn bề ngang; từ `md` cố định 553 px và cao tối thiểu bằng khung nhìn trừ header | `features/awards-portal/components/rules-panel.tsx:19` |
| mobile / desktop (`md`) | E01 | Cỡ chữ tiêu đề nhỏ hơn dưới `md` | `features/awards-portal/components/rules-panel.tsx:21` |
| mobile (`<sm`) | R2 | Lề ngang 16 px, từ `sm` là 40 px | `features/awards-portal/components/rules-panel.tsx:19` |
| mobile (`<sm`) | E07 | Lề ngang lưới icon bỏ đi, từ `sm` thêm lề 48 px | `features/awards-portal/components/rules-kudos-rewards.tsx:44` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 1. | guard | `requireSunner()` (không phiên → `LOGIN_PATH`; thiếu phòng ban → `ONBOARDING_DEPARTMENT_PATH`) | `app/(app)/rules/page.tsx:20`, `shared/auth/current-user.ts:48-53` |
| § 1. | guard | Cổng prelaunch ở proxy; cross-ref BL013_PrelaunchGate | `features/awards-portal/server/prelaunch-gate.ts:6-8` |
| E11 | js | `RulesCloseButton` (client): `hasSameOriginHistory()` → `router.back()` hoặc `router.push(APP_ROUTES.home)` | `features/awards-portal/components/rules-close-button.tsx:15-31` |
| E04 | component | `HeroBadge` (size `rules`) + khoá `hero.<tier>.tooltipTitle/tooltipBody` từ feature hero-badges | `features/awards-portal/components/rules-kudos-rewards.tsx:23-38` |
| E01–E10 | helper | Toàn bộ chữ lấy từ `awardsPortal.rules.*` (BTC sửa chữ bằng messages JSON) | `features/awards-portal/components/rules-panel.tsx:21-39` |
| § 5. | handler | `export const instant = false` | `app/(app)/rules/page.tsx:13` |

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| `requireSunner()` ở trang và khung `(app)` | auth | Redirect về đăng nhập hoặc onboarding; trang chỉ có chữ tĩnh, không lộ dữ liệu người dùng |
| Cổng prelaunch (proxy) | role | [UNVERIFIED] server enforcement — static analysis cannot confirm API middleware |

## Source References

1. Page/View: `app/(app)/rules/page.tsx:19-29`
2. Panel: `features/awards-portal/components/rules-panel.tsx:16-47`
3. Hero tiers + Secret Box icons: `features/awards-portal/components/rules-kudos-rewards.tsx:8-57`
4. Close button: `features/awards-portal/components/rules-close-button.tsx:15-38`
5. Keyvisual (mượn từ kudos-feed): `features/kudos-feed/components/live-board-keyvisual.tsx:9-17`
6. Hero tier list: `features/hero-badges/schemas/hero-tier.ts:5`
7. UI copy: `messages/vi.json` (`awardsPortal.rules`, `hero`)
8. Parent frame: `app/(app)/layout.tsx:17-28`

## Source Walkthrough

1. **File:** `app/(app)/rules/page.tsx:19-29` — trang chỉ gọi `requireSunner` rồi đặt keyvisual tối và panel; bắt đầu từ đây.
2. **File:** `features/awards-portal/components/rules-panel.tsx:16-47` — cấu trúc ba section chữ và hàng nút cuối.
3. **File:** `features/awards-portal/components/rules-kudos-rewards.tsx:8-57` — hai danh sách hằng số (bậc Hero, icon Secret Box).
4. **File:** `features/awards-portal/components/rules-close-button.tsx:15-38` — thành phần client duy nhất, quyết định Đóng đi đâu.
5. **File:** `features/kudos-feed/components/live-board-keyvisual.tsx:9-17` — nền keyvisual phủ tối dùng chung với Live board.

### Call Hierarchy

```text
RulesPage (RSC)
 ├─ requireSunner
 ├─ LiveBoardKeyvisualBackground (dimmed)
 └─ RulesPanel
     ├─ RulesHeroTierList ─ HeroBadge (x4)
     ├─ RulesSecretBoxBadges (x6)
     ├─ RulesCloseButton (client) ─ hasSameOriginHistory ─ router.back / router.push
     └─ Link "Viết KUDOS"
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
Bấm Đóng -> RulesCloseButton.close -> hasSameOriginHistory() -> router.back() | router.push("/")
```

## Unresolved Questions

- `docs/generated/screen-flow.md` (Decision Points của SCR012_Rules) mô tả Đóng chỉ theo `document.referrer`; mã ưu tiên Navigation API rồi mới dùng `document.referrer` làm phương án dự phòng (`rules-close-button.tsx:15-23`). Cần cập nhật tài liệu cho khớp.
- Hạng mục "Viết KUDOS" luôn dẫn tới `/kudos`, kể cả khi cửa sổ ghi Kudos đã đóng; chưa thấy kiểm tra trạng thái này trên trang (`rules-panel.tsx:43-46`) — needs domain confirmation.
