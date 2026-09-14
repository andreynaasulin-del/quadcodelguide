---
SECTION_ID: plans.step-evidence
TYPE: plan
STATUS: in-progress
DATE: 2026-09-14
SCOPE: ui_views/guides.json, ui_views/landing.html, scripts/step_evidence.mjs, ui_views/assets/evidence/**
---

# Step evidence — honest visuals under every guide step

## Problem
188 steps, 98 with media. 86 steps (28 video guides, 4 music) show nothing until the last step.
No intermediate renders exist; only finals. Inventing intermediates with AI is banned (rules.media-format) and reads as fake.

## Approach
Each step gets the slice of the FINAL it is responsible for, labelled as such:
- `frame`   — WebP still at a timestamp → kicker "Frame from the final render · 0:03"
- `clip`    — 4 s muted H.264 excerpt (≤1280w, ≤1.5 MB) + poster → "Excerpt from the final render · 0:08–0:12"
- `audio`   — 12 s MP3 excerpt (160k, faded) → "Excerpt from the final track · 0:00–0:12"
Plus a hand-written `result_caption` per step: what to look at, why this step caused it.
`result_source: "final"` marks derived evidence in the data.

## Steps
- [x] `scripts/step_evidence.mjs` — audit / sheet / apply (ffmpeg only, STANDARD-compliant)
- [x] audit: 86 steps, all sources present
- [x] contact sheets → timecodes picked by eye for all 32 sources (`.temp/evidence/sheets/`)
- [x] `scripts/step_evidence_plan.json` — 86 timecodes + hand-written captions
- [x] renderer: kicker from `result_label` (+ cut-mark for derived), `result_caption`, `.m-excerpt` audio player (one at a time, countdown, stops on hashchange)
- [x] `normalize.mjs` gates `steps[].result_audio`
- [x] apply: 86 assets, 39 MB total → `ui_views/assets/evidence/<guide>/`; `media:check` 47 guides 0/0
- [x] verified on http://localhost:9099/ — metro-ruins (frame+clip), velvet-hour (3 excerpts, switch/stop), gta-skate (4 evidence blocks); no console errors from page code
- [ ] commit (no push) → PO review

## Acceptance
- Every step in every guide has a visual (or audio) block.
- No kicker says "Result" for a derived asset — it says where it came from and the timecode.
- Added weight ≤ 60 MB total, all lazy.
