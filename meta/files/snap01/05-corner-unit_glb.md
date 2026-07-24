---
SECTION_ID: files.snap01.05-corner-unit_glb
TYPE: file/3d
---

# SNAP/01 — Corner Unit Module (3D Mesh)

FILE: snap01/05-corner-unit.glb
UTILITY: meshy
PROMPT: |
  Floor-standing L-shaped kitchen corner unit, 900 x 900 x 720 mm,
  hard-surface furniture module with a diagonal-face door panel resolving
  the L-turn, flat countertop cap, production 3D asset, clean quad
  topology, watertight. The door face is one smooth continuous flat wood
  panel — no diagonal brace, no cross-beam, no board seam, no Z-brace
  pattern, no crack line, no distressed or weathered marks anywhere on
  the surface.
IMAGE-INPUT: snap01/refs/corner-unit-ref.png
TOPOLOGY: quad
TARGET_POLYCOUNT: 7000
SYMMETRY_MODE: off
SHOULD_TEXTURE: true
ENABLE_PBR: true
TEXTURE_PROMPT: |
  Floor-standing L-shaped kitchen corner unit, 900 x 900 x 720 mm, with a
  clean diagonal-face door panel resolving the L-turn (not a plain square
  box). Oak veneer diagonal door panel, flat color #C08A52 with subtle
  visible vertical wood grain and gentle specular sheen. Flat matte
  graphite composite countertop cap on the top edge, flat color #22262B,
  completely matte, no gloss. One brushed steel bar pull handle on the
  diagonal door, flat color #9AA3AC, cool neutral brushed-metal texture.
  No other materials or colors — no black hardware, no gold accents, no
  marble, no glossy lacquer.

COMMENTS: |
  - Part of SNAP/01 six-module production mesh set: base cabinet, wall
    cabinet, drawer stack, corner unit, island, appliance bay.
  - Source reference: cropped front-elevation icon from
    snap01/04-module-library.png. Locked dims 900x900x720mm — asymmetric
    L-turn geometry, disable symmetry so the diagonal face isn't mirrored
    into a generic square.
  - Palette must exactly match OAK #C08A52 / GRAPHITE #22262B /
    STEEL #9AA3AC. Never mix with the blueprint UI palette
    (PAPER/INK/SIGNAL) from steps 1-2.
  - Quad topology, slightly higher poly budget (7k) to preserve the
    diagonal-face L-turn edge cleanly.
