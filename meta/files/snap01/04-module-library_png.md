---
SECTION_ID: files.snap01.04-module-library_png
TYPE: file/image
---

# SNAP/01 — Module Library

FILE: snap01/04-module-library.png
DESCRIPTION: Production module-library catalog sheet with 6 fixed-dimension kitchen modules (base cabinet, wall cabinet, drawer stack, corner unit, island, appliance bay) shown as flat orthographic front-elevation icons with locked dimensions and shared 300mm grid pitch, in the OAK/GRAPHITE/STEEL product material palette on a neutral studio backdrop.
WIDTH: 1920
HEIGHT: 1088
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
USAGE: Step 4 of SNAP/01 guide — lock the exact module catalog (6 types, fixed sizes on a 300mm grid) that every later 3D mesh and the real configurator widget must match exactly.

PROMPT: |
  GOAL / INTENDED USE:
  Create a production module-library catalog sheet for a senior product-
  design pipeline. This sheet is the single source of truth for six fixed-
  dimension kitchen cabinetry modules before any 3D mesh work begins. It is
  a technical specification catalog page (like a cabinetmaker's shop-drawing
  parts sheet), not a lifestyle render — every module must be individually
  measurable and comparable.

  BACKDROP:
  Flat neutral graphite-black studio background (#15171A), matching the
  previous SNAP/01 identity-render sheet exactly. No gradient, no
  environment, no floor.

  HEADER (exact text, once, top-left, clean grotesk sans, uppercase, warm
  off-white #EDE8DF):
  "SNAP/01 — MODULE LIBRARY"
  Subhead directly under it, smaller, exact text once:
  "6 FIXED MODULES — 300MM GRID PITCH"

  GRID LAYOUT:
  A clean 3-column × 2-row grid of six equal module cells, generous gutter
  between cells, each cell containing:
  - One flat-shaded orthographic FRONT ELEVATION icon of the module (simple
    clean line-and-fill technical elevation, not a photoreal render —
    think architectural furniture elevation drawing), using the locked
    material palette as flat color fills:
    OAK #C08A52 for cabinet door/drawer fronts,
    GRAPHITE #22262B for countertop slabs/waterfall panels,
    STEEL #9AA3AC for integrated bar pulls and any exposed trim.
  - Two thin steel-gray dimension lines with perpendicular tick marks
    (architect style ↔), one along the width (bottom), one along the height
    (side), each labeled with the exact millimeter value in small monospace
    numerals in warm off-white.
  - Module name in uppercase monospace directly below the icon.
  - One small spec line under the name in smaller monospace, exact format:
    "W × D × H MM"

  THE SIX MODULES (exact names, dimensions, and visual description):

  1. "BASE CABINET" — 600 × 600 × 720 MM
     Floor-standing unit, two stacked drawer fronts, one steel bar pull per
     drawer, oak veneer fronts, flat graphite countertop cap on top edge only.

  2. "WALL CABINET" — 600 × 350 × 720 MM
     Wall-mounted unit, two side-by-side hinged doors, one steel bar pull
     per door, oak veneer fronts, no countertop.

  3. "DRAWER STACK" — 300 × 600 × 720 MM
     Narrow floor-standing unit, three stacked equal-height drawer fronts,
     one steel bar pull per drawer, oak veneer fronts, graphite countertop
     cap.

  4. "CORNER UNIT" — 900 × 900 × 720 MM
     Floor-standing L-shaped corner block shown as a simple top-down-style
     diagonal front elevation, one angled oak door panel across the
     diagonal face, graphite countertop cap, one steel pull.

  5. "ISLAND" — 1800 × 900 × 900 MM
     Free-standing long unit, four stacked drawer fronts across the width,
     oak veneer fronts, full graphite waterfall-edge countertop wrapping
     visibly over the top and down one visible side edge, steel pulls.

  6. "APPLIANCE BAY" — 600 × 600 × 2100 MM
     Tall floor-to-near-ceiling tower, oak veneer storage panel on top and
     bottom thirds, a flush dark rectangular built-in-oven panel in the
     middle third with a thin steel trim frame around it (no brand text, no
     control markings), one steel pull on each oak section.

  GRID PITCH CALLOUT:
  Small dedicated caption box at the bottom of the sheet, exact text once:
  "GRID PITCH = 300 MM — EVERY MODULE WIDTH IS A MULTIPLE OF THE NARROWEST UNIT"

  FOOTER (exact text, once, bottom, small uppercase mono, centered, warm
  off-white):
  "SIX MODULES, ONE GRID — NO CUSTOM SIZES AT CHECKOUT"

  ANNOTATION STYLE:
  Precise flat technical elevation icons, consistent line weight across all
  six modules, no perspective distortion within a single module icon (true
  front elevation, orthographic), no drop shadows on the icons themselves
  beyond a faint contact shadow, no gloss, no marketing lighting flourishes.
  This is a parts catalog, not a hero shot.

  HARD CONSTRAINTS:
  Only the exact text, names, and dimensions specified above may appear —
  no extra modules, no filler text, no watermarks, no logos, no brand names.
  No color anywhere on the modules besides OAK #C08A52 / GRAPHITE #22262B /
  STEEL #9AA3AC as specified — no black hardware, no gold, no marble, no
  gloss countertop. Dimension lines and numerals must be a neutral steel-
  gray/off-white tone, never the SIGNAL safety-orange used in the earlier
  blueprint-UI sheets of this same guide — this product-material palette
  and the blueprint UI palette must never mix on one sheet.

COMMENTS: |
  - Reject if any module's proportions visibly contradict its stated W×D×H
    — this sheet is the dimensional source of truth for step 5's 3D meshes.
  - Reject if the corner unit reads ambiguous/generic — it must clearly
    show the diagonal-face L-turn solution, not just a square box.
  - Reject if dimension lines pick up the SIGNAL orange from steps 1-2 —
    that color is reserved for the blueprint UI system only.
  - All six widths (600, 600, 300, 900, 1800, 600) are multiples of the
    300mm grid pitch — the sheet's grid-pitch caption must be readable and
    correct.
  - Next step: 3D mesh generation — one GLB per module, production tris
    budget, matching these exact locked dimensions and the same
    OAK/GRAPHITE/STEEL palette.
