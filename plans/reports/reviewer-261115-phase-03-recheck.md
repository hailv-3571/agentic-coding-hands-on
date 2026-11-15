# Phase 03 app shell recheck (after fix round 1)

Score: 9/10. Status: DONE. No critical, no warning.

## Old findings
Logic report:
- W2 email as display name: RESOLVED. shell-session.ts:17-21 falls back to the email local part only, and only when fullName is blank.
- W3 aria-haspopup: RESOLVED. account-menu.tsx:47-58 and language-switcher.tsx:52-58 use aria-expanded + aria-controls only.
- S2 locale cookie flags: RESOLVED. set-locale-action.ts:22-28 sets httpOnly, sameSite=lax, secure in production. Input is zod-validated, cookie failure is caught and returns ok:false.
- S3 language switch failure silent: RESOLVED. language-switcher.tsx:37-47 catches the result and the throw, then renders role=alert (:92-99). The switchFailed key exists in en and vi. The alert clears on the next open or select.
- S5 admin logo label-in-name: RESOLVED. admin-top-bar.tsx:36-41: the name is alt + visible "ADMIN" + sr-only backToApp, so the visible text is contained in the name.
- Duplicate profile read: RESOLVED. session-profile-query.ts:25 wraps findSessionProfile in React cache(). The guards, getShellUser and the onboarding page all go through it. A fresh request still reads the DB, so BR-003 holds. Outside a render (proxy, tests) it is a plain call.

Visual report:
- W1 active nav gold: RESOLVED. app-header-nav-links.tsx:19-24 has no text colour in the base. Idle is text-text, active is text-primary with glow. The screenshot shows a gold active link with a white underline, matching Figma.
- W2 dropdown rows: RESOLVED. shell-styles.ts dropdownItem has no justify and uses gap-3, so the icon sits next to the label, with a hover highlight. account-menu-admin-desktop matches dropdown-profile-admin-721-5277.
- W3 footer top rule: RESOLVED. app-footer.tsx:23 and :34 have border-t border-divider. Visible in the screenshot, matching the Figma crop.
- W4 admin bar: RESOLVED. admin-top-bar.tsx:31-39 uses a lighter bar, h-22 (88px, matches the screenshot), h-16 logo and a divider before ADMIN. It matches Figma closely.

## Kept deviations
- 403 title at display-large (~57px): ACCEPTABLE. The Figma frame is 1438px wide, the same scale as the build, and the Figma title cannot be proven to be 48px. The earlier 48px claim was an estimate. The layout is equivalent: the build adds a CTA and Vietnamese copy, and its title/illustration sit about 35px higher, mostly because the Figma description wraps to two lines.
- Admin bar divider #2e3940 instead of #2c2f31: ACCEPTABLE. It is the existing token and slightly bluer than the Figma grey. Imperceptible, and it avoids a one-off colour.

## New findings
- suggestion: language-switcher.tsx:57 and :79. The visible text is "VN"/"EN", but aria-label is "Language: Tiếng Việt" / "Tiếng Việt". Label-in-name (WCAG 2.5.3) fails for voice control. Fix: put the code in the label, e.g. `${t("label")} ${code(current)}: ${t(current)}` and `${code(locale)} ${t(locale)}`. Same class as the old S5.
- suggestion: admin-top-bar.tsx:39. ADMIN renders at title-large and looks larger than the Figma label (~18px). Cosmetic.
- suggestion (carried from visual S1, not in this round's scope): the header is opaque, while Figma is translucent over the artwork. No bell in the header crop, since bellSlot is for a later phase.

No type, security or error-handling issues found in the 9 files. Verified by reading only; typecheck and tests were not run.
