# Phase 07 cổng prelaunch: proxy không chặn được Server Action, dev server cũ làm đỏ 10 e2e, và /rules không có lối vào

**Date**: 2026-11-22 13:27
**Severity**: high
**Component**: SAA 2025 Kudos Platform, F006 Awards portal và cổng prelaunch (`shared/auth/session-proxy.ts` bước 5, `features/awards-portal/`, `shared/config/event-window.ts`, `playwright.prelaunch.config.ts`)
**Status**: resolved

## What Happened

Phase 07 làm cổng trước giờ mở (`LAUNCH_AT`): Sunner thường bị đẩy về `/countdown`, Admin đi qua, và năm trang của Awards portal. Chốt thành ba commit trên `main`, chưa push: `4534045` (cổng), `beaf6ed` (trang), `2c7594c` (tài liệu và bằng chứng). Reviewer không có lỗi critical. User ký duyệt rủi ro ngày 2026-11-22.

Ba chuyện đáng ghi:
- Cổng ở proxy chỉ chặn page load. Server Action được giải theo id, không theo path, nên POST thẳng vào `/countdown` vẫn chạy. Chốt chặn lại ở cửa sổ ghi dùng chung `isEventWritingOpen` = `LAUNCH_AT ≤ now < EVENT_END_AT`, áp cả Admin. Phần còn lại (`choose-department` và đổi ngôn ngữ) user chấp nhận.
- Figma vẽ Thể lệ thành khung 553px bên phải và một nút nổi. Chốt: `/rules` vẽ thành khung, nút nổi hoãn. Doc-writer sau đó thấy không có link nào tới `/rules`. Phải thêm mục "Thể lệ" vào footer.
- 10 e2e kudos đỏ trên dev server `:3000` chạy từ 17/11.

## The Brutal Truth

Bực nhất là phase 06 đã ghi "restart `next dev` trước khi chạy full e2e". Phase 07 vấp đúng chỗ đó. Dev server PID 44984 chạy từ 17/11, `/login` TTFB từ 2,5 s lên 4,5–5,1 s. Mười test đỏ, mỗi lần một bộ khác. Chạy serial vẫn đỏ, nên không phải tranh tài nguyên. Restart xong thì xanh. Tôi không chứng minh được có lỗi sản phẩm hay không. Biết server cũ đã hỏng, nhưng chưa biết vì sao nó chậm dần.

Chỗ tệ hơn: cổng được viết như ranh giới bảo mật, thật ra chỉ là bức tường tiện lợi. Bản đầu của test gate đỏ 404 vì trang `/countdown` chưa tồn tại. Hai agent làm song song nên test gate đứng trên một trang chưa có.

## Technical Details

- Lỗi khi test gate: `Expected "/countdown", Received "/"` (user đứng ở `/`).
- Server Action của user trước launch: 400, sau khi nối bước 5 thành 403 `{"code":"prelaunch"}`.
- Redirect 307 khiến `fetch` gửi lại POST tới `/countdown`. Vì vậy mọi request không phải page load (có header `next-action`, `/api/*`, method khác GET/HEAD) nhận JSON 403.
- Unit 600/600 (bảng gate 134 ô). Integration 270/270 sau khi đổi write window. tsc và lint sạch. E2E 84 pass, 5 skip. Prelaunch (build + start trên `:3100`) 5 pass, 1 skip.
- Test FR-203 viết `clock.fastForward("31d")`, sai định dạng (chỉ nhận ms hoặc mm:ss). Sửa ở run 2.
- Mutation check cho FR-203 mới là lập luận, chưa chạy thật (O10).
- Ảnh: raw PNG tới 29 MB (`countdown-bg.png`), tổng 72 MB. Đổi WebP, file lớn nhất 219,6 KB, thư mục public 860 KB. Raw không commit.
- Hai `next dev` cùng thư mục bị khóa lock. `distDir` tùy biến làm Next sửa `tsconfig.json`. Vì vậy prelaunch chạy bằng build + start.

## What We Tried

