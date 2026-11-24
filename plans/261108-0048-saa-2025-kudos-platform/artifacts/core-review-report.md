---
failed: 0
warnings: 19
missing: 0
result: PASS
---

# Review Report — Rebuild-Spec Artifacts (W7a core pass)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-11-24
**Scope**: 11 core artifacts (system-overview, architecture, data-model, behavior-logic, permissions, permissions-matrix, user-stories, feature-list, route-list, screen-list, screen-flow). Bỏ qua FeatureSpec (FS.5), ProcessFlow (FL.3), ApiContracts (AC.3); api-map chỉ đọc làm ngữ cảnh.

---

## Summary

| Metric | Value |
|--------|-------|
| Artifacts reviewed | 11 core + 0 feature specs (FS.5 riêng) |
| Critical issues | 0 |
| Warnings | 19 |
| Missing (`.pending` markers) | 0 |
| Result | **PASS** |

Hai mục (W4, W5) đọc theo chữ checklist là critical; tôi hạ xuống warning kèm lý do ở từng mục. Orchestrator có thể nâng lại nếu muốn đọc đúng chữ.

---

## Critical Issues

_(none)_

---

## Warnings

### W1: ROUTE018 `/api/sunners/search` có hai chủ khác nhau giữa các artifact — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/route-list.md:118`
- **Description**: route-list ghi `Owner F###` = F003 và feature-list.md:169 đặt ROUTE018 dưới F003. Nhưng screen-list.md:397 nói REG002_SunnerProfileSearch (F004) "own endpoint" ROUTE018, US030 (F004, user-stories.md:1573) gọi đúng endpoint này, còn F004 (feature-list.md:220-222) không liệt kê ROUTE018. Một route, hai chủ tùy artifact; FS.1 của F004 dễ viết thiếu. Đây là O3 của gate W5.6, để lại cho W7a.
- **Fix**: route-list.md:118 đổi Owner thành `F003, F004` (route-list cho phép đa chủ). Thêm `- (GET) /api/sunners/search — ROUTE018` vào Related APIs/Routes của F004 (sau feature-list.md:222), giữ dòng ở F003 (:169). Chạy lại `validate_feature_api_link.py`, phải PASS.

### W2: Mã F### trong Related Modules của permissions-matrix lệch với chủ trong feature-list — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/permissions-matrix.md:191`
- **Description**: Note dòng 31 cho phép ghi F### ở Related Modules "để dễ truy ngược", nhưng 6 mục không khớp feature-list: PERM003 (:191 ghi F002, F014; feature-list.md:94 → F001), PERM010 (:437 ghi F003, F004, F012; feature-list.md:100 → F001), PERM011 (:475 ghi F008, F010, F013; :101 → F001), PERM014 (:575 ghi F002, F007, F011, F014, F015; :102 → F001), PERM015 (:612 ghi F007, F014, F015; :103 → F001), PERM026 (:959 ghi F004; feature-list.md:191 → F003). Hai nguồn cho cùng một quan hệ; template nói feature mapping chỉ nằm ở FeatureList.
- **Fix**: bỏ hậu tố `(F###_…)` khỏi Related Modules, hoặc đổi nhãn thành `(mã nằm trong slice F###)` để không bị đọc như quan hệ sở hữu. Không sửa feature-list.

### W3: F005 Type `ui` không có SCR; F009 cùng hoàn cảnh lại là `background` — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/feature-list.md:238`
- **Description**: F005 `ui` nhưng Related Screens `None` (:246) và Related BL `None`; luật type (dòng 14) đòi `ui` có SCR###. F009 (:373) cũng chỉ có component nhúng, không SCR, nhưng mang `background` dù US040 là tooltip giao diện. Hai quy ước cho một tình huống (O1 của gate W5.6). Với enum ba giá trị không có cách gán đúng chữ cho cả hai.
- **Fix**: chọn một quy ước. Đề xuất: feature chỉ có widget nhúng, không SCR/REG riêng, đều là `ui`, và ghi ngoại lệ vào phần Feature Types (:13-16): "`ui` được phép không có SCR khi widget nhúng trong màn của feature khác". Nếu BL014 chuyển sang F013 (gate W3) thì F009 vào đúng trường hợp này.

