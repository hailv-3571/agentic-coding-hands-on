# Phase 14 Admin users và overview: race đổi role và planner đẩy truy vấn lên 15,7 giây

**Date**: 2026-11-23 08:39 (commit `4420931` lúc 08:38:45 +0700, docs `8f2795d` lúc 08:39:07)
**Severity**: medium
**Component**: SAA 2025 Kudos Platform, F014 Admin users và F015 Admin overview (`features/admin-users/`, `features/admin-overview/`, `shared/admin/`, `db/migrations/0022_profiles_role_audit.sql`, `app/api/admin/{users,overview}/export`)
**Status**: ongoing

## What Happened

Phase 14, phase cuối của 14. Thêm trang Admin > User (lọc, sắp xếp, phân trang, đổi role, xuất CSV) và Admin > Overview (thống kê theo đơn vị, khoảng ngày, xuất CSV). Backend và UI làm song song theo contract của orchestrator. Reviewer không có critical hay high, chỉ một Medium về chỗ đặt helper và đã sửa trước khi commit. Commit vào main, không push. Sign-off dùng chữ ký có điều kiện user đưa ngày 2026-11-22, sau khi ba điều kiện được xác nhận.

## The Brutal Truth

Phần đau nhất là race đổi role. Hai admin hạ nhau cùng lúc có thể đưa hệ thống về zero admin, và lock thôi chưa đủ. Phải khoá theo thứ tự id, đọc lại sau khi chờ lock, rồi kiểm tra actor còn trong tập đã khoá. Nếu không có concurrency test thì mình không dám nói là đúng.

Lỗi do mình là planner. Câu tìm kiếm có level filter chạy 15,7 giây vì ước lượng sai. Sửa bằng `SET LOCAL enable_nestloop = off` trong transaction là cách hack, nhưng là cách nhỏ nhất đang có. Người sau phải hiểu nó trước khi đụng vào.

Một chỗ còn vướng: tiêu chí ghi 403/409 cho các ca tự hạ, ENV_ADMIN, LAST_ADMIN. Code trả mã lỗi trong kết quả server action. Mình chọn theo C-18 và ghi vào decision-log là mặc định của orchestrator, chưa có user xem. Đây không phải chỗ được "ký ngầm".

## Technical Details

- Thứ tự guard trong `user-role-service.ts`: `SELECT ... WHERE role='admin' ORDER BY id FOR UPDATE` → NOT_FOUND → no-op nếu role đã đúng (BR-001) → SELF_DEMOTE → ENV_ADMIN → LAST_ADMIN → actor có trong tập đã khoá (FORBIDDEN) → UPDATE có điều kiện.
- Mutation check-then-act: `expected [ok, ok] to have a length of 1 but got 2` (zero admin).
- Planner, `users search + level rising`: 15.698 ms trước guard, 48 ms sau. Worst 237 ms. Test budget 500 ms: `tests/integration/admin-users/admin-report-query-plan.test.ts`.
- `departments.id` là uuid. Contract ghi `number`. Backend đổi sang `string` trước khi UI merge.
- Gates cuối: tsc 0, lint 0, unit 943, integration 598, e2e 141 passed / 5 skipped, prelaunch 5 passed / 1 skipped, build 0, test:prod 16/16.

## What We Tried

1. Đếm admin rồi mới khoá. Bị loại: mutation cho ra zero admin.
2. Khoá không theo thứ tự. Bị loại vì có nguy cơ deadlock. Chốt `ORDER BY id FOR UPDATE`.
3. Sửa planner bằng `MATERIALIZED` CTE hoặc `OFFSET 0`. Bị loại: Drizzle không sinh được. Copy fragment từ phase 09 cũng bị loại vì không được đụng code upstream. `SET LOCAL` trong một transaction được chọn.
4. Tiêu chí 403/409. Giữ mã in-band, chờ user xem lại. Trang và route xuất file vẫn trả HTTP 403 cho người không phải admin.
5. Reviewer ghi disposition "Fixed". Evidence gate chỉ nhận Accept, Reject, Defer, nên đổi thành Accept.

## Root Cause Analysis

- Race: lỗi nằm ở việc đếm admin trước khi khoá. Khoá mà không đọc lại sau khi chờ thì vẫn sai.
- Planner: `f_unaccent(...) ILIKE` ước lượng 1 dòng, thực tế 1.111. Planner nested loop trên aggregate, và `count(DISTINCT sender_id)` bị tính lại theo từng dòng. Seed ban đầu còn sai (hearts đặt sau `asOf`), nên số 182 ms là số thấp hơn thực.
- Contract: viết kiểu id mà không đối chiếu với schema phase 01.

## Lessons Learned

- Planner ước lượng sai với biểu thức ILIKE trên hàm. Đo trên dữ liệu đủ lớn trước khi commit. Seed 5.000 profile và 100.000 kudos mới lộ lỗi.
- Khi viết contract, đối chiếu kiểu id với schema thật.
- Race test phải có mutation check, bỏ khoá rồi xem test có đỏ đúng lý do không.
- Budget 500 ms có thể flake trên CI chậm. Chưa đo lặp lại.
- Tester G3 ghi thiếu empty state, nhưng test filter đã assert copy đó. Đọc lại spec trước khi viết test mới.
- `user-role-concurrency.test.ts` hạ mọi admin khác trong DB dùng chung. Không chạy cạnh Playwright, không trỏ vào staging.

## Next Steps

- User xem lại D1 (mã in-band hay 403/409) và các mặc định orchestrator trong decision-log. Người làm: user.
- BTC: copy tiếng Anh (đang là bản draft), 409 ENV_ADMIN, CSV header tiếng Anh. Người làm: user, qua BTC.
- Gộp `adminKudoExportFilename` (phase 08, `features/admin-moderation/server/admin-kudo-export.ts:53`) vào `adminCsvFilename`. Người làm: implementer, khi chạm file này.
- Hearts aggregation tăng tuyến tính theo số kudo. Theo dõi khi dữ liệu lớn lên. Người làm: caller.
- Oracle của actor bị hạ giữa chừng, `test:prod` chưa phủ `/admin/users` và các route xuất file, coverage chưa đo. Người làm: caller, doc-writer.

**Sign-off**: phase 14 được commit theo chữ ký có điều kiện user đưa ngày 2026-11-22. Ba điều kiện (kiểm thử xanh trên code cuối, review 0 critical, cổng chỉ chờ chữ ký) đã được xác nhận. Đây không phải user ký mới hôm nay. `humanSignedOff` trong verdict được bật sau khi xác nhận đủ ba điều kiện.
