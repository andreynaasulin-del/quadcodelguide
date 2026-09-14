---
SECTION_ID: files._temp.probe.satin-probe_mp4
TYPE: file/video
---

# Seedance provider probe — anchor frame, minimum spend

FILE: .temp/probe/satin-probe.mp4
UTILITY: seedance
DURATION: 4
ASPECT_RATIO: 16:9
RESOLUTION: 480p
SPEED_MODE: fast

PROMPT: |
  The woman stands still on the rooftop. A light breeze moves the hem of the long burgundy
  satin gown. Camera holds steady. Nothing else changes.

DESCRIPTION: Minimum-cost probe to isolate whether the fal content restriction is triggered by the anchor image or by prompt wording.

USAGE: Diagnostic only. Delete after the question is answered.

COMMENTS: ## Video Notes
- The full 13s/1080p run failed three times with "Content restriction on fal" across three
  different prompt rewrites, including a fully neutral couture-lookbook version. Identical
  error each time, so the prompt is not the variable.
- This probe keeps IMAGE-INPUT and strips the prompt to one harmless sentence. If it still
  fails, the anchor image itself is what fal rejects and the fix is a new anchor, not new
  wording.
- 4s / 480p / fast keeps the diagnostic under a dollar.
