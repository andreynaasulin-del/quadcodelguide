---
SECTION_ID: files.npc01.04-turnaround_png
TYPE: file/image
---

# NPC/01 — Turnaround: Wing Collar

FILE: npc01/04-turnaround.png
DESCRIPTION: Production turnaround sheet of THE COURT PARASITE variant A with front, three-quarter, side and back views locked to the identity render.
WIDTH: 2560
HEIGHT: 1440
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: npc01/03-identity-render.png
FILES: npc01/03-identity-render.png
USAGE: Step 4 of NPC/01 — orthographic production views for modeling handoff.

PROMPT: |
  GOAL:
  Create a clean production turnaround sheet for THE COURT PARASITE using Image 1 as the mandatory identity anchor. Preserve exact face, proportions, wing collar, coat, cane, materials and palette from Image 1. This is a modeling reference, not a new costume redesign.

  LAYOUT:
  Landscape 2560×1440 on warm bone paper (#EDE8DF).
  Header top-left exact text:
  "NPC/01 — TURNAROUND"
  Subhead exact text:
  "THE COURT PARASITE — VARIANT A / WING COLLAR"
  Footer exact text once:
  "FRONT / 3-4 / SIDE / BACK — LOCKED TO IDENTITY RENDER"
  Four equal full-body panels in one horizontal row, labeled under each:
  "FRONT" | "3/4" | "SIDE" | "BACK"
  Thin vertical separators only. Same ground baseline, same figure height, soft contact shadows.
  Optional thin height ruler on far left with simple tick marks.
  English only. Sparse labels.

  CHARACTER CONSISTENCY FROM IMAGE 1:
  Extremely thin vertical court diplomat.
  High stiffened bat-wing collar flaring outward/upward behind the head.
  Long closed ankle-length dark void coat #120F17, sleeves slightly too long.
  Dried-blood burgundy lining #4A1830 visible only at collar interior / cuff / hem edge if angle allows.
  Bone-silk inner collar edge #C7B79B.
  Cold steel cane held close to the body in FRONT and 3/4; cane continues logically in SIDE; BACK shows coat back + collar rear plane + cane tip if visible.
  Pale cool porcelain skin, sleek black tightly controlled hair, calm half-lidded grey-silver eyes.
  Pointed dark boots.
  Controlled idle stance, feet close, no combat pose.

  VIEW RULES:
  FRONT: straight-on, arms relaxed, collar wings clearly readable left/right.
  3/4: matches Image 1 orientation closely.
  SIDE: pure profile; collar depth and coat length must remain honest; no flattened cartoon side.
  BACK: rear of collar structure and coat back seams must be designed, not a black blob. No face.
  Materials remain matte court fabric, not shiny latex. No extra weapons, no hood, no relic chains.

  STYLE:
  Painterly cinematic game concept art consistent with Image 1 lighting language, but cleaner studio presentation on paper field.
  Soft even key, readable edges, production clarity first.

  HARD CONSTRAINTS:
  Original design only. Do not drift into Loki / Dracula / Alucard / Sephiroth likeness.
  No logos, watermarks, stats, UI chrome, environment props beyond ground shadow.
  No text beyond specified labels.
  All four figures must be the same character and costume.

COMMENTS: |
  - Reject if collar collapses or changes shape between views.
  - Reject if BACK invents a cape or hood.
  - This sheet feeds expression/accessory and animation pose sheets.