### W4: SCR005_Error404 không có route trong route-list — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/screen-list.md:270`
- **Description**: Checklist ghi critical cho screen không có route (route-view). SCR005 là `app/not-found.tsx`, không có URL nào ("Mọi URL không khớp route nào"). Hạ xuống warning vì liệt kê bằng wildcard bị cấm (Completeness Contract, Over-merged rule a), screen đã có citation file ở :251, và `validate_screen_list.py` PASS.
- **Fix**: giữ nguyên. Thêm một câu vào `## Classification Notes` (:974-981): "SCR005 không có route; nguồn `app/not-found.tsx`; ngoại lệ có chủ đích". Không thêm hàng vào route-list (lệch tổng 18/36/54 mà validator và feature-list đang dùng).

### W5: `## Feature Entry Points` còn token thô `{POPULATED_BY_W6}` — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/screen-flow.md:65`
- **Description**: Token thô ở :65, kèm hai câu hướng dẫn trong ngoặc nhọn (:63, :67). Checklist (dòng 157) và rule "no placeholder" ghi critical, nhưng ở W7a trên bản nháp token luôn còn: `pipeline-w7-w9.md:378-394` thay bằng HTML comment ở bước pre-promote của W9, nội dung thật do FS.1.5 điền. Gate W9 lại HALT khi `failed > 0`, nên chấm critical ở đây sẽ chặn đúng bước thay token. Hạ xuống warning, với điều kiện W9 chạy bước thay.
- **Fix**: không sửa bản nháp nếu W9 chạy bước thay. Nếu không, thay :65 bằng `<!-- Feature Entry Points: run /tkm:rebuild-spec --feature-specs to populate -->` và xóa :63, :67. Sau promote, `docs/generated/screen-flow.md` không được còn `{POPULATED_BY_W6}`.

### W6: Pseudo-logic GUARD-004 đọc ngược với code — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/screen-flow.md:614`
- **Description**: Dòng ghi `if (now >= LAUNCH_AT) → /countdown (page load) redirects to / ; else pass`, rồi mới tới luật public/admin. Đọc ra thì trước LAUNCH_AT "pass" ngay, ngược với `decidePrelaunchRoute` (`features/awards-portal/server/prelaunch-gate.ts:56-70`): sau LAUNCH_AT trả pass, trừ page-load `/countdown` → `/`; chỉ trước LAUNCH_AT mới xét public → admin → redirect/403. BL013 (behavior-logic.md:506) mô tả đúng.
- **Fix**: thay :614 bằng `if (now >= LAUNCH_AT) → page load of /countdown → redirect / ; otherwise pass` và đặt ba dòng sau (:615-618) dưới nhãn `// prelaunch only`.

### W7: data-model trỏ tới artifact không tồn tại và chứa mã F### — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/data-model.md:738`
- **Description**: Năm chỗ ghi "thuộc artifact db-objects" (:214, :255, :308, :413, :738) trong khi profile web-js-ts không tạo db-objects (DbObjects chỉ áp khi `docs/generated/db-objects.md` tồn tại; thư mục đó chỉ có feature-list.md và screen-list.md). Hàm và trigger đã có ở BL018–BL024, policy ở PERM035–PERM038, bucket ở BL008 và PERM036. Thêm nữa :495 ghi `(F013)`; DataModel không mang mapping F###.
- **Fix**: thay cụm đó bằng tham chiếu thật: :214 → BL019_CreateSunnerProfile, BL022_SyncProfileEmail; :255 → BL023_SpotlightPublishKudoEvent; :308 → PERM036_KudoImageStorageAccess, BL008_KudoImageUploadSigning; :413 → BL028_SecretBoxTickCron; :738 liệt kê BL/PERM tương ứng. Bỏ `(F013)` ở :495.

