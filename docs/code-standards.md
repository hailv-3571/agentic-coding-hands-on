---
lang: vi
---

# Quy ước code

Áp dụng cho mọi phase. Nguồn: `plans/261108-0048-saa-2025-kudos-platform/plan.md` và code phase 01.

## Bố cục

```
app/                  # route App Router: (public)/, (app)/, admin/, api/
features/<slug>/      # components/, server/ (queries, actions, services), schemas/
shared/               # config/, db/, auth/, i18n/, ui/, events/, admin/
db/migrations/        # drizzle + SQL viết tay (trigger, EXCLUDE, realtime, RLS)
db/seeds/             # departments, hashtags, secret-box prize
messages/             # vi.json, en.json
tests/                # unit/, integration/ (Supabase local), e2e/ (Playwright)
```

Hiện có: `shared/{admin,auth,config,db,events,i18n,ui}`, `features/{admin-campaigns,auth,app-shell,kudos-authoring,kudos-feed,kudos-hearts,sunner-search}`, `db/`, `messages/`, `tests/`. Feature mới tạo thư mục riêng dưới `features/` ở phase của nó.

## Quy tắc chung

- Tên file kebab-case, đặt tên nói rõ việc file làm. Mỗi file code dưới 200 dòng; quá thì tách module.
- Alias import `@/` trỏ về gốc repo.
- Sửa file có sẵn, không tạo bản "enhanced" song song.

## Server và bí mật

- File chạm DB hoặc secret bắt đầu bằng `import "server-only"` (vd. `shared/db/client.ts`, `shared/events/domain-event-outbox.ts`).
- Biến môi trường chỉ đọc qua `shared/config` (`env.ts` cho server, `public-env.ts` cho `NEXT_PUBLIC_*`), không dùng `process.env` rải rác. Schema ở `env-schema.ts`.
- `next.config.ts` kiểm tra env khi `dev`/`build`/`start`. `SKIP_ENV_VALIDATION=1` chỉ dành cho `scripts/typecheck.mjs`; không đặt cho dev/build/start.
- Drizzle kết nối bằng vai trò server nên bỏ qua RLS: mọi kiểm tra quyền nằm ở code server.
- Chỉ dùng một pool: `db` từ `shared/db/client.ts`. Không tự `postgres(...)` ở nơi khác.

## Database

- Ràng buộc đơn bảng (độ dài, không rỗng, khác nhau) đặt thành CHECK ở DB bằng SQL viết tay (`0007_kudos_constraints.sql`), ngoài kiểm Zod ở server; Drizzle schema khai báo `.enableRLS()` cho từng bảng.
- Mỗi migration tạo bảng phải bật RLS cho bảng đó trong cùng migration, không tạo policy cho `anon`/`authenticated`. `0002_rls_baseline.sql` đã REVOKE quyền của hai role này, kể cả bảng tạo sau. Test `tests/integration/foundation/rls-baseline.test.ts` kiểm tra điều này.
- Schema barrel `shared/db/schema/index.ts`: mỗi feature thêm đúng một dòng `export *`, không sửa dòng khác.
- Cần SQL viết tay (trigger, `EXCLUDE`, policy) thì đặt trong `db/migrations/`. Sinh migration: `npm run db:generate`.
- Seed nằm ở `db/seeds/`, chạy bằng `npm run db:seed`.

## Auth và phân quyền

