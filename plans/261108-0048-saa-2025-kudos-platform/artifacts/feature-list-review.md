---
passed: true   # true = FS.1 (feature-specs pass) can proceed; false = halt, surface issues to user
issues: 0      # count of critical findings
warnings: 3    # count of non-blocking findings
---

# Feature List Review (Wave 5.6)

**Input**: `artifacts/feature-list.md` (15 feature F001..F015; 649 dòng), đối chiếu `user-stories.md` (48 US) và `screen-list.md` (20 SCR, 7 REG)
**Run**: lượt chạy mới sau khi F010 được viết lại ở Wave 5. C1 của cycle 1 (`feature-list-review.cycle1.md`) đã đóng, xem mục Resolved. Group A sạch hoàn toàn, Check 8 không còn phát hiện critical.
**Gate**: passed=true, FS.1 được chạy tiếp. Ba warning (W1..W3) không chặn, nên ghi lý do vào FS.1 của feature liên quan.

## Critical Issues

Không có.

## Warnings

### W1: BL hạ tầng dùng chung chỉ gắn vào một feature tiêu thụ — OPEN
- **Severity**: warning (Check 8, không phải "clearly mixed" nên không critical)
- **Location**: `feature-list.md:81` (BL001 trong F001), `feature-list.md:84` (BL011 trong F001), `feature-list.md:184` (BL012 trong F003), `feature-list.md:539` (BL010 trong F013); feature tiêu thụ thiếu liên kết: `feature-list.md:228` (F004 / BL009), `feature-list.md:363` (F008 / BL003)
- **Description**: BL010 là client trình duyệt "mọi kênh trong tab dùng chung một socket" (`behavior-logic.md:409`), tức dùng cho cả kênh thông báo (F013) lẫn kênh Spotlight (F008), nhưng chỉ nằm ở F013. BL012 là client service-role chỉ dùng phía server để ký URL Storage (`behavior-logic.md:466`), được `features/kudos-authoring` và `features/kudos-feed` cùng gọi (`behavior-logic.md:482`), tức F003 và F004, chỉ nằm ở F003. BL001 seed phòng ban (F001), hashtag (F003, F004), danh mục Secret Box (F010); F001 chỉ cần phòng ban. Đây là nhóm theo lớp kỹ thuật chứ không theo outcome (Clustering Rule bullet 3: "held together only by HOW they are implemented"), nhưng mỗi BL chỉ là một mục lẻ trong feature vốn mạch lạc nên chưa tới mức trộn outcome.
- **Fix**: giữ chủ sở hữu hiện tại; thêm vào mô tả BL dòng `(dùng chung với F###)`: BL010 thêm F008, BL012 thêm F004, BL001 thêm F003 và F010. FS.1 của F004 và F008 phải ghi rõ chúng tiêu thụ BL012 và BL010.

### W2: Cổng prelaunch trong F006 không được US nào của F006 giải thích — OPEN
- **Severity**: warning (Check 8)
- **Location**: `feature-list.md:271` (Description), `feature-list.md:280` (SCR010), `feature-list.md:297` (BL013), `feature-list.md:300` (PERM004)
- **Description**: BL013 là bước 5 của `proxy.ts`, chạy ở mọi request và trả JSON 403 `prelaunch` cho cả `/api/*`, nên là kiểm soát truy cập toàn hệ thống. Bốn US của F006 (US045..US048) đều là điều hướng trong cổng thông tin, không US nào dính tới gate; SCR010 chỉ được US020 (thuộc F002) ánh xạ (`user-stories.md:171`, `user-stories.md:2496`). Không coi là "clearly mixed" vì đầu ra nhìn thấy của gate là trang countdown, cùng cổng thông tin sự kiện, và Description (`feature-list.md:271`) đã tự nêu "Phần nền là cổng prelaunch".
- **Fix**: nếu nhóm coi gate là kiểm soát phát hành thì chuyển BL013 và PERM004 về cạnh các cổng proxy của F001 (PERM001..PERM003), SCR010 ở lại F006. Nếu không, giữ nguyên và ghi lý do trong FS.1 của F006.