### W8: Dải MODEL trong Summary chồng nhau, thứ tự heading lệch, ba quan hệ logic thiếu cardinality — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/data-model.md:732`
- **Description**: Summary vẫn ghi `MODEL001–MODEL004` (:732) và `MODEL003–MODEL007` (:733), MODEL003 và MODEL004 nằm trong cả hai dải. Heading MODEL004_Profile (:212) đứng trước MODEL003_Kudo (:253) sau khi renumber đảo 003↔004 (`renumber-map-data-model.json`). Ba bullet quan hệ logic vẫn thiếu cardinality: :376 (Campaign↔KudoHeart), :401 (SecretBoxPrize→UserIcon), :451 (UserIcon→SecretBoxPrize). Cả bốn là W1–W4 của `data-model-review.md`, chưa sửa.
- **Fix**: :732 → `MODEL001, MODEL002, MODEL004`; :733 → `MODEL003, MODEL005–MODEL007`. Không renumber (mọi artifact đã dùng đúng MODEL003=Kudo, MODEL004=Profile). :376, :401, :451 thêm "logic, 0..n, không có FK".

### W9: MODEL012_UserIcon ghi `Discriminator Fields: None` dù `icon_code` là danh sách đóng — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/data-model.md:453`
- **Description**: `icon_code` có CHECK 6 giá trị (`user_icons_icon_code_valid`; cùng danh sách ở `secret_box_prizes.icon_code`, :392). Checklist (DataModel, dòng 86) ghi critical cho "None" khi nguồn có trường kiểu enum/hằng. Hạ xuống warning: DISC cần ≥2 giá trị có hành vi khác nhau (`data-model-template.md:50`), mà code chỉ rẽ theo icon ở chiều cao ảnh huy hiệu (`features/secret-box-rewards/components/secret-box-format.ts:20-27`), không có nhánh nghiệp vụ. Câu ở :440 "không có hành vi riêng theo từng giá trị" hơi quá so với bảng chiều cao đó.
- **Fix**: giữ None. Sửa :440 thành "chỉ khác nhau ở ảnh huy hiệu hiển thị (chiều cao trong `secret-box-format.ts`), không có nhánh nghiệp vụ nên không lập discriminator".

### W10: 11/34 BL không có US nào dẫn; ô tham chiếu chưa tick — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/behavior-logic.md:1130`
- **Description**: Ô `All BL### referenced in UserStories.md (type=system)` chưa tick và đúng là chưa đạt: BL001, BL012, BL020, BL022, BL025, BL027, BL028, BL029, BL030, BL031, BL032 không có US dẫn (cron, trigger tên miền/email, seed). user-stories.md:13 nói không có system US vì vai scheduler không phải người; checklist UserStories chỉ đòi system US phải có BL, không đòi mọi BL có US nên không critical. Ô FeatureList (:1131) đã đạt (34/34, mỗi BL đúng một feature) nhưng cũng chưa tick. Backlog đã ghi ở `_orchestrator-log.md:41`.
- **Fix**: tick :1131. Giữ :1130 chưa tick, thêm chú thích "11 BL chưa có US: backlog system US cho scheduler ở lần chạy đầy đủ sau".

### W11: Ô Cross-Reference Validation còn `[ ]` dù đã đạt — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/feature-list.md:636`
- **Description**: Đối chiếu lại ở đây đều đạt: feature-list.md:636-649 (14 ô: 15 F-code duy nhất; 48 US, 20 SCR, 36 ROUTE, 16 MODEL, 34 BL, 38 PERM đều tồn tại và thuộc ≥1 feature); screen-list.md:996 và :999 (20/20 SCR có trong ScreenFlow và FeatureList); permissions-matrix.md:1366 (38/38 PERM trong FeatureList); user-stories.md:2512-2517 (48 mã duy nhất, 48/48 trong FeatureList, 48/48 `ui` có SCR, không có system US). Ô "testable" (:2513) là phán đoán; 12 story đọc mẫu đều kiểm chứng được.
- **Fix**: tick các ô trên; để :2513 theo phán đoán của người sửa.

### W12: US034–US048 bỏ nhãn `Criterion N:` — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/user-stories.md:1770`
- **Description**: US001–US033 dùng `- [ ] Criterion N: …` (184 bullet); US034–US048 (15 story, 72 bullet, :1770-:2482) chỉ có `- [ ] …`. Template (`user-stories-template.md:50-54`) đòi nhãn; công cụ đếm AC theo nhãn sẽ thấy 0 cho 15 story này. Do hai fan-out agent ghi khác khuôn.
- **Fix**: thêm `Criterion {n}: ` đầu mỗi bullet AC của US034..US048, đánh số từ 1 trong từng story.

