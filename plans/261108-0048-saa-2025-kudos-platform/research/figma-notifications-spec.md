# Figma — Notifications (phase 13 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C` — all-notifications page 589:9132, header dropdown panel 589:9152; orchestrator 2026-11-23. Screenshots: `research/figma-frames/notifications-all-page-589-9132.png`, `notifications-panel-589-9152.png`. Icons ready in `public/images/notifications/` (40px type icons, 24px mark-all, 8px unread dot, 24px arrow).

## Bell panel (589:9152) — opens from the header bell (phase 03 shell)
- Panel w528, bg `#00070C`, rounded 16, px16 py8, gap 8, anchored under the bell (right-aligned to it, top 96 in the 1440 frame → just below the header), max height ≈ viewport − 120 with internal scroll.
- Title row: "Thông báo" Bold 24/32 white; right: text button "Xem tất cả" Bold 16/24 white (→ `/notifications`) + 40px icon button (`ic-mark-all-read.svg`, label "Đánh dấu đọc tất cả").
- Item: border-b 1px `#2E3940`, rounded 2, pt8 pb16 pl16 pr48 (unread: pr16 + 8px red dot `ic-unread-dot.svg` at the right), gap 24: type icon 40 · content (gap 8): text Bold 16/24 white tracking .5 · relative time Bold 12/16 `#999` tracking .4 ("15 phút trước", "1 giờ trước", "1 ngày trước", "1 tuần trước", "1 tháng trước"). Hover/focus: bg `rgba(255,234,158,0.1)`. Click → mark read + navigate to the deep link.
- Bell shows a red dot when there are unread items (header already has the slot).

## All notifications page `/notifications` (589:9132)
- Live board keyvisual on top; panel w680 centred at top 192, same item style; title row "Thông báo" + "Đánh dấu đọc tất cả" (icon + Bold 16/24 white). Paginate/infinite scroll; empty state (not drawn — spec copy).

## Types and copy (Figma verbatim; placeholders in <>)
| Type (event) | Icon | Text | Link |
|---|---|---|---|
| Kudo received (KudoCreated, to recipient) | ic-noti-kudo-received | "Sunner <tên người gửi> vừa gửi đến bạn lời ghi nhận đầy yêu thương!" — anonymous sender → use the nickname rule ("<nickname> (ẩn danh)") never the real name | `/kudos/{id}` |
| Hearts on your kudo (HeartAdded, to sender) | ic-noti-heart | "Wow! Lời nhắn gửi của bạn cho Sunner <tên người nhận> vừa nhận thêm lượt tim!" | `/kudos/{id}` |
| Secret Box granted (BoxGranted) | ic-noti-secret-box | "Chúc mừng! Bạn vừa nhận được lượt mở Secret Box mới! Click vào đây để mở ngay nhé!" | `/kudos?secretBox=open` |
| Hero tier up (computed via tierFromCount before/after) | ic-noti-hero-tier | "Bạn nhận được <X> lời nhắn gửi từ đồng nghiệp và thăng hạng <tên level>!" + line 2 "Tiếp tục lan tỏa năng lượng tích cực đến đồng nghiệp nhé!" | `/profile` |
| Kudo hidden as spam (KudoMarkedSpam, to owner) | ic-noti-spam-hidden | "Tiếc quá! Bạn có một lời nhắn bị tạm ẩn vì "vướng" một số tiêu chuẩn! Hãy xem các tiêu chuẩn và gửi lại cho đồng đội nhé!" + inline link "Tiêu chuẩn cộng đồng" (Bold 14/20 underline + arrow 24) | `/community-standards` (link), item → `/kudos/{id}` |
| 6-icon set completed (SetCompleted) | ic-noti-set-completed | "Chúc mừng bạn đã thu thập đủ 6 huy hiệu của SAA. Bạn đã nhận được phần quà từ BTC chính là <X>. BTC sẽ liên hệ để gửi quà đến bạn vào cuối sự kiện." (<X> = giftName) | `/profile` |
| Kudos Quốc Dân (NationalKudosFinalized) | (reuse ic-noti-hero-tier or set-completed — orchestrator default: set-completed) | not drawn — spec copy | `/kudos/{id}` |
- Out of scope: the admin "Có <x> lời nhắn cần bạn xem xét!" flag notice (auto-flag is out of scope, decision "manual only") and all other Figma filler rows ("lời khen từ cấp trên", "khóa học", …) which are placeholder text.
- Phase 10 constraint: never show `NationalKudosFinalized.items[].senderId` or anything derived from it.
