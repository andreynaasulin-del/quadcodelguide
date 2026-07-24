---
SECTION_ID: files.snap01.05-island_glb
TYPE: file/3d
---

# SNAP/01 — Island Module (3D Mesh)

FILE: snap01/05-island.glb
UTILITY: meshy
PROMPT: |
  Free-standing modular kitchen island, 1800 x 900 x 900 mm, hard-surface
  furniture module, four stacked drawer fronts with a waterfall-edge
  countertop wrapping over the top and down both sides, production 3D
  asset, clean quad topology, watertight.
IMAGE-INPUT: snap01/refs/island-ref.png
TOPOLOGY: quad
TARGET_POLYCOUNT: 9000
SYMMETRY_MODE: auto
SHOULD_TEXTURE: true
ENABLE_PBR: true
TEXTURE_PROMPT: |
  Kitchen island, oak veneer drawer fronts flat color #C08A52 with subtle
  vertical wood grain. Matte graphite waterfall-edge countertop wrapping
  top and both sides, flat color #22262B, no gloss, no marble. Brushed
  steel bar pull per drawer, flat color #9AA3AC, cool neutral brushed
  metal. No black hardware, no gold, no marble, no glossy lacquer.

COMMENTS: |
  - Part of SNAP/01 six-module production mesh set: base cabinet, wall
    cabinet, drawer stack, corner unit, island, appliance bay.
  - Source reference: cropped front-elevation icon from
    snap01/04-module-library.png. Locked dims 1800x900x900mm — largest
    footprint module, must preserve waterfall-edge countertop silhouette.
  - Palette must exactly match OAK #C08A52 / GRAPHITE #22262B /
    STEEL #9AA3AC. Never mix with the blueprint UI palette
    (PAPER/INK/SIGNAL) from steps 1-2.
  - Quad topology, higher poly budget (9k) — widest module, needs the
    waterfall-edge geometry to read cleanly at any camera angle.
