# Traceability Matrix

**Project**: Project
**Generated**: 2026-11-24T10:20:06Z
**Scope**: Full codebase

> **Re-projection, not detection.** Every ID below already exists in its source-of-record artifact — this file invents nothing, and is never the first place an ID appears. Source of record per column: `F###` <- `generated/feature-list.md`; `SCR###` <- `generated/screen-list.md`; `US###` <- `generated/user-stories.md`; `BL###` <- `generated/behavior-logic.md`; `ROUTE###` <- `generated/route-list.md` (`Owner F###` column); `PERM###` <- `generated/permissions-matrix.md`.

---

## Matrix

| F### | SCR### | US### | BL### | ROUTE### | PERM### |
|---|---|---|---|---|---|
| F001 | SCR001, SCR020 | US016, US018, US019 | BL001, BL004, BL005, BL011, BL018, BL019, BL020, BL021, BL022 | ROUTE020, ROUTE021, ROUTE022, ROUTE035 | PERM001, PERM002, PERM003, PERM005, PERM006, PERM007, PERM008, PERM009, PERM010, PERM011, PERM014, PERM015, PERM035 |
| F002 | SCR002, SCR003, SCR004, SCR005 | US001, US002, US017, US020, US021, US022 | — | ROUTE036 | PERM012, PERM013, PERM016 |
| F003 | SCR007 | US026, US027, US028, US029 | BL006, BL007, BL008, BL012 | ROUTE009, ROUTE010, ROUTE013, ROUTE018, ROUTE023, ROUTE024 | PERM022, PERM023, PERM024, PERM025, PERM026, PERM036 |
| F004 | SCR006, SCR007 | US030, US031, US032, US033, US036, US039 | BL009 | ROUTE007, ROUTE008, ROUTE018 | PERM028, PERM029 |
| F005 | — | US037, US038 | — | ROUTE025, ROUTE026 | PERM027 |
| F006 | SCR008, SCR009, SCR010, SCR011, SCR012 | US045, US046, US047, US048 | BL013 | — | PERM004 |
| F007 | SCR013 | US005, US006, US007, US008 | — | ROUTE001, ROUTE002, ROUTE018, ROUTE027, ROUTE028 | PERM019, PERM021 |
| F008 | SCR007 | US042, US043 | BL003, BL023 | ROUTE017 | PERM037 |
| F009 | — | US040 | BL014 | — | — |
| F010 | SCR007 | US044 | BL027, BL028, BL032, BL033, BL034 | ROUTE006, ROUTE015, ROUTE016 | PERM033, PERM034 |
| F011 | SCR014 | US013, US014, US015 | — | ROUTE029, ROUTE030, ROUTE031 | PERM020 |
| F012 | SCR015, SCR016 | US034, US035, US041 | — | ROUTE014, ROUTE019 | PERM030, PERM031 |
| F013 | SCR017, SCR003 | US023, US024, US025 | BL002, BL010, BL015, BL016, BL017, BL024, BL025, BL026, BL029, BL030, BL031 | ROUTE005, ROUTE011, ROUTE012, ROUTE033, ROUTE034 | PERM032, PERM038 |
| F014 | SCR018 | US009, US010, US011, US012 | — | ROUTE004, ROUTE032 | PERM017, PERM018 |
| F015 | SCR019 | US003, US004 | — | ROUTE003 | — |

---

## Cross-Reference Validation

- [x] Every `SCR###`/`US###`/`BL###`/`PERM###` cell is projected from `generated/feature-list.md`'s own per-feature `**Related X**:` bullets
- [x] Every `ROUTE###` cell is projected from `generated/route-list.md`'s own `Owner F###` column
- [x] No ID in this matrix is invented — see `validate_traceability_matrix.py` for the WARN-first cross-check against each source-of-record inventory