### W13: US026 và US029 cùng actor, cùng endpoint `createKudo` — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/user-stories.md:1519`
- **Description**: IPE_MERGE_CANDIDATE: US026_CreateKudo (:1370) và US029_SendKudoToSunner (:1519) đều là Sunner gọi ROUTE023; AC3 của US029 nói "luật gửi giống story CreateKudo". Khác biệt có thật (điểm vào từ hồ sơ hoặc thẻ, người nhận khoá sẵn, xóa cache thẻ sau khi gửi ở AC4) nên tách là hợp lý, nhưng chưa ghi lý do. US010/US011 cùng ROUTE032 thì khác hành động và luật chặn, tách đúng.
- **Fix**: giữ hai story; thêm vào Notes của US029 một dòng `[IPE_SPLIT_JUSTIFIED]` nêu ba khác biệt trên.

### W14: US020 gộp khách, Sunner và admin dưới actor "Sunner" — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/user-stories.md:1100`
- **Description**: "Là một Sunner" (:1100) nhưng AC5 (:1108) và Screens (SCR001, SCR010, SCR002) gộp khách và admin; Interaction Inventory (:24, :26, :32, :88) cũng vậy. PERM012 xác nhận cả ba vai đều được phép. Checklist: nhiều actor trong một US → warning.
- **Fix**: đổi actor thành "người dùng (khách, Sunner hoặc admin)" hoặc thêm `[IPE_ACTOR_FOLDED]` vào Notes. Không cần tách: cùng một điều khiển, cùng endpoint.

### W15: Ref vùng `SCR003/REG001_NotificationBell` thiếu slug ở vế trái — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/feature-list.md:519`
- **Description**: Sáu ref vùng còn lại dùng `SCR###_Slug/REG###_Slug`. Vế trái ở đây thiếu `_AppLayout` nên không khớp regex M3 `^SCR\d{3}_\w+(/REG\d{3}_\w+)?$` (tokenizer vẫn giải được, `validate_feature_screen_link.py` PASS). Là O2 của gate W5.6.
- **Fix**: đổi thành `SCR003_AppLayout/REG001_NotificationBell`.

### W16: Trường `Components` đếm theo hai nghĩa khác nhau — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/feature-list.md:275`
- **Description**: F001–F005 và F011–F015 đếm `features/<slug>/components/*.tsx` (đối chiếu đúng: 4, 14, 20, 24, 3, 10, 9, 7, 9, 3). F006–F010 (:275, :311, :347, :378, :407) đếm mọi module nguồn không test kể cả server/lib/hooks (26, 36, 30, 9, 35). Cùng nhãn nhưng F007 "36" và F011 "10" không so sánh được; template không định nghĩa trường.
- **Fix**: đếm F006–F010 theo `components/*.tsx`: awards-portal 19, admin-moderation 19, spotlight-board 11, hero-badges 3, secret-box-rewards 11; hoặc đổi nhãn thành "Source modules" và đếm đồng nhất cả 15 feature.

### W17: Dev Appendix của behavior-logic bỏ hai mục tham chiếu của template — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/behavior-logic.md:133`
- **Description**: Chỉ còn `### Cardinality Contract`; template (`behavior-logic-template.md:70-95`) còn `### Inclusion/Exclusion Matrix (scout-side filter)` và `### Anti-Patterns: Aggregation Forbidden`. `validate_behavior_logic.py` vẫn PASS vì chỉ đòi Index và Cardinality; hai mục này là tài liệu tham chiếu cho researcher và reviewer lượt sau. Mức thấp.
- **Fix**: chép hai mục từ template vào sau :133, hoặc ghi một dòng nói chủ ý bỏ.

