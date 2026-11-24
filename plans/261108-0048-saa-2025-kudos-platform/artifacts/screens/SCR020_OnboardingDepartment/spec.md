---
authored_by: rebuild-spec
---
<!-- Contract: references/screen-spec-researcher-contract.md -->

# SCR020_OnboardingDepartment — Screen Spec

**Screen**: SCR020_OnboardingDepartment: OnboardingDepartment
**Feature**: F001_Auth
**Type**: atomic
**Route**: /onboarding/department (query `next`)
**Generated**: 2026-11-24

## 1. Overview

**Purpose:** Sunner mới đăng nhập lần đầu chọn đơn vị mình đang làm việc để hoàn tất hồ sơ, một lần duy nhất; họ gặp màn này ngay sau khi đăng nhập Google lần đầu, hoặc khi vào một trang cần đơn vị mà hồ sơ chưa có.
**Actors:** Sunner mới (đã đăng nhập, hồ sơ chưa có đơn vị).
**Entry Conditions:** Có phiên hợp lệ và hồ sơ tồn tại nhưng chưa có đơn vị. Khách bị chuyển về trang đăng nhập; người đã có đơn vị bị chuyển thẳng tới trang đích; người có phiên nhưng không có hồ sơ nhận lỗi 401.
**Exit Conditions:** Chọn đơn vị thành công thì rời màn tới trang đích đã làm sạch (mặc định trang chủ); hoặc ở lại màn khi có lỗi chọn hay lỗi lưu.

## 2. Screen Layout

### Layout Sketch

Trang nằm ngoài cả ba layout nhóm (`(public)`, `(app)`, `admin`), chỉ có layout gốc (thẻ `body` dạng cột, nền tối) nên không có header lẫn footer. Thân trang là một vùng `main` canh giữa cả hai chiều, trong đó một thẻ rộng tối đa 560 px (bo góc 16, viền mảnh, bóng vàng) xếp dọc: tiêu đề, một dòng mô tả, nhóm lựa chọn đơn vị dạng lưới, thông báo lỗi nếu có và nút "Tiếp tục". (`app/layout.tsx:27-33`, `app/onboarding/department/page.tsx:41-47`)

```
┌───────────────────────────────────────────────┐
│ R1: Page Container (static, canh giữa)        │
│    ┌─────────────────────────────────────┐    │
│    │ R2: Onboarding Card (static, ≤560px)│    │
│    │  Chọn đơn vị của bạn   (h1)         │    │
│    │  mô tả "chỉ cần chọn một lần"       │    │
│    │  Đơn vị                             │    │
│    │  [◯ CEVC1] [◯ CEVC2] [◯ ...]        │    │
│    │  - - - thông báo lỗi - - -          │    │
│    │  [ Tiếp tục ]                       │    │
│    └─────────────────────────────────────┘    │
└───────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name | Position | Scrollable | Key Components |
|-----------|------|----------|------------|----------------|
| R1 | Page Container | static | no | main (`flex flex-1 items-center justify-center`) |
| R2 | Onboarding Card | static | no | section, DepartmentPickerForm, fieldset radio group |

## 3. UI Elements

| ID | Element | Type | Required | Default | Visibility | Action | Source | Format | Empty Behavior | Cross-ref |
|----|---------|------|----------|---------|------------|--------|--------|--------|-----------------|-----------|
| E01 | Chọn đơn vị của bạn (tiêu đề h1) | display field | — | Visible | Always | — | static | raw | — | N/A |
| E02 | Mô tả "Chọn đơn vị bạn đang làm việc để hoàn tất hồ sơ. Bạn chỉ cần chọn một lần." | message | — | Visible | Always | — | static | raw | — | N/A |
| E03 | Nhãn nhóm "Đơn vị" | region label | — | Visible | Always | — | static | raw | — | N/A |
| E04 | Lựa chọn đơn vị (radio, lưới 2 cột; 3 cột từ `sm`) | radio | yes | Không chọn sẵn | Always | Chọn đúng một đơn vị | API field | tên đơn vị theo ngôn ngữ giao diện, theo thứ tự seed | không có lựa chọn nào (nhóm trống) | MODEL001_Department.name_vi, MODEL001_Department.name_en |
| E05 | Thông báo lỗi dưới nhóm | message | — | Hidden | Conditional | — | static | raw | hidden | N/A |
| E06 | Tiếp tục | button | — | Enabled | Always | Gửi đơn vị đã chọn | — | "Tiếp tục"; "Đang lưu…" khi đang gửi | — | N/A |

Ghi chú: biểu mẫu còn một ô ẩn `next` mang đường dẫn đã làm sạch; người dùng không thấy nên không nằm trong bảng (xem Implementation Mapping). Màn không hiển thị đường dẫn đích.

## 4. User Actions

> **Scope:** within-screen interactions only. Cross-screen navigation belongs in `## 8. Navigation`.

