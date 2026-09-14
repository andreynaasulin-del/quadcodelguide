---
SECTION_ID: files.npc01.02-variant-matrix_png
TYPE: file/image
---

# NPC/01 — Variant Matrix Score Sheet

FILE: npc01/02-variant-matrix.png
DESCRIPTION: Production decision sheet scoring three Court Parasite silhouettes on authority, magic, threat and mobility, with A selected as winner.
WIDTH: 1920
HEIGHT: 1088
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: npc01/01-silhouette-test.png
FILES: npc01/01-silhouette-test.png
USAGE: Step 2 of NPC/01 — force a documented silhouette pick before identity render.

PROMPT: |
  GOAL:
  Create a senior game-concept production decision sheet. Use Image 1 as the silhouette source. Preserve the three black silhouette massings A / B / C exactly. This sheet must prove why one variant wins using a transparent score matrix — not taste.

  LAYOUT:
  Landscape 1920×1088 production sheet on warm bone paper (#EDE8DF).
  Top-left header exact text:
  "NPC/01 — VARIANT MATRIX"
  Subhead exact text:
  "THE COURT PARASITE — PICK ONE MASSING"
  Clean editorial grid, thin dark rules, generous whitespace. English only.

  TOP ROW:
  Three equal columns with the exact silhouettes from Image 1, smaller but fully legible:
  Left: A — WING COLLAR
  Center: B — RELIC CHAIN
  Right: C — MOTH CLOAK
  Keep figures pure black silhouette, no interior costume detail added. Same ground baseline.

  CENTER — SCORE MATRIX:
  Criteria rows with numeric scores 1–5 and short horizontal bars:
  CRITERIA | WEIGHT | A | B | C

  AUTHORITY | 30% | A:5 | B:4 | C:3
  MAGIC     | 20% | A:3 | B:4 | C:5
  THREAT    | 25% | A:4 | B:3 | C:5
  MOBILITY  | 10% | A:3 | B:4 | C:2
  READABILITY @120PX | 15% | A:5 | B:3 | C:4

  WEIGHTED TOTAL:
  A: 4.25
  B: 3.55
  C: 3.90

  Show the arithmetic clearly. Winner A total gets one acidic green underline (#B7FF2A) and one small green square lock mark. B and C remain fully visible at slightly reduced contrast. Do not invent extra numbers.

  RIGHT / BOTTOM OUTCOME BLOCK — exact text:
  "WINNER"
  "A — WING COLLAR"
  "WHY"
  "STRONGEST COURT AUTHORITY + CLEAREST THUMBNAIL READ"
  "REJECTED"
  "B — NOISY CHEST MASS AT SMALL SCALE"
  "C — READS AS GENERIC HOODED MAGE WITHOUT EXTRA GESTURE WORK"
  "NEXT"
  "IDENTITY RENDER OF A ONLY"

  VISUAL RULES:
  Production tool aesthetic, not poster. Neutral grotesk body type, condensed only for headers.
  No fake RPG stats, no health bars, no UI chrome, no watermarks, no logos, no photoreal faces.
  Keep silhouettes faithful to Image 1. Matrix must remain readable at 1280 px width.

COMMENTS: |
  - Reject if winner looks subjective without scores.
  - Reject if silhouettes drift from Image 1.
  - Exact scores can be rebuilt live later; composition must already teach the method.
