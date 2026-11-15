# SAA 2025 — Kudos Platform

Web nội bộ Sun* Annual Awards 2025 ("ROOT FURTHER"): cổng giải thưởng, Sun* Kudos (ghi nhận, tim, Hero, Secret Box) và trang Admin.
Stack: Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase · Drizzle · next-intl · Zod · Vitest · Playwright.

## Yêu cầu

- Node 24 và npm
- Docker (Supabase local chạy bằng container)

## Chạy local

```bash
npm install
npx supabase start                # bật Postgres, Auth, Storage... trong Docker
npx supabase status -o env        # in DB_URL, API_URL, ANON_KEY, SERVICE_ROLE_KEY
cp .env.example .env.local        # rồi điền giá trị từ lệnh trên
npm run db:reset                  # supabase db reset + migrate + seed
npm run dev                       # http://localhost:3000
```

Ánh xạ biến: `DATABASE_URL` ← DB_URL, `NEXT_PUBLIC_SUPABASE_URL` ← API_URL, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← ANON_KEY, `SUPABASE_SERVICE_ROLE_KEY` ← SERVICE_ROLE_KEY. Các biến còn lại (mốc sự kiện, `ADMIN_EMAILS`...) xem chú thích trong `.env.example`.
Thiếu hoặc sai biến thì app từ chối khởi động và in danh sách lỗi. Không commit file `.env.local`.

## Lệnh thường dùng

| Lệnh | Việc |
|------|------|
| `npm run typecheck` | Sinh route type của Next rồi chạy `tsc --noEmit` (không cần secret) |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest, không cần DB |
| `npm run test:integration` | Vitest, cần Supabase local đang chạy và đã điền env |
| `npm run test:e2e` | Playwright (tự bật `npm run dev`, hoặc đặt `PLAYWRIGHT_BASE_URL`) |
| `npm run db:generate` / `db:migrate` / `db:seed` / `db:reset` | Drizzle migration và seed |

## Tài liệu

- [docs/code-standards.md](docs/code-standards.md) — quy ước code
- [docs/system/architecture.md](docs/system/architecture.md) — kiến trúc hệ thống
- [docs/development-roadmap.md](docs/development-roadmap.md) — 14 phase và tiến độ
- [docs/project-changelog.md](docs/project-changelog.md) — nhật ký thay đổi
- Kế hoạch và quyết định nghiệp vụ: `plans/261108-0048-saa-2025-kudos-platform/`

Next.js bản này có thay đổi phá vỡ: đọc `node_modules/next/dist/docs/` trước khi viết code liên quan (xem `AGENTS.md`).