- **Layout guard chỉ để UX.** Mỗi page và mỗi server action tự gọi `requireSunner()` hoặc `requireAdmin()` (`shared/auth/current-user.ts`, `shared/auth/admin-guard.ts`), không dựa vào layout hay proxy đã chặn trước. Layout không bảo vệ được server action; proxy chỉ là lớp lạc quan.
- **Không dựng URL server-side từ header `Host` hay `x-forwarded-*`** (fetch nội bộ, redirect, link tuyệt đối): caller điều khiển được các header này (SSRF, redirect sai chỗ). Lấy origin từ config: `INTERNAL_APP_ORIGIN` cho fetch tự gọi, mặc định `http://127.0.0.1:$PORT` (`shared/auth/access-denied-response.ts`). Ngoại lệ đã ghi nhận: `redirectTo` của OAuth Google (`features/auth/server/sign-in-with-google-action.ts`) và redirect trong `app/auth/callback/route.ts` còn lấy origin từ request; chốt khi chọn hosting (decision-log, 2026-11-15).
- **Mọi đích redirect đến từ input (`next`, query, form) phải qua `safeNextPath()`** (`shared/auth/safe-next-path.ts`). Hàm chỉ cho đường dẫn cùng origin, chặn `//host`, dấu `\`, ký tự điều khiển và dot-segment. Không tự kiểm `startsWith("/")`.
- Xác thực session bằng `getUser()` ở cả proxy lẫn page (`getSessionUser`). Không dùng `getClaims()` để quyết định quyền: hai bên lệch nhau sẽ gây vòng lặp chuyển trang.

## Route handler dữ liệu và Server Action ghi (phase 04)

- Route handler JSON tự gọi guard riêng (`requireApiSunner()` ở `features/kudos-authoring/server/`): trả JSON 401/403, không redirect. Body lỗi chỉ `{ code, fieldErrors? }`, không kèm nội dung bản ghi. Endpoint trả dữ liệu riêng tư đặt `Cache-Control: private, no-store`.
- Server Action ghi trả kết quả có kiểu `{ ok: true, id } | { ok: false, code, fieldErrors? }` (HTTP 200, mã lỗi nằm trong body), không ném lỗi cho trường hợp nghiệp vụ. Action không tự `revalidate`: client gọi `router.refresh()`.
- Thao tác ghi gắn với mốc sự kiện kiểm lại `isEventWritingOpen(new Date())` ở server mỗi lần gọi; `isKudoWritingOpen()` chỉ để truyền cờ cho UI.
- Hằng số và schema Zod dùng chung client + server (`kudo-authoring-limits.ts`, `schemas/`) không import `server-only`; client import từ đó, không import từ `server/`.
- Độ dài chữ đếm theo code point (`kudoTextLength`), cùng đơn vị với `char_length` của CHECK ở DB.
- Upload ảnh: server chỉ cấp signed upload URL; đường dẫn lưu không chứa id người dùng. Khi ghi chỉ nhận đường dẫn chính người đó đã ký. Request nhận body JSON nhỏ thì đọc có trần byte (`read-capped-json-body.ts`), vượt trần trả 413 trước khi parse.
- Nội dung người dùng dạng Markdown rút gọn lưu nguyên văn, không bao giờ coi là HTML. Kiểm ở bước ghi chỉ là lớp phụ; chỗ hiển thị phải dùng renderer whitelist (phạm vi cú pháp: `plans/261108-0048-saa-2025-kudos-platform/research/phase-04-backend-contracts.md` § 1.1).

## Đọc dữ liệu công khai (phase 05)

- Truy vấn đọc dữ liệu người dùng dựng DTO bằng whitelist cột (`kudo-row-mask.ts`), không spread dòng DB; che danh tính ở server, không trông vào UI hay RLS. Client component chỉ nhận DTO đó (payload RSC cũng là response).
- Phân trang theo cursor mờ đục, giữ micro giây của `timestamptz`, giải mã nghiêm ngặt (`kudo-feed-cursor.ts`); route đọc trả 400 trước khi truy vấn.
- Page gọi `notFound()` ngoài try/catch, cùng một kết quả cho mọi trường hợp "không thấy được"; trên production đây là soft 404.
- Hiển thị Markdown của người dùng chỉ qua `features/kudos-feed/markdown/` (whitelist, `http(s)` không kèm credentials, ảnh là chữ, trần 5.000 đơn vị UTF-16).
- Chỗ giao cho phase sau để lại thành file "seam" với chữ ký cố định (`enrich-heart-summary.ts` đã viết lại ở phase 06; `enrich-hero-tier.ts` chờ phase 09); phase sở hữu viết lại cả file, không rải logic ở nơi gọi.

## Ghi qua server action và Campaign (phase 06)

- Server action ghi dữ liệu admin gọi `requireAdmin()` đầu tiên, trước khi đọc hay ghi; trả kết quả có mã lỗi trong thân (`{ ok: false, error | code }`), không ném cho lỗi nghiệp vụ.
- Component client chỉ import hai module `"use server"` và module `schemas/`; không import file `server/*` khác.
- Quy tắc phụ thuộc thời gian (giai đoạn Campaign, khoá sự kiện) tính lại ở server trong transaction ghi, không tin trạng thái trình duyệt đã thấy.
- Ràng buộc không chồng giờ do Postgres giữ (`EXCLUDE`, migration viết tay); app kiểm trước để có thông báo rõ và ánh xạ SQLSTATE `23P01` khi đua nhau.
- Giờ `datetime-local` của Admin đổi sang UTC bằng `zonedDateTimeToUtc` (`shared/admin/timezone.ts`).
- Migration phase 06 (`0010`–`0012`) có file `.down.sql` để rollback; migration trước đó không có.

## Domain event outbox

`DomainEventOutbox.add(tx, type, payload)` (`shared/events/domain-event-outbox.ts`) chỉ gọi bên trong transaction nghiệp vụ của caller. Hàm không tự mở transaction, nên event chỉ tồn tại nếu thay đổi nghiệp vụ commit. Payload được kiểm bằng Zod theo `domain-event-types.ts`; sai thì ném lỗi và rollback. Ví dụ: `createKudo` gọi `DomainEventOutbox.add(tx, "KudoCreated", { kudoId })` cùng transaction với `kudos`; sửa Kudo không phát event.

## Mutation (C-18)

- Server action: form và mutation nội bộ.
- Route handler: đọc (GET) và endpoint cần header đặc thù (vd. `Idempotency-Key`).

## i18n

- next-intl, locale lấy từ cookie `NEXT_LOCALE`, không có tiền tố URL, mặc định `vi`.
- Mỗi feature một namespace trong `messages/vi.json` và `messages/en.json`; thêm key ở cả hai file.
- Root layout đặt `export const instant = false` (quyết định trong `spec/decision-log.md`); segment con có thể bật lại `instant = true` kèm `<Suspense>`.

## UI

Tailwind 4, token màu/font khai báo trong `@theme` ở `app/globals.css` (lấy từ Figma), font Montserrat qua `next/font`. Dùng token, không hard-code mã màu.

## Admin utility (`shared/admin`)

CSV serializer (BOM + chặn formula injection), lọc theo khoảng ngày, helper múi giờ `Asia/Ho_Chi_Minh` (`ADMIN_TIMEZONE`), giới hạn export (`EXPORT_MAX_ROWS`). Dùng lại, không viết bản riêng cho từng feature.

## Test

| Lớp | Lệnh | Ghi chú |
|-----|------|---------|
| Unit | `npm run test:unit` | `tests/unit/**`, Node thuần |
| Integration | `npm run test:integration` | `tests/integration/**`, cần Supabase local, chạy tuần tự |
| E2E | `npm run test:e2e` | Playwright, `tests/e2e/`, chạy trên `next dev`; cục bộ tối đa 3 worker (`playwright.config.ts`), vì chung một `next dev` biên dịch route theo yêu cầu |
| Status production | `npm run build` rồi `npm run test:prod` | `tests/prod/production-admin-403-status.ts`: bật `next start` ở cổng trống, kiểm status HTTP thật. Cần Supabase local |

`test:prod` dành cho thứ chỉ lộ ở bản production, như status 403 của `/admin/*`: e2e chạy trên `next dev` nên không thấy được.

Test tạo user phải gọi `assertLocalSupabaseUrl(url)` (`tests/setup/assert-local-supabase-url.ts`) trước khi tạo, để không tạo tài khoản trên Supabase thật. Helper sẵn có: `tests/setup/local-sunner-accounts.ts`.

Test ở lớp thấp nhất còn bắt được lỗi thật. Test `server-only` chạy được nhờ alias sang `tests/setup/server-only-stub.ts`.
