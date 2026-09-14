---
SECTION_ID: plans.ashmaw-realm-fps-ui
TYPE: note
---

# Ashmaw FPS + Quadcode UI

## Goal
Remove the obvious frame-time spikes, make the automatic quality choice conservative, replace the fantasy-glass HUD tables with the Quadcode guidebook language, and preserve a playable location-exploration build rather than a linear video.

## Playability pass
- [x] Make the adaptive scaler aim for 60 FPS, with conservative post-processing budgets.
- [x] Remove remaining camera/light/frame-loop allocations that cause GC hitches.
- [x] Add direct, in-world exploration entry points for village, castle, temple, falls, and caldera.
- [x] Verify interactive controls, performance fallback, and console health locally.

## Sky-only cut
- [x] Keep Free Flight as the only camera mode.
- [x] Remove village, castle, temple, falls, vegetation, props, torches, rain and ambient particle systems from construction and the frame loop.
- [x] Keep volcano terrain/lava, hero dragon, two lightweight secondary dragons, clouds, weather presets and time-of-day controls.
- [x] Disable high-tier shadow maps, reduce automatic tier optimism, and refresh PMREM every 8 seconds instead of every 2.5 seconds.

## Playability QA
- Renderer scales after 0.75 seconds below 55 FPS and recovers slowly only after 5 seconds above 62 FPS; resolution never drops below 70%.
- HUD contains five landmark entry points and the existing Cinematic / Orbit / Follow / Free Flight / Walk controls.
- Local QA at `http://localhost:8016/`: WebGL canvas and controls render; no JavaScript console errors.
- Browser automation detached before the final synthetic landmark click, so visual control presence and console health are verified; pointer-lock movement needs a manual desktop check.

## Plan
- [x] Inspect renderer, quality tiers, post chain, HUD, and guidebook reference.
- [x] Reduce the default GPU budget: resolution, shadow map size, post passes, live lights, and particle counts.
- [x] Remove per-frame allocations from the hot render path and stop rendering while the tab is hidden.
- [x] Restyle HUD panels and controls with Quadcode tokens: ink, red, square rules, dense uppercase labels.
- [x] Smoke-test the static app. No runtime errors in the browser console; the WebGL scene and revised HUD render at 1440×900.

## QA
- Verified locally at `http://localhost:8016/`.
- HUD no longer uses `backdrop-filter`; panels are opaque Quadcode ink with #ff3b30 active states and left rules.
- Renderer metrics are intentionally not exposed on `window`; prior in-HUD developer stats remain removed.

## Findings
- `ultra` currently starts at DPR 1.75, 4096px shadows, 62k grass, 14k rain, SSAO, bloom and SMAA at once.
- The render loop runs when the document is hidden.
- `PostFX` creates multiple `Vector2`/`Vector3` objects on each frame.
- Existing panels use expensive `backdrop-filter`, which hurts integrated GPUs and does not match the guidebook.