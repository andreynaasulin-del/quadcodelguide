---
SECTION_ID: files.savor01.system-architecture-board_png
TYPE: file/image
---

# SAVOR/01 System Architecture Board

FILE: savor01/system-architecture-board.png
WIDTH: 1920
HEIGHT: 1200
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
USAGE: Canonical reference for all later SAVOR/01 product images and the first explanatory board in the guide.
DESCRIPTION: Senior industrial-design board explaining the SAVOR/01 intake dock, reusable e-paper clips, honest data inputs, five-step workflow and four plain-language triage states.

PROMPT: |
  GOAL / AUDIENCE:
  Create a senior-level industrial-design system architecture board for an original household product named "SAVOR/01". Explain the product to non-technical users in under ten seconds. This board defines canonical geometry for future renders. It is an explanatory design board, not an advertisement.

  PRODUCT PURPOSE:
  SAVOR/01 helps households decide which stored food to use first. It combines known facts: barcode, package date, purchase or opened date, storage location, user confirmation and optional weight change. It never detects freshness, never judges food safe or unsafe and never replaces package guidance.

  CANVAS / GRAPHIC SYSTEM:
  Landscape 1920 × 1200 board on warm off-white paper. Strict 12-column Swiss editorial grid, generous negative space, graphite technical linework, restrained tomato-red and amber status accents, small cobalt detail accents. Neutral grotesk typography with tabular dates. Mix precise orthographic diagrams with restrained photoreal product CGI. Clear enough for a grocery shopper, credible enough for a senior industrial-design review.

  EXACT TEXT — ENGLISH ONLY, VERBATIM, NO OTHER WORDS:
  "SAVOR/01"
  "FOOD TRIAGE SYSTEM"
  "01 INTAKE DOCK"
  "02 REUSABLE CLIPS"
  "03 FIVE-STEP FLOW"
  "04 TRIAGE STATES"
  "320 × 220 × 38 mm"
  "12 CLIPS"
  "SCAN"
  "CONFIRM"
  "TAG"
  "STORE"
  "USE"
  "USE FIRST"
  "USE SOON"
  "STABLE"
  "CHECK"
  "BARCODE"
  "PACKAGE DATE"
  "OPENED DATE"
  "STORAGE ZONE"
  "WEIGHT CHANGE"
  "USER CONFIRMED"
  "NO SAFETY VERDICT"
  Render each phrase once. No paragraphs, slogans, pseudo-text, percentages or extra labels.

  PANEL 01 — INTAKE DOCK:
  Make this the dominant object on the left half. Show one measured three-quarter isometric and one small top orthographic view of a compact weighted dock exactly 320 × 220 × 38 mm. Low rounded rectangular base, graphite recycled-polymer top surface, warm off-white enamel side shell, charcoal silicone foot. A slim bead-blasted aluminium scan arch folds from the rear-left corner and rises 280 mm above the surface. Its horizontal head contains one downward camera and a soft white task light. Along the rear edge, show one recessed charging rail containing exactly 12 small clips. No display on the dock, no knobs, no touchscreen.

  Show one ordinary yoghurt tub centered on the dock only to explain scale and scanning. A thin cobalt framing mark points from the downward camera to the printed date area. Do not make the food glow. Do not show an analysis beam.

  PANEL 02 — REUSABLE CLIPS:
  Show exactly four enlarged examples of the same 42 × 28 mm rounded e-paper NFC clip. Each has a graphite spring back, warm white e-paper face and one tactile raised shape so status is readable without color. The four faces read exactly: "USE FIRST", "USE SOON", "STABLE", "CHECK". Use tomato red, amber, cool grey and cobalt outline sparingly. Also show the complete charging rail with exactly 12 identical clip slots; do not imply disposable labels.

  PANEL 03 — FIVE-STEP FLOW:
  Draw one simple left-to-right sequence with five large pictograms and arrows: SCAN → CONFIRM → TAG → STORE → USE.
  SCAN: yoghurt tub under the arch.
  CONFIRM: a hand-sized phone confirmation card showing a package date choice, but no tiny interface text.
  TAG: one reusable clip attached to the tub rim.
  STORE: the tagged tub placed on a plain refrigerator shelf.
  USE: the tub selected first for a meal.
  Keep objects consistent and understandable. Do not turn this into a complex flowchart.

  PANEL 04 — TRIAGE LOGIC:
  Use six input tokens feeding one transparent, non-magical decision rule block, then four output states. Input labels: BARCODE, PACKAGE DATE, OPENED DATE, STORAGE ZONE, WEIGHT CHANGE, USER CONFIRMED. Outputs: USE FIRST, USE SOON, STABLE, CHECK. Put "NO SAFETY VERDICT" beside the outputs in a clear outlined safety note. Make CHECK visibly mean conflicting or missing information, not danger.

  PRODUCT MATERIALS:
  Warm off-white enamel, graphite recycled polymer with subtle grain, bead-blasted aluminium, translucent food-safe silicone, matte e-paper. Real manufacturing seams, believable hinges, contact shadows and clip springs. No glossy black plastic.

  COMPOSITION:
  Upper-left title block. Dominant dock across left center. Clip family in the upper-right. Five-step flow across the lower-left. Decision logic and four states in the lower-right. Every view must preserve the same dock, folding arch, 12-slot rail and clip proportions. Use thin measurement lines and numbered section markers. Maintain large readable labels and strong hierarchy.

  HARD CONSTRAINTS:
  Original non-infringing design. Exactly one intake dock, one folding scan arch, one 12-slot rear charging rail and 12 starter clips. No gas sensor, smell sensor, freshness percentage, decay visualization, microbiology claim, safety score, automatic SAFE or UNSAFE verdict. No smart refrigerator, no luxury kitchen scene, no marble, no people posing, no holograms, no neon, no floating UI, no decorative charts, no watermark, no brand references, no misspelled text. English only.

COMMENTS: |
  - Safety rule is LOCKED — see [#rules.savor01-safety-rule].
  - Reject if a non-technical viewer cannot explain the five-step flow after ten seconds.
  - Reject if the board suggests that a camera can determine freshness or food safety.
  - Reject if the dock gains a screen, if the arch moves, or if the charging rail has anything other than 12 slots.
  - Geometry, safety honesty and label accuracy matter more than atmosphere.
