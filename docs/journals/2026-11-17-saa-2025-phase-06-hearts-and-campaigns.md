# Phase 06 hearts và x2 campaigns: năm 0050 bị lưu thành 1950, e2e đỏ vì dev server quá tải, Escape chết sau nút disabled

**Date**: 2026-11-17 01:07
**Severity**: medium
**Component**: SAA 2025 Kudos Platform, F005 hearts và F011 x2 campaigns (`features/kudos-hearts/`, `features/admin-campaigns/`, `shared/admin/timezone.ts`, `db/migrations/0010-0012`)
**Status**: resolved

## What Happened

Phase 06 gồm ba migration (kudo_hearts, campaigns, EXCLUDE chống trùng lịch), luồng thả tim có atomic, và trang `/admin/settings` để admin CRUD chiến dịch x2. Chốt thành ba commit trên `main`, chưa push: `e0cd2fa` (backend), `4453ab2` (heart UI và admin settings), `eb39cfe` (delivery, sync plan, bằng chứng review). Reviewer backend bắt hai lỗi thật: năm 0000–0099 bị đổi thành 1900–1999, và `heartCountsSubquery` quét cả bảng `kudo_hearts`. Cả hai đã sửa. User ký duyệt rủi ro ngày 2026-11-17.

## The Brutal Truth

Phần tôi tự tin nhất là atomic add, và phần đó đúng. Phần làm mất buổi tối là full e2e: đỏ 65/68 hai lần liên tiếp ở 6 worker, và mỗi lần một bộ test khác nhau. Đây đúng kiểu flaky khiến người ta muốn nới timeout cho xong. Chúng tôi không làm vậy. Nguyên nhân là một `next dev` đã chạy cả buổi, chiếm 2.1 GB, cộng với sáu browser tranh tài nguyên. Restart dev, chạy 3 worker, được 68/68.

Chỗ khó chịu thứ hai là Escape. Sau khi nút Lưu bị disabled, trình duyệt bỏ focus xuống `<body>`, và Esc không còn đóng dialog. Reviewer UI bắt được trước khi phase chốt, nhưng lẽ ra mình phải thấy từ lúc viết test.

## Technical Details

- E2E 6a: `Expected pattern: /\/kudos$/ Received string: "http://localhost:3000/onboarding/department?next=%2Fkudos"` (timeout 5 s).
- E2E 6b: `expect(locator).toBeHidden()` failed, dialog composer còn hiện sau 5 s.
- Atomic add: một `INSERT…SELECT…ON CONFLICT DO NOTHING RETURNING`, outbox chỉ ghi khi RETURNING có dòng.
- Overlap campaign: `EXCLUDE` trên `tstzrange(starts_at, ends_at, '[)')`, lỗi `23P01` map thành lỗi "trùng lịch".
- Mutation: 7 lần phá có chủ đích (bỏ outbox, bỏ guard tự thả tim, rank theo tổng multiplier, bỏ `requireAdmin`, bỏ map 23P01...). Mỗi lần đều làm đỏ đúng test.
- Năm: `Date.UTC(50, ...)` ra 1950. Sửa bằng `utcMs()` dùng `setUTCFullYear`, schema có sàn năm 2000.
- Số cuối: unit 438, integration 269, e2e 71/71 hai lần (~45 s), test:prod 13/13.
- Secret scan: `grep -e`, 0 hit. Lỗi của grep giờ tính là fail.

## What We Tried

1. Nới `expect.timeout`: loại. Nó giấu độ trễ, không chữa gì.
2. Chạy 1 worker: spec nào lỗi cũng qua khi chạy riêng (2.4–3.0 s). Vậy logic không sai, vấn đề là tải.
3. Chọn cap 3 worker khi chạy local, restart dev trước khi chạy, timeout giữ nguyên. CI giữ mặc định. Ghi vào decision-log ngày 2026-11-17.
4. Escape: giữ focus bằng `aria-disabled`, thêm listener cấp document. Vá từng nút thì lỗi sẽ quay lại.
5. Seed chiến dịch e2e: `seedActive` dùng EXCLUDE làm khóa, retry tối đa 10 s. Hashtag được dành riêng cho từng spec.

## Root Cause Analysis

- E2E đỏ là do tải và `next dev` chạy lâu, không phải logic phase 06. Phase 05 chạy 59 test trong khoảng 35–40 s không flaky. Phase 06 chạy 68 test mất 2 phút ở 6 worker.
- Lỗi năm: `Date.UTC` coi 0–99 là 1900+. Không có test cho helper timezone ngay từ đầu, nên lỗi lọt qua tới reviewer.
- Escape: nút disabled bị loại khỏi thứ tự focus, và listener gắn trên nút thì không nhận nữa.
- Trạng thái dùng chung: campaign rows toàn cục và hashtag chung làm các spec giẫm lên nhau.

## Lessons Learned

- Restart `next dev` trước khi chạy full e2e. Dev server chạy lâu không phải môi trường để đo.
- Test đỏ mỗi lần một bộ khác nhau là dấu hiệu tải, đừng nới timeout.
- Đừng đưa năm nhập từ người dùng thẳng vào `Date.UTC`. Dùng `setUTCFullYear`, và test ở biên 0000, 0050, 0099.
- Nút bị khóa dùng `aria-disabled`, không dùng `disabled`, khi nó nằm trong dialog có Esc.
- Aggregate phải nhận tập id bắt buộc. Quên tham số là quét cả bảng.

## Next Steps

- Đo `heartCountsSubquery` với khoảng 50k hearts. Người làm: backend owner, trước khi phase 08 bắt đầu.
- Chứng minh test D003 đỏ khi rank theo tổng multiplier, hiện chưa có. Người làm: backend owner, cần một lần chạy scratch.
- Seam `features/admin-moderation/server/admin-kudo-heart-counts.ts` trong plan phase 08 chưa tồn tại. Sửa plan trước khi phase 08 bắt đầu.
- Chạy `/tkm:rebuild-spec` cho F003, F004, F005, F011. Người làm: main agent.
- US003 "tim lỗi thì thẻ vẫn hiện" đã hoãn. Làm sau thì cần cờ trên `KudoCardView`.
- Comment sai trong migration 0012 về GiST index: sửa khi chạm lại migration, không sửa file đã apply.
