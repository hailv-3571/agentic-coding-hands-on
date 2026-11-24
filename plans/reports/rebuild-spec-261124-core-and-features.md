# rebuild-spec run — core pass + scoped feature-specs pass (F006, F008, F010, F012, F013, F014, F015)

Date: 2026-11-24 · Skill: `rebuild-spec` (invoked via Skill tool) · Plan: `plans/261108-0048-saa-2025-kudos-platform/`
Drafts/audit: `plans/261108-0048-saa-2025-kudos-platform/artifacts/` (wave-by-wave log: `artifacts/_orchestrator-log.md`)

## 1. Outcome

| Pass | Result | Promoted |
|---|---|---|
| Core (`/tkm:rebuild-spec`, full) | W9 complete, `wave9-complete.flag` written | 12 core docs under `docs/system/` + `docs/generated/` |
| Feature-specs (`--features F006,F008,F010,F012,F013,F014,F015`) | FS.7 complete, `fs7-complete.flag` written | 14 files: `docs/features/<slug>/{functional-spec,technical-spec}.md` × 7 |

F### codes F001–F015 and their slugs are unchanged. `primary_lang` stays `vi`. State: `last_rebuild_sha` and `last_feature_spec_run_sha` = `6e34454`.

## 2. Preflight decisions (needed for the run to proceed — please confirm)

1. **Python**: used `…\Python312\python.exe` with `PYTHONUTF8=1`. There is no kit venv; `graph_preflight.py` ran with `REBUILD_NO_GRAPH=1` and reported `graphify: disabled (env opt-out) -> vanilla`.
2. **Stack profile**: the detector recommended `oracle-plsql`, because the 38 Supabase `.sql` migrations gave it 38 hits against 1 for web. That profile would have skipped route-list, screen-list, screen-flow and api-map. I pinned `--profile web-js-ts`, which is the skill's documented escape hatch for a co-detected stack. `state_staleness.stale=true` was advisory only.
3. **docs root = `docs/`**. The skill's resolver gives `docs/vi/` for a vi-primary repo. But the existing corpus, `docs/.rebuild-state.json`, `_canonical-fcodes.json`, the takumi-promoted feature dirs and your brief (`docs/generated/entities.md`) are all at `docs/`. I passed `--docs-root docs` explicitly and left primary_lang `vi` untouched.
4. **W0.4 route probe**: not triggered (no bootable lockfile, no `--probe-routes`), so W1 used Tier-2 static parse. No AskUserQuestion was needed.
5. **Windows script defect (workaround, kit unmodified)**: `promote_drafts.py` and `build_session_context.py` do an atomic write with `os.rename(tmp, dst)`, which raises WinError 183 when `dst` already exists. The first promote attempt landed 0 files. I re-ran the unmodified scripts through a scratchpad shim that sets `os.rename = os.replace` for that process, and used the shim for every later writer script. The shim is `C:\Users\LUONGV~1.HAI\AppData\Local\Temp\claude\f605afcff50411c6\5c46b238-9b6f-4d91-82b8-f6b58641adf3\scratchpad\run_with_posix_rename.py`. The kit should switch to `os.replace`.
6. **Task tools** (TaskCreate/TaskUpdate) are not available in this harness. I tracked the waves in `artifacts/_orchestrator-log.md` instead.

## 3. What ran — core pass

