---
lang: vi
---

# Changelog

Mới nhất ở trên. Mỗi phase hoàn thành thêm một mục.

## 2026-11-16 — Phase 04 (F003 Kudos authoring)

Added
- Schema `shared/db/schema/kudos.ts` và migration `0006_kudos.sql`, `0007_kudos_constraints.sql`, `0008_kudos_review_fixes.sql`: bảng `kudos`, `kudo_hashtags`, `kudo_images`, `kudo_image_uploads`, enum `kudo_status`; CHECK không tự gửi, lời nhắn 1–1000 ký tự và không rỗng, danh hiệu không rỗng, nickname ẩn danh 1–30; hàm `public.f_unaccent`; RLS bật, không có policy cho client.
- `features/kudos-authoring/`: Server Action `createKudo` (ghi `kudos` + bảng con + outbox `KudoCreated` trong một transaction) và `updateKudo`; modal soạn Kudo (tạo / sửa) và `KudoComposerLauncher` trên trang chủ.
- `features/sunner-search/`: tìm Sunner không phân biệt dấu tiếng Việt, tham số `excludeSelf`.
- Route handler: `GET /api/sunners/search`, `GET /api/hashtags`, `POST /api/kudos/images/sign`, `GET /api/kudos/{id}/edit`.
- Quy ước route handler dữ liệu và Server Action ghi trong `docs/code-standards.md`; mục "Ghi Kudo" trong `docs/system/architecture.md`.

Decisions
- Cửa ghi đóng từ `EVENT_END_AT` (403 `WRITING_CLOSED` ở action và route ký ảnh).
- Sửa Kudo: chỉ chủ bài (403 `FORBIDDEN`), Kudo spam không sửa được (423 `SPAM_LOCKED`), không đổi người nhận, không có thao tác xóa.
- Ảnh: đường dẫn `kudos/{uuid}.{ext}` không chứa id người gửi; chỉ nhận đường dẫn chính người đó đã ký. Thay quy tắc cũ "ảnh nằm trong thư mục của người gửi".
- Lời nhắn là Markdown rút gọn lưu nguyên văn; cấm ảnh Markdown và link tham chiếu. Phase 05 phải render bằng whitelist (`research/phase-04-backend-contracts.md` § 1.1). Hashtag 1–5, danh hiệu tùy chọn ≤ 50.

Security
- Trần 20 lượt ký upload ảnh chưa dùng / người / 24 giờ (429 `UPLOAD_LIMIT`) và body route ký tối đa 4 KB (413, không parse).
- Route nạp dữ liệu sửa trả `Cache-Control: private, no-store`; mã lỗi không kèm nội dung Kudo.

Deferred
- Job dọn ảnh mồ côi, kiểm magic byte ảnh, chỉ mục trigram cho tìm Sunner, vô hiệu hóa profile mềm.

Docs
- `docs/features/F003_KudosAuthoring/*` chưa cập nhật tay (vượt ngưỡng sửa cục bộ): chạy `/tkm:rebuild-spec --features F003`.

## 2026-11-15 — Phase 02 (F001 Auth) + Phase 03 (F002 App shell)

Added
- Đăng nhập Google (PKCE) giới hạn `@sun-asterisk.com`: màn Login, `/auth/callback`, đăng xuất, chọn phòng ban lần đầu (`/onboarding/department`).
- `proxy.ts` + `shared/auth/session-proxy.ts`: làm mới session bằng `getUser()`, chuyển khách tới `/login?next=…`, `/api/` trả JSON 401, `/admin/*` của người không phải Admin trả 403 thật (HTML `/access-denied`; non-GET hoặc server action: JSON 403). Chi tiết ở `docs/system/architecture.md`.
- Guard `requireSunner()` / `requireAdmin()` (`shared/auth/`); `authInterrupts: true` trong `next.config.ts` cho `forbidden()` / `unauthorized()`.
- Migration `0004_profiles.sql` (bảng `profiles`, `department_id` uuid nullable) và `0005_auth_user_triggers.sql`: auth hook `before_user_created`, trigger chặn domain khi insert và khi đổi email, `create_sunner_profile`, `sync_profile_email`.
- App shell: layout Sunner và Admin, `LanguageSwitcher` (cookie `NEXT_LOCALE`), `AccountMenu`, trang 404 và 403, chọn locale ở `shared/i18n/resolve-locale.ts`.
- Biến `INTERNAL_APP_ORIGIN` (tùy chọn) trong `shared/config/env-schema.ts` và `.env.example`.
- Script `npm run test:prod` (build trước): kiểm status HTTP thật trên `next start`.
- Quy tắc auth và test mới trong `docs/code-standards.md`.

