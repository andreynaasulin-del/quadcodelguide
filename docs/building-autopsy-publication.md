# Building Autopsy: Convert an Abandoned Factory into a Boutique Hotel

**Category:** Architecture / Design  
**Level:** Senior  
**Models used:** GPT-Image 2.0 for the final concept render; SVG/HTML drawing system for measured diagrams and sheets.  
**Scope:** Concept study only. This is not a permit set or construction documentation.

## What this guide proves

A factory conversion becomes arbitrary when the new idea changes from drawing to drawing. This case holds one rule through the complete set: **keep the brick shell and cast-iron grid; cut one 18.0 × 12.0 m void at bays 3–4 / B–C; add an independent bronze frame, galleries and a set-back lantern.**

The building is a fictional 1912 textile factory, **54.0 × 24.0 m**, on a **6 × 4 structural grid**. The hotel contains **42 keys**: 2 accessible rooms on ground level and 20 rooms on each upper level.

## Asset order

| Order | Asset | Use |
|---:|---|---|
| Cover | `assets/building-autopsy/promo-banner-16x10.png` | Guide-card preview |
| 01 | `assets/building-autopsy/as-built-survey.png` | Existing-condition anchor |
| 02 | `assets/building-autopsy/keep-remove-add.png` | Intervention diagram |
| 03 | `assets/building-autopsy/proposed-ground.png` | Ground-floor plan |
| 04 | `assets/building-autopsy/proposed-upper.png` | Typical upper-floor plan |
| 05 | `assets/building-autopsy/longitudinal-section.png` | Atrium section |
| 06 | `assets/building-autopsy/exploded-axon.png` | Exploded axonometry |
| 07 | `assets/building-autopsy/facades-before-after.png` | Façade comparison |
| 08 | `assets/building-autopsy/material-palette.png` | Material rules |
| 09 | `assets/building-autopsy/atrium-render.png` | Final atmosphere render |
| 10 | `assets/building-autopsy/annotated-atrium-render.png` | Render annotation sheet |
| Download | `assets/building-autopsy/a1-presentation-sheet.png` | A1 presentation board |

## Step 1 — Fix the facts before making a gesture

Use one measured base file. Put the structural grid and the retained elements in it before moving a single wall.

**Prompt:**

```text
Create a concept-level measured as-built plan for a fictional 1912 textile factory.
Footprint: 54.0 m × 24.0 m. Grid: 6 bays at 9.0 m in the long direction and 4 bays at 6.0 m in the short direction.
Keep the brick perimeter, every cast-iron column, and two existing stairs in opposite corners.
Draw as a precise architectural survey sheet, not a mood board. Include grid labels 1–7 and A–E, a north arrow, dimensions, and a 1:200 scale bar.
```

**Result:** `as-built-survey.png`

**Check:** If the grid is not fixed now, the plans, section and render will contradict each other later.

## Step 2 — Make removal specific

The void does not mean “open up the centre.” It means one measured cut: **bays 3–4 / B–C**, with only **column 4/C** removed. The perimeter columns stay.

**Prompt:**

```text
From the 54 × 24 m as-built plan, create a keep/remove/add intervention diagram.
KEEP: brick perimeter, cast-iron grid, end stairs and all atrium-edge columns.
REMOVE: floor plates at levels +4.50 and +9.00 plus roof directly over bays 3–4 / B–C; remove only the column at grid 4/C.
ADD: a bronze independent frame around the 18.0 × 12.0 m void, two glass lifts, 2.0 m galleries and a roof lantern set back 1.5 m from the roof cut.
Use charcoal for keep, coral hatch for remove, mint and bronze for add. Give every operation a clear legend.
```

**Result:** `keep-remove-add.png`

**Check:** The plan must state one removed column, not a vague “column removal.”

## Step 3 — Program the ground floor around the void

Public life belongs to ground level. Service stays in one corner. The void is public space, not an excuse to lose the programme.

**Prompt:**

```text
Create a proposed ground-floor plan for the factory hotel using the fixed 6 × 4 grid.
Keep the 18.0 × 12.0 m atrium at bays 3–4 / B–C empty above ground level.
Place reception and entry south-west; restaurant and kitchen north-east; back-of-house and staff south-east; two accessible rooms north-west; two retained stairs in opposite corners.
Place a lounge bar and two glass lifts inside the atrium perimeter, without turning the void into enclosed rooms.
Show the grid, program labels and a short note explaining circulation.
```

**Result:** `proposed-ground.png`

## Step 4 — Stack keys without invading the atrium

The upper plan uses the same cut. Each level has **20 keys**, bedrooms along north and south façades, and a **2.0 m gallery loop** around the opening.

