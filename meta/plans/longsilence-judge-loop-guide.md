---
SECTION_ID: plans.longsilence-judge-loop-guide
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Guide: the judge loop that forces an agent to AAA visual quality

SOURCE: `github.com/achimala/TheLongSilence` (MIT). A browser space sim built almost
entirely by an autonomous agent over ~24 hours. Demo recording belongs to the author
and must be credited on the card and in step 1.

## Why this angle

"Build a AAA space game in Three.js" is not a repeatable guide — the payload was a
24-hour unattended run on someone else's laptop with Blender attached. What *is*
repeatable is the part that made the run converge instead of drifting: an adversarial
judge subagent plus numeric pixel evidence, so "make it look better" becomes a
pass/fail test the agent cannot argue with.

## Deliverables

- Guide record `judge-loop-aaa-web-game` in `ui_views/guides.json`, cat `Gamedev`,
  sub `Environments`, level `Senior`.
- Hero video: `ui_views/assets/judge-loop-aaa-web-game/the-long-silence-demo.mp4`
  (1224x720, 60 fps, 53 s, 9.3 MB, 1470 kbps — already under the optimizer floor,
  must not be re-encoded).
- Poster via `scripts/generate_video_posters.mjs` once the record exists.
- Interactive widget `depth-lab.html`: WebGL2, no dependencies, reproduces the
  exact artifact the source README warns about (concentric shells at planetary
  scale collapsing into triangular confetti) and fixes it with a logarithmic
  depth buffer, with live depth-resolution numbers.
- Step frames pulled from the author's own recording (no invented screenshots of
  someone else's build).

## Steps

- [x] Probe the recording, confirm no re-encode needed.
- [x] Copy the recording into the guide asset folder.
- [ ] Build and verify `depth-lab.html` in browser at 60 fps.
- [ ] Extract step frames from the recording.
- [ ] Write the record into `guides.json`, generate poster.
- [ ] Verify locally, commit, verify on production.

## Acceptance

- `node scripts/check_guides_assets.mjs` reports zero missing local references.
- Widget holds 60 fps and the depth-resolution readout matches the on-screen artifact.
- Attribution to the original author present on the guide.