1. 307 cho mọi request bị chặn: loại, vì replay POST.
2. Dựa vào proxy để chặn ghi: loại, vì Server Action bỏ qua path. Chốt cửa sổ ghi ở tầng service.
3. Dev server thứ hai cho prelaunch: loại, vì lock và `tsconfig`. Chuyển sang build + start.
4. Chạy lại e2e trên server cũ, serial: vẫn đỏ. Loại giả thuyết tranh tài nguyên.
5. Restart dev server (user duyệt): 84/5 xanh. Thêm `globalSetup` để bộ e2e thường dừng sớm nếu server còn trước `LAUNCH_AT` (reviewer W2).

## Root Cause Analysis

- Cổng đặt sai tầng. Proxy biết path, Server Action biết id. Chặn trang không đủ để chặn ghi. Tôi đã coi proxy là ranh giới bảo mật.
- Dev server: bài học phase 06 không thành check nào trong script hay quy trình. Người chạy phải nhớ.
- `/rules`: khi hoãn một điểm vào trong thiết kế (nút nổi), không ai kiểm tra trang đích còn tới được không. E2E vào thẳng URL nên không bắt được.
- Thứ tự giữa hai agent không được ghi lại. Test của bên này đã đứng trên trang bên kia.

## Lessons Learned

- Chặn ghi phải nằm đúng chỗ ghi xảy ra (service, write window). Proxy chỉ là UX.
- Trước full e2e: restart `next dev` hoặc kiểm tra tuổi process. Đừng dựa vào trí nhớ.
- Khi hoãn một entry point đã được thiết kế, kiểm tra trang đích còn có link tới. Test phải đi từ link, không đi từ URL.
- Test của agent này không được phụ thuộc trang agent kia chưa xong.
- Chỉ đóng một mục khi có exit code trên code cuối. Delivery-tracker bắt được lúc O9 còn ghi "subset".
- (orchestrator) Agent UI bị watchdog dừng sau 600 s không tiến triển, đúng lúc chạy spec chụp ảnh tạm; gửi message cho agent chạy tiếp với lệnh có giới hạn thời gian là xong. Bước chụp ảnh nên chia nhỏ, mỗi lệnh có `--timeout`.
- (orchestrator) Lượt e2e đầu tiên sau khi restart dev có 3 test đỏ do route biên dịch lần đầu; chạy riêng thì qua. Sau restart nên "làm ấm" các route chính trước khi chạy cả bộ.
- (orchestrator) Cổng evidence không nhận lệnh "phủ định" (cố ý exit 1) ghi là pass; bằng chứng kiểu đó ghi vào decision log, không vào temper-results. Viết `study-context.json` trước khi gọi reviewer, vì `acceptanceCovered` phải chép nguyên văn từng tiêu chí.
- (orchestrator) Ảnh gốc Figma rất nặng (tới 29 MB): đổi sang WebP bằng `sharp` có sẵn trong `node_modules` (phụ thuộc của Next, chạy với `NODE_PATH`), không thêm dependency.

## Next Steps

- Tester: chạy thật mutation FR-203 trên branch tạm (O10) và đo minute-tick trên trình duyệt thật (O8). Trước khi phase 07 đóng hẳn.
- Phase 07 implementer: log tag riêng cho lỗi tra role (O11), comment về clock lag (O12).
- Owner phase 04 và 06: câu `WRITING_CLOSED` riêng trước giờ mở (O3), heart không báo `EVENT_ENDED` cho Admin (O4). Trước `LAUNCH_AT`.
- User với BTC: copy Thể lệ, Tiêu chuẩn cộng đồng và bản tiếng Anh (O1, mở từ 08/11). Widget nổi (O2), "Hoặc" tương phản ~1,5:1 (O6), handle Slack (O7). `choose-department` có chặn trước giờ mở không (O5). Gitleaks trước khi push.
- Main agent: `/tkm:rebuild-spec` một lượt cho F003–F006, F011. Spec F006 vẫn ghi `/awards` trước giờ mở (O13).
