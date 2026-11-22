# Phase 11 Spotlight Board: policy Realtime để lộ topic khác, bảng đếm lệch sau kiểm duyệt, và e2e tranh nhau vì xoá cứng

**Date**: 2026-11-23 00:00 (ngày theo tên file; commit code `3132e73` lúc 2026-11-22 23:47 +0700)
**Severity**: medium
**Component**: SAA 2025 Kudos Platform, F008 Spotlight Board (`features/spotlight-board/`, `db/migrations/0017*`, `app/api/spotlight/route.ts`, `docs/system/architecture.md` Deployment View)
**Status**: ongoing

## What Happened

Live board `/kudos` có thêm bảng Spotlight: đếm Kudo, đám mây tên, ticker 5 dòng, cập nhật realtime qua Supabase Broadcast riêng tư. Trigger trên `kudos` phát `added`/`removed`/`restored`, RLS trên `realtime.messages` chỉ cho `authenticated` đọc topic `spotlight`. Code vào `3132e73`, docs vào `184b579`, chưa push.

Backend và UI làm song song. Reviewer không có critical hay high, nhưng có ba medium: bảng đếm lệch khi event đến sau snapshot, snapshot chưa cache, và checklist triển khai chỉ nằm trong comment SQL. Hai cái đầu sửa trước khi commit.

## The Brutal Truth

Lỗi nặng nhất suýt lọt là lỗi policy. Policy ban đầu chỉ kiểm `realtime.topic() = 'spotlight'`. Test của chính agent backend bắt được: role `authenticated` tự set `realtime.topic` rồi đọc được **mọi topic khác**, vì các policy permissive được OR với nhau. Phase 13 sẽ có `notifications:*`, nên đây là lỗ thật. Test đỏ mới bắt được, đọc code thì không.

Lỗi thứ hai là lỗi tự tin sai. Vòng UI, e2e xanh 15/15 với `--repeat-each=3 --workers=2`. Vòng sửa, cùng lệnh, có 1 lần chạy ra tổng hai trình duyệt lệch DB + 4. Nguyên nhân: teardown của test khác xoá cứng bốn kudo, mà `DELETE` không phát event, nên bảng không biết dữ liệu đã đổi.

Lỗi thứ ba lộ ra đúng lúc sửa lỗi drift. Sự kiện `restored` đến qua broadcast, còn snapshot có 5 dòng gần nhất. Nếu REPLACE sau khi Un Spam, dòng ticker của Kudo đó quay lại 2–3 s sau, phá DEC-001.

## Technical Details

- `realtime.send(payload, event, topic, private)` tự thêm key `id` vào payload. Trình duyệt nhận 6 key, schema Zod bỏ `id`.
- Policy sau sửa: `realtime.topic() = 'spotlight' AND topic = 'spotlight' AND extension = 'broadcast'`.
- Fault injection: role `postgres` không CREATE được trên schema `realtime`, nên không thay được `realtime.send`. Thay vào đó chuyển owner hàm trigger cho role tạm trong transaction rollback. `realtime.send` ném `permission denied for schema realtime`, INSERT vẫn commit, 0 message. Đây là proxy, không phải outage thật.
- Tier cỡ tên: `tier = 4 − floor(rank·4/k)`, `k` là số Kudo **khác nhau**. Rank theo vị trí thì đuôi người 1 Kudo nhảy lên tier to nhất.
- Điện thoại: bản đầu 30 tên và chồng lên nhau, RED `expected 30 to be less than 30`. Sửa thành tối đa 24, tên không còn chỗ thì bỏ.
- Mutation check: 9/9 mutation trên unit bị bắt.

## What We Tried

1. Policy chỉ kiểm topic của kết nối: lọt cross-topic. Thêm kiểm topic của chính dòng. Pass.
2. Refetch ngay sau subscribe: reviewer M1 báo drift khi event đến trễ. Đổi sang refetch debounce 2–3 s sau `removed`/`restored`, cộng jitter 0–2 s sau join để các bảng không refetch cùng lúc. Thêm `restoredIds` để REPLACE không làm sống lại dòng ticker.
3. e2e: thêm `resyncNow()` trước mỗi bước, buộc bảng đồng bộ trước khi đo. Pass 5/5 khi chạy riêng. Race vẫn còn, chỉ bị che.

## Root Cause Analysis

- Policy: viết theo thói quen "một topic, một điều kiện" và quên các policy permissive OR với nhau trên `realtime.messages`.
- Drift: thiết kế như snapshot + event nhưng không tính thứ tự đến của event so với snapshot.
- e2e: fixture xoá cứng trong teardown. Sản phẩm không có flow xoá, nên không có event nào để bảng nghe.
- Checklist triển khai chỉ nằm trong comment SQL. Quyết định đúng, nhưng chỗ đó không ai đọc khi deploy.

## Lessons Learned

- Với policy trên `realtime.messages`, test phải thử **topic khác** bằng role đã đăng nhập. Chỉ thử topic đúng là không đủ.
- Event đến sau snapshot là chuyện thường. Chọn refetch debounce vì rẻ hơn đổi contract (`asOf`).
- Hằng số dùng chung cho server component và client component đặt trong module thuần. Đặt trong file `"use client"` thì server nhận client reference, không phải chuỗi.
- Checklist triển khai ghi vào `docs/system/architecture.md` ngay khi viết, đừng để trong comment.

## Next Steps

- User: staging check trên Supabase hosted trước release: join authenticated và event ≤ 5 s, anon bị từ chối, public channel không nhận gì.
- User: tắt "Allow public access" ở mọi environment.
- Caller: chọn một worker cho hai file spotlight, hoặc soft-delete trong fixture chung.
- Implementer phase sau: thêm DOM environment để test nút thử lại. Hiện chưa test được click retry.
- Backlog: TTL cache snapshot khi kudo lên 100k+. Hiện 2.7 ms ở 10k kudo, chưa cần.
- Main agent: `/tkm:rebuild-spec --features F008`. Spec kỹ thuật còn ghi "(planned)" và SM-001 cũ.
