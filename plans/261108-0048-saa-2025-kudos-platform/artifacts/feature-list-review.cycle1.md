---
passed: false   # true = FS.1 (feature-specs pass) can proceed; false = halt, surface issues to user
issues: 1      # count of critical findings
warnings: 3    # count of non-blocking findings
---

# Feature List Review (Wave 5.6)

**Input**: `artifacts/feature-list.md` (15 feature F001..F015; 649 dòng), đối chiếu `user-stories.md` (48 US) và `screen-list.md` (20 SCR, 7 REG)
**Gate**: passed=false, FS.1 dừng ở C1 cho tới khi người dùng chọn hướng xử lý. Group A sạch hoàn toàn; chỉ Check 8 có một phát hiện critical.

## Critical Issues

### C1: F010_SecretBoxRewards gom thêm một outcome riêng (Kudos Quốc Dân) — OPEN
- **Severity**: critical (Check 8, Group C)
- **Location**: `feature-list.md:403` (Description), `feature-list.md:425` (MODEL014_NationalKudo), `feature-list.md:430` (BL032_NationalKudosFinalize)
- **Description**: F010 chỉ có một US (US044_OpenSecretBox, mở hộp) và outcome chính là "Sunner nhận và mở Secret Box từ tim". BL032 và MODEL014 làm việc khác: chốt 5 Kudo công khai nhiều tim thô nhất thành Kudos Quốc Dân, ghi bảng `national_kudos` một lần, phát sự kiện `NationalKudosFinalized` sang thông báo (F013). Phần này không dính tới hộp, vé, icon hay quà. Không US nào trong 48 US giải thích nó: tìm "Quốc Dân" trong `user-stories.md` chỉ trúng một dòng nhắc BL034 ở `user-stories.md:2282`. Sợi dây nối duy nhất là hai job cùng chạy trong tick BL034 (`feature-list.md:403`: "tick ... chạy job quét ... rồi job chốt").
- **Clustering Rule bullet**: (a) "A group of US serving a distinct business outcome ... is a SEPARATE Feature": chốt top 5 Kudo là outcome khác với thưởng hộp cho người gửi. (b) "Never form a Feature whose members are held together only by HOW they are implemented": gom vì chung một cron tick. (c) "Every screen and background job must be explained by some Feature's stated intent ... give it its own Feature": câu mở đầu của F010 ("Phần thưởng Secret Box cho người gửi Kudo") không bao phủ job này.
- **Fix**: tách `F016_NationalKudos` (Type `background`): BL032, MODEL014 (kèm PERM nếu có). F010 giữ BL027, BL028, BL033, BL034 và ROUTE006; BL034 gọi sang F016 qua ghi chú liên kết. 15 mã hiện có giữ nguyên nên không vi phạm ràng buộc "giữ nguyên mã và tên" ở `feature-list.md:5`; đổi lại Summary phải thành 16 feature.
- **Phương án khác**: nếu người dùng coi Kudos Quốc Dân là một loại phần thưởng cùng họ với Secret Box, viết lại câu mở đầu F010 thành một outcome duy nhất bao được cả hai và ghi lý do. Phương án này yếu hơn vì Hero Badges (F009) cũng là gamification mà đã tách riêng.
- **Độ chắc**: Clustering Rule là phán đoán ngữ nghĩa, không phải đếm; người dùng có quyền chọn phương án khác.

## Warnings

### W1: BL hạ tầng dùng chung chỉ gắn vào một feature tiêu thụ — OPEN
- **Severity**: warning (Check 8, không phải "clearly mixed" nên không critical)
- **Location**: `feature-list.md:81` (BL001 trong F001), `feature-list.md:84` (BL011 trong F001), `feature-list.md:184` (BL012 trong F003), `feature-list.md:539` (BL010 trong F013)
- **Description**: BL001 seed phòng ban, hashtag và danh mục Secret Box; hashtag thuộc F003 và danh mục thuộc F010, F001 chỉ cần phòng ban. BL010 dùng cho cả notifications và spotlight-board (`behavior-logic.md:425` nêu hai nơi dùng) nhưng chỉ nằm ở F013, F008 không liệt kê. BL012 dùng ở kudos-authoring và kudos-feed (`behavior-logic.md:482`) nhưng chỉ nằm ở F003. Đây là nhóm theo lớp kỹ thuật, không theo outcome (Clustering Rule: "HOW they are implemented").
- **Fix**: giữ nguyên chủ sở hữu hiện tại, nhưng FS.1 của F008 và F004 phải ghi rõ chúng tiêu thụ BL010 và BL012. Hoặc thêm dòng `(dùng chung với F###)` vào mô tả BL trong feature-list.

### W2: Cổng prelaunch trong F006 không được US nào của F006 giải thích — OPEN
- **Severity**: warning (Check 8)
- **Location**: `feature-list.md:271` (Description), `feature-list.md:280` (SCR010), `feature-list.md:297` (BL013), `feature-list.md:300` (PERM004)
- **Description**: BL013 chạy ở mọi request trong `proxy.ts` và trả JSON 403 `prelaunch` cho cả `/api/*`, đó là kiểm soát truy cập toàn hệ thống. Bốn US của F006 (US045..US048) đều là điều hướng trong cổng thông tin, không US nào dính tới gate. SCR010 chỉ được US020 (thuộc F002) ánh xạ (`user-stories.md:171`, `user-stories.md:2496`). Tôi xét không "clearly mixed" vì đầu ra nhìn thấy của gate là trang countdown nằm cùng cổng thông tin sự kiện.
- **Fix**: nếu nhóm coi gate là kiểm soát phát hành thì chuyển BL013 và PERM004 về cạnh các cổng proxy của F001 (PERM001..PERM003; BL013 là "bước 5 của proxy"), SCR010 ở lại F006. Nếu không, giữ nguyên và ghi lý do trong FS.1 của F006.

