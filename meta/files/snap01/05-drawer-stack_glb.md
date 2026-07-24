---
SECTION_ID: files.snap01.05-drawer-stack_glb
TYPE: file/3d
---

# SNAP/01 — Drawer Stack Module (3D Mesh)

FILE: snap01/05-drawer-stack.glb
UTILITY: meshy
PROMPT: |
  Narrow modular kitchen drawer stack, 300 x 600 x 720 mm, floor-standing
  hard-surface furniture module, three stacked equal-height drawer fronts
  with a flat countertop cap, production 3D asset, clean quad topology,
  watertight.
IMAGE-INPUT: snap01/refs/drawer-stack-ref.png
TOPOLOGY: quad
TARGET_POLYCOUNT: 5000
SYMMETRY_MODE: auto
SHOULD_TEXTURE: true
ENABLE_PBR: true
TEXTURE_PROMPT: |
  Narrow modular kitchen drawer stack, 300 x 600 x 720 mm, floor-standing,
  three stacked equal-height drawer fronts. Oak veneer drawer fronts, flat
  color #C08A52 with subtle visible vertical wood grain and gentle
  specular sheen. Flat matte graphite composite countertop cap on the top
  edge only, flat color #22262B, completely matte, no gloss. One brushed
  steel bar pull handle per drawer, flat color #9AA3AC, cool neutral
  brushed-metal texture. No other materials or colors — no black hardware,
  no gold accents, no marble, no glossy lacquer.

COMMENTS: |
  - Part of SNAP/01 six-module production mesh set: base cabinet, wall
    cabinet, drawer stack, corner unit, island, appliance bay.
  - Source reference: cropped front-elevation icon from
    snap01/04-module-library.png. Locked dims 300x600x720mm — this module
    IS the 300mm grid pitch unit (narrowest width in the catalog).
  - Palette must exactly match OAK #C08A52 / GRAPHITE #22262B /
    STEEL #9AA3AC. Never mix with the blueprint UI palette
    (PAPER/INK/SIGNAL) from steps 1-2.
  - Quad topology, moderate poly budget (5k) for real-time configurator use.
