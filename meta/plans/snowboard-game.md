---
SECTION_ID: plans.snowboard-game
TYPE: note
---

# Powderline — snowboarding flow game

Location: `games/powderline/`. Standalone. Not part of the guide site, not deployed.

## Non-negotiables from the brief
- All art/sound/music generated in code. Nothing downloaded except the three.js engine itself (CDN importmap).
- Infinite seamless mountain.
- Speed is built by clean slow carving and lost by sloppiness.
- Mistakes are soft; only a full stability collapse is a wipeout (distance resets).
- Sunny day, icy patches, groomed main run, tree tunnels, terrain park, airtime.
- Shared-world online multiplayer + distance leaderboard.
- Target: locked 60 fps.

## Architecture
| file | job |
|---|---|
| `src/worldfn.js` | analytic field: height(x,z), surface type, ice, groom corridor, tunnels, park. Single source of truth for mesh + physics. |
| `src/terrain.js` | 3 LOD rings of heightfield geometry, re-centred on the rider. Custom shader (corduroy, ice sheen, sparkle). |
| `src/props.js` | instanced pines, rocks, rails, park flags. Deterministic scatter per 8 m cell. |
| `src/rider.js` | carve/edge/grip/flow/stability physics. |
| `src/camera.js` | chase spring, FOV vs speed, roll into turns, impact shake. |
| `src/particles.js` | edge spray, powder plume, wipeout burst, air glitter. |
| `src/sky.js` | sky dome shader, sun, distant procedural ridges, fog. |
| `src/audio.js` | synthesised sfx (carve/ice/wind/landing/pop). |
| `src/music.js` | generative warm house, tempo/density tied to flow. |
| `src/hud.js` | speed, flow arc, stability, distance, leaderboard. |
| `src/ghosts.js` | other riders + canvas name tags. |
| `src/net.js` | SSE client. |
| `server/server.mjs` | zero-dependency Node: static files + SSE fan-out + leaderboard + world seed. |

## Steps
- [x] plan
- [x] worldfn
- [x] terrain LOD + shader
- [x] rider physics + camera
- [x] props
- [x] particles + sky
- [x] audio + music
- [x] hud
- [x] net + server + ghosts
- [x] perf pass to 60 fps (instrumented, adaptive)
- [x] browser playtest: WebGL scene loaded, shared server connected, 58–60 FPS at 1440×900, zero console errors
- [x] visual QA: corrected oversized sun halo after screenshot review

## Fidelity pass v2
- [x] Reworked flat snow into wind slabs, corduroy shading, crystal flecks and stronger ice roughness response.
- [x] Preserved streamed infinite LOD after testing denser geometry and reverting it for frame time.
- [x] Fixed direct shadows and added stronger atmospheric separation.
- [x] Improved tree/rock materials and powder wake while keeping code-only instanced assets.
- [x] Re-tested at 1440×900: 60 FPS in AUTO, zero console errors. A failed micro-normal attempt measured 37–51 FPS and was removed.

## Fidelity pass v3 — PBR/post FX/snow accumulation
- [x] Generated normal/roughness/detail textures for snow, props and rider.
- [x] Adaptive SSAO + bloom post-processing; disabled below their frame-budget tiers.
- [x] Low-cost layered volumetric atmosphere tied to camera/rider.
- [x] Local 256×256 snow accumulation/deformation clipmap with recovery.
- [x] Integrated quality ladder, direct-render fallback and resize lifecycle.
- [x] Browser QA at 1440×900: gameplay renders, no console errors, AUTO observed 42–58 FPS on the test GPU. The 60 FPS target is approached but not locked in dense prop sections; AUTO drops post FX, shadows, atmosphere and prop radius first.

## Art direction pass v4 — alpine warmth and readable speed
- [x] Replaced the oversized flat sun sprite with a controlled warm shader glow and richer sky gradient.
- [x] Increased foreground/midground/horizon separation without another post pass.
- [x] Reframed the chase camera from 10.5 m / 84° maximum to 7.4 m / 74° maximum.
- [x] Added pine silhouette, color and scale variation inside the existing instanced draw call.
- [x] Added stronger warm/cool separation to groom, powder, ice and wind slabs.
- [x] Rebuilt horizon profiles with 180–240 segments and sharper alpine teeth.
- [x] Browser QA: no console errors; observed 42–60 FPS in AUTO. Screenshot automation became unreliable after hard refresh, but the live HUD and WebGL loop remained active.


## Tricks & controls pass v5 — kickers, flips, fixed steering
- [x] Steering un-inverted: ArrowLeft/A now turns left (world +x is screen-left with the chase cam).
- [x] Speed ceiling raised: speedCap 12+27*flow -> 14+34*flow (~172 km/h at full flow).
- [x] Kickers: seeded snow wedges with red lip markers on the groomed run (1 per 150 m segment, skipping park); launch scales with entry speed (vy = 3.2 + vh*0.42), needs > 9 m/s.
- [x] Fallen logs added as soft hazards (~every other segment).
- [x] Trick system: W/Up = backflip, S/Down = frontflip (7.4 rad/s off kickers), steer = spins (6.4 rad/s). Landing mid-rotation (flipErr > 0.85 rad) is a slam; kicker landings absorb up to impact 13 (vs 7.5 normal). Completed tricks announce (BACKFLIP / 360° SPIN) and pay flow.
- [x] Textures: procedural normal/roughness maps 2x resolution, anisotropy 4 -> 8.
- [x] Rider model: two legs + boots instead of one capsule, quilted jacket canvas texture with zipper/stripe.
- [x] QA: kicker trigger, flip accumulation (6.28 rad live), CLEAN LANDING + BACKFLIP announce chain verified in browser; no console errors, 47-60 FPS.
- Note: QA standalone windows kept closing between tool calls; verification was done in short single-shot scripts.