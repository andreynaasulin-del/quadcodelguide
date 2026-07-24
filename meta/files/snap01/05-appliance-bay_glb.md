---
SECTION_ID: files.snap01.05-appliance-bay_glb
TYPE: file/3d
---

# SNAP/01 — Appliance Bay Module (3D Mesh)

FILE: snap01/05-appliance-bay.glb
UTILITY: meshy
PROMPT: |
  Tall floor-to-near-ceiling modular kitchen appliance bay tower, 600 x 600
  x 2100 mm, hard-surface furniture module, oak storage panels on the top
  and bottom thirds with a flush built-in-oven panel in the middle third,
  production 3D asset, clean quad topology, watertight.
IMAGE-INPUT: snap01/refs/appliance-bay-ref.png
TOPOLOGY: quad
TARGET_POLYCOUNT: 7000
SYMMETRY_MODE: off
SHOULD_TEXTURE: true
ENABLE_PBR: true
TEXTURE_PROMPT: |
  Tall appliance bay, oak veneer panels top and bottom flat color #C08A52
  with subtle vertical wood grain. Flush dark near-black glass oven panel
  in the middle third, thin brushed steel trim flat color #9AA3AC, no
  brand text or logos. No black hardware beyond oven glass, no gold, no
  marble, no glossy lacquer.

COMMENTS: |
  - Part of SNAP/01 six-module production mesh set: base cabinet, wall
    cabinet, drawer stack, corner unit, island, appliance bay.
  - Source reference: cropped front-elevation icon from
    snap01/04-module-library.png. Locked dims 600x600x2100mm — tallest
    module, must preserve the three-thirds proportion (oak/oven/oak).
  - Palette must exactly match OAK #C08A52 / STEEL #9AA3AC + the oven's
    own dark near-black glass front. Never mix with the blueprint UI
    palette (PAPER/INK/SIGNAL) from steps 1-2.
  - Quad topology, moderate-high poly budget (7k) to keep the oven panel
    frame crisp on a tall thin silhouette.
