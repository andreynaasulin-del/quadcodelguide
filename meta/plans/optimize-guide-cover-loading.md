---
SECTION_ID: plans.optimize-guide-cover-loading
TYPE: plan
STATUS: complete
PRIORITY: critical
---

# Optimize guide cover loading

## Goal
Stop speculative loading of all 202 guide covers and replace oversized PNG card covers with optimized WebP assets.

## Quality gates
- Homepage must not call `warmAllGuideImages()`.
- Keep hover/click prefetch for the selected guide only.
- Convert only PNG files used as guide `image` or `poster` covers and larger than 500 KB.
- Preserve aspect ratio; cap cover width at 1920 px.
- Keep originals when they are still used inside guide steps.
- Update every matching cover reference in `guides.json`.
- Validate 202 unique guide IDs and zero missing local assets.
- Compare total source bytes and optimized bytes.

## Checklist
- [x] Audit 16 heavy PNG covers (45.17 MB total)
- [x] Generate optimized WebP covers (2.33 MB total; 94.9% smaller)
- [x] Update guide cover references
- [x] Remove bulk background warmup
- [x] Run asset and database QA: 202 records, 0 missing local assets
- [x] Measure local homepage transfer: 0.93 MB after 6 seconds, down from 34.95 MB production baseline
- [ ] Verify the same transfer reduction after deployment
