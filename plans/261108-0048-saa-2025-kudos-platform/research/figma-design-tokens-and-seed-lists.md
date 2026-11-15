# Figma design tokens & seed lists (Phase 01 input)

Source: Figma `9ypp4enmFmdK3YAFJLIu6C`, extracted 2026-11-15 by the orchestrator via claude.ai Figma MCP
(`get_variable_defs` on Homepage `2167:9026`, Live board `2940:13431`, Admin Overview `620:7712`;
screenshots of dropdowns `721:5684`, `721:5580`, `1002:13013`). Values are [EXTRACTED] — use verbatim.
Components page `39:28` returned no variables (needs a selection) — no extra tokens from it.

## Colors (Figma variable → suggested Tailwind `@theme` token)

| Figma variable | Value | Token |
|---|---|---|
| Details/Background | `#00101a` | `--color-background` |
| Details/Container | `#101417cc` | `--color-container` |
| Details/Container 2 | `#00070c` | `--color-container-2` |
| Details/Text-Primary 1 (gold) | `#ffea9e` | `--color-primary` / `--color-text-primary` |
| Details/Text-Primary 2 (on gold) | `#00101a` | `--color-on-primary` |
| Details/Text-Secondary 1 | `#ffffff` | `--color-text` |
| Details/Text-Secondary 2 | `#999999` | `--color-text-muted` |
| Details/Border | `#998c5f` | `--color-border` |
| Details/Divider | `#2e3940` | `--color-divider` |
| Details/Error | `#d4271d` | `--color-error` |
| Details/PrimaryButton-Hover | `#fff8e1` | `--color-primary-hover` |
| Details/SecondaryButton-Normal | `#ffea9e1a` | `--color-secondary` |
| Details/ButtonSecondary-Hover | `#ffea9e66` | `--color-secondary-hover` |
| Details/TextButton-Normal | `#00000000` | (transparent) |

## Effects
- Gold/Shaddow: `0 0 6px #FAE287, 0 4px 4px #00000040` → `--shadow-gold`

## Typography (all Montserrat — supports Vietnamese; load via `next/font/google`, subsets `latin`, `vietnamese`, weights 400/500/700)

| Figma style | size / line-height / weight / letter-spacing |
|---|---|
| display/large | 57 / 64 / 400 / -0.25 |
| display/medium | 45 / 52 / 400 / 0 |
| display/small | 36 / 44 / 400 / 0 |
| headline/large | 32 / 40 / 400 / 0 |
| headline/small | 24 / 32 / 400 / 0 |
| title/large | 22 / 28 / 400 / 0 |
| kudos (card) | 20 / 32 / 400 / 0 |
| title/medium | 16 / 24 / 500 / 0.15 |
| title/small | 14 / 20 / 500 / 0.1 |
| label/large | 14 / 20 / 500 / 0.1 |
| body/large | 16 / 24 / 400 / 0.5 |
| body/medium | 14 / 20 / 400 / 0.25 |

Sizes in px. Map to `--text-<name>` with `--text-<name>--line-height`, `--text-<name>--letter-spacing`, `--text-<name>--font-weight` (Tailwind 4 convention).

## Spacing / size variables seen
`Padding/padding4 = 4`, `Padding/padding12 = 12`, `Size/size48 = 48`, `Size/size64 = 64`. Tailwind default spacing scale (4px base) already covers these — do not add custom spacing tokens (YAGNI).

## Seed lists

### Departments (Live board filter "Phòng ban", frame 721:5684)
`CEVC1`, `CEVC2`, `CEVC3`, `CEVC4`, `OPD`, `Infra`
Note: the Admin Overview mock writes `CECV1..3` — treat as a typo; use `CEVC*`. BTC to confirm the final list (upsert-by-code seeds).

### Hashtags (Write Kudo hashtag dropdown, frame 1002:13013)
`#High-performing` (Figma typo "High-perorming"), `#BE PROFESSIONAL`, `#BE OPTIMISTIC`, `#BE A TEAM`, `#THINK OUTSIDE THE BOX`, `#GET RISKY`, `#GO FAST`, `#WASSHOI`
Store `slug` kebab (e.g. `high-performing`, `be-professional`), `label_vi`/`label_en` = display text with `#`.
The filter dropdown 721:5580 shows placeholder values (`#Dedicated`, `#Inspring`) — not a source.
Max per kudo: see decision-log (Figma button says "Tối đa 5").

### Secret Box catalog (data only; phase 10 creates the table)
Icons (6): REVIVAL, TOUCH OF LIGHT, STAY GOLD, FLOW TO HORIZON, BEYOND THE BOUNDARY, ROOT FURTHER.
Gifts seen in Figma: Áo phông SAA, Lót chuột Root Further, Khăn Root Further. Weights/stock: placeholders until BTC provides (mark clearly in the seed file).