### W3: BL014 trong F009 phục vụ pipeline thông báo của F013 — OPEN
- **Severity**: warning (Check 8)
- **Location**: `feature-list.md:374` (nêu "mã nằm trong slice notifications"), `feature-list.md:393` (BL014_HeroTierUpDetection)
- **Description**: BL014 là `notification: quyết định thông báo trong app hero_tier_up` (`behavior-logic.md:524`) và chỉ trả `{tier, senderCount}` làm `params` của thông báo. Phần còn lại của pipeline nằm ở F013 (BL015 nạp bậc Hero vừa đạt ở `feature-list.md:540`; luật "chỉ báo một lần cho mỗi bậc" ở `feature-list.md:511`). BL duy nhất của F009 vì vậy phục vụ outcome của F013, còn F009 mang Type `background` chỉ nhờ BL này.
- **Fix**: chuyển BL014 sang F013. Khi đó F009 chỉ còn US040 và component nhúng, không SCR, không BL, cần chốt lại Type (xem O1). Phương án khác: giữ nguyên và ghi vào FS.1 của F009 rằng BL014 là đầu vào của F013.

## Check 8 enumeration

Tên có `&`, `and` hoặc dấu phẩy: **0/15**, không có tên đa outcome để liệt kê theo dấu hiệu liên từ. Vì tên một outcome không phải lá chắn, mỗi feature vẫn được xét theo trục nhóm (một dòng mỗi feature):

| F### | Verdict (outcome duy nhất giải thích mọi US) |
|------|----------------------------------------------|
| F001_Auth | Cấp danh tính và phiên Sunner đúng tên miền (đăng nhập, chọn phòng ban, đăng xuất); US016, US018, US019 khớp; BL001 xem W1 |
| F002_AppShell | Đi lại trong khung dùng chung; Admin và Sunner cùng một outcome điều hướng nên bullet "hai actor" thoả; US020 là điều khiển ở header nên ở lại |
| F003_KudosAuthoring | Viết và sửa Kudo; US026..US029 khớp; BL012 xem W1 |
| F004_KudosFeed | Đọc Kudo công khai; US030 là cửa tìm hồ sơ ngay trên board (REG002), giữ lại (xem O5); BL009 xem W1 |
| F005_KudosHearts | Thả và bỏ tim; US037, US038 khớp |
| F006_AwardsPortal | Thông tin sự kiện công khai; US045..US048 khớp; gate xem W2 |
| F007_AdminModeration | Kiểm duyệt Kudo; US005..US008 khớp |
| F008_SpotlightBoard | Spotlight thời gian thực; US042, US043 khớp; BL003 xem W1 |
| F009_HeroBadges | Hiển thị bậc Hero; US040 khớp; BL014 xem W3 |
| F010_SecretBoxRewards | KEEP: một outcome "phần thưởng cho người gửi Kudo, quy đổi từ tim" bao cả Secret Box lẫn Kudos Quốc Dân; US044 khớp, BL032 và MODEL014 được `feature-list.md:403` giải thích (bằng chứng ở mục Resolved) |
| F011_AdminCampaigns | Quản lý campaign x2; US013..US015 khớp |
| F012_Profile | Xem hồ sơ chỉ đọc; US034, US035, US041 khớp |
| F013_Notifications | Phát và đọc thông báo; US023..US025 khớp; BL010 xem W1 |
| F014_AdminUserManagement | Duyệt và đổi role Sunner; US009..US012 khớp |
| F015_AdminOverview | Số liệu theo đơn vị; US003, US004 khớp |

## Resolved since cycle 1

- **C1 (F010 gom Kudos Quốc Dân)** — CLOSED, giữ F010 theo Option B. `feature-list.md:403` nay mở bằng một outcome duy nhất ("Phần thưởng cho người gửi Kudo, quy đổi từ tim") và nêu lý do Kudos Quốc Dân thuộc đây, không phải vì chung nhịp tick. Lời lẽ trên được kiểm lại với bản sao sản phẩm: `messages/en.json:515` (trang Thể lệ: 5 Kudo nhiều tim nhất thành National Kudos và nhận quà đặc biệt "Root Further") và `messages/en.json:747` (thông báo gửi cho người gửi: "Your Kudos became a National Kudos ... receives a special gift"). Người dùng thấy đây là phần thưởng cho người gửi Kudo, nên tách `F016` là không cần.
- **Độ chắc**: trung bình đến cao; Clustering Rule là phán đoán ngữ nghĩa. Nếu người dùng vẫn coi hai đường thưởng là hai outcome, phương án khác là tách `F016_NationalKudos` (BL032, MODEL014) và đổi Summary thành 16 feature.

