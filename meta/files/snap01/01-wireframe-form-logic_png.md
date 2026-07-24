---
SECTION_ID: files.snap01.01-wireframe-form-logic_png
TYPE: file/image
---

# SNAP/01 — Wireframe & Form Logic

FILE: snap01/01-wireframe-form-logic.png
DESCRIPTION: Production UX wireframe/spec sheet for a parametric kitchen configurator, showing the room-dimension input form on the left wired live to a to-scale top-down floor-plan preview on the right, in reversed diazo-print architectural drafting style (warm ivory paper, indigo ink linework).
WIDTH: 1920
HEIGHT: 1088
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: snap01/01-wireframe-form-logic.png
USAGE: Step 1 of SNAP/01 guide — establish why the live floor-plan preview must exist before any 3D module work starts (trust mechanism, not decoration).

PROMPT: |
  GOAL / INTENDED USE:
  Recolor this existing technical UX wireframe sheet. Change ONLY the color
  scheme — keep every other element identical: same two-panel layout, same
  exact labels and text, same room dimensions (320 / 240), same dimension
  arrows and "LIVE SYNC — NO SUBMIT BUTTON NEEDED" connector, same grid-snap
  dot pattern and "SNAP POINT" ghost rectangle, same header/footer text,
  same proportions and screen positions of every element.

  COLOR CHANGE (this is the whole task):
  Replace the saturated Prussian-blue background (#1B3A5C) with a warm ivory
  drafting-paper background (#F3EDE1) — a reversed/positive diazo-print
  convention (dark ink on light paper, the way real architectural blueprints
  were physically printed), not a photographic paper texture, no yellowing,
  no stains.
  Replace the chalk-white linework and text with deep indigo-ink (#2B3A55)
  linework and text — identical line weight, identical hairline style, flat
  color only, no gradient fill.
  Keep the faint background grid, but recolor it to a soft warm tan tone
  that barely shows against the new paper — same ~40px pitch as before.
  Keep the SIGNAL safety-orange (#FF6B35) dimension arrows and the
  "LIVE SYNC" label exactly as they already are — do not change this color
  or its usage.

  HARD CONSTRAINTS FOR THIS EDIT:
  Do not change layout, composition, spacing, or any text content. Do not
  add new elements, icons, or decoration. Do not add drop shadows, glow, or
  gloss — keep it flat technical drafting. Do not alter the orange arrows'
  shape, position, or the "LIVE SYNC" connector's meaning.

  ORIGINAL LAYOUT REFERENCE (unchanged, for context only):
  Landscape architectural blueprint sheet, two panels divided by a thin
  center rule.

  HEADER (exact text, once, top-left, clean grotesk sans, uppercase):
  "SNAP/01 — WIREFRAME & FORM LOGIC"
  Subhead directly under it, smaller, exact text once:
  "PARAMETRIC KITCHEN CONFIGURATOR"

  TWO-PANEL LAYOUT, thin divider rule down the middle:

  LEFT PANEL — "A — INPUT FORM" (small mono label above panel):
  A vertical UI wireframe drawn in flat outline boxes only (no color fill,
  pure indigo-ink strokes on the ivory paper), representing a real form:
  - Label "ROOM WIDTH (CM)" next to a rectangular input field showing
    monospace placeholder digits "320"
  - Label "ROOM DEPTH (CM)" next to a field showing "240"
  - Label "CEILING HEIGHT (CM)" next to a field showing "240"
  - A small horizontal toggle control labeled "CM / IN"
  - A rectangular primary button outline labeled "UPDATE PLAN"
  All labels in small uppercase JetBrains-Mono-style monospace lettering,
  thin 1-2px indigo-ink strokes, generous spacing, no color besides ink
  lines/text on the ivory field.

  RIGHT PANEL — "B — LIVE FLOOR-PLAN PREVIEW" (small mono label above panel):
  A clean top-down architectural floor-plan outline of a rectangular room,
  drawn to scale matching the input values (wider than deep, matching a
  320×240 proportion), rendered as an indigo-ink outline rectangle on the
  grid.
  Two dimension arrows in SIGNAL safety-orange (#FF6B35), architect style
  with perpendicular tick marks at both ends (↔), one along the top edge
  labeled "320 CM", one along the left edge labeled "240 CM".
  Inside the rectangle, a faint dotted grid-snap pattern (small indigo-ink
  dots at regular intervals) hinting at future module placement, plus one
  single thin dashed ghost rectangle in one corner labeled small
  "SNAP POINT" to show the grid is live, not just an outline.

  CONNECTOR BETWEEN PANELS:
  A single thin indigo-ink arrow crossing the center divider from panel A
  to panel B, with a small label centered on it, exact text once:
  "LIVE SYNC — NO SUBMIT BUTTON NEEDED"

  FOOTER (exact text, once, bottom, small uppercase mono, centered):
  "TRUST BEFORE PLACEMENT — THE FORM MUST PROVE ITSELF"

  ANNOTATION STYLE:
  Everything must look hand-drafted-but-precise: thin consistent line
  weights, right-angle corners, no rounded UI chrome, no icons, no photos,
  no 3D. This is a technical specification artifact, not a marketing mock.

  HARD CONSTRAINTS:
  Only the exact text specified above may appear — no extra labels, no
  filler lorem ipsum beyond the specified placeholder digits, no watermarks,
  no logos, no brand names, no additional UI chrome beyond what is listed.
  No color anywhere except: warm ivory paper background, deep indigo-ink
  lines/text, and signal-orange dimension arrows/labels. No skeuomorphic
  textures, no wood, no photoreal material — pure flat technical drafting.

COMMENTS: |
  - Reject if the two panels don't clearly read as "input causes preview"
    at a glance — the connector arrow + "LIVE SYNC" label is the whole point.
  - Reject if any extra UI chrome (icons, nav bars, logos) sneaks in.
  - PALETTE PIVOT (v2): original saturated Prussian-blue (#1B3A5C) caused
    eye strain at full-page scale — replaced with reversed diazo-print
    treatment. This sheet now locks the SNAP/01 palette for every following
    step: PAPER #F3EDE1 / INK #2B3A55 / SIGNAL #FF6B35 only.
  - Next step: interaction-pattern decision matrix (Grid-Snap vs Freeform
    vs Rigid Presets), same PAPER/INK/SIGNAL palette.