### W3: BL014 trong F009 thuộc về pipeline thông báo của F013 — OPEN
- **Severity**: warning (Check 8)
- **Location**: `feature-list.md:374` (nêu "mã nằm trong slice notifications"), `feature-list.md:393` (BL014_HeroTierUpDetection)
- **Description**: BL014 quyết định thông báo `hero_tier_up`; `user-stories.md:1844` và `user-stories.md:2090` xác nhận nó chỉ phục vụ thông báo, không phục vụ huy hiệu. Phần còn lại của pipeline này ở F013 (BL015 nạp bậc Hero vừa đạt ở `feature-list.md:540`; luật "chỉ báo một lần cho mỗi bậc" ở `feature-list.md:511`). BL duy nhất của F009 vì vậy phục vụ outcome của F013.
- **Fix**: chuyển BL014 sang F013. Khi đó F009 chỉ còn US040 và component nhúng, không SCR, không BL, cần chốt lại Type (xem Observation O1).

## Check 8 enumeration

Tên có `&`, `and` hoặc dấu phẩy: **0/15** nên không có tên đa outcome để liệt kê theo prompt liên từ. Vì "tên một outcome không phải lá chắn", tôi vẫn xét cả 15 theo trục nhóm (một dòng mỗi feature):

| F### | Verdict (outcome duy nhất giải thích mọi US) |
|------|----------------------------------------------|
| F001_Auth | Cấp phiên Sunner đúng tên miền, onboarding, đăng xuất; US016, US018, US019 khớp (BL001 xem W1) |
| F002_AppShell | Đi lại trong khung dùng chung; Admin, Sunner, Khách cùng một outcome điều hướng nên bullet "hai actor" thoả |
| F003_KudosAuthoring | Viết và sửa Kudo; US026..US029 khớp |
| F004_KudosFeed | Đọc Kudo công khai; US030 là cửa khám phá ngay trên board (REG002), US030..US039 khớp |
| F005_KudosHearts | Thả và bỏ tim; US037, US038 khớp |
| F006_AwardsPortal | Thông tin sự kiện công khai; US045..US048 khớp (gate xem W2) |
| F007_AdminModeration | Kiểm duyệt Kudo; US005..US008 khớp |
| F008_SpotlightBoard | Spotlight thời gian thực; US042, US043 khớp |
| F009_HeroBadges | Hiển thị bậc Hero; US040 khớp (BL014 xem W3) |
| F010_SecretBoxRewards | **SPLIT**: Secret Box giữ nguyên; Kudos Quốc Dân (BL032, MODEL014) tách riêng (C1) |
| F011_AdminCampaigns | Quản lý campaign x2; US013..US015 khớp |
| F012_Profile | Xem hồ sơ chỉ đọc; US034, US035, US041 khớp |
| F013_Notifications | Phát và đọc thông báo; US023..US025 khớp |
| F014_AdminUserManagement | Duyệt và đổi role Sunner; US009..US012 khớp |
| F015_AdminOverview | Số liệu theo đơn vị; US003, US004 khớp |

## Passed Checks

✓ Check1.US_coverage @ US001..US048 (48/48, mỗi US đúng 1 feature)
✓ Check1.SCR_coverage @ SCR001..SCR020 (20/20 bare ref; 7/7 REG có chủ, vùng không chồng)
✓ Check2.orphan_US @ F001..F015 (0)
✓ Check2.orphan_SCR @ F001..F015 (0)
✓ Check3.fcode_uniqueness @ F001..F015 (15 heading, 15 dòng index, 0 trùng, index khớp heading)
✓ Check4.capability_intent (không đánh giá ở mức feature, theo code-formats.md § Capability-Level Intent)
✓ Check5.clear_flow @ F001..F015 (15/15)
✓ Check6.vague_naming @ F001..F015 (15/15)
✓ Check7.scope_overlap @ F001..F015 (0 US dùng chung; SCR007 chia 4 feature theo vùng REG rời nhau)
✓ Check8.grouping_coherence @ F002..F005, F007, F008, F011..F015 (11/11)
✓ Check8.grouping_coherence @ F001, F006, F009 (qua ngưỡng critical, kèm W1..W3)

## Observations (not counted)

- **O1** `feature-list.md:238` F005 có Type `ui` nhưng Related Screens và Related Background Logic đều `None`, trái định nghĩa `ui` ở `feature-list.md:14`. F009 (`feature-list.md:373`) cùng tình huống (chỉ component nhúng) nhưng mang Type `background`. Hai cách gán khác nhau cho một tình huống; cần thống nhất một quy ước trước FS.1.
- **O2** `feature-list.md:519` F013 viết `SCR003/REG001_NotificationBell`, sáu ref vùng còn lại dùng dạng đầy đủ `SCR###_Slug/REG###_Slug`. Tokenizer chấp nhận cả hai; đề nghị đổi thành `SCR003_AppLayout/REG001_NotificationBell` cho đồng nhất.
- **O3** `route-list.md:118` gán ROUTE018 cho F003, trong khi `screen-list.md:397` nói REG002 (F004) "own endpoint" này và `feature-list.md:221` không liệt kê ROUTE018 ở F004. Route dùng chung giữa composer và ô tìm profile; để Wave 7a xét.
- **O4** `feature-list.md:636-649` các ô Cross-Reference Validation vẫn `[ ]` sau khi merge. Nhóm US, SCR, F-code đã kiểm ở đây (48/48, 20/20, 15 duy nhất); ROUTE, MODEL, BL, PERM ngoài phạm vi W5.6.
