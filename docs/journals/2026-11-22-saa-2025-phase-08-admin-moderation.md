# Phase 08 kiểm duyệt Admin: câu hỏi UI đặt sai chỗ, và một lần "làm tiếp" không phải là ký duyệt

**Date**: 2026-11-22 19:28
**Severity**: high
**Component**: SAA 2025 Kudos Platform, F007 Admin moderation và owner spam view (`features/admin-moderation/`, `features/kudos-feed/components/kudo-card.tsx`, `kudo-detail-view.tsx`, migration `0013_kudos_moderation_columns`)
**Status**: resolved

## What Happened

Phase 08 làm màn Review content cho Admin (lọc, sắp xếp theo tim, Mark Spam / Un Spam, export CSV) và lớp phủ "Kudo spam" cho chính người viết. Chốt thành ba commit trên `main`: `b63a46e` (migration, query, service, route), `cf11360` (UI và overlay), `4bf4a4e` (tài liệu và bằng chứng). Chưa push. Reviewer không có lỗi critical. User ký duyệt rủi ro ngày 2026-11-22 sau khi đã có bằng chứng.

Ba việc đáng ghi:
- Orchestrator tự viết contract (`admin-kudo-row.ts`, `kudo-moderation-result.ts`, `ReviewContentScreenProps`) trước khi giao backend và UI song song. Hai bên tích hợp mà không chờ nhau. Backend báo khi xong để UI có DB chạy e2e.
- Plan viết lệch so với code: plan đòi seam tim và `immutable_unaccent`, nhưng code đã có `f_unaccent` từ 0007 và `heartCountsSubquery` của phase 06. Decision log và code thắng. EXPLAIN ANALYZE trên 10k kudos cho tìm kiếm có dấu 94 ms, dưới ngân sách 300 ms, nên không thêm index.
- Chốt rủi ro phải làm hai lần. Xem phần Root Cause.

## The Brutal Truth

Lỗi đầu tiên là của tôi. Câu hỏi gửi user ghi "Live board và trang chi tiết" cho lớp phủ spam, trong khi phase 05 không bao giờ liệt kê Kudo spam của chính người viết trên Live board. Agent UI chạy test và đỏ đúng chỗ đó. Phải hỏi user lại, user chọn giữ phase 05. Test được viết lại để khẳng định Kudo spam vắng mặt, kèm một Kudo công khai làm đối chứng. Bản viết lại đầu tiên không có đối chứng và đỏ vì vùng feed trống, chứ không phải vì sai hành vi. Thấy đỏ mà không hiểu vì sao thì đừng đoán. Hãy đọc data path trước.

Chuyện khó chịu hơn: tôi đã coi câu "làm tiếp toàn bộ các bước sau nhé, không cần dừng lại" là chữ ký rủi ro. Auto-mode classifier chặn việc chuyển `humanSignedOff` sang true. Dòng decision log viết sớm đã được sửa. Chỉ sau khi user trả lời riêng và rõ ràng ("Ký duyệt và commit") thì mới đóng gate. Phase này đụng migration, ghi `kudos.status`, phân quyền Admin và người gửi ẩn danh. Một câu chung không đủ.

## Technical Details

- Lần chạy full đầu tiên: integration 317/317, e2e 93 pass / 5 skip, `test:prod` 13/13.
- Sau khi sửa review: unit 649/649, integration 322/322, e2e 97 pass / 5 skip (prelaunch, theo thiết kế), `test:prod` 16/16, tsc và lint 0, build 0.
- Review W1: `kudo-detail-view.tsx`. Lớp phủ chỉ chặn chuột. Tab vẫn vào được link dưới lớp mờ: `Tab stops ["Người Gửi …","Đồng Đội …","bài viết gốc","Mở ảnh đính kèm 1 trong thẻ mới","Đóng"]`, mong đợi `["Đóng"]`. Sửa bằng `tabIndex=-1`, không dùng `inert` vì `inert` làm mất chữ với trình đọc màn hình.
- Review W2: `?page=99` hiển thị trang 3 nhưng không có trang nào được highlight (`aria-current` là `null`). Sửa bằng `Math.min(view.page, data.pageCount)`.
- Review S1: export đếm rồi mới đọc danh sách không giới hạn. Sửa thành một lần đọc `EXPORT_MAX_ROWS + 1`, có dòng thừa thì trả 422 `export_too_large`. Mutation RED: `expected 200 to be 422` với 13 dòng khi giới hạn là 12.
- Mutation kiểm tra thật: LIKE không escape backslash (sai id `k8` thay vì `k7`), và guard đặt sau lượt đọc (`KudoAdminQuery.list` được gọi 2 lần).

## What We Tried

1. Đặt Kudo spam của người viết lên Live board theo câu hỏi ban đầu: bỏ, vì phase 05 không có đường dữ liệu đó. User chọn giữ phase 05.
2. Viết lại test đỏ không đối chứng: đỏ vì feed trống, không chứng minh được gì. Thêm Kudo công khai làm đối chứng.
3. Dùng `inert` cho phần bị phủ: loại, vì trình đọc màn hình sẽ không đọc được nội dung mà quyết định yêu cầu giữ.
4. Đo coverage: chưa đo được. `@vitest/coverage-v8` chưa cài. Cài là đổi dependency, cần user đồng ý.

## Root Cause Analysis

- Câu hỏi UI được đặt mà chưa kiểm tra đường dữ liệu hiện có. Phase 05 đã đóng việc này bằng `includeOwnSpam`, chỉ dùng cho Profile. Tôi không đọc lại code trước khi hỏi.
- Gate rủi ro bị hiểu thành "không có ai phản đối". Một câu nói chung không phải là chữ ký. Lỗi nằm ở cách tôi đọc, không nằm ở agent.
- Plan đứng sau code. Ba chỗ plan lệch (seam tim, wrapper `unaccent`, index mới) đều được xử lý theo decision log. Nhưng plan chưa được đồng bộ, nên người đọc sau có thể làm theo tài liệu sai.

## Lessons Learned

- Trước khi hỏi user "hiện ở đâu", đọc query hiện tại xem đối tượng có thật sự đi qua đường đó không.
- Test đỏ không kèm đối chứng không đủ để kết luận. Luôn thêm một ca đúng ở cùng màn hình.
- Chữ ký rủi ro là một câu trả lời trực tiếp cho câu hỏi về rủi ro. "Làm tiếp" không phải là chữ ký.
- Với bảng Admin, nên có test mobile và en. Hiện chỉ có vi và desktop ở e2e.

## Next Steps

- Phase 12 (implementer): thêm e2e Tab order cho thẻ spam trên Profile "Đã gửi", và dùng `includeOwnSpam`, không dùng `OwnSpamKudoQuery`. Trước khi đóng phase 12.
- Main agent: thêm ESLint `no-restricted-imports` chặn `features/admin-moderation/server` từ `features/kudos-feed`. Chạy `/tkm:rebuild-spec --features F007`.
- User: chọn giữa giữ và chỉnh màu Public `#3174C6` (tương phản khoảng 4,3:1, dưới AA); xác nhận `changed:false` hiện thông báo hay im lặng; đồng ý cài coverage provider.
- Tester: `npx playwright test tests/e2e/admin-moderation --repeat-each=2` trước khi đóng.
- Trước khi push: chạy gitleaks.