### Available Actions

| Action | Element | Trigger | Condition | Result on this screen | Source |
|--------|---------|---------|-----------|------------------------|--------|
| Chọn đơn vị | E04 | click / Space / mũi tên | — | Đánh dấu một lựa chọn, thẻ chọn đổi viền vàng và nền; lỗi cũ vẫn còn cho tới lần gửi sau | `features/auth/components/department-picker-form.tsx:33-45` |
| Gửi đơn vị đã chọn | E06 | click / Enter | Đã chọn một đơn vị và không đang gửi | Nút khóa kèm `aria-busy`, chữ đổi thành "Đang lưu…" cho tới khi server trả | `features/auth/components/department-picker-form.tsx:19,54-61` |

### Happy Path

1. Sunner mở trang; thẻ hiện tiêu đề, mô tả và lưới các đơn vị (chưa chọn đơn vị nào).
2. Sunner chọn một đơn vị ở E04.
3. Sunner bấm "Tiếp tục" ở E06; nút khóa và hiện "Đang lưu…".
4. Server ghi đơn vị vào hồ sơ; màn kết thúc (xem § 8).

### Branches

| Decision point | Condition | Outcome on this screen | Source |
|----------------|-----------|------------------------|--------|
| Mở trang | Khách (chưa đăng nhập) | Không render, chuyển về trang đăng nhập kèm đường dẫn quay lại | `app/onboarding/department/page.tsx:28-29` |
| Mở trang | Có phiên nhưng không có hồ sơ | Không render, trả lỗi 401 | `app/onboarding/department/page.tsx:30-31` |
| Mở trang | Hồ sơ đã có đơn vị | Không render, chuyển thẳng tới đường dẫn đích đã làm sạch | `app/onboarding/department/page.tsx:32` |
| Bước 3 | Chưa chọn đơn vị nào | Trình duyệt chặn gửi và hiện lời nhắc có sẵn của nó; không gọi server | `features/auth/components/department-picker-form.tsx:41` |
| Bước 3 | Giá trị gửi không phải mã đơn vị hợp lệ, hoặc đơn vị không còn tồn tại, hoặc nhóm không có lựa chọn nào | Hiện "Vui lòng chọn một đơn vị trong danh sách." dưới nhóm, nút mở lại | `features/auth/server/choose-department-action.ts:50-53,63`, `features/auth/components/department-picker-form.tsx:49-53` |
| Bước 3 | Lỗi cơ sở dữ liệu hoặc hồ sơ biến mất lúc lưu | Hiện "Không lưu được lựa chọn, vui lòng thử lại.", nút mở lại | `features/auth/server/choose-department-action.ts:56-66` |
| Bước 3 | Đơn vị đã được đặt trước đó (gửi lặp, hai tab) | Không báo lỗi, vẫn chuyển tới đường dẫn đích; đơn vị cũ được giữ nguyên | `features/auth/server/choose-department-action.ts:28-35,69` |
| Bước 3 | Phiên hết hạn khi gửi | Chuyển về `/login` (không kèm đường dẫn quay lại) | `features/auth/server/choose-department-action.ts:47-48` |

### Interaction Notes

