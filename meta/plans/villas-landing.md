---
SECTION_ID: plans.villas-landing
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# /cars — Luxury exotic cars landing (pivot from villas)

GOAL: Premium landing page at /cars with scroll-driven orbital car animation (canvas frame scrub, Flowty-style mechanics, our own design). English-only copy.

## Pipeline
- [ ] 1. Hero car reference image (gpt_image, studio, hypercar, dramatic lighting)
- [ ] 2. Orbit video (Seedance, 10s camera arc around car, constant height, no zoom)
- [ ] 3. Extract ~120 webp frames via ffmpeg -> cars/assets/frames/
- [ ] 4. Gallery images x4 (gpt_image: interior, wheel/brake detail, rear 3/4, night city)
- [ ] 5. Build cars/index.html: smooth scroll (lerp), sticky orbit section w/ canvas scrub, hero masked reveal, gallery parallax, specs strip, CTA "Book a private test drive"
- [ ] 6. vercel.json rewrite /cars -> /cars/index.html
- [ ] 7. Local test (frames scrub, reduced-motion, mobile fallback) + deploy

## Style guide (page-local)
- Palette: carbon black #0B0B0D, graphite #17181C, champagne gold #C9A961, signal red #D8232A accent, bone white #EDEAE4 text
- Type: Space Grotesk display + Inter body
- Animations: transform/opacity only, ease cubic-bezier(.16,1,.3,1), full prefers-reduced-motion support
- English-only copy

## Notes
- Frame scrub: section 400vh, sticky 100vh canvas, progress -> frame index
- Preload: poster + first 15 frames eager, rest via requestIdleCallback batches
- Touch/reduced-motion: native scroll fallback
- Villa meta (files.villas.*) is obsolete — superseded by this pivot
