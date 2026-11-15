# Phase 03 visual-fidelity review (read-only)

Findings appended below as confirmed.

Score 7.5/10. Findings (warning W / suggestion S):
W1 nav active link renders white not gold: app-header-nav-links.tsx:19-21 base `text-text` ties with active `text-primary`. Fix: drop text-text from linkBase, add `${active ? activeClass : "text-text"}`; underline after:bg-text -> after:bg-text OK (Figma white 1px).
W2 dropdown rows: Figma icon sits right after label, Profile row has selected highlight; built icon far right: shell-styles.ts dropdownItem `justify-between` -> `justify-start`; keep chevron for Logout. Items in Figma are bold Montserrat (matches).
W3 login footer lacks top divider: app-footer.tsx:23 minimal variant -> `border-t border-divider`.
W4 admin top bar tone/size: admin-top-bar.tsx:28 use lighter bar (Figma ~#2b3138) e.g. `bg-container-2`/new token, h-20 -> h-22 (88px), BrandLogo className `h-16 w-auto`, add divider `<span class="h-10 w-px bg-divider"/>` before ADMIN badge, ADMIN text-title-large -> lighter weight OK.
S1 header translucency: Figma header ~85% dark over artwork. app-header.tsx:28, public-header.tsx:9: `bg-container` -> `bg-container/80` (and keep backdrop-blur); login visible only.
S2 login mobile: intro wraps "SAA / 2025." (login/page.tsx:56) -> add `text-balance` or `max-w-[335px]`/`text-[15px]`; Figma has wordmark at ~y250, button at y~645 and footer regular weight small (app-footer.tsx:18 mobile `text-body-medium font-normal`). Mobile wordmark in built sits ~100px higher: pt-16 -> pt-24 on page.tsx:44.
S3 403 (error-panel.tsx:21,31): title 56px vs Figma 48px: `md:text-display-large` -> `md:text-headline-large`; illustration ~45px lower in Figma: add `pt-8`/gap-10; build adds Vietnamese copy + button (accepted).
S4 login footer text bold white in both; fine. Account trigger ok.

Verdict: structurally faithful; W1-W4 are cheap one-line fixes. Score 7.5/10.
