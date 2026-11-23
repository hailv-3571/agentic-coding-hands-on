# Figma — Admin User management + Overview (phase 14 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C` — User list 773:26403, Overview 620:7712 (table 620:24669), date range picker 860:14284 / 2492:9140, filter dropdowns 1002:15708 (Unit), 1002:15711 (Level), 1002:15714 (Role); orchestrator 2026-11-23.
Screenshots in `research/figma-frames/`: `admin-users-773-26403.png`, `admin-overview-620-7712.png`, `admin-overview-table-620-24669.png`, `admin-users-2492-9140.png` (2-month calendar), `admin-users-dropdown-1002-157{08,11,14}.png`. Open them with the Read tool.

Use the existing admin frame (`app/admin/layout.tsx`, top bar Overview · Review content · User · Settings — label "User" per decision log), and reuse the phase 08 Review content table/filter/dropdown/pagination components and tokens (same header cell, row, select, search, Export button, sort carets). Figma's grey page background is a canvas — keep the admin frame background. Date ranges: native date inputs styled like phase 06 (decision 2026-11-16) instead of the AntD calendar.

## User (773:26403)
- Title "User" (same treatment as "Review content") + Export button (bg `#FFEA9E`, rounded 4, p16).
- Filters: "Unit" select ("Chọn phòng ban", wide ~210) · "Level" select ("Chọn Level", ~110: New/Rising/Super/Legend Hero) · "Role" select ("Chọn Role", ~100: Admin/User — list style as 1002:15714: bg `#00070C`, 1px gold border, rounded 8, items centred, selected bg `rgba(255,234,158,0.2)`) · search box right ("Search").
- Table columns: ID · User (name, wraps) · Email (wraps) · "∑ sent Kudos (100)" sortable · "∑ Received Kudos (100)" sortable · "Total Heart" sortable (values in red `#D4271D`) · "Level" sortable (Hero tier) · "Number of Badges" sortable (icons owned 0–6) · "Time to get 6 Badges" sortable (dd/MM/yyyy HH:mm, 2 lines) · "Last Logged in" sortable (same format) · Role ("Admin"/"User") · Actions (⋯ 24 in a circle → row menu like phase 06: change role Admin↔User; the last admin can't be demoted).
- The "(100)" in headers = column total for the current filter (orchestrator default).
- Pagination as phase 08.

## Overview (620:7712)
- Title "Overview" + date range (2 dates with an arrow + calendar icon, w256) + Export.
- Table: No · Unit · Total member · Total sent kudos · Total received kudos ("reveived" typo in Figma → "received") · Total user have at least kudos ("atleast" → "at least 1 kudo") · Total received secret box. First row "All" = totals; then one row per department (CECV1, CECV2, …). Header cells with left dividers, zebra rows (`rgba(16,20,23,0.8)` / `#00070C`), text Regular 14/20 white.