- **Biểu mẫu chỉ ghi đơn vị khi hồ sơ chưa có đơn vị nên không đổi được về sau; gửi lại sau khi đã chọn chỉ đưa người dùng đi tiếp** — source: `features/auth/server/choose-department-action.ts:28-35,69`
- **Gửi lần hai bị chặn khi đang gửi: nút bị vô hiệu hóa và đánh dấu bận** — source: `features/auth/components/department-picker-form.tsx:56-57`
- **Lựa chọn được tô nổi bằng viền và nền vàng ngay trên thẻ chứa radio, kể cả khi chỉ focus bàn phím (viền focus phủ cả thẻ)** — source: `features/auth/components/department-picker-form.tsx:33-36`

## 5. UI States

| State | Trigger | Visual Behavior | User Action Available | Source |
|-------|---------|----------------|-----------------------|--------|
| loading (trang) | Mở `/onboarding/department` | Route chặn: phiên, hồ sơ và `?next` quyết định phản hồi trước khi render, không có skeleton | none | `app/onboarding/department/page.tsx:17-18,27-32` |
| idle | Mở trang, chưa chọn | Lưới đơn vị chưa chọn, nút "Tiếp tục" bật | Chọn đơn vị, bấm Tiếp tục | `features/auth/components/department-picker-form.tsx:22-62` |
| saving | Server Action đang chạy | Nút khóa, `aria-busy`, chữ "Đang lưu…", con trỏ chờ | none | `features/auth/components/department-picker-form.tsx:56-61` |
| error | Action trả `invalid_department` hoặc `unexpected` | Dòng chữ đỏ dưới nhóm, `role="alert"`; nhóm đánh dấu `aria-invalid` khi là `invalid_department` | Chọn lại, bấm lại | `features/auth/components/department-picker-form.tsx:25-29,49-53` |
| empty | Bảng đơn vị không có dòng nào | Nhóm "Đơn vị" không có radio nào (không có câu giải thích) | Bấm Tiếp tục (sẽ báo "Vui lòng chọn một đơn vị trong danh sách.") | `features/auth/server/department-options-query.ts:10-15`, `features/auth/components/department-picker-form.tsx:32-46` |
| success | Lưu xong | Chuyển hướng tới đường dẫn đích, không có toast | none | `features/auth/server/choose-department-action.ts:69` |

## 6. Validation & Feedback

| Element | Rule | Feedback | Trigger |
|---------|------|----------|---------|
| E04 | Bắt buộc chọn một đơn vị | Lời nhắc có sẵn của trình duyệt (nội dung phụ thuộc trình duyệt và ngôn ngữ của nó) [UNVERIFIED] — needs runtime confirmation | submit |
| E05 | Đơn vị gửi lên phải là mã hợp lệ và còn tồn tại | "Vui lòng chọn một đơn vị trong danh sách." | server response |
| E05 | Lưu phải thành công | "Không lưu được lựa chọn, vui lòng thử lại." | server response |

## 7. Conditional UI

| Condition | Type | Element(s) | Visible when | Hidden when | Notes |
|-----------|------|------------|--------------|-------------|-------|
| Màn chỉ dành cho người đã đăng nhập và chưa có đơn vị | auth | E01..E06 | Có phiên, có hồ sơ, hồ sơ chưa có đơn vị | Khách (về đăng nhập), không có hồ sơ (401), đã có đơn vị (đi tiếp tới đích) | Consequence if bypassed: không lộ dữ liệu; cổng thật là mọi trang Sunner khác đưa người chưa có đơn vị về đây |
| Tên đơn vị theo ngôn ngữ giao diện | configuration | E04 | Ngôn ngữ vi: tên tiếng Việt | Ngôn ngữ en: tên tiếng Anh | Thứ tự theo cột thứ tự của đơn vị rồi mã đơn vị |
| Thông báo lỗi chỉ hiện sau một lần gửi thất bại | configuration | E05 | Action trả mã lỗi | Chưa gửi, hoặc đang bắt đầu lần gửi mới (kết quả lỗi cũ vẫn giữ trong trạng thái của biểu mẫu) | Có hai mã: chọn sai và lỗi lưu |
| Chữ nút đổi khi đang gửi | configuration | E06 | "Tiếp tục" lúc rảnh | "Đang lưu…" lúc đang gửi | Nút vô hiệu hóa trong lúc gửi |

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
| SCR001_Login | Hoàn tất OAuth tại `/auth/callback` | Hồ sơ chưa có phòng ban; kèm `?next=` đã làm sạch | `features/auth/server/complete-login.ts:52`, `app/auth/callback/route.ts:30-31` |
| external | Một trang cần đơn vị gọi `requireSunner()` | Hồ sơ chưa có đơn vị; chuyển tới `/onboarding/department` không kèm `next` | `shared/auth/current-user.ts:48-52` |

