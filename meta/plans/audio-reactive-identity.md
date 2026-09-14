---
SECTION_ID: plans.audio-reactive-identity
TYPE: plan
STATUS: build_verified
DATE: 2026-07-29
---

# Audio-Reactive Identity

## Goal
Build a self-contained, publishable guide demo that turns real audio into a responsive Three.js identity object through Web Audio API FFT data and shader uniforms.

## Source decision
The selected 21st.dev Music Reactive Hero Section proves the interaction pattern but locks its `Component.tsx` behind authentication. Do not claim that its implementation was copied. Build the mechanism independently and keep all runtime assets local.

## Visual system
- Anchor: one large deformed icosahedron, always readable as the identity object.
- Spark: a horizontal FFT spectrum cut through the lower stage.
- Palette: near-black `#08090D`, bone `#E8E2D6`, signal coral `#FF654F`, electric mint `#8CFFD4`.
- Typography: system grotesk plus monospace telemetry.
- Motion: audio drives displacement and glow; idle motion remains restrained.

## Build checklist
- [x] Inspect source concept and confirm code-access constraint
- [x] Self-host Three.js and license
- [x] Implement Web Audio graph: source → analyser → destination
- [x] Map FFT bands to shader uniforms
- [x] Add speed, noise and intensity controls
- [x] Add demo loop and local audio upload
- [x] Add pause, reduced-motion and no-WebGL states
- [x] Verify controls and audio state locally
- [x] Measure FPS at desktop and narrow viewport
- [x] Capture publishable result image
- [x] Prepare guide record and assets
- [x] Integrate locally after PO approval to continue
- [ ] Commit and push only after explicit PO approval
- [ ] Verify production URL after Vercel deployment

## Guide packaging evidence
- Guide ID: `audio-reactive-identity-lab`.
- Dataset parses with 97 records; new guide has 8 steps and Senior level.
- `node scripts/check_guides_assets.mjs`: `missingLocal=0`, `blobRefs=0`, `noCover=0`.
- Real-build cover saved at `ui_views/assets/audio-reactive-identity/cover.png`; no AI-generated substitute.
- Final step embeds `/ui_views/assets/audio-reactive-identity/index.html`.
- Site renderer shows 8 steps, the correct cover and a 636 px live iframe; embedded canvas is 634×600 with WebGL active.
- Embedded AudioContext reaches `running` after the required click; no console errors or external requests.
- No commit, push or production deployment has been performed.

## QA evidence
- Zero console errors and zero external runtime requests.
- Demo signal measured bass ~0.99, mids ~0.39 and highs ~0.10.
- Stable standalone desktop run: 59.88 median FPS at 1280×900.
- Mobile run at 390×844: no horizontal overflow; primary controls are 44–46px high.
- Pause suspends AudioContext and clears FFT values to 00/00/00.
- Three.js r185 requires `three.module.js` plus `three.core.js`; both are stored locally.
- Nothing was added to `guides.json`; no commit, push or production deployment was performed.

## Acceptance criteria
- AudioContext starts only after a user gesture.
- Real `AnalyserNode` FFT data changes the mesh and spectrum.
- Speed, noise and intensity controls visibly affect separate parameters.
- Demo works without external audio files by generating its own loop.
- User can load a local audio file; it never leaves the browser.
- No runtime network requests after initial document load.
- Desktop target: median 55+ FPS at 1440×900; adaptive pixel ratio protects slower devices.
- Keyboard controls have labels and visible focus.
