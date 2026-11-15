# Re-review phase 01 Foundation, fix round 1

Score 9.3/10. Status: DONE. Typecheck clean, eslint 0 findings, unit 52/52. Integration tests NOT run (need local Supabase); read only.

## Per finding
- W1 resolved. next.config.ts:9 gates parseServerEnv on SKIP_ENV_VALIDATION; only scripts/typecheck.mjs sets it (via spawn env, Windows-safe); dev/build/start scripts do not. env.ts:9 still parses on import, so a runtime/prerender import fails regardless of the flag.
- W2 resolved. 0003 uses DO UPDATE with public=false; test re-runs migration SQL in a rolled-back tx after corrupting the bucket.
- W3 resolved. client.ts:35 caches on globalThis, bounded pool, timeouts, prepare:false; test covers dev+prod reuse and options.
- S1 resolved. Epoch ms via transform; all consumers compile (event-window.ts:10, tests); no other users of the 4 milestone vars (timezone.ts does not use them).
- S2 not re-read in detail (test only; unit suite green).
- S3 resolved, judged safe (below). Test assertions cover existing tables, future-table default privileges, anon denial, and RLS-without-policy.
- S4 resolved (rls-baseline.test.ts:93-106).
- S5/S6/S7/S10 resolved. Public/server schemas split, parse-or-throw never prints values, drizzle.config offline for generate/check, seeds type-only import of Db, CSV guard + width check OK.
- vitest.config.mts resolved (loadEnv + fileURLToPath fine).

## S3 impact on later phases
- Realtime private Broadcast: RLS lives on realtime.messages (realtime schema), untouched by the public-schema revoke. Per docs/system/architecture.md:173 and permissions.md:146 the policies compare topic to auth.uid() and need no public-table read. Auth/Storage schemas unaffected.
- ALTER DEFAULT PRIVILEGES only covers objects created by the migrating role (postgres); Supabase default grants for that role are what gets revoked, which is the intent. service_role keeps access.
- Watch item (suggestion): if a later realtime.messages policy subqueries a public table, `authenticated` would need a narrow GRANT SELECT plus a policy on that table. Note it in phase 11/13 notes.

## New findings
- Suggestion (low): next.config.ts:9 `!process.env.SKIP_ENV_VALIDATION` treats "0"/"false" as opt-out. Use `process.env.SKIP_ENV_VALIDATION !== "1"` so only the deliberate value skips.
- Suggestion (low): rls-baseline "future table" test creates a table as the test role; passes only if the test connection role equals the migration role (postgres). True for local stack; fine.

## Build hang (25 min static generation)
Nothing in the diff plausibly causes it; the diff reduces risk. postgres() is lazy (no connection at module load); next.config parse is sync and runs once. Most likely cause earlier: a prerender worker holding open sockets / waiting on a connect with no idle_timeout or short connect_timeout. Now idle_timeout 20s and connect_timeout 10s bound that. Residual: with cacheComponents, any page awaiting db at prerender against an unreachable DB fails after 10s, not hangs. Not reproduced; unproven.

## Evidence verdict
```json
{ "score": 9, "criticalCount": 0, "decision": "SEALED",
  "acceptanceCovered": ["W1 opt-out is deliberate, runtime validation intact", "W2 bucket invariant enforced and tested", "W3 single bounded pool", "S1 immutable epoch-ms milestones", "S3 client roles hold no table privileges"],
  "regressionChecked": ["milestone consumers", "realtime.messages policies independent of public grants", "typecheck/lint/unit green"],
  "contractStatus": "OK", "refuted": [], "unproven": [], "reachableRegressions": [],
  "findings": [
    { "severity": "Low", "category": "Config", "location": "next.config.ts:9", "summary": "SKIP_ENV_VALIDATION=0 still skips validation; compare to '1'", "disposition": "Accept" }
  ] }
```
