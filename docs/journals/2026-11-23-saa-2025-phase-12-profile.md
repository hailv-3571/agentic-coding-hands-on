# Phase 12 Profile: hover card không tới được bằng bàn phím, cache sống qua cả buổi, e2e flake vì layout đổi

**Date**: 2026-11-23 01:16 (ngày theo tên file; commit `8ba87b7` lúc 01:16 +0700)
**Severity**: medium
**Component**: SAA 2025 Kudos Platform, F012 Profile (`features/profile/`, `app/(app)/profile/`, `app/api/profile/[userId]/kudos`, `app/api/sunners/[userId]/card`)
**Status**: ongoing

## What Happened

Phase 12 đưa vào `/profile`, `/profile/[userId]` và hover card trên avatar, cùng hai API mới. Code vào `8ba87b7`, docs vào `f51e0af`, chưa push. Reviewer không có Critical hay High, nhưng có hai Warning: hover card không tới được bằng bàn phím, và cache card không bao giờ làm mới. Cả hai được sửa trong vòng review. Gate cuối còn một e2e fail một lần trên 128 lần pass.

## The Brutal Truth

Cả hai Warning nằm ngay trong thiết kế. Card portal ra cuối `document.body`, `blurName` đóng card khi focus rời panel. Bản đầu, người dùng bàn phím không Tab tới được "Gửi KUDO" hay link profile trong card, và không test nào bắt được vì chưa có case Tab vào card.

Cache cũng vậy: `use-sunner-card.ts` giữ dữ liệu theo pathname tới khi reload. Live board sống cả buổi, nên count và `canSendKudo` đứng yên mãi. Privacy core đúng, nhưng tôi phải đọc lại từng query mới tin được.

## Technical Details

- Thứ tự check của `GET /api/profile/[userId]/kudos`: 401, 400, 404 cho id sai định dạng, 403 cho "sent" của người khác trước mọi read, 404 cho id không tồn tại, rồi 200.
- ALG-001 làm trong SQL: own sent là `status IN (public, spam)` với một keyset `(created_at, id)`. Integration: 16 sent, 4 spam xen kẽ, tie tại ranh giới trang 10 dòng, kết quả 10 + 6, không dup, không gap.
- Dev server: `KudoPublicQuery.count is not a function`. Sửa một ký tự comment mới ép recompile.
- Flake: sau khi gửi, `router.refresh()` và realtime chèn card mới trong lúc delay 300 ms. Avatar trượt khỏi con trỏ, `pointerleave` hủy lượt mở. Sau khi sửa, `--repeat-each 3` cho 21/21.
- Gate cuối: tsc, lint, unit 804, integration 458, e2e 129 passed / 5 skipped, build, `test:prod`.

## What We Tried

1. Tab bridge thay vì đưa DOM về cạnh tên, vì Highlight track có transform và cắt nội dung. Kết quả là `use-hover-card-keyboard.ts`, Esc trả focus về tên.
2. Cache: TTL 60 s kiểu stale-while-revalidate, cộng invalidate sau khi composer lưu. Launcher Live board không invalidate được, nên chấp nhận TTL.
3. Flake: lúc đầu chờ hover-open bằng delay cố định. Sửa bằng cách chờ card xuất hiện trong feed rồi hover trong `toPass`.
4. Count "đã gửi" của người khác loại kudo anonymous (orchestrator chọn). Đếm cả anonymous thì con số lộ kudo mà người xem không được biết.

## Root Cause Analysis

- Hover card thiết kế theo mouse trước, keyboard sau. Portal và blur-close đều hợp lý riêng lẻ, ghép lại thì mất đường Tab.
- Cache viết theo kiểu "trang tải một lần", không hỏi trang sống bao lâu.
- Flake: test đoán thời gian bằng delay cố định trong khi layout đang đổi.
- Stale module nằm ở dev cache của Turbopack, không ở code.

## Lessons Learned

- Popover hay portal phải có focus contract từ đầu, và có e2e Tab trước khi review.
- Cache trên trang sống lâu cần TTL hoặc invalidate ở chỗ ghi.
- Không chờ thời gian cố định. Chờ điều kiện quan sát được.
- Dev server cho kết quả lạ thì restart hoặc build trước khi tin.
- Count và list chung một predicate: parity đến từ cấu trúc, không từ test.

## Next Steps

- Chưa test 300 ms open delay. Người làm: implementer phase sau.
- Mixed-input: focus trong card A rồi mouse mở card B thì focus rơi về body. Người làm: implementer, trước release.
- Spec F012 còn lệch (tên handler cũ, ALG-001 merge). Người làm: caller, bằng `/tkm:rebuild-spec --features F012`.
- Sign-off authz và privacy: đã áp dụng chữ ký trước có điều kiện của user (2026-11-22) khi đủ 3 điều kiện (kiểm thử toàn bộ xanh trên code cuối, review 0 critical, cổng chỉ chờ chữ ký); ghi trong decision log.
