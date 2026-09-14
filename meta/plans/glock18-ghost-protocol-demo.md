---
SECTION_ID: plans.glock18-ghost-protocol-demo
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Glock-18 | Ghost Protocol — procedural Three.js inspector

## Goal
Reproduce the interaction model seen in the reference screencast
(`.temp/upload/ssstwitter.com_1785513763705.mp4`, 60 s, 1752x1080, silent):
a procedurally generated Glock-18 with a parts inventory, explode/assemble,
isolate, per-part materials and a "view generated source" panel.

Nothing is loaded from a GLB. Every part is code: extruded profiles plus
primitives, materials built from numbers, wear texture painted into a canvas
at runtime.

## Where
`glock18-ghost-protocol/` — static, no build step, ES modules only.
Three.js vendored from `audio-reactive-identity/vendor` (r18x, no new deps).

## Anatomy source
`docs/cs2-anatomy/pistols.md` in the local img2threejs clone. Rules taken from it:
- painted surfaces = slide, frame, grip panels
- bare metal = sights, controls, trigger (never skinned)
- Well-Worn = bare metal exposed at front strap and slide high points

## Units
1 unit = 1 cm. Real Glock-18 numbers: length 18.6, height 13.9 with magazine,
width 3.0, barrel 11.4, sight radius 16.5.

## Checklist
- [x] Probe reference video, extract 12 frames, read the UI at 5 s intervals
- [x] Create folder, vendor Three.js
- [ ] `build-glock18.js` — part factory, 5 modules, real triangle counts
- [ ] `skin.js` — canvas-generated Ghost Protocol finish + GHOST/PROTOCOL type
- [ ] `orbit.js` — own orbit/zoom controller (no OrbitControls dependency)
- [ ] `app.js` — raycast pick, parts panel, explode, isolate, source viewer
- [ ] `styles.css` — dark stage, left dossier column, right parts column
- [ ] Browser QA: 60 fps, no console errors, every part clickable
