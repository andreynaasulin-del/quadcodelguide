---
SECTION_ID: files.snap01.02-interaction-matrix_png
TYPE: file/image
---

# SNAP/01 — Interaction Pattern Decision Matrix

FILE: snap01/02-interaction-matrix.png
DESCRIPTION: Production decision sheet scoring three module-placement interaction patterns (Grid-Snap, Freeform, Rigid Presets) on Trust, Speed, Error-Rate and Build-Cost, with Grid-Snap winning by a narrow weighted margin over Rigid Presets — forcing a documented, non-obvious choice.
WIDTH: 1920
HEIGHT: 1088
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
USAGE: Step 2 of SNAP/01 guide — lock the module-placement interaction pattern with a transparent weighted score, before any 3D module or widget code is built.

PROMPT: |
  GOAL / INTENDED USE:
  Create a production UX decision sheet in the same reversed diazo-print
  architectural drafting style as the previous SNAP/01 sheet: warm ivory
  drafting-paper background, deep indigo-ink linework and text, signal-orange
  used only for interactive/measurement callouts and the winning-answer
  highlight. This sheet exists to prove, with a transparent weighted score,
  which of three interaction patterns should drive furniture-module
  placement in a kitchen configurator — not designer taste.

  LAYOUT:
  Landscape 1920×1088 sheet on warm ivory paper (#F3EDE1) with a very faint
  fine graph-paper grid (soft warm tan lines, ~40px pitch) covering the
  whole page. Deep indigo-ink (#2B3A55) hairline rules and linework only —
  flat color, no gradients, no drop shadows, no gloss.

  HEADER (exact text, once, top-left, clean grotesk sans, uppercase, indigo-ink):
  "SNAP/01 — INTERACTION MATRIX"
  Subhead directly under it, smaller, exact text once:
  "GRID-SNAP VS FREEFORM VS RIGID PRESETS"

  TOP ROW — three equal small diagram panels, each a tiny top-down floor-plan
  icon (roughly 260×200px) drawn in thin indigo-ink outline on the ivory
  field, illustrating the pattern itself, labeled underneath in small
  uppercase mono:
  Left panel "A — GRID-SNAP": a dotted grid of small indigo dots with one
  module rectangle aligned perfectly onto grid intersections, a faint ghost
  outline one cell away showing the snap target, one signal-orange tick
  mark at the snap point.
  Center panel "B — FREEFORM": the same size field with two module
  rectangles at slightly different, non-aligned rotations and one small
  overlap between them shown as a crosshatched indigo zone (visual sign of
  collision/error), no grid dots.
  Right panel "C — RIGID PRESETS": three identical fixed-size module
  rectangles locked into one single pre-drawn layout template outline, no
  freedom of movement implied, drawn slightly more rigid/mechanical with
  double-ruled borders.
  Keep all three diagrams schematic and small — icons, not full illustrations.

  CENTER — SCORE MATRIX TABLE:
  A clean ruled table, indigo-ink hairlines, with column headers:
  "CRITERIA | WEIGHT | A: GRID-SNAP | B: FREEFORM | C: RIGID PRESETS"
  Five criteria rows, each with a numeric score 1-5 per pattern (plain
  indigo-ink numerals, monospace, no bars needed):

  TRUST (dimension confidence) | 35% | A: 5 | B: 2 | C: 4
  PLACEMENT SPEED | 20% | A: 4 | B: 3 | C: 5
  ERROR RATE (lower is better, shown inverted as quality) | 30% | A: 5 | B: 2 | C: 4
  BUILD COST (engineering effort, inverted) | 15% | A: 3 | B: 4 | C: 5

  WEIGHTED TOTAL row, bold, larger type:
  "A: 4.50   B: 2.50   C: 4.35"
  Draw one thin signal-orange rectangle outline highlighting the "A: 4.50"
  cell only, plus a small signal-orange label above the table pointing to
  it: "WINNER — BY 0.15, NOT BY TASTE"

  BOTTOM ROW — "3 RULES FOR THIS PATTERN" panel, small header in indigo-ink,
  then three short numbered rules in uppercase monospace, left-aligned,
  generous line spacing:
  "1. SHOW THE GHOST CELL BEFORE THE DROP, NOT AFTER"
  "2. BLOCK OVERLAP ON CONTACT — NEVER ALLOW A SILENT COLLISION"
  "3. GRID PITCH MUST EQUAL THE NARROWEST MODULE WIDTH, NOT A ROUND NUMBER"

  FOOTER (exact text, once, bottom, small uppercase mono, centered):
  "ONE DECIMAL SEPARATES CONFIDENCE FROM CHAOS"

  ANNOTATION STYLE:
  Hand-drafted-but-precise: thin consistent line weights, right-angle
  corners and ruled table lines, no rounded UI chrome, no icons besides the
  three schematic floor-plan diagrams, no photos, no 3D, no gradients. This
  is a technical specification artifact, not a marketing mock.

  HARD CONSTRAINTS:
  Only the exact text and numbers specified above may appear — no extra
  labels, no filler text, no watermarks, no logos, no brand names, no
  additional UI chrome beyond what is listed. No color anywhere except:
  warm ivory paper background, deep indigo-ink lines/text/numerals, and
  signal-orange used only for the winner highlight and the tick mark in
  diagram A. No skeuomorphic textures, no wood, no photoreal material —
  pure flat technical drafting, matching the previous SNAP/01 sheet exactly.

COMMENTS: |
  - Reject if Grid-Snap's win doesn't read as narrow/earned — the whole
    point is A beats C by only 0.15, not by a landslide. If the sheet makes
    the choice look obvious, it fails the "not by taste" premise.
  - Reject if the three floor-plan icons don't clearly differentiate grid
    vs freeform vs rigid at a glance.
  - Reject if any extra UI chrome, icons, or decoration sneaks in.
  - Palette locked from step 1: PAPER #F3EDE1 / INK #2B3A55 / SIGNAL #FF6B35
    only — do not drift.
  - Next step: identity render of the flagship kitchen configuration using
    Grid-Snap, OAK/GRAPHITE/STEEL product material palette (distinct from
    this blueprint UI palette).
