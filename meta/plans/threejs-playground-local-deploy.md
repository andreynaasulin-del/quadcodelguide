---
SECTION_ID: plans.threejs-playground-local-deploy
TYPE: plan
STATUS: complete
---

# Three.js Playground — local avatar interface

## Goal
Clone `ryanfitzpatrickio/threejs-playground`, install dependencies, build it, then run and verify the customizable avatar interface from the X reference locally. Do not deploy.

## Checklist
- [x] Clone repository into `.temp/threejs-playground` (1.18 GiB Git transfer)
- [x] Inspect package scripts, framework and deployment configuration: Vite + Solid + Three.js WebGPU; static output in `dist/`; existing target is Cloudflare Pages, no Vercel config
- [x] Install dependencies: 271 packages; npm reports 9 dependency vulnerabilities (2 moderate, 7 high)
- [x] Run the repository's defined build command: completed in 7.49s; static data export completed
- [x] Fix build errors without changing product behavior: no source build errors occurred; only large-chunk and ineffective dynamic-import warnings remain
- [x] Run locally and verify the main experience in browser: Vite ready in 671ms at `http://127.0.0.1:5173/`; Dreamfall experience menu rendered; WebGPU available; no browser errors (one Rapier deprecation info message)
- [x] Open the X-reference avatar interface directly at `http://127.0.0.1:5173/?view=sim-creator`; Character Maker canvas, morph controls, body selection, hair controls, presets and Garments tab rendered; preview reports `ready · idle`
- [x] Keep scope local-only; no deployment performed. Two accidental Vercel CLI starts were terminated before upload when inherited project linkage was detected
