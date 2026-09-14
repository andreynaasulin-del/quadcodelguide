---
SECTION_ID: files.snap01.promo.snap01-promo-upscaled_mp4
TYPE: file/video
---

# SNAP/01 — Kitchen Configurator Promo (Topaz Quality/FPS Pass)

FILE: snap01/promo/snap01-promo-upscaled.mp4
UTILITY: topaz
VIDEO-INPUT: snap01/promo/snap01-kitchen-configurator-promo.mp4
MODEL: Gaia CG
UPSCALE_FACTOR: 2
NOISE: 0.2
COMPRESSION: 0.3
TARGET_FPS: 60
H264_OUTPUT: true
PROMPT: Quality and smoothness pass, no generative changes. Clean up compression/JPEG-capture artifacts from the screen-recorded widget-demo and 3D close-up segments, sharpen the GPT-Image blueprint stills, and interpolate motion to 60fps so drag-drop and orbit motion read as smooth, not choppy. Preserve exact framing, content, and the quadcode.ai branded outro unchanged.
USAGE: Full-length quality/fps upgrade pass on the complete 32.69s SNAP/01 Twitter/X promo (stills + 3D close-ups + live widget screen-capture + quadcode.ai outro), before final downscale/re-encode for web delivery.

COMMENTS: |
  - Source is the FINAL 32.693s cut (already has the quadcode.ai branded
    outro appended per scripts/append_snap01_outro.mjs) — this pass runs on
    top of that, not a separate/earlier cut.
  - Chose Gaia CG (not Proteus) because the source is a mix of: browser
    screen-capture (widget demo drag-drop + 3D inspector orbit, JPEG frames
    at capture time), a Three.js 3D close-up render, GPT-Image blueprint
    stills, and a CG-rendered brand outro — Gaia CG is the template's
    recommended model for "animation, UI capture, renders, clean edges",
    which matches all four source types better than Proteus's general
    photoreal-leaning default.
  - UPSCALE_FACTOR 2 brings 1920x1080 -> 3840x2160; final mux step
    downscales back to 1920x1080 with high-quality scaling (effectively a
    supersampled clean-up pass) and re-encodes at a bitrate sane for web
    (target ~5-6 Mbps at 1080p60, +faststart) — matches the "optimize
    encoding for web delivery" ask, not shipping a 4K file.
  - TARGET_FPS 60 (from 30) is the direct fix for the "видео лагает" /
    "smooth playback" complaint — motion-heavy segments (drag-drop, BOM
    tick-up, 3D orbit) benefit most from frame interpolation.
  - NOISE 0.2 / COMPRESSION 0.3: mild-to-moderate, matches template's "safe
    first pass" guidance (0.1-0.4) — cleans macroblocking from the
    screen-capture segments without over-smoothing the GPT-Image stills.
