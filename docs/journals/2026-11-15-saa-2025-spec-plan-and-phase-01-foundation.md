# Spec 15 feature, plan 14 phase, rồi Phase 01: agent treo 4 lần, build đứng 25 phút, và một con số cũ còn nằm trong docs

**Date**: 2026-11-15 12:51
**Severity**: high
**Component**: SAA 2025 Kudos Platform — spec pipeline (Takumi SDD) và Phase 01 foundation (`shared/`, `db/`, `tests/`, `next.config.ts`)
**Status**: ongoing

## What Happened

Một ngày đi hết vòng từ Figma tới code đầu tiên. Luồng thực tế: phân tích Figma `9ypp4enmFmdK3YAFJLIu6C` qua Figma MCP trên claude.ai → báo cáo study → Takumi SDD (spec_lang vi) → 15 feature F001–F015 do researcher viết theo 3 đợt, mỗi đợt 5 → bản nháp kiến trúc và permission lộ ra 21 xung đột chéo (C-01..C-21) → user chốt 16 quyết định vào `spec/decision-log.md` → plan 14 phase → promote spec sang `docs/` → implement Phase 01 → tester → reviewer 8.5 → fix (Sonnet) → retest và reviewer recheck → sign-off evidence.

Phase 01 được commit thành 4 commit trên `main`: `c608d7c` (tooling), `533b7f3` (foundation), `6c119e8` (docs), `39b8b28` (kế hoạch). (Lưu ý: khoảng `c608d7c..39b8b28` không tính chính `c608d7c`, nên `git log` khoảng đó chỉ hiện 3.)

Các quyết định đổi theo bằng chứng:
- **Hashtag tối đa 3 → 5.** Đọc dropdown Figma thấy "Tối đa 5", nên bỏ quyết định 1–3 của phiên 08/11.
- **Level = hạng Hero** (New/Rising/Super/Legend hoặc trống), bỏ thang 1–5.
- **Mốc thời gian cấu hình được** qua env (`LAUNCH_AT`, `EVENT_AT`, `EVENT_END_AT`, `NATIONAL_KUDOS_FINALIZE_AT`). Ngày 26/12/2025 trong Figma đã qua, hardcode là sai ngay từ đầu.
- **Root layout `export const instant = false`**, vì `<html lang>` đọc cookie `NEXT_LOCALE` dưới Cache Components và build không qua nếu thiếu. Bỏ phương án `[lang]` URL segment (plan đã loại prefix) và phương án `lang="vi"` cố định kèm đổi ngôn ngữ phía client (hỏng a11y/SEO).
- **Vitest**: đổi `vitest.config.ts` → `.mts`, không đặt `"type":"module"` cho cả repo chỉ để tắt một cảnh báo.

Phần đau nhất của ngày: agent không làm việc được. Planner và researcher bị treo 4 lần, mỗi lần đúng một thông báo `Agent stalled: no progress for 600s (stream watchdog did not recover)`. Nguyên nhân là agent đọc nhiều file spec lớn trước khi viết gì. Cách thoát là orchestrator tự viết `plan.md`, rồi giao mỗi phase cho một planner với lượt đọc tối thiểu và yêu cầu ghi sớm.

## The Brutal Truth

Đây là một ngày mất khá nhiều giờ vì những thứ không phải code. Bốn lần treo agent, mỗi lần chờ đủ 10 phút rồi mới biết nó chết. Nhìn lại thì dấu hiệu đã có: agent nào đọc qua 5 file spec lớn mà chưa viết dòng nào thì đều đi vào vòng treo.

Phần khó chịu hơn là tôi đã để lọt một con số cũ. `docs/features/F003_KudosAuthoring/functional-spec.md:55` vẫn ghi `D013 | Số hashtag tối đa trên một Kudo? | Tối đa 3`, trong khi decision-log đã đổi thành 5 và `technical-spec.md` đã theo 5. Spec được promote trước khi quét lại toàn bộ docs sau khi có quyết định mới. Đây là kiểu lỗi làm người đọc sau này tin nhầm.

Và build 25 phút thì chưa ai giải thích được. Nó treo ở "Generating static pages" một lần, rồi các lần sau chạy 15 giây và 11 giây. Chưa tái hiện được. Tôi không muốn viết "đã fix" khi thật ra chỉ là đã thêm timeout.

## Technical Details

Agent treo (4 lần):
```
Agent stalled: no progress for 600s (stream watchdog did not recover)
```

Không có Python (`python3` là stub của Windows Store), nên `scaffold_spec.py` và validator không chạy được. Spec dựng tay từ template. Lint format bằng grep, và chính lệnh grep của quy trình làm sai: dùng `(?:...)` với `grep -E` (không hỗ trợ), cho ra FAIL giả trên cả 5 spec.

Lệnh bash cho `.claude/.tkmignore`: orchestrator đưa lệnh PowerShell để thêm dòng `!`, nhưng nó chạy qua bash và lỗi:
```
unexpected EOF while looking for matching ``'
```
Lệnh đúng là `printf ... >>`. Ignore list đã chặn `node_modules/next/dist/docs` mà `AGENTS.md` bắt buộc đọc; agent không được sửa file guardrail, user phải tự thêm `!node_modules/next/dist/docs`.

Evidence gate từ chối: các dòng temper có `status: pass` nhưng `exitCode: 1`, vì là probe âm có chủ đích. Sửa bằng cách chạy lại dạng phủ định, ví dụ `! LAUNCH_AT=garbage npx next build` → exit 0.