Security
- Open redirect: mọi đích `next` đi qua `safeNextPath()` (chặn `//host`, `\`, ký tự điều khiển, dot-segment sau chuẩn hóa).
- SSRF ở bước proxy tự fetch `/access-denied` cho 403: origin lấy từ `INTERNAL_APP_ORIGIN` hoặc `http://127.0.0.1:$PORT`, không từ `Host` / `x-forwarded-*`; chỉ chuyển cookie locale và `Accept-Language`, `redirect: "manual"`, timeout 5 giây.
- Matcher của proxy thu hẹp: chỉ loại `_next/static/`, `_next/image`, `images/`, `fonts/`, `favicon.ico`, `robots.txt`, `sitemap.xml`; không loại theo đuôi file, nên Route Handler như `/api/admin/export.xml` vẫn qua cổng session.
- Trigger domain tách thành `_on_insert` và `_on_email_change` (chỉ khi email đổi): tài khoản có sẵn ngoài domain không bị khóa khi GoTrue ghi lại cột khác; đổi email sang NULL hoặc domain lạ vẫn bị chặn.

Decisions
- Trang 404 là trang trần theo Figma; CTA "Về trang chủ" khi đã đăng nhập, "Đăng nhập" cho khách (thay D005 của F002). Trang 403 giữ nút "Về trang chủ".
- Khách vào `/` chuyển tới `/login` không kèm `?next=%2F`.
- `redirectTo` của OAuth Google hoãn tới khi chọn hosting (checklist go-live trong decision-log).
- Hosting phải cho server tự gọi được origin nội bộ (`INTERNAL_APP_ORIGIN`); phase 07 phải cho khách vào `/access-denied`.

## 2026-11-15 — Phase 01: Foundation & infrastructure

Added
- Supabase local qua CLI + Docker (`supabase/config.toml`, `project_id = saa-2025-kudos`).
- Cấu hình env bằng Zod ở `shared/config/**`, kiểm tra fail-fast trong `next.config.ts`; `SKIP_ENV_VALIDATION=1` chỉ dùng trong `scripts/typecheck.mjs`. Mốc thời gian sự kiện, `ADMIN_EMAILS`, tham số game và admin nằm trong `.env.example`.
- Drizzle client một pool (`shared/db/client.ts`) và schema barrel `shared/db/schema/index.ts`.
- Migration `db/migrations/0000`–`0003`: dữ liệu tham chiếu (`departments`, `hashtags`), `domain_event_outbox`, RLS baseline + REVOKE quyền `anon`/`authenticated`, bucket Storage `kudo-images` (riêng tư, JPG/PNG/WEBP, 5 MB).
- Domain event outbox `shared/events/**` (`add(tx, …)` trong transaction nghiệp vụ).
- Seed `db/seeds/**`: 6 phòng ban, 8 hashtag, danh mục Secret Box tạm.
- `shared/admin/**`: CSV serializer (BOM, chặn formula), lọc khoảng ngày, múi giờ `Asia/Ho_Chi_Minh`, giới hạn export.
- next-intl nền (cookie `NEXT_LOCALE`, không tiền tố URL, `messages/vi.json`, `en.json`).
- Token Tailwind 4 `@theme` từ Figma, font Montserrat.
- Vitest (unit, integration) và Playwright; script npm `typecheck`, `lint`, `test:unit`, `test:integration`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`, `db:reset`.
- Tài liệu: README, `docs/code-standards.md`, `docs/development-roadmap.md`, file này.

Decisions
- Root layout `instant = false` (xem `plans/261108-0048-saa-2025-kudos-platform/spec/decision-log.md`).
- C-18: server action cho form/mutation nội bộ; route handler cho đọc và endpoint cần header đặc thù.
