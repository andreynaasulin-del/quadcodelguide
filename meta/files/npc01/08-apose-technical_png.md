---
SECTION_ID: files.npc01.08-apose-technical_png
TYPE: file/image
---

# NPC/01 — Technical A-Pose & Rigging Sockets Specification

FILE: npc01/08-apose-technical.png
DESCRIPTION: Technical orthographic A-Pose sheet with socket nodes, texel density parameters, bone hierarchy and material channel specs.
WIDTH: 2560
HEIGHT: 1440
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: npc01/03-identity-render.png
IMAGE-INPUT-2: npc01/04-turnaround.png
FILES: npc01/03-identity-render.png, npc01/04-turnaround.png
USAGE: Step 7 of NPC/01 — 3D rigging and engine socket technical handoff.

PROMPT: |
  GOAL:
  Create a production-grade 3D technical rigging sheet for THE COURT PARASITE in clean orthographic A-Pose using Image 1 as face/costume anchor and Image 2 for turnaround proportions.

  LAYOUT:
  Landscape 2560×1440 blueprint-style technical paper (#16181D dark slate or #EDE8DF bone paper with crisp grid lines).
  Header top-left:
  "NPC/01 — TECHNICAL A-POSE & SOCKET HANDOFF"
  Subhead:
  "3D RIGGING SPEC / POLY BUDGET: 35,000 TRIS / TEXEL DENSITY: 1024 PX/M"

  LEFT / CENTER:
  Full-body orthographic A-Pose character model facing camera straight-on.
  Arms angled downward at 45 degrees in clean A-pose, fingers spread naturally, feet parallel, neutral expression.
  Overlaid technical vector callout lines and target nodes in bright cyan/amber:
  - "SOCKET: socket_hand_r" (at right palm for cane attachment)
  - "SOCKET: socket_collar_vfx" (at back collar base for shadow energy node)
  - "SOCKET: socket_ring_l" (at left index finger)
  - "PIVOT: root_ground" (at ground baseline between feet)
  - "WEIGHTING ZONE: void_coat_cloth_phys" (skirt/coat cloth physics capsule)

  RIGHT ZONE — TECHNICAL SPECIFICATION BLOCK:
  1) POLYGON BUDGET:
     - Total: 35,000 tris (LOD0)
     - Head / Collar: 12,000 tris
     - Coat / Body: 18,000 tris
     - Props (Cane/Ring): 5,000 tris
  2) TEXTURE MAPS (2048×2048 PBR):
     - M_VoidCoat: Albedo, Normal, Roughness, Metallic, Opacity
     - M_BoneCollar: Albedo, Normal, Roughness, AO
     - M_SteelCane: Albedo, Normal, Roughness, Metallic
  3) RIGGING & FACS BLENDSHAPES:
     - Skeleton: 68 Joints + 4 Cloth Dynamics Chains
     - FACS facial targets: AU1, AU2, AU4, AU12, AU15, AU25

  STYLE:
  Professional AAA gamedev technical sheet, orthographic blueprint lines, clean English sans-serif typography, zero decorative fantasy fluff.

  HARD CONSTRAINTS:
  Must preserve character identity from Image 1. Clear readable A-Pose required for rigging. No logos, watermarks, fake health bars.
COMMENTS: |
  - Must serve as exact technical reference for 3D character artists and riggers.
