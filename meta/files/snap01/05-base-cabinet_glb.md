---
SECTION_ID: files.snap01.05-base-cabinet_glb
TYPE: file/3d
---

FILE: snap01/05-base-cabinet.glb
DESCRIPTION:
PROMPT: |
  Modular kitchen base cabinet, 600 x 600 x 720 mm, floor-standing hard-
  surface furniture module, flush to the floor with NO legs and NO feet,
  two stacked drawer fronts with a flat countertop cap, production 3D
  asset, clean quad topology, watertight, uniform clean surface with no
  texture noise or blotching.
UTILITY: meshy
IMAGE-INPUT: snap01/refs/base-cabinet-ref.png
SHOULD_TEXTURE: true
TEXTURE_PROMPT: |
  Modular kitchen base cabinet, 600 x 600 x 720 mm, floor-standing, two
  stacked drawer fronts. Oak veneer drawer fronts, flat color #C08A52 with
  subtle visible vertical wood grain and gentle specular sheen. Flat matte
  graphite composite countertop cap on the top edge only, flat color
  #22262B, completely matte, no gloss, no speckle, no marble veining.
  Brushed steel bar pull handle on each drawer, flat color #9AA3AC, cool
  neutral brushed-metal texture, not chrome, not mirror-polished. No other
  materials or colors — no black hardware, no gold accents, no marble, no
  glossy lacquer.
TARGET_POLYCOUNT: 6000
# SNAP/01 — Base Cabinet Module (3D Mesh)

TOPOLOGY: quad
SYMMETRY_MODE: on
ENABLE_PBR: true
COMMENTS: |
  - Part of SNAP/01 six-module production mesh set: base cabinet, wall
    cabinet, drawer stack, corner unit, island, appliance bay.
  - Source reference: cropped front-elevation icon from
    snap01/04-module-library.png. Locked dims 600x600x720mm must be
    respected in proportions.
  - Palette must exactly match OAK #C08A52 / GRAPHITE #22262B /
    STEEL #9AA3AC — this is the product-material palette, never mix with
    the blueprint UI palette (PAPER/INK/SIGNAL) used in steps 1-2.
  - Quad topology, moderate poly budget (6k) — real-time configurator
    performance target, not a hero character-level mesh.
