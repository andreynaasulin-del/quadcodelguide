---
SECTION_ID: files.snap01.08-technical-spec_png
TYPE: file/image
---

# SNAP/01 — Technical Spec Sheet (BOM / Pricing / Collision Rules)

FILE: snap01/08-technical-spec.png
DESCRIPTION: Production technical specification sheet for the SNAP/01 configurator — bill-of-materials table with locked per-module prices, the pricing formula, the zero-clearance collision rule, and the corner-only placement rule for the Corner Unit, in the same reversed diazo-print blueprint style as steps 1-2.
WIDTH: 1920
HEIGHT: 1088
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
USAGE: Step 8 (final step) of SNAP/01 guide — replaces a raw cropped browser screenshot of the live widget's BOM panel with a proper designed technical-spec artifact matching the guide's locked blueprint palette.

PROMPT: |
  GOAL / INTENDED USE:
  Create a senior-level production technical specification sheet for a
  parametric kitchen configurator. This is the FINAL reference document in
  an 8-step design pipeline — it must read as a precise engineering
  handoff document (like a real architectural spec sheet), not a UI
  screenshot and not a marketing graphic.

  STYLE / PALETTE (locked, must match exactly — this is a strict continuation
  of an existing document series):
  Warm ivory drafting-paper background, flat solid color, no texture, no
  stains, no yellowing: #F3EDE1.
  Deep indigo-ink linework and body text, flat solid color, thin consistent
  1-2px hairline strokes, no gradients, no glow, no drop shadows: #2B3A55.
  Signal safety-orange used ONLY for prices, the total figure, and rule
  callout accents: #FF6B35.
  Faint warm-tan background grid at roughly 40px pitch, barely visible
  against the paper.
  Typography: uppercase monospace (JetBrains-Mono-style) for all numbers,
  labels, dimensions and table data; clean grotesk sans (Inter-style) for
  headers and body sentences. No other fonts, no script fonts, no serif.
  Overall mood: hand-drafted-but-precise architectural/cabinetmaker
  technical sheet, right-angle corners, no rounded UI chrome, no icons
  besides simple line-art, no photos, no 3D render, no skeuomorphism.

  HEADER (exact text, once, top-left, uppercase grotesk sans):
  "SNAP/01 — TECHNICAL SPEC"
  Subhead directly under it, smaller, exact text once:
  "BILL OF MATERIALS · PRICING FORMULA · COLLISION RULES"

  LAYOUT — three zones on one sheet, thin indigo-ink divider rules between
  them:

  ZONE A (left, roughly 55% width) — "A — BILL OF MATERIALS" (small mono
  label above the zone):
  A clean flat technical table, indigo-ink hairline rules only (no fill
  color on rows), six data rows plus one total row, columns: MODULE / QTY /
  UNIT PRICE. Exact rows, in this order, prices in signal-orange monospace
  numerals, module names in indigo-ink grotesk:
  "CORNER UNIT" | "×1" | "€610"
  "BASE CABINET" | "×1" | "€420"
  "DRAWER STACK" | "×1" | "€340"
  "WALL CABINET" | "×1" | "€260"
  "ISLAND" | "×1" | "€1,450"
  "APPLIANCE BAY" | "×1" | "€890"
  A thicker indigo-ink rule above the final row, then the total row in
  larger bold type: "TOTAL" on the left, "€4,288" in large bold
  signal-orange monospace numerals on the right.

  ZONE B (top-right, roughly 45% width, 40% height) — "B — PRICING FORMULA"
  (small mono label above the zone):
  One large clean equation rendered as flat technical typography, centered,
  exact text once:
  "TOTAL = Σ (UNIT PRICE × QTY) × 1.08"
  Directly under it, one small caption line, exact text once:
  "1.08 = HARDWARE / INSTALL FEE — A VISIBLE MULTIPLIER, NOT A HIDDEN MARKUP"

  ZONE C (bottom-right, roughly 45% width, 60% height) — "C — PLACEMENT
  RULES" (small mono label above the zone):
  A small clean top-down architectural floor-plan outline of a rectangular
  room (indigo-ink outline on the grid, same drafting convention as step 1),
  with four small square corner markers at all four inside corners of the
  rectangle. Put a small signal-orange checkmark glyph inside each of the
  four corner markers. Beside the floor plan, two short rule captions in
  monospace, stacked vertically, exact text:
  "COLLISION RULE — ZERO CLEARANCE: GRID PITCH = NARROWEST MODULE WIDTH.
  EDGE-TO-EDGE SNAP NEEDS NO GAP."
  "CORNER RULE — CORNER UNIT VALID ONLY AT THE 4 ROOM-CORNER CELLS
  (4 BOOLEAN CHECKS, NOT A POLYGON TEST)."

  FOOTER (exact text, once, bottom, small uppercase mono, centered):
  "PRODUCTION-READY — EVERY NUMBER ON THIS SHEET MATCHES THE LIVE WIDGET"

  HARD CONSTRAINTS:
  Only the exact text specified above may appear anywhere on the sheet —
  no filler lorem ipsum, no extra labels, no watermark, no logo, no brand
  name, no additional UI chrome. Do not render this as a screenshot of a
  web app — no browser chrome, no rounded card shadows, no dark UI panel,
  no cursor icon. This is a flat printed technical document. No color
  anywhere except: warm ivory paper background (#F3EDE1), deep indigo-ink
  lines/text (#2B3A55), and signal-orange price/accent figures (#FF6B35).
  No photoreal material, no gradients, no gloss, no 3D.

COMMENTS: |
  - REPLACES the previous version of this step, which was a raw cropped
    browser screenshot of the live widget's dark-UI BOM panel (dark
    graphite card, sans-serif digits, no formula/rule content visible,
    visually inconsistent with every other step in the guide). That
    screenshot broke the guide's visual identity — this sheet restores the
    PAPER/INK/SIGNAL blueprint language locked in steps 1-2 and reused in
    step 4's module-library sheet.
  - All six prices and the €4,288 total must exactly match the live values
    already verified in the working widget (ui_views/assets/snap01-configurator.html)
    — do not let the model invent different numbers.
  - Reject if the sheet reads as a UI mockup/dashboard rather than a printed
    technical spec document — no dark mode, no card shadows, no rounded
    buttons anywhere.

