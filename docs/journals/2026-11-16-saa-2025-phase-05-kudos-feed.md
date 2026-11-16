# Phase 05 Kudos feed: 404 mềm trả 200 trên production, dev server sập ở route động, secret scan báo sạch khi lẽ ra phải báo lỗi

**Date**: 2026-11-16 20:46
**Severity**: medium
**Component**: SAA 2025 Kudos Platform, F004 Kudos feed (`features/kudos-feed/`, `app/(app)/kudos/`, `tests/e2e/kudos-feed/`)
**Status**: ongoing

## What Happened

Phase 05 (Live board `/kudos`, trang chi tiết `/kudos/[id]`, read API, index feed) chốt thành ba commit trên `main`, chưa push: `2a4808f` (query đọc, index, API), `6eb9f6a` (Live board và trang chi tiết), `1e38534` (delivery, sync plan, bằng chứng review). Review UI và backend bắt năm lỗi thật: nút bút còn hiện sau `EVENT_END_AT`, dropdown lọc không đi bằng bàn phím, cursor năm `0000` lọt qua, link có userinfo, và thân bài không có trần khi parse. Đã sửa hết. Full run: unit 376, integration 203, e2e 59 (chạy hai lần, không flaky), `test:prod` 13/13. Reviewer chấm SEALED 9/10, không có critical.

Plan lệch Figma ở bốn chỗ, đã ghi vào decision-log: launcher chuyển sang `/kudos`, chi tiết là trang riêng vẽ theo View Kudo, thẻ ẩn danh hiện nickname, trang chi tiết không có nút bút.

## The Brutal Truth

Chỗ đau nhất là chúng tôi đã biết lỗi này. Quyết định ngày 2026-11-15 ghi sẵn rằng Cache Components gửi shell 200 trước khi render. Thế mà e2e của phase 05 chạy trên `next dev` (Playwright reuse server đang chạy), nên assert 404 vẫn xanh. Lên production, trang "không tìm thấy" trả 200. Khi user chọn soft 404, không ai quay lại sửa comment và spec vẫn hứa "404 thật".

Chỗ gai thứ hai là secret scan. Pattern bắt đầu bằng `-----BEGIN`, `grep` đọc nó như một option, và scan báo sạch không một tiếng. Kiểu lỗi này nguy hiểm nhất: bước kiểm tra im lặng đúng lúc phải lên tiếng.

## Technical Details

- Soft 404: `/kudos/[id]` là ◐ (partial prerender). ID không tồn tại, sai dạng, hoặc spam của người khác đều trả cùng một trang với status 200 trên `next start`. Next tự thêm `noindex`.
- Dev crash: `next dev` trên port 3000 báo `Jest worker encountered 2 child process exceptions` ở `/kudos/[id]` và `/api/kudos/[id]/edit`; route tĩnh vẫn chạy. Nghi phạm là `npm run typecheck` (xóa và tạo lại `.next/dev/types`) khi dev đang chạy. Chưa chứng minh.
- Writing closed: `EVENT_END_AT` cố định lúc server khởi động, dev giữ dist-dir lock nên không bật được server thứ hai. Kiểm bằng hai production server (:3100 mở, :3101 đóng), 16/16 pass. Unit truth table cho `kudoCardCanEdit` có 9 case, nhưng chưa có test wiring tự động.
- Ảnh Markdown: nếu `![x](url)` trả về null, scanner autolink URL bên trong và để lại một link. Phải trả nguyên đoạn thành một text node.
- Cảnh báo `\)` của reviewer là báo động giả. Probe dùng chuỗi JS không raw, `"\)"` thành `")"`. Test dùng `String.raw` và pass.
- Secret scan: chạy lại sau commit với `grep -e`, 0 hit.

## What We Tried

1. Giữ 404 thật bằng proxy: phải tra DB cho ID không tồn tại và spam người khác. Chọn soft 404 với nội dung đồng nhất, user quyết ngày 2026-11-16.
2. Ảnh Markdown trả null: bị autolink. Chuyển sang text node.
3. Test writing closed trên e2e: không làm được vì lý do như trên. Chấp nhận kiểm tay trên hai production server.
4. Dev crash: restart dev sau typecheck. Chỉ là cách né, chưa biết nguyên nhân.

## Root Cause Analysis

- Test status chạy trên dev, không phải production. Ta đã biết dưới Cache Components status khác nhau, nhưng test không đổi theo.
- Quyết định đổi mà comment và spec không đổi theo. Chỉ grep lại mới thấy.
- Scan bảo mật không fail-closed. Lỗi trong lúc chạy bị coi như không có kết quả.

## Lessons Learned

- Test status phải chạy trên `next start`. Không dùng `reuseExistingServer` cho bộ test đó.
- Pattern bắt đầu bằng `-` thì dùng `grep -e`. Scan báo lỗi thì phải fail, không được coi là sạch.
- Chạy typecheck trước khi bật dev, đừng chạy song song cho tới khi chứng minh được.
- Test escape dùng `String.raw`, không dùng chuỗi JS thường.
- Biến cố định theo env như `EVENT_END_AT` cần một Playwright project riêng với server khác env. Lên kế hoạch từ đầu, đừng để đến cuối.

## Next Steps

- Viewer-guarded sender filter cho `publicKudoIdsSubquery`, trước phase 10. Người làm: main agent, khi lập plan phase 10.
- Rebuild spec F003, F004, SCR007, SCR008; spec còn ghi "404 thật". Chưa gán người.
- Chụp lại bốn ảnh cũ (`*-04-owner-card-with-pen`, `*-08-writing-closed-*`) trong run có `EVENT_END_AT` kiểm soát. Người làm: tester.
- Thêm script `test:coverage` (Vitest v8). Người làm: main agent.
- Human sign-off: `riskGate.humanSignedOff` còn `false`, gate cứng phase 05 đang BLOCKED. User ký, rồi chạy lại gate trên `evidence/phase-05`.
