# Final recheck phase 02/03 (review fix round 2)

Status: DONE
Score: 9/10, 0 critical. Verdict APPROVE.

## Old findings
| Finding | State |
|---|---|
| W-N1 SSRF in access-denied-response.ts | Resolved. URL = `INTERNAL_APP_ORIGIN` or `http://127.0.0.1:$PORT`; request only feeds locale cookie + accept-language headers (access-denied-response.ts:26-38). `redirect: "manual"`, 5s timeout. |
| db recheck: 0005 update trigger fires on every update | Resolved. Split into `_on_insert` and `_on_email_change` (`WHEN NEW.email IS DISTINCT FROM OLD.email`), 0005:80-88. |
| Phase 03 label-in-name (language switcher, admin logo link) | Resolved. Names start with the visible text (language-switcher.tsx:57, admin-top-bar.tsx:39-43). i18n keys exist in en and vi. |
| ADMIN size / header translucency | Resolved. Title-medium and 88px band; `headerBar` shared by public and Sunner header (shell-styles.ts:10), admin keeps `bg-divider/95`. Comments record Figma refs. |
| S-N2 cache, OAuth redirectTo from Host | Accepted/deferred per instruction. |

## Checks
- SSRF closed: nothing from Host / x-forwarded-* reaches fetch. `PORT` is server-set (`start-server.js:280`). Test `session-proxy-admin-gate.test.ts:93-102` proves a spoofed Host gives an identical target.
- INTERNAL_APP_ORIGIN (env-schema.ts:46-52, 78): `z.url` limited to http/https, refine rejects path, query, hash, username and password, normalized to `.origin`; empty = unset. `env-schema.test.ts` has cases for file://, path, trailing slash. I ran it: 21/21 pass. `.env.example:30-35` documents it, no secret.
- Trigger split: INSERT is always checked. UPDATE checked when email changes, including a change to NULL (`is_sunner_email(NULL)` is false, so it fails closed). A pre-gate row with an unchanged email is no longer locked out. Both are tested (test lines 49, 56, 66, 79). Without `OF email`, the WHEN clause alone decides, which covers every route.
- Test-only trigger/function: created inside `withRollback`. Postgres DDL is transactional and `withRollback` always calls `tx.rollback()`, so a callback error also rolls back. Name `zz_` sorts after the real BEFORE INSERT trigger, so the gate fires first. No leak outside the transaction.
- Visual components: no regressions found. Tailwind tokens and i18n keys resolve. Login `-mt-20` matches the 80px header (`h-20`).
- production-admin-403-status.ts: logic is sound (free port, `next start`, raw statuses, S-N1/S-N3 variants, admin RSC control). Not executed here (needs a build and local Supabase).

## New findings
Critical: none. High: none. Medium: none.

Low:
- L1 `tests/integration/auth/auth-user-triggers.test.ts:27-30`: `create trigger` on auth.users holds a table lock until rollback, so a parallel GoTrue sign-in test can stall briefly. Same pattern already exists at line 157. Fix only if flakes appear: run this file serially.
- L2 `shared/auth/access-denied-response.ts:27`: if PORT is unset and the server binds an IPv6-only address, the self-fetch fails. It still returns 403 plain text and logs, and `.env.example` documents `INTERNAL_APP_ORIGIN`. Informational.

## Unresolved
- `test:prod` and integration suites were not run in this pass (read-only). Only the env-schema unit test was run.

```json
{ "score": 9, "criticalCount": 0, "decision": "APPROVE",
  "acceptanceCovered": ["W-N1 SSRF closed: fetch target from server config only", "INTERNAL_APP_ORIGIN rejects path, credentials, non-http schemes", "0005 domain gate blocks INSERT and any email change without locking out unchanged-email updates", "test-only trigger is rolled back with its transaction", "label-in-name, ADMIN size, header band fixes present"],
  "regressionChecked": ["session proxy 403 flow and locale-only forwarding", "profile email sync trigger", "language switcher, admin top bar, app/public header, login page", "env-schema unit tests 21/21"],
  "contractStatus": "OK", "refuted": [], "unproven": [], "reachableRegressions": [],
  "findings": [
    { "severity": "Low", "category": "Test", "location": "tests/integration/auth/auth-user-triggers.test.ts:27-30", "summary": "test-only trigger DDL locks auth.users until rollback; possible stall with parallel sign-in tests", "disposition": "Defer" },
    { "severity": "Low", "category": "Config", "location": "shared/auth/access-denied-response.ts:27", "summary": "default 127.0.0.1 target fails on IPv6-only bind; falls back to plain 403 and is documented", "disposition": "Defer" }
  ] }
```
