---
SECTION_ID: files.npc01.06-animation-poses_png
TYPE: file/image
---

# NPC/01 — Animation Handoff Poses

FILE: npc01/06-animation-poses.png
DESCRIPTION: Four key animation handoff poses for THE COURT PARASITE variant A — idle, dialogue tell, spell cue, attack anticipation.
WIDTH: 2560
HEIGHT: 1440
UTILITY: gpt_image
QUALITY: high
OUTPUT_FORMAT: png
IMAGE-INPUT: npc01/03-identity-render.png
IMAGE-INPUT-2: npc01/04-turnaround.png
FILES: npc01/03-identity-render.png, npc01/04-turnaround.png
USAGE: Step 6 of NPC/01 — animation start poses for rigging and motion reference.

PROMPT: |
  GOAL:
  Create an animation handoff sheet for THE COURT PARASITE using Image 1 as the identity lock. Same costume, face, wing collar, cane and proportions. These are readable full-body key poses for animators, not a combat splash poster.

  LAYOUT:
  Landscape 2560×1440 warm bone paper (#EDE8DF).
  Header exact:
  "NPC/01 — ANIMATION HANDOFF"
  Subhead exact:
  "THE COURT PARASITE — VARIANT A"
  Footer exact:
  "IDLE / DIALOGUE TELL / SPELL CUE / ATTACK ANTICIPATION"
  Four equal full-body panels left to right, labeled under each exact:
  "01 IDLE"
  "02 DIALOGUE TELL"
  "03 SPELL CUE"
  "04 ATTACK ANTICIPATION"
  Same ground baseline and figure scale. Soft contact shadows. English only.

  POSE LOGIC:
  01 IDLE:
  Controlled court idle from Image 1 language — slight forward lean, cane vertical by leg, hands mostly hidden, collar dominant, almost no motion energy.

  02 DIALOGUE TELL:
  Upper body barely turns toward listener; head tilt minimal; one hand emerges from sleeve with two fingers lightly touching the cane head or own collar edge — the social tell. Face calm with one micro-expression of calculation.

  03 SPELL CUE:
  Cane tip lowers a few degrees toward ground or traces a small restrained arc; free hand partially visible with precise finger curl; coat hem still; no fireworks, no glowing runes explosion. Magic is etiquette-weaponized, not fireworks mage.

  04 ATTACK ANTICIPATION:
  Not a wide heroic lunge. Weight shifts back half a step, cane draws back like a thin needle, collar wings stay readable, body coils with elegant threat. No dual swords, no open screaming mouth, no bat wings as anatomy.

  CHARACTER LOCK:
  Extreme thinness, wing collar, void coat, blood lining accents, bone collar edge, steel cane, pale porcelain skin, sleek black hair from Image 1.
  Painterly cinematic game concept art, production clarity.

  HARD CONSTRAINTS:
  Original only — no Loki / Dracula / Alucard / Sephiroth.
  No logos, watermarks, VFX spam, particle storms, UI, stats.
  No text beyond specified labels.
  All four panels same character and outfit.

COMMENTS: |
  - Reject if poses destroy the silhouette readability of the wing collar.
  - Reject if attack pose becomes generic action-hero slash.
