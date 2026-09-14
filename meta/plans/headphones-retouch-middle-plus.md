---
SECTION_ID: plans.headphones-retouch-middle-plus
TYPE: note
---

# Premium Headphones Retouch & Color Grade — Middle+ Guide

## Goal
Turn one raw product photograph into a commercial-ready set: clean hero, e-comm square, and vertical detail shot while preserving metal and leather textures.

## Deliverables
1. Raw source photo (1024×1024)
2. Hero 16:9 — clean, premium lighting
3. 1:1 e-comm shot
4. 9:16 detail (macro on ear cup + leather)

## Workflow
- Flux (create_image_flux) → raw source
- Flux2Pro with references (gen_or_edit_image_flux2pro_with_refs) → retouch passes
- Controlled edits only (no full regeneration)

## Quality gates
- No plastic-looking metal
- Leather grain preserved
- Reflections controlled, not removed
- Consistent lighting across all three deliverables

## Status
- [x] Plan created
- [x] Raw source generated (headphones-retouch/raw-source.png, 1024×1024, Flux)
- [x] Retouch passes (Flux2Pro → 402 → switched to GPT-Image high quality)
- [x] All three formats delivered (hero-16x9, ecomm-1x1, detail-9x16)
- [x] All 4 assets upscaled to 4K via SeedVR2 (headphones-retouch/upscaled/) — Flux-Turbo failed, switched
- [x] Banner preview (16:10 before/after split) generated via GPT-Image
- [x] Guide written and published — LIVE: https://quadcodeguide.vercel.app/#/guide/headphones-retouch-color-grade (33 guides total)