### W18: Hàng Test trong Tech Stack thiếu công cụ test thực có trong package.json — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/architecture.md:165`
- **Description**: Hàng Test chỉ có Vitest và Playwright; devDependencies còn `@testing-library/react 16.3.3`, `@testing-library/dom 10.4.2`, `happy-dom 21.0.4`, `@vitest/coverage-v8 5.1.0` (`server-only` và `@next/env` cũng không có trong bảng). Theo chữ checklist "công nghệ có trong codebase mà không ghi" là critical; hạ xuống warning vì chỉ là phụ thuộc test/tiện ích. Các hàng còn lại khớp `package.json` và `node_modules`.
- **Fix**: thêm vào hàng Test: "Testing Library 16.3.3, happy-dom 21.0.4, coverage-v8 5.1.0".

### W19: REG### trần trong tham chiếu — OPEN
- **Severity**: warning
- **Location**: `plans/261108-0048-saa-2025-kudos-platform/artifacts/screen-flow.md:28`
- **Description**: Nhãn Mermaid `REG001 Xem tat ca` (screen-flow.md:28) và user-stories.md:67, :1781, :2079, :2177, :2272 ("dòng REG005", "vùng REG004"). Luật universal: REG### phải đi cùng SCR###. Ngữ cảnh đủ rõ nên không critical. Cột `region:REG###` của Error Handling Flows theo đúng format template nên không tính. Mức thấp.
- **Fix**: viết `SCR003/REG001`, `SCR007/REG005`, `SCR007/REG004`.

---

## Passed Checks

