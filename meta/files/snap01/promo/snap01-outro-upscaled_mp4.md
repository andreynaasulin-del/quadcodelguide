---
SECTION_ID: files.snap01.promo.snap01-outro-upscaled_mp4
TYPE: file/video
---

# SNAP/01 — Promo Outro (Topaz Upscale)

FILE: snap01/promo/snap01-outro-upscaled.mp4
UTILITY: topaz
VIDEO-INPUT: .temp/upload/outro_v2.mp4
MODEL: Proteus
UPSCALE_FACTOR: 2
NOISE: 0.2
COMPRESSION: 0.2
TARGET_FPS: 30
H264_OUTPUT: true
PROMPT: Upscale-only pass, no generative changes. Preserve exact framing and content of the full outro clip — only increase resolution, bring frame rate to 30fps to match the main promo cut, and clean minor compression artifacts.
USAGE: Full-length upscaled outro clip for the SNAP/01 kitchen-configurator Twitter/X promo (snap01/promo/snap01-kitchen-configurator-promo.mp4). Exact trim/placement timing to be provided separately by user and applied afterward, outside this meta section.

COMMENTS: |
  - Source clip .temp/upload/outro_v2.mp4 is 6.06s at 864x496@24fps, full
    length (NOT pre-trimmed) — user will specify exact in/out timing later,
    trimming happens as a separate trivial-video step after this upscale.
  - 2x factor brings 864x496 -> 1728x992, close to but not exactly the main
    promo's 1920x1080 — final mux step scales/pads to exact 1920x1080 to
    match, same convention used for the still-image segments in
    scripts/build_snap01_final_promo.mjs.
  - TARGET_FPS 30 matches the main promo's 30fps (source outro was 24fps).
