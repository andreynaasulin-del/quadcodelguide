---
SECTION_ID: files.npc01.05-expression-accessories_png
TYPE: file/image
---

# NPC/01 — Expression + Accessories

FILE: npc01/05-expression-accessories.png
DESCRIPTION: Expression sheet and accessory logic board for THE COURT PARASITE variant A, locked to the identity render.
WIDTH: 2560
HEIGHT: 1440
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: npc01/03-identity-render.png
IMAGE-INPUT-2: npc01/04-turnaround.png
FILES: npc01/03-identity-render.png, npc01/04-turnaround.png
USAGE: Step 5 of NPC/01 — face range and prop logic before animation handoff.

PROMPT: |
  GOAL:
  Create a production expression + accessory sheet for THE COURT PARASITE using Image 1 as the face/costume identity lock and Image 2 as secondary proportion support if available. Same character only. Original design.

  LAYOUT:
  Landscape 2560×1440 warm bone paper (#EDE8DF).
  Header exact:
  "NPC/01 — EXPRESSION + ACCESSORIES"
  Subhead exact:
  "THE COURT PARASITE — VARIANT A"
  Two zones separated by a thin rule.

  LEFT ZONE — EXPRESSIONS:
  Six head-and-shoulders portraits in a 2×3 or 3×2 grid, identical framing, collar partially visible in each.
  Labels under each exact:
  "NEUTRAL COURT"
  "POLITE SMILE"
  "PREDATOR FOCUS"
  "DIALOGUE TELL"
  "SPELL WHISPER"
  "MASK CRACK"
  Expression logic:
  - NEUTRAL COURT: half-lidded calm from Image 1
  - POLITE SMILE: thin social smile, no warmth in eyes
  - PREDATOR FOCUS: eyes fully open, still face, threat without snarl
  - DIALOGUE TELL: one brow micro-lift, mouth almost still — the lying tell
  - SPELL WHISPER: lips slightly parted, eyes lowered, soft concentration
  - MASK CRACK: brief contempt or hunger, still elegant, no blood spit, no full vampire snarl cliché
  No fangs unless extremely subtle in MASK CRACK only; prefer no fangs.

  RIGHT ZONE — ACCESSORIES:
  Four clean product-style callouts on neutral ground with short English function labels:
  1) "WING COLLAR" — stiffened structure, bone-silk inner edge, authority massing
  2) "VOID COAT + BLOOD LINING" — concealment sleeves, dried-blood interior
  3) "SIGNET CANE" — cold steel tip/handle, status + reach line in silhouette
  4) "COURT SIGNET RING" — tiny steel/bone ring, influence token
  Each accessory must look like it belongs to Image 1 materials: void #120F17, blood #4A1830, bone #C7B79B, steel #8A9199.

  STYLE:
  Painterly cinematic game concept art matching Image 1 face and fabric.
  Production sheet clarity, sparse labels, no UI chrome, no stats bars.

  HARD CONSTRAINTS:
  Same face and hair as Image 1 across all expressions.
  No Loki / Dracula / Alucard likeness.
  No logos, watermarks, extra paragraphs, fake lore walls.
  Accessories explain function, not random gothic clutter.

COMMENTS: |
  - Reject if expressions become random anime faces.
  - Reject if accessories invent new silhouette-breaking props.
