---
SECTION_ID: rules.guide-trust
TYPE: note
STATUS: locked
DATE: 2026-09-14
SCOPE: ui_views/guides.json, scripts/step_evidence*.mjs, ui_views/assets/evidence/**
---

# Guide trust policy — nothing on the site may be untrue

Written after 5 of 5 freshly-published guides were found to contain invented details
(a coffee cup that was not there, a "top bar" the UI did not have, a fashion film
described as a headphone ad). `media:check` passed on all of them. File checks do not
catch lies; only frame-by-frame reading does.

## 1. Every noun is verified against the footage
Before a guide ships or is edited, the author (human or agent) must:
1. Detect cuts: `ffmpeg -i X.mp4 -filter:v "select=gt(scene\,0.3),showinfo" -f null -`
2. Pull one frame from the **middle** of every shot (never on a cut boundary).
3. Read the sheet, then check **each** noun in title / desc / step text / captions.
4. Anything not visible in a frame is deleted or rewritten. No softening — rewriting.

Text that cannot be verified (which model ran, how many iterations) is stated as
unknown, not guessed. `meta/files/.../*_mp4.md` already carries
"exact model/run not recorded" — copy that honesty into the guide.

## 2. Step visuals: evidence only
| `result_source` | what it is | label (kicker) |
|---|---|---|
| `final` | frame / 4 s clip / 12 s audio cut from the delivered result | `Frame from the final render · 0:12` |
| *(absent)* | a real intermediate the author actually saved | `Result` or hand label |

Rules:
- A `final` frame is allowed only when it **proves the sentence next to it**
  (the label text, the forearm in frame, the black fisheye corners). A frame that
  merely "shows the video again" is noise — drop it and merge the step.
- Frames are pulled from mid-shot, ≥ 0.3 s away from any cut.
- The last step always carries the real final asset.
- **No generated illustrations.** Decided 2026-09-14: a diagram drawn by an image
  model is not evidence, and a guide site that trades on trust should not mix the
  two. If a step cannot be proven by the footage, the step is rewritten or removed.

## 3. Step ceiling: 3
One idea per step. Delivery/encoding details (fps, bitrate, resize) are a single
sentence at the end of the last step, not a step of their own. "Ship it live" steps
with no embed are deleted. Fewer, denser steps beat a long procedure nobody reads.

## 4. Evidence pipeline (unchanged)
```bash
node scripts/step_evidence.mjs --audit    # steps with no media
node scripts/step_evidence.mjs --sheet    # contact sheet per video
# edit scripts/step_evidence_plan.json → { guide: { step: { type, at, caption } } }
node scripts/step_evidence.mjs --apply [--guide id]
npm run media:check
```
Assets live in `ui_views/assets/evidence/<guide-id>/`. Details: `meta/facts/step-evidence.md`.

## 5. Model badge
`models` credits line must name a product when known. If unknown, use the craft
("AI video generation") — `creditedKind()` maps it to the project default so a
shot-list prompt is never badged as a coding model.

## 6. Definition of done for a guide
- [ ] Contact sheet read; every noun checked
- [ ] ≤ 3 steps; delivery collapsed into last step
- [ ] Each step visual is a `final` cut that proves the sentence, or nothing
- [ ] Captions rewritten against the actual asset
- [ ] `npm run media:check` clean; route `/guide/<id>` 200; badge correct