Secret scan của git-manager chặn commit vì:
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```
trong 2 fixture unit test. Thay bằng URL không chứa credential. Unit vẫn 52/52.

Build treo: `npm run build` lần đầu 25.3 phút ở "Generating static pages". Các lần sau 15 s và 11 s.

Review:
- Reviewer lần 1: 8.5/10, Critical 0, Warning 3:
  - W1 `next.config.ts:8`: `parseServerEnv(process.env)` chạy lúc load config, nên `next typegen` lỗi nếu thiếu secret.
  - W2 `db/migrations/0003_storage_kudo_images_bucket.sql:12`: `ON CONFLICT (id) DO NOTHING` giữ nguyên bucket public nếu đã có sẵn.
  - W3 `shared/db/client.ts:26-30`: pool không cache trên `globalThis` khi production, không có `max`/`idle_timeout`/`connect_timeout`.
- Recheck: tiêu đề ghi 9.3, nhưng khối JSON ghi `"score": 9`. Hai con số không khớp, cần hỏi reviewer.
- Tester: unit 48/48, integration 13/13, e2e 2/2, `typecheck`, `lint`, `build` đều exit 0. Probe RLS (tạo bảng không RLS): `expected [ 'rls_probe_tmp' ] to deeply equal []`, đúng như mong đợi.

## What We Tried

- **Giao plan cho một agent lớn**: treo. Agent đọc hết spec trước khi ghi.
- **Lặp lại planner với cùng cách**: treo thêm lần nữa. Đây là lỗi lặp lại cách đã thất bại.
- **Cách thoát đã chạy được**: orchestrator viết `plan.md`, mỗi phase một planner, đọc tối thiểu, ghi sớm.
- **`grep -E` cho format lint**: sai cú pháp, FAIL giả. Phải dùng `grep -P` hoặc viết lại regex không dùng `(?:`.
- **Build treo**: không tái hiện. Thêm `idle_timeout: 20`, `connect_timeout: 10`, `max` có giới hạn trong W3. Đây là giảm rủi ro, chưa phải nguyên nhân đã chứng minh.
- **Secret scan**: đổi fixture sang URL không credential. Không dùng allowlist.
- **Evidence gate**: đổi cách ghi probe âm sang dạng phủ định, giữ nguyên ý nghĩa của probe.

## Root Cause Analysis

Có ba lỗi gốc, không phải một:

1. **Thiết kế đọc quá nhiều vào một lượt.** Planner được giao đọc toàn bộ spec rồi mới viết plan. Với 15 spec lớn, context đầy trước khi có output, và stream watchdog không phục hồi được.
2. **Cập nhật docs không đi kèm quét ngược.** Khi quyết định đổi (hashtag 3 → 5), không có bước grep toàn bộ `docs/` tìm giá trị cũ. D013 vẫn còn.
3. **Kiểm tra môi trường không đi trước quy trình.** Quy trình spec giả định có Python và `grep -P`. Không ai kiểm tra trước, nên lỗi lộ ra giữa chừng.

Build 25 phút thì chưa rõ gốc. Giả thuyết hợp lý nhất là một prerender worker giữ socket và chờ kết nối DB không có timeout. Chưa có log chứng minh.

## Lessons Learned

- Trước khi giao spec cho agent, chạy `which python3 && python3 -V` và `echo test | grep -P 'a(?=b)|test'`. Nếu quy trình cần công cụ không có, sửa quy trình trước khi chạy.
- Mỗi planner chỉ đọc một phase file cộng với đúng các file nó cần. Ghi nháp sớm, rồi mới đọc thêm.
- Khi quyết định đổi, quét ngược: `grep -rn "Tối đa 3" docs/ spec/` ngay trong cùng commit. Đừng tin vào việc "đã cập nhật spec".
- Probe âm (cố tình fail) ghi bằng lệnh phủ định, và ghi `exitCode` đúng với thực tế. Đừng ghi `status: pass` cho exit 1.
- Đừng để credential mặc định của local stack lọt vào fixture, dù chỉ là local.
- Subagent không gọi được Figma MCP của claude.ai. Orchestrator phải tự kéo screenshot và design token rồi đưa vào prompt.
- Với build treo, luôn ghi thời gian từng lần chạy vào log trước khi sửa. Không gộp "đã thêm timeout" thành "đã fix".

## Next Steps

- **Orchestrator**: đã sửa `F003 D013` sang 5 trong `docs/features/` và `spec/` (2026-11-15).
- **Orchestrator**: hỏi reviewer về chênh lệch 9.3 và 9. Ghi số đúng vào evidence.
- **Tester**: chạy `npm run build` 5 lần liên tiếp, ghi thời gian từng lần. Nếu có lần vượt 60 giây, bật log prerender để tìm socket treo.
- **Delivery tracker**: đã cập nhật `phase-01-foundation-infrastructure.md` sang `status: completed`, tick đủ todo và thêm Delivery Notes.
- **Phase 02 (auth)**: chuyển `middleware` sang `proxy.ts` (Next 16 đã đổi tên). Khóa email/password sign-up, vì local stack đang bật `enable_signup = true` và Supabase cấu hình `minimum_password_length = 6`. Lưu ý server action body mặc định 1 MB.
- **Phase 11/13 (realtime)**: nếu policy trên `realtime.messages` cần đọc bảng `public`, phải cấp `GRANT SELECT` hẹp và thêm policy tương ứng. Sau S3 các role client đang không có quyền bảng nào.
- Mở câu hỏi chưa trả lời: `EVENT_END_AT` có nên dùng `00:00:00` ngày hôm sau để biên đóng sạch? Admin có được sửa hashtag không? Nếu được, seed có đè thay đổi mỗi lần `db:seed` không?
