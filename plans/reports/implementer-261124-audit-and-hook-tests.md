# Implementer report — dev-dep audit, notification hook tests, hover-card toast e2e

Date: 2026-11-23 · Branch: main (no git writes)

## Scope Contract
- **Changed** — `package.json` / `package-lock.json` (lint tooling bump via `npm audit fix`; 3 exact-pinned test devDeps), 2 new unit test files, 1 e2e assertion.
- **Impacted** — `npm run lint` (typescript-eslint/minimatch), unit runner (new per-file `happy-dom` env), the hover-card spec.
- **Will verify** — tsc, lint, `test:unit`, touched spec `--repeat-each=3 --workers=3`, full Playwright once.
- **Deliberately skipped** — integration project and `db:reset`: no bumped package is loaded by them (typescript-eslint/minimatch are lint-only; the new deps are test-env only and opt-in per file).

## 1. Dev-dependency audit (`npm audit fix`, no `--force`)

| Package | Before | After |
|---|---|---|
| typescript-eslint, @typescript-eslint/{eslint-plugin,parser,type-utils,typescript-estree,utils,types,scope-manager,visitor-keys,project-service,tsconfig-utils} | 8.72.1 | 8.73.0 |
| minimatch (under @typescript-eslint/typescript-estree) | 10.2.6 | 11.0.9 |
| brace-expansion (under that minimatch) | 5.0.12 | 5.0.13 |
| ignore (under @typescript-eslint/eslint-plugin) | 7.0.14 | 7.0.16 |
| @isaacs/nonrecursive-glob-match (new transitive dep of minimatch 11) | — | 1.1.0 |

`package.json` was not changed by the audit fix (lockfile only).

| Audit | Before | After |
|---|---|---|
| `npm audit` | 11 moderate | **4 moderate** (0 low/high/critical) |
| `npm audit --omit=dev` | 0 | **0** |

Remaining 4 are all upstream in drizzle-kit: `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99) via `@esbuild-kit/core-utils` → `@esbuild-kit/esm-loader` → `drizzle-kit`. drizzle-kit 0.31.11 is already the `latest` dist-tag; npm's only "fix" is `--force` to drizzle-kit 0.18.1 (a breaking downgrade). They stay (dev-only CLI, dev-server advisory, never in the prod bundle).

Post-fix: `npx tsc --noEmit -p .` exit 0; `npm run lint` exit 0.

## 2. Notification hook tests

Pure logic (`appendNotificationPage`, `mergeFirstNotificationPage`, mark-read helpers) was already extracted to `features/notifications/lib/notification-list-merge.ts` and tested. What stayed uncovered is orchestration that only exists inside the hooks (stale-response sequencing, optimistic mark/revert, locally-read overlay, loadMore guard, abort on unmount, channel join/rejoin/teardown), so it is proven by rendering the hooks. No production code changed and no test-only exports were added.

New exact-pinned devDeps (all published ≥ 2 weeks ago, React 19 peer-compatible):
- `@testing-library/react` 16.3.3 (+ required peer `@testing-library/dom` 10.4.2)
- `happy-dom` 21.0.4

Opt-in per file with `// @vitest-environment happy-dom`; `vitest.config.mts` is unchanged (node stays the default).
New transitive packages: aria-query, dom-accessibility-api, lz-string, pretty-format (+ react-is 17, ansi-styles 5), @babel/runtime, dequal, ansi-regex, entities 7, whatwg-mimetype, buffer-image-size, ws 8.23.0 (+ @types). `ws` is hoisted to the top level but only happy-dom depends on it. On Node 24.20 `@supabase/realtime-js` uses the native `WebSocket` first and never imports `ws`, so the integration project still needs no re-run.

Mocked only at the network boundary:
- `fetch` (stubbed global; the real `fetchNotificationPage` builds the URLs), aborting rejects with `AbortError` like the browser.
- The read-state Server Actions module (POST round trips).
- `browserSupabase()` returning a fake client (auth/session, `realtime.setAuth`, `channel`, `removeChannel`).

Files:
- `tests/unit/notifications-ui/use-notification-list.test.ts` (150 lines, 7 tests): first page on mount and cursor append with a double-`loadMore` guard; stale first-page response dropped after a newer refresh; error state → `reload` → ready, and a failed refresh keeps rows and `ready`; optimistic `markRead` reverted on `{ ok: false }`; a locally read row stays read over a refetched page; `markAllRead` reverts only the rows it changed when it throws; unmount aborts the in-flight request without logging.
- `tests/unit/notifications-ui/use-notification-channel.test.ts` (161 lines, 5 tests): joins `notifications:{userId}` (private) after `setAuth(token)`, resync on every SUBSCRIBED, only valid signals forwarded; latest handlers used without rejoining; offline leaves / online joins fresh and the old channel's late status is ignored; visible tab → resync, TOKEN_REFRESHED → `setAuth`; unmount tears down (channel, auth subscription, listeners) and an unmount before the session resolves never joins.

### Each test proven to fail
18 single mutations of the hooks (at least one per test), run against only the targeted test. All 18 were CAUGHT (`1 failed`, the targeted test, not a compile error). After every run the file was restored and its sha256 compared: identical (list `ce277c2c…18d0`, channel `df06890f…302a`); `git status features/` is clean.

### Coverage (`npx vitest run --project unit --coverage`, include scoped to the two hooks)

| File | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| use-notification-list.ts — before | 0% | 0% | 0% | 0% |
| use-notification-list.ts — after | 94.94% | 78.37% | 100% | 96.10% |
| use-notification-channel.ts — before | 0% | 0% | 0% | 0% |
| use-notification-channel.ts — after | 96.22% | 87.50% | 100% | 97.72% |
| **Both** — after | 95.39% (145/152) | 81.96% (50/61) | 100% (45/45) | 96.69% (117/121) |

Left uncovered on purpose: list L120-122 (`loadMore` failure → `moreStatus: "error"`, a one-line state set) and channel L47 (realtime auth-failure log line).

## 3. Hover-card "Gửi KUDO" toast e2e

`tests/e2e/profile-hover-card.spec.ts` (145 lines): after the composer closes, asserts
`page.getByRole("status").filter({ hasText: "Đã gửi Kudo thành công!" })` is visible. The copy is `kudosComposer.toast.created` in `messages/vi.json`, shown by `KudoComposerToastHost` (role=status live region). Same locator pattern as `compose-kudo-guards.spec.ts:38`.
Proven to fail: with the `showToast(...)` call removed from `kudo-composer-modal.tsx`, the test failed at spec:95 ("element(s) not found"); the modal was restored byte-identical.

## Gates (serial)

| Gate | Result |
|---|---|
| `npx tsc --noEmit -p .` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test:unit` | 88 files / 955 tests passed (was 86 / 943) |
| `profile-hover-card.spec.ts --repeat-each=3 --workers=3` | 15/15 passed |
| `npx playwright test --timeout 90000 --workers=3` (full, once) | 142 passed, 5 skipped (prelaunch-gate, need the future-LAUNCH_AT server; skipped before this change too), 0 failed, 3.1 min |

## Notes
- Docs impact: minor. `docs/project-changelog.md` could record the lint-tooling bump and the per-file `happy-dom` opt-in for hook tests. Not touched here because another agent owns docs/ for now.
- npm 11.19 prints "install scripts not yet covered by allowScripts" for esbuild/@parcel/watcher/@swc/core. The warning is about packages that were already installed and was not caused by this change; lint, unit and e2e all ran normally.

## Unresolved questions
- None.
