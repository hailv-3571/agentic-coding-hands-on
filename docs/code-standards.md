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

Hiện có: `shared/{admin,config,db,events,i18n}`, `db/`, `messages/`, `tests/`. `features/`, `shared/auth`, `shared/ui` do các phase sau tạo.

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

- Mỗi migration tạo bảng phải bật RLS cho bảng đó trong cùng migration, không tạo policy cho `anon`/`authenticated`. `0002_rls_baseline.sql` đã REVOKE quyền của hai role này, kể cả bảng tạo sau. Test `tests/integration/foundation/rls-baseline.test.ts` kiểm tra điều này.
- Schema barrel `shared/db/schema/index.ts`: mỗi feature thêm đúng một dòng `export *`, không sửa dòng khác.
- Cần SQL viết tay (trigger, `EXCLUDE`, policy) thì đặt trong `db/migrations/`. Sinh migration: `npm run db:generate`.
- Seed nằm ở `db/seeds/`, chạy bằng `npm run db:seed`.

## Domain event outbox

`DomainEventOutbox.add(tx, type, payload)` (`shared/events/domain-event-outbox.ts`) chỉ gọi bên trong transaction nghiệp vụ của caller. Hàm không tự mở transaction, nên event chỉ tồn tại nếu thay đổi nghiệp vụ commit. Payload được kiểm bằng Zod theo `domain-event-types.ts`; sai thì ném lỗi và rollback.

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
| E2E | `npm run test:e2e` | Playwright, `tests/e2e/` |

Test ở lớp thấp nhất còn bắt được lỗi thật. Test `server-only` chạy được nhờ alias sang `tests/setup/server-only-stub.ts`.
