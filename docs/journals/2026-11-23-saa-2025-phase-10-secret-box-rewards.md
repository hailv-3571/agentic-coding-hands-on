# Phase 10 Secret Box: đọc pool trong lúc giữ advisory lock làm cạn 10 kết nối, và migration cron có thể chặn mọi migration sau nó

**Date**: 2026-11-23 00:00 (ngày theo tên file; commit code `23f476c` lúc 2026-11-22 22:23 +0700)
**Severity**: high
**Component**: SAA 2025 Kudos Platform, F010 Secret Box rewards (`features/secret-box-rewards/`, `db/migrations/0015*`, `0016*`, `app/api/internal/secret-box/tick`, `shared/auth/public-paths.ts`)
**Status**: ongoing

## What Happened

F010 biến heart thành box, mở box có idempotency key, kho quà trừ atomic, mystery gift khi đủ 6 icon, và job Kudos Quốc Dân. Viết file contract trước, backend và UI chạy song song. Code vào `23f476c`, docs vào `a12faa0`, chưa push.

Reviewer không có critical hay high, nhưng có hai medium: migration cron không portable, và `senderId` thật nằm trong event của Kudo ẩn danh. Vòng sửa thêm cờ `duplicate`, guard cho `0016`, khoá chống tick chồng, giới hạn 500 người mỗi tick, và vá bốn lỗ hổng test.

## The Brutal Truth

Lỗi đầu tiên là lỗi thiết kế, không phải lỗi cú pháp. Grant đọc tổng heart qua pool **bên trong** transaction đã giữ advisory lock của user. Test 20 request đua nhau vẫn qua, nhưng pool chỉ có 10 kết nối: các request giữ lock rồi xin thêm kết nối để đọc, các request còn lại đứng chờ lock và giữ kết nối. Không ai đi tiếp được. Đó là deadlock trên thực tế.

Lỗi thứ hai khó chịu hơn: `0016` gọi `CREATE EXTENSION pg_cron` mà không kiểm tra. Suite integration chạy trên local Supabase có sẵn pg_cron nên không test nào đỏ. Trên Postgres thường, migration sẽ abort và chặn mọi migration về sau. Reviewer bắt được, không phải test.

Lỗi thứ ba: DEC-002 yêu cầu caption "Bạn đã có icon này rồi", nhưng `OpenSecretBoxResult` không có field nào để báo. Backend và UI đều ghi concern rồi dừng, vì mỗi bên giữ đúng ownership. Không ai sửa contract cho tới vòng review.

## Technical Details

- Pool: 10 kết nối. Tổng heart được đọc sau khi đã giữ lock: request thứ 20 chờ trong khi 10 kết nối bị chiếm.
- Tick lock: `pg_try_advisory_xact_lock(hashtext('secret_box_tick'))`, scope transaction, không dùng session lock vì pooler của Supabase.
- Replay: `duplicate` suy ra từ `user_icons.first_obtained_at <> secret_boxes.opened_at`. Dùng `<>` chứ không `<`, vì transaction BEGIN trước có thể lấy lock sau và `now()` của nó sớm hơn.
- RED tiêu biểu: `expected '' to be 'Bạn đã có icon này rồi'`; `expected length 1 but got 4`; `the script has no guard check`.
- Tick probe: `HTTP 503 {"code":"not_configured"}`.
- Gate cuối (do implementer chạy, không phải tester): unit 709, integration 406, e2e 113 pass / 5 skip, build 0.

## What We Tried

1. Đọc tổng qua pool trong lock: treo ở 20 request. Bỏ. Đọc tổng trước transaction, tính dải seq dưới lock từ `max(seq)`. Không over-grant vì dải được tính lại dưới lock, và `UNIQUE` là lớp chặn thứ hai.
2. Session advisory lock cho tick: bị loại vì pooler transaction và rủi ro lock rò khi process chết giữa tick.
3. Cron bằng pg_cron + pg_net + Vault, spike trên local Supabase (PG 17.11). Portability sửa sau review bằng khối `DO` kiểm tra extension.
4. Cờ `duplicate` derive từ timestamp, không thêm cột. Bản đầu dùng `<`, parallel test bắt được.

## Root Cause Analysis

- Lỗi thiết kế: chưa đặt câu hỏi "đọc ở đâu so với lock, và pool có bao nhiêu kết nối".
- Môi trường test quá giống production: local Supabase có sẵn extension nên lỗi portability không lộ ra.
- Contract thiếu field: contract được viết trước nhưng chưa đối chiếu từng caption trong spec với field tương ứng.
- Verification chưa đủ: agent không được sửa `.env.local`, nên `INTERNAL_JOB_SECRET` không có mặt và đường cron → endpoint chưa bao giờ chạy thật. Tester chỉ đến được 503.

## Lessons Learned

- Trong transaction có advisory lock, đọc qua pool trước khi lock. Khi thiết kế, ghi số kết nối pool và số request đồng thời lớn nhất vào doc.
- Migration đụng extension phải có guard và được thử trên DB thiếu extension đó.
- Hai agent cùng báo một concern là dấu hiệu lỗi contract. Sửa contract, đừng để mỗi bên ghi một concern.
- Tester chạy gate trước vòng sửa, gate cuối do implementer báo. Lần sau tester chạy lại trên code cuối.

## Next Steps

- User: đặt `INTERNAL_JOB_SECRET` trong môi trường test, POST một lần với header đúng và một lần sai, xác nhận pg_net tới endpoint. Làm trước khi mở sự kiện.
- User/BTC: tên quà bí ẩn, trọng số, tồn kho (còn là giá trị tạm).
- Phase 13: không đưa `senderId` từ `NationalKudosFinalized` vào thông báo, feed hay API cho người khác.
- Backlog: index `kudo_hearts(created_at)` nếu sweep chậm; chốt cascade `national_kudos` khi xoá kudo; re-seed khi `stock_total` nhỏ hơn số đã phát.
- Main agent: `/tkm:rebuild-spec --features F010`. Spec kỹ thuật còn ghi `SECRET_BOX_LOCK_AT`.