**Prompt:**

```text
Create a typical upper-floor plan for levels +4.50 and +9.00 using the exact same 54 × 24 m grid and 18 × 12 m atrium void.
Place 20 keys on each floor: 10 north-facing rooms, 10 south-facing rooms, with housekeeping and one suite at the east end.
Keep the two existing stairs. Add a 2.0 m gallery all around the void. No room, bathroom or service enclosure may enter the atrium.
Show level labels, grid, gallery width and room count.
```

**Result:** `proposed-upper.png`

## Step 5 — Use a section to prove the spatial claim

A plan can hide impossible ideas. The section makes the lantern, gallery and retained roof relationship visible.

**Prompt:**

```text
Draw a longitudinal architectural section through the centre of the atrium.
Show ground +0.00, level 1 +4.50, level 2 +9.00 and eaves +13.50.
Retain the sawtooth roof outside the atrium. Cut the roof over the 18 m void and add a low-iron glass lantern set back 1.5 m from its edges.
Show an independent dark bronze frame carrying the new lantern and gallery loads. Keep the existing brick shell separate from new steel.
Add a concept-only engineering note that licensed structural and fire review is required.
```

**Result:** `longitudinal-section.png`

## Step 6 — Explain the assembly, not just the silhouette

The exploded axon is a coordination tool. It exposes which layer is existing, cut, framed and glazed.

**Prompt:**

```text
Create an exploded axonometric diagram of the factory conversion in four layers.
01 RETAIN: brick shell and cast-iron grid.
02 CUT: floor plates at levels 1 and 2, and the roof, only over bays 3–4 / B–C.
03 FRAME: independent dark bronze steel around the void.
04 LANTERN: a low-iron glazed roof set back 1.5 m.
Keep the 18 × 12 m opening aligned in every layer and identify the single removed column at 4/C.
```

**Result:** `exploded-axon.png`

## Step 7 — Keep the façade calm

The new work should show itself at the roofline, not erase the building’s industrial identity.

**Prompt:**

```text
Create a before/after north façade sheet for a red-brick 1912 textile factory.
Retain the arched window rhythm and sawtooth profile. In the after view, add only a restrained glazed lantern over bays 3–4, visibly set back behind the parapet.
Do not reclad the façade, add oversized signs, or replace historic windows with curtain wall.
Use a clear comparison layout and label exactly what is retained and what is added.
```

**Result:** `facades-before-after.png`

## Step 8 — Give materials jobs

Brick carries history. Bronze names new structure. Glass delivers light. Oak and wool make the public room usable. If each material does the same job, the project turns into decoration.

**Prompt:**

```text
Create a restrained material palette for an adaptive-reuse boutique hotel.
Include: repaired existing red brick; dark bronze independent steel; low-iron glass; oak and moss-green wool for lounge interiors.
Add one construction-facing rule: all new metal and glass stop 25–50 mm short of historic brick, creating a visible shadow gap.
Use large samples, short labels and no generic trend names.
```

**Result:** `material-palette.png`

## Step 9 — Generate one render that obeys the drawings

**Prompt:**

```text
Deliverable: a single photorealistic architectural interior visualization, landscape 16:10.
Eye-level view from the reception side into an 18 m × 12 m central atrium in a converted 1912 textile factory.
Retain red brick, tall cast-iron columns and sawtooth roof profile. Add a dark bronze independent frame, two glass lift enclosures, 2.0 m galleries at levels +4.50 and +9.00, and a low-iron roof lantern set back 1.5 m from the cut roof edges.
Add a quiet lounge bar with oak, moss-green wool seating, restrained plants and a few guests.
Use a 35 mm lens, balanced verticals, soft overcast daylight, real material wear and physically plausible contact shadows.
No signage, text, logos, neon, cyberpunk styling, marble lobby, or extra floors.
```

**Result:** `atrium-render.png`  
**Model:** GPT-Image 2.0, high quality

## Final review checklist

- [ ] Atrium remains **18.0 × 12.0 m** in all plans and diagrams.
- [ ] Atrium stays at **bays 3–4 / B–C**.
- [ ] Only **column 4/C** is removed.
- [ ] Programme adds up to **42 keys**.
- [ ] The section uses +0.00 / +4.50 / +9.00 / +13.50.
- [ ] New bronze frame is visually separate from historic brick.
- [ ] Lantern is set back **1.5 m**.
- [ ] Render does not invent extra levels or a different spatial system.

## Limits

This is a senior concept workflow, not construction instruction. Before real work, commission a site survey; hazardous-material assessment; structural, fire, access, MEP and conservation review; and local planning approval.