✓ Universal.artifact_exists_nonempty @ system-overview..feature-list (11/11)
✓ Universal.no_placeholder_text @ 10 artifacts excl. screen-flow (10/11)
✓ Universal.required_sections_template_order @ 11 core artifacts (11/11)
✓ Universal.orphan_code_no_feature @ route-list (36/36)
✓ Universal.orphan_code_no_feature @ data-model (16/16)
✓ Universal.orphan_code_no_feature @ screen-list (20 SCR, 7 REG)
✓ Universal.orphan_code_no_feature @ behavior-logic (34/34)
✓ Universal.orphan_code_no_feature @ permissions-matrix (38/38)
✓ Universal.orphan_code_no_feature @ user-stories (48/48)
✓ Universal.reg_parent_exists @ screen-list (7/7)
✓ Universal.reg_nameslug_mandatory @ screen-list (7/7)
✓ Universal.reg_no_nesting @ screen-list (7/7)
✓ Universal.cross_ref_tokenizer @ feature-list (SCR/REG refs resolve)
✓ Universal.cross_ref_tokenizer @ permissions-matrix (SCR/REG refs resolve)
✓ Universal.content_completeness @ route-list (20/20 handlers, 16/16 server actions, 18/18 pages)
✓ Universal.content_completeness @ data-model (16/16 tables, 3/3 enums)
✓ Universal.content_completeness @ screen-list (18/18 page.tsx, 4/4 layout.tsx, not-found, forbidden)
✓ Universal.content_completeness @ behavior-logic (34/34 inventory; 6/6 triggers, hook, 2 policies, 4 cron jobs)
✓ Universal.content_completeness @ permissions-matrix (guards, RLS, realtime policies, job secrets)
✓ Universal.content_completeness @ architecture (16/16 feature import rows)
✓ SystemOverview.required_sections @ system-overview
✓ SystemOverview.decision_context_decision_rationale @ system-overview (9/9)
✓ SystemOverview.tech_accuracy_vs_manifests @ system-overview
✓ SystemOverview.counts_vs_code @ system-overview (18 pages, 20 handlers, 11 action modules, 16 tables, 24 migrations)
✓ SystemOverview.no_leaked_credentials @ system-overview
✓ Architecture.mermaid_system_architecture @ architecture
✓ Architecture.mermaid_syntax @ architecture (3 diagrams)
✓ Architecture.tech_stack_matches_manifests @ architecture (declared and installed versions)
✓ Architecture.deployment_view_degradation @ architecture (no IaC; label and N/A line present)
✓ Architecture.deployment_view_no_credential_leak @ architecture
✓ Architecture.citations_spot_check @ architecture (32 file:line)
✓ RouteList.duplicate_ids [deterministic-pass] @ route-list
✓ RouteList.handler_citation_presence [deterministic-pass] @ route-list
✓ RouteList.route_codes_contiguous @ route-list (ROUTE001..ROUTE036)
✓ RouteList.owner_twin_consistency @ route-list (36/36 vs feature-list)
✓ RouteList.handler_middleware_matches_code @ route-list (10 rows read against source)
✓ DataModel.entity_attribute_format @ data-model (16/16)
✓ DataModel.model_codes_unique @ data-model (16/16)
✓ DataModel.disc_codes_unique @ data-model (6/6)
✓ DataModel.disc_anchored_to_field @ data-model (6/6)
✓ DataModel.disc_values_match_source @ data-model (6/6)
✓ DataModel.disc_no_boolean @ data-model
✓ DataModel.relationships_match_fk @ data-model (19/19)
✓ DataModel.attributes_match_schema @ data-model (kudos, kudo_*, notifications, outbox)
✓ DataModel.no_reg_in_w1_artifacts @ data-model, system-overview, route-list (0 REG)
✓ ScreenList.codes_format @ screen-list (20/20)
✓ ScreenList.duplicate_codes [deterministic-pass] @ screen-list
✓ ScreenList.screen_has_us @ screen-list (20/20)
✓ ScreenList.screen_has_route @ screen-list (19/20; SCR005 see W4)
✓ ScreenList.h6_router_outlet @ screen-list (2/2 outlets split into own SCR)
✓ ScreenList.over_merged_screen @ screen-list (0 wildcard, 0 namespace merge)
✓ ScreenList.trap1_independence_signal @ screen-list (7/7 REG)
✓ ScreenList.trap6_owner_annotation @ screen-list (7/7 REG)
✓ ScreenList.region_line_citations @ screen-list (6/6 page.tsx:59..75)
✓ Composite.two_of_three_gate_cited @ screen-list (2/2 composites)
✓ Composite.h3_excludes_h4_h5 @ screen-list
✓ Composite.h4_h5_not_applicable @ screen-list (no tabs, no wizard)
✓ Composite.raw_div_fallback_noted @ screen-list (SCR007 H3_RAW_DIV)
✓ Composite.signal_inferred_cap @ screen-list (0 occurrences, cap 5)
✓ Trap7.inferred_signal_abuse @ screen-list (0)
✓ Trap4.loc_based_over_split @ screen-list (0)
✓ ScreenFlow.all_scr_in_flow @ screen-flow (20/20)
✓ ScreenFlow.scr_in_flow_has_feature @ screen-flow (20/20)
✓ ScreenFlow.transition_subsections @ screen-flow (20/20)
✓ ScreenFlow.single_navigation_map [deterministic-pass] @ screen-flow
✓ ScreenFlow.auth_flow_documented @ screen-flow
✓ ScreenFlow.circular_redirects @ screen-flow (0; user-initiated loops documented)
✓ ScreenFlow.guard_citations @ screen-flow (10 GUARD blocks, sources read)
✓ BehaviorLogic.codes_unique_format @ behavior-logic (34/34)
✓ BehaviorLogic.single_index_section [deterministic-pass] @ behavior-logic
✓ BehaviorLogic.type_canonical_10 @ behavior-logic (34/34)
✓ BehaviorLogic.type_trigger_description @ behavior-logic (34/34)
✓ BehaviorLogic.source_file_present @ behavior-logic (34/34)
✓ BehaviorLogic.source_symbol_single_valued @ behavior-logic (34/34)
✓ BehaviorLogic.cardinality_c1_one_per_entry @ behavior-logic (34/34)
✓ BehaviorLogic.category_drop @ behavior-logic (0 dropped)
✓ BehaviorLogic.orphan_file @ behavior-logic (0)
✓ BehaviorLogic.exclusion_pattern_leak @ behavior-logic (0)
✓ BehaviorLogic.route_model_refs_valid @ behavior-logic (ROUTE 15, MODEL 12 distinct)
✓ BehaviorLogic.payload_present @ behavior-logic (event-listener, notification, queue-worker, DB event observers)
✓ BehaviorLogic.keyword_overlap @ behavior-logic (0 duplicates; BL020/BL021, BL025/BL026, BL027/BL028/BL034 are distinct inventory entries)
✓ BehaviorLogic.citations_spot_check @ behavior-logic (30 file:line)
✓ Permissions.system_type_valid @ permissions (hybrid)
✓ Permissions.required_sections @ permissions
✓ Permissions.no_perm_codes_no_matrix @ permissions
✓ Permissions.roles_consistent_with_matrix @ permissions (4/4 roles)
✓ PermissionsMatrix.codes_unique_format @ permissions-matrix (38/38)
✓ PermissionsMatrix.type_valid @ permissions-matrix (38/38; by-type counts match Summary)
✓ PermissionsMatrix.required_fields @ permissions-matrix (38/38; env-gate use source:)
✓ PermissionsMatrix.route_screen_refs_valid @ permissions-matrix (ROUTE 36, SCR 19 distinct)
✓ PermissionsMatrix.rules_match_code @ permissions-matrix (14 PERM read against guards)
✓ PermissionsMatrix.citations_spot_check @ permissions-matrix (28 file:line)
✓ UserStories.us_codes_unique_format @ user-stories (48/48)
✓ UserStories.ui_us_ge_screen_count @ user-stories (48 >= 20)
✓ UserStories.ui_us_has_scr @ user-stories (48/48)
✓ UserStories.us_referenced_by_feature @ user-stories (48/48)
✓ UserStories.index_matches_sections @ user-stories (48/48 screens)
✓ UserStories.compound_title @ user-stories (0)
✓ UserStories.destructive_covered @ user-stories (US006, US011, US015, US038)
✓ UserStories.interaction_inventory_present @ user-stories
✓ UserStories.priority_present @ user-stories (48/48)
✓ UserStories.technical_notes_complete @ user-stories (48/48)
✓ UserStories.screen_map_complete @ user-stories (20/20)
✓ FeatureList.codes_unique_format @ feature-list (15/15)
✓ FeatureList.refs_resolve @ feature-list (US 48, SCR 20, ROUTE 36, MODEL 16, BL 34, PERM 38)
✓ FeatureList.no_orphan_refs @ feature-list (each US, SCR, ROUTE, BL, PERM exactly once; MODEL >= 1)
✓ FeatureList.partial_screen_ownership_ce3 @ feature-list (20/20 bare SCR, 7/7 REG owned)
✓ FeatureList.names_specific @ feature-list (15/15)
✓ FeatureList.priority_sorted @ feature-list
✓ FeatureList.summary_counts @ feature-list
✓ FeatureList.feature_screen_link [deterministic-pass] @ feature-list
✓ FeatureList.feature_api_link [deterministic-pass] @ feature-list

