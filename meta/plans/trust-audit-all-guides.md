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

## Batch C — 2026-09-09 (8) ✅
| id | T | S | V | what was wrong |
|---|---|---|---|---|
| rooftop-run-cel-shaded-trailer | ✅ | ✅ | ✅ | called cel-shaded — there are no ink lines; hero is red-haired and bare-headed, prompt asked for a blond swordsman in a pointed cap; "five shots" = one cut at 15.08s |
| blocky-world-photoreal-remaster | ✅ | ✅ | ✅ | "four biomes, four shots" = 3 takes; temple→desert is one take through a doorway; whole reel is first-person holding a lava block; the character is re-skinned in gold and has no face |
| metro-ruins-fps-walkthrough | ✅ | ✅ | ✅ | "weapon bolted to the camera" — its instruments swap mid-take (pressure gauge → digital counter); claimed a firefight: no muzzle flash in any frame, audio flat at ~-24 dB |
| interior-render-model-battle | ✅ | ✅ | ✅ | claimed both models interpreted the brief; only one built the briefed house. Sync is real (both halves cut at 6.10/13.17/21.20) and the ending is a bedroom nobody asked for |
| arcade-fighter-pixel-match | ✅ | ✅ | ✅ | "HUD as pixel art" — the health bar simulates correctly but the timer is frozen at 99 and the P2 tag turns into P1 |
| forest-ops-tactical-fps | ✅ | ✅ | ✅ | rain was the selling point and there is none (round bokeh, no streaks); bunker came back as a wooden cabin; an uncast second operator waits in the doorway; master is 1440p, not 4K |
| crimson-adventure-trailer | ✅ | ✅ | ✅ | character block held perfectly but the outfit is not the one written; "environment every six seconds" = 22.6s single take after 7.71s; the golem climax was never briefed |
| brazil-street-documentary | ✅ | ✅ | ✅ | "do not ask for a turn" — she turns to camera at 0:00.2 and again at 0:06.2 with a smile, unprompted, inside a zero-cut take |

## Batch D — July audio (4) ✅
| id | verdict |
|---|---|
| jazz-rnb-restaurant-track | 86.1 BPM vs 85 asked ✓; fades out (cannot loop); −13 LUFS / 0.0 dBTP too hot; one structural move at 2:01 |
| velvet-hour-ad-instrumental | logo-safe 4-bar intro absent (bass in bar 1); no mid lift (LRA 1.8); fade to hit 90.00s; cover trumpet rests on velvet, not submerged |
| brass-marble-ad-instrumental | "stabs every 2 bars" = 4.574s measured vs 4.551s theory ✓; breakdown + hard ending absent; cover matches prompt exactly |
| after-midnight-ad-instrumental | "sparse" bought a real 13.0s intro; "1–4 kHz open" worth ~2 dB vs siblings; cover 91.8% black vs 70% asked |

Theme: the model obeys numbers and grids, ignores narrative structure, and always
fades to land on an exact duration. All four cut 4 steps → 3.

## Batch E–H — July (28), 5 per batch. Priority: 9 image-only next.

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
- 2026-09-14: Batch C verified and rewritten. 20/52 done. New verification tools:
  `track.sh` (same crop region across timestamps — caught the metro weapon swapping
  instruments and the arcade P2→P1 tag), `halfcuts.sh` (cuts inside one half of a
  split-screen — proved the interior battle is genuinely synced), `spikes.sh` (per-frame
  luma) and `loud.sh` (audio RMS), which together disproved the metro "firefight".
  Note: full-range YUV sources crash the jpeg encoder — `sheet.sh` and `pick.sh` now
  force `yuvj420p`, and `evtrack.sh` caps strips at 1920px for media:check.
