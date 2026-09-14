---
SECTION_ID: plans.threejs-quadcode-character-creator
TYPE: note
---

# Quadcode character creator redesign

## Goal
Restyle the local Three.js character creator to match Guidebook Quadcode_9 and make wardrobe selection, fit preview, orbit, and zoom understandable without documentation.

## Plan
- [x] Inspect guidebook, creator components, wardrobe controls, and current CSS.
- [x] Reorganize wardrobe UI around selection first, then fit controls.
- [x] Add persistent viewport control legend and clearer selected-garment state.
- [x] Apply Quadcode palette, typography hierarchy, spacing, borders, and accessible focus states.
- [x] Build locally; production build passes.
- [x] Run visual QA for Appearance and Garments at 1440×1000.
- [x] Fixed 3 real overlap/perf bugs found by pixel-diff (2025 pass):
  1. `.garage-orbit-hint` used `left:50%/translateX(-50%)` centered on the
     FULL shell — but garment-mode narrows `.garage-canvas` to the right 42%,
     so the hint bar landed half-under the left inspector panel. Added
     `.garment-mode .garage-orbit-hint { left:auto; right:20px; transform:none }`.
  2. `.sim-outfit-card:first-child` ("None") had two conflicting min-height
     rules (78px vs 132px) at equal specificity; source order let 132px win,
     leaving ~55px dead space above the label. Re-asserted 64px with a
     3-selector rule.
  3. `.garage-panel`/`.sim-garment-editor` carried `backdrop-filter:blur(18px)`
     over an already-94%-opaque background — pure GPU cost recomputed every
     frame the WebGPU canvas repaints (idle anim never stops), near-zero
     visual gain. Removed.
- [x] Verified in browser at 1424×793 real viewport (standalone window):
  Appearance tab clean, Garments tab clean (None card compact, orbit hint
  inside canvas bounds, Executive Suit inspector renders without overlap).
- [ ] Finish visual QA when WebGPU is available in the preview browser (current browser stalls at 16%).
- [x] Fix garment panel/header overlap and expose body compatibility on every card.

## Verification
- `npm run build` passes in `.temp/threejs-playground` (1451 modules, 6.00s).
- Local Vite server: `http://127.0.0.1:5174/?view=sim-creator`.
- Appearance and Garments render correctly in the browser; garment cards are sorted with compatible items first.
- Browser logs one WebGPU provider fallback message, but the character and interface render and remain interactive.