---

## BehaviorLogic Cardinality

### BehaviorLogic Cardinality
- Inventory total: 34
- Artifact BL count: 34
- Gap: 0% (PASS)
- Missing categories: none
- Orphan files: none

Chi tiết: một stack con duy nhất (`Next.js App Router + Supabase (TS)`), ngưỡng phần trăm áp dụng vì max(34, 34) ≥ 20. Phân bố khớp từng loại: custom-command 1, event-listener 2, integration 9, middleware 1, notification 4, observer 7, queue-worker 2, scheduled-job 8; mail và webhook 0 mục trong inventory nên không tính là rơi loại. Rule 5 (inferred ratio) miễn vì stack không có hàng trong `bl-source-patterns.md`. Rule 6: không có Source File khớp mẫu test/abstract/vendor. Mọi Source File khớp 1-1 inventory.

---

## Validator Notes

- Đã chạy ở pre-W7a (coi là deterministic-pass): validate_route_list, validate_screen_list, validate_screen_flow, validate_behavior_logic, validate_api_map, validate_id_contiguity, validate_feature_existence.
- Tôi chạy thêm chỉ-đọc, không ghi `--summary-out`: `validate_feature_screen_link` PASS, `validate_feature_api_link` PASS, `validate_deployment_view` WARN `DeploymentView.no_iac` (đúng dự kiến: không có IaC, đã degrade thành dòng N/A).
- `validate_id_contiguity --artifact screen-list`: 2 cảnh báo "REG002 và REG003 missing in SCR020_OnboardingDepartment block" là dương tính giả. SCR020 là block cuối nên phần `## Classification Notes` và `## Summary` đi theo block, mà phần đó nhắc REG001, REG004, REG006. SCR020 là atomic, không có vùng; không cần sửa artifact.

