---
SECTION_ID: facts.step-evidence
TYPE: fact
STATUS: active
DATE: 2026-09-14
SCOPE: ui_views/guides.json, ui_views/landing.html, scripts/step_evidence.mjs, scripts/step_evidence_plan.json, ui_views/assets/evidence/**
---

# Step evidence — how every step got a visual

## Data contract (per step)
| field | meaning |
|---|---|
| `result_image` / `result_video`+`result_poster` / `result_audio` | the asset |
| `result_label` | kicker text. For derived assets: `Frame from the final render · 0:12`, `Excerpt from the final render · 0:06–0:10`, `Excerpt from the final track · 0:30–0:42`. Missing → renderer prints `Result`. |
| `result_caption` | one hand-written line: what to look at, why this step caused it. Rendered with an → prefix. |
| `result_source: "final"` | asset was cut from the guide's final render, not a separate generation. Renderer adds a small square cut-mark before the kicker. |

Never fake intermediates. If a step has no saved intermediate, cut from the final and label it as such.

## Regenerate / add
```bash
node scripts/step_evidence.mjs --audit    # steps without media + source durations
node scripts/step_evidence.mjs --sheet    # 4x3 contact sheet per video → .temp/evidence/sheets/
# edit scripts/step_evidence_plan.json: { "<guide-id>": { "<stepNo>": { type: frame|clip|audio, at: sec, caption } } }
node scripts/step_evidence.mjs --apply [--guide id]
npm run media:check
```
Only steps with no media are touched; existing `result_*` are never overwritten.

## Assets
- `ui_views/assets/evidence/<guide-id>/step-N.webp` (≤1600w, ≤500KB)
- `…/step-N.mp4` (4 s, muted, ≤1280w, crf 26→32, ≤1.5MB) + `step-N-poster.webp`
- `…/step-N.mp3` (12 s, 160k, 0.4 s fade in / 0.6 s out)
- 86 assets, 39 MB total as of 2026-09-14. All lazy (`data-src` / `loading=lazy`).

## Renderer
`stepMediaHtml()` in landing.html. Audio excerpt = `.m-excerpt` button; `bindExcerptPlayers()` after guide inject. One plays at a time, countdown in `.m-excerpt-time`, killed on `hashchange`. User-initiated, so it ignores the global preview-mute.