### Exits

| Action | Element | Condition | Destination | Result | Source |
|--------|---------|-----------|-------------|--------|--------|
| Gửi đơn vị đã chọn | E06 | Đơn vị hợp lệ (hoặc đã có đơn vị) và `next` mặc định `/` | SCR011_Homepage | redirect | `features/auth/server/choose-department-action.ts:69`, `shared/auth/safe-next-path.ts:15` |
| Gửi đơn vị đã chọn | E06 | Đơn vị hợp lệ và `next` là đường dẫn cùng origin khác `/` | (đường dẫn `next` đã làm sạch, trang bất kỳ của Sunner) | redirect | `features/auth/server/choose-department-action.ts:69` |
| Mở trang khi chưa đăng nhập | — | Khách | SCR001_Login | redirect (kèm `next` trỏ lại màn này) | `app/onboarding/department/page.tsx:29` |
| Mở trang khi đã có đơn vị | — | Hồ sơ đã có đơn vị | (đường dẫn `next` đã làm sạch, mặc định SCR011_Homepage) | redirect | `app/onboarding/department/page.tsx:32` |
| Gửi khi phiên hết hạn | E06 | Không còn phiên | SCR001_Login | redirect (không kèm `next`) | `features/auth/server/choose-department-action.ts:47-48` |

## 9. Accessibility

| Aspect | Status | Notes |
|--------|--------|-------|
| ARIA roles/labels | present | Nhóm radio là `fieldset` có `legend` "Đơn vị"; mỗi radio nằm trong `label` bọc cả tên; nhóm có `aria-invalid` khi lỗi chọn và `aria-describedby` trỏ tới thông báo; lỗi `role="alert"`; nút có `aria-busy` |
| Keyboard navigation | supported | Radio và nút là phần tử native (mũi tên chọn trong nhóm, Tab tới nút, Enter gửi); viền focus phủ cả thẻ lựa chọn (`has-focus-visible`) và nút; không có phím tắt riêng |
| Focus management | unmanaged | Không autofocus; sau khi có lỗi focus không tự di chuyển tới thông báo (đọc nhờ `role="alert"`) |
| Screen reader compatibility | partial | Có landmark `main`, một h1, `fieldset` / `legend` chuẩn; chưa có kiểm thử với trình đọc màn hình |
| Error announcement | supported | Lỗi dùng `role="alert"` nên đọc ngay khi xuất hiện |

## 10. Responsive Behavior

| Breakpoint | Region / Element | Behavior | Source |
|------------|-------------------|----------|--------|
| mobile (< sm) | E04 | Lưới 2 cột; từ `sm` là 3 cột | `features/auth/components/department-picker-form.tsx:31` |
| mobile (< sm) | R2 | Đệm thẻ 24 px; từ `sm` là 40 px | `app/onboarding/department/page.tsx:42` |
| mobile (< sm) | E06 | Nút chiếm cả chiều rộng thẻ; từ `sm` rộng theo nội dung và canh trái (`sm:self-start`) | `features/auth/components/department-picker-form.tsx:58` |
| desktop (sm+) | R2 | Thẻ rộng tối đa 560 px, canh giữa trong R1 | `app/onboarding/department/page.tsx:41-42` |

## Technical Appendix

> Implementation detail below — controller/class names, framework specifics, helper methods,
> JavaScript wiring, API implementation, session state, security implementation, source
> citations and code-reading order. PO/BA/QA/Designer readers can stop at § 10.