| Wave | What happened | Gate result |
|---|---|---|
| W0 scout | 555 files inventoried, 34 BL entries (all `[SIGNAL_INFERRED]`, since Next.js+Supabase has no pattern row) | — |
| Planner | mode=full (`sha_unreachable`) | — |
| W0.5 | `_session-context.md` (prose vi), `_scout-bl-inventory.md` | — |
| W1 | system-overview, architecture (single task each); data-model **SHARD** (5 slices, 16 entities); route-list **SHARD** (8 slices, 54 rows) | W1.1 route-list PASS · data-model renumber swapped MODEL003↔004 (first-appearance order) · contiguity PASS · W1.5 reviewer passed (0 issues, 4 warnings) |
| W2 (combined; 18 screens < 30) | 20 SCR, 7 REG, 34 BL (1:1 with inventory) | screen-list PASS · screen-flow PASS · behavior-logic PASS · SCR contiguity WARN (2 REG-gap warnings) |
| W2.9 api-map | single task (est 108 LOC) | `validate_api_map` PASS |
| W3 permissions | 38 PERM, 4 roles (guest, sunner, admin, scheduler) | contiguity PASS |
| W4 user-stories | **SHARD**. The IPE pass found 48 stories, so the emitted ranges (6 per actor) were re-allocated by the algorithm. Scheduler got none (non-human). | renumber to US001–048 · contiguity PASS · W4.5 passed (0 issues, 0 warnings) |
| W5 feature-list | **SHARD** (grouping once, then 3 expand batches). 15 features, no new feature. | integrity gate OK · renumber no-op · contiguity PASS · canonical post-step: 15 slugs identical to existing dirs · W5.5 PASS |
| W5.6 | **Cycle 1: `passed:false`** with 1 critical (C1: F010 also holds the Kudos Quốc Dân job). After athena counsel I took Option B: kept it in F010 and restated F010's single outcome as "rewards for senders earned from hearts", which matches the product copy and the published FR-406. An implementer fixed `feature-list.md` and the W5 post-step was re-run (renumber `{}`). **Cycle 2: passed** (0 critical, 3 warnings). | — |
| W7a | One reviewer, 11 artifacts, about 150 citations spot-checked | **failed 0, warnings 19** |
| W7-merge / W7.5 / W8 | Merge applied as the deterministic transform the task spec defines; structural_fixer made 0 fixes; W8 not entered (failed=0) | review-report PASS |
| W9 | Pre-flight gate OK; `{POPULATED_BY_W6}` stubbed; W9.5a deployment view WARN (`no_iac`); promote (via shim) of 12 docs; RT-M3 OK; 12 confidence reports; W9.5 cursor; W9.5b traceability matrix built, validator PASS; W9.6 navigation; translation sync; `check_translation_gate` exit 0; doc-writer wrote `wave9-complete.flag` (hashes verified) | — |

Batching note: to stay within the 5-agent cap I gave some fan-out researchers several slices each (route-list 2 agents × 4 slices, data-model 2 agents, W4 admin+guest in one agent). The 31-story sunner slice was split into two contiguous sub-fragments under one anchor. Every slice still wrote its own fragment file and was merged by the recipe, with an `expected_count` completeness check.

## 4. What ran — feature-specs pass (scoped)

- Notice: `[BEHAVIOR CHANGE v5] --features now runs the standalone feature-specs pass (was: default-pipeline W6 narrowing)`.
- Preflight passed: feature-list.md and entities.md present, no stale flows or glossary markers.
- **Chunking:** `decide_action_chunking.py` gave chunk=false (3–8 actions < 15) for all 7. The plan dirs were empty, so it was run against the published specs.
- **FS.1** used 2 chained waves: (1) F006, F008, F010, F012, F013, then (2) F014, F015. One researcher per feature drafted both files, removed `.pending` and wrote an entry-point fragment.
- **FS.2** validators:
  - The pipeline's `--plan-dir … --spec F###` form is rejected by argparse (the options are mutually exclusive), so I ran `--plan-dir`. It only covers the 7 drafted dirs.
  - `fs-validation-summary.json` overall **WARN**: 0 critical.
  - Six `FeatureSpec.state_rung_missing` warnings: F010 A5/A6/A10, F012 A1, F013 A5/A13.
  - source_citations, feature_screen_link, feature_api_link and reading_guide all PASS.
- **FS.1.5** was a no-op. The core W9 had already replaced `{POPULATED_BY_W6}` with an HTML stub, so the replacement in the pass reference matched nothing, and the Feature Entry Points section is still the stub (see §8). The fragments were removed per the reference; an audit copy is in `artifacts/_feature-entry-points.scoped-run-copy/`.
- **FS.5** reviewer batches:
  - batch-01 (F006–F013): failed 0, warnings 9.
  - batch-02 (F014, F015): failed 2. Both were FR→SC coverage holes.
  - Merged report: failed 2.
- **FS.6** cycle 1:
  - 2 per-file implementer fixes at the balanced tier (sonnet on `general-purpose-high`). F014 got SC-012 and SC-013; F015 got SC-001 and SC-010 extended plus a new SC-011.
  - FS.2 re-run gave PASS for both.
  - Re-reviewer: both FIXED, giving **failed 0, warnings 12, missing 0**.
- **FS.7**:
  - Gate OK, then promote via the shim (14 files) and 7 confidence reports.
  - `docs/features/.stale` cleared.
  - Cursor `feature-specs`: reverse index 106 entries.
  - `fs7-complete.flag` written and navigation refreshed.
  - Translation sync reported "Secondary languages: none registered"; `check_translation_gate` exited 0.