## Passed Checks

✓ Check1.US_coverage @ US001..US048 (48/48, mỗi US đúng 1 feature)
✓ Check1.SCR_coverage @ SCR001..SCR020 (20/20 bare ref; 7/7 REG có chủ khớp registry `screen-list.md:206,396-401`)
✓ Check2.orphan_US @ F001..F015 (0)
✓ Check2.orphan_SCR @ F001..F015 (0)
✓ Check3.fcode_uniqueness @ F001..F015 (15 heading, 15 dòng index, 0 trùng, index khớp heading)
✓ Check4.capability_intent (không đánh giá ở mức feature, theo code-formats.md § Capability-Level Intent)
✓ Check5.clear_flow @ F001..F015 (15/15)
✓ Check6.vague_naming @ F001..F015 (15/15)
✓ Check7.scope_overlap @ F001..F015 (0 US dùng chung; SCR007 chia 4 feature theo vùng REG rời nhau)
✓ Check8.grouping_coherence @ F002, F005, F007, F010..F012, F014, F015 (8/8)
✓ Check8.grouping_coherence @ F001, F003, F004, F006, F008, F009, F013 (qua ngưỡng critical, kèm W1..W3)

## Observations (not counted)

- **O1** `feature-list.md:238` F005 có Type `ui` nhưng Related Screens và Related Background Logic đều `None`, trái định nghĩa `ui` ở `feature-list.md:14`. F009 (`feature-list.md:373`) cùng tình huống (chỉ component nhúng) nhưng mang Type `background`. Hai cách gán khác nhau cho một tình huống; thống nhất một quy ước trước FS.1.
- **O2** `feature-list.md:519` F013 viết `SCR003/REG001_NotificationBell`, sáu ref vùng còn lại dùng dạng đầy đủ `SCR###_Slug/REG###_Slug`. Tokenizer chấp nhận cả hai (`feature-list.md:18`); nên đổi thành `SCR003_AppLayout/REG001_NotificationBell` cho đồng nhất.
- **O3** `route-list.md:118` gán ROUTE018 cho F003, trong khi `screen-list.md:397` nói REG002 (F004) "own endpoint" này và `feature-list.md:221` không liệt kê ROUTE018 ở F004; US030 (`user-stories.md:1573`) gọi đúng endpoint này. Route dùng chung giữa composer và ô tìm profile; để Wave 7a xét, FS.1 của F004 phải nêu ROUTE018.
- **O4** `feature-list.md:636-649` các ô Cross-Reference Validation vẫn `[ ]` sau khi merge. Đã kiểm ở đây: US 48/48, SCR 20/20, F-code 15 duy nhất; ngoài ra mỗi ROUTE (36), BL (34), PERM (38) xuất hiện đúng một lần, đủ 16 MODEL, và các con số khớp mục Summary. Nội dung ROUTE, MODEL, BL, PERM so với artifact nguồn nằm ngoài phạm vi W5.6.
- **O5** `feature-list.md:213` US030 (tìm hồ sơ đồng nghiệp) cùng ý định "mở hồ sơ" với US034 (`feature-list.md:487`, F012). Bullet "single misfiled US" (UNMEASURED) cho phép chuyển, nhưng REG002 là vùng của F004 với endpoint, trạng thái tải riêng, nên giữ ở F004 và không tính là phát hiện.
- **O6** `feature-list.md:414` F010 chỉ có một US (US044) trong khi mang 5 BL và 3 route (BL027, BL028, BL032, BL033, BL034, ROUTE006): các job cron và chốt Kudos Quốc Dân không có US hệ thống. Đã nằm trong backlog của orchestrator (thêm US cho scheduler job ở lần chạy đầy đủ sau).