## Implementation Mapping

| Refers to | Kind | Implementation | Source |
|-----------|------|-----------------|--------|
| § 2. | component | `export const instant = false`: trang đọc phiên, hồ sơ và `?next` nên là route chặn; trang không gọi `requireSunner()` vì chính hàm đó đưa người dùng tới đây | `app/onboarding/department/page.tsx:17-18,22-26` |
| § 1. | helper | Thứ tự quyết định khi mở trang: `safeNextPath(?next)` → `getSessionUser()` (khách → đăng nhập kèm `onboardingPathWith(next)`) → `findSessionProfile` (không có → `unauthorized()`) → đã có `departmentId` → `redirect(next)` | `app/onboarding/department/page.tsx:27-32` |
| E04 | helper | `listDepartmentOptions(locale)` đọc đơn vị đã seed, sắp theo `sort_order` rồi `code`, tên theo `name_en` nếu ngôn ngữ en, còn lại `name_vi` | `features/auth/server/department-options-query.ts:10-15` |
| E06 | endpoint | Server Action `chooseDepartment` (ROUTE022, POST `/onboarding/department` qua `useActionState`). Request: `departmentId` (uuid), `next` (chuỗi tối đa 2048 ký tự); mọi trường khác bị loại, người dùng luôn lấy từ phiên. Success: `redirect(safeNextPath(next))`. Error: trả `{ error: "invalid_department" \| "unexpected" }` | `features/auth/server/choose-department-action.ts:44-69`, `features/auth/schemas/choose-department-schema.ts:9-10` |
| E06 | helper | `assignFirstDepartment`: tìm đơn vị theo id; `UPDATE profiles SET department_id … WHERE id = :user AND department_id IS NULL`; không cập nhật được thì kiểm hồ sơ có tồn tại (`already_set`) hay không (`profile_missing`) | `features/auth/server/choose-department-action.ts:18-35` |
| E05 | js | `useActionState(chooseDepartment, { error: null })`: `state.error` chọn khóa thông điệp `auth.onboarding.errors.*`, `pending` khóa nút | `features/auth/components/department-picker-form.tsx:14-19,49-53` |
| § 8. | helper | `safeNextPath`: chỉ nhận đường dẫn cùng origin (bắt đầu một `/`, không `//`, không dấu `\` hay ký tự điều khiển, kiểm lại sau khi chuẩn hóa URL), tối đa 2048 ký tự, nếu không thì rơi về `/` | `shared/auth/safe-next-path.ts:1-27` |

## Component Variants

N/A — không có component đa biến thể dùng chung trên màn này.

## Security Surface

| Guard | Type | Consequence if bypassed |
|-------|------|------------------------|
| Proxy: `/onboarding/department` không nằm trong allowlist công khai, khách bị chuyển về `/login?next=` | auth | Bỏ qua proxy thì trang vẫn chuyển khách về đăng nhập (`shared/auth/public-paths.ts:11,32-40`, `app/onboarding/department/page.tsx:28-29`) |
| Trang và action tự gọi `getSessionUser()`; người dùng chỉ lấy từ phiên, `userId` giả trong form bị loại bỏ | auth | Không thể gán đơn vị cho người khác (`features/auth/server/choose-department-action.ts:47-48`, `features/auth/schemas/choose-department-schema.ts:1-10`) |
| `safeNextPath` làm sạch `next` ở cả trang và action | permission | Open redirect: người dùng có thể bị chuyển sang trang ngoài sau khi chọn đơn vị (`shared/auth/safe-next-path.ts:15-27`) |
| Điều kiện `department_id IS NULL` khi ghi | permission | Đơn vị đã đặt bị người dùng đổi về sau mà không qua quản trị (`features/auth/server/choose-department-action.ts:28-30`) |
| Kiểm tồn tại của đơn vị (`department_not_found`) | permission | Gán một đơn vị không có thật cho hồ sơ (`features/auth/server/choose-department-action.ts:21-24`) |

## Source References

1. Page/View: `app/onboarding/department/page.tsx:1-49`
2. Root layout (context): `app/layout.tsx:27-35`
3. Form: `features/auth/components/department-picker-form.tsx:1-64`
4. Server Action: `features/auth/server/choose-department-action.ts:1-69`
5. Input schema: `features/auth/schemas/choose-department-schema.ts:1-13`
6. Department options: `features/auth/server/department-options-query.ts:1-15`
7. Next path guard: `shared/auth/safe-next-path.ts:1-27`
8. Onboarding redirect source: `shared/auth/current-user.ts:44-52`
9. Login redirect source: `features/auth/server/complete-login.ts:52`
10. Path helpers: `shared/auth/public-paths.ts:7-12,55-63`
11. UI copy: `messages/vi.json` (khóa `auth.onboarding`)

## Source Walkthrough

1. **File:** `app/onboarding/department/page.tsx:1-49` — trang chính: ba nhánh chuyển hướng rồi dựng thẻ.
2. **File:** `features/auth/components/department-picker-form.tsx:1-64` — biểu mẫu radio và các trạng thái.
3. **File:** `features/auth/server/choose-department-action.ts:1-69` — ghi đơn vị một lần và các mã lỗi.
4. **File:** `shared/auth/safe-next-path.ts:1-27` — vì sao `next` an toàn.
5. **File:** `shared/auth/current-user.ts:44-52` — nơi `requireSunner()` đưa người chưa có đơn vị về màn này.

Lớp dữ liệu: đơn vị xem MODEL001_Department; hồ sơ (cột `department_id`) xem MODEL004_Profile trong entities.md. Màn không có tầng dữ liệu riêng ở UI.

### Call Hierarchy

```text
OnboardingDepartmentPage -> safeNextPath / getSessionUser / findSessionProfile -> listDepartmentOptions -> DepartmentPickerForm
DepartmentPickerForm -> useActionState -> chooseDepartment -> assignFirstDepartment -> redirect(safeNextPath(next))
```

**Related files:** see `## Source References` above (already numbered in reading order — F15
DRY, one list not two).