## 5. Files changed under docs/ (uncommitted; 20 modified, 49 new)

- **Rewritten core docs (M):**
  - `docs/system/architecture.md`: the takumi forward draft was reconciled to as-built (737-line diff), as designed for the core pass.
  - `docs/system/permissions.md`.
  - `docs/generated/feature-list.md` and `screen-list.md`.
- **New core docs:** `docs/system/overview.md` and `docs/generated/{entities,route-list,api-map,permissions-matrix,user-stories,behavior-logic,screen-flow,traceability-matrix}.md`.
- **Feature specs (M):** `docs/features/{F006_AwardsPortal,F008_SpotlightBoard,F010_SecretBoxRewards,F012_Profile,F013_Notifications,F014_AdminUserManagement,F015_AdminOverview}/{functional-spec,technical-spec}.md`.
- **New generated sidecars:**
  - 19 `confidence-report_*.md` files (12 core, 7 feature).
  - The navigation layer: `docs/README.md`, `docs/.reading-order.json`, and READMEs in `docs/{system,generated,features,journals}/` and all 15 `docs/features/F###_*/`.
- **State (M):** `docs/.rebuild-state.json` (cursors, doc_shas) and `docs/_source-to-fcode.json`.
- **Not written:**
  - Code, tests and `.claude/**` were not edited.
  - No git writes were made.
  - `.env*` was not read.
  - `docs/.review-archive` was purged by promote (the default).

## 6. Validator summary

`validate_route_list`, `validate_screen_list`, `validate_screen_flow`, `validate_behavior_logic`, `validate_api_map`, `validate_feature_existence` and `validate_traceability_matrix` all PASS. `validate_id_contiguity` passes for every artifact, with screen-list at WARN (2 REG-gap warnings). `validate_deployment_view` WARNs (`no_iac`, expected). Core `validation-summary.json` overall is WARN. Feature `fs-validation-summary.json` overall is WARN (6 `state_rung_missing`). `check_translation_gate` passes for both core and feature-specs.

## 7. Open WARNs (non-blocking; full text in `artifacts/review-report.md` and `artifacts/feature-review-report.md`)

- **Core W7a (19 warnings), including:**
  - ROUTE018 owner is F003 in route-list but F004 in screen-list/US030.
  - Six PERM "Related Modules" disagree with feature-list.
  - F005 is typed `ui` with no SCR, while F009 (same situation) is `background`.
  - data-model.md mentions a db-objects artifact this stack never produces, and its Summary table has overlapping MODEL ranges.
  - 11 BL are not cited by any US (scheduler jobs have no system US — backlog).
  - US034–048 lack the `Criterion N:` labels.
  - Cross-Reference checkboxes are left unticked.
- **W5.6 (3 warnings):**
  - Shared-infra BL entries sit on a single feature.
  - The prelaunch gate sits in F006.
  - BL014 sits in F009.
- **Feature specs (12 warnings, still OPEN), notably:**
  - F013 claims that an anonymous→named edit shows the sender (the code keeps it anonymous).
  - F013 states a bell cap of "10" (it is a page size).
  - F012's A1 Writes cell names F010's reconcile.
  - F013 has 12 broken `../../docs/...` links; the root cause is the template itself.
  - F008 omits the prelaunch gate for ROUTE017 and has leftover template text at its end.
  - F014's demoted-admin dialog claim is wrong (the 403 comes first).
  - F015 has a "CECV" typo (should be CEVC) and a contradictory export-after-role-loss row.

## 8. Concerns / follow-ups

1. **SCR renumber (faithful full-run behaviour):**
   - The W2 H-rules reclassified 8 previously published SCRs (old 006, 015–018, 020, 021, 025) as REG regions or components. The mandatory full-run renumber then compacted the codes, mapping SCR007→006 through SCR028→020 (map in `artifacts/renumber-map-screen-list.json`).
   - So the 27 `docs/screens/SCR###_*` dirs and the 8 non-refreshed feature specs (F001–F005, F007, F009, F011) now reference stale SCR/US codes.
   - Suggested next runs: `/tkm:rebuild-spec --features F001,F002,F003,F004,F005,F007,F009,F011` and `/tkm:rebuild-spec --screen-specs`, then a manual GC of the stale `docs/screens` dirs (known limitation F15).
