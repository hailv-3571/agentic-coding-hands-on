# rebuild-spec orchestrator log (core pass + scoped feature-specs pass)

Task tools (TaskCreate/TaskUpdate) unavailable in this harness; waves tracked here instead.

## Preflight decisions
- Python: C:\Users\luong.viet.hai\AppData\Local\Programs\Python\Python312\python.exe (PYTHONUTF8=1); no kit venv.
- Graph: REBUILD_NO_GRAPH=1 / GRAPHIFY_DISABLE=1 → graph_preflight "disabled (env opt-out) -> vanilla".
- Stack profile: detector recommended `oracle-plsql` (38 Supabase SQL migrations) — pinned `--profile web-js-ts` (Next.js app; skill's documented co-detect escape hatch). state_staleness.stale=true (advisory, no profile persisted).
- auto_switch=false (single component).
- docs_root: `docs` (existing corpus, state file, canonical fcodes all at docs/ root). Resolver would give docs/vi for primary_lang=vi; not used — see report.
- Prose language: vi (state.primary_lang), English skeleton.
- W0.4 route probe: not triggered (no bootable lockfile, no --probe-routes) → Tier-2 static parse.
- Planner: mode=full, fallback=sha_unreachable.

## Waves
- W0 scout: 555 files, 34 BL inventory entries.
- W1: system-overview, architecture (single); data-model SHARD (5 slices, 16 entities; 2 fan-out researchers); route-list SHARD (8 slices, 54 rows; 2 fan-out researchers).
  - route-list merge OK; W1.1 validate_route_list PASS.
  - data-model merge OK; renumber swapped MODEL003↔MODEL004 (first-appearance); contiguity PASS; W1.5 reviewer passed (0 issues, 4 warnings).
- W2 combined (18 screens < 30): 20 SCR, 7 REG, 34 BL. 8 prior SCRs (006,015-018,020,021,025) reclassified as REG/components.
  - renumber screen-list: SCR007→006 … SCR028→020 (renumber-map-screen-list.json). BL no-op.
  - contiguity SCR WARN (2 REG gap warnings), BL PASS; validate_screen_list PASS; validate_screen_flow PASS; validate_behavior_logic PASS.
- W2.9 api-map (single, est 108 LOC): validate_api_map PASS.
- W3 permissions: 38 PERM, 4 roles; renumber no-op; contiguity PASS.
- W4 user-stories: SHARD (est 990 LOC); ranges admin 1-6, guest 7-12, scheduler 13-18, sunner 19-24.
</content>
</invoke>
  - W4 shell IPE: 48 stories → ranges re-allocated per algorithm (admin US001-018/15, guest US019-021/2, sunner US022-059/31; scheduler none — non-human).
  - fan-out: admin+guest (1 agent), sunner split into 2 contiguous sub-fragments (03-sunner.a/.b) under one anchor.
  - merge OK (48); renumber compacted to US001-048; contiguity PASS; W4.5 passed (0 issues, 0 warnings).
- W5 feature-list: SHARD (24 F### est, 1008 LOC) → grouping-once shell dispatched with F001-F015 stability constraint.
  - W5 shell: 15 features, F001-F015 codes/names/priorities kept, no new feature, 0 orphans; types adjusted to SCR/BL ownership (F003/F004/F006 ui→mixed, F005/F007 →ui, F009 →background).
  - expand fan-out 3 batches; merge OK (15); F### integrity gate OK; renumber no-op; contiguity PASS.
  - canonical-fcode post-step: 15 slugs identical to existing docs/features dirs; .pending folders created; W5.5 existence PASS.
  - session context feature_count=15 (build_session_context.py atomic rename fails on Windows when target exists — used --out temp + mv).
- W5.6 feature-list reviewer dispatched.
- W5.6 #1: passed=false (1 critical C1: F010 also holds Kudos Quốc Dân job BL032/MODEL014; 3 warnings).
  - athena counsel → Option B (keep in F010; restate F010 outcome as sender rewards earned from hearts — evidence: messages/vi.json rules + national_kudos notification copy, published F010 FR-406/CAP-06, docs/generated/feature-list.md:308). Option A (new F016) rejected: zero-US feature, F015↔F016 renumber swap at honest P2, no spec in scoped run.
  - implementer (balanced: sonnet / general-purpose-high) edits feature-list.md F010 block only; then re-run W5 post-step + W5.6. If re-flagged → BLOCKED (user decision).
  - Backlog: next full run should add system US for scheduler jobs (BL028/032/033/034).
  - fix applied; W5 post-step rerun: renumber {} , contiguity PASS, canonical 15 slugs unchanged, W5.5 PASS.
  - W5.6 #2: passed=true (0 critical, 3 warnings W1-W3: shared-infra BL single owner, prelaunch gate in F006, BL014 in F009). cycle-1 report kept as feature-list-review.cycle1.md.
- W7a core-artifact review dispatched (11 artifacts).
- W7a: failed=0, warnings=19 (PASS). W7-merge (deterministic transform per task spec) → review-report.md PASS. W7.5 structural_fixer: 0 fixes. W8 not entered.
- Post-W8 contiguity (report-only): all PASS except screen-list WARN (2 REG-gap warnings).
- W9 pre-flight: validator overall WARN, failed=0, missing=0 → proceed. POPULATED_BY_W6 stubbed. W9.5a deployment view WARN (no IaC).
- promote_drafts.py failed on Windows (os.rename over existing file, WinError 183, 0 files landed) → re-run unmodified via scratchpad shim run_with_posix_rename.py (os.rename=os.replace). 12 core docs promoted to docs/.
- RT-M3 OK; 12 confidence reports; W9.5 cursor core → last_rebuild_sha=6e34454 (HEAD moved during run: test-only commit by another session).
- W9.5b traceability matrix built + validated PASS; W9.6 navigation READMEs; translation sync: "Secondary languages: none registered"; check_translation_gate core exit 0; wave9-complete.flag written (doc-writer).
== FEATURE-SPECS PASS (--features F006,F008,F010,F012,F013,F014,F015) ==
- decide_action_chunking (on published specs; plan dirs empty): all chunk=false (3-8 actions < 15).
- FS.1 wave 1: F006, F008, F010, F012, F013; wave 2: F014, F015.
- FS.1 wave 1 done: F006 (519/324 lines), F008 (611/255), F010 (996/271), F012 (735/289), F013 (948/347); each self-ran validators: 0 critical; state_rung_missing warnings on F010 (A5,A6,A10), F012 (A1), F013 (A5,A13).
- FS.1 wave 2 dispatched: F014, F015.
- FS.1 wave 2 done: F014 (524/315), F015 (477/255); 0 issues.
- FS.2: pipeline's `--plan-dir … --spec F###` form is rejected by argparse (mutually exclusive); ran --plan-dir (scoped de facto: only the 7 drafted dirs have specs). fs-validation-summary overall WARN: 0 critical; state_rung_missing warnings F010×3, F012×1, F013×2; source_citations / screen_link / api_link / reading_guide PASS. No FS.2 fix cycle.
- FS.1.5: {POPULATED_BY_W6} already stubbed by core W9 in both draft + docs screen-flow → replacement no-op; fragments removed per pass ref (audit copy _feature-entry-points.scoped-run-copy/). Feature Entry Points section stays stubbed (gap).
- FS.5: 2 reviewer batches (F006-F013, F014-F015) dispatched.
- FS.5: batch-01 (F006,F008,F010,F012,F013) failed=0 warnings=9; batch-02 (F014,F015) failed=2 warnings=3 → merged feature-review-report.md failed=2 → FS.6 cycle 1: 2 per-file implementer fixes (F014, F015 technical-spec § 5.1 SC coverage), balanced tier (sonnet/general-purpose-high).
- FS.6 cycle 1: F014 (+SC-012/013), F015 (SC-001/010 extended, +SC-011); FS.2 re-run PASS for both; re-reviewer: C1/C2 FIXED → failed=0, warnings=12 (carried), missing=0.
- FS.7: gate OK (validator WARN, failed 0, missing 0); promote_drafts --scope features (shim) → 14 files; 7 confidence reports; docs/features/.stale cleared; cursor feature-specs → last_feature_spec_run_sha=6e34454, reverse index 106 entries; fs7-complete.flag; navigation refreshed; "Secondary languages: none registered"; check_translation_gate feature-specs exit 0.

== FEATURE-SPECS PASS 2 (--features F001,F002,F003,F004,F005,F007,F009,F011) — 2026-11-24 ==
- Notice: [BEHAVIOR CHANGE v5] --features now runs the standalone feature-specs pass (was: default-pipeline W6 narrowing)
- Preflight OK (feature-list.md, entities.md present; no flows/glossary stale markers). docs_root=docs, profile web-js-ts, REBUILD_NO_GRAPH=1.
- Pass-1 review/validation artifacts archived to _archive-fs-pass1-F006-F015/.
- decide_action_chunking (published specs): all chunk=false (4-8 actions).
- FS.1 wave 1 dispatched: F001, F002, F003, F004, F005.
- FS.1 F005 done (547/247 lines; validator 0 critical 0 warning).
- Side work during FS.1 (docs/ OOB edits, verified against code): docs/_canonical-fcodes.json synced from plan canonical; ROUTE018 owner → F003, F004, F007 (route-list, feature-list F004/F007, both canonical JSONs); pass-1 feature warnings W1-W12 fixed in docs/features/F008/F012/F013/F014/F015; core W7a warnings W6/W7/W8/W9/W10/W11/W15/W16/W18 fixed in docs/generated + docs/system.
- FS.1 wave 1: F001 (717/289; 0 crit, 2 state_rung_missing warn), F002 (556/330; 0/0), F004 (664/397; 0/0), F005 (547/247; 0/0) done; F003 running.
- F004 draft aligned to ROUTE018 shared ownership (A10 cites ROUTE018).
- Footer copy fixed in screen-list/screen-flow/user-stories ("Tiêu chuẩn chung", shell.nav.*) per F002 finding.
== SCREEN-SPECS PASS (--screen-specs) started in parallel (pass is parallel-safe; global cap respected: F003 + 4 SS.1 = 5) ==
- Preflight: screen-list.md present, 20 SCR; all affected (renumber changed every section; old docs/screens are takumi drafts).
- SS.1 batches 01-04 dispatched (5 screens each). FS.1 wave 2 (F007, F009, F011) queued until slots free.
- FS.1 F003 done (880/381; 0 crit, 2 alg_file_schema_missing warn). Wave 1 complete. F007 dispatched (slot freed). PERM025 clarified (edit-load route has no write-window check).
- SS.1 batch-01 done (SCR001-005). Verified+applied: screen-flow SCR002 account-menu exits (Profile/Dashboard/Logout, table+mermaid), SCR003 header/footer triggers; Login label 'LOGIN With Google' in feature-list/screen-list/user-stories. Left [UNVERIFIED] in specs: SCR005 guest branch reachability, SCR004 prelaunch exit. F009 dispatched.
- SS.1 batch-02 (SCR006-010) and batch-03 (SCR011-015) done. Verified+applied to docs/generated: screen-flow SCR010→SCR001 trigger (typed URL), SCR007/REG003→SCR015 row, SCR015 self-exit row, Rules Đóng logic (Navigation API first); screen-list SCR013 anonymous display, SCR014 CampaignTable (no status column, phase active), SCR015 'Đã nhận: {count} Kudos'. F011 dispatched.
- FS.1 F009 done (420/180; 0 crit). US040 screens += SCR006 (KudoDetail uses KudoCardPeople).
- SS.1 batch-04 (SCR016-020) done; SS.1 complete. SS.2 batches 01-04 dispatched (01-03 first, 04 after F007 freed a slot).
- Batch-04/F007 findings verified+applied: requireSunner onboarding redirect has no `next`; SCR020 `unexpected` error; SCR019 date range navigates on single end; SCR018 12 cols incl ID, own-row role button locked, unit-options error keeps fixed entries, demoted-admin row; SCR013 export 422 → tooLarge toast. F007 route-list claim (proxy role gate on /api/admin) checked: route-list does not claim it — no change.
- FS.1 F007 done (697/347; 0/0).
- FS.1 F011 done (427/270; 0/0). FS.1 COMPLETE (8/8).
- FS.2 (combined fs-validation-summary.json): overall WARN, 0 critical; warnings F001 state_rung_missing ×2, F003 alg_file_schema_missing ×2 (accepted by authors), F009 link.pre_migration (background feature, no SCR); F010/F012/F013 warnings are pass-1 drafts (not in scope). No FS.2 fix cycle.
- FS.5 batches 01 (F001-F005) and 02 (F007, F009, F011) dispatched.
- FS.1.5 done manually: 15 fragments (8 new + 7 pass-1 audit copies) consolidated into docs/generated/screen-flow.md § Feature Entry Points, replacing the HTML stub + template brace text; REG refs normalized to SCR###_Slug/REG###_Slug; SCR002 route fixed to /admin shell. validate_screen_flow PASS.
- Screen drafts: 35 screen-flow.md:NN citations re-pointed by content (script + 6 manual overrides) after the insert shifted lines.
- SS.2 batch-01 PASS (0/7), batch-03 PASS (0/4). SCR005 guest branch corrected in screen-flow/screen-list (only reachable by session without profile).
- SS.2 batch-02 FAIL (1 critical C1: SCR010 out-of-range cites) → fixed directly (6 ranges). Own scan of all drafts + docs for out-of-range file:line cites (validator misses these): 16 in screen drafts fixed (clamped whole-file ranges, 4 partial ranges re-pointed), 2 in docs/generated/permissions-matrix.md (callback route) fixed. Re-scan: 0.
- SS.2 batch-04 PASS (0/8). SS.2 merged: failed 0 (after C1 fix), warnings 25 → one fix agent dispatched for all screen warnings.
- FS.5 batch-01: failed 5 (C1-C5 FR→SC coverage holes F001-F005), warnings 4. FS.6 cycle 1: fixers dispatched F001, F002, F003 (F003 also W1 links); F004/F005 queued for free slots.
- FS.5 batch-02: failed 3 (C1-C3 FR→SC holes F007/F009/F011), warnings 3. Merged feature-review-report.md: failed 8, warnings 7. F004 fixer dispatched.
- FS.6 cycle 1: 8 per-file fixes done (F001-F005, F007, F009, F011; incl. W1 F003 links, W2 F004 trailer + region refs, W3 F005, F007 W1/W2, F009 trailer). Mechanical FR→SC diff empty for all 8; FS.2 re-run 0 critical (WARN). Re-reviewer dispatched. Note: peak concurrency briefly hit 6 agents (screen fixer + 5 FS.6 fixers) — miscount, over the 5 cap by one.
- FS.7 + SS.3 promoted (16 feature files, 20 screen specs). 22 stale docs/screens dirs deleted. Cursors → b68d523; stale screen_spec_shas keys removed. Traceability rebuilt (PASS), navigation refreshed, translation gates exit 0. Final grep clean. Report: plans/reports/rebuild-spec-261124-screen-sync-and-fixes.md
