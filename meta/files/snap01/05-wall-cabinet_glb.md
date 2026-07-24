---
SECTION_ID: files.snap01.05-wall-cabinet_glb
TYPE: file/3d
---

# SNAP/01 — Wall Cabinet Module (3D Mesh)

FILE: snap01/05-wall-cabinet.glb
UTILITY: meshy
PROMPT: |
  Modular kitchen wall cabinet, 600 x 350 x 720 mm, wall-mounted hard-
  surface furniture module, two side-by-side hinged doors, production 3D
  asset, clean quad topology, watertight.
IMAGE-INPUT: snap01/refs/wall-cabinet-ref.png
TOPOLOGY: quad
TARGET_POLYCOUNT: 5000
SYMMETRY_MODE: auto
SHOULD_TEXTURE: true
ENABLE_PBR: true
TEXTURE_PROMPT: |
  Modular kitchen wall cabinet, 600 x 350 x 720 mm, wall-mounted, two
  side-by-side hinged doors, no countertop. Oak veneer door fronts, flat
  color #C08A52 with subtle visible vertical wood grain and gentle
  specular sheen. One brushed steel bar pull handle per door, flat color
  #9AA3AC, cool neutral brushed-metal texture, not chrome, not
  mirror-polished. No other materials or colors — no black hardware, no
  gold accents, no marble, no glossy lacquer.

COMMENTS: |
  - Part of SNAP/01 six-module production mesh set: base cabinet, wall
    cabinet, drawer stack, corner unit, island, appliance bay.
  - Source reference: cropped front-elevation icon from
    snap01/04-module-library.png. Locked dims 600x350x720mm.
  - Palette must exactly match OAK #C08A52 / STEEL #9AA3AC — no graphite
    countertop on this module (wall-mounted, no top surface). Never mix
    with the blueprint UI palette (PAPER/INK/SIGNAL) from steps 1-2.
  - Quad topology, moderate poly budget (5k) for real-time configurator use.
