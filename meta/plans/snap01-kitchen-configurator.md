---
SECTION_ID: plans.snap01-kitchen-configurator
TYPE: plan
STATUS: in_progress
DATE: 2026-07-23
---

# SNAP/01 — Parametric Kitchen Configurator

## Concept
Senior-level Product/UX Design + 3D pipeline guide. Not a business plan — a
Quadcode Guide case study, same format family as NPC/01 (Gamedev) and
EMBER/01 (Industrial Design), but for **furniture e-commerce configurator UX**.

Differentiator vs NPC/01: the final deliverable is not just an inspectable
static GLB — step 7 embeds a **real interactive widget** (room-size inputs →
grid-snap module placement → live 3D), coded by hand (HTML/CSS/JS +
model-viewer or Three.js), not AI-generated.

## Style Guide (locked — do not drift)
Reference domain: real architectural / cabinetmaker shop drawings (blueprint
drafting convention), NOT a generic "clean SaaS UI" mood. Distinct from every
prior guide's palette (NPC/01 = void-black gothic, EMBER/01 = ember-orange
industrial).

- PAPER `#F3EDE1` — warm ivory drafting-paper backdrop (all technical
  sheets). v2 palette pivot: replaces original saturated Prussian-blue
  `#1B3A5C`, which caused eye strain at full-page scale. Reversed
  diazo-print convention (dark ink on light paper) — same "real blueprint"
  narrative, easier to read.
- INK `#2B3A55` — deep indigo-ink linework / dimension lines (was chalk-white
  `#EAF2F8` on the old dark backdrop)
- OAK `#C08A52` — real material accent (product-side renders only)
- SIGNAL `#FF6B35` — safety-orange, used ONLY for interactive/measurement
  callouts (dimension arrows, active snap-point, cursor) — unchanged
- GRAPHITE `#22262B` — UI chrome / dark mode surface (product configurator
  widget UI only, not the paper sheets)
- Typography: monospace (dimensions, numbers, callouts — architect lettering
  convention) + grotesk sans (headers/body). Google Fonts: **JetBrains Mono**
  + **Inter**.
- Motif: dimension arrows (↔ with tick marks), grid-snap ghost outlines,
  drafting-table cross-hatching — reused across every sheet for cohesion.

## Steps (8, mirrors NPC/01 step count/rhythm)
1. [ ] Wireframe & form logic — room-size input form + live SVG floor-plan
   preview, blueprint annotation style. Text must argue WHY live preview
   is mandatory (trust mechanism, not decoration).
2. [ ] Interaction-pattern decision matrix — Grid-Snap vs Freeform vs Rigid
   Presets scored on Trust / Speed / Error-rate / Build-cost (weighted).
3. [ ] Identity render — flagship kitchen configuration, OAK/GRAPHITE/STEEL
   product material palette (distinct from the blueprint UI palette above).
4. [ ] Module library orthographic sheet — 6 module types (base cabinet,
   wall cabinet, drawer stack, corner unit, island, appliance bay) with
   locked dimensions.
5. [ ] 3D mesh generation — GLB per module, production tris budget.
6. [ ] Build the real configurator widget — hand-coded HTML/CSS/JS page,
   screenshot of working state (this is code, not an AI image).
7. [ ] Interactive 3D — live embed of the working widget directly in the
   guide page (real drag/snap + orbit, not a passive viewer).
8. [ ] Technical spec — BOM fields, per-module pricing formula, collision
   rules (min clearance, corner logic).

## Delegation rule
All image/render generation for steps 1-5 → delegate to **Lumi** via
ToolRequestHelp, one step at a time, with the locked style guide above
pasted into every brief for consistency. Steps 6-7 (real widget) are pure
code — built directly, no image-gen tools.

## Current status
- [x] Concept, naming, style guide locked
- [ ] Step 1 asset generated (delegated to Lumi)
