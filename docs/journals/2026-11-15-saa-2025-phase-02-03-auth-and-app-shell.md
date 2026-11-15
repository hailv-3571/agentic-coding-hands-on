# Phase 02–03: trang admin trả 200 thay vì 403 trên production, sửa xong lại mở SSRF và open redirect

**Date**: 2026-11-15 23:08
**Severity**: high
**Component**: SAA 2025 Kudos Platform — `shared/auth/` (session proxy, access-denied), `db/migrations/0005_auth_user_triggers.sql`, `features/app-shell/`
**Status**: ongoing

## What Happened

Phase 02 (Google sign-in, cổng domain Sunner) và Phase 03 (app shell) chốt thành ba commit trên `main`: `0a2f72f` (auth), `749f057` (app shell), `ea9b2ae` (bằng chứng review, sync plan). Tester chạy full suite và bắt lỗi chính: user thường vào `/admin/*` nhận body 403 đúng nhưng HTTP status là 200. Vòng review sau bắt thêm một lỗ SSRF do chính bản sửa đầu tiên gây ra. Cả hai được xử lý trước khi commit, nên `0a2f72f` đã chứa bản sửa.

Kết quả cuối: unit 176/176, integration 108/108, e2e 30/30, `test:prod` 13 PASS trên `next start`, `auth.users` rỗng sau reset.

## The Brutal Truth

Đau nhất là e2e xanh suốt. `tests/e2e/app-shell/admin-frame-and-errors.spec.ts:62` assert `status() === 403` và vẫn pass, vì webServer chạy `next dev`, nơi request này trả 403. Production thì không. Test xanh trên môi trường khác production không chứng minh được gì về status.

Phần gai nhất: bản self-fetch đầu tiên lấy origin từ `request.nextUrl.origin`, tức là tin header `Host`. Ai gửi `Host` lạ đều điều khiển được đích server gọi tới.

## Technical Details

- Next 16.4.5 với Cache Components: `base-server.js:1036` ép `statusCode` 200. Shell prerender đã gửi 200 trước khi render tiếp (header `x-nextjs-postponed`, `x-nextjs-prerender`). `NextResponse.rewrite(url, { status: 403 })` và `forbidden()` trong render đều không đặt được 403.
- Bản sửa: proxy fetch trang public `/access-denied` rồi trả lại với status 403. Request không-GET hoặc có `next-action` nhận JSON 403. Origin lấy từ config, `shared/auth/access-denied-response.ts:26-28`:
  ```ts
  const origin = env.INTERNAL_APP_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;
  ```
  `PORT` đọc lại mỗi lần gọi, vì Next chỉ set nó sau khi server listen.
- Open redirect: `safeNextPath("/..//evil.com")` lọt qua. Kiểm tra `/` đầu và không `//` phải làm sau khi normalize URL.
- Trigger 0005: `BEFORE UPDATE OF email` bắn cả khi GoTrue ghi lại mọi cột lúc sign-in. Giữ nguyên thì các row non-Sunner có sẵn trên hosted `auth.users` sẽ lỗi `domain_not_allowed`. Tách thành `reject_foreign_domain_on_insert` và `reject_foreign_domain_on_email_change` với `WHEN (NEW.email IS DISTINCT FROM OLD.email)`.
- Matcher: bỏ exempt theo đuôi file. Chỉ còn `_next/static/`, `_next/image`, `images/`, `fonts/`, favicon, robots, sitemap. Kiểm bằng `unstable_doesMiddlewareMatch`, test `proxy-matcher.test.ts`.
- Header: token `bg-container` đã mang alpha 0.8, thêm `/80` thì alpha bị áp hai lần. Header trông đặc vì artwork bắt đầu dưới header sticky nên độ trong suốt không lộ ra. Figma không có blur và không có border, nên bỏ cả hai.

## What We Tried

1. `forbidden()` trong `app/admin/layout.tsx`: status 200, body 403.
2. `NextResponse.rewrite` sang trang 403 với `status: 403`: vẫn 200, base-server ép lại.
3. `forbidden()` trong render: vẫn 200.
4. Proxy fetch `/access-denied` và trả 403: đúng trên `next start`. Nhưng bản v1 dựng URL từ request, nên phải đổi sang config nội bộ.

Về quy trình: tester bị dừng giữa chừng khi đã rõ cần vòng fix thứ hai, nên tiết kiệm được một lượt full run. Evidence gate từ chối verdict vì `acceptanceCovered` bị viết lại bằng lời (dấu `;` thành `,`); từ giờ phải lặp nguyên văn text của criterion. Secret scan của git-manager chặn report có tiền tố `sb_secret_` trơ trọi; rule đã siết lại để cần thân key. Review tách thành ba reviewer hẹp (auth, db, shell) và hết các lần watchdog treo.

## Root Cause Analysis

Ba gốc rễ:

1. Quyết định status 403 bằng code render. Dưới Cache Components, status đã chốt 200 trước khi render chạy. Giả định về thứ tự đó sai, và dev không có cách nào lộ ra.
2. Tin dữ liệu request khi chọn đích cho request phía server.
3. Dựa vào hành vi trigger và matcher theo suy đoán: `UPDATE OF` tưởng là "email đổi", đuôi file tưởng là "static".

## Lessons Learned

- Status phải quyết định trước khi stream. Dưới Cache Components, mọi thứ sau shell đã là 200.
- Không dựng URL phía server từ request. Lấy từ config.
- Validate sau khi normalize, không trước.
- Postgres `UPDATE OF col` bắn khi cột nằm trong SET, không phải khi giá trị đổi. Luôn thêm `WHEN ... IS DISTINCT FROM`.
- Matcher exempt theo path cụ thể, không theo đuôi.
- Mọi hành vi liên quan status phải có test trên `next start`, không chỉ `next dev`.

## Next Steps

- Trước khi apply 0005 lên hosted Supabase: chạy `select id,email from auth.users where not public.is_sunner_email(email)` và xử lý các row còn lại. Người làm: user, trước deploy.
- Đặt `INTERNAL_APP_ORIGIN` trên hosting.
- OAuth `redirectTo` vẫn build từ `Host` (`sign-in-with-google-action.ts:18`). User quyết định xử lý khi chọn hosting.
- S-N2: cache HTML 403 theo locale để bỏ self-fetch mỗi lần hit. Chưa đặt hạn.
- Còn nợ: onboarding e2e, check Google thật thủ công, ảnh tablet, dòng D005 trong functional-spec F002.
