---
SECTION_ID: plans.trust-audit-all-guides
TYPE: plan
STATUS: in_progress
PRIORITY: critical
DATE: 2026-09-14
---

# Trust audit of all 52 guides

Policy: `meta/rules/guide-trust.md`. Per guide: cuts → mid-shot sheet → verify every
noun → rewrite → ≤3 steps → each step visual is a cut from the final that proves the
sentence (otherwise merge the step) → apply → media:check → route 200.

No generated illustrations — decided 2026-09-14, see policy §2.

Batch = 5 guides. After each batch: commit, update this table, update pin.

## Legend
`T` text verified · `S` steps ≤3 · `V` every step visual proves its sentence

## Batch A — 2026-09-14
| id | T | S | V | note |
|---|---|---|---|---|
| gym-diary-pov-vlog | ✅ | ✅ | ✅ | step1 frame proves forearm in shot |
| seoul-street-food-fisheye-tape | ✅ | ✅ | ✅ | step1 frame proves round fisheye mask |
| white-fit-fisheye-fashion-film | ✅ | ✅ | ✅ | step1 frame proves ankle-height camera |
| polar-scalp-shampoo-ad | ✅ | ✅ | ✅ | step2 frame proves the "ANTI ING ECALR" label |
| anatomy-atelier-3d-explorer | ✅ | ✅ | ✅ | step1 rail frame proves two-line rows |

## Batch B — 2026-09-10 (7) ✅
| id | T | S | V | what was wrong |
|---|---|---|---|---|
| winter-ops-fps-industrial | ✅ | ✅ | ✅ | claimed a consistent weapon; rifle changes model between 0:06 and 0:36. Yard called snowy — it is wet asphalt |
| anime-caramel-pudding-recipe | ✅ | ✅ | ✅ | "eight cuts" — there are ten shots; face appears at 0:13, not "the last second" |
| fauxreal-gaussian-splat-loop | ✅ | ✅ | ✅ | claimed cuts and an orbit; there are zero cuts, transitions are point-cloud collapses |
| graphics-lab-render-library | ✅ | ✅ | ✅ | generic "one scene one technique"; the real story is the HUD printing fps/draws/triangles/grating pitch |
| ps5-controller-configurator-page | ✅ | ✅ | ✅ | "thumbnail rail" does not exist — arrows; swap is hidden inside a 90° turn and re-themes the page |
| seoul-arcade-minidv-tape | ✅ | ✅ | ✅ | "cuts to black" — blackdetect finds nothing; win/loss beat not in the render |
| castlevania-pixel-art-prompt-breakdown | ✅ | ✅ | ✅ | "same hunter as step 01" is false; added step 9 showing the drift |

## Batch C — 2026-09-09 (8)
## Batch D–H — July (32), 5 per batch. Priority: 9 image-only, 4 audio first.

## Known dead steps (no media, no embed) — delete unless embed exists
- jerry01-quadcode-testimonials step 5
- snap01-parametric-kitchen-configurator steps 5, 7
- npc01-dark-fantasy-deceiver step 7

## Progress log
- 2026-09-14: Batch A verified frame-by-frame and rewritten (faf450e). Trust policy
  written. Generated illustrations tried and rejected — evidence stays cuts from finals.
- 2026-09-14: Batch B verified and rewritten. 12/52 done. Two claims were checked with
  numbers rather than by eye and both failed: `blackdetect` found no black frame in
  seoul-arcade despite the prompt asking for one, and `signalstats` YAVG measured the
  door flare at 83 → 139 → 94. Verification scripts live in `.temp/` (sheet, zoom, pick,
  crop, black, facts, dump, ev, evimg, imgsheet, imgcrop) — see pin `trust-audit`.
