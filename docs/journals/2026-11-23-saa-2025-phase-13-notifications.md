# Phase 13 Notifications: retry bỏ cuộc sau 25 giây, FK cascade đe doạ lịch sử thông báo

**Date**: 2026-11-23 02:46 (commit `b5520ce` lúc 02:46:00 +0700, docs `94aaff6` lúc 02:46:10)
**Severity**: medium
**Component**: SAA 2025 Kudos Platform, F013 Notifications (`features/notifications/`, `shared/db/schema/notifications.ts`, `db/migrations/0018`–`0021`, `app/api/internal/notifications/drain`)
**Status**: ongoing

## What Happened

F013 đưa vào bảng `notifications`, outbox processor, drain chạy bằng pg_cron, chuông và panel trên header, trang `/notifications`. Backend và UI làm song song theo contract do orchestrator viết. Reviewer không có critical hay high, nhưng có hai medium, và cả hai được sửa trước khi commit. Commit bị chặn bởi `.git/index.lock` còn sót từ 01:45; sau khi xác nhận không có tiến trình git nào đang chạy, lock được xoá rồi mới commit.

## The Brutal Truth

Medium 1 là lỗi thiết kế, không phải lỗi gõ. Acceptance criterion của tester ghi "set failed_at at the max", nên test xanh đúng với hành vi sai: event bị park sau 5 nhịp cron 5 giây, tức khoảng 25 giây. Một đợt lock timeout ngắn là mất thông báo vĩnh viễn, và đường replay duy nhất là SQL tay.

Medium 2 khó chịu hơn vì nó nằm sẵn từ migration 0018. `ON DELETE CASCADE` nghĩa là ai dọn outbox sau này sẽ xoá luôn lịch sử thông báo của người dùng, kể cả trạng thái đã đọc. Hiện chưa có job dọn nào nên lỗi chỉ là tiềm ẩn.

Đường thật pg_cron → pg_net → drain chưa được chạy ở local vì không có Vault. Mọi e2e drain trực tiếp qua `NotificationEventProcessor.drain()`. Suite xanh không có nghĩa là cron đã chạy.

## Technical Details

- RED M1 (chạy trên code cũ): `expected { consumed: false, attempts: 5, … } to deeply equal { consumed: false, attempts: 1, … }`. Các tick sau retry ngay lập tức.
- RED M2: `expected [] to deeply equal [ { type: "secret_box_granted", params: { count: 3 }, event_id: null } ]`. Thông báo bị cascade xoá cùng outbox row.
- Fix M1: cột `domain_event_outbox.next_attempt_at`, `make_interval(secs => 60 * 2^attempts_before)` cho 1/2/4/8 phút, tổng khoảng 15 phút. `OUTBOX_RETRY_BASE_DELAY_SECONDS = 60`, `OUTBOX_MAX_ATTEMPTS = 5` giữ nguyên.
- Fix M2: `notifications.event_id` nullable, `ON DELETE SET NULL`, qua `0021_notifications_retry_backoff_and_event_fk.sql` (kèm `.down.sql`).
- Replay tay:
  ```sql
  update public.domain_event_outbox
  set failed_at = null, attempts = 0, next_attempt_at = null
  where consumed_at is null and failed_at is not null;
  ```
- Gate e2e: run 1 `spotlight-board.spec.ts:29` `Expected 0, Received 4`; run 2 `edit-kudo.spec.ts:14` toast "Đã lưu thay đổi." không hiện trong 5 s với 3 worker; run 3 sạch, 132 passed, 5 skipped.
- Gate cuối: tsc 0, lint 0, unit 878, integration 521, `test:prod` pass.
- Probe `POST /api/internal/notifications/drain` không header trả 503 `not_configured`. Chỉ chứng minh route có guard, không chứng minh cron chạy.

## What We Tried

1. Giữ retry theo nhịp cron, max 5. Bị loại: event mất sau khoảng 25 giây.
2. Tăng max lên 20. Vẫn đếm theo tick, không có khoảng cách thời gian nên bị loại.
3. Backoff bằng `next_attempt_at`. Được chọn. Outbox không có mốc lần thử cuối, nên cần thêm cột. Một predicate `PENDING_AND_DUE` dùng ở ba chỗ: scan ứng viên, re-read `FOR UPDATE SKIP LOCKED`, và `recordFailure`.
4. FK RESTRICT. Bị loại vì chặn việc dọn outbox trừ khi xoá lịch sử trước. SET NULL được chọn: UNIQUE(event_id, recipient_id, type) chỉ cần chặn cùng một event xử lý hai lần, mà event đã bị xoá thì không bao giờ drain lại.
5. Hai flake e2e (spotlight counter do hard delete song song, edit-kudo toast chậm) chưa sửa trong phase này. Chỉ ghi nhận và chạy lại.

## Root Cause Analysis

- M1: ngân sách retry đếm bằng số lần cron chạy, không đếm bằng thời gian. Outbox không có last-attempt timestamp, nên schema không diễn đạt được backoff ngay từ đầu.
- M2: cascade được chọn theo mặc định ở 0018, không ai hỏi outbox và lịch sử có vòng đời khác nhau. Outbox là hàng đợi tạm, notifications là lịch sử, vậy mà đang bị buộc chặt bằng FK.
- Phần cron không được test: helper e2e bỏ qua đường thật. Tester đã ghi đây là gap số một, nhưng không chặn commit.

## Lessons Learned

- Ngân sách retry phải tính theo thời gian. Với cron 5 giây, `max_attempts = 5` nghĩa là bỏ cuộc sau vài chục giây.
- Acceptance criterion cho retry phải có ngưỡng thời gian, không chỉ "đạt max thì park".
- Bảng tạm không được cascade xuống bảng lịch sử. Mặc định SET NULL khi lịch sử cần sống lâu hơn nguồn.
- Drain trực tiếp trong e2e không phải kiểm thử cron. Cần một bước smoke trên môi trường có Vault.
- Flake không liên quan vẫn phải ghi tên spec và số lần chạy, không gọi là "xanh".

## Next Steps

- Kiểm chứng pg_cron → drain trên staging có Vault. Người làm: user/ops. Chưa có hạn.
- Lên lịch dọn outbox đã consumed và xử lý `cron.job_run_details` (khoảng 17k dòng/ngày ở nhịp 5 giây). Người làm: caller, trước production. Chưa có hạn.
- Docs: `technical-spec.md` F013 (backoff, SQL replay, SET NULL); `docs/system/architecture.md:381` thêm `next_attempt_at`; `:454` còn đường dẫn `spotlight-browser-supabase.ts` đã xoá; code-standards ghi `OUTBOX_DRAIN_SECRET`. Người làm: doc-writer.
- Sửa hai flake e2e. Người làm: implementer.
- Lows còn mở: `actor_id` vẫn giữ người gửi thật sau khi chuyển sang ẩn danh, bản en chưa test, copy Kudos Quốc Dân chờ BTC.

**Sign-off**: phase 13 được commit theo chữ ký có điều kiện user đã đưa ngày 2026-11-22. Ba điều kiện (kiểm thử xanh trên code cuối, review 0 critical, cổng chỉ chờ chữ ký) được xác nhận là đủ. Đây không phải user ký mới hôm nay. `humanSignedOff` trong verdict được bật sau khi xác nhận đủ ba điều kiện, rồi cổng evidence mới SEALED.
