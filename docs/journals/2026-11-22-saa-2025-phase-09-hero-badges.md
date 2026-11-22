# Phase 09 Hero badges: EXPLAIN lúc đạt lúc không, và tooltip đóng ngay khi bấm vào chính nó

**Date**: 2026-11-22 20:34
**Severity**: medium
**Component**: SAA 2025 Kudos Platform, F009 Hero badges (`features/hero-badges/`, `features/kudos-feed/server/enrich-hero-tier.ts`, `kudo-card-hero-badge-slot.tsx`, migration `0014_kudos_hero_tier_index`)
**Status**: resolved

## What Happened

Hero tier là số người gửi khác nhau trên Kudo public, ngưỡng 1 / 5 / 10 / 21. Người gửi ẩn danh vẫn được đếm. Kudo spam và Kudo tự gửi thì không. Tier tính lúc đọc, một câu batch cho mỗi trang. Commit `41a447e` (code, migration, test) và `2e47594` (docs). Chưa push.

Reviewer không có critical hay high, nhưng tooltip có lỗi người dùng thấy ngay, và ba e2e đã viết vẫn xanh. Sau vòng sửa, cả bảy gate chạy lại trên code cuối. Điều kiện ký trước của user cho phase 09–14 đòi đúng việc này: xanh trên code cuối, review 0 critical, cổng chỉ chờ chữ ký. Đủ cả ba nên commit vào main.

## The Brutal Truth

Điều khó chịu nhất là bộ test tooltip vẫn xanh khi tooltip đã hỏng. Ba ca e2e chỉ hover, focus và tap ra ngoài. Không ca nào bấm vào chữ trong panel. Người dùng bấm vào nội dung tooltip thì tooltip biến mất. Reviewer thấy điều này trong code. Test thì không.

Phần tốn công là EXPLAIN. Tôi tưởng index đã chứng minh xong. Đo trong transaction rồi rollback thì 1/3 lần planner chọn Seq Scan. Mất một vòng mới hiểu đó là lỗi của phép đo chứ không phải của index.

## Technical Details

- EXPLAIN, ngân sách dưới 20 ms, đo trên bản copy đã `VACUUM ANALYZE`: `Index Only Scan using kudos_public_recipient_sender_idx`, `Heap Fetches: 0`, 0.111 / 0.173 / 0.125 ms. Trong rollback transaction ở 10k dòng chưa vacuum: lúc `Seq Scan`, lúc `Bitmap Index Scan`.
- Tooltip (reviewer L1) có hai nguyên nhân cho một triệu chứng. `pointerdown` ở document đóng tooltip khi target không phải trigger. Panel không focus được, nên bấm vào đó làm badge mất focus và `onBlur` đóng tiếp.
- RED: `hero-badge-tooltip.spec.ts` dòng 55 và 106, `element not found` sau khi bấm vào tooltip. Mutation tắt guard `onBlur` làm ca tap 375 px đỏ lại.
- Gate cuối: tsc 0, lint 0, unit 663/663, integration 341/341, e2e 100 pass / 5 skip (prelaunch), build 0, `test:prod` 16/0.

## What We Tried

1. EXPLAIN trong transaction rollback: flaky. Bỏ.
2. Bản copy tạm `LIKE public.kudos INCLUDING ALL`, vacuum rồi đo: ổn định, giữ lại. Bảng thật không bị đụng.
3. Sửa `pointerdown` trước: vẫn mất khi tap, vì blur vẫn xảy ra. Thêm `pressedInPanel` để `onBlur` bỏ qua một lần. Sửa cả hai.
4. Esc chuyển sang capture phase để `stopPropagation` có tác dụng. Chưa có test, vì chưa có host nào là dialog. Đây là chỗ chưa được chứng minh.

## Root Cause Analysis

- Test bám theo các hành động đã nghĩ trước (hover, focus, tap ra ngoài), không theo chỗ người dùng thật sự bấm. Không có ca "bấm vào trong panel".
- EXPLAIN đo sai môi trường. Dòng vừa insert trong transaction chưa vacuum, nên visibility map và stats không phản ánh thực tế. Index đúng, phép đo sai.
- Hai nguyên nhân cùng một triệu chứng nên sửa một chỗ là chưa đủ. Mutation test là thứ bắt được điều này.

## Lessons Learned

- Mỗi overlay cần ca "bấm vào nội dung bên trong" ngay từ đầu, không chỉ hover và tap ra ngoài.
- Đo EXPLAIN trên bản copy đã vacuum. Đừng đo trong transaction rollback.
- Partial index `WHERE status = 'public'` dựa vào `prepare: false` của pool. Nếu sau này chuyển sang prepared statement có tên, planner có thể rơi về index feed người nhận. Kết quả vẫn đúng nhưng chậm hơn. Khi đổi pool, chạy lại EXPLAIN test trước.
- Sửa file ngoài ownership (`kudo-card-sender.tsx`, trang Thể lệ, schema, messages, hai test phase 05) là hệ quả cần thiết, đã ghi vào decision log. Lần sau hỏi trước khi chạm file phase khác.

## Next Steps

- User: quyết định chữ "bạn" trên huy hiệu người khác (orchestrator mặc định, đang giữ theo Figma).
- User: chốt copy en (D006) và dấu "–" trong khoảng số trên Thể lệ. Đổi dấu là đổi copy, phải tách lại nếu muốn giữ gạch nối.
- Main agent: `/tkm:rebuild-spec --features F009`. Spec kỹ thuật còn ghi A1 "(planned)" và "Zod kiểm uuid", code không dùng Zod.
- Phase 13: C-04 ghi đếm theo vị trí `(created_at, id)`, code đếm trạng thái hiện tại trong transaction. Xác nhận cách này đủ cho tier-up.
- Trước giờ mở: index thường khóa ghi `kudos` lúc build, đã chấp nhận. Nếu có dữ liệu thật trước đó, đổi sang `CONCURRENTLY` ngoài transaction.