## Gate Carry-Forward (không tính lại vào `warnings`)

- W5.6 W1: BL001, BL010, BL011, BL012 chỉ gắn vào một feature tiêu thụ. FS.1 ghi chú dùng chung: BL010 thêm F008, BL012 thêm F004, BL001 thêm F003 và F010. Bổ sung: BL030_CronHistoryPrune xóa lịch sử của mọi job `saa-*` (gồm tick Secret Box của F010) nhưng chỉ nằm ở F013.
- W5.6 W2: BL013 và PERM004 (cổng prelaunch toàn hệ thống) nằm ở F006 mà không US nào của F006 giải thích. Ghi lý do vào FS.1 của F006.
- W5.6 W3: BL014 nằm ở F009 nhưng phục vụ pipeline thông báo F013. Nếu chuyển BL014 sang F013 thì F009 không còn SCR lẫn BL, và cách xử lý Type ở W3 của báo cáo này áp dụng cho cả F005 và F009.
- W5.6 O5 (US030 giữ ở F004) và O6 (F010 chỉ một US) đã được ghi nhận, không đổi.

## Edge Cases Turned Up

- Luật "service coverage" của ScreenList được áp cho lời gọi API/hook. Helper đọc thẳng trong RSC (`listDepartmentOptions`, `isKudoWritingOpen`, `requireSunner`, các `*Query.list`) không có ROUTE hay BL theo thiết kế của Next App Router; không tính là thiếu.
- Server Action đi tới đường dẫn công khai (`/login`, `/countdown`) qua được proxy mà không bị chuyển hướng khách; các action ghi (`createKudo`, `updateKudo`, tim, admin) đều tự gọi `requireSunner()` hoặc `requireAdmin()` (route-list ROUTE023-032), `signOut` và `setLocaleAction` không guard có chủ đích (PERM012). Khớp mã nguồn.
- 4/20 route handler không đặt `Cache-Control: no-store` (`hashtags`, `kudos/images/sign`, `sunners/search`, `auth/callback`); architecture.md:68 ghi đúng. system-overview.md:97 viết "endpoint dữ liệu riêng tư đặt `private, no-store`" hơi rộng so với `GET /api/sunners/search` (danh bạ Sunner). Là quan sát về code, không phải lỗi artifact.
- PERM011 cho phép Sunner chưa chọn phòng ban đọc `/api/spotlight`, thông báo và Secret Box; matrix ghi rõ, khớp `requireNotificationUser` và `requireSecretBoxUser`.

---

## Metrics

| Metric | Value |
|--------|-------|
| Feature Specs | n/a (FS.5) |
| User Stories | 48 |
| Screens | 20 (+ 7 REG) |
| Background Logic Items | 34 |
| Permissions | 38 |
| Backend Route Rows | 36 (20 handler, 16 server action) |
| Frontend Pages | 18 |
| Data Model Entities | 16 |

Content-completeness: đọc và khớp mã nguồn ≈ 150 trích dẫn `file:line` (architecture, behavior-logic, permissions-matrix, screen-list REG, client-side logic), đối chiếu `app/**`, `shared/db/schema`, `db/migrations`, `package.json`, `node_modules` (Next 16.4.5, React 19.3.0, Tailwind 4.3.4, next-intl 4.15.1, zod 4.6.7, drizzle-orm 0.45.4, TypeScript 5.9.3), inventory scout 34 BL. Không phát hiện trích dẫn sai dòng.

## Strengths

- Mọi hằng số và ngưỡng đọc ngược lại mã nguồn đều đúng (hero tier, backoff 60 s × 2^n, trần xuất CSV, cửa sổ ghi, kích thước trang).
- Phân biệt rõ quy tắc mã nguồn với chỗ chưa biết: hosting, phiên bản Realtime và extension ghi "No data" thay vì đoán; ngoại lệ (không CSP, không rate limit, 4 handler không `no-store`) được nêu thẳng.
- Gate trước đó (W1.5, W4.5, W5.6) bắt được C1 của F010 và đã đóng; truy vết US, SCR, ROUTE, BL, PERM sang feature hai chiều đầy đủ, không mã mồ côi.