2. **`docs/_canonical-fcodes.json` (root copy) is stale.** Its `related.screens` still hold old SCR codes. The pass writes its canonical JSON only to the plan dir. The slugs are unchanged.
3. **Feature Entry Points** in `docs/generated/screen-flow.md` are still the HTML stub. The core W9 stub makes FS.1.5's `{POPULATED_BY_W6}` replacement a no-op, and FS.7 does not promote screen-flow. This looks like a pipeline gap.
4. **Navigation READMEs** use English labels. W9.6 and FS.7 invoke `build_navigation.py` without `--lang` when docs_root=`docs`, as the reference prescribes.
5. **HEAD moved during the run**: commit `6e34454`, a test-only change from another session. The cursors record `6e34454`.
6. **Subagent agent-memory**: athena and the reviewers wrote their own memory files under the untracked `.claude/agent-memory/{athena,reviewer}/`. I did not edit `.claude`, but exclude these from your commit if they are unwanted.
7. **Skipped (by design)**:
   - W0.6 extractors (profile has none) and crud-matrix/db-objects (profile skip).
   - The route probe (not triggered) and W8 (failed=0).
   - Graph (disabled).
   - The optional `/tkm:capture-lessons` journal, which would write to `docs/journals/` outside the brief.
8. **Subagent tooling**: most researchers found no Python on PATH and emulated validators with node. I re-ran every gate validator myself with real Python, and the results above are mine.

## 9. Pass-completion handoffs (verbatim)

```
─── core pass complete ───
Promoted: docs/system/*.md + docs/generated/*.md (11 core artifacts)
Secondary languages: none registered
Review (optional): /ask-expert "Is the core architecture & data-model documentation accurate and complete?"
Parity (optional): /tkm:audit-doc-parity sweep  # blind-regen semantic parity check (docs ↔ code) — OFF by default, non-blocking
Soundness (optional): /tkm:audit-synthesis-judgment --scope user-stories  # judges US partition/merge soundness (IPE conformance) — non-blocking. NOTE: coverage FAIL (orphans/phantoms) needs --feature-specs first; before that it reports UNVERIFIABLE, not FAIL.
Next (run --feature-specs first — flows & glossary depend on docs/features/*):
  /tkm:rebuild-spec --feature-specs  # Per-feature 4-file specs (run this next)
  /tkm:rebuild-spec --flows          # Process-flows   (requires docs/features/*)
  /tkm:rebuild-spec --glossary       # Glossary        (requires docs/features/*)
  /tkm:rebuild-spec --api-contracts  # API contracts   (core-tier; parallel-safe)
  /tkm:rebuild-spec --screen-specs   # Screen specs    (requires docs/generated/screen-list.md)
  /tkm:capture-lessons                 # Record this milestone
```

```
─── feature-specs pass complete ───
Promoted: docs/features/{F###}/ (technical-spec, functional-spec) for 7 feature(s)
Secondary languages: none registered
Review (optional): /ask-expert "Are the feature specs for [domain] coherent and complete?"
Soundness (optional): /tkm:audit-synthesis-judgment --scope all  # judges partition/US/inference soundness incl. full code-level coverage (orphans/phantoms now that docs/features/ exists) — non-blocking
Test cases (optional, off by default): /tkm:rebuild-spec --test-cases  # QA-facing docs/features/{F###}/test-cases.md — opt-in pass, never runs automatically
Migrating an existing v26 repo (4-file feature dirs)? See references/migration-audience-split.md for migrate_feature_audience_split.py's modes A/B/C + LLM compaction contract.
Next options (run in any order — they are independent):
  /tkm:rebuild-spec --flows       # Synthesize process-flows (requires docs/features/* just promoted)
  /tkm:rebuild-spec --glossary    # Synthesize glossary     (requires docs/features/* just promoted)
  /tkm:rebuild-spec --screen-specs # Generate screen specs  (requires docs/generated/screen-list.md)
```

**Status:** DONE_WITH_CONCERNS
**Summary:** The full core pass and the scoped feature-specs pass both ran to completion through their review/fix gates. 12 core docs and 7 feature spec pairs were promoted to `docs/`, with F001–F015 codes stable and prose in vi.
**Concerns/Blockers:**
- The SCR renumber leaves `docs/screens/` and the 8 non-refreshed feature specs on stale SCR/US codes.
- The docs root and profile pin were preflight decisions to confirm.
- A Windows `os.rename` kit defect was worked around with a shim.
- 31 non-blocking warnings remain (19 core, 12 feature).
- The Feature Entry Points section is still a stub.