### Data Flow

```text
?next -> safeNextPath (page.tsx:27) -> ô ẩn "next" của biểu mẫu
Chọn radio + Tiếp tục -> chooseDepartment (departmentId, next) -> UPDATE ... WHERE department_id IS NULL -> redirect(safeNextPath(next)) | mã lỗi -> thông báo E05
```

## Unresolved Questions

- `requireSunner()` đưa người chưa có đơn vị về `/onboarding/department` không kèm `next` (`shared/auth/current-user.ts:51`), nên sau khi chọn đơn vị họ về trang chủ chứ không về trang họ định vào; chỉ luồng OAuth (`features/auth/server/complete-login.ts:52`) mới mang `next`. [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ việc mất trang đích ở nhánh `requireSunner()` có chủ ý hay không.
- Người có phiên nhưng không có hồ sơ nhận 401 qua `unauthorized()` (`app/onboarding/department/page.tsx:31`); repo không có `app/unauthorized.tsx` nên giao diện trang 401 do Next quyết định — [UNVERIFIED] — needs runtime confirmation.
- Khi bảng đơn vị rỗng, nhóm radio trống và không có câu giải thích; gửi form khi đó trả "Vui lòng chọn một đơn vị trong danh sách." (`features/auth/components/department-picker-form.tsx:32-46`, `features/auth/server/choose-department-action.ts:50-53`). [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ trường hợp bảng đơn vị rỗng có được xem là thực tế hay không (đơn vị được seed ở cơ sở dữ liệu).
- Action chuyển về `/login` trần khi phiên hết hạn (`features/auth/server/choose-department-action.ts:47-48`), không kèm `next` như trang (`app/onboarding/department/page.tsx:29`), nên đăng nhập lại không quay về màn này. [NEEDS_DOMAIN_CONFIRMATION] — chưa rõ có chủ ý hay không.
- Lời nhắc khi bấm "Tiếp tục" mà chưa chọn do trình duyệt sinh từ thuộc tính `required` của radio, không có chữ riêng của ứng dụng (xem § 6).
