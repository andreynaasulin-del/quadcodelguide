---
SECTION_ID: plans.real-estate-sales-kit
TYPE: note
---

# Real-estate sales kit — implementation plan

## Goal
Turn one empty-apartment photograph into a coherent English-language property sales kit while preserving architecture, camera position, windows, doors, wall openings, floor pattern, and room proportions.

## Deliverables
1. Empty apartment source — 3:2, 2K.
2. Furnished daytime hero — same 3:2 frame and geometry.
3. Furnished night version — same room, furniture, and camera.
4. Quadcode Guide preview — crop-safe 16:10, English title.
5. Property listing creative — 4:5, English property facts and CTA.
6. Story creative — 9:16, English copy, critical content inside safe zones.

## Models
- Nanobanana Pro: generate the controlled empty source plate.
- GPT-Image 2.0: identity-preserving furnishing, relighting, recomposition, and legible advertising typography.

## Quality gate
- No architectural drift between source/day/night.
- No duplicated furniture, warped windows, floating objects, or fake floor seams.
- Day/night pair must be recognizably the same property and furniture layout.
- 16:10 preview keeps the room, title, and subtitle clear at card size.
- 4:5 and 9:16 assets are recomposed, not center-cropped.
- Story keeps critical copy away from the top and bottom UI zones.

## Status
- [x] Concept and production structure locked
- [ ] Empty source generated and approved internally
- [ ] Daytime furnished hero generated
- [ ] Night version generated
- [ ] 16:10 preview generated
- [ ] 4:5 listing creative generated
- [ ] 9:16 Story generated
- [ ] Visual QA across all six assets
- [ ] Publish only after explicit PO approval
